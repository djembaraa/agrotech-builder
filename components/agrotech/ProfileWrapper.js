'use client'
import { useState } from 'react'
import Profile from './Profile'

export default function ProfileWrapper({ user, profile: initialProfile, stats }) {
  const [profile, setProfile] = useState(initialProfile)
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }
  return <Profile user={user} profile={profile} stats={stats} onProfileUpdated={setProfile} onLogout={handleLogout} />
}
