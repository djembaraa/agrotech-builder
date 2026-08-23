'use client'

import { useState } from 'react'
import { Calculator as CalcIcon, Loader2, Sparkles, Info } from 'lucide-react'

const WASTE_OPTIONS = [
  { value: 'campuran', label: 'Campuran' },
  { value: 'sayur_buah', label: 'Sayur/Buah' },
  { value: 'ampas_tahu', label: 'Ampas Tahu' },
]

export default function Calculator() {
  const [weight, setWeight] = useState('')
  const [wasteType, setWasteType] = useState('campuran')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiTips, setAiTips] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  const calculate = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setResult(null); setAiTips('')
    try {
      const res = await fetch('/api/calculator/estimate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waste_weight_kg: Number(weight), waste_type: wasteType })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.result)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  const getAiTips = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/tips', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waste_type: wasteType, waste_weight_kg: weight, base_tips: result?.tips })
      })
      const data = await res.json()
      setAiTips(data.tips || data.error || '')
    } finally { setAiLoading(false) }
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto pb-24 space-y-5">
      <div>
        <h2 className="font-montserrat text-xl font-bold text-stone-800">Kalkulator Pakan</h2>
        <p className="text-stone-500 text-sm">Estimasi kebutuhan bibit & hasil panen</p>
      </div>

      <form onSubmit={calculate} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-stone-500">Jenis Limbah</label>
          <div className="flex flex-row gap-2">
            {WASTE_OPTIONS.map(o => (
              <button type="button" key={o.value} onClick={() => setWasteType(o.value)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${wasteType === o.value ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500'}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-stone-500">Berat Limbah (kg)</label>
          <input required type="number" min="0.1" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
            placeholder="Contoh: 10" className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CalcIcon className="w-4 h-4" /> Hitung Estimasi</>}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-[10px] text-emerald-600 font-semibold">Kebutuhan Bibit</p>
              <p className="text-lg font-bold text-emerald-700">{result.estimatedSeeds.toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-emerald-500">larva</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-[10px] text-amber-600 font-semibold">Estimasi Panen</p>
              <p className="text-lg font-bold text-amber-700">{result.harvestMin}–{result.harvestMax}</p>
              <p className="text-[10px] text-amber-500">kg</p>
            </div>
          </div>
          <div className="bg-stone-50 rounded-xl p-3 flex gap-2">
            <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <p className="text-xs text-stone-600 leading-relaxed">{result.tips}</p>
          </div>

          <button onClick={getAiTips} disabled={aiLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-semibold">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Dapatkan Tips AI Tambahan</>}
          </button>

          {aiTips && (
            <div className="bg-emerald-50/60 rounded-xl p-3 flex gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">{aiTips}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
