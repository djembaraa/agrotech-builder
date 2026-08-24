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
    const { harvest_weight_kg, harvest_proof_url } = body
    if (!harvest_weight_kg) return err('Berat panen wajib diisi')
    
    let ai_insight = null
    if (harvest_proof_url) {
      const prompt = `Analisis gambar maggot BSF (Black Soldier Fly) hasil panen ini.
Fokus pada: 1) Perkiraan ukuran dan kegemukan maggot, 2) Kebersihan maggot dari sisa media, 3) Kepadatan dan keseragaman.
Berikan penilaian profesional agrotech dalam 2-3 kalimat singkat yang memotivasi dan informatif. Jangan bertele-tele.`
      ai_insight = await geminiVision(prompt, harvest_proof_url)
    }

    const { data: cycleData } = await supabase.from('cycles').select('notes').eq('id', id).single()
    let combinedNotes = cycleData?.notes || ''
    if (ai_insight) {
      combinedNotes = combinedNotes ? `${combinedNotes}\n\n[AI Vision Insight]: ${ai_insight}` : `[AI Vision Insight]: ${ai_insight}`
    }

    const { data, error } = await supabase.from('cycles').update({
      status: 'panen', 
      harvest_weight_kg, 
      harvest_proof_url,
      notes: combinedNotes,
      end_date: todayStr(), 
      updated_at: new Date().toISOString()
    }).eq('id', id).eq('user_id', user.id).select().single()
    
    if (error) return err(error.message)
    return ok({ cycle: data })
  } catch (error) {
    console.error(error)
    return err('Terjadi kesalahan pada server', 500)
  }
}
