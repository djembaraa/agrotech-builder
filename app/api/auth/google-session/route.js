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
    const body = await request.json().catch(() => ({}))
    const { session_id } = body
    if (!session_id) return err('session_id wajib diisi')

    const upstream = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
      headers: { 'X-Session-ID': session_id },
      cache: 'no-store'
    })
    if (!upstream.ok) return err('Sesi Google tidak valid atau sudah kedaluwarsa', 401)
    const emergentUser = await upstream.json().catch(() => null)
    const email = emergentUser?.email
    const name = emergentUser?.name || ''
    const picture = emergentUser?.picture || ''
    if (!email) return err('Data akun Google tidak lengkap', 400)

    const admin = getSupabaseAdminClient()
    let userId = null
    let authEmailForLink = email

    const { data: linkedProfile } = await admin.from('profiles').select('id').eq('google_email', email).maybeSingle()

    if (linkedProfile) {
      userId = linkedProfile.id
      const { data: existingAuthUser } = await admin.auth.admin.getUserById(userId)
      authEmailForLink = existingAuthUser?.user?.email || email
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: randomUUID() + randomUUID(),
        email_confirm: true,
        user_metadata: { full_name: name, avatar_url: picture }
      })

      if (createError) {
        let found = null
        for (let page = 1; page <= 5 && !found; page++) {
          const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 })
          if (listErr || !list?.users?.length) break
          found = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
          if (list.users.length < 200) break
        }
        if (!found) return err('Gagal memproses akun Google', 500)
        userId = found.id
        authEmailForLink = found.email
      } else {
        userId = created.user.id
        authEmailForLink = created.user.email
      }
    }

    await admin.from('profiles').upsert({
      id: userId,
      full_name: name || undefined,
      profile_photo_url: picture || undefined
    }, { onConflict: 'id' })

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: authEmailForLink })
    const tokenHash = linkData?.properties?.hashed_token
    if (linkError || !tokenHash) return err('Gagal membuat sesi login Google', 500)

    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
    if (verifyError) return err(verifyError.message, 401)

    return ok({ user: verifyData.user })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
