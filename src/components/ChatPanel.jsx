import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Wifi, WifiOff, Lock, ShieldCheck } from 'lucide-react'
import { usePeer } from '../context/PeerContext'

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ─── Portal wrapper — renders children directly to document.body ────────────
function Portal({ children }) {
  const el = useRef(document.createElement('div'))
  useEffect(() => {
    const node = el.current
    document.body.appendChild(node)
    return () => document.body.removeChild(node)
  }, [])
  return createPortal(children, el.current)
}

export default function ChatPanel({ isOpen, onToggle }) {
  const { messages, chatReady, sendMessage, role } = usePeer()
  const [input, setInput]   = useState('')
  const [unread, setUnread] = useState(0)
  const bottomRef           = useRef(null)
  const inputRef            = useRef(null)
  const textareaRef         = useRef(null)
  const prevLenRef          = useRef(0)

  // Track unread when panel is closed
  useEffect(() => {
    if (!isOpen && messages.length > prevLenRef.current) {
      const newMsgs = messages.slice(prevLenRef.current)
      const incoming = newMsgs.filter(m => m.from !== role)
      if (incoming.length > 0) setUnread(u => u + incoming.length)
    }
    prevLenRef.current = messages.length
  }, [messages, isOpen, role])

  // Clear unread & focus on open
  useEffect(() => {
    if (isOpen) {
      setUnread(0)
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const handleSend = () => {
    if (!input.trim() || !chatReady) return
    sendMessage(input)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
  }

  return (
    <>
      {/* ── Toggle Button (rendered in-place) ─────────────────────── */}
      <button
        onClick={onToggle}
        id="chat-toggle-btn"
        title="Toggle Chat"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '6px 12px',
          borderRadius: '10px',
          fontFamily: 'var(--ff-mono)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          fontWeight: 600,
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          transition: 'all 0.2s',
          background: isOpen
            ? 'rgba(0,229,255,0.12)'
            : 'rgba(0,229,255,0.06)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: isOpen ? 'rgba(0,229,255,0.3)' : 'rgba(0,229,255,0.15)',
          color: 'rgba(0,229,255,0.85)',
          boxShadow: isOpen ? '0 0 18px rgba(0,229,255,0.2)' : 'none',
        }}
      >
        <MessageSquare size={12} />
        CHAT
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
          background: chatReady ? '#39ff14' : '#facc15',
          boxShadow: chatReady ? '0 0 6px rgba(57,255,20,0.9)' : '0 0 6px rgba(250,204,21,0.7)',
        }} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-8px', right: '-8px',
            minWidth: '18px', height: '18px', padding: '0 4px',
            borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--ff-mono)', fontSize: '9px', fontWeight: 800,
            background: '#00e5ff', color: '#020408',
            boxShadow: '0 0 12px rgba(0,229,255,0.8)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Portal: Backdrop + Drawer ─────────────────────────────── */}
      <Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="chat-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onClick={onToggle}
                style={{
                  position: 'fixed', inset: 0, zIndex: 9000,
                  background: 'rgba(2,4,8,0.6)',
                  backdropFilter: 'blur(5px)',
                }}
              />

              {/* Drawer */}
              <motion.aside
                key="chat-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 310, damping: 33 }}
                style={{
                  position: 'fixed', top: 0, right: 0,
                  width: '400px',
                  height: '100%',
                  zIndex: 9001,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(3,6,12,0.97)',
                  backdropFilter: 'blur(40px)',
                  borderLeft: '1px solid rgba(0,229,255,0.1)',
                  boxShadow: '-32px 0 80px rgba(0,0,0,0.9)',
                }}
              >
                {/* Neon top accent */}
                <div style={{
                  height: '2px', flexShrink: 0,
                  background: 'linear-gradient(90deg, transparent, #00e5ff 30%, #7b2fff 70%, transparent)',
                  boxShadow: '0 0 24px rgba(0,229,255,0.5)',
                }} />

                {/* ── Header ──────────────────────────────────────────── */}
                <div style={{
                  flexShrink: 0,
                  padding: '18px 20px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: 'linear-gradient(180deg, rgba(0,229,255,0.025) 0%, transparent 100%)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Icon */}
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(123,47,255,0.1))',
                        border: '1px solid rgba(0,229,255,0.18)',
                        boxShadow: '0 0 16px rgba(0,229,255,0.08)',
                      }}>
                        <MessageSquare size={17} color="rgba(0,229,255,0.85)" />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--ff-head)', fontWeight: 700, fontSize: '15px', color: '#fff', letterSpacing: '-0.01em' }}>
                          Live Chat
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                          {chatReady ? (
                            <>
                              <Wifi size={8} color="rgba(57,255,20,0.85)" />
                              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(57,255,20,0.75)' }}>PEER CONNECTED</span>
                            </>
                          ) : (
                            <>
                              <WifiOff size={8} color="rgba(250,204,21,0.75)" />
                              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(250,204,21,0.65)' }}>
                                ESTABLISHING…
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Close */}
                    <button
                      onClick={onToggle}
                      style={{
                        width: '32px', height: '32px', borderRadius: '9px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                        color: '#4a6278', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' })}
                      onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)', color: '#4a6278' })}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* E2E badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    marginTop: '12px', padding: '4px 10px', borderRadius: '999px',
                    background: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.1)',
                  }}>
                    <ShieldCheck size={9} color="rgba(57,255,20,0.55)" />
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(57,255,20,0.5)' }}>
                      END-TO-END ENCRYPTED · P2P DIRECT
                    </span>
                  </div>
                </div>

                {/* ── Messages ────────────────────────────────────────── */}
                <div
                  id="chat-messages"
                  style={{
                    flex: 1, minHeight: 0, overflowY: 'auto',
                    padding: '20px',
                    display: 'flex', flexDirection: 'column', gap: '14px',
                  }}
                >
                  {messages.length === 0 && (
                    <div style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: '14px', textAlign: 'center', padding: '40px 20px',
                    }}>
                      <div style={{
                        width: '60px', height: '60px', borderRadius: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(0,229,255,0.07), rgba(123,47,255,0.07))',
                        border: '1px solid rgba(0,229,255,0.1)',
                      }}>
                        <MessageSquare size={24} color="rgba(0,229,255,0.2)" />
                      </div>
                      <div>
                        <p style={{ fontFamily: 'var(--ff-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(74,98,120,0.8)', marginBottom: '6px' }}>NO MESSAGES YET</p>
                        <p style={{ fontSize: '12px', color: 'rgba(74,98,120,0.5)' }}>Say hi to your peer! 👋</p>
                      </div>
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => {
                      const isMe = msg.from === role
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '3px' }}
                        >
                          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', letterSpacing: '0.12em', color: isMe ? 'rgba(0,229,255,0.4)' : 'rgba(123,47,255,0.55)', padding: '0 4px' }}>
                            {isMe ? 'YOU' : 'PEER'}
                          </span>
                          <div style={{
                            maxWidth: '82%', padding: '10px 14px',
                            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            fontSize: '13px', lineHeight: 1.55, wordBreak: 'break-word',
                            ...(isMe ? {
                              background: 'linear-gradient(135deg, rgba(0,229,255,0.14), rgba(0,180,216,0.1))',
                              border: '1px solid rgba(0,229,255,0.2)',
                              color: '#dde8f5',
                              boxShadow: '0 2px 16px rgba(0,229,255,0.07)',
                            } : {
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: '#94a3b8',
                            }),
                          }}>
                            {msg.text}
                          </div>
                          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', color: 'rgba(74,98,120,0.55)', padding: '0 4px' }}>
                            {formatTime(msg.ts)}
                          </span>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>

                  <div ref={bottomRef} />
                </div>

                {/* ── Input ───────────────────────────────────────────── */}
                <div style={{
                  flexShrink: 0,
                  padding: '14px 20px 18px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(0,0,0,0.25)',
                }}>
                  {!chatReady ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '14px', borderRadius: '14px',
                      background: 'rgba(250,204,21,0.04)', border: '1px solid rgba(250,204,21,0.1)',
                    }}>
                      {[0, 1, 2].map(i => (
                        <motion.span key={i}
                          style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(250,204,21,0.6)' }}
                          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(250,204,21,0.55)' }}>
                        WAITING FOR PEER
                      </span>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                        <textarea
                          ref={textareaRef}
                          id="chat-input"
                          rows={1}
                          value={input}
                          onChange={handleTextareaChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Type a message…"
                          maxLength={500}
                          style={{
                            flex: 1, padding: '11px 14px', borderRadius: '14px',
                            resize: 'none', outline: 'none', overflow: 'hidden',
                            fontSize: '13px', lineHeight: '1.5',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#dde8f5', fontFamily: 'var(--ff-body)',
                            transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                            caretColor: '#00e5ff',
                          }}
                          onFocus={e => Object.assign(e.target.style, { borderColor: 'rgba(0,229,255,0.35)', background: 'rgba(0,229,255,0.03)', boxShadow: '0 0 0 3px rgba(0,229,255,0.07)' })}
                          onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', boxShadow: 'none' })}
                        />
                        <motion.button
                          id="chat-send-btn"
                          onClick={handleSend}
                          disabled={!input.trim()}
                          whileHover={input.trim() ? { scale: 1.1 } : {}}
                          whileTap={input.trim() ? { scale: 0.9 } : {}}
                          style={{
                            width: '42px', height: '42px', borderRadius: '13px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: input.trim() ? 'pointer' : 'not-allowed',
                            opacity: input.trim() ? 1 : 0.3,
                            border: '1px solid rgba(0,229,255,0.2)',
                            transition: 'all 0.2s',
                            background: input.trim()
                              ? 'linear-gradient(135deg, #00e5ff, #00b4d8)'
                              : 'rgba(255,255,255,0.04)',
                            boxShadow: input.trim() ? '0 0 20px rgba(0,229,255,0.4)' : 'none',
                          }}
                        >
                          <Send size={15} color={input.trim() ? '#020408' : '#4a6278'} />
                        </motion.button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', letterSpacing: '0.06em', color: 'rgba(74,98,120,0.45)' }}>
                          ↵ ENTER TO SEND
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={8} color="rgba(57,255,20,0.4)" />
                          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', letterSpacing: '0.06em', color: 'rgba(57,255,20,0.4)' }}>E2E ENCRYPTED</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </>
  )
}
