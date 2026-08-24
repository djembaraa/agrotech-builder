'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Leaf, Loader2 } from 'lucide-react'

export default function AuthScreen({ onSuccess }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser')
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')
      onSuccess()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-stone-50 to-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md mb-3">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-montserrat text-2xl font-bold text-stone-800">Agrotech Tracker</h1>
          <p className="text-stone-500 text-sm mt-1 text-center">Kelola budidaya maggot BSF dengan mudah</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex flex-row gap-2 mb-6 bg-stone-100 rounded-xl p-1">
            <button type="button" onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500'}`}>
              Masuk
            </button>
            <button type="button" onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500'}`}>
              Daftar
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <Label className="text-stone-600 text-xs">Nama Lengkap</Label>
                <Input required placeholder="Nama Anda" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="rounded-xl border-0 bg-stone-100 focus-visible:ring-emerald-500" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-stone-600 text-xs">Email</Label>
              <Input required type="email" placeholder="nama@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="rounded-xl border-0 bg-stone-100 focus-visible:ring-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-stone-600 text-xs">Password</Label>
              <Input required type="password" minLength={6} placeholder="Minimal 6 karakter" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="rounded-xl border-0 bg-stone-100 focus-visible:ring-emerald-500" />
            </div>
            {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'login' ? 'Masuk' : 'Daftar Sekarang')}
            </Button>
          </form>

          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400">atau</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <button type="button" onClick={handleGoogleLogin}
            className="w-full flex flex-row items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold transition-colors">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C41.977 35.606 44 30.267 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Lanjutkan dengan Google
          </button>
        </div>
      </div>
    </div>
  )
}
