import Community from '@/components/agrotech/Community'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function KomunitasPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return <Community userId={user.id} profile={profile} />
}
