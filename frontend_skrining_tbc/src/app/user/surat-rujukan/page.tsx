"use client"

import React, { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ArrowLeft, Download } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

import { getSkriningDetail } from "@/app/services/skrining.services"
import { SuratRujukanPDF } from "@/components/surat-rujukanPDF"

// 1. PISAHKAN LOGIKA UTAMA KE KOMPONEN CONTENT
function SuratRujukanContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const skriningId = searchParams.get("skriningId")

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const suratRef = useRef<HTMLDivElement>(null)

    // Fetch Data Detail
    useEffect(() => {
        if (!skriningId) return
        const fetchData = async () => {
            try {
                const result = await getSkriningDetail(skriningId)
                setData(result)
            } catch (err) {
                console.error(err)
                toast.error("Gagal memuat data surat.")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [skriningId])

    // Fungsi Download PDF
    const handleDownload = async () => {
        if (!suratRef.current) return
        setDownloading(true)
        try {
            const element = suratRef.current

            // Capture elemen visual yang ada di layar
            const canvas = await html2canvas(element, { scale: 2, useCORS: true })
            const imgData = canvas.toDataURL("image/png")

            const pdf = new jsPDF("p", "mm", "a4")
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
            pdf.save(`Surat_Rujukan_${data?.nama || 'Pasien'}.pdf`)

            toast.success("Surat berhasil diunduh")
        } catch (error) {
            console.error(error)
            toast.error("Gagal mengunduh surat")
        } finally {
            setDownloading(false)
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat Surat...</div>
    if (!data) return <div className="min-h-screen flex items-center justify-center">Data tidak ditemukan</div>

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">

                {/* Header Navigasi */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={handleDownload} disabled={downloading} className="bg-green-700 hover:bg-green-800 text-white gap-2">
                            {downloading ? "Memproses..." : <><Download className="w-4 h-4" /> Unduh PDF</>}
                        </Button>
                    </div>
                </div>

                {/* Preview Surat */}
                <div className="flex justify-center">
                    <div className="shadow-2xl rounded-sm overflow-hidden">
                        <div ref={suratRef} style={{ backgroundColor: "#ffffff" }}>
                            <SuratRujukanPDF data={data} />
                        </div>
                    </div>
                </div>

                <p className="text-center text-gray-400 text-sm mt-8 pb-8">
                    Pastikan membawa surat ini (digital/cetak) saat berkunjung ke Puskesmas.
                </p>

            </div>
        </div>
    )
}

// 2. BUNGKUS DENGAN SUSPENSE PADA EXPORT DEFAULT
export default function SuratRujukanPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Halaman...</div>}>
            <SuratRujukanContent />
        </Suspense>
    )
}