# Agrotech BSF Builder

Aplikasi manajemen budidaya Maggot BSF (Black Soldier Fly) yang dilengkapi dengan fitur AI terintegrasi, kalkulator pakan (limbah organik), manajemen siklus panen, dan komunitas peternak. Proyek ini dibangun menggunakan Next.js 15, Supabase (Auth & Database), TailwindCSS, dan Gemini AI.

## Fitur Utama
- **Manajemen Siklus**: Lacak siklus panen BSF Anda mulai dari input limbah organik hingga hasil panen.
- **Kalkulator Pakan**: Hitung kebutuhan telur BSF berdasarkan berat dan jenis limbah yang Anda miliki.
- **AI Assistant**: Dapatkan tips dan analisis kegagalan siklus panen menggunakan kecerdasan buatan.
- **Komunitas**: Berbagi tips dan pengalaman antar sesama peternak Maggot BSF.

## Tech Stack
- **Frontend**: Next.js 15 (React 18), Tailwind CSS, shadcn/ui (Radix UI)
- **Backend**: Next.js API Routes (App Router)
- **Database & Auth**: Supabase
- **AI**: Gemini AI (`@google/genai`)

## Prasyarat
- Node.js versi 18+ (disarankan versi LTS)
- Akun Supabase (untuk Database & Auth)
- API Key Google Gemini (Google AI Studio)

## Cara Menjalankan Secara Lokal

1. Clone repositori ini.
2. Instal dependensi:
   ```bash
   npm install
   # atau
   yarn install
   ```
3. Salin file `.env.example` menjadi `.env.local` dan isi nilainya:
   ```bash
   cp .env.example .env.local
   ```
4. Jalankan *development server*:
   ```bash
   npm run dev
   # atau
   yarn dev
   ```
5. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.
