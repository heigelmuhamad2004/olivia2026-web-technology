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
  User2,
} from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion, Variants } from "framer-motion"
import { customToast } from "@/components/ui/alert-1"

import {
  getMyPatients,
  Patient,
  updatePatient,
  deletePatient,
} from "@/app/services/pasien.services"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

// --- Variabel Animasi ---
const FADE_IN_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
}

const STAGGER_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

// Fungsi untuk menampilkan 6 digit awal, 6 bintang, dan 4 digit akhir
const maskNIK = (nik: string) => {
  if (!nik || nik.length < 16) return nik; // Jaga-jaga jika formatnya salah
  return nik.substring(0, 6) + "******" + nik.substring(12);
};

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
      customToast.error("Gagal memuat data pasien")
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
      customToast.success(`Data pasien ${patientToDelete.nama} berhasil dihapus`)
      setPatientToDelete(null)
      setIsDeleteAlertOpen(false)
      fetchPatients()
    } catch (error: any) {
      // Tutup modal agar tidak menutupi notifikasi toast
      setIsDeleteAlertOpen(false)
      setPatientToDelete(null)
      // Menangkap pesan spesifik dari backend ("Pasien yang sudah melakukan...")
      const errorMessage = error.response?.data?.message || "Gagal menghapus data pasien."
      customToast.error(errorMessage)
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
      customToast.success(`Data ${values.nama} berhasil diperbarui!`)
      setIsEditModalOpen(false)
      setSelectedPatient(null)
      fetchPatients()
    } catch (error) {
      console.error(error)
      customToast.error("Gagal memperbarui data pasien")
    }
  }

  // Filter pasien berdasarkan pencarian
  const filteredPatients = patients.filter(patient =>
    patient.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.nik.includes(searchQuery)
  )

  // Helper untuk mendapatkan inisial nama
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Data pasien.</h1>
          <p className="text-muted-foreground mt-1">
            Kelola data pasien Anda di sini.
          </p>
        </div>
        <Button asChild className="gap-2 rounded-full px-5 h-10 shadow-sm">
          <Link href="/user/screening-data">
            <Plus className="h-4 w-4" /> Tambah Pasien
          </Link>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-2 rounded-md border bg-card px-3 py-2 shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a] max-w-md w-full">
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
        <motion.div 
          initial="hidden" 
          animate="show" 
          variants={STAGGER_CONTAINER}
          className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]"
        >
          <motion.div 
            variants={FADE_IN_VARIANTS}
            animate={{ y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted"
          >
            <User2 className="h-8 w-8 text-muted-foreground opacity-60" />
          </motion.div>
          <motion.h3 variants={FADE_IN_VARIANTS} className="text-lg font-semibold text-foreground">
            Belum ada data pasien.
          </motion.h3>
          <motion.p variants={FADE_IN_VARIANTS} className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
            {searchQuery 
              ? "Tidak ditemukan pasien dengan nama/NIK tersebut." 
              : "Mulai dengan menambahkan data pasien baru untuk melakukan skrining kesehatan berkala."}
          </motion.p>
          {!searchQuery && (
            <motion.div variants={FADE_IN_VARIANTS}>
              <Button asChild variant="outline" className="rounded-full px-6 shadow-sm">
                <Link href="/user/screening-data">Tambah Pasien Sekarang</Link>
              </Button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden" 
          animate="show" 
          variants={STAGGER_CONTAINER}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredPatients.map((patient) => (
            <motion.div key={patient.id} variants={FADE_IN_VARIANTS}>
            <Card className="group overflow-hidden transition-all hover:shadow-[0px_2px_2px_#0000000a,0px_8px_16px_-4px_#0000000a] hover:border-primary/40 rounded-lg shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a] bg-card">
              <CardHeader className="relative p-5 pb-2">
                <div className="flex items-start justify-between">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarFallback className={patient.jenis_kelamin === "Laki-Laki" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-pink-500/10 text-pink-600 dark:text-pink-400"}>
                      <span className="text-xs font-semibold">{getInitials(patient.nama)}</span>
                    </AvatarFallback>
                  </Avatar>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground rounded-full px-2.5">
                    {patient.jenis_kelamin === "Laki-Laki" ? "L" : "P"}
                  </Badge>
                </div>
                <h3 className="mt-4 font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                  {patient.nama}
                </h3>
                <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded w-fit mt-1">
                  {maskNIK(patient.nik)}
                </p>
              </CardHeader>
              <CardContent className="p-5 pt-2 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <User2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <span>{patient.usia} Tahun</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <span>{patient.tanggal_lahir}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-70" />
                  <span className="line-clamp-2">{patient.alamat}</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 flex gap-2 border-t border-border mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 hover:bg-secondary rounded-md h-8 text-xs"
                  onClick={() => handleEditClick(patient)}
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-md h-8 text-xs"
                  onClick={() => handleDeleteClick(patient)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </Button>
              </CardFooter>
            </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Dialog Edit */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit data pasien.</DialogTitle>
            <DialogDescription>
              Perbarui informasi untuk pasien{" "}
              <span className="font-semibold text-foreground">{selectedPatient?.nama}</span>.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onEditSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 max-h-[70vh] gap-5 overflow-y-auto px-1 py-2"
            >
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>NIK</FormLabel>
                    <FormControl>
                      <Input placeholder="16 digit NIK" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  <FormItem className="md:col-span-2">
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>Pekerjaan</FormLabel>
                    <FormControl>
                      <Input placeholder="Pekerjaan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="md:col-span-2 mt-4">
                <Button type="button" variant="ghost" className="rounded-full px-6" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                <Button type="submit" className="rounded-full px-6 shadow-sm">Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Alert Delete Confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin.</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data pasien{" "}
              <span className="font-semibold text-foreground">{patientToDelete?.nama}</span>{" "}
              akan dihapus secara permanen dari sistem.
              <br /><br />
              <span className="font-medium text-destructive">
                Catatan: Pasien yang sudah memiliki riwayat skrining kesehatan tidak dapat dihapus.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full px-6">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-full px-6 shadow-sm"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}