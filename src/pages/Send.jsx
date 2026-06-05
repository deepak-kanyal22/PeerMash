import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePeer } from '../context/PeerContext'
import JSZip from 'jszip'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

export default function Send() {
  const { selectedFile, setSelectedFile, roomId, status, errorMsg, generateRoom } = usePeer()
  const navigate  = useNavigate()
  const inputRef  = useRef(null)
  const folderInputRef = useRef(null)
  const dropRef   = useRef(null)

  const [selectedFiles, setSelectedFiles] = useState([])
  const [isZipping, setIsZipping] = useState(false)

  // Auto-navigate to progress once transfer starts
  useEffect(() => {
    if (status === 'transferring') navigate('/progress')
  }, [status, navigate])

  const onDrop = (e) => {
    e.preventDefault()
    dropRef.current.classList.remove('border-indigo-500', 'bg-indigo-600/5')
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setSelectedFiles(files)
    }
  }

  const onDragOver = (e) => {
    e.preventDefault()
    dropRef.current.classList.add('border-indigo-500', 'bg-indigo-600/5')
  }

  const onDragLeave = () => {
    dropRef.current.classList.remove('border-indigo-500', 'bg-indigo-600/5')
  }

  const copyRoom = () => {
    navigator.clipboard.writeText(roomId)
  }

  const handleGenerateRoom = async () => {
    if (selectedFiles.length === 0) return

    if (selectedFiles.length === 1) {
      setSelectedFile(selectedFiles[0])
      generateRoom()
    } else {
      setIsZipping(true)
      try {
        const zip = new JSZip()
        selectedFiles.forEach((file) => {
          const path = file.webkitRelativePath || file.name
          zip.file(path, file)
        })
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const zipFile = new File([zipBlob], 'peermesh-transfer.zip', {
          type: 'application/zip',
          lastModified: Date.now()
        })
        setSelectedFile(zipFile)
        generateRoom()
      } catch (err) {
        console.error('Failed to create zip', err)
      } finally {
        setIsZipping(false)
      }
    }
  }

  const statusLabel = {
    idle:               null,
    waiting:            '⏳ Waiting for receiver to connect…',
    connecting:         '🔗 Receiver found — establishing connection…',
    awaiting_approval:  '🛡️ Waiting for receiver to accept the file…',
    error:              null,
  }[status]

  return (
    <section className="py-10 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Send File</h2>

      <div className="glass p-8 rounded-xl border border-white/6 space-y-6">

        {/* ── Drop Zone ── */}
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-600/5"
        >
          <div className="text-5xl mb-3">📁</div>
          <div className="text-lg font-medium mb-4">Drag &amp; drop files/folders here</div>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={() => inputRef.current.click()}
              className="btn bg-white/6 hover:bg-white/10 text-sm px-4 py-2"
            >
              Browse Files
            </button>
            <button
              onClick={() => folderInputRef.current.click()}
              className="btn bg-white/6 hover:bg-white/10 text-sm px-4 py-2"
            >
              Browse Folder
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files)
              if (files.length > 0) setSelectedFiles(files)
            }}
          />

          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files)
              if (files.length > 0) setSelectedFiles(files)
            }}
          />
        </div>

        {/* ── Selected Files List ── */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Selected {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}</span>
              <button 
                onClick={() => {
                  setSelectedFiles([])
                  setSelectedFile(null)
                }} 
                className="text-red-400 hover:text-red-300 text-xs"
              >
                Clear All
              </button>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/6 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">📄</span>
                    <span className="truncate font-medium text-gray-200">
                      {file.webkitRelativePath || file.name}
                    </span>
                  </div>
                  <span className="text-gray-400 shrink-0 ml-2">{formatBytes(file.size)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-indigo-600/10 border border-indigo-500/20">
              <div className="flex items-center gap-3">
                <span className="text-lg">🗂️</span>
                <div>
                  <div className="font-semibold text-white">Total Combined Size</div>
                  <div className="text-xs text-gray-400">
                    {selectedFiles.length > 1 ? 'Will be bundled as a .zip file' : 'Direct transfer'}
                  </div>
                </div>
              </div>
              <div className="text-lg font-bold text-indigo-300">
                {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
              </div>
            </div>
          </div>
        )}

        {/* ── Room ID + Generate ── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 p-4 rounded-lg bg-white/3 border border-white/6">
            <div className="text-xs text-gray-400 mb-1">Room ID</div>
            <div className="font-mono text-lg tracking-widest">
              {roomId || '— — — —'}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleGenerateRoom}
              disabled={selectedFiles.length === 0 || isZipping || status === 'waiting' || status === 'connecting' || status === 'awaiting_approval'}
              className="btn bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isZipping ? 'Zipping…' : status === 'awaiting_approval' ? 'Awaiting approval…' : (status === 'waiting' || status === 'connecting' ? 'Waiting…' : 'Generate Room')}
            </button>

            {roomId && (
              <button
                onClick={copyRoom}
                className="btn bg-white/6 hover:bg-white/10 text-sm"
              >
                Copy ID
              </button>
            )}
          </div>
        </div>

        {/* ── Status Banner ── */}
        {statusLabel && (
          <div className="p-3 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-sm text-indigo-300 text-center animate-pulse">
            {statusLabel}
          </div>
        )}

        {/* ── Error Banner ── */}
        {status === 'error' && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── Help tip ── */}
        {selectedFiles.length === 0 && (
          <p className="text-center text-xs text-gray-500">
            Select files or a folder first, then generate a Room ID to share with the receiver.
          </p>
        )}
      </div>
    </section>
  )
}
