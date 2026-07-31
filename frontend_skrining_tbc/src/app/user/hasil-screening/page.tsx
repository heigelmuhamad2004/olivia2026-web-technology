"use client"

import React, { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion, Variants } from "framer-motion"
import jsPDF from "jspdf"
import * as htmlToImage from "html-to-image"
import {
  Download,
  Mic,
  ClipboardList,
  BrainCircuit,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  FunctionSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { customToast } from "@/components/ui/alert-1"
import { Separator } from "@/components/ui/separator"
import { ResultVisualizer } from "@/components/ResultVisualizer"
import {
  getRiwayatSkriningByPasien,
  SkriningRiwayat,
} from "@/app/services/skrining.services"

// ── Types ────────────────────────────────────────────────────────────────────
interface FusionDetails {
  prob_klinis_rf: number
  prob_audio_ai: number
  prob_gabungan: number
}

interface MathDetails {
  audio_details?: {
    aktivasi: string
    probabilitas_p: number
    raw_logit_z: number
    threshold: number
    rumus: string
    keterangan: string
  }
  fusion_details?: FusionDetails
  aktivasi?: string
  probabilitas_p?: number
  raw_logit_z?: number
  threshold?: number
  rumus?: string
  keterangan?: string
}

interface SkriningRiwayatExtended extends SkriningRiwayat {
  detail_matematika?: MathDetails
  spectrogram_image?: string
  gradcam_image?: string
}

// ── Animation variants ───────────────────────────────────────────────────────
const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const item: Variants = {
  hidden: { y: 12, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 16 } },
}

// Fungsi untuk menampilkan 6 digit awal, 6 bintang, dan 4 digit akhir
const maskNIK = (nik: string | undefined | null) => {
  if (!nik || nik.length < 16) return nik || "—";
  return nik.substring(0, 6) + "******" + nik.substring(12);
};

// ── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  const isWarning =
    value?.toLowerCase() === "ya" ||
    value?.toLowerCase() === "iya" ||
    value?.toLowerCase() === "true"
  return (
    <div className="flex justify-between items-start gap-3 py-1.5 border-b border-[#ebebeb] last:border-b-0">
      <span className="text-[13px] text-[#888888] shrink-0">{label}</span>
      <span
        className={`text-[13px] font-medium text-right ${
          isWarning ? "text-[#A32D2D]" : "text-[#171717]"
        }`}
      >
        {value?.trim() ? value : "—"}
      </span>
    </div>
  )
}

