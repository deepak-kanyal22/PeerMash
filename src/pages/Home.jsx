import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home(){
  const nav = useNavigate()
  return (
    <section className="py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight">PeerMesh</h1>
          <p className="mt-4 text-lg text-gray-300 max-w-xl">Direct Browser-to-Browser File Transfer</p>

          <div className="mt-8 flex gap-4">
            <button onClick={()=>nav('/send')} className="btn bg-indigo-600 hover:bg-indigo-500">Send File</button>
            <button onClick={()=>nav('/receive')} className="btn bg-white/6 hover:bg-white/8">Receive File</button>
          </div>
        </div>

        <div className="p-8 glass rounded-xl shadow-lg">
          <div className="h-64 flex items-center justify-center text-center text-gray-200">
            <div>
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4 opacity-90">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="url(#g)" strokeWidth="1.5"/>
                <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div className="text-sm text-gray-300">Secure, instant transfers — no server needed</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
