import React, { createContext, useContext, useState, useRef, useCallback } from 'react'
import Peer from 'peerjs'

const PeerContext = createContext(null)

// 64 KB chunks — small enough for data channel reliability
const CHUNK_SIZE = 64 * 1024

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

  // Throttling and rolling speed refs
  const totalBytesRef           = useRef(0)
  const lastUpdateRef           = useRef(0)
  const lastSpeedCalcTimeRef    = useRef(0)
  const lastBytesTransferredRef  = useRef(0)

  const setStatus = useCallback((newStatus) => {
    statusRef.current = newStatus
    setStatusState(newStatus)
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
    conn.send({ type: 'meta', name: file.name, size: file.size, totalChunks })
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

      reader.onload = (e) => {
        // Double check connection still open before sending
        if (statusRef.current === 'cancelled' || statusRef.current === 'error' || !connRef.current) {
          return
        }

        try {
          conn.send({ type: 'chunk', index: chunkIndex, data: e.target.result })
        } catch (err) {
          setErrorMsg(err.message || 'Failed to send chunk.')
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

    const peer = new Peer(id)
    peerRef.current = peer

    peer.on('connection', (conn) => {
      connRef.current = conn
      setStatus('connecting')

      conn.on('open', () => {
        // Send file metadata — receiver will decide to accept or reject
        sendMetaOverConn(conn)
      })

      conn.on('data', (msg) => {
        if (msg.type === 'accepted') {
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
    chunksRef.current        = []
    bytesReceivedRef.current = 0

    const peer = new Peer()
    peerRef.current = peer

    peer.on('open', () => {
      const conn = peer.connect(targetId.trim().toUpperCase(), { reliable: true })
      connRef.current = conn

      conn.on('open', () => {
        setStatus('connected')
      })

      conn.on('data', (msg) => {
        if (msg.type === 'meta') {
          fileNameRef.current      = msg.name
          totalChunksRef.current   = msg.totalChunks
          totalBytesRef.current    = msg.size
          chunksRef.current        = new Array(msg.totalChunks)
          bytesReceivedRef.current = 0
          setPendingMeta({ name: msg.name, size: msg.size, totalChunks: msg.totalChunks })
          setStatus('pending')

        } else if (msg.type === 'chunk') {
          if (statusRef.current !== 'transferring') {
            setStatus('transferring')
            startTimeRef.current = Date.now()
            lastUpdateRef.current = Date.now()
            lastSpeedCalcTimeRef.current = Date.now()
            lastBytesTransferredRef.current = 0
          }

          chunksRef.current[msg.index]  = msg.data
          bytesReceivedRef.current      += msg.data.byteLength

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
  const acceptTransfer = useCallback(() => {
    if (!connRef.current) return
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
    setErrorMsg('')
    setPendingMeta(null)
    connRef.current          = null
    chunksRef.current        = []
    bytesReceivedRef.current = 0
  }, [])

  return (
    <PeerContext.Provider value={{
      roomId, status, progress, speed,
      selectedFile, transferredFileName, pendingMeta, role, errorMsg,
      setSelectedFile, generateRoom, connectToRoom, acceptTransfer, rejectTransfer, cancelTransfer, reset,
    }}>
      {children}
    </PeerContext.Provider>
  )
}

export const usePeer = () => useContext(PeerContext)
