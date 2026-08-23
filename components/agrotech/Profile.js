'use client'

import { useState } from 'react'
import { Camera, Loader2, LogOut, Link2, CheckCircle2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

async function uploadAvatar(file, userId) {
  const supabase = getSupabaseBrowserClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export default function Profile({ user, profile, stats, onProfileUpdated, onLogout }) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: fullName, bio, profile_photo_url: profile?.profile_photo_url }) })
      const data = await res.json()
      if (res.ok) onProfileUpdated(data.profile)
    } finally { setSaving(false) }
  }

  const changePhoto = async (file) => {
    setUploading(true)
    try {
      const url = await uploadAvatar(file, user.id)
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: fullName, bio, profile_photo_url: url }) })
      const data = await res.json()
      if (res.ok) onProfileUpdated(data.profile)
    } finally { setUploading(false) }
  }

  const handleLinkGoogle = () => {
    window.localStorage.setItem('google_auth_intent', 'link')
    const redirectUrl = `${window.location.origin}/`
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto pb-24 space-y-5">
      <h2 className="font-montserrat text-xl font-bold text-stone-800">Profil Saya</h2>

      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
            {profile?.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="foto profil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-emerald-700">{(fullName || '?')[0]?.toUpperCase()}</span>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center cursor-pointer shadow-sm">
            {uploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && changePhoto(e.target.files[0])} />
          </label>
        </div>
        <p className="mt-3 font-semibold text-stone-800">{fullName}</p>
        <p className="text-xs text-stone-400">{user?.email}</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: stats?.total ?? 0 },
          { label: 'Aktif', value: stats?.aktif ?? 0 },
          { label: 'Panen', value: stats?.panen ?? 0 },
          { label: 'Gagal', value: stats?.gagal ?? 0 },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-2.5 text-center">
            <p className="text-base font-bold text-stone-800">{s.value}</p>
            <p className="text-[10px] text-stone-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-stone-500">Nama Lengkap</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-stone-500">Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            placeholder="Ceritakan tentang budidaya Anda..."
            className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
        </div>
        <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Profil'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <p className="text-xs font-medium text-stone-500">Akun Terhubung</p>
        {profile?.google_email ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Google terhubung ({profile.google_email})
          </div>
        ) : (
          <button onClick={handleLinkGoogle}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold transition-colors">
            <Link2 className="w-4 h-4" /> Hubungkan Akun Google
          </button>
        )}
      </div>

      <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-sm font-semibold">
        <LogOut className="w-4 h-4" /> Keluar
      </button>
    </div>
  )
}
