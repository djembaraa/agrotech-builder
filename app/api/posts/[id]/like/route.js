import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { geminiChat, geminiGenerate } from '@/lib/gemini'
import { calculateFeed } from '@/lib/constants/wasteGuide'
import { handleCORS, ok, err, getAuthUser, todayStr } from '@/lib/api'

export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

export async function POST(request, { params }) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)
    const { id } = await params
    const admin = getSupabaseAdminClient()
    const { data: existing } = await supabase.from('likes').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle()

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id)
      const { data: post } = await admin.from('posts').select('likes_count').eq('id', id).single()
      const newCount = Math.max(0, (post?.likes_count || 1) - 1)
      await admin.from('posts').update({ likes_count: newCount }).eq('id', id)
      return ok({ liked: false, likes_count: newCount })
    } else {
      await supabase.from('likes').insert({ post_id: id, user_id: user.id })
      const { data: post } = await admin.from('posts').select('likes_count').eq('id', id).single()
      const newCount = (post?.likes_count || 0) + 1
      await admin.from('posts').update({ likes_count: newCount }).eq('id', id)
      return ok({ liked: true, likes_count: newCount })
    }
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
