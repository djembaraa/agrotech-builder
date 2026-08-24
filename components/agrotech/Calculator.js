'use client'

import { useState } from 'react'
import { Calculator as CalcIcon, Loader2, Sparkles, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

  const calculate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setAiTips('')
    try {
      const res = await fetch('/api/calculator/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waste_weight_kg: Number(weight), waste_type: wasteType })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal menghitung estimasi')
      } else {
        setResult(data.result)
        toast.success('Estimasi berhasil dihitung!')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  const getAiTips = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waste_type: wasteType, waste_weight_kg: weight, base_tips: result?.tips })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Tips AI tidak tersedia')
      } else {
        setAiTips(data.tips || '')
      }
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FBF9] pb-32">
      <div className="bg-gradient-to-b from-[#E8F0E5] to-[#F9FBF9] pt-8 pb-10 px-5">
        <h2 className="font-serif text-2xl font-bold text-eco-900">Kalkulator Pakan</h2>
        <p className="text-eco-700/80 text-sm mt-1">Estimasi kebutuhan bibit &amp; proyeksi panen</p>
      </div>

      <div className="px-5 space-y-6 -mt-4 relative z-10">
        <form onSubmit={calculate} className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-5 border border-white">
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Jenis Limbah</Label>
            <div className="flex flex-row gap-2">
              {WASTE_OPTIONS.map(o => (
                <button type="button" key={o.value} onClick={() => setWasteType(o.value)}
                  className={`flex-1 py-3 rounded-[1.2rem] text-xs font-bold transition-all active:scale-95 ${wasteType === o.value ? 'bg-eco-600 text-white shadow-lg shadow-eco-600/20' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="weight" className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Berat Limbah (kg)</Label>
            <Input
              id="weight"
              required
              type="number"
              min="0.1"
              step="0.1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="Contoh: 10"
              className="rounded-2xl bg-stone-50 border-0 focus-visible:ring-eco-500 h-14 px-5 text-lg font-bold"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-2xl bg-eco-600 hover:bg-eco-700 h-14 shadow-lg shadow-eco-600/20 font-bold transition-transform active:scale-95 text-white">
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Menghitung...</>
              : <><CalcIcon className="w-5 h-5 mr-2" /> Hitung Estimasi</>
            }
          </Button>
        </form>

        {result && (
          <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-5 border border-white animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-eco-50/50 rounded-[1.5rem] p-4 border border-eco-100">
                <p className="text-[10px] text-eco-600 font-bold uppercase tracking-wide">Kebutuhan Bibit</p>
                <p className="text-2xl font-bold text-eco-800 mt-1">{result.estimatedSeeds.toLocaleString('id-ID')}</p>
                <p className="text-xs text-eco-600 font-medium">larva</p>
              </div>
              <div className="bg-amber-50/50 rounded-[1.5rem] p-4 border border-amber-100">
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">Estimasi Panen</p>
                <p className="text-2xl font-bold text-amber-800 mt-1">{result.harvestMin}–{result.harvestMax}</p>
                <p className="text-xs text-amber-600 font-medium">kg</p>
              </div>
            </div>
            <div className="bg-stone-50 rounded-[1.2rem] p-4 flex gap-3">
              <Info className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
              <p className="text-sm text-stone-600 leading-relaxed font-medium">{result.tips}</p>
            </div>

            <Button
              onClick={getAiTips}
              disabled={aiLoading}
              className="w-full rounded-2xl bg-stone-800 hover:bg-stone-900 h-12 text-sm font-bold shadow-md transition-transform active:scale-95 text-white"
            >
              {aiLoading
                ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat tips...</>
                : <><Sparkles className="w-5 h-5 mr-2 text-amber-400" /> Dapatkan Tips AI Tambahan</>
              }
            </Button>

            {aiTips && (
              <div className="bg-eco-50 rounded-[1.2rem] p-4 flex gap-3 border border-eco-100 animate-in fade-in">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line font-medium">{aiTips}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
