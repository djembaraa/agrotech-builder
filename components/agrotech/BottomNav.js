'use client'

import { Home, Leaf, Calculator, Users, User } from 'lucide-react'

const ITEMS = [
  { key: 'dashboard', label: 'Beranda', icon: Home },
  { key: 'siklus', label: 'Siklus', icon: Leaf },
  { key: 'kalkulator', label: 'Kalkulator', icon: Calculator },
  { key: 'komunitas', label: 'Komunitas', icon: Users },
  { key: 'profil', label: 'Profil', icon: User },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm rounded-[2rem] bg-white/90 backdrop-blur-md shadow-[0_8px_32px_rgba(42,75,45,0.12)] border border-white/40 px-3 py-2">
      <div className="flex flex-row items-center justify-between">
        {ITEMS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => onChange(key)}
            className="flex-1 flex flex-col items-center justify-center p-2 relative group">
            <div className={`relative z-10 w-12 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${active === key ? 'bg-eco-600' : 'bg-transparent group-hover:bg-eco-50'}`}>
              <Icon className={`w-5 h-5 transition-colors ${active === key ? 'text-white' : 'text-stone-400'}`} />
            </div>
            {/* Optional label indicator */}
            {active === key && (
              <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-eco-600" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
