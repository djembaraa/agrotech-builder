import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { geminiChat, geminiGenerate } from '@/lib/gemini'
import { calculateFeed } from '@/lib/constants/wasteGuide'
import { handleCORS, ok, err, getAuthUser, todayStr } from '@/lib/api'

export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

export async function PUT(request) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)
    const body = await request.json().catch(() => ({}))
    const { full_name, bio, profile_photo_url } = body
    const { data, error } = await supabase.from('profiles')
      .update({ full_name, bio, profile_photo_url, updated_at: new Date().toISOString() })
      .eq('id', user.id).select().single()
    if (error) return err(error.message)
    return ok({ profile: data })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
