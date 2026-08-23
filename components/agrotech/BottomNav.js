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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="max-w-lg mx-auto flex flex-row items-stretch justify-between px-2">
        {ITEMS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => onChange(key)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${active === key ? 'bg-emerald-100' : ''}`}>
              <Icon className={`w-5 h-5 ${active === key ? 'text-emerald-600' : 'text-stone-400'}`} />
            </div>
            <span className={`text-[10px] font-medium ${active === key ? 'text-emerald-700' : 'text-stone-400'}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
