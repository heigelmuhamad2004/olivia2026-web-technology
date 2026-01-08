"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Suspense } from "react"

import api from "@/app/services/api"
import { getActiveToken } from "@/app/services/auth.services"
import { createSkrining } from "@/app/services/skrining.services" // Perbaikan: path impor disesuaikan
import { Button } from "@/components/ui/button"
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
import { Separator } from "@/components/ui/separator"

// Perbaikan: Skema disesuaikan dengan sintaks Zod yang benar
const formSchema = z.object({
  berat_badan: z.string().nonempty("Berat badan wajib diisi"),
  tinggi_badan: z.string().nonempty("Tinggi badan wajib diisi"),
  riwayat_kontak_tbc: z.enum(["TBC", "TBC RO", "Tidak"], {
    message: "Pilih salah satu riwayat kontak",
  }),
  pernah_terdiagnosis_tbc: z.enum(["TBC", "TBC RO", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  pernah_berobat_tbc: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  nama_obat_tbc: z.string().optional(),
  pernah_berobat_tbc_namun_tidak_tuntas: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  malnutrisi: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  merokok_atau_perokok_pasif: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  riwayat_diabetes_melitus_atau_kencing_manis: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  lansia_lebih_dari_60_tahun: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  ibu_hamil: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  batuk: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun: z.enum(
    ["Ya", "Tidak"],
    {
      message: "Pilihan ini wajib diisi",
    }
  ),
  demam_yang_tidak_diketahui_penyebabnya: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  badan_lemas: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  berkesingat_malam_hari_tanpa_kegiatan: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  sesak_napas_tanpa_nyeri_dada: z.enum(["Ya", "Tidak"], {
    message: "Pilihan ini wajib diisi",
  }),
  ada_pembengkakan_kelenjar_getah_bening_pada_leher_atau_ketiak: z.enum(
    ["Ya", "Tidak"],
    {
      message: "Pilihan ini wajib diisi",
    }
  ),
})

export type FormValues = z.infer<typeof formSchema>

function ScreeningFormContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [patientName, setPatientName] = React.useState<string | null>(null)
  const [pasienId, setPasienId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const id = searchParams.get("pasienId")
    setPasienId(id)
    if (id) {
      ; (async () => {
        try {
          // Coba ambil detail pasien langsung jika endpoint tersedia
          const token = getActiveToken()
          if (!token) return
          // Prefer endpoint /pasien/<id>
          try {
            const res = await api.get(`/pasien/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            const p = res.data?.data ?? res.data
            if (p) setPatientName(p.nama ?? null)
            return
          } catch {
            // fallback: ambil semua pasien lalu cari yang cocok
            const resAll = await api.get("/pasien", {
              headers: { Authorization: `Bearer ${token}` },
            })
            interface Patient {
              id: number | string
              nama?: string
              // tambahkan properti lain jika diperlukan
            }
            const list: Patient[] = (resAll.data && (resAll.data.data ?? resAll.data)) || []
            const selected = list.find((p: Patient) => Number(p.id) === Number(id))
            if (selected) setPatientName(selected.nama ?? null)
          }
        } catch (e) {
          console.error("Gagal mengambil data pasien:", e)
        }
      })()
    }
  }, [searchParams])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      berat_badan: "",
      tinggi_badan: "",
      riwayat_kontak_tbc: "Tidak",
      pernah_terdiagnosis_tbc: "Tidak",
      pernah_berobat_tbc: "Tidak",
      nama_obat_tbc: "",
      pernah_berobat_tbc_namun_tidak_tuntas: "Tidak",
      malnutrisi: "Tidak",
      merokok_atau_perokok_pasif: "Tidak",
      riwayat_diabetes_melitus_atau_kencing_manis: "Tidak",
      lansia_lebih_dari_60_tahun: "Tidak",
      ibu_hamil: "Tidak",
      batuk: "Tidak",
      bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun: "Tidak",
      demam_yang_tidak_diketahui_penyebabnya: "Tidak",
      badan_lemas: "Tidak",
      berkesingat_malam_hari_tanpa_kegiatan: "Tidak",
      sesak_napas_tanpa_nyeri_dada: "Tidak",
      ada_pembengkakan_kelenjar_getah_bening_pada_leher_atau_ketiak: "Tidak",
    },
  })

  async function onSubmit(values: FormValues) {
    if (!pasienId) {
      alert("ID Pasien tidak ditemukan. Proses tidak dapat dilanjutkan.")
      return
    }

    // CEK TOKEN AKTIF SEBELUM MELANJUTKAN
    const token = getActiveToken()
    if (!token) {
      alert("Sesi Anda telah habis. Silakan login kembali.")
      router.push("/auth/login")
      return
    }

    try {
      // createSkrining seharusnya memakai token aktif di service; tetap panggil.
      const result = await createSkrining(values, pasienId)
      console.log("Skrining berhasil dibuat:", result)
      alert("Data skrining berhasil disimpan!")
      router.push(`/user/hasil-screening?pasienId=${pasienId}`)
    } catch (error) {
      console.error("Terjadi kesalahan saat menyimpan data:", error)
      alert("Terjadi kesalahan saat menyimpan data. Silakan coba lagi.")
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-center">Formulir Skrining</h1>
      {patientName && (
        <p className="text-center text-muted-foreground mt-2 mb-11">
          Screening kesehatan dilakukan oleh{" "}
          <span className="font-bold text-foreground">{patientName}</span>
        </p>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <h2 className="text-lg font-bold">
            Pemeriksaan Tinggi Badan dan Berat Badan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="berat_badan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Berat Badan</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="kg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tinggi_badan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tinggi Badan</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="cm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Separator />

          <h2 className="text-lg font-bold">Pemeriksaan Kontak</h2>
          <FormField
            control={form.control}
            name="riwayat_kontak_tbc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Riwayat Kontak TBC</FormLabel>
                <div className="flex flex-wrap gap-6">
                  {["TBC", "TBC RO", "Tidak"].map((val) => (
                    <label key={val} className="flex items-center gap-2">
                      <Checkbox
                        checked={field.value === val}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? val : undefined)
                        }
                      />
                      <span>{val}</span>
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />

          <h2 className="text-lg font-bold">Pemeriksaan Faktor Risiko</h2>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="pernah_terdiagnosis_tbc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pernah terdiagnosa TBC?</FormLabel>
                  <div className="flex flex-wrap gap-6">
                    {["TBC", "TBC RO", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pernah_berobat_tbc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pernah Berobat TBC?</FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nama_obat_tbc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jika ya, nama obat</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama obat TBC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pernah_berobat_tbc_namun_tidak_tuntas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pernah berobat TBC tapi tidak tuntas?</FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="malnutrisi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Malnutrisi</FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="merokok_atau_perokok_pasif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merokok atau Perokok Pasif</FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="riwayat_diabetes_melitus_atau_kencing_manis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Riwayat Diabetes Melitus atau Kencing Manis
                  </FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lansia_lebih_dari_60_tahun"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lansia (Lebih dari 60 Tahun)</FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ibu_hamil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ibu hamil?</FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Separator />

          <h2 className="text-lg font-bold">Skrining Gejala Utama</h2>
          <FormField
            control={form.control}
            name="batuk"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Batuk (semua bentuk batuk tanpa melihat durasi)
                </FormLabel>
                <div className="flex gap-6">
                  {["Ya", "Tidak"].map((val) => (
                    <label key={val} className="flex items-center gap-2">
                      <Checkbox
                        checked={field.value === val}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? val : undefined)
                        }
                      />
                      <span>{val}</span>
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />

          <h2 className="text-lg font-bold">Skrining Gejala Tambahan</h2>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    BB turun tanpa penyebab jelas/BB tidak naik/nafsu makan turun
                  </FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="demam_yang_tidak_diketahui_penyebabnya"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Demam yang tidak diketahui penyebabnya</FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="badan_lemas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badan lemas/lesu</FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="berkesingat_malam_hari_tanpa_kegiatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Berkeringat malam hari tanpa kegiatan</FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sesak_napas_tanpa_nyeri_dada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sesak napas tanpa nyeri dada</FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ada_pembengkakan_kelenjar_getah_bening_pada_leher_atau_ketiak"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Ada pembengkakan kelenjar getah bening di leher/ketiak
                  </FormLabel>
                  <div className="flex gap-6">
                    {["Ya", "Tidak"].map((val) => (
                      <label key={val} className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === val}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? val : undefined)
                          }
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Separator />
          <div className="flex justify-end gap-4">
            <Button asChild type="button" variant="outline">
              <Link href="/user">Kembali</Link>
            </Button>
            <Button type="submit">Selanjutnya</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default function ScreeningForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScreeningFormContent />
    </Suspense>
  )
}
