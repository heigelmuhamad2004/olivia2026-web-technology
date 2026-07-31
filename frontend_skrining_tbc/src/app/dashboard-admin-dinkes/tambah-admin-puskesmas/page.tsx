"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation" // Impor useRouter

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
  FormDescription,
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
// Impor service admin yang baru
import { createAdminPuskesmas } from "@/app/services/admin-puskesmas.services"
import {
  getDistricts,
  getProvinces,
  getRegencies,
  Wilayah,
} from "@/app/services/wilayah.services"

// Skema validasi untuk form (tidak berubah)
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
  kabupatenId: z.string().min(1, { message: "Silakan pilih kabupaten/kota." }),
  kecamatanId: z.string().min(1, { message: "Silakan pilih kecamatan." }),
})

export default function TambahAdminPuskesmasPage() {
  const router = useRouter() // Inisialisasi router
  // State untuk menyimpan data dari API
  const [provinces, setProvinces] = React.useState<Wilayah[]>([])
  const [regencies, setRegencies] = React.useState<Wilayah[]>([])
  const [districts, setDistricts] = React.useState<Wilayah[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      email: "",
      password: "",
      provinsiId: "",
      kabupatenId: "",
      kecamatanId: "",
    },
  })

  // ... (useEffect untuk wilayah tidak berubah) ...
  // Ambil ID yang dipilih dari form untuk memicu useEffect
  const selectedProvinceId = form.watch("provinsiId")
  const selectedRegencyId = form.watch("kabupatenId")

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
        // Reset pilihan kabupaten & kecamatan
        form.setValue("kabupatenId", "")
        form.setValue("kecamatanId", "")
      } else {
        setRegencies([])
        setDistricts([])
      }
    }
    loadRegencies()
  }, [selectedProvinceId, form])

  // 3. Ambil data kecamatan saat kabupaten dipilih
  React.useEffect(() => {
    const loadDistricts = async () => {
      if (selectedRegencyId) {
        const districtData = await getDistricts(selectedRegencyId)
        setDistricts(districtData)
        // Reset pilihan kecamatan
        form.setValue("kecamatanId", "")
      } else {
        setDistricts([])
      }
    }
    loadDistricts()
  }, [selectedRegencyId, form])


  // Perbarui fungsi onSubmit untuk memanggil API
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await createAdminPuskesmas(values)
      console.log("Admin berhasil dibuat:", result)
      alert("Admin baru berhasil ditambahkan!")
      form.reset() // Mengosongkan form setelah submit
      // Arahkan kembali ke halaman daftar admin (sesuaikan path jika perlu)
      router.push("/dashboard-super-admin/data-admin-puskesmas")
    } catch (error) {
      console.error("Gagal mengirim data:", error)
      alert("Gagal menambahkan admin. Silakan coba lagi.")
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Tambah Admin Puskesmas Baru</CardTitle>
          <CardDescription>
            Isi formulir di bawah ini untuk menambahkan akun admin puskesmas baru
            ke sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* ... (semua FormField tidak berubah) ... */}
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Budi Santoso" {...field} />
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
                        placeholder="contoh@email.com"
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                name="kabupatenId"
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
                          <SelectValue placeholder="Pilih kabupaten/kota" />
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
              <FormField
                control={form.control}
                name="kecamatanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kecamatan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedRegencyId || districts.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kecamatan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((kec) => (
                          <SelectItem key={kec.id} value={kec.id}>
                            {kec.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Pilih wilayah tempat admin ini akan bertugas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardFooter className="flex justify-end p-0 pt-6">
                <Button type="submit">Tambah Admin</Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}