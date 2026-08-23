import './globals.css'
import { Providers } from './providers'
import { Montserrat } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
})

export const metadata = {
  title: 'Agrotech Tracker - Manajemen Budidaya Maggot BSF',
  description: 'Aplikasi pelacakan siklus budidaya maggot BSF, kalkulator pakan, forum komunitas peternak, dan asisten AI. Kelola budidaya Anda dengan lebih cerdas.',
  keywords: ['maggot bsf', 'budidaya maggot', 'black soldier fly', 'kalkulator pakan', 'agritech', 'pertanian'],
  openGraph: {
    title: 'Agrotech Tracker - Manajemen Budidaya Maggot BSF',
    description: 'Kelola siklus panen maggot BSF, hitung kebutuhan pakan, dan dapatkan tips dari AI.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'Agrotech Tracker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agrotech Tracker - Manajemen Budidaya Maggot BSF',
    description: 'Kelola siklus panen maggot BSF, hitung kebutuhan pakan, dan dapatkan tips dari AI.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={montserrat.variable}>
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="bg-stone-50 text-stone-900 antialiased">
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

