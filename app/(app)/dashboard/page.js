import DashboardWrapper from '@/components/agrotech/DashboardWrapper'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return <DashboardWrapper profile={profile} />
}
