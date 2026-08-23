'use client'
import { useRouter, usePathname } from 'next/navigation'
import Cycles from './Cycles'

export default function CyclesWrapper({ userId, autoOpenCreate, autoOpenId }) {
  const router = useRouter()
  const pathname = usePathname()
  const handleConsume = () => {
    router.replace(pathname) // clear search params
  }
  return <Cycles userId={userId} autoOpenCreate={autoOpenCreate} autoOpenId={autoOpenId} onConsumeAutoOpen={handleConsume} />
}
