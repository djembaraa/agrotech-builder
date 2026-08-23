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

export async function POST(request) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)
    const body = await request.json().catch(() => ({}))
    const { session_id } = body
    if (!session_id) return err('session_id wajib diisi')

    const upstream = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
      headers: { 'X-Session-ID': session_id },
      cache: 'no-store'
    })
    if (!upstream.ok) return err('Sesi Google tidak valid atau sudah kedaluwarsa', 401)
    const emergentUser = await upstream.json().catch(() => null)
    const googleEmail = emergentUser?.email
    const picture = emergentUser?.picture || ''
    if (!googleEmail) return err('Data akun Google tidak lengkap', 400)

    const admin = getSupabaseAdminClient()
    const { data: existingLink } = await admin.from('profiles').select('id').eq('google_email', googleEmail).maybeSingle()
    if (existingLink && existingLink.id !== user.id) {
      return err('Akun Google ini sudah terhubung ke pengguna lain', 409)
    }

    const { data: updated, error: updateError } = await admin.from('profiles').update({
      google_email: googleEmail,
      profile_photo_url: picture || undefined,
      updated_at: new Date().toISOString()
    }).eq('id', user.id).select().single()
    if (updateError) return err(updateError.message)
    return ok({ profile: updated })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
