"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import axiosInstance from "@/lib/axios"

interface User {
  id: string
  nama: string
  email:string
  role: "user" | "admin_puskesmas" | "admin_dinkes" | "super_admin"
  kecamatan_id?: number
  kabupaten_id?: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosInstance.get("/auth/me") // Selalu coba verifikasi sesi saat aplikasi dimuat
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)