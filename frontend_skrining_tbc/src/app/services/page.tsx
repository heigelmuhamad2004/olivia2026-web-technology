"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { getProvinces, getRegencies, Wilayah } from "@/app/services/wilayah.services"
import { createAdminDinkes } from "@/app/services/admin.services" // Asumsi service baru

// Skema validasi untuk form Admin Dinkes
const formSchema = z.object({
  nama: z.string().min(3, {
    message: "Nama harus memiliki setidaknya 3 karakter.",
  }),
  email: z.string().email({
    message: "Format email tidak valid.",
  }),
  password: z.string().min(8, {
    message: "Password harus memiliki setidaknya 8 karakter.",
  }),
  provinsiId: z.string().min(1, { message: "Silakan pilih provinsi." }),
  kabupaten_id: z.string().min(1, { message: "Silakan pilih kabupaten/kota." }), // Disesuaikan dengan payload backend
})

export default function TambahAdminDinkesPage() {
  const router = useRouter()
  const [provinces, setProvinces] = React.useState<Wilayah[]>([])
  const [regencies, setRegencies] = React.useState<Wilayah[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      email: "",
      password: "",
      provinsiId: "",
      kabupaten_id: "",
    },
  })

  const selectedProvinceId = form.watch("provinsiId")

  // 1. Ambil data provinsi saat komponen dimuat
  React.useEffect(() => {
    const loadProvinces = async () => {
      try {
        const provinceData = await getProvinces()
        setProvinces(provinceData)
      } catch (error) {
        console.error("Gagal memuat provinsi:", error)
      }
    }
    loadProvinces()
  }, [])

  // 2. Ambil data kabupaten saat provinsi dipilih
  React.useEffect(() => {
    const loadRegencies = async () => {
      if (selectedProvinceId) {
        const regencyData = await getRegencies(selectedProvinceId)
        setRegencies(regencyData)
        form.setValue("kabupaten_id", "") // Reset pilihan kabupaten
      } else {
        setRegencies([])
      }
    }
    loadRegencies()
  }, [selectedProvinceId, form])

  // Fungsi untuk mengirim data ke API
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Hapus provinsiId karena tidak dibutuhkan oleh backend
      const payload = {
        nama: values.nama,
        email: values.email,
        password: values.password,
        kabupaten_id: values.kabupaten_id,
      }
      
      await createAdminDinkes(payload)
      alert("Admin Dinkes baru berhasil ditambahkan!")
      form.reset()
      // Arahkan kembali ke halaman daftar admin (misalnya)
      router.push("/dashboard-super-admin/data-admin")
    } catch (error) {
      console.error("Gagal mengirim data:", error)
      alert("Gagal menambahkan admin. Pastikan email belum terdaftar.")
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Tambah Admin Dinas Kesehatan (Dinkes)</CardTitle>
          <CardDescription>
            Isi formulir untuk menambahkan akun admin level kabupaten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Dr. Siti Aminah" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="dinkes.kabupaten@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Minimal 8 karakter"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provinsiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provinsi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih provinsi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provinces.map((prov) => (
                          <SelectItem key={prov.id} value={prov.id}>
                            {prov.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kabupaten_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kabupaten/Kota</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedProvinceId || regencies.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kabupaten/kota penugasan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regencies.map((kab) => (
                          <SelectItem key={kab.id} value={kab.id}>
                            {kab.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardFooter className="flex justify-end p-0 pt-6">
                <Button type="submit">Tambah Admin Dinkes</Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}