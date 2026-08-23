import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { geminiChat, geminiGenerate } from '@/lib/gemini'
import { calculateFeed } from '@/lib/constants/wasteGuide'
import { checkRateLimit } from '@/lib/rateLimit'

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

export async function POST(request) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)

    // Rate limiting: maks 15 request AI per menit per user
    const rl = checkRateLimit(user.id)
    if (!rl.allowed) {
      return err(`Terlalu banyak permintaan. Coba lagi dalam ${rl.retryAfter} detik.`, 429)
    }

    const body = await request.json().catch(() => ({}))
    const { message, history } = body
    if (!message) return err('Pesan wajib diisi')
    const answer = await geminiChat(history, message)
    return ok({ answer })
  } catch (e) {
    console.error('AI chat error:', e)
    return err('Asisten AI sedang tidak tersedia, coba lagi nanti', 500)
  }
}
