import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Leaf, Sprout, Calculator, Users, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Agrotech Tracker — Kelola Budidaya Maggot BSF Anda',
  description: 'Platform manajemen budidaya maggot BSF terlengkap. Lacak siklus panen, hitung kebutuhan pakan, dan konsultasi dengan AI. Gratis untuk peternak Indonesia.',
}

const FEATURES = [
  { icon: Sprout, title: 'Manajemen Siklus', desc: 'Catat dan pantau setiap siklus panen dari input limbah hingga hasil panen secara real-time.' },
  { icon: Calculator, title: 'Kalkulator Pakan', desc: 'Estimasi cerdas kebutuhan bibit BSF dan proyeksi panen berdasarkan jenis & berat limbah organik Anda.' },
  { icon: Sparkles, title: 'Asisten AI', desc: 'Konsultasikan masalah budidaya, dapatkan tips personal, dan analisis pola kegagalan dengan kecerdasan buatan.' },
  { icon: Users, title: 'Komunitas Peternak', desc: 'Berbagi pengalaman, tips, dan pembelajaran bersama sesama peternak maggot BSF di seluruh Indonesia.' },
]

const BENEFITS = [
  'Gratis untuk digunakan',
  'Data tersimpan aman di cloud',
  'Tersedia di semua perangkat',
  'AI berbahasa Indonesia',
]

export default async function LandingPage() {
  // Jika sudah login, langsung masuk ke dashboard
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/dashboard')
  } catch {
    // Tidak perlu handle error — lanjutkan tampilkan landing page
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-stone-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-montserrat font-bold text-stone-800">Agrotech Tracker</span>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            Masuk / Daftar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Didukung Gemini AI
        </div>
        <h1 className="font-montserrat text-4xl sm:text-5xl font-bold text-stone-900 leading-tight mb-4">
          Kelola Budidaya<br />
          <span className="text-emerald-600">Maggot BSF</span> Lebih Cerdas
        </h1>
        <p className="text-stone-500 text-lg mb-8 max-w-xl mx-auto">
          Dari pencatatan siklus panen hingga analisis kegagalan berbasis AI — semua dalam satu platform untuk peternak Indonesia.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-md">
            Mulai Gratis <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-stone-700 font-semibold hover:bg-stone-50 transition-colors shadow-sm border border-stone-200">
            Masuk ke Akun
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-3xl mx-auto px-6 pb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {BENEFITS.map(b => (
            <div key={b} className="flex items-center gap-1.5 bg-white rounded-full px-4 py-2 text-sm text-stone-700 shadow-sm border border-stone-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {b}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="font-montserrat text-2xl font-bold text-stone-800 text-center mb-10">
          Semua yang Anda Butuhkan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl shadow-sm p-6 border border-stone-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-montserrat font-bold text-stone-800 mb-2">{title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-xl mx-auto px-6 py-16 text-center">
        <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-lg">
          <Leaf className="w-10 h-10 mx-auto mb-4 text-emerald-200" />
          <h2 className="font-montserrat text-2xl font-bold mb-2">Siap Mulai?</h2>
          <p className="text-emerald-100 text-sm mb-6">Bergabunglah dengan peternak BSF yang sudah menggunakan Agrotech Tracker.</p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-700 font-bold hover:bg-emerald-50 transition-colors">
            Daftar Sekarang <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-stone-400 text-xs border-t border-stone-100">
        © {new Date().getFullYear()} Agrotech Tracker. Dibuat dengan ❤️ untuk peternak Indonesia.
      </footer>
    </div>
  )
}
