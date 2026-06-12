"use client"

import Link from "next/link"
import { ArrowRight, FileText } from "lucide-react"
import { useEffect, useState } from "react"
import { motion, Variants } from "framer-motion"

import { getMyPatients, Patient } from "@/app/services/pasien.services"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// --- Variabel Animasi ---
const FADE_IN_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
}

const STAGGER_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

export default function RiwayatScreeningPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyPatients()
      .then((res) => setPatients(res))
      .finally(() => setLoading(false))
  }, [])

  // Helper untuk mendapatkan inisial nama
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Riwayat skrining.</h1>
          <p className="text-muted-foreground mt-1">
            Pilih pasien untuk melihat riwayat dan hasil skrining lengkap.
          </p>
        </div>
        <Button asChild className="rounded-full px-6 shadow-sm h-10">
          <Link href="/user/screening-data">
            Skrining Baru
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {/* Skeleton placeholders */}
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="hidden sm:block h-4 w-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <motion.div 
          initial="hidden" 
          animate="show" 
          variants={STAGGER_CONTAINER}
          className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]"
        >
          <motion.div 
            variants={FADE_IN_VARIANTS}
            animate={{ y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted"
          >
            <FileText className="h-8 w-8 text-muted-foreground opacity-60" />
          </motion.div>
          <motion.h3 variants={FADE_IN_VARIANTS} className="text-lg font-semibold text-foreground">
            Belum ada riwayat skrining.
          </motion.h3>
          <motion.p variants={FADE_IN_VARIANTS} className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
            Lakukan skrining TBC untuk diri sendiri atau anggota keluarga Anda sekarang.
          </motion.p>
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden" 
          animate="show" 
          variants={STAGGER_CONTAINER}
          className="grid gap-4"
        >
          {patients.map((patient) => (
            <motion.div key={patient.id} variants={FADE_IN_VARIANTS}>
              <Link
                href={`/user/list-riwayat-pasien?pasienId=${patient.id}`}
                className="block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
              >
                <Card className="group overflow-hidden rounded-lg border bg-card shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a] transition-all hover:shadow-[0px_2px_2px_#0000000a,0px_8px_16px_-4px_#0000000a] hover:border-primary/40">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarFallback className={patient.jenis_kelamin === "Laki-Laki" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-pink-500/10 text-pink-600 dark:text-pink-400"}>
                          <span className="text-sm font-semibold">{getInitials(patient.nama)}</span>
                        </AvatarFallback>
                      </Avatar>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">{patient.nama}</h3>
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-medium bg-muted text-muted-foreground rounded-full px-2">
                            {patient.jenis_kelamin === "Laki-Laki" ? "L" : "P"} • {patient.usia} Th
                        </Badge>
                      </div>
                        <p className="text-[13px] text-muted-foreground">
                          Total Skrining: <span className="font-medium text-foreground">{patient.total_screening || 0}</span> kali
                      </p>
                    </div>
                  </div>

                    <div className="flex items-center self-end sm:self-auto text-primary font-medium text-[13px] gap-1 group-hover:gap-2 transition-all">
                    Lihat Detail <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}