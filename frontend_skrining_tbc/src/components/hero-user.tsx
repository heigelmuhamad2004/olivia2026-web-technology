"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

// Definisikan props untuk komponen
interface DashboardHeroProps {
  name: string
  onStartScreening: () => void // Tambahkan prop ini
}

export default function DashboardHero({
  name,
  onStartScreening, // Terima prop ini
}: DashboardHeroProps) {
  return (
    <section className="flex flex-col items-center rounded-xl border bg-card px-5 py-10 text-center text-card-foreground shadow-lg sm:py-16">
      <div className="max-w-xl">
        <p className="text-sm font-medium text-muted-foreground">
          Selamat Datang Kembali!
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Siap Memulai Screening, {name}?
        </h1>
        <p className="mt-4 text-muted-foreground">
          Lakukan screening kesehatan secara berkala untuk deteksi dini dan
          menjaga kesehatan Anda serta orang-orang di sekitar Anda.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {/* Gunakan prop onStartScreening pada tombol */}
          <Button onClick={onStartScreening}>Mulai Screening</Button>
          <Button asChild type="button" variant="outline">
            <Link href="/user/riwayat-screening">Lihat Riwayat</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}