require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const { ExpressPeerServer } = require('peer')

const app  = express()
const PORT = process.env.PORT || 9000
const HOST = process.env.HOST || '0.0.0.0'

// ─── CORS ──────────────────────────────────────────────────────────────────
// Allow the Vite dev server and any production domain you deploy to
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. curl, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  methods: ['GET', 'POST'],
}))

// ─── HEALTH CHECK ───────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status : 'ok',
    service: 'PeerMash Signaling Server',
    version: '1.0.0',
  })
})

// ─── HTTP SERVER ────────────────────────────────────────────────────────────
const server = app.listen(PORT, HOST, () => {
  console.log(`\n🚀 PeerMash Signaling Server running at http://${HOST}:${PORT}`)
  console.log(`   Peers connect via: ws://${HOST}:${PORT}/peerjs\n`)
})

// ─── PEERJS SIGNALING ───────────────────────────────────────────────────────
const peerServer = ExpressPeerServer(server, {
  path       : '/',       // ExpressPeerServer handles its own sub-path
  allow_discovery: false, // don't expose /peers list publicly
})

app.use('/peerjs', peerServer)

// ─── PEER EVENTS (for logging / monitoring) ─────────────────────────────────
peerServer.on('connection', (client) => {
  console.log(`[+] Peer connected:    ${client.getId()}`)
})

peerServer.on('disconnect', (client) => {
  console.log(`[-] Peer disconnected: ${client.getId()}`)
})

// ─── GRACEFUL SHUTDOWN ──────────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down signaling server...')
  server.close(() => {
    console.log('   Server closed. Goodbye!')
    process.exit(0)
  })
})
