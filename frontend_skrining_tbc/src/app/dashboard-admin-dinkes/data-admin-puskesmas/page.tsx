"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/app/services/useAuth"
import { getAdminPuskesmasList, updateAdminPuskesmas, deleteAdminPuskesmas } from "@/app/services/dinkes.services"
import { Search, UserPlus, Shield, MapPin, Mail, MoreVertical, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

// Shadcn UI Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface AdminPuskesmas {
  id: number;
  nama: string;
  email: string;
  nama_kecamatan: string;
}

export default function KelolaAdminPuskesmas() {
  const { user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<AdminPuskesmas[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // State untuk Dialog Modal
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminPuskesmas | null>(null)
  
  // State Form Edit
  const [editNama, setEditNama] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const result = await getAdminPuskesmasList()
      setData(result)
    } catch (err) {
      console.error("Gagal memuat admin", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === "admin_dinkes") {
      fetchAdmins()
    }
  }, [user])

  const filteredData = useMemo(() => {
    return data.filter(admin => 
      admin.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.nama_kecamatan.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [data, searchQuery])

  // --- ACTIONS HANDLER ---
  const handleView = (admin: AdminPuskesmas) => {
    setSelectedAdmin(admin)
    setIsViewOpen(true)
  }

  const handleEdit = (admin: AdminPuskesmas) => {
    setSelectedAdmin(admin)
    setEditNama(admin.nama) // Isi form dengan nama saat ini
    setIsEditOpen(true)
  }

  const saveEdit = async () => {
    if (!selectedAdmin) return
    try {
      setIsSaving(true)
      await updateAdminPuskesmas(selectedAdmin.id, { nama: editNama })
      alert("Nama Admin berhasil diperbarui!")
      setIsEditOpen(false)
      fetchAdmins() // Refresh data tabel
    } catch (error) {
      alert("Gagal memperbarui admin.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (admin: AdminPuskesmas) => {
    // Menggunakan alert konfirmasi bawaan browser agar cepat dan anti-bug
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus akun ${admin.nama} secara permanen?`)
    if (isConfirmed) {
      try {
        await deleteAdminPuskesmas(admin.id)
        alert("Akun berhasil dihapus!")
        fetchAdmins() // Refresh data tabel
      } catch (error) {
        alert("Gagal menghapus akun.")
      }
    }
  }

  if (loading) return <div className="p-8 text-center">Memuat daftar admin puskesmas...</div>

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8" style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kelola Admin Puskesmas</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manajemen akun pengelola data TBC di tingkat kecamatan.</p>
        </div>
        <Button onClick={() => router.push("/dashboard-admin-dinkes/tambah-admin-puskesmas")} className="rounded-full shadow-sm">
          <UserPlus className="w-4 h-4 mr-2" /> Tambah Admin Baru
        </Button>
      </div>

      <Card className="shadow-sm border-border">
        <div className="p-4 md:p-6 border-b border-border bg-muted/20">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama admin atau kecamatan..." 
              className="pl-9 h-10 rounded-full bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[12px] text-muted-foreground uppercase bg-muted/40 border-b font-mono tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Informasi Akun</th>
                <th className="px-6 py-4 font-medium">Wilayah Puskesmas</th>
                <th className="px-6 py-4 font-medium">Email / Kontak</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                    Belum ada akun Admin Puskesmas yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredData.map((admin, idx) => (
                  <tr key={idx} className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                          <Shield className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-[14px] text-foreground">{admin.nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-foreground text-[14px]">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {admin.nama_kecamatan}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[14px]">
                        <Mail className="w-4 h-4" />
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      
                      {/* DROPDOWN AKSI */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleView(admin)}>
                            <Eye className="w-4 h-4 mr-2" /> Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(admin)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit Nama
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(admin)}
                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Hapus Akun
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- MODAL (DIALOG) LIHAT DETAIL --- */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Admin Puskesmas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <span className="text-muted-foreground font-medium">Nama</span>
              <span className="col-span-2 font-medium">{selectedAdmin?.nama}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <span className="text-muted-foreground font-medium">Email</span>
              <span className="col-span-2">{selectedAdmin?.email}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 pb-1">
              <span className="text-muted-foreground font-medium">Wilayah</span>
              <span className="col-span-2 text-primary font-semibold">{selectedAdmin?.nama_kecamatan}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL (DIALOG) EDIT NAMA --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin Puskesmas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email (Tidak dapat diubah)</Label>
              <Input value={selectedAdmin?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Nama Admin</Label>
              <Input 
                value={editNama} 
                onChange={(e) => setEditNama(e.target.value)} 
                placeholder="Masukkan nama lengkap" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
            <Button onClick={saveEdit} disabled={isSaving || !editNama}>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}