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

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const method = request.method
  const supabase = await getSupabaseServerClient()

  try {
    let body = {}
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      body = await request.json().catch(() => ({}))
    }

    // ---------------- AUTH ----------------
    if (path[0] === 'auth') {
      if (path[1] === 'register' && method === 'POST') {
        const { email, password, full_name } = body
        if (!email || !password || !full_name) return err('Email, password, dan nama lengkap wajib diisi')
        if (String(password).length < 6) return err('Password minimal 6 karakter')

        const admin = getSupabaseAdminClient()
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { full_name }
        })
        if (createError) return err(createError.message, 400)

        await admin.from('profiles').upsert({ id: created.user.id, full_name }, { onConflict: 'id' })

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) return err(signInError.message, 400)

        return ok({ user: signInData.user })
      }

      if (path[1] === 'login' && method === 'POST') {
        const { email, password } = body
        if (!email || !password) return err('Email dan password wajib diisi')
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return err('Email atau password salah', 401)
        return ok({ user: data.user })
      }

      if (path[1] === 'logout' && method === 'POST') {
        await supabase.auth.signOut()
        return ok({ success: true })
      }

      if (path[1] === 'google-session' && method === 'POST') {
        const { session_id } = body
        if (!session_id) return err('session_id wajib diisi')

        const upstream = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
          headers: { 'X-Session-ID': session_id },
          cache: 'no-store'
        })
        if (!upstream.ok) return err('Sesi Google tidak valid atau sudah kedaluwarsa', 401)
        const emergentUser = await upstream.json().catch(() => null)
        const email = emergentUser?.email
        const name = emergentUser?.name || ''
        const picture = emergentUser?.picture || ''
        if (!email) return err('Data akun Google tidak lengkap', 400)

        const admin = getSupabaseAdminClient()
        let userId = null
        let authEmailForLink = email

        // If this Google email was previously linked to an existing account
        // (via "Hubungkan Akun Google" in Profile), sign into THAT account instead
        // of creating/matching a new one. Silently no-ops if google_email column
        // does not exist yet (falls through to normal create/find flow below).
        const { data: linkedProfile } = await admin.from('profiles').select('id').eq('google_email', email).maybeSingle()

        if (linkedProfile) {
          userId = linkedProfile.id
          const { data: existingAuthUser } = await admin.auth.admin.getUserById(userId)
          authEmailForLink = existingAuthUser?.user?.email || email
        } else {
          const { data: created, error: createError } = await admin.auth.admin.createUser({
            email,
            password: randomUUID() + randomUUID(),
            email_confirm: true,
            user_metadata: { full_name: name, avatar_url: picture }
          })

          if (createError) {
            // User likely already exists (registered via email/password or previous Google login)
            let found = null
            for (let page = 1; page <= 5 && !found; page++) {
              const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 })
              if (listErr || !list?.users?.length) break
              found = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
              if (list.users.length < 200) break
            }
            if (!found) return err('Gagal memproses akun Google', 500)
            userId = found.id
            authEmailForLink = found.email
          } else {
            userId = created.user.id
            authEmailForLink = created.user.email
          }
        }

        await admin.from('profiles').upsert({
          id: userId,
          full_name: name || undefined,
          profile_photo_url: picture || undefined
        }, { onConflict: 'id' })

        const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: authEmailForLink })
        const tokenHash = linkData?.properties?.hashed_token
        if (linkError || !tokenHash) return err('Gagal membuat sesi login Google', 500)

        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
        if (verifyError) return err(verifyError.message, 401)

        return ok({ user: verifyData.user })
      }

      if (path[1] === 'me' && method === 'GET') {
        const user = await getAuthUser(supabase)
        if (!user) return err('Unauthorized', 401)
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        return ok({ user, profile })
      }
    }

    // Everything below requires auth
    const user = await getAuthUser(supabase)
    if (!user) return err('Unauthorized', 401)

    // ---------------- PROFILE ----------------
    if (path[0] === 'profile') {
      if (path.length === 1 && method === 'PUT') {
        const { full_name, bio, profile_photo_url } = body
        const { data, error } = await supabase.from('profiles')
          .update({ full_name, bio, profile_photo_url, updated_at: new Date().toISOString() })
          .eq('id', user.id).select().single()
        if (error) return err(error.message)
        return ok({ profile: data })
      }
      if (path[1] === 'stats' && method === 'GET') {
        const { data: cycles } = await supabase.from('cycles').select('status, harvest_weight_kg').eq('user_id', user.id)
        const stats = {
          total: cycles?.length || 0,
          aktif: cycles?.filter(c => c.status === 'aktif').length || 0,
          panen: cycles?.filter(c => c.status === 'panen').length || 0,
          gagal: cycles?.filter(c => c.status === 'gagal').length || 0,
          total_harvest_kg: (cycles || []).reduce((sum, c) => sum + (Number(c.harvest_weight_kg) || 0), 0)
        }
        return ok({ stats })
      }

      if (path[1] === 'link-google' && method === 'POST') {
        const { session_id } = body
        if (!session_id) return err('session_id wajib diisi')

        const upstream = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
          headers: { 'X-Session-ID': session_id },
          cache: 'no-store'
        })
        if (!upstream.ok) return err('Sesi Google tidak valid atau sudah kedaluwarsa', 401)
        const emergentUser = await upstream.json().catch(() => null)
        const googleEmail = emergentUser?.email
        const picture = emergentUser?.picture || ''
        if (!googleEmail) return err('Data akun Google tidak lengkap', 400)

        const admin = getSupabaseAdminClient()
        const { data: existingLink } = await admin.from('profiles').select('id').eq('google_email', googleEmail).maybeSingle()
        if (existingLink && existingLink.id !== user.id) {
          return err('Akun Google ini sudah terhubung ke pengguna lain', 409)
        }

        const { data: updated, error: updateError } = await admin.from('profiles').update({
          google_email: googleEmail,
          profile_photo_url: picture || undefined,
          updated_at: new Date().toISOString()
        }).eq('id', user.id).select().single()
        if (updateError) return err(updateError.message)

        return ok({ profile: updated })
      }
    }

    // ---------------- CYCLES ----------------
    if (path[0] === 'cycles') {
      if (path.length === 1 && method === 'GET') {
        const status = request.nextUrl.searchParams.get('status')
        let query = supabase.from('cycles').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        if (status) query = query.eq('status', status)
        const { data, error } = await query
        if (error) return err(error.message)
        return ok({ cycles: data })
      }

      if (path.length === 1 && method === 'POST') {
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
      }

      if (path.length === 2 && method === 'GET') {
        const { data, error } = await supabase.from('cycles').select('*').eq('id', path[1]).eq('user_id', user.id).single()
        if (error) return err('Siklus tidak ditemukan', 404)
        const { data: failureLogs } = await supabase.from('failure_logs').select('*').eq('cycle_id', path[1]).order('logged_at', { ascending: false })
        return ok({ cycle: data, failure_logs: failureLogs || [] })
      }

      if (path.length === 2 && (method === 'PUT' || method === 'PATCH')) {
        const allowed = ['cycle_name', 'waste_type', 'waste_weight_kg', 'seed_count', 'notes']
        const updates = {}
        allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] })
        updates.updated_at = new Date().toISOString()
        const { data, error } = await supabase.from('cycles').update(updates).eq('id', path[1]).eq('user_id', user.id).select().single()
        if (error) return err(error.message)
        return ok({ cycle: data })
      }

      if (path.length === 3 && path[2] === 'harvest' && method === 'POST') {
        const { harvest_weight_kg, harvest_proof_url } = body
        if (!harvest_weight_kg) return err('Berat panen wajib diisi')
        const { data, error } = await supabase.from('cycles').update({
          status: 'panen', harvest_weight_kg, harvest_proof_url,
          end_date: todayStr(), updated_at: new Date().toISOString()
        }).eq('id', path[1]).eq('user_id', user.id).select().single()
        if (error) return err(error.message)
        return ok({ cycle: data })
      }

      if (path.length === 3 && path[2] === 'fail' && method === 'POST') {
        const { reason, custom_reason, notes, photo_url } = body
        if (!reason) return err('Alasan kegagalan wajib diisi')
        const { data: failLog, error: failError } = await supabase.from('failure_logs').insert({
          cycle_id: path[1], user_id: user.id, reason, custom_reason: custom_reason || null, notes: notes || '', photo_url: photo_url || null
        }).select().single()
        if (failError) return err(failError.message)
        const { data: cycle, error: cycleError } = await supabase.from('cycles').update({
          status: 'gagal', end_date: todayStr(), updated_at: new Date().toISOString()
        }).eq('id', path[1]).eq('user_id', user.id).select().single()
        if (cycleError) return err(cycleError.message)
        return ok({ cycle, failure_log: failLog })
      }
    }

    // ---------------- FAILURE LOGS ----------------
    if (path[0] === 'failure-logs' && path.length === 1 && method === 'GET') {
      const { data, error } = await supabase.from('failure_logs')
        .select('*, cycles(cycle_name, waste_type)')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
      if (error) return err(error.message)
      return ok({ failure_logs: data })
    }

    // ---------------- CALCULATOR ----------------
    if (path[0] === 'calculator') {
      if (path[1] === 'estimate' && method === 'POST') {
        const { waste_weight_kg, waste_type } = body
        if (!waste_weight_kg || !waste_type) return err('Berat dan jenis limbah wajib diisi')
        const result = calculateFeed(Number(waste_weight_kg), waste_type)
        if (!result) return err('Jenis limbah tidak valid')
        await supabase.from('calculator_logs').insert({
          user_id: user.id, waste_type, waste_weight_kg,
          estimated_seeds: result.estimatedSeeds,
          estimated_harvest_kg: result.harvestMax,
          tips: result.tips
        })
        return ok({ result })
      }
      if (path[1] === 'history' && method === 'GET') {
        const { data, error } = await supabase.from('calculator_logs').select('*').eq('user_id', user.id).order('calculated_at', { ascending: false }).limit(20)
        if (error) return err(error.message)
        return ok({ history: data })
      }
    }

    // ---------------- POSTS / COMMUNITY ----------------
    if (path[0] === 'posts') {
      if (path.length === 1 && method === 'GET') {
        const sort = request.nextUrl.searchParams.get('sort') || 'terbaru'
        let query = supabase.from('posts').select('*, profiles(full_name, profile_photo_url)')
        query = sort === 'terpopuler' ? query.order('likes_count', { ascending: false }) : query.order('created_at', { ascending: false })
        const { data: posts, error } = await query.limit(50)
        if (error) return err(error.message)

        const postIds = (posts || []).map(p => p.id)
        let likedSet = new Set()
        if (postIds.length) {
          const { data: myLikes } = await supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
          likedSet = new Set((myLikes || []).map(l => l.post_id))
        }
        const enriched = (posts || []).map(p => ({ ...p, liked_by_me: likedSet.has(p.id) }))
        return ok({ posts: enriched })
      }

      if (path.length === 1 && method === 'POST') {
        const { content, media_urls } = body
        if (!content) return err('Konten post wajib diisi')
        const { data, error } = await supabase.from('posts').insert({
          user_id: user.id, content, media_urls: media_urls || []
        }).select('*, profiles(full_name, profile_photo_url)').single()
        if (error) return err(error.message)
        return ok({ post: { ...data, liked_by_me: false } }, 201)
      }

      if (path.length === 2 && method === 'DELETE') {
        const { error } = await supabase.from('posts').delete().eq('id', path[1]).eq('user_id', user.id)
        if (error) return err(error.message)
        return ok({ success: true })
      }

      if (path.length === 3 && path[2] === 'like' && method === 'POST') {
        const admin = getSupabaseAdminClient()
        const { data: existing } = await supabase.from('likes').select('id').eq('post_id', path[1]).eq('user_id', user.id).maybeSingle()

        if (existing) {
          await supabase.from('likes').delete().eq('id', existing.id)
          const { data: post } = await admin.from('posts').select('likes_count').eq('id', path[1]).single()
          const newCount = Math.max(0, (post?.likes_count || 1) - 1)
          await admin.from('posts').update({ likes_count: newCount }).eq('id', path[1])
          return ok({ liked: false, likes_count: newCount })
        } else {
          await supabase.from('likes').insert({ post_id: path[1], user_id: user.id })
          const { data: post } = await admin.from('posts').select('likes_count').eq('id', path[1]).single()
          const newCount = (post?.likes_count || 0) + 1
          await admin.from('posts').update({ likes_count: newCount }).eq('id', path[1])
          return ok({ liked: true, likes_count: newCount })
        }
      }

      if (path.length === 3 && path[2] === 'comments' && method === 'GET') {
        const { data, error } = await supabase.from('comments')
          .select('*, profiles(full_name, profile_photo_url)')
          .eq('post_id', path[1])
          .order('created_at', { ascending: true })
        if (error) return err(error.message)
        return ok({ comments: data })
      }

      if (path.length === 3 && path[2] === 'comments' && method === 'POST') {
        const { content } = body
        if (!content) return err('Komentar tidak boleh kosong')
        const { data, error } = await supabase.from('comments').insert({
          post_id: path[1], user_id: user.id, content
        }).select('*, profiles(full_name, profile_photo_url)').single()
        if (error) return err(error.message)

        const admin = getSupabaseAdminClient()
        const { data: post } = await admin.from('posts').select('comments_count').eq('id', path[1]).single()
        await admin.from('posts').update({ comments_count: (post?.comments_count || 0) + 1 }).eq('id', path[1])

        return ok({ comment: data }, 201)
      }
    }

    // ---------------- AI (Gemini langsung via Google AI Studio SDK) ----------------
    if (path[0] === 'ai') {
      if (path[1] === 'chat' && method === 'POST') {
        const { message, history } = body
        if (!message) return err('Pesan wajib diisi')
        try {
          const answer = await geminiChat(history, message)
          return ok({ answer })
        } catch (e) {
          console.error('AI chat error:', e)
          return err('Asisten AI sedang tidak tersedia, coba lagi nanti', 500)
        }
      }

      if (path[1] === 'tips' && method === 'POST') {
        const { waste_type, waste_weight_kg, base_tips } = body
        try {
          const prompt = `Berikan 2-3 tips tambahan (jangan mengulang tips berikut: "${base_tips || ''}") untuk budidaya maggot BSF dengan jenis limbah "${waste_type}" seberat ${waste_weight_kg} kg. Jawab singkat dalam format poin bahasa Indonesia.`
          const tips = await geminiGenerate(prompt)
          return ok({ tips })
        } catch (e) {
          console.error('AI tips error:', e)
          return err('Tips AI sedang tidak tersedia, coba lagi nanti', 500)
        }
      }

      if (path[1] === 'failure-analysis' && method === 'POST') {
        try {
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
    }

    return err(`Route /${path.join('/')} tidak ditemukan`, 404)
  } catch (error) {
    console.error('API Error:', error)
    return err('Terjadi kesalahan pada server', 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
