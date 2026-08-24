import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { ModalShell, Field, uploadToStorage } from './Shared'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FAILURE_REASONS } from '@/lib/constants/wasteGuide'

export default function FailModal({ cycleId, userId, onClose, onDone }) {
  const [reason, setReason] = useState('hama')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      let photoUrl = null
      if (file) photoUrl = await uploadToStorage('failure-proof', file, userId)
      const res = await fetch(`/api/cycles/${cycleId}/fail`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, custom_reason: reason === 'lainnya' ? customReason : null, notes, photo_url: photoUrl })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onDone()
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <ModalShell title="Catat Kegagalan Siklus" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Alasan Kegagalan">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder="Pilih alasan" /></SelectTrigger>
            <SelectContent>
              {FAILURE_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {reason === 'lainnya' && (
          <Field label="Alasan Lainnya">
            <Input required value={customReason} onChange={e => setCustomReason(e.target.value)} />
          </Field>
        )}
        <Field label="Catatan Tambahan">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Ceritakan detail kegagalan..." />
        </Field>
        <Field label="Foto Bukti (opsional)">
          <label className="flex items-center justify-center gap-2 bg-stone-50 border border-stone-100 hover:bg-stone-100 transition-colors rounded-2xl py-4 text-sm font-bold text-stone-500 cursor-pointer">
            <Upload className="w-5 h-5 text-rose-500" /> {file ? file.name : 'Pilih foto'}
            <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        </Field>
        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-2xl px-4 py-3">{error}</p>}
        <div className="flex flex-row gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" disabled={loading} variant="destructive" className="flex-1">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tandai Gagal'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}
