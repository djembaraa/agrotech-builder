'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import CreateModal from './cycles/CreateModal'
import DetailModal from './cycles/DetailModal'
import { STATUS_BADGE, WASTE_LABELS } from './cycles/Shared'

const FILTERS = [
  { key: 'semua', label: 'Semua' },
  { key: 'aktif', label: 'Aktif' },
  { key: 'panen', label: 'Panen' },
  { key: 'gagal', label: 'Gagal' },
]

export default function Cycles({ userId, autoOpenCreate, autoOpenId, onConsumeAutoOpen }) {
  const [filter, setFilter] = useState('semua')
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const qs = filter !== 'semua' ? `?status=${filter}` : ''
    const res = await fetch(`/api/cycles${qs}`)
    const data = await res.json()
    setCycles(data.cycles || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (autoOpenCreate) { setShowCreate(true); onConsumeAutoOpen?.() }
    if (autoOpenId) { setDetailId(autoOpenId); onConsumeAutoOpen?.() }
  }, [autoOpenCreate, autoOpenId, onConsumeAutoOpen])

  return (
    <div className="min-h-screen bg-[#F9FBF9] pb-32">
      <div className="bg-gradient-to-b from-[#E8F0E5] to-[#F9FBF9] pt-8 pb-10 px-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-bold text-eco-900">Siklus Budidaya</h2>
          <button onClick={() => setShowCreate(true)}
            className="w-11 h-11 rounded-full bg-eco-600 hover:bg-eco-700 flex items-center justify-center shadow-lg shadow-eco-600/30 transition-transform active:scale-95">
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar pb-2">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-[1rem] text-xs font-bold whitespace-nowrap transition-all border ${filter === f.key ? 'bg-eco-600 text-white border-eco-600 shadow-md shadow-eco-600/20' : 'bg-white text-stone-500 hover:text-stone-700 border-white shadow-sm'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4 -mt-2 relative z-10">
        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-white border border-white shadow-[0_4px_15px_rgb(0,0,0,0.02)] rounded-[1.5rem] animate-pulse" />)}</div>
        ) : cycles.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] shadow-[0_4px_15px_rgb(0,0,0,0.02)] p-8 text-center text-stone-400 font-medium text-sm border border-white">Belum ada siklus di kategori ini.</div>
        ) : (
          <div className="space-y-3">
            {cycles.map(c => (
              <div key={c.id} onClick={() => setDetailId(c.id)}
                className="bg-white rounded-[1.5rem] shadow-[0_4px_15px_rgb(0,0,0,0.02)] p-5 cursor-pointer active:scale-[0.98] transition-transform border border-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-stone-800 text-base">{c.cycle_name}</p>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-stone-500 bg-stone-50 px-2 py-1 rounded-md">{WASTE_LABELS[c.waste_type]}</span>
                  <span className="text-xs font-medium text-stone-500 bg-stone-50 px-2 py-1 rounded-md">{c.waste_weight_kg} kg</span>
                  <span className="text-xs font-medium text-stone-500 bg-stone-50 px-2 py-1 rounded-md">{Number(c.seed_count).toLocaleString('id-ID')} bibit</span>
                </div>
                <p className="text-[11px] font-medium text-stone-400 mt-1 uppercase tracking-wider">Mulai: {new Date(c.start_date).toLocaleDateString('id-ID')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
      {detailId && <DetailModal id={detailId} userId={userId} onClose={() => setDetailId(null)} onChanged={load} />}
    </div>
  )
}
