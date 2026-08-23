'use client'
import { usePathname, useRouter } from 'next/navigation'
import BottomNav from './BottomNav'

export default function BottomNavWrapper() {
  const pathname = usePathname()
  const router = useRouter()
  
  let active = 'dashboard'
  if (pathname.includes('/siklus')) active = 'siklus'
  if (pathname.includes('/kalkulator')) active = 'kalkulator'
  if (pathname.includes('/komunitas')) active = 'komunitas'
  if (pathname.includes('/profil')) active = 'profil'

  const handleChange = (key) => {
    if (key === 'dashboard') router.push('/dashboard')
    else router.push('/' + key)
  }

  return <BottomNav active={active} onChange={handleChange} />
}
