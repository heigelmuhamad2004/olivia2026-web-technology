import api from "./api"
import { getActiveToken } from "./auth.services"

// Tipe data untuk user yang diterima dari API
export interface User {
  id: number
  nama: string
  email: string
  role: "user" | "admin_puskesmas" | "super_admin"
  kecamatan_id: number | null
  created_at: string
  updated_at: string
}

// Tipe data untuk form update user
export interface UpdateUserData {
  nama: string
  email: string
  role: "user" | "admin_puskesmas" | "super_admin"
}

// Fungsi untuk mengambil semua user, dengan filter role opsional
export const getUsers = async (role?: string): Promise<User[]> => {
  try {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")
    const params = role ? { role } : {}
    const response = await api.get("/users", {
      headers: { Authorization: `Bearer ${token}` },
      params,
    })
    return response.data.data
  } catch (error) {
    console.error("Gagal mengambil data user:", error)
    return []
  }
}

// Fungsi untuk mengupdate data user
export const updateUser = async (
  id: number,
  data: UpdateUserData
): Promise<User> => {
  const token = getActiveToken()
  if (!token) throw new Error("No active session token")
  const response = await api.put(`/users/edit/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data.data
}

// Fungsi untuk menghapus user
export const deleteUser = async (id: number): Promise<void> => {
  const token = getActiveToken()
  if (!token) throw new Error("No active session token")
  await api.delete(`/users/delete/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}