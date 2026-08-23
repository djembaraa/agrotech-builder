import './globals.css'
import { Providers } from './providers'
import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
})

export const metadata = {
  title: 'Agrotech Tracker - Manajemen Budidaya Maggot BSF',
  description: 'Aplikasi pelacakan siklus budidaya maggot BSF, kalkulator pakan, dan forum komunitas peternak.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={montserrat.variable}>
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="bg-stone-50 text-stone-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
