import api from "./api"

// Definisikan tipe untuk data wilayah yang akan digunakan di frontend
export interface Wilayah {
  id: string
  name: string
}

// Tipe spesifik untuk item yang diterima dari API backend
interface ApiWilayahItem {
  id: number
  nama: string
}

// Fungsi untuk mengambil daftar provinsi
export const getProvinces = async (): Promise<Wilayah[]> => {
  try {
    const response = await api.get("/provinsi")
    // Backend mengirim { data: [{ id: number, nama: string }] }
    // Kita ubah agar sesuai dengan tipe Wilayah di frontend
    return response.data.data.map((item: ApiWilayahItem) => ({
      id: String(item.id),
      name: item.nama,
    }))
  } catch (error) {
    console.error("Gagal mengambil data provinsi:", error)
    throw error
  }
}

// Fungsi untuk mengambil daftar kabupaten berdasarkan ID provinsi
export const getRegencies = async (provinceId: string): Promise<Wilayah[]> => {
  try {
    const response = await api.get(`/kabupaten/${provinceId}`)
    return response.data.data.map((item: ApiWilayahItem) => ({
      id: String(item.id),
      name: item.nama,
    }))
  } catch (error) {
    console.error("Gagal mengambil data kabupaten:", error)
    // Kembalikan array kosong jika terjadi error (misal: 404 Not Found)
    return []
  }
}

// Fungsi untuk mengambil daftar kecamatan berdasarkan ID kabupaten
export const getDistricts = async (regencyId: string): Promise<Wilayah[]> => {
  try {
    const response = await api.get(`/kecamatan/${regencyId}`)
    return response.data.data.map((item: ApiWilayahItem) => ({
      id: String(item.id),
      name: item.nama,
    }))
  } catch (error) {
    console.error("Gagal mengambil data kecamatan:", error)
    return []
  }
}