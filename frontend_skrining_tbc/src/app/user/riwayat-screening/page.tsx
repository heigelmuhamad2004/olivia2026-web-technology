"use client"

import Link from "next/link"
import { ArrowRight, FileText, User } from "lucide-react"
import { useEffect, useState } from "react"

import { getMyPatients, Patient } from "@/app/services/pasien.services"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function RiwayatScreeningPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyPatients()
      .then((res) => setPatients(res))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Riwayat Screening</h1>
        <p className="text-muted-foreground mt-2">
          Pilih pasien untuk melihat riwayat dan hasil screening lengkap.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {/* Skeleton placeholders */}
          <div className="h-24 w-full rounded-xl bg-muted animate-pulse" />
          <div className="h-24 w-full rounded-xl bg-muted animate-pulse" />
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Belum ada data screening</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
            Lakukan screening TBC untuk diri sendiri atau anggota keluarga Anda sekarang.
          </p>
          <Button asChild>
            <Link href="/user/screening-data">Mulai Screening Baru</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              href={`/user/hasil-screening?pasienId=${patient.id}`}
              className="block"
            >
              <Card className="group overflow-hidden transition-all hover:border-primary hover:shadow-md">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <User className="h-6 w-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{patient.nama}</h3>
                        <Badge variant="outline" className="text-xs font-normal">
                          {patient.jenis_kelamin === "Laki-Laki" ? "L" : "P"} - {patient.usia} Th
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total Screening: <span className="font-medium text-foreground">{patient.total_screening || 0}</span> kali
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-primary font-medium text-sm gap-1 group-hover:gap-2 transition-all">
                    Lihat Detail <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}