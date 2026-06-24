import React, { createContext, useContext, useState, useRef, useCallback } from 'react'
import Peer from 'peerjs'
import { generateKeyPair, exportPublicKey, importPublicKey, deriveSharedKey, encryptData, decryptData, decryptText, derivePassphraseKey, mixPassphraseIntoKey } from '../crypto/e2ee'

const PeerContext = createContext(null)

// 64 KB chunks — small enough for data channel reliability
const CHUNK_SIZE = 64 * 1024

function notifyTransferComplete(fileName, role) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    new Notification('PeerMesh Transfer Complete', {
      body: role === 'sender'
        ? `"${fileName}" has been sent successfully.`
        : `"${fileName}" has been received.`,
      icon: '/icons/icon-192.svg',
    })
  }
}

// ─── SIGNALING SERVER CONFIG ─────────────────────────────────────────────────
// Reads from .env (VITE_PEER_HOST / VITE_PEER_PORT / VITE_PEER_PATH).
// Falls back to the public PeerJS cloud server if env vars are not set.
const PEER_SERVER = import.meta.env.VITE_PEER_HOST
  ? {
      host  : import.meta.env.VITE_PEER_HOST,
      port  : Number(import.meta.env.VITE_PEER_PORT) || 9000,
      path  : import.meta.env.VITE_PEER_PATH  || '/peerjs',
      secure: import.meta.env.VITE_PEER_SECURE === 'true', // set to 'true' for HTTPS/WSS in prod
    }
  : undefined // undefined = default PeerJS cloud server

// Generate a readable XXXX-XXXX style Room ID
function makeRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) s += '-'
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

