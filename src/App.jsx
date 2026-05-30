import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Send from './pages/Send'
import Receive from './pages/Receive'
import Progress from './pages/Progress'
import NavBar from './components/NavBar'

export default function App(){
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05060a] to-[#0b1020]">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/send" element={<Send/>} />
          <Route path="/receive" element={<Receive/>} />
          <Route path="/progress" element={<Progress/>} />
        </Routes>
      </main>
    </div>
  )
}
