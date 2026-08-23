'use client'
import { useRouter } from 'next/navigation'
import Dashboard from './Dashboard'

export default function DashboardWrapper({ profile }) {
  const router = useRouter()
  const handleNavigate = (key, extra = {}) => {
    const params = new URLSearchParams()
    if (extra.openCreate) params.set('openCreate', 'true')
    if (extra.openId) params.set('openId', extra.openId)
    const qs = params.toString() ? '?' + params.toString() : ''
    
    if (key === 'dashboard') router.push('/dashboard' + qs)
    else router.push('/' + key + qs)
  }
  return <Dashboard profile={profile} onNavigate={handleNavigate} />
}
