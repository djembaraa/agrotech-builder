import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ModalShell, Field } from './Shared'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export default function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ cycle_name: '', start_date: new Date().toISOString().slice(0, 10), waste_type: 'campuran', waste_weight_kg: '', seed_count: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/cycles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onCreated()
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <ModalShell title="Buat Siklus Baru" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nama Siklus">
          <Input required value={form.cycle_name} onChange={e => setForm({ ...form, cycle_name: e.target.value })}
            placeholder="Contoh: Siklus Januari #1" />
        </Field>
        <Field label="Tanggal Mulai">
          <Input required type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
        </Field>
        <Field label="Jenis Limbah">
          <Select value={form.waste_type} onValueChange={v => setForm({ ...form, waste_type: v })}>
            <SelectTrigger><SelectValue placeholder="Pilih jenis limbah" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="campuran">Campuran</SelectItem>
              <SelectItem value="sayur_buah">Sayur/Buah</SelectItem>
              <SelectItem value="ampas_tahu">Ampas Tahu</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Berat Limbah (kg)">
          <Input required type="number" min="0.1" step="0.1" value={form.waste_weight_kg} onChange={e => setForm({ ...form, waste_weight_kg: e.target.value })} />
        </Field>
        <Field label="Jumlah Bibit (larva)">
          <Input required type="number" min="1" value={form.seed_count} onChange={e => setForm({ ...form, seed_count: e.target.value })} />
        </Field>
        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-2xl px-4 py-3">{error}</p>}
        <div className="flex flex-row gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Siklus'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}
