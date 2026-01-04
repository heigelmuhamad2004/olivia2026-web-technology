"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Calendar,
  Edit2,
  MapPin,
  Plus,
  Search,
  Trash2,
  User,
  User2,
} from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"

import {
  getMyPatients,
  Patient,
  updatePatient,
  deletePatient,
} from "@/app/services/pasien.services"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Badge } from "@/components/ui/badge"

const formSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  nik: z
    .string()
    .length(16, "NIK harus 16 digit")
    .regex(/^\d+$/, "NIK hanya boleh berisi angka"),
  no_hp: z.string().min(10, "Nomor HP minimal 10 digit"),
  alamat: z.string().min(5, "Alamat minimal 5 karakter"),
  tanggal_lahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD"),
  pekerjaan: z.string().optional(),
  usia: z.string().nonempty("Usia wajib diisi").regex(/^\d+$/, "Usia harus angka"),
  jenis_kelamin: z.enum(["Laki-Laki", "Perempuan"], {
    message: "Jenis kelamin wajib dipilih",
  }),
})

type EditFormValues = z.infer<typeof formSchema>

export default function DataPasienPage() {
  const [patients, setPatients] = React.useState<Patient[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(
    null
  )
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false)
  const [patientToDelete, setPatientToDelete] = React.useState<Patient | null>(null)

  // State untuk pencarian (opsional, tapi bagus untuk UX)
  const [searchQuery, setSearchQuery] = React.useState("")

  const form = useForm<EditFormValues>({
    resolver: zodResolver(formSchema),
  })

  const fetchPatients = async () => {
    setIsLoading(true)
    try {
      const data = await getMyPatients()
      setPatients(data)
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat data pasien")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchPatients()
  }, [])

  const handleEditClick = (patient: Patient) => {
    setSelectedPatient(patient)
    form.reset({
      nama: patient.nama,
      nik: patient.nik,
      no_hp: patient.no_hp || "",
      alamat: patient.alamat,
      tanggal_lahir: patient.tanggal_lahir,
      pekerjaan: patient.pekerjaan || "",
      usia: patient.usia.toString(),
      jenis_kelamin: patient.jenis_kelamin,
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient)
    setIsDeleteAlertOpen(true)
  }

  const confirmDelete = async () => {
    if (!patientToDelete) return

    try {
      await deletePatient(patientToDelete.id)
      toast.success(`Data pasien ${patientToDelete.nama} berhasil dihapus`)
      setPatientToDelete(null)
      setIsDeleteAlertOpen(false)
      fetchPatients()
    } catch (error) {
      console.error(error)
      toast.error("Gagal menghapus data pasien")
    }
  }

  async function onEditSubmit(values: EditFormValues) {
    if (!selectedPatient) return

    try {
      const payload = {
        ...values,
        usia: parseInt(values.usia, 10),
      }

      await updatePatient(selectedPatient.id, payload)
      toast.success(`Data ${values.nama} berhasil diperbarui!`)
      setIsEditModalOpen(false)
      setSelectedPatient(null)
      fetchPatients()
    } catch (error) {
      toast.error("Gagal memperbarui data pasien")
    }
  }

  // Filter pasien berdasarkan pencarian
  const filteredPatients = patients.filter(patient =>
    patient.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.nik.includes(searchQuery)
  )

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Pasien</h1>
          <p className="text-muted-foreground mt-1">
            Kelola data pasien Anda di sini.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/user/screening-data">
            <Plus className="h-4 w-4" /> Tambah Pasien
          </Link>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm max-w-md w-full">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari nama atau NIK..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Skeleton Loading could go here */}
          <p className="col-span-full text-center text-muted-foreground">Memuat data...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
          <User2 className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">Belum ada data pasien</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            {searchQuery ? "Tidak ditemukan pasien dengan nama/NIK tersebut." : "Mulai dengan menambahkan data pasien baru untuk melakukan skrining."}
          </p>
          {!searchQuery && (
            <Button asChild variant="outline">
              <Link href="/user/screening-data">Tambah Pasien Sekarang</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader className="relative p-5 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {patient.jenis_kelamin === "Laki-Laki" ? (
                      <User className="h-6 w-6" />
                    ) : (
                      <User className="h-6 w-6" /> // Bisa pakai icon lain kalau ada untuk perempuan
                    )}
                  </div>
                  <Badge variant={patient.jenis_kelamin === "Laki-Laki" ? "default" : "secondary"}>
                    {patient.jenis_kelamin === "Laki-Laki" ? "L" : "P"}
                  </Badge>
                </div>
                <h3 className="mt-4 font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                  {patient.nama}
                </h3>
                <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded w-fit mt-1">
                  {patient.nik}
                </p>
              </CardHeader>
              <CardContent className="p-5 pt-2 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <User2 className="h-4 w-4 shrink-0" />
                  <span>{patient.usia} Tahun</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>{patient.tanggal_lahir}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{patient.alamat}</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 hover:bg-secondary"
                  onClick={() => handleEditClick(patient)}
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 gap-2 hover:bg-red-600"
                  onClick={() => handleDeleteClick(patient)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Edit */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Data Pasien</DialogTitle>
            <DialogDescription>
              Perbarui informasi untuk pasien{" "}
              <span className="font-semibold text-foreground">{selectedPatient?.nama}</span>.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onEditSubmit)}
              className="grid max-h-[70vh] gap-4 overflow-y-auto px-1 py-4"
            >
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK</FormLabel>
                    <FormControl>
                      <Input placeholder="16 digit NIK" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="usia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usia</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Tahun" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jenis_kelamin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Kelamin</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Laki-Laki">Laki-Laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="tanggal_lahir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Lahir</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="no_hp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. HP</FormLabel>
                    <FormControl>
                      <Input placeholder="08..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alamat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat</FormLabel>
                    <FormControl>
                      <Input placeholder="Alamat lengkap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pekerjaan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pekerjaan</FormLabel>
                    <FormControl>
                      <Input placeholder="Pekerjaan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                <Button type="submit">Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Alert Delete Confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data pasien{" "}
              <span className="font-semibold text-foreground">{patientToDelete?.nama}</span>{" "}
              akan dihapus secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}