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
    <div className="min-h-screen bg-[#F9FBF9] pb-32">
      <div className="bg-gradient-to-b from-[#E8F0E5] to-[#F9FBF9] pt-8 pb-10 px-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-2xl font-bold text-eco-900">Komunitas</h2>
          <div className="flex flex-row gap-2 bg-white/50 backdrop-blur-md p-1 rounded-full border border-white/60">
            {[{ k: 'terbaru', l: 'Terbaru' }, { k: 'terpopuler', l: 'Populer' }].map(s => (
              <button key={s.k} onClick={() => setSort(s.k)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${sort === s.k ? 'bg-eco-600 text-white shadow-sm' : 'text-stone-500 hover:text-eco-700'}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <p className="text-eco-700/80 text-sm">Bagikan pengalaman budidaya BSF Anda</p>
      </div>

      <div className="px-5 space-y-6 -mt-4 relative z-10">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 space-y-4 border border-white">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            placeholder="Ada cerita apa hari ini?"
            className="rounded-2xl bg-stone-50 border-0 focus-visible:ring-eco-500 resize-none text-sm p-4 font-medium"
          />
          <div className="flex flex-row items-center justify-between gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-600 cursor-pointer transition-colors border border-stone-100">
              <ImageIcon className="w-4 h-4 text-eco-600" /> {file ? file.name.slice(0, 16) : 'Tambah Foto'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
            <Button
              onClick={submitPost}
              disabled={posting || !content.trim()}
              className="px-6 rounded-[1.2rem] bg-eco-600 hover:bg-eco-700 h-10 text-sm font-bold text-white shadow-md shadow-eco-600/20 active:scale-95 transition-transform"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-[2rem] animate-pulse shadow-sm border border-white" />)}</div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-sm p-8 text-center text-stone-400 text-sm border border-white font-medium">Belum ada post. Jadilah yang pertama berbagi!</div>
        ) : (
          <div className="space-y-5">
            {posts.map(p => (
              <div key={p.id} className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 border border-white">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[1.2rem] bg-eco-100 flex items-center justify-center text-eco-700 text-sm font-bold overflow-hidden shrink-0 shadow-inner">
                      {p.profiles?.profile_photo_url
                        ? <Image src={p.profiles.profile_photo_url} alt="" width={40} height={40} className="w-full h-full object-cover" />
                        : (p.profiles?.full_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{p.profiles?.full_name || 'Pengguna'}</p>
                      <p className="text-[10px] text-stone-400 font-medium">{new Date(p.created_at).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  {p.user_id === userId && (
                    <button onClick={() => setDeleteTarget(p.id)}
                      className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 hover:bg-rose-100 hover:text-rose-600 shrink-0 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-stone-700 mb-3 whitespace-pre-line leading-relaxed">{p.content}</p>
                {p.media_urls?.[0] && (
                  <div className="relative w-full max-h-[300px] rounded-2xl overflow-hidden mb-3 shadow-sm border border-stone-100">
                    <Image
                      src={p.media_urls[0]}
                      alt="media post"
                      width={600}
                      height={400}
                      className="w-full object-cover max-h-[300px]"
                    />
                  </div>
                )}
                <div className="flex flex-row items-center gap-5 pt-2 border-t border-stone-50">
                  <button onClick={() => toggleLike(p)} className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-rose-500 transition-colors">
                    <Heart className={`w-4 h-4 ${p.liked_by_me ? 'fill-rose-500 text-rose-500' : ''}`} /> {p.likes_count || 0}
                  </button>
                  <button onClick={() => setActiveComments(p.id)} className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-eco-600 transition-colors">
                    <MessageCircle className="w-4 h-4" /> {p.comments_count || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeComments && <CommentsModal postId={activeComments} onClose={() => { setActiveComments(null); load() }} />}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[2rem] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Hapus Post?</AlertDialogTitle>
            <AlertDialogDescription>
              Post ini akan dihapus permanen dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="rounded-[1.2rem] h-11 border-stone-200">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-[1.2rem] h-11 bg-rose-600 hover:bg-rose-700 text-white">
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
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <h3 className="font-serif text-lg font-bold text-stone-800">Komentar</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"><X className="w-4 h-4 text-stone-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-eco-600 mx-auto" /> :
            comments.length === 0 ? <p className="text-center text-stone-400 text-sm font-medium py-6">Belum ada komentar.</p> :
              comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-eco-100 flex items-center justify-center text-eco-700 text-xs font-bold shrink-0 shadow-inner">
                    {(c.profiles?.full_name || '?')[0]?.toUpperCase()}
                  </div>
                  <div className="bg-stone-50 rounded-2xl rounded-tl-none px-4 py-3 flex-1 border border-stone-100">
                    <p className="text-xs font-bold text-stone-800">{c.profiles?.full_name || 'Pengguna'}</p>
                    <p className="text-sm text-stone-600 mt-0.5 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))
          }
        </div>
        <div className="flex flex-row gap-3 px-6 py-4 bg-white border-t border-stone-100 rounded-b-[2rem]">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Tulis balasan..."
            className="flex-1 rounded-2xl bg-stone-50 px-4 h-11 text-sm font-medium outline-none focus:ring-2 focus:ring-eco-500 border-0" />
          <button onClick={send} disabled={sending}
            className="w-11 h-11 rounded-2xl bg-eco-600 hover:bg-eco-700 flex items-center justify-center shrink-0 shadow-md shadow-eco-600/20 active:scale-95 transition-transform">
            {sending ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Send className="w-4 h-4 text-white ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
