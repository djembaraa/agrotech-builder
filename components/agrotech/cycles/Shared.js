import { X } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

export const WASTE_LABELS = { campuran: 'Campuran', sayur_buah: 'Sayur/Buah', ampas_tahu: 'Ampas Tahu' }
export const STATUS_BADGE = {
  aktif: 'bg-eco-100 text-eco-700 border-eco-200',
  panen: 'bg-amber-100 text-amber-700 border-amber-200',
  gagal: 'bg-rose-100 text-rose-700 border-rose-200',
}

export async function uploadToStorage(bucket, file, userId) {
  const supabase = getSupabaseBrowserClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in duration-300">
        <div className="flex items-center justify-between px-6 py-5 sticky top-0 bg-white border-b border-stone-50 z-10">
          <h3 className="font-serif text-lg font-bold text-stone-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</label>
      {children}
    </div>
  )
}

export function InfoRow({ label, value }) {
  return (
    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-stone-800 mt-1">{value}</p>
    </div>
  )
}

export function TimelineItem({ label, date, tone, notes, proofUrl }) {
  const dot = tone === 'rose' ? 'bg-rose-500' : tone === 'amber' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-eco-500 shadow-eco-500/50'
  return (
    <div className="flex items-start gap-4">
      <div className={`w-3 h-3 rounded-full mt-1.5 shadow-sm ${dot}`} />
      <div className="flex-1 pb-4 border-l border-stone-100 -ml-[23px] pl-[23px]">
        <p className="text-sm font-bold text-stone-700">{label}</p>
        <p className="text-xs text-stone-400 font-medium mt-0.5">{date ? new Date(date).toLocaleDateString('id-ID') : '-'}</p>
        {proofUrl && (
          <div className="mt-2 rounded-xl overflow-hidden max-w-[200px] border border-stone-100 shadow-sm">
            <img src={proofUrl} alt="Bukti" className="w-full h-auto object-cover" />
          </div>
        )}
        {notes && (
          <div className="mt-2 p-3 bg-stone-50 rounded-xl text-xs text-stone-600 whitespace-pre-line border border-stone-100/60 leading-relaxed font-medium">
            {notes}
          </div>
        )}
      </div>
    </div>
  )
}
