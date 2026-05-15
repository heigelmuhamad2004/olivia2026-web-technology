import api from "./api"
import { getActiveToken } from "./auth.services" // <-- gunakan getActiveToken
import { type FormValues as CreatePatientFormValues } from "../user/screening-data/page"

// Tipe data untuk pasien yang diterima dari API
export interface Patient {
  id: number
  user_id: number
  kecamatan_id: number
  nama: string
  nik: string
  alamat: string
  tanggal_lahir: string
  usia: number
  jenis_kelamin: "Laki-Laki" | "Perempuan"
  no_hp: string
  pekerjaan: string
  nama_kecamatan?: string
  nama_kabupaten?: string
  nama_provinsi?: string
  total_screening?: number
}

// Tipe data untuk memperbarui pasien (cocok dengan form edit)
export interface UpdatePatientData {
  nama: string
  nik: string
  no_hp: string
  alamat: string
  email?: string
  tanggal_lahir?: string
  pekerjaan?: string
}

// Fungsi untuk mengambil daftar pasien (untuk user yang sedang login)
export const getMyPatients = async (): Promise<Patient[]> => {
  try {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")
    const response = await api.get("/pasien", {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    console.error("Gagal mengambil data pasien:", error)
    return []
  }
}

// Fungsi untuk membuat pasien baru
export const createPatient = async (formData: CreatePatientFormValues) => {
  try {
    const token = getActiveToken() // <-- gunakan session aktif
    if (!token) throw new Error("No active session token")

    // Transformasi data agar sesuai backend
    const payload = {
      ...formData,
      tanggal_lahir:
        formData.tanggal_lahir instanceof Date
          ? formData.tanggal_lahir.toISOString().split("T")[0]
          : formData.tanggal_lahir, // jika sudah string
      jenis_kelamin: formData.jenis_kelamin === "L" ? "Laki-Laki" : "Perempuan",
      usia: typeof formData.usia === "string" ? parseInt(formData.usia, 10) : formData.usia,
      kecamatan_id: formData.kecamatan_id ? parseInt(String(formData.kecamatan_id), 10) : null,
    }

    const response = await api.post("/pasien/create", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    return response.data
  } catch (error) {
    console.error("Gagal membuat pasien:", error)
    throw error
  }
}

// Fungsi untuk mengedit data pasien
export const updatePatient = async (
  patientId: number,
  formData: UpdatePatientData
) => {
  try {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")
    const response = await api.put(`/pasien/edit/${patientId}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    console.error(`Gagal memperbarui pasien ID ${patientId}:`, error)
    throw error
  }
}

// Fungsi untuk menghapus pasien
export const deletePatient = async (patientId: number) => {
  try {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")
    await api.delete(`/pasien/delete/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    console.error(`Gagal menghapus pasien ID ${patientId}:`, error)
    throw error
  }
}