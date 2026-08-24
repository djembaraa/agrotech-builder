import { useState, useCallback, useEffect } from 'react'
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ModalShell, InfoRow, TimelineItem, WASTE_LABELS, STATUS_BADGE } from './Shared'
import { FAILURE_REASONS } from '@/lib/constants/wasteGuide'
import FailModal from './FailModal'
import HarvestModal from './HarvestModal'
import { Button } from '@/components/ui/button'

function reasonLabel(v) { return FAILURE_REASONS.find(r => r.value === v)?.label || v }

export default function DetailModal({ id, userId, onClose, onChanged }) {
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
    return <ModalShell title="Detail Siklus" onClose={onClose}><div className="h-40 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-eco-600" /></div></ModalShell>
  }

  const c = data.cycle

  return (
    <ModalShell title={c.cycle_name} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-center gap-3 bg-stone-50 rounded-full w-fit p-1 pr-4 border border-stone-100">
          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase border ${STATUS_BADGE[c.status]}`}>{c.status}</span>
          <span className="text-xs font-medium text-stone-500">Mulai {new Date(c.start_date).toLocaleDateString('id-ID')}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="Jenis Limbah" value={WASTE_LABELS[c.waste_type]} />
          <InfoRow label="Berat Limbah" value={`${c.waste_weight_kg} kg`} />
          <InfoRow label="Jumlah Bibit" value={`${Number(c.seed_count).toLocaleString('id-ID')} larva`} />
          {c.harvest_weight_kg && <InfoRow label="Hasil Panen" value={`${c.harvest_weight_kg} kg`} />}
        </div>

        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-4">Timeline Perjalanan</p>
          <div className="ml-1">
            <TimelineItem label="Siklus dimulai" date={c.start_date} />
            {c.status === 'panen' && <TimelineItem label={`Dipanen — ${c.harvest_weight_kg} kg`} date={c.end_date} tone="amber" notes={c.notes} proofUrl={c.harvest_proof_url} />}
            {c.status === 'gagal' && data.failure_logs?.map(f => (
              <TimelineItem key={f.id} label={`Gagal — ${f.reason === 'lainnya' ? f.custom_reason : reasonLabel(f.reason)}`} date={f.logged_at} tone="rose" notes={f.notes} proofUrl={f.photo_url} />
            ))}
          </div>
        </div>

        {c.status === 'aktif' && (
          <div className="flex flex-row gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowFail(true)} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100">
              <AlertTriangle className="w-4 h-4" /> Tandai Gagal
            </Button>
            <Button onClick={() => setShowHarvest(true)} className="flex-1 bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white">
              <CheckCircle2 className="w-4 h-4" /> Tandai Panen
            </Button>
          </div>
        )}
      </div>

      {showFail && <FailModal cycleId={c.id} userId={userId} onClose={() => setShowFail(false)} onDone={() => { setShowFail(false); load(); onChanged() }} />}
      {showHarvest && <HarvestModal cycleId={c.id} userId={userId} onClose={() => setShowHarvest(false)} onDone={() => { setShowHarvest(false); load(); onChanged() }} />}
    </ModalShell>
  )
}