function GejalaVal({ value }: { value?: string | null }) {
  const isYa =
    value?.toLowerCase() === "ya" ||
    value?.toLowerCase() === "iya" ||
    value?.toLowerCase() === "true"
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        isYa
          ? "bg-[#FCEBEB] text-[#791F1F]"
          : "bg-[#F1EFE8] text-[#444441]"
      }`}
    >
      {value?.trim() || "—"}
    </span>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
function HasilScreeningContent() {
  const searchParams = useSearchParams()
  
  // PERBAIKAN 1: Buat state untuk menyimpan ID dari kombinasi URL dan sessionStorage
  const [pasienId, setPasienId] = useState<string | null>(null)
  const [skriningId, setSkriningId] = useState<string | null>(null)

  const [riwayat, setRiwayat] = useState<SkriningRiwayat[]>([])
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  
  const pdfRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Cari di URL terlebih dahulu, jika kosong, cari di sessionStorage
    const currentPasienId = searchParams.get("pasienId") || sessionStorage.getItem("currentPasienId")
    const currentSkriningId = searchParams.get("skriningId") || sessionStorage.getItem("currentSkriningId")

    setPasienId(currentPasienId)
    setSkriningId(currentSkriningId)

    if (currentPasienId) {
      getRiwayatSkriningByPasien(currentPasienId)
        .then((data) => {
          setRiwayat(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error("Gagal menarik data:", err)
          setLoading(false)
        })
    } else {
      // PERBAIKAN 2: Jika tidak ada ID sama sekali, paksa loading berhenti
      setLoading(false)
    }
  }, [searchParams])

  const handleDownloadPdf = async () => {
    const element = pdfRef.current
    if (!element) return
    setIsDownloading(true)
    
    try {
      const dataUrl = await htmlToImage.toPng(element, { 
        quality: 1.0, 
        pixelRatio: 2, 
        backgroundColor: '#fafafa',
        style: {
          transform: 'none',
          animation: 'none',
        },
        cacheBust: true,
      })

      const pdf = new jsPDF("p", "mm", "a4")
      
      const marginX = 12 
      const marginY = 15 
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgProps = pdf.getImageProperties(dataUrl)
      
      const imgWidth = pdfWidth - (marginX * 2)
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width
      
      let heightLeft = imgHeight
      let position = marginY 

      pdf.addImage(dataUrl, "PNG", marginX, position, imgWidth, imgHeight)
      heightLeft -= (pdfHeight - marginY * 2)

      while (heightLeft > 1) { 
        position = position - pdfHeight
        pdf.addPage()
        pdf.addImage(dataUrl, "PNG", marginX, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }
      
      pdf.save(`Hasil_Skrining_${hasilScreening?.nama || "Pasien"}.pdf`)
      customToast.success("PDF berhasil diunduh!")
    } catch (err) {
      console.error("Gagal download PDF:", err)
      customToast.error("Gagal mengunduh PDF.")
    } finally {
      setIsDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-[14px] text-[#888888]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7928ca] border-t-transparent" />
          Memuat hasil skrining...
        </div>
      </div>
    )
  }

  // Jika setelah loading ID pasien tetap tidak ada, atau riwayat kosong
  if (!pasienId || riwayat.length === 0) {
    return (
      <div className="flex h-[calc(100vh-5rem)] flex-col items-center justify-center text-center px-4">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#ebebeb] bg-white">
          <Mic className="h-5 w-5 text-[#888888]" />
        </div>
        <h1 className="text-[18px] font-semibold text-[#171717]">Tidak ada riwayat skrining</h1>
        <p className="mt-1.5 text-[14px] text-[#888888]">Data skrining pasien tidak ditemukan.</p>
        <Button asChild variant="outline" className="mt-6 rounded-full px-6">
          <Link href="/user/riwayat-screening">Kembali ke Daftar Pasien</Link>
        </Button>
      </div>
    )
  }

  let hasilScreening: SkriningRiwayat | undefined
  // PERBAIKAN 3: Jangan gunakan Number(), gunakan .toString() untuk membandingkan Hashids
  if (skriningId) {
    hasilScreening = riwayat.find((r) => r.id.toString() === skriningId.toString())
  }
  if (!hasilScreening) {
    hasilScreening = riwayat[riwayat.length - 1]
  }

  const data = hasilScreening as SkriningRiwayatExtended
  const statusDeteksi = (data.hasil_screening || "").toUpperCase();
  const isPositif = (
    (statusDeteksi.includes("TERDUGA") || statusDeteksi.includes("SUSPEK") || statusDeteksi.includes("POSITIF")) 
    && !statusDeteksi.includes("TIDAK") 
    && !statusDeteksi.includes("BUKAN")
  );
  const isHybrid = (data.metode_skrining || "").toLowerCase().includes("hybrid")
  const math = data.detail_matematika
  const fusion = math?.fusion_details
  const hasAiSuara = data.skor_suara_ai != null && (data.gradcam_image || data.spectrogram_image)
  const skorTBC = fusion ? fusion.prob_gabungan : (data.skor_suara_ai ?? 0)

  const aiData = hasAiSuara
    ? {
        diagnosis: isPositif ? "Suspek TBC" : "Normal",
        prob_tbc: skorTBC,
        prob_normal: 100 - skorTBC,
        spectrogram_image: data.gradcam_image || data.spectrogram_image || "",
        math_details: math?.audio_details || math,
        algoritma: data.metode_skrining || "AI",
      }
    : null

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={container}
      className="flex min-h-[calc(100vh-5rem)] w-full flex-col items-center bg-[#fafafa] px-4 pb-28 pt-8 sm:px-6"
      style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}
    >
      <div className="w-full max-w-4xl space-y-4">

        <motion.div variants={item}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/user/riwayat-screening" className="text-[13px]">Daftar pasien</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/user/list-riwayat-pasien?pasienId=${pasienId}`} className="text-[13px]">Riwayat skrining</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[13px]">Hasil skrining</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        <div ref={pdfRef} className="space-y-4 bg-[#fafafa]">
          <motion.div
            variants={item}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#ebebeb] bg-white px-6 py-5"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                isPositif
                  ? "bg-[#FCEBEB] text-[#A32D2D]"
                  : "bg-[#EAF3DE] text-[#3B6D11]"
              }`}
            >
              {isPositif ? (
                <ShieldX className="h-6 w-6" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[.06em] text-[#888888] font-mono mb-1">
                Diagnosis akhir
              </p>
              <p
                className={`text-[22px] font-semibold tracking-tight ${
                  isPositif ? "text-[#791F1F]" : "text-[#27500A]"
                }`}
              >
                {data.hasil_screening}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#D3D1C7] bg-[#F1EFE8] px-2.5 py-0.5 text-[11px] font-medium text-[#444441]">
                  <ClipboardList className="h-3 w-3" />
                  {isHybrid ? "Formulir klinis" : "Skrining form"}
                </span>
                {hasAiSuara && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#CECBF6] bg-[#EEEDFE] px-2.5 py-0.5 text-[11px] font-medium text-[#3C3489]">
                    <Mic className="h-3 w-3" />
                    {data.metode_skrining}
                  </span>
                )}
              </div>
            </div>

            {/* Bagian skor probabilitas TBC    
            <div className="text-right shrink-0">
              <p className="text-[32px] font-semibold tracking-[-1.2px] text-[#7928ca] leading-none">
                {skorTBC.toFixed(1)}%
              </p>
              <p className="text-[11px] text-[#888888] mt-1">probabilitas TBC</p>
            </div>
             */}
          </motion.div>

          {isPositif && (
            <motion.div
              variants={item}
              className="flex items-start gap-3 rounded-xl border border-[#FAC775] bg-[#FAEEDA] px-5 py-4"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#854F0B] mt-0.5" />
              <div>
                <p className="text-[13px] font-medium text-[#633806] mb-1">Rujukan otomatis dibuat</p>
                <p className="text-[12px] leading-relaxed text-[#854F0B]">
                  Sistem telah mengirimkan notifikasi ke{" "}
                  <span className="font-medium">Puskesmas Kecamatan</span>. Silakan datang
                  membawa unduhan PDF ini untuk pemeriksaan TCM / Dahak lebih lanjut.
                </p>
              </div>
            </motion.div>
          )}

          <motion.div variants={item} className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#ebebeb] bg-white p-5">
              <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[.06em] text-[#888888]">
                Identitas pasien
              </p>
              <DetailRow label="Nama" value={data.nama} />
              <DetailRow label="NIK" value={maskNIK(data.nik)} />
              <DetailRow label="Tanggal lahir" value={`${data.tanggal_lahir} (${data.usia})`} />
              <DetailRow label="Jenis kelamin" value={data.kelamin} />
              <DetailRow label="Alamat" value={data.alamat} />
            </div>

            <div className="rounded-xl border border-[#ebebeb] bg-white p-5">
              <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[.06em] text-[#888888]">
                Kontak & lainnya
              </p>
              <DetailRow label="No. HP" value={data.no_hp} />
              <DetailRow label="Email" value={data.email} />
              <DetailRow label="Pekerjaan" value={data.pekerjaan} />
              <DetailRow label="Berat badan" value={data.berat_badan} />
              <DetailRow label="Tinggi badan" value={data.tinggi_badan} />
            </div>
          </motion.div>

          <motion.div variants={item} className="rounded-xl border border-[#ebebeb] bg-white p-5">
            <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[.06em] text-[#888888]">
              Faktor risiko & gejala dilaporkan
            </p>
            <div className="grid gap-x-8 sm:grid-cols-2">
              {[
                { label: "Riwayat kontak TBC", val: data.riwayat_kontak_tbc },
                { label: "Pernah terdiagnosa", val: data.pernah_terdiagnosa },
                { label: "Pernah berobat TBC", val: data.pernah_berobat_tbc },
                { label: "Pengobatan tidak tuntas", val: data.pernah_berobat_tb_tapi_tidak_tuntas },
                { label: "Malnutrisi", val: data.malnutrisi },
                { label: "Perokok / paparan asap", val: data.merokok_perokok_pasif },
                { label: "Riwayat DM", val: data.riwayat_dm_kencing_manis },
                { label: "Lansia (60+)", val: data.lansia },
                { label: "Ibu hamil", val: data.ibu_hamil },
                { label: "Batuk > 2 minggu", val: data.batuk },
                { label: "BB turun tanpa sebab", val: data.bb_turun_tanpa_sebab_nafsu_makan_turun },
                { label: "Demam tanpa sebab", val: data.demam_tidak_diketahui_penyebabnya },
                { label: "Badan lemas", val: data.badan_lemas },
                { label: "Berkeringat malam", val: data.berkeringat_malam_tanpa_kegiatan },
                { label: "Sesak napas", val: data.sesak_napas_tanpa_nyeri_dada },
                { label: "Pembesaran getah bening", val: data.ada_pembesaran_getah_bening_dileher },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 border-b border-[#ebebeb] py-2 last:border-b-0"
                >
                  <span className="text-[12.5px] text-[#888888]">{label}</span>
                  <GejalaVal value={val} />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        {/* Bagian ini hanya muncul jika metode skrining adalah hybrid dan ada data fusion         
        {isHybrid && fusion && (
          <motion.div
            variants={item}
            className="rounded-xl border border-[#CECBF6] bg-[#EEEDFE66] p-5"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#CECBF6] bg-[#EEEDFE]">
                <FunctionSquare className="h-4 w-4 text-[#534AB7]" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#171717]">
                  Pengambilan keputusan — Weighted Soft Voting
                </p>
                <p className="text-[11px] text-[#534AB7] font-mono">
                  Hybrid fusion: formulir klinis + analisis suara AI
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[#CECBF6] bg-white p-4 font-mono text-[13px]">
              <div className="flex justify-between text-[#3C3489] mb-1.5">
                <span>Probabilitas klinis (Random Forest)</span>
                <span className="font-medium">{fusion.prob_klinis_rf.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-[#3C3489] mb-3">
                <span>Probabilitas audio AI (CNN/DenseNet)</span>
                <span className="font-medium">{fusion.prob_audio_ai.toFixed(1)}%</span>
              </div>
              <Separator className="mb-3" />
              <div className="text-[12px] text-[#534AB7] space-y-1 mb-3">
                <p>Rumus: (0.70 × {fusion.prob_klinis_rf.toFixed(1)}%) + (0.30 × {fusion.prob_audio_ai.toFixed(1)}%)</p>
                <p>
                  Perhitungan: {(0.7 * fusion.prob_klinis_rf).toFixed(2)}% + {(0.3 * fusion.prob_audio_ai).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-md border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-3">
                <span className="text-[14px] font-semibold text-[#26215C]">
                  Skor probabilitas gabungan = {fusion.prob_gabungan.toFixed(1)}%
                </span>
              </div>
              <p className="mt-2.5 text-[11px] text-[#534AB7] font-sans italic">
                Jika skor gabungan &gt; 50%, pasien dinyatakan Terduga TBC.
              </p>
            </div>
          </motion.div>
        )}
        */ }
        {aiData ? (
          <motion.div
            variants={item}
            className="rounded-xl border border-[#ebebeb] bg-white p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#CECBF6] bg-[#EEEDFE]">
                <BrainCircuit className="h-5 w-5 text-[#534AB7]" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#171717]">
                  Bukti analisis spektrogram suara batuk
                </p>
                <p className="text-[12px] text-[#888888]">
                  Diekstraksi menggunakan {aiData.algoritma}
                </p>
              </div>
            </div>
            <Separator className="mb-5" />
            <ResultVisualizer data={aiData} />
          </motion.div>
        ) : (
          <motion.div
            variants={item}
            className="flex flex-col items-center rounded-xl border border-dashed border-[#D3D1C7] bg-[#F1EFE866] py-10 text-center"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#ebebeb] bg-white">
              <Mic className="h-4 w-4 text-[#888888]" />
            </div>
            <p className="text-[13px] font-medium text-[#171717]">Analisis suara tidak diperlukan</p>
            <p className="mt-1 text-[12px] text-[#888888] max-w-xs">
              Sistem telah memberikan keputusan klinis tanpa memerlukan konfirmasi tambahan dari suara batuk.
            </p>
          </motion.div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#ebebeb] bg-[#ffffffE6] backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-3 px-4 py-3 sm:px-6">
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-full px-5 text-[13px]"
          >
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
          <Button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="h-9 rounded-full px-5 text-[13px] bg-[#171717] hover:bg-[#333] text-white"
          >
            {isDownloading ? (
              <span className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Menyiapkan...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5" />
                Unduh PDF
              </span>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default function HasilScreeningPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="flex items-center gap-2 text-[14px] text-[#888888]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7928ca] border-t-transparent" />
            Memuat halaman...
          </div>
        </div>
      }
    >
      <HasilScreeningContent />
    </React.Suspense>
  )
}