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
    const { data, error } = await supabase.from('failure_logs')
      .select('*, cycles(cycle_name, waste_type)')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
    if (error) return err(error.message)
    return ok({ failure_logs: data })
  } catch (error) {
    return err('Terjadi kesalahan pada server', 500)
  }
}
