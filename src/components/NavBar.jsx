import React from 'react'
import { NavLink } from 'react-router-dom'

const Link = ({to, children}) => (
  <NavLink
    to={to}
    className={({isActive}) => `px-3 py-2 rounded-md text-sm ${isActive? 'bg-white/6' : 'hover:bg-white/3'}`}
  >
    {children}
  </NavLink>
)

export default function NavBar(){
  return (
    <header className="w-full border-b border-white/6">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-semibold tracking-tight">PeerMesh</div>
        <nav className="flex items-center gap-2">
          <Link to="/">Home</Link>
          <Link to="/send">Send</Link>
          <Link to="/receive">Receive</Link>
          <Link to="/progress">Progress</Link>
        </nav>
      </div>
    </header>
  )
}
