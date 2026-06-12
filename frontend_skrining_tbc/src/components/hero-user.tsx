"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Stethoscope, History, Check, AlertTriangle, Mic, Users } from "lucide-react"

interface DashboardHeroProps {
  name: string
  totalSkrining?: number
  totalPasien?: number
  lastSkriningDate?: string
  lastSkriningResult?: string | null
  onStartScreening: () => void
}

export default function DashboardHero({
  name,
  totalSkrining = 0,
  totalPasien = 0,
  lastSkriningDate,
  lastSkriningResult,
  onStartScreening,
}: DashboardHeroProps) {
  const isPositif = lastSkriningResult?.toLowerCase().includes("terduga") || lastSkriningResult?.toLowerCase().includes("suspek") || lastSkriningResult?.toLowerCase().includes("positif");

  return (
    <section
      className="relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm px-5 py-8 sm:px-8 sm:py-12 md:py-16"
      style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}
    >
      {/* ── Decorative Vercel Mesh Gradient Backdrop ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-[50%] -left-[10%] w-[70%] h-[150%] rounded-full opacity-[0.15] blur-3xl mix-blend-normal dark:mix-blend-screen"
          style={{ background: "radial-gradient(circle, #007cf0 0%, transparent 60%)" }}
        />
        <div 
          className="absolute -top-[20%] -right-[10%] w-[60%] h-[120%] rounded-full opacity-[0.15] blur-3xl mix-blend-normal dark:mix-blend-screen"
          style={{ background: "radial-gradient(circle, #ff0080 0%, transparent 60%)" }}
        />
        <div 
          className="absolute -bottom-[50%] left-[20%] w-[60%] h-[120%] rounded-full opacity-[0.15] blur-3xl mix-blend-normal dark:mix-blend-screen"
          style={{ background: "radial-gradient(circle, #f9cb28 0%, transparent 60%)" }}
        />
      </div>

      {/* ── Eyebrow badge ── */}
      <div className="relative z-10 mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
        />
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-foreground">
          Dashboard Pengguna
        </span>
      </div>

      {/* ── Heading ── */}
      <h1
        className="relative z-10 text-3xl md:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-tight text-foreground text-balance animate-in fade-in slide-in-from-bottom-3 duration-500 delay-150 fill-mode-both"
      >
        Selamat datang,{" "}
        <span className="text-primary">{name}</span>.
      </h1>
      <p
        className="relative z-10 mt-3 md:mt-4 max-w-xl text-sm md:text-base leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300 fill-mode-both text-balance"
      >
        Lakukan skrining secara berkala untuk deteksi dini TBC dan menjaga
        kesehatan dirimu serta orang-orang di sekitarmu.
      </p>

      {/* ── Actions ── */}
      <div
        className="relative z-10 mt-6 md:mt-8 flex flex-col sm:flex-row flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-500 fill-mode-both"
      >
        <Button
          onClick={onStartScreening}
          className="rounded-full px-6 text-[14px] h-10 w-full sm:w-auto font-medium shadow-sm"
        >
          <Stethoscope className="w-4 h-4 mr-2" aria-hidden="true" />
          Mulai Skrining
        </Button>
        <Button variant="outline" className="rounded-full px-6 text-[14px] h-10 w-full sm:w-auto font-medium bg-background" asChild>
          <Link href="/user/riwayat-screening">
            <History className="w-4 h-4 mr-2" aria-hidden="true" />
            Lihat Riwayat
          </Link>
        </Button>
      </div>

      {/* ── Status badges ── */}
      <div
        className="relative z-10 mt-8 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-700 fill-mode-both pt-6 border-t border-border/50"
      >
        {lastSkriningResult && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium ${
              !isPositif
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {!isPositif ? (
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            Skrining terakhir: {lastSkriningResult}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[12px] font-medium text-blue-600 dark:text-blue-400">
          <Mic className="w-3.5 h-3.5" aria-hidden="true" />
          Analisis suara tersedia
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-[12px] font-medium text-foreground">
          <Users className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          {totalPasien} pasien terdaftar
        </span>
      </div>
    </section>
  )
}
