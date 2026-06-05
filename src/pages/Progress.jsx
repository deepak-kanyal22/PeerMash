import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePeer } from '../context/PeerContext'
import { 
  Laptop, 
  User, 
  Activity, 
  FileText, 
  Check, 
  RotateCcw, 
  X, 
  FileArchive, 
  Clock, 
  HardDrive, 
  Gauge, 
  ShieldCheck, 
  Zap,
  Network
} from 'lucide-react'

// ── Built-in High-Fidelity Confetti Particle Emitter ──
function Confetti() {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const colors = ['#818cf8', '#38bdf8', '#34d399', '#f472b6', '#fbbf24']
    const list = Array.from({ length: 75 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100 - 50, // offset in vw
      y: Math.random() * -30 - 10, // spawn above card
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.7,
      duration: Math.random() * 1.5 + 1.2,
      rotation: Math.random() * 360,
    }))
    setParticles(list)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: p.rotation, opacity: 1 }}
          animate={{
            y: '110vh',
            rotate: p.rotation + 720,
            opacity: 0,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.id % 2 === 0 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}

// ── Live Synthesis Arpeggio Chime ──
function playSuccessSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const gainNode = audioCtx.createGain()
    gainNode.connect(audioCtx.destination)

    const now = audioCtx.currentTime
    // Chime notes arpeggio: C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.50]
    
    notes.forEach((freq, index) => {
      const osc = audioCtx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + index * 0.08)
      osc.connect(gainNode)
      
      gainNode.gain.setValueAtTime(0.12, now + index * 0.08)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.45)
      
      osc.start(now + index * 0.08)
      osc.stop(now + index * 0.08 + 0.5)
    })
  } catch (e) {
    console.warn('Web Audio Playback failed or was blocked by document autoplay gesture rules.', e)
  }
}

