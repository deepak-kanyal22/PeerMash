import React from 'react'

function FileCard(){
  return (
    <div className="mt-4 p-4 bg-white/3 rounded-lg glass-strong flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600 rounded flex items-center justify-center">📄</div>
        <div>
          <div className="font-medium">mock-image.png</div>
          <div className="text-sm text-gray-300">1.2 MB</div>
        </div>
      </div>
      <div className="text-sm text-gray-300">Ready</div>
    </div>
  )
}

export default function Send(){
  return (
    <section className="py-10 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Send File</h2>

      <div className="glass p-8 rounded-xl border border-white/6">
        <div className="border-2 border-dashed border-white/6 rounded-lg p-12 text-center">
          <div className="text-6xl">⬆️</div>
          <div className="mt-4 text-lg">Drag & drop your file here</div>
          <div className="mt-6">
            <button className="btn bg-indigo-600">Select File</button>
          </div>
        </div>

        <FileCard />

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="p-4 glass rounded-lg">
            <div className="text-xs text-gray-300">Room ID</div>
            <div className="font-mono mt-1">ABCD-1234</div>
          </div>
          <div>
            <button className="btn bg-white/6">Generate Room</button>
          </div>
        </div>
      </div>
    </section>
  )
}
