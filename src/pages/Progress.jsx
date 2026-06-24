import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, BarChart2, CheckCircle, XCircle, RefreshCw, Lock } from 'lucide-react'
import { usePeer } from '../context/PeerContext'
import ChatPanel from '../components/ChatPanel'

function formatSpeed(mbps) {
  if (mbps >= 1) return `${mbps.toFixed(1)} MB/s`
  return `${(mbps * 1024).toFixed(0)} KB/s`
}

function getFileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase()
  const map = { pdf: '📄', zip: '🗜️', rar: '🗜️', mp4: '🎬', mov: '🎬', mp3: '🎵', wav: '🎵',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', doc: '📝', docx: '📝',
    xls: '📊', xlsx: '📊', ppt: '📊', pptx: '📊', js: '💻', ts: '💻', py: '💻', txt: '📃' }
  return map[ext] || '📦'
}

export default function Progress() {
  const {
    status, progress, speed, transferredFileName, role, errorMsg,
    cancelTransfer, reset, e2eeReady
  } = usePeer()
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)

  const isDone         = status === 'done'
  const isError        = status === 'error'
  const isCancelled    = status === 'cancelled'
  const isTransferring = status === 'transferring'
  const isConnecting   = status === 'connecting' || status === 'waiting' || status === 'connected' || status === 'awaiting_approval' || status === 'pending'
  const showChat       = !isError && !isCancelled

  const handleDone = () => { reset(); navigate('/') }
  const handleCancel = () => { cancelTransfer(); navigate(role === 'sender' ? '/send' : '/receive') }

  const progressColor = isDone
    ? 'var(--lime)'
    : isError || isCancelled
      ? '#ef4444'
      : 'var(--cyan)'

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="py-10 flex items-start justify-center min-h-[70vh]"
    >
      <div className="w-full max-w-lg space-y-4">

        {/* ── Main Card ─────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'var(--glass)',
            backdropFilter: 'blur(24px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Neon top line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: isDone
                ? 'linear-gradient(90deg, transparent, rgba(57,255,20,0.6), transparent)'
                : isError || isCancelled
                  ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(0,229,255,0.5), rgba(123,47,255,0.4), transparent)',
            }}
          />

          {/* ── Header ──────────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3 min-w-0">
              {/* File icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(123,47,255,0.1))',
                  border: '1px solid rgba(0,229,255,0.15)',
                }}
              >
                {getFileIcon(transferredFileName)}
              </div>

              <div className="min-w-0">
                <div
                  className={`text-[9px] font-semibold mb-0.5 ${role === 'sender' ? 'text-cyan-400' : 'text-indigo-400'}`}
                  style={{
                    fontFamily: 'var(--ff-mono)',
                    letterSpacing: '0.15em',
                  }}
                >
                  {role === 'sender' ? '↑ SENDING' : '↓ RECEIVING'}
                </div>
                <div
                  className="font-semibold text-white truncate max-w-[200px]"
                  style={{ fontFamily: 'var(--ff-head)', fontSize: '0.9rem' }}
                  title={transferredFileName}
                >
                  {transferredFileName || 'Waiting for file…'}
                </div>
              </div>
            </div>

            {/* Right side: progress % + chat btn */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {e2eeReady && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                  title="Connection is End-to-End Encrypted"
                >
                  <Lock size={12} className="text-emerald-400" />
                  <span className="text-emerald-400" style={{ fontFamily: 'var(--ff-mono)', fontSize: '10px', fontWeight: 600 }}>
                    E2EE
                  </span>
                </motion.div>
              )}
              {showChat && (
                <ChatPanel isOpen={chatOpen} onToggle={() => setChatOpen(o => !o)} />
              )}
              <div className="text-right">
                <div
                  className="text-3xl font-extrabold tabular-nums leading-none"
                  style={{
                    fontFamily: 'var(--ff-mono)',
                    color: progressColor,
                    textShadow: `0 0 20px ${progressColor}40`,
                  }}
                >
                  {isDone ? '100%' : `${progress}%`}
                </div>
                <div
                  className="text-[9px] mt-1"
                  style={{
                    fontFamily: 'var(--ff-mono)',
                    letterSpacing: '0.12em',
                    color: isDone ? 'var(--lime)' : isError || isCancelled ? '#ef4444' : 'var(--text-muted)',
                  }}
                >
                  {isDone ? 'COMPLETE' : isError ? 'ABORTED' : isCancelled ? 'CANCELLED' : 'IN PROGRESS'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Progress Bar ────────────────────────────────────── */}
          <div
            className="w-full h-2.5 rounded-full overflow-hidden mb-1"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: isDone
                  ? 'linear-gradient(90deg, #10b981, var(--lime))'
                  : isError || isCancelled
                    ? 'linear-gradient(90deg, #ef4444, #f87171)'
                    : 'linear-gradient(90deg, var(--violet), var(--cyan))',
                backgroundSize: isTransferring ? '200% 100%' : '100% 100%',
                boxShadow: `0 0 12px ${progressColor}50`,
              }}
              animate={{ width: `${isDone ? 100 : progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Shimmer overlay on active transfer */}
          {isTransferring && (
            <div
              className="w-full h-2.5 rounded-full -mt-3.5 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
              }}
            />
          )}

          {/* ── Stats Row (during transfer) ──────────────────────── */}
          {isTransferring && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3 mt-5"
            >
              <div
                className="rounded-xl p-3.5"
                style={{
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.12)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap size={10} className="text-indigo-400" />
                  <span
                    className="text-[9px]"
                    style={{ fontFamily: 'var(--ff-mono)', letterSpacing: '0.12em', color: 'var(--text-muted)' }}
                  >
                    SPEED
                  </span>
                </div>
                <div
                  className="font-bold text-white text-base"
                  style={{ fontFamily: 'var(--ff-mono)' }}
                >
                  {speed > 0 ? formatSpeed(speed) : <span className="text-gray-600">— MB/s</span>}
                </div>
              </div>

              <div
                className="rounded-xl p-3.5"
                style={{
                  background: 'rgba(99,102,241,0.04)',
                  border: '1px solid rgba(99,102,241,0.1)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart2 size={10} className="text-indigo-400" />
                  <span
                    className="text-[9px]"
                    style={{ fontFamily: 'var(--ff-mono)', letterSpacing: '0.12em', color: 'var(--text-muted)' }}
                  >
                    PROGRESS
                  </span>
                </div>
                <div
                  className="font-bold text-white text-base"
                  style={{ fontFamily: 'var(--ff-mono)' }}
                >
                  {progress}%
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Connecting state indicator ────────────────────────── */}
          {isConnecting && (
            <div className="flex items-center gap-2.5 mt-5 py-3 px-4 rounded-xl"
              style={{
                background: 'rgba(99,102,241,0.04)',
                border: '1px solid rgba(99,102,241,0.1)',
              }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--cyan)' }}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <span
                className="text-xs"
                style={{ fontFamily: 'var(--ff-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}
              >
                {status === 'waiting' ? 'WAITING FOR PEER…' :
                 status === 'awaiting_approval' ? 'AWAITING APPROVAL…' :
                 status === 'pending' ? 'FILE PENDING APPROVAL…' :
                 'CONNECTING…'}
              </span>
            </div>
          )}

          {/* ── Done State ────────────────────────────────────────── */}
          {isDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-5 text-center space-y-4 py-4"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="flex justify-center"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(57,255,20,0.08)',
                    border: '1px solid rgba(57,255,20,0.25)',
                    boxShadow: '0 0 30px rgba(57,255,20,0.1)',
                  }}
                >
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
              </motion.div>
              <div>
                <p className="font-bold text-emerald-400" style={{ fontFamily: 'var(--ff-head)' }}>
                  Transfer Complete!
                </p>
                {role === 'receiver' && (
                  <p className="text-xs mt-1" style={{ color: 'rgba(74,98,120,0.9)' }}>
                    File downloaded automatically.
                  </p>
                )}
              </div>
              <button onClick={handleDone} className="btn btn-ghost mx-auto flex items-center gap-2">
                <ArrowLeft size={14} /> Back to Home
              </button>
            </motion.div>
          )}

          {/* ── Error / Cancelled State ──────────────────────────── */}
          {(isError || isCancelled) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-5 text-center space-y-4 py-4"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <XCircle size={24} className="text-red-400" />
              </div>
              <div>
                <p className="font-bold text-red-400" style={{ fontFamily: 'var(--ff-head)' }}>
                  {isCancelled ? 'Transfer Cancelled' : 'Transfer Aborted'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(74,98,120,0.9)' }}>
                  {errorMsg || 'The connection was closed.'}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { reset(); navigate('/') }} className="btn btn-ghost flex items-center gap-2">
                  <ArrowLeft size={14} /> Home
                </button>
                <button
                  onClick={() => { reset(); navigate(role === 'sender' ? '/send' : '/receive') }}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <RefreshCw size={13} /> Try Again
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Transferring — live pulse + cancel ───────────────── */}
          {isTransferring && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 space-y-3"
            >
              <div className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span
                  className="inline-flex w-2 h-2 rounded-full"
                  style={{ background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }}
                />
                <span style={{ fontFamily: 'var(--ff-mono)', letterSpacing: '0.08em', fontSize: '10px' }}>
                  {role === 'sender' ? 'SENDING CHUNKS…' : 'RECEIVING CHUNKS…'}
                </span>
              </div>

              <button
                onClick={handleCancel}
                className="btn btn-danger w-full"
              >
                🛑 Cancel Transfer
              </button>
            </motion.div>
          )}
        </div>

        {/* ── Footer note ───────────────────────────────────────── */}
        {isTransferring && (
          <p
            className="text-center text-[9px]"
            style={{ fontFamily: 'var(--ff-mono)', color: 'var(--text-muted)', opacity: 0.7, letterSpacing: '0.1em' }}
          >
            P2P ENCRYPTED · NO DATA PASSES THROUGH ANY SERVER
          </p>
        )}
      </div>
    </motion.section>
  )
}
