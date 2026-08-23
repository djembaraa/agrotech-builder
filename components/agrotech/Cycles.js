'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, X, Loader2, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { FAILURE_REASONS } from '@/lib/constants/wasteGuide'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

const WASTE_LABELS = { campuran: 'Campuran', sayur_buah: 'Sayur/Buah', ampas_tahu: 'Ampas Tahu' }
const STATUS_BADGE = {
  aktif: 'bg-emerald-100 text-emerald-700',
  panen: 'bg-amber-100 text-amber-700',
  gagal: 'bg-rose-100 text-rose-700',
}
const FILTERS = [
  { key: 'semua', label: 'Semua' },
  { key: 'aktif', label: 'Aktif' },
  { key: 'panen', label: 'Panen' },
  { key: 'gagal', label: 'Gagal' },
]

async function uploadToStorage(bucket, file, userId) {
  const supabase = getSupabaseBrowserClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

function reasonLabel(v) { return FAILURE_REASONS.find(r => r.value === v)?.label || v }

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
    <div className="px-4 py-4 max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-montserrat text-xl font-bold text-stone-800">Siklus Budidaya</h2>
        <button onClick={() => setShowCreate(true)}
          className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex flex-row gap-2 mb-4 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter === f.key ? 'bg-emerald-600 text-white' : 'bg-white text-stone-500 shadow-sm'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-stone-100 rounded-2xl animate-pulse" />)}</div>
      ) : cycles.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-stone-400 text-sm">Belum ada siklus di kategori ini.</div>
      ) : (
        <div className="space-y-2">
          {cycles.map(c => (
            <div key={c.id} onClick={() => setDetailId(c.id)}
              className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer active:scale-[0.99] transition-transform">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-semibold text-stone-800 text-sm">{c.cycle_name}</p>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${STATUS_BADGE[c.status]}`}>{c.status}</span>
              </div>
              <p className="text-xs text-stone-500">{WASTE_LABELS[c.waste_type]} • {c.waste_weight_kg} kg • {Number(c.seed_count).toLocaleString('id-ID')} bibit</p>
              <p className="text-xs text-stone-400 mt-1">Mulai: {new Date(c.start_date).toLocaleDateString('id-ID')}</p>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
      {detailId && <DetailModal id={detailId} userId={userId} onClose={() => setDetailId(null)} onChanged={load} />}
    </div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-lg w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white">
          <h3 className="font-montserrat font-bold text-stone-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-stone-500">{label}</label>
      {children}
    </div>
  )
}

function CreateModal({ onClose, onCreated }) {
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
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nama Siklus">
          <input required value={form.cycle_name} onChange={e => setForm({ ...form, cycle_name: e.target.value })}
            placeholder="Contoh: Siklus Januari #1" className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </Field>
        <Field label="Tanggal Mulai">
          <input required type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
            className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </Field>
        <Field label="Jenis Limbah">
          <select value={form.waste_type} onChange={e => setForm({ ...form, waste_type: e.target.value })}
            className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="campuran">Campuran</option>
            <option value="sayur_buah">Sayur/Buah</option>
            <option value="ampas_tahu">Ampas Tahu</option>
          </select>
        </Field>
        <Field label="Berat Limbah (kg)">
          <input required type="number" min="0.1" step="0.1" value={form.waste_weight_kg} onChange={e => setForm({ ...form, waste_weight_kg: e.target.value })}
            className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </Field>
        <Field label="Jumlah Bibit (larva)">
          <input required type="number" min="1" value={form.seed_count} onChange={e => setForm({ ...form, seed_count: e.target.value })}
            className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </Field>
        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex flex-row gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-600 text-sm font-semibold">Batal</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="bg-stone-50 rounded-xl p-2.5">
      <p className="text-[10px] text-stone-400">{label}</p>
      <p className="text-sm font-semibold text-stone-700">{value}</p>
    </div>
  )
}

function TimelineItem({ label, date, tone }) {
  const dot = tone === 'rose' ? 'bg-rose-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-start gap-3">
      <div className={`w-2.5 h-2.5 rounded-full mt-1 ${dot}`} />
      <div>
        <p className="text-sm text-stone-700">{label}</p>
        <p className="text-xs text-stone-400">{date ? new Date(date).toLocaleDateString('id-ID') : '-'}</p>
      </div>
    </div>
  )
}

function DetailModal({ id, userId, onClose, onChanged }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFail, setShowFail] = useState(false)
  const [showHarvest, setShowHarvest] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/cycles/${id}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading || !data || !data.cycle) {
    return <ModalShell title="Detail Siklus" onClose={onClose}><div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div></ModalShell>
  }

  const c = data.cycle

  return (
    <ModalShell title={c.cycle_name} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${STATUS_BADGE[c.status]}`}>{c.status}</span>
          <span className="text-xs text-stone-400">Mulai {new Date(c.start_date).toLocaleDateString('id-ID')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <InfoRow label="Jenis Limbah" value={WASTE_LABELS[c.waste_type]} />
          <InfoRow label="Berat Limbah" value={`${c.waste_weight_kg} kg`} />
          <InfoRow label="Jumlah Bibit" value={Number(c.seed_count).toLocaleString('id-ID')} />
          {c.harvest_weight_kg && <InfoRow label="Hasil Panen" value={`${c.harvest_weight_kg} kg`} />}
        </div>

        <div>
          <p className="text-xs font-semibold text-stone-500 mb-2">Timeline</p>
          <div className="space-y-2">
            <TimelineItem label="Siklus dimulai" date={c.start_date} />
            {c.status === 'panen' && <TimelineItem label={`Dipanen — ${c.harvest_weight_kg} kg`} date={c.end_date} tone="amber" />}
            {c.status === 'gagal' && data.failure_logs?.map(f => (
              <TimelineItem key={f.id} label={`Gagal — ${f.reason === 'lainnya' ? f.custom_reason : reasonLabel(f.reason)}`} date={f.logged_at} tone="rose" />
            ))}
          </div>
        </div>

        {c.status === 'aktif' && (
          <div className="flex flex-row gap-3 pt-2">
            <button onClick={() => setShowFail(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" /> Tandai Gagal
            </button>
            <button onClick={() => setShowHarvest(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Tandai Panen
            </button>
          </div>
        )}
      </div>

      {showFail && <FailModal cycleId={c.id} userId={userId} onClose={() => setShowFail(false)} onDone={() => { setShowFail(false); load(); onChanged() }} />}
      {showHarvest && <HarvestModal cycleId={c.id} userId={userId} onClose={() => setShowHarvest(false)} onDone={() => { setShowHarvest(false); load(); onChanged() }} />}
    </ModalShell>
  )
}

function HarvestModal({ cycleId, userId, onClose, onDone }) {
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
      <form onSubmit={submit} className="space-y-3">
        <Field label="Berat Hasil Panen (kg)">
          <input required type="number" min="0.1" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
            className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
        </Field>
        <Field label="Foto Bukti Panen (opsional)">
          <label className="flex items-center justify-center gap-2 bg-stone-100 rounded-xl py-4 text-sm text-stone-500 cursor-pointer">
            <Upload className="w-4 h-4" /> {file ? file.name : 'Pilih foto'}
            <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        </Field>
        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex flex-row gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-600 text-sm font-semibold">Batal</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Panen'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function FailModal({ cycleId, userId, onClose, onDone }) {
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
      <form onSubmit={submit} className="space-y-3">
        <Field label="Alasan Kegagalan">
          <select value={reason} onChange={e => setReason(e.target.value)}
            className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500">
            {FAILURE_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
        {reason === 'lainnya' && (
          <Field label="Alasan Lainnya">
            <input required value={customReason} onChange={e => setCustomReason(e.target.value)}
              className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500" />
          </Field>
        )}
        <Field label="Catatan Tambahan">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Ceritakan detail kegagalan..."
            className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500" />
        </Field>
        <Field label="Foto Bukti (opsional)">
          <label className="flex items-center justify-center gap-2 bg-stone-100 rounded-xl py-4 text-sm text-stone-500 cursor-pointer">
            <Upload className="w-4 h-4" /> {file ? file.name : 'Pilih foto'}
            <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        </Field>
        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex flex-row gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-600 text-sm font-semibold">Batal</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tandai Gagal'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
