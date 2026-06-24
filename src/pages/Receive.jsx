import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { usePeer } from '../context/PeerContext'
import {
  Download,
  Lock,
  Check,
  X,
  Shield,
  Wifi,
  Loader2,
  File,
  FileArchive,
  Image,
  Video,
  Music,
  FileText,
  User,
  Eye,
  EyeOff
} from 'lucide-react'

// ── Magnetic Button Wrapper ──
function Magnetic({ children }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { damping: 15, stiffness: 150 })
  const springY = useSpring(y, { damping: 15, stiffness: 150 })

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    const distanceX = clientX - centerX
    const distanceY = clientY - centerY
    x.set(distanceX * 0.22)
    y.set(distanceY * 0.22)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className="inline-block"
    >
      {children}
    </motion.div>
  )
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

function getFileIcon(filename) {
  if (!filename) return File
  const ext = filename.split('.').pop().toLowerCase()
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FileArchive
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return Image
  if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return Video
  if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) return Music
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)) return FileText
  return File
}

export default function Receive() {
  const { status, errorMsg, pendingMeta, connectToRoom, acceptTransfer, rejectTransfer } = usePeer()
  const [searchParams] = useSearchParams()
  const [inputId, setInputId] = useState('')
  const [passInput, setPassInput] = useState('')
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()

  // Read URL query parameter for active room ID on mount
  useEffect(() => {
    const roomParam = searchParams.get('room')
    if (roomParam) {
      setInputId(roomParam.trim().toUpperCase())
    }
  }, [searchParams])

  // Redirect to progress page once the stream initiates
  useEffect(() => {
    if (status === 'transferring') {
      navigate('/progress')
    }
  }, [status, navigate])

  // Clear passphrase field whenever a new transfer request arrives
  useEffect(() => {
    setPassInput('')
    setShowPass(false)
  }, [pendingMeta?.name])

  const handleConnect = () => {
    const id = inputId.trim()
    if (!id) return
    connectToRoom(id)
  }

  const statusLabel = {
    connecting: 'Locating sender coordinates and establishing session…',
    connected: 'Connected successfully! Awaiting file approval handshake…',
  }[status]

  // Render Incoming Transfer Security Modal
  const renderPendingPrompt = () => {
    if (!pendingMeta) return null
    const Icon = getFileIcon(pendingMeta.name)

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md glass-card rounded-3xl p-8 border border-white/6 text-center shadow-glass-lg relative overflow-hidden"
      >
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        {/* Security Shield icon with concentric sonar pulses */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-amber-500/10 border border-amber-500/20"
          />
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-glow-cyan shadow-amber-500/15 relative z-10">
            <Shield size={28} />
          </div>
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight">Handshake Invitation</h3>
        <p className="text-sm text-gray-400 mt-1 mb-6">A sender wants to establish a connection path</p>

        {/* File Detail Box */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/6 text-left mb-6 hover:border-indigo-500/10 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Icon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white truncate text-base">{pendingMeta.name}</div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400 font-mono">
              <span className="font-bold text-indigo-300">{formatBytes(pendingMeta.size)}</span>
              <span className="text-gray-600">•</span>
              <span>{pendingMeta.totalChunks} chunks</span>
            </div>
          </div>
        </div>

        {/* ── Passphrase input (only if the room is password-protected) ── */}
        {pendingMeta.hasPassword && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 space-y-2 text-left"
          >
            <div className="text-xxs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={10} />
              Password Protected Room
            </div>
            <div className="relative flex items-center">
              <input
                type={showPass ? 'text' : 'password'}
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && passInput.trim()) acceptTransfer(passInput)
                }}
                placeholder="Enter room passphrase…"
                autoFocus
                className="w-full p-3.5 pr-10 rounded-xl bg-amber-500/[0.02] border border-amber-500/20 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-amber-500/50 focus:bg-amber-500/[0.03] transition-all duration-200 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xxs text-gray-600 font-semibold">
              The sender locked this room. Enter the passphrase to decrypt the transfer.
            </p>
          </motion.div>
        )}

        {/* Modal Buttons */}
        <div className="flex gap-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={rejectTransfer}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-400/40 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 select-none"
          >
            <X size={15} />
            Reject
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => acceptTransfer(pendingMeta.hasPassword ? passInput : '')}
            disabled={pendingMeta.hasPassword && !passInput.trim()}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/40 transition-all duration-200 cursor-pointer glow-green shadow-emerald-500/10 flex items-center justify-center gap-2 select-none ${pendingMeta.hasPassword && !passInput.trim() ? 'opacity-40 !cursor-not-allowed' : ''}`}
          >
            <Check size={15} />
            Accept File
          </motion.button>
        </div>

        <p className="text-xxs text-gray-600 mt-4 font-semibold">
          Accepting opens a secure browser-to-browser WebRTC channel.
        </p>
      </motion.div>
    )
  }

  // Render Main Room Code Input Panel
  const renderNormalForm = () => {
    const isConnecting = status === 'connecting' || status === 'connected'

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md glass-card rounded-3xl p-8 border border-white/6 text-center shadow-glass-lg relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        {/* Dynamic scanning sonar circles backdrop */}
        <div className="relative h-24 mb-6 flex items-center justify-center">
          {isConnecting ? (
            <div className="relative w-20 h-20 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.45, 1], opacity: [0.15, 0.45, 0.15] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border border-indigo-500/35 animate-glow-pulse"
              />
              <motion.div
                animate={{ scale: [1.2, 1.75, 1.2], opacity: [0.05, 0.25, 0.05] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 0.4 }}
                className="absolute inset-0 rounded-full border border-cyan-500/20"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'linear' }}
                className="absolute w-14 h-14 rounded-full border border-dashed border-indigo-400/50"
              />
              <Wifi size={24} className="text-indigo-400 relative z-10 animate-pulse" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow-sm">
              <Download size={26} />
            </div>
          )}
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight">Receive File</h3>
        <p className="text-sm text-gray-400 mt-1">
          Paste the Room ID provided by the sender to connect
        </p>

        {/* Form container */}
        <div className="mt-6 space-y-4">
          <input
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && !isConnecting && handleConnect()}
            placeholder="XXXX-XXXX"
            maxLength={9}
            disabled={isConnecting}
            className="w-full p-4 rounded-xl bg-white/3 border border-white/8 text-center font-mono text-2xl tracking-widest text-white placeholder-gray-750 focus:outline-none focus:border-indigo-500/70 focus:bg-indigo-500/5 transition-all duration-350 shadow-inner disabled:opacity-40"
          />

          <Magnetic>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConnect}
              disabled={!inputId.trim() || isConnecting}
              className="btn btn-primary w-full py-4 text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer"
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Connecting to Peer…
                </span>
              ) : (
                'Connect & Receive'
              )}
            </motion.button>
          </Magnetic>
        </div>

        {/* Dynamic State Info Banners */}
        <AnimatePresence>
          {statusLabel && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 p-3.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-xs text-indigo-300 font-bold shadow-glow-sm flex items-center justify-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              <span>{statusLabel}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Socket/Connector Errors */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400 font-bold shadow-glow-red"
            >
              ⚠️ {errorMsg || 'Could not locate sender coordinates. Confirm ID and try again.'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help label */}
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4.5 rounded-xl bg-white/[0.01] border border-white/5 text-xxs text-gray-550 leading-relaxed font-semibold"
          >
            🔒 Transfers are direct. No files are uploaded to static storage blocks.
          </motion.div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="py-10 flex items-center justify-center min-h-[480px] relative"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl -z-10 animate-pulse-slow" />

      <AnimatePresence mode="wait">
        {status === 'pending' && pendingMeta ? renderPendingPrompt() : renderNormalForm()}
      </AnimatePresence>
    </motion.section>
  )
}
