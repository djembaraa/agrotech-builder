'use client'
import AuthScreen from '@/components/agrotech/AuthScreen'

export default function LoginPage() {
  return <AuthScreen onSuccess={() => window.location.href = '/dashboard'} />
}
