import api from "./api"
import { getActiveToken } from "./auth.services"
import type { FormValues } from "@/app/user/screening-kesehatan/page"

export const createSkrining = async (formData: FormValues, pasienId: string) => {
  const token = getActiveToken()
  if (!token) {
    throw new Error("Tidak ada token otorisasi. Silakan login kembali.")
  }

  // normalisasi payload jika perlu (mis. ubah semua enum/checkbox ke string)
  const payload = {
    ...formData,
    pasien_id: pasienId,
  }

  const res = await api.post("/skrining/create", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
  return res.data
}

export const getSkrining = async () => {
  const token = getActiveToken()
  if (!token) throw new Error("No active session token")
  const res = await api.get("/skrining", {
    headers: { Authorization: `Bearer ${token}` },
  })
  // backend mengembalikan { data: [...] } atau langsung [...]
  return (res.data && (res.data.data ?? res.data)) || []
}

export const getSkriningStatistik = async () => {
  const token = getActiveToken()
  if (!token) throw new Error("No active session token")

  const res = await api.get("/skrining/statistik", {
    headers: { Authorization: `Bearer ${token}` },
  })

  return res.data.data
}

export interface SkriningRiwayat {
  id: number
  nama: string
  nik: string
  no_hp: string
  alamat: string
  hasil_screening: string
  tanggal_screening: string
  total_screening: number
  email: string | null
  tanggal_lahir: string | null
  usia: string | null
  pekerjaan: string
  kelamin: string | null
  berat_badan: string
  tinggi_badan: string
  riwayat_kontak_tbc: string
  pernah_terdiagnosa: string
  pernah_berobat_tbc: string
  pernah_berobat_tb_tapi_tidak_tuntas: string | null
  malnutrisi: string
  merokok_perokok_pasif: string
  riwayat_dm_kencing_manis: string
  lansia: string
  ibu_hamil: string
  batuk: string
  bb_turun_tanpa_sebab_nafsu_makan_turun: string
  demam_tidak_diketahui_penyebabnya: string
  badan_lemas: string
  berkeringat_malam_tanpa_kegiatan: string
  sesak_napas_tanpa_nyeri_dada: string
  ada_pembesaran_getah_bening_dileher: string
  skor_suara_ai?: number | null
  metode_skrining?: string
  gradcam_image?: string | null
}

export const getRiwayatSkriningByPasien = async (
  pasienId: string
): Promise<SkriningRiwayat[]> => {
  const token = getActiveToken()
  if (!token) throw new Error("No active session token")

  const res = await api.get(`/skrining/pasien/${pasienId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return res.data.data as SkriningRiwayat[]
}

export const getSkriningDetail = async (id: number | string): Promise<SkriningRiwayat> => {
  const token = getActiveToken()
  if (!token) throw new Error("Unauthorized")

  const res = await api.get(`/skrining/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data.data as SkriningRiwayat
}
