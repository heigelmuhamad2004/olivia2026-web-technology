"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Calendar, FileText, CheckCircle2, Clock, FileOutput, ArrowLeft } from "lucide-react" // Import icon tambahan
import { useEffect, useState, Suspense } from "react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import {
    getRiwayatSkriningByPasien,
    SkriningRiwayat,
} from "@/app/services/skrining.services"
import { Button } from "@/components/ui/button"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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
            <div className="flex h-[calc(100vh-5rem)] flex-col items-center justify-center text-center px-4" style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}>
                <h2 className="text-[20px] font-semibold text-foreground tracking-tight">Pasien tidak ditemukan.</h2>
                <p className="mt-2 text-[14px] text-muted-foreground">ID Pasien tidak valid atau tidak dapat diakses.</p>
                <Button asChild variant="outline" className="mt-6 w-full sm:w-auto rounded-full px-6 h-10 text-[14px] shadow-sm">
                    <Link href="/user/riwayat-screening">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Daftar Pasien
                    </Link>
                </Button>
            </div>
        )
    }

    const pasienName = riwayat.length > 0 ? riwayat[0].nama : "Pasien"

    return (
        <div className="flex min-h-[calc(100vh-5rem)] w-full justify-center px-4 sm:px-6 lg:px-8 pb-24 pt-8 sm:pt-12" style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}>
            <div className="w-full max-w-4xl space-y-6 sm:space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col items-start">
                        <Breadcrumb className="mb-3">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/user/riwayat-screening">Daftar Pasien</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Riwayat Skrining</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-foreground">
                            Detail Riwayat Skrining.
                        </h1>
                        {!loading && (
                            <p className="mt-1.5 text-[14px] text-muted-foreground">
                                Daftar skrining untuk <span className="font-medium text-foreground">{pasienName}</span>.
                            </p>
                        )}
                    </div>
                    <Button asChild className="w-full sm:w-auto rounded-full px-6 h-10 text-[14px] shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]">
                        <Link href={`/user/screening-kesehatan?pasienId=${pasienId}`}>
                            + Skrining Baru
                        </Link>
                    </Button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-4">
                        <div className="h-32 w-full animate-pulse rounded-[12px] bg-muted/50 border border-border shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]" />
                        <div className="h-32 w-full animate-pulse rounded-[12px] bg-muted/50 border border-border shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]" />
                    </div>
                ) : error ? (
                    <div className="rounded-[12px] border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]">
                        <p className="text-[14px] font-medium">{error}</p>
                        <Button
                            variant="outline"
                            className="mt-5 rounded-full border-destructive/30 hover:bg-destructive/20 text-destructive text-[13px] h-9"
                            onClick={() => window.location.reload()}
                        >
                            Coba Lagi
                        </Button>
                    </div>
                ) : riwayat.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-[12px] bg-muted/30 border border-border p-12 text-center shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border bg-background shadow-sm">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-[16px] font-semibold text-foreground">Belum ada riwayat skrining.</h3>
                        <p className="mt-1.5 mb-6 text-[14px] text-muted-foreground max-w-sm leading-relaxed">
                            Pasien ini belum pernah melakukan skrining TBC sebelumnya. Mulai skrining sekarang untuk mendapatkan deteksi awal.
                        </p>
                        <Button asChild className="w-full sm:w-auto rounded-full px-6 h-10 text-[14px]">
                            <Link href={`/user/screening-kesehatan?pasienId=${pasienId}`}>
                                Mulai Skrining
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-5">
                        {riwayat.map((item) => {
                            const isPositif = item.hasil_screening.toUpperCase().includes("TERDUGA") || 
                                              item.hasil_screening.toUpperCase().includes("POSITIF");
                            const rujukanStatus = (item as any).rujukan_status; 
                            const isVerified = rujukanStatus === "Terverifikasi";

                            return (
                                <div key={item.id} className="flex flex-col rounded-lg border bg-card p-5 shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a] transition-colors hover:border-primary/40 hover:bg-primary/5">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-4">
                                        <div>
                                            <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {format(new Date(item.tanggal_screening), "eeee, dd MMMM yyyy - HH:mm", { locale: localeId })}
                                            </div>
                                            <p className="mt-1 text-[13px] text-muted-foreground flex items-center gap-1.5">
                                                <span className="font-mono uppercase tracking-wider text-[10px]">Metode</span>
                                                <span className="font-medium text-foreground">{item.metode_skrining || "Form Only"}</span>
                                            </p>
                                        </div>
                                        <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider h-fit items-center justify-center ${isPositif ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                                            {item.hasil_screening}
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 flex flex-col gap-4">
                                        {isPositif && (
                                            <div className={`flex items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-[12.5px] font-medium ${isVerified ? "border-green-200 bg-green-50 text-green-700" : "border-yellow-200 bg-yellow-50 text-yellow-700"}`}>
                                                {isVerified ? (
                                                    <>
                                                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                        <span>Rujukan Terverifikasi oleh Puskesmas</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="h-4 w-4 shrink-0" />
                                                        <span>Menunggu Verifikasi Admin Puskesmas</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                                            <Button asChild variant="outline" className="h-auto w-full justify-start rounded-md border-border bg-background px-4 py-3 text-left hover:border-primary/40 hover:bg-muted/50">
                                                <Link href={`/user/hasil-screening?skriningId=${item.id}&pasienId=${pasienId}`}>
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-primary/10 text-primary mr-3">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-[13px] font-semibold text-foreground">Hasil Skrining</span>
                                                        <span className="text-[11px] text-muted-foreground mt-0.5">Lihat detail diagnosa</span>
                                                    </div>
                                                </Link>
                                            </Button>
                                            
                                            {isPositif ? (
                                                <Button asChild={isVerified} disabled={!isVerified} variant={isVerified ? "default" : "secondary"} className={`h-auto w-full justify-start rounded-md px-4 py-3 text-left ${isVerified ? "bg-primary text-primary-foreground hover:bg-primary/90" : "cursor-not-allowed opacity-70"}`}>
                                                    {isVerified ? (
                                                        <Link href={`/user/surat-rujukan?skriningId=${item.id}&pasienId=${pasienId}`}>
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-background/20 text-background mr-3">
                                                                <FileOutput className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col items-start">
                                                                <span className="text-[13px] font-semibold">Surat Rujukan</span>
                                                                <span className="text-[11px] opacity-90 mt-0.5">Siap diunduh (PDF)</span>
                                                            </div>
                                                        </Link>
                                                    ) : (
                                                        <div className="flex w-full items-center">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-muted border border-border text-muted-foreground mr-3">
                                                                <Clock className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col items-start">
                                                                <span className="text-[13px] font-semibold text-foreground">Surat Belum Tersedia</span>
                                                                <span className="text-[11px] text-muted-foreground mt-0.5">Menunggu verifikasi...</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Button>
                                            ) : (
                                                <div className="hidden sm:block"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ListRiwayatPasienPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[100vh] items-center justify-center bg-background">
                <div className="text-[14px] text-muted-foreground flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Memuat riwayat...
                </div>
            </div>
        }>
            <ListRiwayatPasienContent />
        </Suspense>
    )
}