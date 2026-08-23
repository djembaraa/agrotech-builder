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

export async function GET(request) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)
    const { data: cycles } = await supabase.from('cycles').select('status, harvest_weight_kg').eq('user_id', user.id)
    const stats = {
      total: cycles?.length || 0,
      aktif: cycles?.filter(c => c.status === 'aktif').length || 0,
      panen: cycles?.filter(c => c.status === 'panen').length || 0,
      gagal: cycles?.filter(c => c.status === 'gagal').length || 0,
      total_harvest_kg: (cycles || []).reduce((sum, c) => sum + (Number(c.harvest_weight_kg) || 0), 0)
    }
    return ok({ stats })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
