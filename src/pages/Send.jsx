import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePeer } from '../context/PeerContext'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

export default function Send() {
  const { selectedFile, setSelectedFile, roomId, status, errorMsg, generateRoom } = usePeer()
  const navigate  = useNavigate()
  const inputRef  = useRef(null)
  const dropRef   = useRef(null)

  // Auto-navigate to progress once transfer starts
  useEffect(() => {
    if (status === 'transferring') navigate('/progress')
  }, [status, navigate])

  const handleFile = (file) => {
    if (file) setSelectedFile(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    dropRef.current.classList.remove('border-indigo-500', 'bg-indigo-600/5')
    handleFile(e.dataTransfer.files[0])
  }

  const onDragOver = (e) => {
    e.preventDefault()
    dropRef.current.classList.add('border-indigo-500', 'bg-indigo-600/5')
  }

  const onDragLeave = () => {
    dropRef.current.classList.remove('border-indigo-500', 'bg-indigo-600/5')
  }

  const copyRoom = () => {
    navigator.clipboard.writeText(roomId)
  }

  const statusLabel = {
    idle:        null,
    waiting:     '⏳ Waiting for receiver to connect…',
    connecting:  '🔗 Receiver found — establishing connection…',
    error:       null,
  }[status]

  return (
    <section className="py-10 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Send File</h2>

      <div className="glass p-8 rounded-xl border border-white/6 space-y-6">

        {/* ── Drop Zone ── */}
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current.click()}
          className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center cursor-pointer transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-600/5"
        >
          <div className="text-5xl mb-3">📁</div>
          <div className="text-lg font-medium">Drag &amp; drop your file here</div>
          <div className="text-sm text-gray-400 mt-1">or click to browse</div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {/* ── Selected File Card ── */}
        {selectedFile && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-white/4 border border-white/6">
            <div className="w-11 h-11 rounded-lg bg-indigo-600 flex items-center justify-center text-xl shrink-0">
              📄
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{selectedFile.name}</div>
              <div className="text-sm text-gray-400">{formatBytes(selectedFile.size)}</div>
            </div>
            <div className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              Ready
            </div>
          </div>
        )}

        {/* ── Room ID + Generate ── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 p-4 rounded-lg bg-white/3 border border-white/6">
            <div className="text-xs text-gray-400 mb-1">Room ID</div>
            <div className="font-mono text-lg tracking-widest">
              {roomId || '— — — —'}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={generateRoom}
              disabled={!selectedFile || status === 'waiting' || status === 'connecting'}
              className="btn bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === 'waiting' || status === 'connecting' ? 'Waiting…' : 'Generate Room'}
            </button>

            {roomId && (
              <button
                onClick={copyRoom}
                className="btn bg-white/6 hover:bg-white/10 text-sm"
              >
                Copy ID
              </button>
            )}
          </div>
        </div>

        {/* ── Status Banner ── */}
        {statusLabel && (
          <div className="p-3 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-sm text-indigo-300 text-center animate-pulse">
            {statusLabel}
          </div>
        )}

        {/* ── Error Banner ── */}
        {status === 'error' && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── Help tip ── */}
        {!selectedFile && (
          <p className="text-center text-xs text-gray-500">
            Select a file first, then generate a Room ID to share with the receiver.
          </p>
        )}
      </div>
    </section>
  )
}
