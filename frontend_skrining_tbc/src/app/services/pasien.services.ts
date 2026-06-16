import api from "./api"
import { getActiveToken } from "./auth.services"
import { type FormValues as CreatePatientFormValues } from "../user/screening-data/page"
import { isAxiosError } from "axios" // 🌟 TAMBAHKAN INI

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

export const createPatient = async (formData: CreatePatientFormValues) => {
  try {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")

    const payload = {
      ...formData,
      tanggal_lahir:
        formData.tanggal_lahir instanceof Date
          ? formData.tanggal_lahir.toISOString().split("T")[0]
          : formData.tanggal_lahir,
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
    // 🌟 PERBAIKAN TANGKAP ERROR FLASK
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Gagal menambahkan pasien");
    }
    throw new Error("Terjadi kesalahan pada sistem");
  }
}

export const updatePatient = async (patientId: number, formData: UpdatePatientData) => {
  try {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")
    const response = await api.put(`/pasien/edit/${patientId}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    // 🌟 PERBAIKAN TANGKAP ERROR FLASK
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Gagal memperbarui pasien");
    }
    throw new Error("Terjadi kesalahan pada sistem");
  }
}

export const deletePatient = async (patientId: number) => {
  try {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")
    const response = await api.delete(`/pasien/delete/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    // 🌟 PERBAIKAN TANGKAP ERROR FLASK
    if (isAxiosError(error) && error.response) {
      // Ini akan membaca pesan "Pasien yang sudah melakukan skrining tidak bisa dihapus..."
      throw new Error(error.response.data.message || "Gagal menghapus pasien");
    }
    throw new Error("Terjadi kesalahan pada sistem");
  }
}