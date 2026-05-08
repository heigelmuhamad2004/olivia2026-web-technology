"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Calendar, FileText, CheckCircle2, Clock, FileOutput } from "lucide-react" // Import icon tambahan
import { useEffect, useState, Suspense } from "react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import {
    getRiwayatSkriningByPasien,
    SkriningRiwayat,
} from "@/app/services/skrining.services"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function ListRiwayatPasienContent() {
    const searchParams = useSearchParams()
    const pasienId = searchParams.get("pasienId")

    const [riwayat, setRiwayat] = useState<SkriningRiwayat[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (pasienId) {
            setLoading(true)
            getRiwayatSkriningByPasien(pasienId)
                .then((data) => {
                    setRiwayat(data)
                })
                .catch((err) => {
                    console.error(err)
                    setError("Gagal memuat riwayat skrining.")
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }, [pasienId])

    if (!pasienId) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center text-center">
                <h2 className="text-lg font-semibold">Pasien tidak ditemukan</h2>
                <p className="text-muted-foreground">ID Pasien tidak valid.</p>
                <Button asChild className="mt-4" variant="outline">
                    <Link href="/user/riwayat-screening">Kembali</Link>
                </Button>
            </div>
        )
    }

    const pasienName = riwayat.length > 0 ? riwayat[0].nama : "Pasien"

    return (
        <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <Link
                        href="/user/riwayat-screening"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center mb-2"
                    >
                        ← Kembali ke Daftar Pasien
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Detail Riwayat Screening
                    </h1>
                    {!loading && (
                        <p className="text-muted-foreground mt-1">
                            Daftar screening untuk{" "}
                            <span className="font-semibold text-foreground">{pasienName}</span>
                        </p>
                    )}
                </div>
                <Button asChild>
                    <Link href={`/user/screening-kesehatan?pasienId=${pasienId}`}>
                        + Skrining Baru
                    </Link>
                </Button>
            </div>

            <Separator className="my-6" />

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
                    <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
                </div>
            ) : error ? (
                <div className="rounded-lg border bg-destructive/10 p-6 text-center text-destructive">
                    <p>{error}</p>
                    <Button
                        variant="outline"
                        className="mt-4 border-destructive/20"
                        onClick={() => window.location.reload()}
                    >
                        Coba Lagi
                    </Button>
                </div>
            ) : riwayat.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">Belum ada riwayat screening</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                        Pasien ini belum pernah melakukan screening TBC sebelumnya.
                    </p>
                    <Button asChild>
                        <Link href={`/user/screening-kesehatan?pasienId=${pasienId}`}>
                            Mulai Screening Sekarang
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {riwayat.map((item) => {
                        // 1. Cek Status
                        const isPositif = item.hasil_screening.toUpperCase().includes("TERDUGA") || 
                                          item.hasil_screening.toUpperCase().includes("POSITIF");
                        
                        const rujukanStatus = (item as any).rujukan_status; 
                        const isVerified = rujukanStatus === "Terverifikasi";

                        return (
                            <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md border-l-4 border-l-primary/20">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {format(
                                                    new Date(item.tanggal_screening),
                                                    "eeee, dd MMMM yyyy - HH:mm",
                                                    { locale: localeId }
                                                )}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                Metode:{" "}
                                                <span className="font-medium text-foreground">
                                                    {item.metode_skrining || "Form Only"}
                                                </span>
                                            </CardDescription>
                                        </div>
                                        <Badge
                                            variant={isPositif ? "destructive" : "default"}
                                            className="uppercase"
                                        >
                                            {item.hasil_screening}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                
                                <CardContent>
                                    <div className="flex flex-col gap-4">
                                        {/* Indikator Status (Visual Only) */}
                                        {isPositif && (
                                            <div className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium
                                                ${isVerified 
                                                    ? "bg-green-50 text-green-700 border-green-200" 
                                                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                }`}
                                            >
                                                {isVerified ? (
                                                    <>
                                                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                                                        <span>Rujukan Terverifikasi oleh Puskesmas</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="h-5 w-5 shrink-0" />
                                                        <span>Menunggu Verifikasi Admin Puskesmas</span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* --- DUA TOMBOL NAVIGASI --- */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                                            {/* 1. Tombol Lihat Hasil Screening (Selalu Aktif) */}
                                            <Button asChild variant="outline" className="w-full justify-start h-auto py-3 px-4 border-primary/20 hover:bg-primary/5 hover:text-primary">
                                                <Link href={`/user/hasil-screening?skriningId=${item.id}&pasienId=${pasienId}`}>
                                                    <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                                                    <div className="flex flex-col items-start text-left">
                                                        <span className="font-semibold text-sm">Hasil Screening</span>
                                                        <span className="text-xs text-muted-foreground font-normal">Lihat detail diagnosa</span>
                                                    </div>
                                                </Link>
                                            </Button>

                                            {/* 2. Tombol Lihat Surat Rujukan (Kondisional) */}
                                            {isPositif ? (
                                                <Button 
                                                    asChild={isVerified} // Render sebagai Link jika verified, Button biasa jika tidak
                                                    disabled={!isVerified}
                                                    variant={isVerified ? "default" : "secondary"}
                                                    className={`w-full justify-start h-auto py-3 px-4 
                                                        ${isVerified 
                                                            ? "bg-green-600 hover:bg-green-700 text-white shadow-sm" 
                                                            : "opacity-70 cursor-not-allowed"
                                                        }`
                                                    }
                                                >
                                                    {isVerified ? (
                                                        <Link href={`/user/surat-rujukan?skriningId=${item.id}&pasienId=${pasienId}`}>
                                                            <FileOutput className="mr-2 h-5 w-5" />
                                                            <div className="flex flex-col items-start text-left">
                                                                <span className="font-semibold text-sm">Surat Rujukan</span>
                                                                <span className="text-xs opacity-90 font-normal">Siap diunduh (PDF)</span>
                                                            </div>
                                                        </Link>
                                                    ) : (
                                                        <div className="flex items-center w-full">
                                                            <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                                                            <div className="flex flex-col items-start text-left">
                                                                <span className="font-semibold text-sm">Surat Belum Tersedia</span>
                                                                <span className="text-xs text-muted-foreground font-normal">Menunggu verifikasi...</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Button>
                                            ) : (
                                                /* Jika Negatif, Tampilkan Placeholder atau Tombol Kosong agar rapi */
                                                <div className="hidden sm:block"></div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default function ListRiwayatPasienPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ListRiwayatPasienContent />
        </Suspense>
    )
}