import CyclesWrapper from '@/components/agrotech/CyclesWrapper'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function SiklusPage({ searchParams }) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const resolvedParams = await searchParams
  const { openCreate, openId } = resolvedParams || {}
  return <CyclesWrapper userId={user.id} autoOpenCreate={!!openCreate} autoOpenId={openId} />
}
