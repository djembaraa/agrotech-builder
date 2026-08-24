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
    { label: 'Siklus Aktif', value: stats?.aktif ?? 0, icon: Sprout, bgClass: 'bg-eco-100', textClass: 'text-eco-600' },
    { label: 'Total Panen', value: stats?.panen ?? 0, icon: CheckCircle2, bgClass: 'bg-amber-100', textClass: 'text-amber-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F0E5] via-[#F9FBF9] to-[#F9FBF9] pb-32">
      {/* Header Section */}
      <div className="px-5 pt-8 pb-4">
        <h2 className="font-serif text-2xl font-bold text-eco-900">Selamat Pagi, {profile?.full_name?.split(' ')[0] || 'Peternak'}</h2>
        <p className="text-eco-700/80 text-sm mt-1">Mari selamatkan bumi bersama Maggot BSF.</p>
      </div>

      <div className="px-5 space-y-6">
        {/* Main Impact Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 relative overflow-hidden border border-white">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-eco-100 rounded-full blur-2xl opacity-60"></div>
          <p className="text-xs font-semibold text-stone-500 mb-1 relative z-10">Total Panen (kg)</p>
          <div className="flex items-end justify-between relative z-10">
            <div>
              <p className="text-4xl font-bold text-eco-800">{loading ? '-' : (stats?.total_harvest_kg?.toFixed(1) ?? '0.0')}</p>
              <p className="text-xs text-eco-600 mt-1 font-medium bg-eco-50 inline-block px-2 py-1 rounded-full">+12% vs bulan lalu</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center shadow-lg shadow-eco-500/30">
              <Scale className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Snapshot / Mini Stats */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-stone-800 text-lg">Snapshot</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-4 flex flex-col items-start gap-3 border border-white">
                <div className={`w-10 h-10 rounded-full ${s.bgClass} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.textClass}`} />
                </div>
                <div>
                  <p className="text-xs text-stone-500 font-medium">{s.label}</p>
                  <p className="text-2xl font-bold text-stone-800 leading-tight mt-0.5">{loading ? '-' : s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3">
          <button onClick={() => onNavigate('siklus', { openCreate: true })}
            className="flex-1 flex items-center justify-center gap-2 bg-eco-600 hover:bg-eco-700 text-white rounded-[1.2rem] py-3.5 text-sm font-semibold shadow-lg shadow-eco-600/20 transition-transform active:scale-95">
            <Plus className="w-4 h-4" /> Siklus Baru
          </button>
          <button onClick={() => onNavigate('kalkulator')}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-eco-800 border border-eco-200 rounded-[1.2rem] py-3.5 text-sm font-semibold shadow-sm transition-transform active:scale-95">
            <CalcIcon className="w-4 h-4" /> Kalkulator
          </button>
        </div>

        {/* AI Insight Card */}
        <div className="bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 border border-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-serif font-bold text-stone-800">Saran Cerdas (AI)</h3>
          </div>
          {!insight && !insightLoading && (
            <button onClick={loadInsight}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-600 text-sm font-medium border border-stone-100 transition-colors">
              Minta analisis pola budidaya
            </button>
          )}
          {insightLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-eco-600" />
            </div>
          )}
          {insightError && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3">{insightError}</p>}
          {insight && (
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line bg-stone-50 p-4 rounded-xl">{insight}</p>
          )}
        </div>

        {/* Active Cycles */}
        <div>
          <h3 className="font-serif font-bold text-stone-800 text-lg mb-3">Siklus Aktif</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 bg-white shadow-sm rounded-[1.2rem] animate-pulse" />)}
            </div>
          ) : cycles.length === 0 ? (
            <div className="bg-white rounded-[1.5rem] shadow-sm p-8 text-center border border-white">
              <p className="text-stone-400 text-sm font-medium">Belum ada siklus aktif.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cycles.slice(0, 4).map(c => (
                <div key={c.id} onClick={() => onNavigate('siklus', { openId: c.id })}
                  className="bg-white rounded-[1.2rem] shadow-[0_4px_15px_rgb(0,0,0,0.02)] p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform border border-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-eco-50 flex items-center justify-center shrink-0">
                      <Sprout className="w-5 h-5 text-eco-600" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-800 text-sm">{c.cycle_name}</p>
                      <p className="text-[11px] font-medium text-stone-500 mt-0.5">{c.waste_weight_kg} kg • {Number(c.seed_count).toLocaleString('id-ID')} bibit</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-eco-100 text-eco-700 px-2.5 py-1 rounded-full">AKTIF</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
