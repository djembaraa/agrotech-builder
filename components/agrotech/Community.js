'use client'

import { useEffect, useState, useCallback } from 'react'
import { Heart, MessageCircle, Image as ImageIcon, Loader2, X, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE_MB = 10

async function uploadPostMedia(file, userId) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.')
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Ukuran gambar maksimal ${MAX_FILE_SIZE_MB}MB.`)
  }
  const supabase = getSupabaseBrowserClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('post-media').upload(path, file, { contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('post-media').getPublicUrl(path)
  return data.publicUrl
}

export default function Community({ userId }) {
  const [posts, setPosts] = useState([])
  const [sort, setSort] = useState('terbaru')
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [file, setFile] = useState(null)
  const [posting, setPosting] = useState(false)
  const [activeComments, setActiveComments] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/posts?sort=${sort}`)
    const data = await res.json()
    setPosts(data.posts || [])
    setLoading(false)
  }, [sort])

  useEffect(() => { load() }, [load])

  const submitPost = async () => {
    if (!content.trim()) return
    setPosting(true)
    try {
      let media_urls = []
      if (file) media_urls = [await uploadPostMedia(file, userId)]
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, media_urls })
      })
      if (res.ok) {
        setContent('')
        setFile(null)
        toast.success('Post berhasil dibagikan!')
        load()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal memposting')
      }
    } catch (e) {
      toast.error(e.message || 'Gagal mengunggah gambar')
    } finally {
      setPosting(false)
    }
  }

  const toggleLike = async (post) => {
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1 }
      : p))
    await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/posts/${deleteTarget}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Post berhasil dihapus')
      setPosts(prev => prev.filter(p => p.id !== deleteTarget))
    } else {
      toast.error('Gagal menghapus post')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-montserrat text-xl font-bold text-stone-800">Komunitas</h2>
        <div className="flex flex-row gap-2">
          {[{ k: 'terbaru', l: 'Terbaru' }, { k: 'terpopuler', l: 'Terpopuler' }].map(s => (
            <button key={s.k} onClick={() => setSort(s.k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${sort === s.k ? 'bg-emerald-600 text-white' : 'bg-white text-stone-500 shadow-sm'}`}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          placeholder="Bagikan pengalaman budidaya Anda..."
          className="rounded-xl bg-stone-100 border-0 focus-visible:ring-emerald-500 resize-none text-sm"
        />
        <div className="flex flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
            <ImageIcon className="w-4 h-4" /> {file ? file.name.slice(0, 16) : 'Tambah foto'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
          <Button
            onClick={submitPost}
            disabled={posting || !content.trim()}
            className="px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Posting'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-stone-100 rounded-2xl animate-pulse" />)}</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-stone-400 text-sm">Belum ada post. Jadilah yang pertama berbagi!</div>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold overflow-hidden shrink-0">
                    {p.profiles?.profile_photo_url
                      ? <Image src={p.profiles.profile_photo_url} alt="" width={32} height={32} className="w-full h-full object-cover" />
                      : (p.profiles?.full_name || '?')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{p.profiles?.full_name || 'Pengguna'}</p>
                    <p className="text-[10px] text-stone-400">{new Date(p.created_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                {/* Tombol hapus hanya muncul jika post milik user sendiri */}
                {p.user_id === userId && (
                  <button onClick={() => setDeleteTarget(p.id)}
                    className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 hover:bg-rose-100 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-stone-700 mb-2 whitespace-pre-line">{p.content}</p>
              {p.media_urls?.[0] && (
                <div className="relative w-full max-h-64 rounded-xl overflow-hidden mb-2">
                  <Image
                    src={p.media_urls[0]}
                    alt="media post"
                    width={600}
                    height={400}
                    className="w-full object-cover max-h-64"
                  />
                </div>
              )}
              <div className="flex flex-row items-center gap-4 pt-1">
                <button onClick={() => toggleLike(p)} className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Heart className={`w-4 h-4 ${p.liked_by_me ? 'fill-rose-500 text-rose-500' : ''}`} /> {p.likes_count || 0}
                </button>
                <button onClick={() => setActiveComments(p.id)} className="flex items-center gap-1.5 text-xs text-stone-500">
                  <MessageCircle className="w-4 h-4" /> {p.comments_count || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeComments && <CommentsModal postId={activeComments} onClose={() => { setActiveComments(null); load() }} />}

      {/* AlertDialog konfirmasi hapus post */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Post?</AlertDialogTitle>
            <AlertDialogDescription>
              Post ini akan dihapus permanen dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CommentsModal({ postId, onClose }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/posts/${postId}/comments`)
    const data = await res.json()
    setComments(data.comments || [])
    setLoading(false)
  }, [postId])

  useEffect(() => { load() }, [load])

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      })
      if (res.ok) {
        setText('')
        toast.success('Komentar terkirim!')
        load()
      } else {
        toast.error('Gagal mengirim komentar')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-lg w-full sm:max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="font-montserrat font-bold text-stone-800">Komentar</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"><X className="w-4 h-4 text-stone-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-3">
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" /> :
            comments.length === 0 ? <p className="text-center text-stone-400 text-sm py-6">Belum ada komentar.</p> :
              comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold shrink-0">
                    {(c.profiles?.full_name || '?')[0]?.toUpperCase()}
                  </div>
                  <div className="bg-stone-50 rounded-xl px-3 py-2 flex-1">
                    <p className="text-xs font-semibold text-stone-700">{c.profiles?.full_name || 'Pengguna'}</p>
                    <p className="text-sm text-stone-600">{c.content}</p>
                  </div>
                </div>
              ))
          }
        </div>
        <div className="flex flex-row gap-2 px-5 py-3 bg-white">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Tulis komentar..."
            className="flex-1 rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          <button onClick={send} disabled={sending}
            className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}
