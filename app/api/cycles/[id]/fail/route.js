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
    const body = await request.json().catch(() => ({}))
    const { id } = await params
    const { reason, custom_reason, notes, photo_url } = body
    if (!reason) return err('Alasan kegagalan wajib diisi')
    const { data: failLog, error: failError } = await supabase.from('failure_logs').insert({
      cycle_id: id, user_id: user.id, reason, custom_reason: custom_reason || null, notes: notes || '', photo_url: photo_url || null
    }).select().single()
    if (failError) return err(failError.message)
    const { data: cycle, error: cycleError } = await supabase.from('cycles').update({
      status: 'gagal', end_date: todayStr(), updated_at: new Date().toISOString()
    }).eq('id', id).eq('user_id', user.id).select().single()
    if (cycleError) return err(cycleError.message)
    return ok({ cycle, failure_log: failLog })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
