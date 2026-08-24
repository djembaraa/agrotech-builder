import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { ModalShell, Field, uploadToStorage } from './Shared'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function HarvestModal({ cycleId, userId, onClose, onDone }) {
  const [weight, setWeight] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      let proofUrl = null
      if (file) proofUrl = await uploadToStorage('harvest-proof', file, userId)
      const res = await fetch(`/api/cycles/${cycleId}/harvest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ harvest_weight_kg: weight, harvest_proof_url: proofUrl }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onDone()
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <ModalShell title="Tandai Panen" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Berat Hasil Panen (kg)">
          <Input required type="number" min="0.1" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
        </Field>
        <Field label="Foto Bukti Panen (opsional)">
          <label className="flex items-center justify-center gap-2 bg-stone-50 border border-stone-100 hover:bg-stone-100 transition-colors rounded-2xl py-4 text-sm font-bold text-stone-500 cursor-pointer">
            <Upload className="w-5 h-5 text-amber-500" /> {file ? file.name : 'Pilih foto'}
            <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        </Field>
        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-2xl px-4 py-3">{error}</p>}
        <div className="flex flex-row gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 shadow-amber-500/20">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Panen'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}
