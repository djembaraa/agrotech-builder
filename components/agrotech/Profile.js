'use client'

import { useState } from 'react'
import { Camera, Loader2, LogOut, Link2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE_MB = 5

async function uploadAvatar(file, userId) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.')
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Ukuran gambar maksimal ${MAX_FILE_SIZE_MB}MB.`)
  }
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
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, bio, profile_photo_url: profile?.profile_photo_url })
      })
      const data = await res.json()
      if (res.ok) {
        onProfileUpdated(data.profile)
        toast.success('Profil berhasil disimpan!')
      } else {
        toast.error(data.error || 'Gagal menyimpan profil')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const changePhoto = async (file) => {
    setUploading(true)
    try {
      const url = await uploadAvatar(file, user.id)
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, bio, profile_photo_url: url })
      })
      const data = await res.json()
      if (res.ok) {
        onProfileUpdated(data.profile)
        toast.success('Foto profil berhasil diperbarui!')
      } else {
        toast.error(data.error || 'Gagal mengunggah foto')
      }
    } catch (e) {
      toast.error(e.message || 'Gagal mengunggah foto')
    } finally {
      setUploading(false)
    }
  }

  const handleLinkGoogle = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#F9FBF9] pb-32">
      <div className="bg-gradient-to-b from-[#E8F0E5] to-[#F9FBF9] pt-8 pb-10 px-5">
        <h2 className="font-serif text-2xl font-bold text-eco-900 mb-6">Profil Saya</h2>

        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col items-center border border-white">
          <div className="relative">
            <div className="w-24 h-24 rounded-[1.5rem] bg-eco-100 flex items-center justify-center overflow-hidden shadow-inner">
              {profile?.profile_photo_url ? (
                <Image
                  src={profile.profile_photo_url}
                  alt="foto profil"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-eco-700">{(fullName || '?')[0]?.toUpperCase()}</span>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-eco-600 flex items-center justify-center cursor-pointer shadow-lg shadow-eco-600/30 hover:scale-105 transition-transform">
              {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                onChange={e => e.target.files?.[0] && changePhoto(e.target.files[0])} />
            </label>
          </div>
          <p className="mt-4 font-bold text-stone-800 text-lg">{fullName}</p>
          <p className="text-sm text-stone-400 font-medium">{user?.email}</p>
        </div>
      </div>

      <div className="px-5 space-y-5 -mt-6 relative z-10">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats?.total ?? 0 },
            { label: 'Aktif', value: stats?.aktif ?? 0 },
            { label: 'Panen', value: stats?.panen ?? 0 },
            { label: 'Gagal', value: stats?.gagal ?? 0 },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-[1.2rem] shadow-[0_4px_15px_rgb(0,0,0,0.02)] p-3 text-center border border-white">
              <p className="text-xl font-bold text-eco-800">{s.value}</p>
              <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[1.5rem] shadow-[0_4px_15px_rgb(0,0,0,0.02)] p-5 space-y-4 border border-white">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Nama Lengkap</Label>
            <Input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="rounded-2xl bg-stone-50 border-0 focus-visible:ring-eco-500 h-12 px-4"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Bio</Label>
            <Textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              placeholder="Ceritakan tentang budidaya Anda..."
              className="rounded-2xl bg-stone-50 border-0 focus-visible:ring-eco-500 p-4 resize-none"
            />
          </div>
          <Button
            onClick={save}
            disabled={saving}
            className="w-full rounded-2xl bg-eco-600 hover:bg-eco-700 h-12 shadow-lg shadow-eco-600/20 font-bold transition-transform active:scale-95 text-white"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </Button>
        </div>

        <div className="bg-white rounded-[1.5rem] shadow-[0_4px_15px_rgb(0,0,0,0.02)] p-5 border border-white">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Akun Terhubung</p>
          {profile?.google_email ? (
            <div className="flex items-center gap-2 text-sm text-eco-700 bg-eco-50 rounded-2xl px-4 py-3 font-medium border border-eco-100">
              <CheckCircle2 className="w-5 h-5 shrink-0" /> Google terhubung ({profile.google_email})
            </div>
          ) : (
            <button onClick={handleLinkGoogle}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-bold transition-colors">
              <Link2 className="w-4 h-4" /> Hubungkan Akun Google
            </button>
          )}
        </div>

        {/* Tombol Logout */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-rose-50 text-rose-600 text-sm font-bold hover:bg-rose-100 transition-colors">
              <LogOut className="w-4 h-4" /> Keluar dari Akun
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[2rem] max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif">Keluar dari Agrotech?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda akan keluar dari akun ini. Semua data Anda tetap tersimpan dengan aman.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-2">
              <AlertDialogCancel className="rounded-[1.2rem] h-11 border-stone-200">Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={onLogout}
                className="rounded-[1.2rem] h-11 bg-rose-600 hover:bg-rose-700 text-white"
              >
                Ya, Keluar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
