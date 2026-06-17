"use client"

import React, { useEffect, useState } from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { CheckCircle, Clock, XCircle } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import { getRujukanByKecamatan, verifyRujukan, Rujukan } from "@/app/services/rujukan.services"
import { getSkriningDetail, SkriningRiwayat } from "@/app/services/skrining.services"

export default function DataRujukanPage() {
  const [data, setData] = useState<Rujukan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRujukan, setSelectedRujukan] = useState<Rujukan | null>(null)
  const [catatan, setCatatan] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("belum-verifikasi")
  const [detailSkrining, setDetailSkrining] = useState<SkriningRiwayat | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // 1. Fetch Data dari API Backend (via Service)
  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getRujukanByKecamatan()
      setData(result)
    } catch (err) {
      console.error(err)
      toast.error("Gagal memuat data rujukan.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 2. Handle Klik Tombol Verifikasi
  const handleVerifyClick = async (item: Rujukan) => {
    setSelectedRujukan(item)
    setCatatan("")
    setDetailSkrining(null)
    setIsModalOpen(true)

    setLoadingDetail(true)
    try {
      // (item as any).skrining_id digunakan agar mencegah error Typescript jika properti tidak terexpose di interface
      const detail = await getSkriningDetail((item as any).skrining_id)
      setDetailSkrining(detail)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // 3. Submit Verifikasi ke Backend (via Service)
  const confirmVerification = async () => {
    if (!selectedRujukan) return

    try {
      await verifyRujukan(selectedRujukan.id, catatan)
      toast.success("Data pasien berhasil diverifikasi!")
      setIsModalOpen(false)
      fetchData() // Refresh tabel
    } catch (error) {
      console.error(error)
      toast.error("Terjadi kesalahan saat memverifikasi pasian.")
    }
  }

  // FILTER DATA BASED ON TAB
  const filteredData = data.filter((item) => {
    if (activeTab === "belum-verifikasi") return item.status === "Pending"
    if (activeTab === "terverifikasi") return item.status === "Terverifikasi"
    return true // "semua"
  })

  return (
    <div className="space-y-6 p-4 sm:p-6" style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Data Rujukan Masuk</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Daftar pasien terduga TBC yang dirujuk sistem ke Puskesmas Anda.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between pb-5 overflow-x-auto hide-scrollbar">
          <TabsList className="h-10 rounded-full bg-muted/50 p-1 w-max">
            <TabsTrigger value="belum-verifikasi" className="rounded-full px-5 text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm relative">
              Belum Verifikasi
              {data.filter(i => i.status === "Pending").length > 0 && (
                <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive/10 text-[10px] font-bold text-destructive border border-destructive/20">
                  {data.filter(i => i.status === "Pending").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="terverifikasi" className="rounded-full px-5 text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Terverifikasi</TabsTrigger>
            <TabsTrigger value="semua" className="rounded-full px-5 text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Semua</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]">
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0 z-10 border-b border-border">
                <TableRow>
                  <TableHead className="w-[200px]"><div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground font-mono">Nama Pasien</div></TableHead>
                  <TableHead><div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground font-mono">NIK</div></TableHead>
                  <TableHead><div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground font-mono">Alamat</div></TableHead>
                  <TableHead><div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground font-mono">Tanggal Rujukan</div></TableHead>
                  <TableHead><div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground font-mono">Status</div></TableHead>
                  <TableHead className="text-right"><div className="text-right text-[12px] font-medium uppercase tracking-wider text-muted-foreground font-mono">Aksi</div></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24 text-[14px] text-muted-foreground">Memuat data...</TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24 text-[14px] text-muted-foreground">Tidak ada data untuk status ini.</TableCell></TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-medium text-foreground">{item.pasien_nama}</span>
                          <span className="text-[12px] text-muted-foreground mt-0.5">{item.pasien_no_hp || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[14px]">{item.pasien_nik}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-[14px]" title={item.pasien_alamat}>{item.pasien_alamat}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-[14px]">
                          <span>{item.created_at ? format(new Date(item.created_at), "dd MMM yyyy", { locale: localeId }) : "-"}</span>
                          <span className="text-[12px] text-muted-foreground mt-0.5">{item.created_at ? format(new Date(item.created_at), "HH:mm", { locale: localeId }) : ""}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.status === "Pending" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                            <Clock className="w-3.5 h-3.5" /> Menunggu
                          </span>
                        ) : item.status === "Terverifikasi" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" /> Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-destructive">
                            <XCircle className="w-3.5 h-3.5" /> Ditolak
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === "Pending" ? (
                          <Button size="sm" onClick={() => handleVerifyClick(item)} className="rounded-full px-4 h-8 text-[12px] shadow-sm bg-primary text-primary-foreground">
                            Verifikasi
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled className="rounded-full px-4 h-8 text-[12px]">
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Selesai
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Verifikasi */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[16px] border-border" style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}>
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight">Verifikasi Pasien Datang</DialogTitle>
            <DialogDescription className="mt-1.5 text-[14px]">
              Konfirmasi bahwa pasien <span className="font-medium text-foreground">{selectedRujukan?.pasien_nama}</span> telah hadir di Puskesmas untuk pemeriksaan lanjutan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            <div className="grid gap-3 p-4 bg-muted/30 rounded-[12px] border border-border shadow-sm text-[14px]">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground text-[13px]">NIK:</span>
                <span className="font-medium">{selectedRujukan?.pasien_nik}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-[13px]">Status Diagnosis:</span>
                <span className="font-semibold text-destructive uppercase text-[12px] tracking-wider">{selectedRujukan?.hasil_deteksi}</span>
              </div>
            </div>

            {/* Preview Gejala Klinis */}
            <div className="space-y-2.5">
              <Label className="text-[13px] font-medium">Preview Gejala Klinis</Label>
              <div className="p-3 bg-muted/20 border border-border rounded-md text-[13px] max-h-[160px] overflow-y-auto hide-scrollbar">
                {loadingDetail ? (
                  <span className="text-muted-foreground text-xs animate-pulse">Memuat data gejala...</span>
                ) : detailSkrining ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    <DetailItem label="Batuk" value={detailSkrining.batuk} />
                    <DetailItem label="Demam" value={detailSkrining.demam_tidak_diketahui_penyebabnya} />
                    <DetailItem label="Sesak Napas" value={detailSkrining.sesak_napas_tanpa_nyeri_dada} />
                    <DetailItem label="Keringat Malam" value={detailSkrining.berkeringat_malam_tanpa_kegiatan} />
                    <DetailItem label="BB Turun" value={detailSkrining.bb_turun_tanpa_sebab_nafsu_makan_turun} />
                    <DetailItem label="Kontak TBC" value={detailSkrining.riwayat_kontak_tbc} />
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">Detail gejala tidak tersedia.</span>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="catatan" className="text-[13px] font-medium">Catatan Admin (Opsional)</Label>
              <Input
                id="catatan"
                placeholder="Contoh: Pasien dilakukan tes dahak..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="h-10 text-[14px] rounded-md"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-full px-6 h-10 text-[14px]">Batal</Button>
            <Button onClick={confirmVerification} className="rounded-full px-6 h-10 text-[14px] shadow-sm">Konfirmasi Kedatangan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Komponen kecil pendukung tampilan Gejala
function DetailItem({ label, value }: { label: string; value?: string | null }) {
  const isWarning = value?.toLowerCase() === "ya" || value?.toLowerCase() === "iya"
  return (
    <div className="flex justify-between sm:gap-2 pb-1 sm:pb-0">
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className={`font-medium text-xs ${isWarning ? "text-destructive" : "text-foreground"}`}>
        {value || "-"}
      </span>
    </div>
  )
}