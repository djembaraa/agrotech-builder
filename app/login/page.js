'use client'
import { useEffect } from 'react'
import AuthScreen from '@/components/agrotech/AuthScreen'

export default function LoginPage() {
  // Handle google auth link back
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
            window.location.href = intent === 'link' ? '/profil' : '/dashboard'
          })
      }
    }
  }, [])

  return <AuthScreen onSuccess={() => window.location.href = '/dashboard'} />
}
