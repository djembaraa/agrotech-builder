import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { geminiChat, geminiGenerate } from '@/lib/gemini'
import { calculateFeed } from '@/lib/constants/wasteGuide'
import { handleCORS, ok, err, getAuthUser, todayStr } from '@/lib/api'

export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

export async function POST(request) {
  const supabase = await getSupabaseServerClient()
  try {
    const body = await request.json().catch(() => ({}))
    const { email, password, full_name } = body
    if (!email || !password || !full_name) return err('Email, password, dan nama lengkap wajib diisi')
    if (String(password).length < 6) return err('Password minimal 6 karakter')

    const admin = getSupabaseAdminClient()
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name }
    })
    if (createError) return err(createError.message, 400)

    await admin.from('profiles').upsert({ id: created.user.id, full_name }, { onConflict: 'id' })

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) return err(signInError.message, 400)

    return ok({ user: signInData.user })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
