import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { usePeer } from '../context/PeerContext'
import JSZip from 'jszip'
import { 
  Upload, 
  File, 
  FileArchive, 
  Image, 
  Video, 
  Music, 
  FileText, 
  Check, 
  Copy, 
  AlertTriangle, 
  X, 
  Trash2,
  FolderOpen,
  Lock,
  Eye,
  EyeOff,
  Share2,
  FileDown
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

// ── Lucide Icon Resolver by file extension ──
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

export default function Send() {
  const { selectedFile, setSelectedFile, roomId, status, errorMsg, generateRoom, passphrase, setPassphrase } = usePeer()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const folderInputRef = useRef(null)

  const [selectedFiles, setSelectedFiles] = useState([])
  const [isZipping, setIsZipping] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [compress, setCompress] = useState(true)

  // Redirect to progress page once handshake completes and transmission begins
  useEffect(() => {
    if (status === 'transferring') {
      navigate('/progress')
    }
  }, [status, navigate])

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setSelectedFiles(files)
    }
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const copyRoom = () => {
    if (!roomId) return
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareRoom = async () => {
    if (!roomId) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PeerMesh Room', text: `Join me on PeerMesh! Room ID: ${roomId}`, url: window.location.origin + '/receive' })
      } catch (_) {}
    } else {
      copyRoom()
    }
  }

  const handleGenerateRoom = async () => {
    if (selectedFiles.length === 0) return

    if (selectedFiles.length === 1) {
      setSelectedFile(selectedFiles[0])
      generateRoom()
    } else {
      setIsZipping(true)
      try {
        const zip = new JSZip()
        selectedFiles.forEach((file) => {
          const path = file.webkitRelativePath || file.name
          zip.file(path, file)
        })
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: compress ? 'DEFLATE' : 'STORE',
          compressionOptions: compress ? { level: 6 } : undefined,
        })
        const zipFile = new File([zipBlob], 'peermesh-transfer.zip', {
          type: 'application/zip',
          lastModified: Date.now(),
        })
        setSelectedFile(zipFile)
        generateRoom()
      } catch (err) {
        console.error('Failed to create zip', err)
      } finally {
        setIsZipping(false)
      }
    }
  }

  const statusLabel = {
    idle: null,
    waiting: 'Waiting for receiver node to connect…',
    connecting: 'Receiver found — establishing WebRTC stream…',
    awaiting_approval: 'Awaiting permission key approval from receiver…',
    error: null,
  }[status]

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="py-10 max-w-3xl mx-auto relative select-none"
    >
      {/* Visual background details */}
      <div className="absolute top-0 right-10 w-64 h-64 bg-indigo-500/5 rounded-full filter blur-3xl -z-10 animate-pulse-slow" />
      <div className="absolute bottom-0 left-10 w-64 h-64 bg-cyan-500/5 rounded-full filter blur-3xl -z-10 animate-pulse-slow" />

      <div className="flex items-center justify-between mb-8 px-1">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Send Files</h2>
          <p className="text-sm text-gray-400 mt-1">Pack your documents and stream them peer-to-peer</p>
        </div>
        <span className="badge-neon flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Sender Mode
        </span>
      </div>

      <div className="glass-card p-8 rounded-3xl border border-white/6 shadow-glass-lg relative overflow-hidden">
        {/* Neon top border border */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        {/* ── Drag & Drop Area ── */}
        <motion.div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          animate={{
            borderColor: isDragging ? 'rgba(99, 102, 241, 0.7)' : 'rgba(255, 255, 255, 0.08)',
            backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.01)',
            scale: isDragging ? 1.018 : 1,
            boxShadow: isDragging ? '0 0 30px rgba(99, 102, 241, 0.15), inset 0 0 30px rgba(99,102,241,0.05)' : 'none',
          }}
          transition={{ duration: 0.25 }}
          className="border-2 border-dashed rounded-2xl p-12 text-center relative overflow-hidden group cursor-pointer hover:border-indigo-500/30"
          onClick={() => inputRef.current.click()}
        >
          {/* Ambient scan trail */}
          <div className="absolute inset-0 scan-line opacity-5 pointer-events-none" />

          {/* Floating animated icon */}
          <motion.div
            animate={isDragging ? { y: [0, -15, 0], scale: 1.1 } : { y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400"
          >
            <Upload size={28} />
          </motion.div>

          <h3 className="text-xl font-bold text-white mb-2">Drag &amp; drop files/folders here</h3>
          <p className="text-sm text-gray-400 mb-6">Or select from your local filesystem</p>

          <div className="flex justify-center gap-4 relative z-10">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current.click()
              }}
              className="btn btn-ghost text-sm px-6 py-2.5 flex items-center gap-2"
            >
              <File size={15} />
              Browse Files
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation()
                folderInputRef.current.click()
              }}
              className="btn btn-ghost text-sm px-6 py-2.5 flex items-center gap-2"
            >
              <FolderOpen size={15} />
              Browse Folder
            </motion.button>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files)
              if (files.length > 0) setSelectedFiles(files)
            }}
          />

          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files)
              if (files.length > 0) setSelectedFiles(files)
            }}
          />
        </motion.div>

        {/* ── Staggered Files Deck ── */}
        <AnimatePresence mode="popLayout">
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between text-sm text-gray-400 px-1 pt-2">
                <span className="font-semibold">Selected Payload ({selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''})</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    setSelectedFiles([])
                    setSelectedFile(null)
                  }}
                  className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  Clear All
                </motion.button>
              </div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  show: { transition: { staggerChildren: 0.05 } },
                }}
                className="max-h-52 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar"
              >
                {selectedFiles.map((file, idx) => {
                  const Icon = getFileIcon(file.name)
                  return (
                    <motion.div
                      key={idx}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        show: { opacity: 1, x: 0 },
                      }}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/6 hover:border-indigo-500/20 hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-indigo-400">
                          <Icon size={18} />
                        </div>
                        <span className="truncate font-semibold text-gray-200 text-sm">
                          {file.webkitRelativePath || file.name}
                        </span>
                      </div>
                      <span className="text-xxs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/20 shrink-0 ml-2">
                        {formatBytes(file.size)}
                      </span>
                    </motion.div>
                  )
                })}
              </motion.div>

              {/* Bundle Alert Warning */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-between p-4.5 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 shadow-glow-sm relative overflow-hidden"
              >
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-300 shrink-0">
                    <FileArchive size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Combined Transfer Size</div>
                    <div className="text-xs text-gray-400 mt-0.5 font-semibold">
                      {selectedFiles.length > 1 ? 'Compiling as bundled zip format' : 'Direct transport tunnel streaming'}
                    </div>
                  </div>
                </div>
                <div className="text-lg font-black text-indigo-300 number-display">
                  {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Optional Passphrase ── */}
        <div className="space-y-2">
          <div className="text-xxs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Lock size={10} className="text-indigo-400" />
            Room Passphrase
            <span className="text-gray-600 normal-case font-normal ml-1">(optional)</span>
          </div>
          <div className="relative flex items-center">
            <input
              type={showPass ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Lock this room with a passphrase…"
              disabled={status === 'waiting' || status === 'connecting' || status === 'awaiting_approval'}
              className="w-full p-3.5 pr-10 rounded-xl bg-white/[0.02] border border-white/6 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/[0.03] transition-all duration-200 font-mono disabled:opacity-40"
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              className="absolute right-3 text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {passphrase && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-xxs text-emerald-400 font-bold"
            >
              <Lock size={10} />
              Room will be password-protected
            </motion.div>
          )}
        </div>

        {/* ── Compression Toggle ── */}
        {selectedFiles.length > 1 && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/6">
            <div className="flex items-center gap-2.5">
              <FileDown size={15} className="text-indigo-400" />
              <div>
                <div className="text-sm font-bold text-gray-200">Compress Files</div>
                <div className="text-xxs text-gray-500">DEFLATE compression before transfer</div>
              </div>
            </div>
            <button
              onClick={() => setCompress(c => !c)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                compress ? 'bg-indigo-500' : 'bg-white/10'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                compress ? 'translate-x-5.5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        )}

        {/* ── Room ID Panel ── */}
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 p-4.5 rounded-2xl bg-white/[0.02] border border-white/6 shadow-inner relative overflow-hidden">
            <div className="text-xxs text-gray-400 font-bold uppercase tracking-wider mb-2">Active Room ID</div>
            <div className="font-mono text-2xl font-extrabold tracking-widest text-white">
              {roomId ? (
                <span className="gradient-text font-black">{roomId}</span>
              ) : (
                <span className="text-gray-700">— — — —</span>
              )}
            </div>
          </div>

          <div className="flex md:flex-col gap-2 shrink-0">
            <Magnetic>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateRoom}
                disabled={
                  selectedFiles.length === 0 ||
                  isZipping ||
                  status === 'waiting' ||
                  status === 'connecting' ||
                  status === 'awaiting_approval'
                }
                className="btn btn-primary min-w-[150px] py-4 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isZipping ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Bundling zip…
                  </>
                ) : status === 'awaiting_approval' ? (
                  'Awaiting acceptance…'
                ) : status === 'waiting' || status === 'connecting' ? (
                  'Establishing channel…'
                ) : (
                  'Generate Room'
                )}
              </motion.button>
            </Magnetic>

            <AnimatePresence>
              {roomId && (
                <>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={shareRoom}
                    className={`btn btn-ghost py-4 font-bold select-none cursor-pointer border border-white/10 flex items-center justify-center gap-2`}
                    title="Share Room ID"
                  >
                    <Share2 size={16} />
                    Share
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={copyRoom}
                    className={`btn ${copied ? 'btn-success glow-green' : 'btn-ghost'} py-4 font-bold select-none cursor-pointer border border-white/10 flex items-center justify-center gap-2`}
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy Room ID
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Status Info Box ── */}
        <AnimatePresence>
          {statusLabel && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/25 text-xs text-indigo-300 text-center font-bold shadow-glow-sm"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span>{statusLabel}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error Banner ── */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-sm text-red-400 text-center font-bold shadow-glow-red flex items-center justify-center gap-2"
            >
              <AlertTriangle size={16} className="text-red-400" />
              <span>{errorMsg || 'An unknown network socket error occurred.'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}
