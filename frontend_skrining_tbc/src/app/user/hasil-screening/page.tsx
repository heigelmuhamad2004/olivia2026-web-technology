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
import { Download, Mic, ClipboardList, BrainCircuit, ArrowLeft, Info } from "lucide-react"
import { ResultVisualizer } from "@/components/ResultVisualizer"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Tambahkan interface ini untuk detail matematika
interface MathDetails {
  aktivasi: string;
  probabilitas_p: number;
  raw_logit_z: number;
  threshold: number;
  rumus: string;
  keterangan: string;
}

// Perluas interface SkriningRiwayat yang sudah ada
interface SkriningRiwayatExtended extends SkriningRiwayat {
  detail_matematika?: MathDetails;
  spectrogram_image?: string;
}

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

  if (loading) {
    return (
      <div className="flex h-[100vh] items-center justify-center bg-background">
        <div className="text-[14px] text-muted-foreground flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Memuat hasil skrining...
        </div>
      </div>
    )
  }

  if (riwayat.length === 0) {
    return (
      <div className="flex h-[calc(100vh-5rem)] flex-col items-center justify-center text-center px-4" style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}>
        <h1 className="text-[20px] font-semibold tracking-tight text-foreground">Tidak Ada Riwayat Skrining.</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">Pasien ini belum pernah melakukan skrining.</p>
        <Button asChild variant="outline" className="mt-6 rounded-full px-6 h-10 text-[14px]">
          <Link href="/user/riwayat-screening">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Link>
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

  // Gunakan casting ke interface yang sudah diperluas
  const dataTerpilih = hasilScreening as SkriningRiwayatExtended;

  // Cek keberadaan data AI Suara
  const hasAiSuara =
    dataTerpilih.skor_suara_ai !== null && 
    (dataTerpilih.spectrogram_image || dataTerpilih.gradcam_image);

  // Mapping data untuk ResultVisualizer tanpa 'any'
  const aiSuaraData = hasAiSuara
  ? {
      diagnosis: (dataTerpilih.skor_suara_ai ?? 0) > 50 ? "Suspek TBC" : "Normal",
      prob_tbc: dataTerpilih.skor_suara_ai ?? 0,
      prob_normal: 100 - (dataTerpilih.skor_suara_ai ?? 0),
      spectrogram_image: dataTerpilih.gradcam_image || "",
      math_details: dataTerpilih.detail_matematika || {
        aktivasi: "Sigmoid",
        probabilitas_p: 0,
        raw_logit_z: 0,
        threshold: 0.50,
        rumus: "z = ln(P / (1 - P))",
        keterangan: "Data matematika tidak tersedia."
      },
      algoritma: (dataTerpilih.metode_skrining || "").includes("DenseNet") ? "DenseNet" : "CNN",
    }
  : null;

  return (
    <div className="flex min-h-[calc(100vh-5rem)] w-full flex-col items-center px-4 pb-32 pt-8 sm:px-6 lg:px-8 sm:pt-12" style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}>
      <div className="w-full max-w-4xl space-y-6">
        
        {/* BREADCRUMB */}
        <div className="w-full">
          <Breadcrumb className="mb-2">
              <BreadcrumbList>
                  <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                          <Link href="/user/riwayat-screening">Daftar Pasien</Link>
                      </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                          <Link href={`/user/list-riwayat-pasien?pasienId=${pasienId}`}>Riwayat Skrining</Link>
                      </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                      <BreadcrumbPage>Hasil Skrining</BreadcrumbPage>
                  </BreadcrumbItem>
              </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* CONTAINER PDF (Warna ditetapkan putih khusus untuk ekspor html2canvas) */}
        <div
          ref={pdfRef}
          className="w-full space-y-8 rounded-[12px] border border-border bg-card p-6 sm:p-10 shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]"
          style={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
        >
          {/* HEADER */}
          <header className="space-y-3 text-center mb-8">
            <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-muted-foreground font-mono">
              Hasil Skrining
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-foreground">
              Ringkasan hasil skrining pasien.
            </h1>
            <p className="mx-auto max-w-2xl text-[14px] text-muted-foreground mt-1">
              Berikut adalah ringkasan data dan hasil skrining untuk pasien{" "}
              <span className="font-medium text-foreground">{hasilScreening.nama}</span>.
            </p>

            {/* Badge metode skrining */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium bg-muted/50 border border-border text-foreground">
                <ClipboardList className="h-3.5 w-3.5" />
                Skrining Form
              </span>
              {hasAiSuara && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20">
                  <Mic className="h-3.5 w-3.5" />
                  Analisis Suara AI ({hasilScreening.metode_skrining})
                </span>
              )}
            </div>
          </header>

          {/* IDENTITAS */}
          <section className="grid gap-6 rounded-[10px] bg-muted/30 border border-border p-5 sm:grid-cols-2 sm:p-6">
            <div className="space-y-3 pb-4 sm:pb-0 sm:border-r border-border sm:pr-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Identitas
              </p>
              <div className="space-y-1.5 text-[14px]">
                <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Nama:</span> <span className="font-medium sm:font-normal">{hasilScreening.nama}</span></p>
                <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">NIK:</span> <span>{hasilScreening.nik}</span></p>
                <p className="flex justify-between sm:block sm:space-x-1">
                  <span className="text-muted-foreground sm:font-medium sm:text-foreground">Tanggal lahir:</span>{" "}
                  <span>{hasilScreening.tanggal_lahir} ({hasilScreening.usia})</span>
                </p>
                <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Jenis kelamin:</span> <span>{hasilScreening.kelamin}</span></p>
                <p className="flex flex-col sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Alamat:</span> <span>{hasilScreening.alamat}</span></p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border sm:border-t-0 sm:pl-2 sm:pt-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Kontak & Pekerjaan
              </p>
              <div className="space-y-1.5 text-[14px]">
                <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">No. HP:</span> <span>{hasilScreening.no_hp}</span></p>
                <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Email:</span> <span>{hasilScreening.email || "-"}</span></p>
                <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Pekerjaan:</span> <span>{hasilScreening.pekerjaan || "-"}</span></p>
                <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Berat badan:</span> <span>{hasilScreening.berat_badan}</span></p>
                <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Tinggi badan:</span> <span>{hasilScreening.tinggi_badan}</span></p>
              </div>
            </div>

            {/* HASIL SCREENING FORM */}
            <div className="space-y-3 pt-5 border-t border-border sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Ringkasan Hasil Skrining
              </p>
              <div className="space-y-4 rounded-md border border-border bg-background p-4 text-[14px]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium text-foreground">Status Diagnosis:</span>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: isPositif ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                      color: isPositif ? "rgb(220, 38, 38)" : "rgb(5, 150, 105)",
                    }}
                  >
                    {hasilScreening.hasil_screening}
                  </span>
                </div>

                {isPositif && (
                  <div className="mt-3 flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                    <Info className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                    <div className="flex flex-col">
                        <h4 className="text-[14px] font-semibold text-amber-800 dark:text-amber-500">Rujukan Otomatis Dibuat</h4>
                        <p className="mt-1 text-[13px] text-amber-700 dark:text-amber-400 leading-relaxed">
                          Berdasarkan hasil skrining dan domisili Anda, sistem telah mengirimkan notifikasi ke <b>Puskesmas Kecamatan Anda</b>. Silakan datang ke Puskesmas tersebut membawa unduhan PDF ini untuk verifikasi dan pemeriksaan lanjutan.
                        </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FAKTOR RISIKO */}
            <div className="space-y-3 pt-5 border-t border-border sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Faktor Risiko & Gejala Dilaporkan
              </p>
              <div className="grid gap-x-6 gap-y-2.5 text-[13px] sm:grid-cols-2">
                <DetailItem label="Riwayat kontak TBC" value={hasilScreening.riwayat_kontak_tbc} />
                <DetailItem label="Pernah terdiagnosa" value={hasilScreening.pernah_terdiagnosa} />
                <DetailItem label="Pernah berobat" value={hasilScreening.pernah_berobat_tbc} />
                <DetailItem label="Pengobatan tdk tuntas" value={hasilScreening.pernah_berobat_tb_tapi_tidak_tuntas} />
                <DetailItem label="Malnutrisi" value={hasilScreening.malnutrisi} />
                <DetailItem label="Perokok" value={hasilScreening.merokok_perokok_pasif} />
                <DetailItem label="Riwayat DM" value={hasilScreening.riwayat_dm_kencing_manis} />
                <DetailItem label="Lansia (60+)" value={hasilScreening.lansia} />
                <DetailItem label="Ibu hamil" value={hasilScreening.ibu_hamil} />
                <DetailItem label="Batuk" value={hasilScreening.batuk} />
                <DetailItem label="BB turun tanpa sebab" value={hasilScreening.bb_turun_tanpa_sebab_nafsu_makan_turun} />
                <DetailItem label="Demam" value={hasilScreening.demam_tidak_diketahui_penyebabnya} />
                <DetailItem label="Badan lemas" value={hasilScreening.badan_lemas} />
                <DetailItem label="Berkeringat malam" value={hasilScreening.berkeringat_malam_tanpa_kegiatan} />
                <DetailItem label="Sesak napas" value={hasilScreening.sesak_napas_tanpa_nyeri_dada} />
                <DetailItem label="Pembesaran getah bening" value={hasilScreening.ada_pembesaran_getah_bening_dileher} />
              </div>
            </div>
          </section>

          {/* SECTION ANALISIS AI SUARA — muncul jika ada data */}
          {aiSuaraData ? (
            <section className="space-y-4 pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20">
                  <BrainCircuit className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex flex-col">
                  <p className="text-[16px] font-semibold text-foreground tracking-tight">
                    Analisis Suara Batuk AI
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    Diproses menggunakan algoritma {aiSuaraData.algoritma} — {hasilScreening.metode_skrining}
                  </p>
                </div>
              </div>
              <ResultVisualizer data={aiSuaraData} />
            </section>
          ) : (
            /* Placeholder jika tidak ada data AI suara */
            <section className="rounded-[10px] border border-dashed border-border bg-muted/20 p-8 text-center pt-6 mt-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background border border-border shadow-sm">
                <Mic className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-[14px] font-semibold text-foreground">
                Analisis suara tidak tersedia
              </p>
              <p className="mt-1.5 text-[13px] text-muted-foreground max-w-sm mx-auto">
                Skrining ini tidak menyertakan rekaman suara batuk untuk dianalisis oleh AI.
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-md p-4 sm:p-6 flex justify-center z-40">
        <div className="flex w-full max-w-4xl justify-end gap-3 px-2">
            <Button asChild variant="outline" className="rounded-full px-6 h-10 text-[14px] bg-background">
            <Link
                href={
                skriningId
                    ? `/user/list-riwayat-pasien?pasienId=${pasienId}`
                    : "/user/riwayat-screening"
                }
            >
                Tutup
            </Link>
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isDownloading} className="rounded-full px-6 h-10 text-[14px] shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]">
            {isDownloading ? (
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Menyiapkan...
                </div>
            ) : (
                <>
                <Download className="mr-2 h-4 w-4" />
                Unduh PDF
                </>
            )}
            </Button>
        </div>
      </div>
    </div>
  )
}

export default function HasilScreeningPage() {
  return (
    <React.Suspense fallback={
      <div className="flex h-[100vh] items-center justify-center bg-background">
        <div className="text-[14px] text-muted-foreground flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Memuat halaman...
        </div>
      </div>
    }>
      <HasilScreeningContent />
    </React.Suspense>
  )
}

// Helper component untuk list faktor risiko
function DetailItem({ label, value }: { label: string; value?: string | null }) {
    const isWarning = value?.toLowerCase() === "ya" || value?.toLowerCase() === "iya";
    return (
      <div className="flex justify-between items-center sm:justify-start sm:gap-2 border-b border-border/50 sm:border-0 pb-1.5 sm:pb-0">
        <span className="text-muted-foreground">{label}:</span>
        <span className={`font-medium ${isWarning ? "text-destructive" : "text-foreground"}`}>
          {value || "-"}
        </span>
      </div>
    )
}