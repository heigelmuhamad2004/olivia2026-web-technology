"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
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
          window.location.href = "/auth/login"
          return
        }
        setUser(userData)
      } catch (error) {
        window.location.href = "/auth/login"
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-[12px] font-mono uppercase tracking-wider text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          Memuat Dashboard...
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "256px",
          "--header-height": "64px",
        } as React.CSSProperties
      }
    >
      {/* PERBAIKAN: Teruskan data 'user' ke AppSidebar */}
      <AppSidebar variant="sidebar" user={user} />
      <SidebarInset className="bg-background">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col">
              {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
