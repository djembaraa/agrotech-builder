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

    const body = await request.json().catch(() => ({}))
    const { waste_type, waste_weight_kg, base_tips } = body
    const prompt = `Berikan 2-3 tips tambahan (jangan mengulang tips berikut: "${base_tips || ''}") untuk budidaya maggot BSF dengan jenis limbah "${waste_type}" seberat ${waste_weight_kg} kg. Jawab singkat dalam format poin bahasa Indonesia.`
    const tips = await geminiGenerate(prompt)
    return ok({ tips })
  } catch (e) {
    console.error('AI tips error:', e)
    return err('Tips AI sedang tidak tersedia, coba lagi nanti', 500)
  }
}

