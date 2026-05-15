"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/app/services/auth.services"
import { AppSidebar } from "@/components/app-sidebar-admin-puskesmas"
import { SiteHeader } from "@/components/site-header-admin-puskesmas"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

// Tipe data untuk user
interface UserData {
  nama: string
  email: string
  role: string
}

export default function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser()
        if (userData.role !== "admin_puskesmas") {
          router.push("/auth/login")
          return
        }
        setUser(userData)
      } catch (error) {
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [router])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Memuat data...</div>
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {/* PERBAIKAN: Teruskan data 'user' ke AppSidebar */}
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
