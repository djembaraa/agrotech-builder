import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { geminiChat, geminiGenerate, geminiVision } from '@/lib/gemini'
import { calculateFeed } from '@/lib/constants/wasteGuide'
import { handleCORS, ok, err, getAuthUser, todayStr } from '@/lib/api'

export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

export async function POST(request, { params }) {
  const supabase = await getSupabaseServerClient()
  try {
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)
    const body = await request.json().catch(() => ({}))
    const { id } = await params
    const { reason, custom_reason, notes, photo_url } = body
    if (!reason) return err('Alasan kegagalan wajib diisi')
    
    let ai_analysis = null
    if (photo_url) {
      const prompt = `Analisis foto biopond maggot BSF (Black Soldier Fly) ini yang dilaporkan mengalami kegagalan (alasan: ${reason === 'lainnya' ? custom_reason : reason}).
Tugas Anda sebagai ahli Agrotech:
1. Observasi visual: Apa yang salah secara visual pada gambar (misal: media terlalu basah, ada jamur, ada hama lain, atau maggot terlihat mati/kabur)?
2. Solusi: Berikan 1-2 kalimat saran perbaikan teknis untuk mencegahnya di siklus berikutnya.
Berikan jawaban singkat, to the point, dan profesional.`
      ai_analysis = await geminiVision(prompt, photo_url)
    }

    let combinedNotes = notes || ''
    if (ai_analysis) {
      combinedNotes = combinedNotes ? `${combinedNotes}\n\n[AI Vision Analysis]: ${ai_analysis}` : `[AI Vision Analysis]: ${ai_analysis}`
    }

    const { data: failLog, error: failError } = await supabase.from('failure_logs').insert({
      cycle_id: id, 
      user_id: user.id, 
      reason, 
      custom_reason: custom_reason || null, 
      notes: combinedNotes, 
      photo_url: photo_url || null
    }).select().single()
    
    if (failError) return err(failError.message)
    const { data: cycle, error: cycleError } = await supabase.from('cycles').update({
      status: 'gagal', end_date: todayStr(), updated_at: new Date().toISOString()
    }).eq('id', id).eq('user_id', user.id).select().single()
    if (cycleError) return err(cycleError.message)
    return ok({ cycle, failure_log: failLog })
  } catch (error) {
    console.error(error)
    return err('Terjadi kesalahan pada server', 500)
  }
}
