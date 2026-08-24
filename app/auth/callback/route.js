import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await getSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Set timeout or directly redirect
  redirect('/dashboard')
}
