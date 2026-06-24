import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Cpu,
  Zap,
  Activity,
  UploadCloud,
  Globe,
  FileText,
  Terminal,
  ArrowRight,
  Lock,
  RefreshCw,
  Server,
  CheckCircle,
  Wifi,
  Trash2,
  Plus
} from 'lucide-react'

// ── Magnetic Wrapper Component ──
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

    x.set(distanceX * 0.25)
    y.set(distanceY * 0.25)
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

// ── 3D Spring Tilt Card Component ──
function TiltCard({ children, className }) {
  const cardRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useSpring(y, { damping: 20, stiffness: 200 })
  const rotateY = useSpring(x, { damping: 20, stiffness: 200 })

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left - width / 2
    const mouseY = e.clientY - rect.top - height / 2

    const maxRotate = 8
    const rX = -(mouseY / (height / 2)) * maxRotate
    const rY = (mouseX / (width / 2)) * maxRotate

    x.set(rY)
    y.set(rX)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── WebRTC Hero Canvas Visualizer ──
function WebRTCVisualizer() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    let dashOffset = 0
    let packetTimer = 0
    const packets = []

    class Particle {
      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.4
        this.vy = (Math.random() - 0.5) * 0.4
        this.radius = Math.random() * 2 + 1
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)'
        ctx.fill()
      }
    }

    const particles = Array.from({ length: 25 }, () => new Particle())

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', handleResize)

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      particles.forEach((p) => {
        p.update()
        p.draw()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 95) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 95) * 0.08})`
            ctx.stroke()
          }
        }
      }

      const x1 = width * 0.22
      const y1 = height * 0.55
      const x2 = width * 0.78
      const y2 = height * 0.55

      // Pipeline track
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'
      ctx.lineWidth = 5
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 10])
      ctx.lineDashOffset = -dashOffset
      ctx.stroke()
      ctx.setLineDash([])

      packetTimer++
      if (packetTimer % 50 === 0) {
        packets.push({ progress: 0, speed: Math.random() * 0.007 + 0.004, size: Math.random() * 3 + 2 })
      }

      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i]
        pk.progress += pk.speed
        if (pk.progress >= 1) {
          packets.splice(i, 1)
          continue
        }

        const px = x1 + (x2 - x1) * pk.progress
        const py = y1 + (y2 - y1) * pk.progress

        const glow = ctx.createRadialGradient(px, py, 0, px, py, pk.size * 3)
        glow.addColorStop(0, 'rgba(6, 182, 212, 0.8)')
        glow.addColorStop(0.5, 'rgba(99, 102, 241, 0.4)')
        glow.addColorStop(1, 'rgba(99, 102, 241, 0)')

        ctx.beginPath()
        ctx.arc(px, py, pk.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        ctx.beginPath()
        ctx.arc(px, py, pk.size, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
      }

      const drawNode = (nx, ny, label, color1, color2) => {
        const scale = 1 + Math.sin(dashOffset * 0.07) * 0.12
        ctx.beginPath()
        ctx.arc(nx, ny, 26 * scale, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color1}, 0.03)`
        ctx.fill()
        ctx.strokeStyle = `rgba(${color1}, ${0.08 * scale})`
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(nx, ny, 15, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color1}, 0.1)`
        ctx.fill()
        ctx.strokeStyle = color2
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(nx, ny, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        const isLight = document.documentElement.classList.contains('light')
        ctx.font = 'bold 9px IBM Plex Mono, monospace'
        ctx.fillStyle = isLight ? 'rgba(26, 26, 46, 0.4)' : 'rgba(255, 255, 255, 0.3)'
        ctx.textAlign = 'center'
        ctx.fillText(label, nx, ny + 30)
      }

      drawNode(x1, y1, 'CORE_SENDER', '99, 102, 241', '#6366f1')
      drawNode(x2, y2, 'CORE_RECEIVER', '6, 182, 212', '#06b6d4')

      dashOffset += 0.7
      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}

// ── Animated Counter Component ──
function AnimatedCounter({ value, duration = 1500, suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseFloat(value)
    if (isNaN(end)) {
      setCount(value)
      return
    }
    const totalFrames = Math.round(duration / 16.7)
    let frame = 0

    const counter = setInterval(() => {
      frame++
      const progress = frame / totalFrames
      // Ease out quad
      const current = end * (progress * (2 - progress))
      setCount(current)

      if (frame >= totalFrames) {
        clearInterval(counter)
        setCount(end)
      }
    }, 16.7)

    return () => clearInterval(counter)
  }, [value, duration])

  return (
    <span className="number-display">
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}
      {suffix}
    </span>
  )
}

// ── Interactive Live Mesh Canvas Visualizer (Section 3) ──
function InteractiveNetworkMesh() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    // Define 5 mesh nodes
    const nodes = [
      { id: 'DE-München', label: 'DE_MUNCHEN', x: width * 0.15, y: height * 0.3, px: width * 0.15, py: height * 0.3 },
      { id: 'SG-Central', label: 'SG_CENTRAL', x: width * 0.35, y: height * 0.7, px: width * 0.35, py: height * 0.7 },
      { id: 'US-Virginia', label: 'US_EAST', x: width * 0.5, y: height * 0.25, px: width * 0.5, py: height * 0.25 },
      { id: 'AU-Sydney', label: 'AU_SYDNEY', x: width * 0.68, y: height * 0.65, px: width * 0.68, py: height * 0.65 },
      { id: 'US-Oregon', label: 'US_WEST', x: width * 0.85, y: height * 0.35, px: width * 0.85, py: height * 0.35 },
    ]

    const connections = [
      [0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4]
    ]

    const packets = []
    let frame = 0

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight

      nodes[0].x = nodes[0].px = width * 0.15; nodes[0].y = nodes[0].py = height * 0.3
      nodes[1].x = nodes[1].px = width * 0.35; nodes[1].y = nodes[1].py = height * 0.7
      nodes[2].x = nodes[2].px = width * 0.5;  nodes[2].y = nodes[2].py = height * 0.25
      nodes[3].x = nodes[3].px = width * 0.68; nodes[3].y = nodes[3].py = height * 0.65
      nodes[4].x = nodes[4].px = width * 0.85; nodes[4].y = nodes[4].py = height * 0.35
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('resize', handleResize)

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      frame++

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      // Dynamic Node update (mouse gravity pull)
      nodes.forEach((n) => {
        const dx = mx - n.x
        const dy = my - n.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 180) {
          const force = (180 - dist) / 180
          n.x += (n.px - dx * force * 0.15 - n.x) * 0.08
          n.y += (n.py - dy * force * 0.15 - n.y) * 0.08
        } else {
          n.x += (n.px - n.x) * 0.08
          n.y += (n.py - n.y) * 0.08
        }
      })

      // Send packet streams randomly between nodes
      if (frame % 20 === 0) {
        const conn = connections[Math.floor(Math.random() * connections.length)]
        const from = nodes[conn[0]]
        const to = nodes[conn[1]]
        // Random direction
        if (Math.random() > 0.5) {
          packets.push({ from: conn[0], to: conn[1], progress: 0, speed: Math.random() * 0.015 + 0.01 })
        } else {
          packets.push({ from: conn[1], to: conn[0], progress: 0, speed: Math.random() * 0.015 + 0.01 })
        }
      }

      // Draw connection wires with gradient or solid glow
      connections.forEach(([i, j]) => {
        const from = nodes[i]
        const to = nodes[j]

        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)

        // Highlight line if mouse is close to either node
        const d1 = Math.sqrt((mx - from.x) ** 2 + (my - from.y) ** 2)
        const d2 = Math.sqrt((mx - to.x) ** 2 + (my - to.y) ** 2)
        if (d1 < 100 || d2 < 100) {
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)'
          ctx.lineWidth = 1.5
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
          ctx.lineWidth = 1
        }
        ctx.stroke()
      })

      // Update and draw packets
      for (let pIdx = packets.length - 1; pIdx >= 0; pIdx--) {
        const p = packets[pIdx]
        p.progress += p.speed
        if (p.progress >= 1) {
          packets.splice(pIdx, 1)
          continue
        }

        const start = nodes[p.from]
        const end = nodes[p.to]
        const px = start.x + (end.x - start.x) * p.progress
        const py = start.y + (end.y - start.y) * p.progress

        // Packet tail gradient
        ctx.beginPath()
        ctx.arc(px, py, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 229, 255, 0.85)'
        ctx.shadowColor = 'rgba(0, 229, 255, 0.6)'
        ctx.shadowBlur = 6
        ctx.fill()
        ctx.shadowBlur = 0 // reset
      }

      // Draw node spheres
      nodes.forEach((n) => {
        const dist = Math.sqrt((mx - n.x) ** 2 + (my - n.y) ** 2)
        const isHovered = dist < 70

        // Aura
        ctx.beginPath()
        ctx.arc(n.x, n.y, isHovered ? 24 : 14, 0, Math.PI * 2)
        ctx.fillStyle = isHovered ? 'rgba(0, 229, 255, 0.07)' : 'rgba(123, 47, 255, 0.03)'
        ctx.fill()

        // Outer Ring
        ctx.beginPath()
        ctx.arc(n.x, n.y, isHovered ? 14 : 9, 0, Math.PI * 2)
        ctx.strokeStyle = isHovered ? 'rgba(0, 229, 255, 0.6)' : 'rgba(123, 47, 255, 0.3)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Center Core
        ctx.beginPath()
        ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(0, 229, 255, 0.7)'
        ctx.fill()

        // Monospace text label
        const isLight = document.documentElement.classList.contains('light')
        ctx.font = 'bold 8.5px IBM Plex Mono, monospace'
        ctx.fillStyle = isHovered 
          ? (isLight ? '#4f46e5' : '#00e5ff') 
          : (isLight ? 'rgba(26, 26, 46, 0.5)' : 'rgba(255, 255, 255, 0.4)')
        ctx.textAlign = 'center'
        ctx.fillText(n.label, n.x, n.y + 24)
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="relative w-full h-[320px] rounded-2xl border border-white/5 bg-black/40 overflow-hidden backdrop-blur-md">
      {/* Background grids */}
      <div className="absolute inset-0 bg-grid-line-bg pointer-events-none opacity-20" />
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Globe size={13} className="text-cyan animate-spin" style={{ animationDuration: '6s' }} />
        <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">Interactive Network Mesh Node Topology</span>
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair" />
    </div>
  )
}

// ── Interactive Drag & Drop Preview (Section 5) ──
function TransferPlayground() {
  const [files, setFiles] = useState([
    { id: '1', name: 'peermesh-whitepaper.pdf', size: '4.8 MB', progress: 100, speed: 'Completed' },
    { id: '2', name: 'app-production-assets.zip', size: '256.4 MB', progress: 42, speed: '48.2 MB/s' }
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.progress < 100) {
          const next = f.progress + Math.floor(Math.random() * 8) + 2
          return {
            ...f,
            progress: next >= 100 ? 100 : next,
            speed: next >= 100 ? 'Completed' : `${(Math.random() * 10 + 42).toFixed(1)} MB/s`
          }
        }
        return f
      }))
    }, 800)
    return () => clearInterval(timer)
  }, [])

  const handleAddFile = () => {
    const mockFiles = [
      { name: 'webrtc-handshake-negotiation.log', size: '320 KB' },
      { name: 'avatar-hd-profile.png', size: '12.4 MB' },
      { name: 'dataset-2026-ml.parquet', size: '1.4 GB' },
      { name: 'backup-configuration-ssl.key', size: '16 KB' }
    ]
    const chosen = mockFiles[Math.floor(Math.random() * mockFiles.length)]
    const newId = (files.length + 1).toString()
    setFiles(prev => [...prev, { id: newId, name: chosen.name, size: chosen.size, progress: 0, speed: 'Initializing P2P...' }])
  }

  const handleClear = () => {
    setFiles([])
  }

  return (
    <div className="glass-card rounded-2xl border border-white/5 p-6 relative flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-white text-lg tracking-tight">Direct Transfer Playground</h4>
          <p className="text-xs text-gray-400 mt-0.5">Mock interactive workspace. Run visual tests before starting a real session.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddFile} className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 border border-white/5 hover:border-cyan/35 select-none bg-white/2">
            <Plus size={12} className="text-cyan" /> Add Mock File
          </button>
          {files.length > 0 && (
            <button onClick={handleClear} className="btn btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10">
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Drag zone mockup */}
      <div className="dropzone-idle rounded-xl border border-white/6 bg-[#040a14]/30 py-9 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan/35 hover:bg-cyan/[0.015] transition-all">
        <UploadCloud size={32} className="text-cyan/60 animate-bounce mb-3" style={{ animationDuration: '3s' }} />
        <span className="text-xs text-gray-300 font-semibold">Drag files directly here or click to browse</span>
        <span className="text-[9.5px] text-gray-500 font-mono mt-1 uppercase tracking-wider">Direct peer channel buffer routing</span>
      </div>

      {/* Upload files container */}
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {files.map(f => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/2 border border-white/4 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden"
            >
              {/* Speed / Status Overlay badge */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 max-w-[70%]">
                  <FileText size={14} className="text-indigo-400 flex-shrink-0" />
                  <span className="font-semibold text-white truncate font-mono text-[11.5px]">{f.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{f.size}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  {f.progress === 100 ? (
                    <span className="text-lime flex items-center gap-1"><CheckCircle size={10} /> Sync Complete</span>
                  ) : (
                    <span className="text-cyan animate-pulse">{f.speed}</span>
                  )}
                  <span className="text-gray-400 font-bold ml-1">{f.progress}%</span>
                </div>
              </div>

              {/* Progress Bar background */}
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-300 ${f.progress === 100 ? 'bg-gradient-to-r from-emerald-500 to-lime' : 'bg-gradient-to-r from-cyan to-indigo-500'}`}
                  style={{ width: `${f.progress}%` }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {files.length === 0 && (
          <div className="text-center py-4 text-xs text-gray-500 font-mono">
            No files queued. Click "Add Mock File" above.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Connected Peers Component (Section 6) ──
function ConnectedPeersVisualizer() {
  const [peers, setPeers] = useState([
    { name: 'client-peer-alpha-12', region: 'SG (Singapore)', lat: '1.4ms', cipher: 'AES_256_GCM', type: 'STUN Direct', status: 'connected' },
    { name: 'client-peer-west-90', region: 'US (Oregon)', lat: '48.9ms', cipher: 'AES_256_GCM', type: 'STUN Direct', status: 'connected' },
    { name: 'client-peer-euro-44', region: 'DE (Frankfurt)', lat: '124.2ms', cipher: 'AES_256_GCM', type: 'TURN Relay', status: 'connecting' }
  ])

  const addSimulatedPeer = () => {
    const list = [
      { name: 'client-peer-tokyo-88', region: 'JP (Tokyo)', lat: '28.1ms', cipher: 'AES_256_GCM', type: 'STUN Direct', status: 'connected' },
      { name: 'client-peer-syd-19', region: 'AU (Sydney)', lat: '84.0ms', cipher: 'AES_256_GCM', type: 'STUN Direct', status: 'connected' },
      { name: 'client-peer-uk-7', region: 'GB (London)', lat: '110.5ms', cipher: 'AES_256_GCM', type: 'TURN Relay', status: 'connecting' }
    ]
    const chosen = list[Math.floor(Math.random() * list.length)]
    if (peers.some(p => p.name === chosen.name)) return
    setPeers(prev => [...prev, chosen])
  }

  const deletePeer = (name) => {
    setPeers(prev => prev.filter(p => p.name !== name))
  }

  return (
    <div className="glass-card rounded-2xl border border-white/5 p-6 relative flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-white text-lg tracking-tight">Active Connected Peer Channels</h4>
          <p className="text-xs text-gray-400 mt-0.5">Encrypted WebRTC data connections mapped to current browser context.</p>
        </div>
        <button onClick={addSimulatedPeer} className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 border border-white/5 hover:border-cyan/35 select-none bg-white/2">
          <Plus size={12} className="text-cyan" /> Add Peer
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {peers.map(p => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#040810]/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-white font-mono text-xs">{p.name}</span>
                  <span className="text-[10px] text-gray-500 font-medium mt-0.5">{p.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {p.status === 'connected' ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </>
                    ) : (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </>
                    )}
                  </span>
                  <button onClick={() => deletePeer(p.name)} className="text-gray-500 hover:text-red-400 transition-colors ml-1">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-white/4 pt-3 text-[10.5px] font-mono">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-[9px] uppercase">Latency</span>
                  <span className="text-white font-bold">{p.lat}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-[9px] uppercase">Protocol</span>
                  <span className="text-cyan font-bold">{p.type}</span>
                </div>
                <div className="flex flex-col col-span-2 mt-1">
                  <span className="text-gray-500 text-[9px] uppercase">Encryption Cipher</span>
                  <span className="text-indigo-300 flex items-center gap-1"><Lock size={9} /> {p.cipher}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Live Monospace Packet Logger Terminal (Section 7) ──
function DataPacketTerminal() {
  const [logs, setLogs] = useState([
    '09:42:01.012 [SYSTEM] Initializing PeerMesh local state...',
    '09:42:01.554 [SYSTEM] Fetching STUN/TURN ICE servers...',
    '09:42:02.109 [SYSTEM] ICE config parsed successfully. Awaiting negotiation.',
    '09:42:03.488 [SIGNAL] Local SDP handshake generated.'
  ])
  const terminalRef = useRef(null)

  useEffect(() => {
    const logPool = [
      '[STATE] Local connection state: host-negotiation...',
      '[SIGNAL] STUN connection succeeded to: stun.l.google.com:19302',
      '[CRYPTO] Local ECDH key exchange validated.',
      '[CHANNEL] WebRTC RTCDataChannel initialized: label="mesh-transfer-stream"',
      '[STREAM] Sync chunk buffer generated. Length=1024b',
      '[STATS] Remote peer latency: 12ms, Jitter: 0.9ms',
      '[STATE] Tunnel status: AES_256_GCM active payload encryption.',
      '[SIGNAL] Local ICE candidates sent. Awaiting ACK.',
      '[CHANNEL] Stream buffers bound to DOM Blob chunks.'
    ]

    const interval = setInterval(() => {
      const time = new Date()
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}.${time.getMilliseconds().toString().padEnd(3, '0')}`
      const index = Math.floor(Math.random() * logPool.length)
      const selected = logPool[index]

      setLogs(prev => {
        const next = [...prev, `${timeStr} ${selected}`]
        if (next.length > 18) {
          next.shift()
        }
        return next
      })
    }, 1200)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="glass-card rounded-2xl border border-white/5 bg-black/75 p-5 relative overflow-hidden flex flex-col gap-3.5 h-[340px] font-mono">
      <div className="flex items-center justify-between border-b border-white/6 pb-3">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-cyan" />
          <span className="text-xs text-gray-200 font-bold uppercase tracking-wider">WebRTC Peer Terminal Logs</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
      </div>

      <div ref={terminalRef} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 text-[11px] text-gray-400 pr-1">
        {logs.map((log, idx) => {
          let color = 'text-gray-400'
          if (log.includes('[SYSTEM]')) color = 'text-indigo-400'
          if (log.includes('[SIGNAL]')) color = 'text-cyan'
          if (log.includes('[CRYPTO]')) color = 'text-amber-400'
          if (log.includes('[CHANNEL]')) color = 'text-lime'

          return (
            <div key={idx} className={`${color} leading-relaxed break-all`}>
              <span className="text-gray-600 mr-2">{log.slice(0, 12)}</span>
              {log.slice(13)}
            </div>
          )
        })}
      </div>

      <div className="border-t border-white/4 pt-2 flex items-center justify-between text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5"><Wifi size={10} className="text-lime animate-pulse" /> Channel Status: Listening</span>
        <span className="uppercase text-[9px]">peerjs_local_v1.0.8</span>
      </div>
    </div>
  )
}

// ── SVG Progress Circle Active Transfer Mockup (Section 8) ──
function ActiveTransferShowcase() {
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(48.2)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setSpeed(0)
          setTimeout(() => {
            setProgress(0)
            setSpeed(48.2)
          }, 2500)
          return 100
        }
        const step = Math.random() * 4 + 1
        setSpeed(parseFloat((45 + Math.random() * 7).toFixed(1)))
        return prev + step >= 100 ? 100 : prev + step
      })
    }, 250)
    return () => clearInterval(timer)
  }, [])

  // Calculate SVGs circle attributes
  const radius = 64
  const stroke = 5
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="glass-card rounded-2xl border border-white/5 p-6 flex flex-col gap-6 items-center justify-center text-center relative overflow-hidden h-[340px]">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Activity size={12} className="text-cyan animate-pulse" />
        <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">Interactive Transfer HUD</span>
      </div>

      <div className="relative flex items-center justify-center">
        {/* SVG Circular Progress */}
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 select-none">
          <circle
            stroke="rgba(255, 255, 255, 0.03)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            stroke="url(#progress-gradient)"
            fill="transparent"
            strokeWidth={stroke + 1}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#7b2fff" />
            </linearGradient>
          </defs>
        </svg>

        {/* Text Inside Ring */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white font-mono tracking-tighter">
            {Math.floor(progress)}%
          </span>
          <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider mt-0.5">
            {progress === 100 ? 'Verified' : 'Streaming'}
          </span>
        </div>
      </div>

      <div className="w-full">
        {progress === 100 ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center gap-1 text-lime"
          >
            <span className="text-sm font-bold flex items-center gap-1.5"><CheckCircle size={16} /> Complete &amp; Written</span>
            <span className="text-[10px] text-gray-400 font-mono">CRC-32 checksum integrity confirmed.</span>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-sm font-semibold text-white font-mono">{speed.toFixed(1)} MB/s</span>
            <span className="text-[10px] text-gray-400 font-mono">
              Latency: <span className="text-cyan font-bold">12 ms</span> | ETA: <span className="text-indigo-300 font-bold">{Math.ceil((100 - progress) * 0.15)}s</span>
            </span>
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-2 gap-2 border-t border-white/5 pt-4 text-[10px] font-mono text-gray-500">
        <div className="text-left">
          <span>PEERS: 2 CHANNEL</span>
        </div>
        <div className="text-right">
          <span>PORT: 51928</span>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()

  const stats = [
    {
      icon: Cpu,
      title: 'Peer-to-Peer',
      desc: 'Powered directly by WebRTC channels. Handshakes directly in the browser. Zero intermediate servers.',
      color: 'rgba(99, 102, 241, 0.4)',
    },
    {
      icon: Zap,
      title: 'No Upload Limits',
      desc: 'Bypass server bandwidth rules. Send multi-gigabyte files or directories directly at raw connection speeds.',
      color: 'rgba(6, 182, 212, 0.4)',
    },
    {
      icon: ShieldCheck,
      title: 'End-to-End Secure',
      desc: 'Standardized browser crypto wraps the data transport pipeline. Total absolute confidentiality.',
      color: 'rgba(16, 185, 129, 0.4)',
    },
    {
      icon: Activity,
      title: 'Instant Exchange',
      desc: 'Files translate directly from source buffers to download blobs without any queuing or wait buffers.',
      color: 'rgba(244, 114, 182, 0.4)',
    },
  ]

  const liveMetrics = [
    { label: 'AVG TRANSFER SPEED', value: '48.2', suffix: ' MB/s', decimals: 1 },
    { label: 'ACTIVE GLOBAL PEERS', value: '2847', suffix: '', decimals: 0 },
    { label: 'SIGNAL LATENCY', value: '12', suffix: ' ms', decimals: 0 },
    { label: 'ENCRYPTION MODE', value: 'AES-GCM', suffix: '', isStatic: true },
    { label: 'TRANSPORT PROTOCOL', value: 'WebRTC SCTP', suffix: '', isStatic: true },
    { label: 'TOTAL SYNC CHUNKS', value: '1248922', suffix: '', decimals: 0 }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="relative w-full pb-20 flex flex-col"
    >
      {/* ── Background Mesh Blobs ── */}
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-mesh-purple rounded-full filter blur-3xl -z-10 animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[450px] h-[450px] bg-mesh-cyan rounded-full filter blur-3xl -z-10 animate-pulse-slow pointer-events-none" />

      {/* ── 1. Hero Section ── */}
      <section className="relative min-h-[520px] flex items-center justify-center rounded-3xl border border-white/6 px-6 py-20 mb-16 shadow-glass-lg bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden">
        {/* WebRTC Line Visualizer in Hero Background */}
        <WebRTCVisualizer />

        <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center select-none">
          {/* Neon Header Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="badge-neon mb-6 flex items-center gap-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Direct WebRTC Core
          </motion.div>

          {/* Headline Reveal */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-tight font-head"
          >
            Transfer Files Directly. <br />
            No Servers. <span className="gradient-text font-black">No Limits.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed font-medium"
          >
            Bypass intermediate uploads. Stream files directly browser-to-browser with secure P2P encryption keys.
          </motion.p>

          {/* Magnetic CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, type: 'spring' }}
            className="mt-12 flex flex-col sm:flex-row gap-6 items-center justify-center"
          >
            <Magnetic>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(99,102,241,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/send')}
                className="btn btn-primary text-base px-10 py-4 font-bold relative overflow-hidden group select-none cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                🚀 Send Payload
              </motion.button>
            </Magnetic>

            <Magnetic>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/receive')}
                className="btn btn-ghost text-base px-10 py-4 font-bold select-none cursor-pointer border border-white/10"
              >
                📥 Connect &amp; Receive
              </motion.button>
            </Magnetic>
          </motion.div>
        </div>
      </section>

      {/* ── 2. Live Metrics Strip ── */}
      <section className="section-gap flex flex-col">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {liveMetrics.map((m, idx) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="metric-card"
            >
              <span className="metric-label">{m.label}</span>
              <div className="metric-value mt-2">
                {m.isStatic ? (
                  m.value
                ) : (
                  <AnimatedCounter value={m.value} suffix={m.suffix} decimals={m.decimals} />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 3. Interactive Network Graph Section ── */}
      <section className="section-gap flex flex-col gap-6">
        <div>
          <span className="section-label">Routing Topology</span>
          <h2 className="section-title">WebRTC Data Channel Mesh</h2>
          <p className="section-subtitle">Real-time local node mapping. Packets route directly over custom host channels bypassing corporate firewalls using STUN client descriptors.</p>
        </div>
        <InteractiveNetworkMesh />
      </section>

      {/* ── 4. Feature Cards Section ── */}
      <section className="section-gap flex flex-col gap-8">
        <div>
          <span className="section-label">Core Capabilities</span>
          <h2 className="section-title">High Performance Architecture</h2>
          <p className="section-subtitle">Designed from the ground up to support modern browsers, low-latency, and unlimited files sizes.</p>
        </div>
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((item, idx) => {
            const IconComponent = item.icon
            return (
              <TiltCard
                key={idx}
                className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-start gap-4 transition-all duration-300 relative group overflow-hidden cursor-default hover:border-indigo-500/20"
              >
                <div className="absolute inset-0 scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white border transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: item.color.replace('0.4', '0.08'),
                    borderColor: item.color,
                  }}
                >
                  <IconComponent size={22} />
                </div>

                <div>
                  <h3 className="font-bold text-white text-base tracking-tight mb-2 group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </TiltCard>
            )
          })}
        </motion.div>
      </section>

      {/* Grid of Interactive Sub-sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 section-gap">
        {/* ── 5. Send File Section ── */}
        <TransferPlayground />

        {/* ── 6. Connected Peers Section ── */}
        <ConnectedPeersVisualizer />
      </div>

      {/* Grid of Monitor and Stats HUDs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── 7. Data Packets Terminal ── */}
        <DataPacketTerminal />

        {/* ── 8. Active Transfer Showcase ── */}
        <ActiveTransferShowcase />
      </div>
    </motion.div>
  )
}