function formatSpeed(mbps) {
  if (mbps >= 1) return `${mbps.toFixed(1)} MB/s`
  return `${(mbps * 1024).toFixed(0)} KB/s`
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

export default function Progress() {
  const {
    status,
    progress,
    speed,
    roomId,
    selectedFile,
    transferredFileName,
    pendingMeta,
    role,
    errorMsg,
    acceptTransfer,
    rejectTransfer,
    cancelTransfer,
    reset,
  } = usePeer()
  const navigate = useNavigate()

  // Play audio on success
  useEffect(() => {
    if (status === 'done') {
      playSuccessSound()
    }
  }, [status])

  const isDone = status === 'done'
  const isCancelled = status === 'cancelled' || errorMsg === 'Transfer Cancelled' || errorMsg === 'Transfer Rejected'
  const isError = status === 'error' && !isCancelled
  const isTransferring = status === 'transferring'
  const isConnecting = status === 'connecting' || status === 'waiting' || status === 'connected'
  const isPending = status === 'pending' || status === 'awaiting_approval'

  // Extract size parameters
  const totalBytes = role === 'sender' ? (selectedFile ? selectedFile.size : 0) : (pendingMeta ? pendingMeta.size : 0)
  const remainingBytes = totalBytes * (1 - progress / 100)
  const speedInBytes = speed * 1024 * 1024
  const remainingSeconds = speedInBytes > 0 ? remainingBytes / speedInBytes : 0
  const totalChunks = Math.ceil(totalBytes / 16384)

  const formatRemainingTime = (seconds) => {
    if (!seconds || !isFinite(seconds) || seconds <= 0) return 'Estimating…'
    if (seconds < 60) return `${Math.ceil(seconds)}s remaining`
    const minutes = Math.floor(seconds / 60)
    const remSec = Math.ceil(seconds % 60)
    return `${minutes}m ${remSec}s remaining`
  }

  const handleBack = () => {
    reset()
    navigate('/')
  }

  const handleTryAgain = () => {
    const previousRole = role
    reset()
    navigate(previousRole === 'sender' ? '/send' : '/receive')
  }

  // Circular progress dimensions
  const radius = 72
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Animations configuration
  const fadeVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2 } },
  }

  // ── 1. RENDER DETAILED 3-COLUMN DASHBOARD ──
  const renderDashboard = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN: Node Tunnel Visualizer */}
        <div className="lg:col-span-3 glass-card rounded-3xl p-6 flex flex-col justify-center items-center shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh-purple opacity-40 pointer-events-none" />
          <h4 className="text-xxs text-gray-500 font-bold uppercase tracking-wider mb-6 select-none">WebRTC Beam</h4>

          <div className="flex flex-col items-center justify-between h-80 py-2 relative w-full">
            {/* Sender Peer */}
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold bg-indigo-500/10 border-2 ${role === 'sender' ? 'border-indigo-400 shadow-glow-sm' : 'border-indigo-500/20'}`}>
                {role === 'sender' ? <Laptop size={20} className="text-indigo-400" /> : <User size={20} className="text-indigo-500" />}
              </div>
              <span className="text-xxs text-gray-400 font-extrabold uppercase tracking-wide">
                {role === 'sender' ? 'You (Host)' : 'Host Node'}
              </span>
            </div>

            {/* Connecting Vertical Tunnel */}
            <div className="flex-1 w-12 relative my-3">
              <svg className="w-full h-full" viewBox="0 0 40 100" preserveAspectRatio="none">
                <line x1="20" y1="5" x2="20" y2="95" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="2" />
                {isTransferring && (
                  <line
                    x1="20"
                    y1="5"
                    x2="20"
                    y2="95"
                    stroke="url(#vertical-beam-grad)"
                    strokeWidth="2.5"
                    strokeDasharray="6,4"
                    className="network-line"
                  />
                )}
                <defs>
                  <linearGradient id="vertical-beam-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              {isTransferring && (
                <>
                  <motion.div
                    animate={{ top: ['5%', '95%'] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                    className="absolute left-[19px] w-2 h-2 rounded-full bg-indigo-400 shadow-glow-sm"
                  />
                  <motion.div
                    animate={{ top: ['5%', '95%'] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'linear', delay: 0.45 }}
                    className="absolute left-[19px] w-2 h-2 rounded-full bg-cyan-400 shadow-glow-cyan"
                  />
                  <motion.div
                    animate={{ top: ['5%', '95%'] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'linear', delay: 0.9 }}
                    className="absolute left-[19.5px] w-1.5 h-1.5 rounded-full bg-purple-400 shadow-glow-sm"
                  />
                </>
              )}
            </div>

            {/* Receiver Peer */}
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold bg-cyan-500/10 border-2 ${role === 'receiver' ? 'border-cyan-400 shadow-glow-cyan' : 'border-cyan-500/20'}`}>
                {role === 'receiver' ? <Laptop size={20} className="text-cyan-400" /> : <User size={20} className="text-cyan-500" />}
              </div>
              <span className="text-xxs text-gray-400 font-extrabold uppercase tracking-wide">
                {role === 'receiver' ? 'You (Client)' : 'Client Node'}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Core Progress Circle */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 flex flex-col justify-center items-center shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh-cyan opacity-40 pointer-events-none" />
          <h4 className="text-xxs text-gray-500 font-bold uppercase tracking-wider mb-6 select-none">Transmission Core</h4>

          {/* Massive Glowing Ring */}
          <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
            {/* Concentric heartbeat backglow */}
            <motion.div
              animate={isTransferring ? { scale: [0.96, 1.04, 0.96], opacity: [0.25, 0.5, 0.25] } : { scale: 1, opacity: 0.2 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="absolute inset-4 rounded-full border border-indigo-500/10 shadow-glow-sm"
            />
            
            <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
              <defs>
                <linearGradient id="glow-circle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              
              {/* Background Track Circle */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="10"
              />
              
              {/* Dynamic Progress Circle */}
              <motion.circle
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke="url(#glow-circle-grad)"
                strokeWidth="10"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                strokeLinecap="round"
              />
              
              {/* Progress Glow trail */}
              {isTransferring && (
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="transparent"
                  stroke="#06b6d4"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="progress-circle-trail opacity-60"
                  strokeLinecap="round"
                />
              )}
            </svg>
            
            {/* Text details inside ring */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-black text-white tracking-tight number-display">
                {progress}%
              </span>
              <span className="text-xxs text-indigo-400 font-extrabold uppercase tracking-widest mt-1.5">
                {isTransferring ? formatSpeed(speed) : 'Handshaking'}
              </span>
              {speed > 0 && isTransferring && (
                <span className="text-xxs text-gray-500 font-bold mt-1 uppercase flex items-center gap-1">
                  <Clock size={10} />
                  {formatRemainingTime(remainingSeconds)}
                </span>
              )}
            </div>
          </div>

          {/* Core Controls */}
          <div className="w-full mt-6 px-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCancel}
              className="btn btn-danger w-full py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer border border-red-500/20"
            >
              <X size={15} />
              Abort Stream
            </motion.button>
          </div>
        </div>

        {/* RIGHT COLUMN: Metadata & Metrics */}
        <div className="lg:col-span-4 glass-card rounded-3xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh-purple opacity-40 pointer-events-none" />
          
          <div className="space-y-5">
            <h4 className="text-xxs text-gray-500 font-bold uppercase tracking-wider select-none">Channel Metadata</h4>

            {/* File info box */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/[0.01] border border-white/6 hover:bg-white/[0.03] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-sm truncate">{transferredFileName || 'payload.zip'}</div>
                <div className="text-xxs text-gray-500 font-bold tracking-wide mt-1 uppercase">File Name</div>
              </div>
            </div>

            {/* Stats list */}
            <div className="space-y-3">
              {/* Total Size */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/4">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold">
                  <HardDrive size={13} />
                  Payload Size
                </div>
                <span className="text-sm font-bold text-white font-mono">{formatBytes(totalBytes)}</span>
              </div>

              {/* Channel State */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/4">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold">
                  <Network size={13} />
                  Channel Mode
                </div>
                <span className="text-xxs font-extrabold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono uppercase select-none">
                  WebRTC P2P
                </span>
              </div>

              {/* Chunk details */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/4">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold">
                  <Gauge size={13} />
                  Total Chunks
                </div>
                <span className="text-xs font-bold text-white font-mono">{totalChunks} Chunks</span>
              </div>
            </div>
          </div>

          {/* Quality Indicator */}
          <div className="p-4.5 rounded-2xl bg-indigo-600/5 border border-indigo-500/15 flex items-center justify-between shadow-glow-sm relative overflow-hidden mt-6">
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-xs text-white font-bold select-none">Link status</span>
            </div>
            <span className="text-xxs font-black text-cyan-300 tracking-wider uppercase bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20 font-mono">
              {speed > 5 ? 'Excellent (LAN)' : speed > 1.2 ? 'Good' : 'Stable'}
            </span>
          </div>
        </div>

      </div>
    )
  }

  // ── 2. RENDER SUCCESS ANIMATION VIEW ──
  const renderSuccess = () => {
    return (
      <motion.div
        key="success"
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="text-center space-y-7 py-8 relative max-w-md mx-auto"
      >
        <Confetti />

        {/* Pulsing checkmark ring with glow expansion */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.15, 0.45, 0.15] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-glow-emerald"
          />
          <div className="w-18 h-18 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-glow-emerald relative z-10">
            <Check size={36} className="stroke-[3px]" />
          </div>
        </div>

        <div>
          <h3 className="text-3xl font-black text-white tracking-tight">Transfer Complete!</h3>
          <p className="text-gray-400 text-sm mt-2 font-semibold truncate max-w-sm mx-auto leading-relaxed">
            Successfully exchanged payload: <span className="text-indigo-300 font-bold">{transferredFileName || 'file'}</span>
          </p>
          {role === 'receiver' && (
            <div className="mt-3.5 inline-block">
              <span className="badge-neon !bg-emerald-500/10 !border-emerald-500/30 !text-emerald-400 text-xs py-1.5 font-bold uppercase">
                📥 Payload saved to downloads
              </span>
            </div>
          )}
        </div>

        <div className="w-full h-3.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
          <div className="h-full rounded-full progress-liquid-green glow-green w-full" />
        </div>

        <div className="flex gap-3 pt-2 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/8 text-white transition-all cursor-pointer"
          >
            Go Home
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTryAgain}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 shadow-glow-sm text-white transition-all cursor-pointer"
          >
            {role === 'sender' ? 'Send Another' : 'Receive Another'}
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // ── 3. RENDER CANCELLED STATE ──
  const renderCancelled = () => {
    return (
      <motion.div
        key="cancelled"
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="text-center space-y-6 py-6 max-w-md mx-auto"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-glow-red">
          <X size={32} className="stroke-[2.5px]" />
        </div>

        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">
            {errorMsg === 'Transfer Rejected' ? 'Transfer Rejected' : 'Transfer Cancelled'}
          </h3>
          <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
            {errorMsg === 'Transfer Rejected'
              ? 'The client rejected the file handshake request.'
              : 'The transmission stream was aborted by one of the connected peers.'}
          </p>
        </div>

        <div className="w-full h-3.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full rounded-full progress-liquid-red glow-red"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/8 text-white transition-all cursor-pointer"
          >
            Go Home
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTryAgain}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 shadow-glow-sm text-white transition-all cursor-pointer"
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // ── 4. RENDER ERROR/FAILURE STATE ──
  const renderError = () => {
    return (
      <motion.div
        key="error"
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="text-center space-y-6 py-6 max-w-md mx-auto"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-glow-red animate-pulse">
          ⚠️
        </div>

        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">Transfer Failed</h3>
          <div className="mt-3.5 inline-block">
            <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2 rounded-xl font-bold leading-relaxed shadow-glow-red shadow-red-500/5 select-all">
              {errorMsg || 'A network socket connection exception was raised.'}
            </span>
          </div>
        </div>

        <div className="w-full h-3.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div className="h-full rounded-full progress-liquid-red w-full" />
        </div>

        <div className="flex gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/8 text-white transition-all cursor-pointer"
          >
            Go Home
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTryAgain}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 shadow-glow-sm text-white transition-all cursor-pointer"
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // ── 5. RENDER SETUP CAPSULES (IDLE, CONNECTING, PENDING) ──
  const renderSetupCapsule = () => {
    let key, title, desc, icon, badgeText, colorClass, animationClass

    if (status === 'idle') {
      key = 'idle'
      title = 'No Active Session'
      desc = 'Configure a send or receive socket session to access the visualizer.'
      icon = '📡'
      badgeText = 'Session Idle'
    } else if (isConnecting) {
      key = 'connecting'
      title = status === 'waiting' ? 'Waiting for connection…' : 'Establishing coordinates…'
      desc = status === 'waiting'
        ? 'Share the room code below with the recipient to establish direct mesh paths.'
        : 'Connecting browser WebRTC handshakes…'
      icon = '🔗'
      badgeText = 'Connecting'
    } else {
      // Pending
      key = 'pending'
      title = role === 'sender' ? 'Awaiting Handshake' : 'Handshake Request'
      desc = role === 'sender'
        ? 'The recipient is reviewing the session details. Handshake pending…'
        : 'Verify the incoming file parameters before accepting.'
      icon = '🛡'
      badgeText = 'Pending Approval'
    }

    return (
      <motion.div
        key={key}
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="text-center space-y-6 py-6 max-w-md mx-auto"
      >
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-500/10 border-2 border-indigo-400/30 animate-ping opacity-75" />
          <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl shadow-glow-sm relative z-10 select-none">
            {icon}
          </div>
        </div>

        <div>
          <span className="badge-neon mb-2 inline-block">{badgeText}</span>
          <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
          <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto leading-relaxed">{desc}</p>
        </div>

        {isConnecting && roomId && (
          <div className="bg-white/[0.01] border border-white/6 rounded-2xl p-4.5 inline-block max-w-xs mx-auto shadow-inner relative overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-500/25 animate-pulse" />
            <div className="text-xxs text-gray-500 font-bold uppercase tracking-wider mb-1">Room ID</div>
            <div className="font-mono text-2xl font-extrabold tracking-widest text-indigo-300 select-all">
              {roomId}
            </div>
          </div>
        )}

        {isPending && role === 'receiver' && pendingMeta && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/6 text-left max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <FileArchive size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm truncate">{pendingMeta.name}</div>
              <div className="text-xxs text-gray-500 font-bold tracking-wide mt-1 font-mono">{formatBytes(pendingMeta.size)}</div>
            </div>
          </div>
        )}

        <div className="pt-2">
          {isPending && role === 'receiver' ? (
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={rejectTransfer}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-400/40 transition-all duration-200 cursor-pointer"
              >
                ✕ Reject
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={acceptTransfer}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/40 transition-all duration-200 cursor-pointer glow-green"
              >
                ✓ Accept
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={status === 'idle' ? handleBack : handleCancel}
              className={`w-full py-3.5 rounded-xl font-bold text-sm border transition-all duration-200 cursor-pointer ${
                status === 'idle'
                  ? 'btn-primary border-transparent'
                  : 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:border-red-400/40'
              }`}
            >
              {status === 'idle' ? 'Back to Home' : 'Cancel Setup'}
            </motion.button>
          )}
        </div>
      </motion.div>
    )
  }

  // ── 6. MAIN RENDER SWITCH ──
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className={`py-8 w-full mx-auto relative ${isTransferring || isDone || isCancelled || isError ? 'max-w-6xl' : 'max-w-xl'}`}
    >
      <AnimatePresence mode="wait">
        {isTransferring && (
          <motion.div key="dashboard" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
            {renderDashboard()}
          </motion.div>
        )}
        {isDone && renderSuccess()}
        {isCancelled && renderCancelled()}
        {isError && renderError()}
        {(status === 'idle' || isConnecting || isPending) && (
          <div className="glass-card rounded-3xl p-8 border border-white/6 shadow-glass-lg relative overflow-hidden">
            {renderSetupCapsule()}
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
