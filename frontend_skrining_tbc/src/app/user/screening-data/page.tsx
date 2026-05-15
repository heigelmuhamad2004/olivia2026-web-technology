"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDownIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Impor service pasien yang baru
import { createPatient } from "@/app/services/pasien.services"
import {
  getDistricts,
  getProvinces,
  getRegencies,
  Wilayah,
} from "@/app/services/wilayah.services"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const GENDERS = ["L", "P"] as const

// Perbaikan: Sintaks Zod yang benar untuk pesan error
const formSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 huruf"),
  alamat: z.string().min(5, "Alamat terlalu pendek"),
  provinsi_id: z.string().nonempty("Provinsi wajib dipilih"),
  kabupaten_id: z.string().nonempty("Kabupaten wajib dipilih"),
  kecamatan_id: z.string().nonempty("Kecamatan wajib dipilih"),
  nik: z
    .string()
    .length(16, "NIK harus 16 digit")
    .regex(/^[0-9]+$/, "NIK hanya boleh angka"),
  pekerjaan: z.string().optional(),
  tanggal_lahir: z.date({
    message: "Tanggal lahir wajib diisi.",
  }),
  jenis_kelamin: z.enum(GENDERS, {
    message: "Jenis kelamin wajib dipilih.",
  }),
  usia: z
    .string()
    .nonempty("Usia wajib diisi")
    .regex(/^[0-9]{1,3}$/, "Usia harus angka"),
  no_hp: z.string().regex(/^08[0-9]{8,11}$/, "Nomor HP tidak valid"),
  email: z.string().email("Email tidak valid").optional(),
})

export type FormValues = z.infer<typeof formSchema>

export default function Page() {
  const router = useRouter()
  const [provinces, setProvinces] = React.useState<Wilayah[]>([])
  const [regencies, setRegencies] = React.useState<Wilayah[]>([])
  const [districts, setDistricts] = React.useState<Wilayah[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      alamat: "",
      nik: "",
      pekerjaan: "",
      usia: "",
      no_hp: "",
      email: "",
    },
  })

  const selectedProvinceId = form.watch("provinsi_id")
  const selectedRegencyId = form.watch("kabupaten_id")

  React.useEffect(() => {
    const loadProvinces = async () => {
      const provinceData = await getProvinces()
      setProvinces(provinceData)
    }
    loadProvinces()
  }, [])

  React.useEffect(() => {
    const loadRegencies = async () => {
      if (selectedProvinceId) {
        const regencyData = await getRegencies(selectedProvinceId)
        setRegencies(regencyData)
        form.setValue("kabupaten_id", "")
        form.setValue("kecamatan_id", "")
      }
    }
    loadRegencies()
  }, [selectedProvinceId, form])

  React.useEffect(() => {
    const loadDistricts = async () => {
      if (selectedRegencyId) {
        const districtData = await getDistricts(selectedRegencyId)
        setDistricts(districtData)
        form.setValue("kecamatan_id", "")
      }
    }
    loadDistricts()
  }, [selectedRegencyId, form])

  async function onSubmit(values: FormValues) {
    try {
      const response = await createPatient(values)
      alert("Pasien baru berhasil ditambahkan!")
      router.push(`/user/screening-kesehatan?pasienId=${response.data.id}`)
    } catch (error) {
      alert("Gagal menambahkan pasien. Silakan coba lagi.")
      console.error(error)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8 text-center">Tambah Data Pasien</h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
        >
          {/* Perbaikan: Mengembalikan JSX form yang hilang */}
          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan nama pasien" {...field} />
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
                  <Input
                    type="text"
                    maxLength={16}
                    placeholder="16 digit NIK"
                    {...field}
                  />
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
                  <Textarea
                    placeholder="Masukkan alamat lengkap"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="provinsi_id"
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
                    {provinces.map((province) => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
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
                      <SelectValue placeholder="Pilih kabupaten/kota" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {regencies.map((regency) => (
                      <SelectItem key={regency.id} value={regency.id}>
                        {regency.name}
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
            name="kecamatan_id"
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
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
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
            name="pekerjaan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pekerjaan (Opsional)</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan pekerjaan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tanggal_lahir"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal Lahir</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal"
                    >
                      {field.value ? (
                        field.value.toLocaleDateString("id-ID")
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                      <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      captionLayout="dropdown"
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
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
                <FormControl>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value === "L"}
                        onCheckedChange={() => field.onChange("L")}
                      />
                      <span>Laki-Laki</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value === "P"}
                        onCheckedChange={() => field.onChange("P")}
                      />
                      <span>Perempuan</span>
                    </label>
                  </div>
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
                <FormLabel>Nomor HP</FormLabel>
                <FormControl>
                  <Input placeholder="08xxxxxxxxxx" {...field} />
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
                <FormLabel>Email (Opsional)</FormLabel>
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
          <div className="md:col-span-2 flex justify-end gap-4">
            <Button asChild type="button" variant="outline">
              <Link href="/user/data-pasien">Kembali</Link>
            </Button>
            <Button type="submit">Tambah & Lanjutkan Skrining</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}