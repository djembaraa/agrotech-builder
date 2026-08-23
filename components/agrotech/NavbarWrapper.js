'use client'
import Navbar from './Navbar'

export default function NavbarWrapper({ profile }) {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }
  return <Navbar profile={profile} onLogout={handleLogout} />
}
