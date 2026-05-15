// import api from "./api" <-- Hapus atau biarkan jika path benar
import api from "./api"
// IMPORT helper token dari auth services
import { getActiveToken } from "./auth.services" 

export interface CreateAdminData {
  nama: string
  email: string
  password: string
  kecamatanId: string
}

export const createAdminPuskesmas = async (data: CreateAdminData) => {
  try {
    // [PERBAIKAN] Gunakan helper getActiveToken(), BUKAN localStorage manual
    const token = getActiveToken() 
    
    if (!token) {
      throw new Error("Tidak ada token otorisasi. Silakan login kembali.")
    }

    const payload = {
      nama: data.nama,
      email: data.email,
      password: data.password,
      kecamatan_id: data.kecamatanId,
      role: "admin_puskesmas",
    }

    const response = await api.post("/auth/register", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data
  } catch (error) {
    console.error("Gagal membuat admin puskesmas:", error)
    throw error
  }
}