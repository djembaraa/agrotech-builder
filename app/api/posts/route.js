import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { geminiChat, geminiGenerate } from '@/lib/gemini'
import { calculateFeed } from '@/lib/constants/wasteGuide'
import { handleCORS, ok, err, getAuthUser, todayStr } from '@/lib/api'

export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

export async function GET(request) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)
    const sort = request.nextUrl.searchParams.get('sort') || 'terbaru'
    let query = supabase.from('posts').select('*, profiles(full_name, profile_photo_url)')
    query = sort === 'terpopuler' ? query.order('likes_count', { ascending: false }) : query.order('created_at', { ascending: false })
    const { data: posts, error } = await query.limit(50)
    if (error) return err(error.message)

    const postIds = (posts || []).map(p => p.id)
    let likedSet = new Set()
    if (postIds.length) {
      const { data: myLikes } = await supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
      likedSet = new Set((myLikes || []).map(l => l.post_id))
    }
    const enriched = (posts || []).map(p => ({ ...p, liked_by_me: likedSet.has(p.id) }))
    return ok({ posts: enriched })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}

export async function POST(request) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)
    const body = await request.json().catch(() => ({}))
    const { content, media_urls } = body
    if (!content) return err('Konten post wajib diisi')
    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id, content, media_urls: media_urls || []
    }).select('*, profiles(full_name, profile_photo_url)').single()
    if (error) return err(error.message)
    return ok({ post: { ...data, liked_by_me: false } }, 201)
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
