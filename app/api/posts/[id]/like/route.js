import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { geminiChat, geminiGenerate } from '@/lib/gemini'
import { calculateFeed } from '@/lib/constants/wasteGuide'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

function ok(data, status = 200) {
  return handleCORS(NextResponse.json(data, { status }))
}

function err(message, status = 400) {
  return handleCORS(NextResponse.json({ error: message }, { status }))
}

async function getAuthUser(supabase) {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return data.user
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

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
