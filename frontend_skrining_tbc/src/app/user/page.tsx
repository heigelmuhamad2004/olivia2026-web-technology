"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  ClipboardList, 
  Users, 
  Calendar, 
  Mic, 
  BookOpen, 
  Stethoscope, 
  Loader2, 
  Plus, 
  ChevronRight,
  ArrowRight
} from "lucide-react"

import DashboardHero from "@/components/hero-user"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import api from "@/app/services/api"
import {
  getCurrentUser,
  getActiveToken,
  logoutUser,
} from "@/app/services/auth.services"
import { getRiwayatSkriningByPasien, SkriningRiwayat } from "@/app/services/skrining.services"

type Patient = {
  id: number
  nama: string
  user_id?: number
  nik?: string
  alamat?: string
  tanggal_lahir?: string
  usia?: number
  jenis_kelamin?: string
  no_hp?: string
  pekerjaan?: string
}

type SkriningRiwayatWithPatient = SkriningRiwayat & { patientName: string }

// ── Komponen internal: StatCard ──────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {label}
      </p>
      <p className="text-2xl font-semibold leading-none tracking-tight text-foreground">
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>
      )}
    </div>
  )
}

// ── Komponen internal: QuickActionCard ───────────────────────────────────────
function QuickActionCard({
  icon: Icon,
  iconVariant,
  title,
  description,
  href,
  onClick,
}: {
  icon: React.ElementType
  iconVariant: "primary" | "dark" | "outline"
  title: string
  description: string
  href?: string
  onClick?: () => void
}) {
  const iconClass =
    iconVariant === "primary"
      ? "bg-primary/10 border border-primary/20 text-primary"
      : iconVariant === "dark"
      ? "bg-primary text-primary-foreground"
      : "bg-muted border border-border text-muted-foreground"

  const inner = (
    <>
      <div
        className={`mb-3 flex h-8 w-8 items-center justify-center rounded-[8px] ${iconClass}`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="text-[14px] font-semibold leading-snug tracking-tight text-foreground">
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      <span className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary">
        Buka
        <ArrowRight className="w-3 h-3" aria-hidden="true" />
      </span>
    </>
  )

  const cardClass =
    "flex flex-col rounded-lg border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5 shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]"

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={`${cardClass} text-left`}>
      {inner}
    </button>
  )
}

// ── Komponen internal: ActivityRow ───────────────────────────────────────────
function ActivityRow({
  icon: Icon,
  iconVariant,
  label,
  sub,
  status,
}: {
  icon: React.ElementType
  iconVariant: "primary" | "dark" | "muted"
  label: string
  sub: string
  status?: { label: string; variant: "green" | "gray" | "red" }
}) {
  const iconClass =
    iconVariant === "primary"
      ? "bg-primary/10 border border-primary/20 text-primary"
      : iconVariant === "dark"
      ? "bg-foreground text-background"
      : "bg-muted border border-border text-muted-foreground"

  const statusClass =
    status?.variant === "green"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : status?.variant === "red"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground"

  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0 last:pb-0">
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] ${iconClass}`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-medium text-foreground">
          {label}
        </p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      {status && (
        <span
          className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusClass}`}
        >
          {status.label}
        </span>
      )}
    </div>
  )
}

