import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { geminiChat, geminiGenerate } from '@/lib/gemini'
import { calculateFeed } from '@/lib/constants/wasteGuide'
import { checkRateLimit } from '@/lib/rateLimit'
import { handleCORS, ok, err, getAuthUser, todayStr } from '@/lib/api'

export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

export async function POST(request) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)

    const rl = checkRateLimit(user.id)
    if (!rl.allowed) {
      return err(`Terlalu banyak permintaan. Coba lagi dalam ${rl.retryAfter} detik.`, 429)
    }

    const { data: logs } = await supabase.from('failure_logs')
      .select('reason, custom_reason, notes, logged_at, cycles(cycle_name, waste_type)')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(30)

    if (!logs || logs.length === 0) {
      return ok({ insight: 'Belum ada data kegagalan yang tercatat. Analisis akan tersedia setelah Anda mencatat minimal satu siklus gagal.' })
    }

    const prompt = `Analisis data kegagalan budidaya maggot BSF berikut (format JSON):\n${JSON.stringify(logs)}\n\nBerikan insight singkat dalam bahasa Indonesia: 1) pola yang berulang, 2) kemungkinan penyebab utama, 3) rekomendasi perbaikan paling prioritas. Gunakan format poin yang mudah dibaca.`
    const insight = await geminiGenerate(prompt)
    return ok({ insight })
  } catch (e) {
    console.error('AI failure analysis error:', e)
    return err('Analisis AI sedang tidak tersedia, coba lagi nanti', 500)
  }
}
