import React from 'react'

export default function Receive(){
  return (
    <section className="py-10 flex items-center justify-center">
      <div className="w-full max-w-md glass rounded-xl p-8 text-center">
        <h3 className="text-xl font-semibold">Receive File</h3>
        <p className="text-sm text-gray-300 mt-2">Enter a Room ID to connect to the sender</p>

        <div className="mt-6">
          <input placeholder="Enter Room ID" className="w-full p-3 rounded-md bg-transparent border border-white/6 text-gray-100" />
          <button className="btn mt-4 w-full bg-indigo-600">Connect</button>
        </div>

        <div className="mt-8">
          <div className="p-6 bg-white/3 rounded-lg">
            <div className="text-4xl">⏳</div>
            <div className="mt-2 text-sm text-gray-300">Waiting for sender...</div>
          </div>
        </div>
      </div>
    </section>
  )
}
