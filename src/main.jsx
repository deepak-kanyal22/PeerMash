import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { PeerProvider } from './context/PeerContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PeerProvider>
          <App />
        </PeerProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
