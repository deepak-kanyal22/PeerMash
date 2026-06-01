import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePeer } from '../context/PeerContext'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

export default function Receive() {
  const { status, errorMsg, pendingMeta, connectToRoom, acceptTransfer, rejectTransfer } = usePeer()
  const [inputId, setInputId] = useState('')
  const navigate = useNavigate()

  // Auto-navigate to progress once transfer starts
  useEffect(() => {
    if (status === 'transferring') navigate('/progress')
  }, [status, navigate])

  const handleConnect = () => {
    const id = inputId.trim()
    if (!id) return
    connectToRoom(id)
  }

  const statusLabel = {
    connecting: '🔗 Connecting to sender…',
    connected:  '✅ Connected! Waiting for file info…',
  }[status]

  // ── Accept / Reject prompt ──────────────────────────────────────────────────
  if (status === 'pending' && pendingMeta) {
    return (
      <section className="py-10 flex items-center justify-center">
        <div className="w-full max-w-md glass rounded-2xl p-8 border border-white/6 text-center"
          style={{ animation: 'fadeInUp 0.35s ease' }}>

          {/* Pulsing shield icon */}
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-amber-500/10 border-2 border-amber-400/40 flex items-center justify-center text-4xl"
            style={{ animation: 'pulse 2s infinite' }}>
            🛡️
          </div>

          <h3 className="text-xl font-bold text-white mb-1">Incoming File Request</h3>
          <p className="text-sm text-gray-400 mb-6">Someone wants to send you a file</p>

          {/* File info card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/4 border border-white/8 text-left mb-8">
            <div className="w-14 h-14 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl shrink-0">
              📄
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate text-base">{pendingMeta.name}</div>
              <div className="text-sm text-gray-400 mt-0.5">{formatBytes(pendingMeta.size)}</div>
              <div className="text-xs text-gray-500 mt-1">{pendingMeta.totalChunks} chunks</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={rejectTransfer}
              className="flex-1 py-3 rounded-xl font-semibold text-sm border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-400/50 transition-all duration-200"
            >
              ✕ Reject
            </button>
            <button
              onClick={acceptTransfer}
              className="flex-1 py-3 rounded-xl font-semibold text-sm border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/50 transition-all duration-200"
            >
              ✓ Accept
            </button>
          </div>

          <p className="text-xs text-gray-600 mt-4">
            Accepting will start the download automatically when complete.
          </p>
        </div>
      </section>
    )
  }

  // ── Normal connect form ─────────────────────────────────────────────────────
  return (
    <section className="py-10 flex items-center justify-center">
      <div className="w-full max-w-md glass rounded-xl p-8 text-center border border-white/6">

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl">
          📥
        </div>

        <h3 className="text-xl font-semibold">Receive File</h3>
        <p className="text-sm text-gray-400 mt-1">
          Ask the sender for their Room ID and paste it below
        </p>

        {/* Input */}
        <div className="mt-6 space-y-3">
          <input
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            placeholder="XXXX-XXXX"
            maxLength={9}
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-center font-mono text-xl tracking-widest text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />

          <button
            onClick={handleConnect}
            disabled={!inputId.trim() || status === 'connecting' || status === 'connected'}
            className="btn w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === 'connecting' || status === 'connected' ? 'Connecting…' : 'Connect & Receive'}
          </button>
        </div>

        {/* Status */}
        {statusLabel && (
          <div className="mt-4 p-3 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-sm text-indigo-300 animate-pulse">
            {statusLabel}
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            ⚠️ {errorMsg || 'Could not connect. Check the Room ID and try again.'}
          </div>
        )}

        {/* Idle hint */}
        {status === 'idle' && (
          <div className="mt-6 p-4 rounded-lg bg-white/3 border border-white/6 text-sm text-gray-400">
            <div className="text-2xl mb-1">🛡️</div>
            You will see a prompt before any file starts downloading.
          </div>
        )}
      </div>
    </section>
  )
}
