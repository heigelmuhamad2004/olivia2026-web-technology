"use client"

import React, { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  getRiwayatSkriningByPasien,
  SkriningRiwayat,
} from "@/app/services/skrining.services"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { Download, Mic, ClipboardList, BrainCircuit } from "lucide-react"
import { ResultVisualizer } from "@/components/ResultVisualizer"

function HasilScreeningContent() {
  const searchParams = useSearchParams()
  const pasienId = searchParams.get("pasienId")
  const skriningId = searchParams.get("skriningId")

  const [riwayat, setRiwayat] = useState<SkriningRiwayat[]>([])
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pasienId) {
      getRiwayatSkriningByPasien(pasienId).then((data) => {
        setRiwayat(data)
        setLoading(false)
      })
    }
  }, [pasienId])

  const handleDownloadPdf = async () => {
    const element = pdfRef.current
    if (!element) return
    setIsDownloading(true)
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const imgHeight = canvas.height
      const imgWidth = canvas.width
      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, (imgHeight * pdfWidth) / imgWidth)
      pdf.save(`Hasil_Skrining_${hasilScreening?.nama || "Pasien"}.pdf`)
    } catch (error) {
      console.error("Gagal download PDF:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  if (loading) return <p className="text-center mt-10">Memuat data...</p>

  if (riwayat.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold">Tidak Ada Riwayat Screening</h1>
        <p className="mt-2 text-muted-foreground">Pasien ini belum pernah melakukan screening.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/user/riwayat-screening">Kembali</Link>
        </Button>
      </div>
    )
  }

  // Ambil skrining tertentu atau terbaru
  let hasilScreening: SkriningRiwayat | undefined
  if (skriningId) {
    hasilScreening = riwayat.find((item) => item.id === Number(skriningId))
  }
  if (!hasilScreening) {
    hasilScreening = riwayat[riwayat.length - 1]
  }

  const isPositif = hasilScreening.hasil_screening.toLowerCase() === "terduga"

  // Tentukan apakah ada data AI suara
  const hasAiSuara =
    hasilScreening.skor_suara_ai != null && hasilScreening.gradcam_image

  // Mapping data untuk ResultVisualizer
  const aiSuaraData = hasAiSuara
    ? {
        diagnosis:
          (hasilScreening.skor_suara_ai ?? 0) > 50 ? "Suspek TBC" : "Normal",
        confidence: Math.max(
          hasilScreening.skor_suara_ai ?? 0,
          100 - (hasilScreening.skor_suara_ai ?? 0)
        ),
        prob_tbc: hasilScreening.skor_suara_ai ?? 0,
        prob_normal: 100 - (hasilScreening.skor_suara_ai ?? 0),
        gradcam_image: hasilScreening.gradcam_image!,
        algoritma: (hasilScreening.metode_skrining || "").includes("DenseNet")
          ? "DenseNet"
          : "CNN",
      }
    : null

  return (
    <div className="flex min-h-[calc(100vh-5rem)] w-full items-center justify-center px-4 pb-24 pt-10">
      <div
        ref={pdfRef}
        className="w-full max-w-3xl space-y-8 rounded-xl p-6"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          border: "1px solid #e5e7eb",
          boxShadow: "none",
        }}
      >
        {/* HEADER */}
        <header className="space-y-2 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "#52525b" }}
          >
            Hasil Screening
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ringkasan Hasil Screening Pasien
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base" style={{ color: "#71717a" }}>
            Berikut adalah ringkasan data dan hasil screening untuk pasien{" "}
            <span className="font-bold text-black">{hasilScreening.nama}</span>.
          </p>

          {/* Badge metode skrining */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: "#f4f4f5", color: "#52525b" }}
            >
              <ClipboardList className="h-3 w-3" />
              Skrining Form
            </span>
            {hasAiSuara && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: "#ede9fe", color: "#5b21b6" }}
              >
                <Mic className="h-3 w-3" />
                Analisis Suara AI ({hasilScreening.metode_skrining})
              </span>
            )}
          </div>
        </header>

        {/* IDENTITAS */}
        <section
          className="grid gap-6 rounded-lg p-4 sm:grid-cols-2 sm:p-6"
          style={{ backgroundColor: "#f4f4f5" }}
        >
          <div
            className="space-y-2 pb-4 sm:pb-0 sm:pr-6"
            style={{ borderBottom: "1px solid #e5e7eb" }}
          >
            <p className="text-xs font-semibold uppercase" style={{ color: "#71717a" }}>
              Identitas
            </p>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Nama:</span> {hasilScreening.nama}</p>
              <p><span className="font-medium">NIK:</span> {hasilScreening.nik}</p>
              <p>
                <span className="font-medium">Tanggal lahir:</span>{" "}
                {hasilScreening.tanggal_lahir} ({hasilScreening.usia})
              </p>
              <p><span className="font-medium">Jenis kelamin:</span> {hasilScreening.kelamin}</p>
              <p><span className="font-medium">Alamat:</span> {hasilScreening.alamat}</p>
            </div>
          </div>

          <div className="space-y-2 pt-4 sm:pl-6 sm:pt-0">
            <p className="text-xs font-semibold uppercase" style={{ color: "#71717a" }}>
              Kontak & Pekerjaan
            </p>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">No. HP:</span> {hasilScreening.no_hp}</p>
              <p><span className="font-medium">Email:</span> {hasilScreening.email || "-"}</p>
              <p><span className="font-medium">Pekerjaan:</span> {hasilScreening.pekerjaan || "-"}</p>
              <p><span className="font-medium">Berat badan:</span> {hasilScreening.berat_badan}</p>
              <p><span className="font-medium">Tinggi badan:</span> {hasilScreening.tinggi_badan}</p>
            </div>
          </div>

          {/* HASIL SCREENING FORM */}
          <div
            className="space-y-2 pt-4 sm:col-span-2"
            style={{ borderTop: "1px solid #e5e7eb" }}
          >
            <p className="text-xs font-semibold uppercase" style={{ color: "#71717a" }}>
              Ringkasan hasil screening form
            </p>
            <div
              className="space-y-2 rounded-md p-3 text-sm"
              style={{ backgroundColor: "#ffffff" }}
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium">Hasil screening:</span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: isPositif ? "#fee2e2" : "#d1fae5",
                    color: isPositif ? "#b91c1c" : "#047857",
                  }}
                >
                  {hasilScreening.hasil_screening}
                </span>
              </div>

              {isPositif && (
                <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 shrink-0 text-yellow-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-900">Rujukan Otomatis Dibuat</h4>
                      <p className="mt-1 text-sm text-yellow-800">
                        Berdasarkan hasil screening dan domisili Anda, sistem telah mengirimkan
                        notifikasi ke <b>Puskesmas Kecamatan Anda</b>.
                      </p>
                      <p className="mt-2 text-sm font-medium text-yellow-900">
                        Silakan datang ke Puskesmas tersebut membawa unduhan PDF ini untuk
                        verifikasi dan pemeriksaan lanjutan.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FAKTOR RISIKO */}
          <div
            className="space-y-2 pt-4 sm:col-span-2"
            style={{ borderTop: "1px solid #e5e7eb" }}
          >
            <p className="text-xs font-semibold uppercase" style={{ color: "#71717a" }}>
              Faktor risiko dan gejala
            </p>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="font-medium">Riwayat kontak TBC:</span> {hasilScreening.riwayat_kontak_tbc}</p>
              <p><span className="font-medium">Pernah terdiagnosa:</span> {hasilScreening.pernah_terdiagnosa}</p>
              <p><span className="font-medium">Pernah berobat:</span> {hasilScreening.pernah_berobat_tbc}</p>
              <p><span className="font-medium">Tidak tuntas:</span> {hasilScreening.pernah_berobat_tb_tapi_tidak_tuntas}</p>
              <p><span className="font-medium">Malnutrisi:</span> {hasilScreening.malnutrisi}</p>
              <p><span className="font-medium">Perokok:</span> {hasilScreening.merokok_perokok_pasif}</p>
              <p><span className="font-medium">DM:</span> {hasilScreening.riwayat_dm_kencing_manis}</p>
              <p><span className="font-medium">Lansia (60+):</span> {hasilScreening.lansia}</p>
              <p><span className="font-medium">Ibu hamil:</span> {hasilScreening.ibu_hamil}</p>
              <p><span className="font-medium">Batuk:</span> {hasilScreening.batuk}</p>
              <p><span className="font-medium">BB turun:</span> {hasilScreening.bb_turun_tanpa_sebab_nafsu_makan_turun}</p>
              <p><span className="font-medium">Demam:</span> {hasilScreening.demam_tidak_diketahui_penyebabnya}</p>
              <p><span className="font-medium">Badan lemas:</span> {hasilScreening.badan_lemas}</p>
              <p><span className="font-medium">Berkeringat malam:</span> {hasilScreening.berkeringat_malam_tanpa_kegiatan}</p>
              <p><span className="font-medium">Sesak napas:</span> {hasilScreening.sesak_napas_tanpa_nyeri_dada}</p>
              <p><span className="font-medium">Pembesaran getah bening:</span> {hasilScreening.ada_pembesaran_getah_bening_dileher}</p>
            </div>
          </div>
        </section>

        {/* SECTION ANALISIS AI SUARA — muncul jika ada data */}
        {aiSuaraData ? (
          <section className="space-y-3">
            {/* Header section */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "#ede9fe" }}
              >
                <BrainCircuit className="h-4 w-4" style={{ color: "#5b21b6" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Analisis Suara Batuk AI
                </p>
                <p className="text-xs text-muted-foreground">
                  Diproses menggunakan algoritma {aiSuaraData.algoritma} —{" "}
                  {hasilScreening.metode_skrining}
                </p>
              </div>
            </div>

            {/* Komponen visualisasi */}
            <ResultVisualizer data={aiSuaraData} />
          </section>
        ) : (
          /* Placeholder jika tidak ada data AI suara */
          <section
            className="rounded-xl border-2 border-dashed p-8 text-center"
            style={{ borderColor: "#e4e4e7" }}
          >
            <div
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: "#f4f4f5" }}
            >
              <Mic className="h-5 w-5" style={{ color: "#a1a1aa" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#52525b" }}>
              Analisis suara tidak tersedia
            </p>
            <p className="mt-1 text-xs" style={{ color: "#a1a1aa" }}>
              Skrining ini tidak menyertakan rekaman suara batuk untuk dianalisis AI.
            </p>
          </section>
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center gap-4">
        <Button asChild variant="outline" className="shadow-lg bg-white">
          <Link
            href={
              skriningId
                ? `/user/list-riwayat-pasien?pasienId=${pasienId}`
                : "/user/riwayat-screening"
            }
          >
            Kembali
          </Link>
        </Button>
        <Button onClick={handleDownloadPdf} disabled={isDownloading} className="shadow-lg">
          {isDownloading ? (
            "Memproses..."
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function HasilScreeningPage() {
  return (
    <React.Suspense fallback={<p className="text-center mt-10">Memuat data...</p>}>
      <HasilScreeningContent />
    </React.Suspense>
  )
}