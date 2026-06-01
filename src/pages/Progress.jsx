import React from 'react'
import { useNavigate } from 'react-router-dom'
import { usePeer } from '../context/PeerContext'

function formatSpeed(mbps) {
  if (mbps >= 1) return `${mbps.toFixed(1)} MB/s`
  return `${(mbps * 1024).toFixed(0)} KB/s`
}

export default function Progress() {
  const { status, progress, speed, transferredFileName, role, reset } = usePeer()
  const navigate = useNavigate()

  const isDone  = status === 'done'
  const isError = status === 'error'

  const handleDone = () => {
    reset()
    navigate('/')
  }

  return (
    <section className="py-10 flex items-center justify-center">
      <div className="w-full max-w-lg glass rounded-xl p-8 border border-white/6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              {role === 'sender' ? 'Sending' : 'Receiving'}
            </div>
            <div className="font-semibold text-lg truncate max-w-xs">
              {transferredFileName || 'file'}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold tabular-nums ${isDone ? 'text-emerald-400' : 'text-indigo-400'}`}>
              {isDone ? '100%' : `${progress}%`}
            </div>
            <div className="text-xs text-gray-500">
              {isDone ? 'Complete' : 'In progress'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-white/6 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            style={{ width: `${isDone ? 100 : progress}%` }}
          />
        </div>

        {/* Stats */}
        {!isDone && (
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-white/3 border border-white/6">
              <div className="text-xs text-gray-400 mb-1">Speed</div>
              <div className="font-mono font-medium">
                {speed > 0 ? formatSpeed(speed) : '— MB/s'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/3 border border-white/6">
              <div className="text-xs text-gray-400 mb-1">Progress</div>
              <div className="font-mono font-medium">{progress}%</div>
            </div>
          </div>
        )}

        {/* Done State */}
        {isDone && (
          <div className="mt-6 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <div className="text-emerald-400 font-semibold">Transfer Complete!</div>
            {role === 'receiver' && (
              <p className="text-sm text-gray-400">
                Your file has been downloaded automatically.
              </p>
            )}
            <button
              onClick={handleDone}
              className="btn bg-indigo-600 hover:bg-indigo-500 mx-auto"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Transferring animation */}
        {!isDone && !isError && (
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            {role === 'sender' ? 'Sending chunks…' : 'Receiving chunks…'}
          </div>
        )}
      </div>
    </section>
  )
}