export function PeerProvider({ children }) {
  const [roomId, setRoomId]                   = useState('')
  const [status, setStatusState]              = useState('idle')
  // idle | waiting | connecting | pending | transferring | done | error | cancelled
  const [progress, setProgress]               = useState(0)
  const [speed, setSpeed]                     = useState(0)
  const [selectedFile, setSelectedFileState]  = useState(null)
  const [transferredFileName, setTransferredFileName] = useState('')
  const [pendingMeta, setPendingMeta]         = useState(null) // { name, size, totalChunks }
  const [role, setRole]                       = useState(null) // 'sender' | 'receiver'
  const [errorMsg, setErrorMsg]               = useState('')
  const [e2eeReady, setE2eeReady]             = useState(false)

  // ─── PASSWORD PROTECTION ────────────────────────────────────────────────────
  const [passphrase, setPassphraseState]      = useState('')
  const passphraseRef = useRef('')   // mirror for use in async callbacks
  const saltRef       = useRef(null) // 16-byte random salt array for PBKDF2

  // ─── CHAT STATE ────────────────────────────────────────────────────────────
  const [messages, setMessages]   = useState([])   // [{ from, text, ts }]
  const [chatReady, setChatReady] = useState(false)
  const chatConnRef               = useRef(null)    // dedicated chat data channel
  const roleRef                   = useRef(null)    // mirror of role for use in callbacks

  // Refs — safe to read inside async callbacks without stale closure issues
  const statusRef         = useRef('idle')
  const peerRef           = useRef(null)
  const fileRef           = useRef(null)
  const fileNameRef       = useRef('')
  const startTimeRef      = useRef(null)
  const chunksRef         = useRef([])
  const totalChunksRef    = useRef(0)
  const bytesReceivedRef  = useRef(0)
  const connRef           = useRef(null) // keep conn alive for accept/reject
  const myKeyPairRef      = useRef(null)
  const sharedKeyRef      = useRef(null)

  // Throttling and rolling speed refs
  const totalBytesRef           = useRef(0)
  const lastUpdateRef           = useRef(0)
  const lastSpeedCalcTimeRef    = useRef(0)
  const lastBytesTransferredRef  = useRef(0)

  // ─── CHAT HELPERS ──────────────────────────────────────────────────────────
  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, { from: msg.from, text: msg.text, ts: msg.ts }])
  }, [])

  const sendMessage = useCallback(async (text) => {
    if (!chatConnRef.current || !text.trim() || !sharedKeyRef.current) return
    try {
      const { ciphertext, iv } = await encryptData(sharedKeyRef.current, text.trim())
      const msg = { type: 'chat', ciphertext, iv, from: roleRef.current, ts: Date.now() }
      chatConnRef.current.send(msg)
      // Also add to own messages list
      setMessages(prev => [...prev, { from: msg.from, text: text.trim(), ts: msg.ts }])
    } catch (err) {
      console.warn('Chat send failed:', err)
    }
  }, [])

  const wireUpChatConn = useCallback((chatConn) => {
    chatConnRef.current = chatConn
    chatConn.on('open', () => setChatReady(true))
    chatConn.on('data', async (msg) => {
      if (msg?.type === 'chat' && sharedKeyRef.current) {
        try {
          const decryptedText = await decryptText(sharedKeyRef.current, msg.ciphertext, msg.iv)
          addMessage({ ...msg, text: decryptedText })
        } catch (e) {
          console.error('Failed to decrypt chat message:', e)
        }
      }
    })
    chatConn.on('close', () => setChatReady(false))
    chatConn.on('error', () => setChatReady(false))
  }, [addMessage])

  const setStatus = useCallback((newStatus) => {
    statusRef.current = newStatus
    setStatusState(newStatus)
  }, [])

  /** Keep passphraseRef in sync so async callbacks always see the latest value */
  const setPassphrase = useCallback((p) => {
    passphraseRef.current = p.trim()
    setPassphraseState(p)
  }, [])

  /** Keep ref and state in sync so callbacks always see the latest file */
  const setSelectedFile = useCallback((file) => {
    fileRef.current = file
    setSelectedFileState(file)
  }, [])

  const destroyPeer = () => {
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }
  }

  // ─── SENDER HELPERS ───────────────────────────────────────────────────────

  /** Send only metadata first — wait for receiver to accept before streaming chunks */
  const sendMetaOverConn = useCallback((conn) => {
    const file = fileRef.current
    if (!file) {
      setErrorMsg('No file selected. Please pick a file before generating a room.')
      setStatus('error')
      return
    }

    setTransferredFileName(file.name)
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    // Send metadata — receiver will show Accept/Reject prompt
    conn.send({
      type: 'meta',
      name: file.name,
      size: file.size,
      totalChunks,
      hasPassword: !!passphraseRef.current,
      salt: saltRef.current,
    })
    setStatus('awaiting_approval')
  }, [])

  /** Stream file chunks once receiver has accepted */
  const sendChunksOverConn = useCallback((conn) => {
    const file = fileRef.current
    if (!file) return

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    startTimeRef.current = Date.now()
    lastUpdateRef.current = Date.now()
    lastSpeedCalcTimeRef.current = Date.now()
    lastBytesTransferredRef.current = 0
    let chunkIndex = 0

    const sendNext = () => {
      // Check if connection is closed or cancelled
      if (statusRef.current === 'cancelled' || statusRef.current === 'error' || !connRef.current) {
        return
      }

      if (chunkIndex >= totalChunks) {
        try {
          conn.send({ type: 'done' })
          setStatus('done')
          notifyTransferComplete(fileNameRef.current, 'sender')
        } catch (_) {}
        return
      }

      // Check if dataChannel buffer is full (Backpressure handling)
      const dc = conn.dataChannel || conn._dc
      if (dc && dc.bufferedAmount > 1024 * 1024) { // 1 MB buffer threshold
        setTimeout(sendNext, 50)
        return
      }

      const offset = chunkIndex * CHUNK_SIZE
      const slice  = file.slice(offset, offset + CHUNK_SIZE)
      const reader = new FileReader()

      reader.onload = async (e) => {
        // Double check connection still open before sending
        if (statusRef.current === 'cancelled' || statusRef.current === 'error' || !connRef.current) {
          return
        }

        try {
          const { ciphertext, iv } = await encryptData(sharedKeyRef.current, e.target.result)
          conn.send({ type: 'chunk', index: chunkIndex, data: ciphertext, iv })
        } catch (err) {
          setErrorMsg(err.message || 'Failed to encrypt/send chunk.')
          setStatus('error')
          return
        }

        chunkIndex++

        const pct       = Math.min(100, Math.round((chunkIndex / totalChunks) * 100))
        const bytesSent = Math.min(chunkIndex * CHUNK_SIZE, file.size)
        const now       = Date.now()
        const isLast    = chunkIndex >= totalChunks

        // Throttled UI State Dispatch
        if (isLast || now - lastUpdateRef.current >= 500) {
          const elapsed = (now - lastSpeedCalcTimeRef.current) / 1000 || 0.001
          const bytesDiff = bytesSent - lastBytesTransferredRef.current
          const spd = Math.max(0, bytesDiff / elapsed / 1024 / 1024) // MB/s

          setProgress(pct)
          setSpeed(parseFloat(spd.toFixed(2)))

          lastUpdateRef.current = now
          lastSpeedCalcTimeRef.current = now
          lastBytesTransferredRef.current = bytesSent
        }

        // Yield execution to prevent UI lockup
        setTimeout(sendNext, 0)
      }

      reader.readAsArrayBuffer(slice)
    }

    sendNext()
  }, [])

  // ─── PUBLIC API ───────────────────────────────────────────────────────────

  /**
   * SENDER — Create a Peer with the generated Room ID and wait for receiver
   * to connect; send metadata, then wait for Accept/Reject from receiver.
   */
  const generateRoom = useCallback(() => {
    destroyPeer()
    const id = makeRoomId()
    setRoomId(id)
    setStatus('waiting')
    setProgress(0)
    setSpeed(0)
    setErrorMsg('')
    setRole('sender')
    roleRef.current = 'sender'
    setMessages([])
    setChatReady(false)

    // Request notification permission for transfer complete alerts
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Generate a fresh 16-byte salt each time we create a password-protected room
    saltRef.current = passphraseRef.current
      ? Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
      : null

    const peer = new Peer(id, PEER_SERVER)
    peerRef.current = peer

    peer.on('connection', (conn) => {
      // Distinguish the chat channel from the file channel by label
      if (conn.label === 'chat') {
        wireUpChatConn(conn)
        return
      }

      // ── File channel (existing logic) ──────────────────────────────────────
      connRef.current = conn
      setStatus('connecting')

      conn.on('open', async () => {
        try {
          const keyPair = await generateKeyPair()
          myKeyPairRef.current = keyPair
          const pubKeyBytes = await exportPublicKey(keyPair.publicKey)
          conn.send({ type: 'pubkey', key: pubKeyBytes })
        } catch (e) {
          setErrorMsg('Key generation failed.')
          setStatus('error')
        }
      })

      conn.on('data', async (msg) => {
        if (msg.type === 'pubkey') {
          try {
            const theirPub = await importPublicKey(msg.key)
            let derivedKey = await deriveSharedKey(myKeyPairRef.current.privateKey, theirPub)

            // Sender: mix PBKDF2 key into ECDH key if room is password-protected
            if (passphraseRef.current && saltRef.current) {
              const pbkdf2Bits = await derivePassphraseKey(passphraseRef.current, saltRef.current)
              derivedKey = await mixPassphraseIntoKey(derivedKey, pbkdf2Bits)
            }

            sharedKeyRef.current = derivedKey
            setE2eeReady(true)
            sendMetaOverConn(conn) // Trigger meta send AFTER key exchange
          } catch (e) {
            setErrorMsg('Key exchange failed.')
            setStatus('error')
          }
        } else if (msg.type === 'accepted') {
          setStatus('transferring')
          sendChunksOverConn(conn)
        } else if (msg.type === 'rejected') {
          setErrorMsg('Transfer Rejected')
          destroyPeer()
          setStatus('cancelled')
        } else if (msg.type === 'cancelled') {
          setErrorMsg('Transfer Cancelled')
          destroyPeer()
          setStatus('cancelled')
        }
      })

      conn.on('close', () => {
        if (connRef.current === conn) {
          connRef.current = null
        }
        if (statusRef.current !== 'done' && statusRef.current !== 'cancelled') {
          setErrorMsg('Connection lost.')
          setStatus('error')
        }
      })

      conn.on('error', (err) => {
        setErrorMsg(err.message || 'Connection error occurred.')
        setStatus('error')
      })
    })

    peer.on('error', (err) => {
      setErrorMsg(err.message || 'Peer initialization error.')
      setStatus('error')
    })
  }, [sendMetaOverConn, sendChunksOverConn])

  /**
   * RECEIVER — Connect to a sender's Room ID. When the sender's metadata
   * arrives, we pause at 'pending' status and wait for user to accept/reject.
   */
  const connectToRoom = useCallback((targetId) => {
    destroyPeer()
    setStatus('connecting')
    setProgress(0)
    setSpeed(0)
    setErrorMsg('')
    setPendingMeta(null)
    setRole('receiver')
    roleRef.current = 'receiver'
    setMessages([])
    setChatReady(false)
    chunksRef.current        = []
    bytesReceivedRef.current = 0

    // Request notification permission for transfer complete alerts
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const peer = new Peer(undefined, PEER_SERVER)
    peerRef.current = peer

    peer.on('open', () => {
      const cleanId = targetId.trim().toUpperCase()
      const conn = peer.connect(cleanId, { reliable: true })
      connRef.current = conn

      // Open dedicated chat channel immediately alongside the file channel
      const chatConn = peer.connect(cleanId, { reliable: true, label: 'chat' })
      wireUpChatConn(chatConn)

      conn.on('open', async () => {
        setStatus('connected')
        try {
          const keyPair = await generateKeyPair()
          myKeyPairRef.current = keyPair
          const pubKeyBytes = await exportPublicKey(keyPair.publicKey)
          conn.send({ type: 'pubkey', key: pubKeyBytes })
        } catch (e) {
          setErrorMsg('Key generation failed.')
          setStatus('error')
        }
      })

      conn.on('data', async (msg) => {
        if (msg.type === 'pubkey') {
          try {
            const theirPub = await importPublicKey(msg.key)
            sharedKeyRef.current = await deriveSharedKey(myKeyPairRef.current.privateKey, theirPub)
            setE2eeReady(true)
          } catch (e) {
            setErrorMsg('Key exchange failed.')
            setStatus('error')
          }
        } else if (msg.type === 'meta') {
          fileNameRef.current      = msg.name
          totalChunksRef.current   = msg.totalChunks
          totalBytesRef.current    = msg.size
          chunksRef.current        = new Array(msg.totalChunks)
          bytesReceivedRef.current = 0
          saltRef.current          = msg.salt || null  // stored for use in acceptTransfer
          setPendingMeta({ name: msg.name, size: msg.size, totalChunks: msg.totalChunks, hasPassword: !!msg.hasPassword, salt: msg.salt })
          setStatus('pending')

        } else if (msg.type === 'chunk') {
          if (statusRef.current !== 'transferring') {
            setStatus('transferring')
            startTimeRef.current = Date.now()
            lastUpdateRef.current = Date.now()
            lastSpeedCalcTimeRef.current = Date.now()
            lastBytesTransferredRef.current = 0
          }

          try {
            const decrypted = await decryptData(sharedKeyRef.current, msg.data, msg.iv)
            chunksRef.current[msg.index]  = decrypted
            bytesReceivedRef.current      += decrypted.byteLength
          } catch (e) {
            console.error('Decryption failed for chunk', msg.index, e)
            // Likely wrong passphrase — surface a clear error on the first chunk
            if (msg.index === 0) {
              setErrorMsg('Decryption failed — wrong passphrase or data corruption.')
              setStatus('error')
            }
            return
          }

          const received = msg.index + 1
          const pct      = Math.min(100, Math.round((bytesReceivedRef.current / totalBytesRef.current) * 100))
          const now      = Date.now()
          const isLast   = received >= totalChunksRef.current

          if (isLast || now - lastUpdateRef.current >= 500) {
            const elapsed = (now - lastSpeedCalcTimeRef.current) / 1000 || 0.001
            const bytesDiff = bytesReceivedRef.current - lastBytesTransferredRef.current
            const spd = Math.max(0, bytesDiff / elapsed / 1024 / 1024)

            setProgress(pct)
            setSpeed(parseFloat(spd.toFixed(2)))

            lastUpdateRef.current = now
            lastSpeedCalcTimeRef.current = now
            lastBytesTransferredRef.current = bytesReceivedRef.current
          }

        } else if (msg.type === 'done') {
          const blob = new Blob(chunksRef.current)
          const url  = URL.createObjectURL(blob)
          const a    = document.createElement('a')
          a.href     = url
          a.download = fileNameRef.current
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          setStatus('done')
          notifyTransferComplete(fileNameRef.current, 'receiver')

        } else if (msg.type === 'cancelled') {
          setErrorMsg('Transfer Cancelled')
          destroyPeer()
          setStatus('cancelled')
        }
      })

      conn.on('close', () => {
        if (connRef.current === conn) {
          connRef.current = null
        }
        if (statusRef.current !== 'done' && statusRef.current !== 'cancelled') {
          setErrorMsg('Connection lost.')
          setStatus('error')
        }
      })

      conn.on('error', (err) => {
        setErrorMsg(err.message || 'Connection error occurred.')
        setStatus('error')
      })
    })

    peer.on('error', (err) => {
      setErrorMsg(err.message || 'Peer connection error.')
      setStatus('error')
    })
  }, [])

  /**
   * RECEIVER — Accept the pending transfer. Notifies sender and starts receiving.
   */
  const acceptTransfer = useCallback(async (enteredPassphrase = '') => {
    if (!connRef.current) return

    // Receiver: mix PBKDF2 key into ECDH shared key if the room is password-protected
    if (enteredPassphrase && saltRef.current && sharedKeyRef.current) {
      try {
        const pbkdf2Bits = await derivePassphraseKey(enteredPassphrase.trim(), saltRef.current)
        sharedKeyRef.current = await mixPassphraseIntoKey(sharedKeyRef.current, pbkdf2Bits)
      } catch (e) {
        setErrorMsg('Passphrase key derivation failed.')
        setStatus('error')
        return
      }
    }

    connRef.current.send({ type: 'accepted' })
    setTransferredFileName(fileNameRef.current)
    startTimeRef.current = Date.now()
    lastUpdateRef.current = Date.now()
    lastSpeedCalcTimeRef.current = Date.now()
    lastBytesTransferredRef.current = 0
    setPendingMeta(null)
    setStatus('transferring')
  }, [])

  /**
   * RECEIVER — Reject the pending transfer. Notifies sender and resets.
   */
  const rejectTransfer = useCallback(() => {
    if (connRef.current) {
      try { connRef.current.send({ type: 'rejected' }) } catch (_) {}
      connRef.current.close()
      connRef.current = null
    }
    destroyPeer()
    setPendingMeta(null)
    setStatus('idle')
    setProgress(0)
    setErrorMsg('')
  }, [])

  /**
   * Either side — Cancel an in-progress transfer, notify the other peer,
   * and reset back to idle.
   */
  const cancelTransfer = useCallback(() => {
    if (connRef.current) {
      try { connRef.current.send({ type: 'cancelled' }) } catch (_) {}
      connRef.current.close()
      connRef.current = null
    }
    destroyPeer()
    setErrorMsg('Transfer Cancelled')
    setStatus('cancelled')
  }, [])

  /** Reset everything back to idle */
  const reset = useCallback(() => {
    destroyPeer()
    setRoomId('')
    setStatus('idle')
    setProgress(0)
    setSpeed(0)
    setSelectedFileState(null)
    fileRef.current = null
    setTransferredFileName('')
    setRole(null)
    roleRef.current = null
    setErrorMsg('')
    setPendingMeta(null)
    connRef.current          = null
    chatConnRef.current      = null
    chunksRef.current        = []
    bytesReceivedRef.current = 0
    setMessages([])
    setChatReady(false)
    setE2eeReady(false)
    myKeyPairRef.current     = null
    sharedKeyRef.current     = null
    passphraseRef.current    = ''
    saltRef.current          = null
    setPassphraseState('')
  }, [])

  return (
    <PeerContext.Provider value={{
      roomId, status, progress, speed,
      selectedFile, transferredFileName, pendingMeta, role, errorMsg,
      messages, chatReady, e2eeReady, sendMessage,
      passphrase, setPassphrase,
      setSelectedFile, generateRoom, connectToRoom, acceptTransfer, rejectTransfer, cancelTransfer, reset,
    }}>
      {children}
    </PeerContext.Provider>
  )
}

export const usePeer = () => useContext(PeerContext)
