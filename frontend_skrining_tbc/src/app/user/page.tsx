"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconUserCircle } from "@tabler/icons-react"

import DashboardHero from "@/components/hero-user"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import api from "@/app/services/api"
import { getCurrentUser, getActiveToken, logoutUser } from "@/app/services/auth.services"

// Tipe data pasien (minimal)
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

export default function UserDashboardPage() {
  const router = useRouter()
  const [isPatientModalOpen, setIsPatientModalOpen] = React.useState(false)
  const [userName, setUserName] = React.useState<string>("")
  const [userId, setUserId] = React.useState<number | null>(null)
  const [patients, setPatients] = React.useState<Patient[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const init = async () => {
      try {
        // GUNAKAN getActiveToken() SEKALI saja
        const activeToken = getActiveToken()
        if (!activeToken) {
          router.push("/auth/login")
          return
        }

        // Ambil data user dari endpoint /auth/me
        const userData = await getCurrentUser()
        if (!userData) {
          router.push("/auth/login")
          return
        }
        setUserName(userData.nama || "")
        setUserId(userData.id || null)

        // Ambil daftar pasien memakai activeToken
        const res = await api.get("/pasien", {
          headers: { Authorization: `Bearer ${activeToken}` },
        })
        const allPatients: Patient[] = (res.data && (res.data.data ?? res.data)) || []

        // debug: tampilkan semua pasien yang diterima backend
        console.debug("GET /pasien result:", allPatients, "userData.id:", userData.id)

        // Pastikan hanya pasien milik user yang dipakai — bandingkan sebagai Number
        const myPatients = userData.id
          ? allPatients.filter((p) => Number(p.user_id) === Number(userData.id))
          : allPatients

        setPatients(myPatients)
      } catch (err) {
        console.error("Gagal memuat user/pasien:", err)
        // HATI: hapus hanya session aktif, bukan key "accessToken" generik
        try {
          await logoutUser() // bersihkan session aktif dengan benar (blokir token di server jika tersedia)
        } catch (e) {
          // fallback: hapus activeSessionId
          localStorage.removeItem("activeSessionId")
        }
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  // Fungsi untuk menangani pemilihan pasien dan navigasi
  const handleSelectPatient = (patientId: number) => {
    setIsPatientModalOpen(false)
    router.push(`/user/screening-kesehatan?pasienId=${patientId}`)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Memuat...
      </div>
    )
  }

  return (
    <>
      <div className="flex min-h-[calc(100vh-5rem)] w-full justify-center px-4 pb-24 pt-10">
        <div className="w-full max-w-5xl space-y-10">
          <DashboardHero
            name={userName || "Pengguna"}
            onStartScreening={() => setIsPatientModalOpen(true)}
          />

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col rounded-xl border px-5 py-6 transition hover:shadow-lg">
              <h2 className="text-base font-semibold tracking-tight">
                Aktivitas terakhir Anda
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pantau hasil screening terbaru dan lanjutkan proses jika
                diperlukan.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>
                  • Screening kesehatan terakhir:{" "}
                  <span className="font-medium text-foreground">Negatif</span>
                </li>
                <li>
                  • Screening suara batuk:{" "}
                  <span className="font-medium text-foreground">
                    Belum dilakukan
                  </span>
                </li>
                <li>
                  • Total screening yang pernah dilakukan:{" "}
                  <span className="font-medium text-foreground">6 kali</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col rounded-xl border px-5 py-6 text-sm text-muted-foreground transition hover:shadow-lg">
              <p className="font-medium text-foreground">Apa langkah selanjutnya?</p>
              <p className="mt-1">
                Jika Anda memiliki keluhan baru (batuk lama, berat badan turun,
                demam tanpa sebab), lakukan screening ulang dan pertimbangkan
                untuk berkonsultasi ke puskesmas.
              </p>
            </div>
          </section>

          <section className="flex flex-col rounded-xl border px-5 py-6 transition hover:shadow-lg">
            <h2 className="text-base font-semibold tracking-tight">
              Edukasi singkat tentang TBC
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tuberkulosis (TBC) adalah infeksi yang umumnya menyerang paru-paru.
              Deteksi dini melalui screening membantu mencegah penyebaran ke orang
              sekitar dan mempercepat pengobatan.
            </p>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p>• Segera periksa jika Anda mengalami batuk &gt; 2 minggu.</p>
              <p>• Jaga daya tahan tubuh dengan makan bergizi dan istirahat cukup.</p>
              <p>• Hindari merokok dan paparan asap rokok.</p>
              <p>• Ikuti anjuran tenaga kesehatan bila sedang menjalani pengobatan.</p>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mulai Screening</DialogTitle>
            <DialogDescription>
              Pilih pasien yang akan melakukan screening kesehatan.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {patients.length ? (
              patients.map((patient: Patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient.id)}
                  className="flex w-full items-center rounded-md border p-3 text-left transition hover:bg-accent"
                >
                  <IconUserCircle className="mr-3 h-8 w-8 shrink-0 text-muted-foreground" />
                  <span className="font-medium">{patient.nama}</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                Anda belum memiliki pasien. Silakan tambah pasien terlebih dahulu.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
