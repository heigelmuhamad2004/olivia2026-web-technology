"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { IconCalendar } from "@tabler/icons-react"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Skema validasi diperbarui untuk menerima tipe Date
const formSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  nik: z
    .string()
    .length(16, "NIK harus 16 digit")
    .regex(/^\d+$/, "NIK hanya boleh berisi angka"),
  no_hp: z.string().min(10, "Nomor HP minimal 10 digit"),
  alamat: z.string().min(5, "Alamat minimal 5 karakter"),
  email: z.string().email("Format email tidak valid").optional(),
  tanggal_lahir: z.date().optional(),
  pekerjaan: z.string().optional(),
  kelamin: z.string().optional(),
  berat_badan: z.string().optional(),
  tinggi_badan: z.string().optional(),
})

interface AddPatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPatientModal({ open, onOpenChange }: AddPatientModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      nik: "",
      no_hp: "",
      alamat: "",
      email: "",
      // tanggal_lahir default di-set undefined
      pekerjaan: "",
      kelamin: "",
      berat_badan: "",
      tinggi_badan: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // TODO: Implementasikan logika untuk mengirim data baru ke backend/API
    console.log("Data Pasien Baru:", values)
    alert(`Pasien baru ${values.nama} berhasil ditambahkan! (Cek console)`)
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Pasien Baru</DialogTitle>
          <DialogDescription>
            Isi formulir di bawah ini untuk mendaftarkan pasien baru.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid max-h-[70vh] gap-4 overflow-y-auto px-1 py-4"
          >
            {/* ... Form fields lainnya ... */}
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama Lengkap Pasien" {...field} />
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pemilih Tanggal */}
            <FormField
              control={form.control}
              name="tanggal_lahir"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Lahir</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Tambah Pasien</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}