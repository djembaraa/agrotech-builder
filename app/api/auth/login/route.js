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
    const { email, password } = body
    if (!email || !password) return err('Email dan password wajib diisi')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return err('Email atau password salah', 401)
    return ok({ user: data.user })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
