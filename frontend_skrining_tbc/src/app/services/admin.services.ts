import axiosInstance from "@/lib/axios"

interface AdminDinkesPayload {
  nama: string
  email: string
  password: string
  kabupaten_id: string
}

/**
 * Service untuk Super Admin mendaftarkan Admin Dinkes baru.
 * @param payload Data admin dinkes yang akan dibuat.
 * @returns Promise dari respons API.
 */
export const createAdminDinkes = async (payload: AdminDinkesPayload) => {
  try {
    const response = await axiosInstance.post(
      "/superadmin/register-dinkes",
      payload
    )
    return response.data
  } catch (error) {
    console.error("API call error in createAdminDinkes:", error)
    // Melempar kembali error agar bisa ditangkap oleh komponen pemanggil
    throw error
  }
}