"use client"

import { useState } from "react"
import { Key } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { User, updateUser } from "@/app/services/user-services"
import { Patient, updatePatient } from "@/app/services/pasien.services"

interface ProfileContentProps {
  user: User
  patient: Patient | null
}

export default function ProfileContent({
  user: initialUser,
  patient: initialPatient,
}: ProfileContentProps) {
  const [user, setUser] = useState<User>(initialUser)
  const [patient, setPatient] = useState<Patient | null>(initialPatient)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    nama: user.nama,
    email: user.email,
    no_hp: patient?.no_hp || "",
    alamat: patient?.alamat || "",
  })

  // State untuk form ganti password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.id]: e.target.value })
  }

  const handleSavePersonal = async () => {
    setLoading(true)
    try {
      // 1. Update User Data
      const updatedUser = await updateUser(user.id, {
        nama: formData.nama,
        email: formData.email,
        role: user.role,
      })
      setUser(updatedUser)

      // 2. Update Patient Data (jika ada data pasien)
      if (patient) {
        await updatePatient(patient.id, {
          nama: formData.nama, // Sinkronisasi nama
          nik: patient.nik, // NIK wajib
          no_hp: formData.no_hp,
          alamat: formData.alamat,
          // Field optional lain jika perlu
        })
        setPatient(prev =>
          prev ? { ...prev, nama: formData.nama, no_hp: formData.no_hp, alamat: formData.alamat } : null
        )
      }

      toast.success("Profil berhasil diperbarui")

    } catch (error) {
      console.error("Gagal update profil:", error)
      toast.error("Gagal memperbarui profil")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak cocok")
      return
    }

    // TODO: Implementasi endpoint ganti password
    toast.info("Fitur ganti password belum tersedia di server.")
  }

  return (
    <Tabs defaultValue="personal" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="personal">Informasi Pribadi</TabsTrigger>
        <TabsTrigger value="security">Keamanan</TabsTrigger>
        <TabsTrigger value="account">Akun</TabsTrigger>
      </TabsList>

      {/* Informasi Pribadi */}
      <TabsContent value="personal">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
            <CardDescription>
              Perbarui data pribadi Anda. Data ini membantu kami memberikan
              layanan yang lebih baik.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="no_hp">Nomor HP</Label>
              <Input
                id="no_hp"
                value={formData.no_hp}
                onChange={handleInputChange}
                disabled={!patient} // Disable jika tidak ada data pasien
                placeholder={!patient ? "Lengkapi data pasien di klinik" : ""}
              />
              {!patient && (
                <p className="text-xs text-muted-foreground">
                  Data kontak terhubung dengan data pasien. Silakan hubungi admin untuk melengkapi data pasien.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                disabled={!patient}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSavePersonal} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* Pengaturan Keamanan */}
      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Keamanan</CardTitle>
            <CardDescription>
              Ubah kata sandi Anda secara berkala untuk menjaga keamanan akun.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Saat Ini</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleUpdatePassword}>
              <Key className="mr-2 h-4 w-4" />
              Ubah Password
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* Pengaturan Akun */}
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Akun</CardTitle>
            <CardDescription>
              Informasi mengenai akun Anda dan tindakan lainnya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Akun Dibuat Pada</Label>
                <p className="text-sm text-muted-foreground">
                  {user.created_at
                    ? format(new Date(user.created_at), "d MMMM yyyy", {
                      locale: localeId,
                    })
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zona Berbahaya - Disembunyikan dulu atau disabled untuk keamanan */}
        {/* <Card className="mt-6 border-destructive/50"> ... </Card> */}
      </TabsContent>
    </Tabs>
  )
}