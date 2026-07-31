"use client"

import React, { useEffect, useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/app/services/useAuth"
import { getSkriningByKabupaten } from "@/app/services/dinkes.services"
import { Users, Activity, AlertTriangle, Hospital, Search, MapPin, Download } from "lucide-react"
import * as XLSX from "xlsx"

// Komponen UI dari Shadcn
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"

// --- INTERFACES ---
interface PasienSkriningData {
  id: number;
  pasien_id: number;
  hasil_deteksi: string;
  pasien_nama: string;
  pasien_nik: string;
  nama_kecamatan: string;
  kecamatan_id: number;
  tanggal_skrining: string;
  [key: string]: any; // Untuk menangkap data gejala yang dikirim backend
}

interface KabupatenStats {
  total_pasien: number
  total_screening: number
  suspect: number
  non_suspect: number
  jumlah_puskesmas: number
}

// --- MAIN DASHBOARD COMPONENT ---
export default function DashboardAdminDinkes() {
  const { user } = useAuth()
  const [rawData, setRawData] = useState<PasienSkriningData[]>([])
  const [kabupatenStats, setKabupatenStats] = useState<KabupatenStats | null>(null)
  
  // State untuk Filter Tabel
  const [activeTab, setActiveTab] = useState("all") 
  const [selectedKecamatan, setSelectedKecamatan] = useState("all") 
  const [searchQuery, setSearchQuery] = useState("")
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === "admin_dinkes") {
        try {
          setLoading(true)
          const data = await getSkriningByKabupaten()
          
          const formattedData = data.map((item: any) => ({
            ...item,
            pasien_nama: item.pasien_nama || item.nama || "Tanpa Nama",
            hasil_deteksi: item.hasil_deteksi || item.hasil_screening || "Tidak Diketahui",
            nama_kecamatan: item.nama_kecamatan || item.pasien?.nama_kecamatan || "-",
            kecamatan_id: item.kecamatan_id || item.pasien?.kecamatan_id || 0,
          }))

          setRawData(formattedData)

          const uniqueKecamatan = new Set<number>()
          const uniquePatients = new Set<number>()
          let suspect = 0

          formattedData.forEach((item: PasienSkriningData) => {
            if (item.kecamatan_id) uniqueKecamatan.add(item.kecamatan_id)
            if (item.pasien_id) uniquePatients.add(item.pasien_id)
            if (item.hasil_deteksi?.toUpperCase() === "TERDUGA TBC") suspect++
          })

          setKabupatenStats({
            total_pasien: uniquePatients.size,
            total_screening: formattedData.length,
            suspect: suspect,
            non_suspect: formattedData.length - suspect,
            jumlah_puskesmas: uniqueKecamatan.size,
          })
          setError(null)
        } catch (err) {
          console.error("Gagal memuat data:", err)
          setError("Gagal memuat data skrining. Silakan coba lagi.")
        } finally {
          setLoading(false)
        }
      }
    }
    fetchData()
  }, [user])

  // --- FILTERING LOGIC ---
  const listKecamatan = useMemo(() => {
    const map = new Map<number, string>()
    rawData.forEach(item => {
      if (item.kecamatan_id && item.nama_kecamatan) {
        map.set(item.kecamatan_id, item.nama_kecamatan)
      }
    })
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }))
  }, [rawData])

  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const isSuspect = item.hasil_deteksi?.toUpperCase() === "TERDUGA TBC"
      const matchStatus = activeTab === "all" ? true : activeTab === "suspect" ? isSuspect : !isSuspect
      const matchKecamatan = selectedKecamatan === "all" ? true : item.kecamatan_id.toString() === selectedKecamatan
      const matchSearch = item.pasien_nama?.toLowerCase().includes(searchQuery.toLowerCase()) || item.pasien_nik?.includes(searchQuery)

      return matchStatus && matchKecamatan && matchSearch
    })
  }, [rawData, activeTab, selectedKecamatan, searchQuery])

  // --- EXPORT TO EXCEL ---
  const handleExportXLSX = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diekspor.")
      return
    }

    // Siapkan data yang akan diekspor
    const exportData = filteredData.map((item, index) => ({
      "No": index + 1,
      "Nama Pasien": item.pasien_nama,
      "NIK": item.pasien_nik || "-",
      "Kecamatan": item.nama_kecamatan,
      "Tanggal Skrining": item.tanggal_skrining ? new Date(item.tanggal_skrining).toLocaleDateString("id-ID") : "-",
      "Hasil Deteksi": item.hasil_deteksi,
      "Riwayat Kontak": item.riwayat_kontak_tbc || "-",
      "Batuk": item.batuk || "-",
      "Demam": item.demam_tidak_diketahui_penyebabnya || "-",
      "Sesak Napas": item.sesak_napas_tanpa_nyeri_dada || "-",
      "Berkeringat Malam": item.berkeringat_malam_tanpa_kegiatan || "-",
      "BB Turun": item.bb_turun_tanpa_sebab_nafsu_makan_turun || "-",
    }))

    // Buat worksheet dan workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Skrining")

    // Sesuaikan lebar kolom
    const wscols = [
      { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }
    ]
    worksheet["!cols"] = wscols

    // Trigger unduhan file
    XLSX.writeFile(workbook, `Data_Skrining_Dinkes_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (loading) return <div className="p-8 text-center font-medium">Memuat data dashboard...</div>
  if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8" style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Dinas Kesehatan</h2>
      </div>

      {/* --- BAGIAN 1: STATISTIK --- */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        
        <Card data-slot="card" className="@container/card relative overflow-hidden">
          <CardHeader>
            <div className="text-sm text-muted-foreground font-medium mb-1">Total Skrining Keseluruhan</div>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {new Intl.NumberFormat("id-ID").format(kabupatenStats?.total_screening ?? 0)}
            </CardTitle>
            <div className="absolute right-6 top-6">
              <span className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors">
                <Activity className="size-3.5" />
                {kabupatenStats?.total_pasien ?? 0} Pasien Unik
              </span>
            </div>
          </CardHeader>
          <div className="flex flex-col items-start gap-1.5 px-6 pb-6 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">Volume Pemeriksaan</div>
            <div className="text-muted-foreground">Jumlah seluruh skrining yang tercatat di wilayah Anda.</div>
          </div>
        </Card>

        <Card data-slot="card" className="@container/card relative overflow-hidden">
          <CardHeader>
            <div className="text-sm text-muted-foreground font-medium mb-1">Total Terduga TBC</div>
            <CardTitle className="text-2xl font-semibold tabular-nums text-destructive @[250px]/card:text-3xl">
              {new Intl.NumberFormat("id-ID").format(kabupatenStats?.suspect ?? 0)}
            </CardTitle>
            <div className="absolute right-6 top-6">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-2.5 py-0.5 text-xs font-medium">
                <AlertTriangle className="size-3.5" />
                Suspect Rate
              </span>
            </div>
          </CardHeader>
          <div className="flex flex-col items-start gap-1.5 px-6 pb-6 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">Indikasi Positif</div>
            <div className="text-muted-foreground">Pasien yang direkomendasikan untuk pemeriksaan rujukan.</div>
          </div>
        </Card>

        <Card data-slot="card" className="@container/card relative overflow-hidden">
          <CardHeader>
            <div className="text-sm text-muted-foreground font-medium mb-1">Cakupan Wilayah</div>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {new Intl.NumberFormat("id-ID").format(kabupatenStats?.jumlah_puskesmas ?? 0)}
            </CardTitle>
            <div className="absolute right-6 top-6">
              <span className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium">
                <Hospital className="size-3.5" />
                Kecamatan
              </span>
            </div>
          </CardHeader>
          <div className="flex flex-col items-start gap-1.5 px-6 pb-6 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">Aktivitas Faskes</div>
            <div className="text-muted-foreground">Jumlah kecamatan yang rutin melakukan skrining TBC.</div>
          </div>
        </Card>
      </div>

      {/* --- BAGIAN 2: DATA TABEL CANGGIH --- */}
      <Card className="flex flex-col shadow-sm border-border">
        <div className="p-4 md:p-6 space-y-4 border-b border-border">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* Filter Status (TABS) */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full xl:w-auto">
              <TabsList className="h-10 rounded-full bg-muted/50 p-1 w-full xl:w-auto flex">
                <TabsTrigger value="all" className="rounded-full px-5 flex-1 text-[13px]">Semua Data</TabsTrigger>
                <TabsTrigger value="suspect" className="rounded-full px-5 flex-1 text-[13px] text-red-600 data-[state=active]:text-red-700">Terduga TBC</TabsTrigger>
                <TabsTrigger value="non-suspect" className="rounded-full px-5 flex-1 text-[13px] text-green-600 data-[state=active]:text-green-700">Normal</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filter & Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
              <Select value={selectedKecamatan} onValueChange={setSelectedKecamatan}>
                <SelectTrigger className="h-10 w-full sm:w-[200px] rounded-full text-[13px]">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Semua Kecamatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kecamatan</SelectItem>
                  {listKecamatan.map((kec) => (
                    <SelectItem key={kec.id} value={kec.id.toString()}>{kec.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari nama atau NIK..." 
                  className="pl-9 h-10 rounded-full text-[13px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Tombol Export */}
              <Button 
                variant="outline" 
                onClick={handleExportXLSX}
                className="h-10 w-full sm:w-auto rounded-full text-[13px] font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Export XLSX
              </Button>
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[12px] text-muted-foreground uppercase bg-muted/40 border-b font-mono tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Nama Pasien</th>
                <th className="px-6 py-4 font-medium">Kecamatan</th>
                <th className="px-6 py-4 font-medium">Tanggal Skrining</th>
                <th className="px-6 py-4 font-medium">Hasil Deteksi</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    Tidak ada data skrining yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={idx} className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground text-[14px]">{item.pasien_nama}</div>
                      <div className="text-[12px] text-muted-foreground">NIK: {item.pasien_nik || "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-foreground text-[14px]">
                      {item.nama_kecamatan}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-[13px]">
                      {item.tanggal_skrining ? new Date(item.tanggal_skrining).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <ResultBadge result={item.hasil_deteksi} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <TableCellViewer item={item} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border text-sm text-muted-foreground bg-muted/20">
          Menampilkan {filteredData.length} data skrining.
        </div>
      </Card>
    </div>
  )
}

// --- SUB KOMPONEN KECIL ---

function ResultBadge({ result }: { result: string }) {
  const isPositive = result.toUpperCase() === "TERDUGA TBC"
  const badgeClass = isPositive
    ? "bg-red-500/10 text-red-600 border-red-500/20"
    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${badgeClass}`}>
      {result}
    </span>
  )
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  const isWarning = value?.toLowerCase() === "ya" || value?.toLowerCase() === "iya"
  return (
    <div className="flex justify-between sm:justify-start sm:gap-2 border-b border-border/50 sm:border-0 pb-1.5 sm:pb-0">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-medium ${isWarning ? "text-destructive" : "text-foreground"}`}>
        {value || "-"}
      </span>
    </div>
  )
}

function TableCellViewer({ item }: { item: PasienSkriningData }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="ghost" className="text-foreground hover:bg-muted/50 rounded-full px-4 h-8 text-[13px] border border-border">
          Lihat Detail
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[95vh] sm:h-full sm:max-w-xl sm:ml-auto rounded-t-[16px] sm:rounded-l-[16px] sm:rounded-r-none border-border" style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}>
        <DrawerHeader className="border-b border-border pb-4 pt-6 px-6 text-left">
          <DrawerTitle className="text-xl font-semibold tracking-tight">Detail Skrining Pasien</DrawerTitle>
          <DrawerDescription className="mt-1 text-[14px]">
            <span className="font-medium text-foreground">{item.pasien_nama}</span> • NIK {item.pasien_nik || "-"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <section className="grid gap-6 rounded-[12px] bg-muted/30 border border-border p-5 sm:p-6 shadow-sm">
            
            <div className="space-y-3 pb-4 sm:pb-0 sm:border-r border-border sm:pr-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Identitas & Wilayah
              </p>
              <div className="space-y-1.5 text-[14px]">
                <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Nama:</span> <span className="font-medium sm:font-normal">{item.pasien_nama}</span></p>
                <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">NIK:</span> <span>{item.pasien_nik || "-"}</span></p>
                <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Kecamatan:</span> <span className="font-semibold text-primary">{item.nama_kecamatan}</span></p>
              </div>
            </div>

            <div className="space-y-3 pt-5 border-t border-border sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Ringkasan Hasil Skrining
              </p>
              <div className="space-y-4 rounded-md border border-border bg-background p-4 text-[14px] shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium text-foreground">Status Diagnosis:</span>
                  <ResultBadge result={item.hasil_deteksi} />
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[13px] font-medium text-foreground">Waktu Skrining:</span>
                  <span className="text-[13px] text-muted-foreground">
                    {item.tanggal_skrining ? new Date(item.tanggal_skrining).toLocaleString("id-ID") : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-5 border-t border-border sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Faktor Risiko & Gejala Dilaporkan
              </p>
              <div className="grid gap-x-6 gap-y-2.5 text-[13px] sm:grid-cols-2">
                <DetailItem label="Riwayat kontak TBC" value={item.riwayat_kontak_tbc} />
                <DetailItem label="Pernah terdiagnosa" value={item.pernah_terdiagnosa} />
                <DetailItem label="Pernah berobat" value={item.pernah_berobat_tbc} />
                <DetailItem label="Pengobatan tdk tuntas" value={item.pernah_berobat_tb_tapi_tidak_tuntas} />
                <DetailItem label="Malnutrisi" value={item.malnutrisi} />
                <DetailItem label="Perokok" value={item.merokok_perokok_pasif} />
                <DetailItem label="Riwayat DM" value={item.riwayat_dm_kencing_manis} />
                <DetailItem label="Lansia (60+)" value={item.lansia} />
                <DetailItem label="Ibu hamil" value={item.ibu_hamil} />
                <DetailItem label="Batuk" value={item.batuk} />
                <DetailItem label="BB turun tanpa sebab" value={item.bb_turun_tanpa_sebab_nafsu_makan_turun} />
                <DetailItem label="Demam" value={item.demam_tidak_diketahui_penyebabnya} />
                <DetailItem label="Badan lemas" value={item.badan_lemas} />
                <DetailItem label="Berkeringat malam" value={item.berkeringat_malam_tanpa_kegiatan} />
                <DetailItem label="Sesak napas" value={item.sesak_napas_tanpa_nyeri_dada} />
                <DetailItem label="Pembesaran kelenjar" value={item.ada_pembesaran_getah_bening_dileher} />
              </div>
            </div>

          </section>
        </div>

        <DrawerFooter className="border-t border-border p-4 sm:px-6 sm:py-4 bg-background">
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-end">
            <DrawerClose asChild>
              <Button variant="outline" className="rounded-full px-6 h-10 text-[14px]">Tutup Detail</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}