'use client'

import { useEffect, useState } from 'react'
import { Sprout, CheckCircle2, XCircle, Scale, Plus, Calculator as CalcIcon, Sparkles, Loader2 } from 'lucide-react'

export default function Dashboard({ profile, onNavigate }) {
  const [stats, setStats] = useState(null)
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightError, setInsightError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, cyclesRes] = await Promise.all([
          fetch('/api/profile/stats').then(r => r.json()),
          fetch('/api/cycles?status=aktif').then(r => r.json())
        ])
        setStats(statsRes.stats)
        setCycles(cyclesRes.cycles || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const loadInsight = async () => {
    setInsightLoading(true)
    setInsightError('')
    try {
      const res = await fetch('/api/ai/failure-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memuat analisis')
      setInsight(data.insight || '')
    } catch (e) {
      setInsightError(e.message)
    } finally {
      setInsightLoading(false)
    }
  }

  const statCards = [
    { label: 'Siklus Aktif', value: stats?.aktif ?? 0, icon: Sprout, bgClass: 'bg-emerald-100', textClass: 'text-emerald-600' },
    { label: 'Panen', value: stats?.panen ?? 0, icon: CheckCircle2, bgClass: 'bg-amber-100', textClass: 'text-amber-600' },
    { label: 'Gagal', value: stats?.gagal ?? 0, icon: XCircle, bgClass: 'bg-rose-100', textClass: 'text-rose-600' },
    { label: 'Total Panen (kg)', value: stats?.total_harvest_kg?.toFixed(1) ?? '0.0', icon: Scale, bgClass: 'bg-emerald-100', textClass: 'text-emerald-600' },
  ]

  return (
    <div className="px-4 py-4 space-y-5 max-w-lg mx-auto pb-24">
      <div>
        <h2 className="font-montserrat text-xl font-bold text-stone-800">Halo, {profile?.full_name?.split(' ')[0] || 'Peternak'} 👋</h2>
        <p className="text-stone-500 text-sm">Ringkasan budidaya maggot BSF Anda</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bgClass} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.textClass}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-stone-800 leading-none">{loading ? '-' : s.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-row gap-3">
        <button onClick={() => onNavigate('siklus', { openCreate: true })}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Siklus Baru
        </button>
        <button onClick={() => onNavigate('kalkulator')}
          className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2.5 text-sm font-semibold shadow-sm">
          <CalcIcon className="w-4 h-4" /> Kalkulator
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="font-montserrat font-semibold text-stone-800">Analisis AI - Pola Kegagalan</h3>
        </div>
        {!insight && !insightLoading && (
          <button onClick={loadInsight}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-semibold">
            <Sparkles className="w-4 h-4" /> Tampilkan Analisis
          </button>
        )}
        {insightLoading && (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          </div>
        )}
        {insightError && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{insightError}</p>}
        {insight && (
          <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">{insight}</p>
        )}
      </div>

      <div>
        <h3 className="font-montserrat font-semibold text-stone-800 mb-2">Siklus Aktif</h3>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-16 bg-stone-100 rounded-xl animate-pulse" />)}
          </div>
        ) : cycles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-stone-400 text-sm">
            Belum ada siklus aktif. Yuk mulai siklus baru!
          </div>
        ) : (
          <div className="space-y-2">
            {cycles.slice(0, 4).map(c => (
              <div key={c.id} onClick={() => onNavigate('siklus', { openId: c.id })}
                className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform">
                <div>
                  <p className="font-semibold text-stone-800 text-sm">{c.cycle_name}</p>
                  <p className="text-xs text-stone-500">{c.waste_weight_kg} kg • {Number(c.seed_count).toLocaleString('id-ID')} bibit</p>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">AKTIF</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
