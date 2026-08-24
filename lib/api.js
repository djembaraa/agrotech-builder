import { NextResponse } from 'next/server'

export function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export function ok(data, status = 200) {
  return handleCORS(NextResponse.json(data, { status }))
}

export function err(message, status = 400) {
  return handleCORS(NextResponse.json({ error: message }, { status }))
}

export async function getAuthUser(supabase) {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return data.user
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
