'use client'

import { Leaf, LogOut } from 'lucide-react'

export default function Navbar({ profile, onLogout }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur shadow-sm">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-montserrat font-bold text-stone-800 text-lg">Agrotech Tracker</span>
        </div>
        <button onClick={onLogout} className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center">
          <LogOut className="w-4 h-4 text-stone-500" />
        </button>
      </div>
    </header>
  )
}
