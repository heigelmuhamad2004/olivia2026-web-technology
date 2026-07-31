import axiosInstance from "@/lib/axios"
import { Skrining } from "./skrining-columns" // Impor tipe data Skrining

// Hapus interface PuskesmasStats karena tidak digunakan lagi

/**
 * Service untuk Admin Dinkes mengambil semua data skrining
 * di dalam wilayah kabupatennya.
 */
export const getSkriningByKabupaten = async (): Promise<Skrining[]> => {
  try {
    // Panggil endpoint baru
    const response = await axiosInstance.get("/dinkes/skrining")
    return response.data.data || []
  } catch (error) {
    console.error("API call error in getSkriningByKabupaten:", error)
    throw error
  }
}

export const getAdminPuskesmasList = async () => {
  try {
    const response = await axiosInstance.get("/dinkes/admin-puskesmas");
    return response.data.data || [];
  } catch (error) {
    console.error("API call error in getAdminPuskesmasList:", error);
    throw error;
  }
}

export const updateAdminPuskesmas = async (id: number, data: { nama: string }) => {
  try {
    const response = await axiosInstance.put(`/dinkes/admin-puskesmas/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export const deleteAdminPuskesmas = async (id: number) => {
  try {
    const response = await axiosInstance.delete(`/dinkes/admin-puskesmas/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}