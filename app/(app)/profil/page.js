import ProfileWrapper from '@/components/agrotech/ProfileWrapper'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function ProfilPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: cycles } = await supabase.from('cycles').select('status, harvest_weight_kg').eq('user_id', user.id)
  
  const stats = {
      total: cycles?.length || 0,
      aktif: cycles?.filter(c => c.status === 'aktif').length || 0,
      panen: cycles?.filter(c => c.status === 'panen').length || 0,
      gagal: cycles?.filter(c => c.status === 'gagal').length || 0,
      total_harvest_kg: (cycles || []).reduce((sum, c) => sum + (Number(c.harvest_weight_kg) || 0), 0)
  }
  
  return <ProfileWrapper user={user} profile={profile} stats={stats} />
}
