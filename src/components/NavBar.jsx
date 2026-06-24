import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePeer } from '../context/PeerContext'
import { useTheme } from '../context/ThemeContext'
import { Home, Send, Download, Activity, Sun, Moon } from 'lucide-react'

export default function NavBar() {
  const { status } = usePeer()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const hasActiveTransfer = status && status !== 'idle'

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/send', label: 'Send', icon: Send },
    { path: '/receive', label: 'Receive', icon: Download },
  ]

  if (hasActiveTransfer) {
    navItems.push({ path: '/progress', label: 'Status', icon: Activity })
  }

  return (
    <header className="sticky top-4 z-50 w-full max-w-4xl mx-auto px-4 select-none">
      <div className="glass-nav rounded-2xl border border-white/8 backdrop-blur-xl py-3 px-5 flex items-center justify-between shadow-lg shadow-black/40">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white-force shadow-glow-sm group-hover:scale-105 transition-transform duration-300">
            P
          </div>
          <span className={`text-xl font-bold tracking-tight group-hover:text-indigo-300 transition-colors duration-200 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Peer<span className="gradient-text font-extrabold">Mesh</span>
          </span>
        </NavLink>

        <nav className="flex items-center gap-1.5 bg-white/3 p-1 rounded-xl border border-white/5 relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const isProgressTab = item.path === '/progress'
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 outline-none flex items-center gap-2 group ${
                    isActive
                      ? 'text-indigo-600 dark:text-white font-bold'
                      : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/3'
                  }`
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-white/8 border border-white/10 rounded-lg -z-10 shadow-sm shadow-indigo-500/5"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                {/* Animated Lucide Icon */}
                <motion.div
                  whileHover={{ scale: 1.18, rotate: 10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  className="relative shrink-0 flex items-center justify-center group-hover:text-indigo-400 transition-colors duration-250"
                >
                  <Icon size={16} />
                  {isProgressTab && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                    </span>
                  )}
                </motion.div>
                
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            )
          })}

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="ml-1 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>
        </nav>
      </div>
    </header>
  )
}
