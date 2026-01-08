"use client"

import React, { useEffect, useState } from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export default function DataRujukanPage() {
  const [data, setData] = useState<Rujukan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRujukan, setSelectedRujukan] = useState<Rujukan | null>(null)
  const [catatan, setCatatan] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("belum-verifikasi")

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
  const handleVerifyClick = (item: Rujukan) => {
    setSelectedRujukan(item)
    setCatatan("")
    setIsModalOpen(true)
  }

  // 3. Submit Verifikasi ke Backend (via Service)
  const confirmVerification = async () => {
    if (!selectedRujukan) return

    try {
      await verifyRujukan(selectedRujukan.id, catatan)
      toast.success("Pasien berhasil diverifikasi")
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
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Rujukan Masuk</h1>
          <p className="text-muted-foreground">
            Daftar pasien terduga TBC yang dirujuk sistem ke Puskesmas Anda.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between pb-4">
          <TabsList>
            <TabsTrigger value="belum-verifikasi" className="relative">
              Belum Verifikasi
              {data.filter(i => i.status === "Pending").length > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-medium text-red-600">
                  {data.filter(i => i.status === "Pending").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="terverifikasi">Terverifikasi</TabsTrigger>
            <TabsTrigger value="semua">Semua</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="rounded-md border bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">Nama Pasien</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Tanggal Rujukan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">Memuat data...</TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Tidak ada data untuk status ini.</TableCell></TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{item.pasien_nama}</span>
                          <span className="text-xs text-muted-foreground">{item.pasien_no_hp || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.pasien_nik}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.pasien_alamat}>{item.pasien_alamat}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{item.created_at ? format(new Date(item.created_at), "dd MMM yyyy", { locale: localeId }) : "-"}</span>
                          <span className="text-xs text-muted-foreground">{item.created_at ? format(new Date(item.created_at), "HH:mm", { locale: localeId }) : ""}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.status === "Pending" ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Clock className="w-3 h-3 mr-1" /> Menunggu
                          </Badge>
                        ) : item.status === "Terverifikasi" ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle className="w-3 h-3 mr-1" /> Terverifikasi
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="w-3 h-3 mr-1" /> Ditolak
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === "Pending" ? (
                          <Button size="sm" onClick={() => handleVerifyClick(item)} className="bg-blue-600 hover:bg-blue-700">
                            Verifikasi
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled>
                            <CheckCircle className="w-4 h-4 mr-2" /> Selesai
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verifikasi Pasien Datang</DialogTitle>
            <DialogDescription>
              Konfirmasi bahwa pasien <b>{selectedRujukan?.pasien_nama}</b> telah hadir di Puskesmas untuk pemeriksaan lebih lanjut.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2 p-3 bg-muted/40 rounded-lg text-sm border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">NIK:</span>
                <span className="font-medium">{selectedRujukan?.pasien_nik}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hasil Skrining:</span>
                <span className="font-medium text-red-600">{selectedRujukan?.hasil_deteksi}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan Admin (Opsional)</Label>
              <Input
                id="catatan"
                placeholder="Contoh: Pasien dilakukan tes dahak..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={confirmVerification}>Konfirmasi Kedatangan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}