// ── Halaman utama ────────────────────────────────────────────────────────────
export default function UserDashboardPage() {
  const router = useRouter()
  const [isPatientModalOpen, setIsPatientModalOpen] = React.useState(false)
  const [userName, setUserName] = React.useState<string>("")
  const [patients, setPatients] = React.useState<Patient[]>([])
  const [histories, setHistories] = React.useState<SkriningRiwayatWithPatient[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const init = async () => {
      try {
        const activeToken = getActiveToken()
        if (!activeToken) {
          router.push("/auth/login")
          return
        }
        const userData = await getCurrentUser()
        if (!userData) {
          router.push("/auth/login")
          return
        }
        setUserName(userData.nama || "")

        const res = await api.get("/pasien", {
          headers: { Authorization: `Bearer ${activeToken}` },
        })
        const allPatients: Patient[] =
          (res.data && (res.data.data ?? res.data)) || []
        const myPatients = userData.id
          ? allPatients.filter(
              (p) => Number(p.user_id) === Number(userData.id)
            )
          : allPatients
        setPatients(myPatients)
        
        // Ambil Data History dari semua pasien user
        const allHistories: SkriningRiwayatWithPatient[] = []
        await Promise.all(
          myPatients.map(async (p) => {
            try {
              const res = await getRiwayatSkriningByPasien(p.id.toString())
              const withPatientName = res.map((r: SkriningRiwayat) => ({ ...r, patientName: p.nama }))
              allHistories.push(...withPatientName)
            } catch (e) {
              console.error(`Gagal memuat history pasien ${p.id}:`, e)
            }
          })
        )
        
        // Sort riwayat terbaru di atas
        allHistories.sort((a, b) => new Date(b.tanggal_screening).getTime() - new Date(a.tanggal_screening).getTime())
        setHistories(allHistories)
      } catch (err) {
        console.error("Gagal memuat user/pasien:", err)
        try {
          await logoutUser()
        } catch {
          localStorage.removeItem("activeSessionId")
        }
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const handleSelectPatient = (patientId: number) => {
    setIsPatientModalOpen(false)
    router.push(`/user/screening-kesehatan?pasienId=${patientId}`)
  }

  // Format tanggal ke lokal Indonesia
  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
          <Loader2 className="animate-spin h-5 w-5 text-primary" aria-hidden="true" />
          Memuat dashboard...
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className="flex min-h-[calc(100vh-5rem)] w-full justify-center px-4 pb-24 pt-10"
        style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}
      >
        <div className="w-full max-w-5xl space-y-4">

          {/* ── Hero ── */}
          <DashboardHero
            name={userName || "Pengguna"}
            totalSkrining={histories.length}
            totalPasien={patients.length}
            lastSkriningDate={histories.length > 0 ? formatDate(histories[0].tanggal_screening) : undefined}
            lastSkriningResult={histories.length > 0 ? histories[0].hasil_screening : null}
            onStartScreening={() => setIsPatientModalOpen(true)}
          />

          {/* ── Stats grid ── */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
            <StatCard
              icon={ClipboardList}
              label="Total Skrining"
              value={histories.length}
              sub="Semua pasien"
            />
            <StatCard
              icon={Users}
              label="Pasien"
              value={patients.length}
              sub="Terdaftar di akun ini"
            />
            <StatCard
              icon={Calendar}
              label="Skrining Terakhir"
              value={histories.length > 0 ? formatDate(histories[0].tanggal_screening).split(" ")[0] + " " + formatDate(histories[0].tanggal_screening).split(" ")[1] : "-"}
              sub={histories.length > 0 ? formatDate(histories[0].tanggal_screening).split(" ")[2] : "Belum ada"}
            />
          </div>

          {/* ── Quick action cards ── */}
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground"
               style={{ fontFamily: "monospace" }}>
              Aksi Cepat
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickActionCard
                icon={ClipboardList}
                iconVariant="dark"
                title="Formulir Skrining."
                description="14 indikator gejala klinis resmi Kemenkes RI."
                onClick={() => setIsPatientModalOpen(true)}
              />
              <QuickActionCard
                icon={Users}
                iconVariant="outline"
                title="Kelola Pasien."
                description="Tambah dan kelola data anggota keluarga."
                href="/user/data-screening"
              />
            </div>
          </div>

          {/* ── Aktivitas + Edukasi ── */}
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Aktivitas terakhir */}
            <div className="rounded-lg border bg-card shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a] p-5 flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-foreground">
                  Aktivitas terakhir.
                </h2>
                <Link
                  href="/user/riwayat-screening"
                  className="text-[11px] flex items-center font-medium text-primary hover:underline"
                >
                  Lihat semua
                  <ChevronRight className="ml-0.5 h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
              
              {/* Loop Data Asli */}
              <div className="flex-1">
                {histories.slice(0, 3).map((h) => {
                  const isSuspek = h.hasil_screening.toLowerCase().includes("terduga") || h.hasil_screening.toLowerCase().includes("positif") || h.hasil_screening.toLowerCase().includes("suspek");
                  return (
                    <ActivityRow
                      key={h.id}
                      icon={h.metode_skrining?.includes("Form") || !h.metode_skrining ? ClipboardList : Mic}
                      iconVariant={h.metode_skrining?.includes("Form") || !h.metode_skrining ? "primary" : "muted"}
                      label={`Skrining — ${h.patientName}`}
                      sub={formatDate(h.tanggal_screening)}
                      status={{ 
                        label: h.hasil_screening, 
                        variant: isSuspek ? "red" : "green" 
                      }}
                    />
                  )
                })}
                {histories.length === 0 && (
                  <div className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">Belum ada riwayat aktivitas.</p>
                  </div>
                )}
              </div>

              {/* Langkah selanjutnya */}
              <div className="mt-4 rounded-md border bg-muted/50 p-3.5">
                <p className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                  <ArrowRight className="h-3 w-3 text-primary" aria-hidden="true" />
                  Langkah selanjutnya.
                </p>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  Jika ada keluhan baru (batuk lama, berat badan turun, demam
                  tanpa sebab), lakukan skrining ulang dan pertimbangkan
                  konsultasi ke puskesmas.
                </p>
              </div>
            </div>

            {/* Edukasi TBC */}
            <div className="overflow-hidden rounded-lg border bg-card shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]">
              <div className="flex items-center gap-3 bg-foreground px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-primary/20">
                  <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-background">
                    Edukasi TBC.
                  </p>
                  <p className="text-[11px] text-background/60">
                    Informasi penting tentang Tuberkulosis
                  </p>
                </div>
              </div>
              <ul className="divide-y divide-border px-5">
                {[
                  "Segera periksa ke puskesmas jika mengalami batuk lebih dari 2 minggu yang tidak kunjung sembuh.",
                  "Jaga daya tahan tubuh dengan makan bergizi seimbang, istirahat cukup, dan hindari rokok.",
                  "TBC dapat disembuhkan dengan pengobatan 6–9 bulan yang konsisten sesuai anjuran tenaga kesehatan.",
                  "Gunakan masker dan hindari kontak dekat jika sedang menjalani pengobatan TBC.",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5 py-3">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <span className="text-[12.5px] leading-relaxed text-muted-foreground">
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── CTA bar ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/30 bg-primary/10 px-5 py-4 shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]">
            <div>
              <p className="text-[13px] font-semibold text-primary">
                Ada keluhan baru? Segera lakukan skrining ulang.
              </p>
              <p className="mt-0.5 text-[12px] text-primary/80">
                Batuk lama, demam, atau berat badan turun drastis perlu
                diperiksa.
              </p>
            </div>
            <Button
              onClick={() => setIsPatientModalOpen(true)}
              className="rounded-full px-6 text-[14px] h-10"
            >
              <Stethoscope className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Skrining sekarang
            </Button>
          </div>

        </div>
      </div>

      {/* ── Modal pilih pasien ── */}
      <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mulai Skrining</DialogTitle>
            <DialogDescription>
              Pilih pasien yang akan melakukan skrining kesehatan.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-1.5 overflow-y-auto">
            {patients.length ? (
              patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient.id)}
                  className="flex w-full items-center gap-3 rounded-[10px] border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-[13px] font-semibold text-primary">
                      {patient.nama.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">
                      {patient.nama}
                    </p>
                    {patient.usia && (
                      <p className="text-[11px] text-muted-foreground">
                        {patient.usia} tahun
                      </p>
                    )}
                  </div>
                  <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground" aria-hidden="true" />
                </button>
              ))
            ) : (
              <div className="rounded-[10px] bg-muted/50 border border-border p-6 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-background">
                  <Users className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-[13px] font-medium text-foreground">
                  Belum ada pasien
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Silakan tambah pasien terlebih dahulu.
                </p>
                <Link
                  href="/user/screening-data"
                  onClick={() => setIsPatientModalOpen(false)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  Tambah pasien
                </Link>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
