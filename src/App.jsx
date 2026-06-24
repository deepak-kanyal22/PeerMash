import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Send from './pages/Send'
import Receive from './pages/Receive'
import Progress from './pages/Progress'
import NavBar from './components/NavBar'
import AnimatedBackground from './components/AnimatedBackground'
import { useTheme } from './context/ThemeContext'

export default function App(){
  const location = useLocation()
  const { theme } = useTheme()
  return (
    <div className={`min-h-screen text-gray-100 flex flex-col relative overflow-hidden ${
      theme === 'dark'
        ? 'bg-gradient-to-b from-[#05060a] to-[#0b1020]'
        : 'bg-gradient-to-b from-gray-100 to-gray-200 text-gray-900'
    }`}>
      {theme === 'dark' && <AnimatedBackground />}
      <div className="noise-overlay" />
      <NavBar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 relative z-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home/>} />
            <Route path="/send" element={<Send/>} />
            <Route path="/receive" element={<Receive/>} />
            <Route path="/progress" element={<Progress/>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
