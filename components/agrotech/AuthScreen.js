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
    <div className="min-h-screen bg-gradient-to-b from-[#E8F0E5] via-[#F9FBF9] to-[#F9FBF9] flex items-center justify-center px-5">
      <div className="w-full max-w-sm relative">
        <div className="absolute -left-6 -top-6 w-32 h-32 bg-eco-200 rounded-full blur-2xl opacity-50"></div>
        <div className="absolute -right-6 bottom-0 w-32 h-32 bg-amber-100 rounded-full blur-2xl opacity-50"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-eco-500 to-eco-700 flex items-center justify-center shadow-lg shadow-eco-500/30 mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-eco-900">Agrotech Tracker</h1>
          <p className="text-eco-600 text-sm mt-1 text-center font-medium">Kelola budidaya maggot BSF dengan mudah</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 relative z-10 border border-white">
          <div className="flex flex-row gap-2 mb-6 bg-stone-50 rounded-2xl p-1 border border-stone-100">
            <button type="button" onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-[1.2rem] text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-eco-700 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>
              Masuk
            </button>
            <button type="button" onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-[1.2rem] text-sm font-bold transition-all ${mode === 'register' ? 'bg-white text-eco-700 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>
              Daftar
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <Label className="text-stone-500 text-xs font-semibold">Nama Lengkap</Label>
                <Input required placeholder="Nama Anda" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="rounded-2xl border-0 bg-stone-50 focus-visible:ring-eco-500 h-12 px-4" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-stone-500 text-xs font-semibold">Email</Label>
              <Input required type="email" placeholder="nama@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="rounded-2xl border-0 bg-stone-50 focus-visible:ring-eco-500 h-12 px-4" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-stone-500 text-xs font-semibold">Password</Label>
              <Input required type="password" minLength={6} placeholder="Minimal 6 karakter" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="rounded-2xl border-0 bg-stone-50 focus-visible:ring-eco-500 h-12 px-4" />
            </div>
            {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-2xl px-4 py-3">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-eco-600 hover:bg-eco-700 text-white rounded-2xl h-12 shadow-lg shadow-eco-600/20 mt-2 text-sm font-bold transition-transform active:scale-95">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'login' ? 'Masuk' : 'Daftar Sekarang')}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-stone-100" />
            <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider">atau</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>

          <button type="button" onClick={handleGoogleLogin}
            className="w-full flex flex-row items-center justify-center gap-3 h-12 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-bold transition-all active:scale-95">
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C41.977 35.606 44 30.267 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Lanjutkan dengan Google
          </button>
        </div>
      </div>
    </div>
  )
}
