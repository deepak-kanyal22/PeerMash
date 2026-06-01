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
  const [status, setStatus]                   = useState('idle')
  // idle | waiting | connecting | transferring | done | error
  const [progress, setProgress]               = useState(0)
  const [speed, setSpeed]                     = useState(0)
  const [selectedFile, setSelectedFileState]  = useState(null)
  const [transferredFileName, setTransferredFileName] = useState('')
  const [role, setRole]                       = useState(null) // 'sender' | 'receiver'
  const [errorMsg, setErrorMsg]               = useState('')

  // Refs — safe to read inside async callbacks without stale closure issues
  const peerRef           = useRef(null)
  const fileRef           = useRef(null)
  const fileNameRef       = useRef('')
  const startTimeRef      = useRef(null)
  const chunksRef         = useRef([])
  const totalChunksRef    = useRef(0)
  const bytesReceivedRef  = useRef(0)

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

  /** Read + send file in 64 KB chunks over an open DataConnection */
  const sendFileOverConn = useCallback((conn) => {
    const file = fileRef.current
    if (!file) {
      setErrorMsg('No file selected. Please pick a file before generating a room.')
      setStatus('error')
      return
    }

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    startTimeRef.current = Date.now()
    let chunkIndex = 0

    setTransferredFileName(file.name)

    // 1. Send metadata so receiver knows filename, size, chunk count
    conn.send({ type: 'meta', name: file.name, size: file.size, totalChunks })

    const sendNext = () => {
      if (chunkIndex >= totalChunks) {
        conn.send({ type: 'done' })
        setStatus('done')
        return
      }

      const offset = chunkIndex * CHUNK_SIZE
      const slice  = file.slice(offset, offset + CHUNK_SIZE)
      const reader = new FileReader()

      reader.onload = (e) => {
        conn.send({ type: 'chunk', index: chunkIndex, data: e.target.result })
        chunkIndex++

        // Update progress & speed
        const pct     = Math.round((chunkIndex / totalChunks) * 100)
        const elapsed = (Date.now() - startTimeRef.current) / 1000 || 0.001
        const bytesSent = Math.min(chunkIndex * CHUNK_SIZE, file.size)
        const spd     = (bytesSent / elapsed / 1024 / 1024).toFixed(2)

        setProgress(pct)
        setSpeed(parseFloat(spd))

        // Yield to event loop so the UI stays responsive
        setTimeout(sendNext, 0)
      }

      reader.readAsArrayBuffer(slice)
    }

    sendNext()
  }, [])

  // ─── PUBLIC API ───────────────────────────────────────────────────────────

  /**
   * SENDER — Create a Peer with the generated Room ID and wait for receiver
   * to connect; once connected, start sending the file automatically.
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
      setStatus('connecting')
      conn.on('open', () => {
        setStatus('transferring')
        sendFileOverConn(conn)
      })
      conn.on('error', (err) => {
        setErrorMsg(err.message)
        setStatus('error')
      })
    })

    peer.on('error', (err) => {
      setErrorMsg(err.message)
      setStatus('error')
    })
  }, [sendFileOverConn])

  /**
   * RECEIVER — Connect to a sender's Room ID, receive chunks, reassemble
   * the file, and trigger a browser download when complete.
   */
  const connectToRoom = useCallback((targetId) => {
    destroyPeer()
    setStatus('connecting')
    setProgress(0)
    setSpeed(0)
    setErrorMsg('')
    setRole('receiver')
    chunksRef.current       = []
    bytesReceivedRef.current = 0

    const peer = new Peer()
    peerRef.current = peer

    peer.on('open', () => {
      const conn = peer.connect(targetId.trim().toUpperCase(), { reliable: true })

      conn.on('open', () => {
        setStatus('transferring')
        startTimeRef.current = Date.now()
      })

      conn.on('data', (msg) => {
        if (msg.type === 'meta') {
          fileNameRef.current      = msg.name
          setTransferredFileName(msg.name)
          totalChunksRef.current  = msg.totalChunks
          chunksRef.current       = new Array(msg.totalChunks)
          bytesReceivedRef.current = 0

        } else if (msg.type === 'chunk') {
          chunksRef.current[msg.index]  = msg.data
          bytesReceivedRef.current      += msg.data.byteLength

          const received = msg.index + 1
          const pct      = Math.round((received / totalChunksRef.current) * 100)
          const elapsed  = (Date.now() - startTimeRef.current) / 1000 || 0.001
          const spd      = (bytesReceivedRef.current / elapsed / 1024 / 1024).toFixed(2)

          setProgress(pct)
          setSpeed(parseFloat(spd))

        } else if (msg.type === 'done') {
          // Reassemble all chunks → Blob → auto-download
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
        }
      })

      conn.on('error', (err) => {
        setErrorMsg(err.message)
        setStatus('error')
      })
    })

    peer.on('error', (err) => {
      setErrorMsg(err.message)
      setStatus('error')
    })
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
    chunksRef.current        = []
    bytesReceivedRef.current = 0
  }, [])

  return (
    <PeerContext.Provider value={{
      roomId, status, progress, speed,
      selectedFile, transferredFileName, role, errorMsg,
      setSelectedFile, generateRoom, connectToRoom, reset,
    }}>
      {children}
    </PeerContext.Provider>
  )
}

export const usePeer = () => useContext(PeerContext)
