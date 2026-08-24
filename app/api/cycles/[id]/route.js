import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { geminiChat, geminiGenerate } from '@/lib/gemini'
import { calculateFeed } from '@/lib/constants/wasteGuide'
import { handleCORS, ok, err, getAuthUser, todayStr } from '@/lib/api'

export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

export async function GET(request, { params }) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)
    const { id } = await params
    const { data, error } = await supabase.from('cycles').select('*').eq('id', id).eq('user_id', user.id).single()
    if (error) return err('Siklus tidak ditemukan', 404)
    const { data: failureLogs } = await supabase.from('failure_logs').select('*').eq('cycle_id', id).order('logged_at', { ascending: false })
    return ok({ cycle: data, failure_logs: failureLogs || [] })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}

export async function PUT(request, { params }) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)
    const body = await request.json().catch(() => ({}))
    const { id } = await params
    const allowed = ['cycle_name', 'waste_type', 'waste_weight_kg', 'seed_count', 'notes']
    const updates = {}
    allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] })
    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase.from('cycles').update(updates).eq('id', id).eq('user_id', user.id).select().single()
    if (error) return err(error.message)
    return ok({ cycle: data })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
