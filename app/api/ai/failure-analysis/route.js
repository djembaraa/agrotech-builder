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
