import React from 'react'

export default function Progress(){
  const progress = 64
  return (
    <section className="py-10 flex items-center justify-center">
      <div className="w-full max-w-lg glass rounded-xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-300">Transferring</div>
            <div className="font-medium">mock-image.png</div>
          </div>
          <div className="text-sm text-gray-300">64% <span className="ml-2 inline-block px-2 py-1 text-xs bg-white/6 rounded-full">Sending</span></div>
        </div>

        <div className="mt-6">
          <div className="w-full h-3 bg-white/6 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{width: `${progress}%`}}></div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <div className="text-xs">Speed</div>
            <div className="font-medium">1.2 MB/s</div>
          </div>
          <div>
            <div className="text-xs">Time left</div>
            <div className="font-medium">00:00:12</div>
          </div>
        </div>
      </div>
    </section>
  )
}
