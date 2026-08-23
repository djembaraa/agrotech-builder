import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import NavbarWrapper from '@/components/agrotech/NavbarWrapper'
import BottomNavWrapper from '@/components/agrotech/BottomNavWrapper'
import AIChatWidget from '@/components/agrotech/AIChatWidget'

export default async function AppLayout({ children }) {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="min-h-screen bg-stone-50">
      <NavbarWrapper profile={profile} />
      <main>
        {children}
      </main>
      <AIChatWidget />
      <BottomNavWrapper />
    </div>
  )
}
