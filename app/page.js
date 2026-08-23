'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthScreen from '@/components/agrotech/AuthScreen'
import Navbar from '@/components/agrotech/Navbar'
import BottomNav from '@/components/agrotech/BottomNav'
import Dashboard from '@/components/agrotech/Dashboard'
import Cycles from '@/components/agrotech/Cycles'
import Calculator from '@/components/agrotech/Calculator'
import Community from '@/components/agrotech/Community'
import Profile from '@/components/agrotech/Profile'
import AIChatWidget from '@/components/agrotech/AIChatWidget'
import { Loader2 } from 'lucide-react'

function App() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [navParams, setNavParams] = useState({})

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setProfile(data.profile)
      } else {
        setUser(null)
        setProfile(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1]?.split('&')[0]
      const intent = window.localStorage.getItem('google_auth_intent')
      window.localStorage.removeItem('google_auth_intent')
      if (sessionId) {
        const endpoint = intent === 'link' ? '/api/profile/link-google' : '/api/auth/google-session'
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        })
          .catch(() => {})
          .finally(() => {
            window.history.replaceState(null, '', window.location.pathname)
            if (intent === 'link') setTab('profil')
            checkAuth()
          })
        return
      }
    }
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (user && tab === 'profil') {
      fetch('/api/profile/stats').then(r => r.json()).then(d => setStats(d.stats)).catch(() => {})
    }
  }, [user, tab])

  const handleNavigate = (key, extra = {}) => {
    setTab(key)
    setNavParams(extra)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setProfile(null)
    setTab('dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onSuccess={checkAuth} />
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar profile={profile} onLogout={handleLogout} />
      <main>
        {tab === 'dashboard' && <Dashboard profile={profile} onNavigate={handleNavigate} />}
        {tab === 'siklus' && (
          <Cycles
            userId={user.id}
            autoOpenCreate={navParams.openCreate}
            autoOpenId={navParams.openId}
            onConsumeAutoOpen={() => setNavParams({})}
          />
        )}
        {tab === 'kalkulator' && <Calculator />}
        {tab === 'komunitas' && <Community userId={user.id} profile={profile} />}
        {tab === 'profil' && (
          <Profile
            user={user}
            profile={profile}
            stats={stats}
            onProfileUpdated={setProfile}
            onLogout={handleLogout}
          />
        )}
      </main>
      <AIChatWidget />
      <BottomNav active={tab} onChange={handleNavigate} />
    </div>
  )
}

export default App;
