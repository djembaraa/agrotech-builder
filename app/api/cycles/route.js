import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { geminiChat, geminiGenerate } from '@/lib/gemini'
import { calculateFeed } from '@/lib/constants/wasteGuide'
import { handleCORS, ok, err, getAuthUser, todayStr } from '@/lib/api'

export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

export async function GET(request) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)
    const status = request.nextUrl.searchParams.get('status')
    let query = supabase.from('cycles').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) return err(error.message)
    return ok({ cycles: data })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}

export async function POST(request) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)
    const body = await request.json().catch(() => ({}))
    const { cycle_name, start_date, waste_type, waste_weight_kg, seed_count } = body
    if (!cycle_name || !start_date || !waste_type || !waste_weight_kg || !seed_count) {
      return err('Semua field wajib diisi')
    }
    const { data, error } = await supabase.from('cycles').insert({
      user_id: user.id, cycle_name, start_date, waste_type,
      waste_weight_kg, seed_count, status: 'aktif'
    }).select().single()
    if (error) return err(error.message)
    return ok({ cycle: data }, 201)
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
