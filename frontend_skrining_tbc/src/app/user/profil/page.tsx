"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import ProfileHeader from "@/components/profile-header"
import ProfileContent from "@/components/profile-content"

import { getCurrentUser } from "@/app/services/auth.services"
import { getMyPatients } from "@/app/services/pasien.services"
import { User } from "@/app/services/user-services"
import { Patient } from "@/app/services/pasien.services"
import { toast } from "sonner"

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, patientsData] = await Promise.all([
          getCurrentUser(),
          getMyPatients(),
        ])

        setUser(userData)

        // Asumsi: Satu user bisa punya multiple pasien, tapi untuk profil kita ambil yang pertama 
        // atau yang sesuai dengan user_id (tergantung logika bisnis).
        // Biasanya user -> 1 pasien (diri sendiri) untuk konteks profil.
        if (patientsData && patientsData.length > 0) {
          setPatient(patientsData[0])
        }
      } catch (error) {
        console.error("Gagal memuat data profil:", error)
        toast.error("Gagal memuat data profil")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-muted-foreground">
        Gagal memuat data pengguna.
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-10">
      <ProfileHeader
        nama={user.nama}
        email={user.email}
        role={user.role}
      />
      <ProfileContent user={user} patient={patient} />
    </div>
  )
}
