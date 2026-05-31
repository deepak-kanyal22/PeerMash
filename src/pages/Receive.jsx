import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePeer } from '../context/PeerContext'

export default function Receive() {
  const { status, errorMsg, connectToRoom } = usePeer()
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
  }[status]

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
            disabled={!inputId.trim() || status === 'connecting'}
            className="btn w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === 'connecting' ? 'Connecting…' : 'Connect & Receive'}
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
            <div className="text-2xl mb-1">⏳</div>
            The file will download automatically once connected.
          </div>
        )}
      </div>
    </section>
  )
}
