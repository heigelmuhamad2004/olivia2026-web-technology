"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react";
import { useAuth } from "@/app/services/useAuth"; // <-- Ganti ke useAuth
import { AppSidebar } from "@/components/app-sidebar-superadmin"
import { SiteHeader } from "@/components/site-header-superadmin"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter()

  useEffect(() => {
    // Jika loading selesai dan tidak ada user, atau role-nya bukan super_admin
    if (!loading && (!user || user.role !== "super_admin")) {
      // Redirect ke halaman login
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Tampilkan loading spinner HANYA saat loading, atau jika user tidak valid (sebelum redirect)
  if (loading || !user || user.role !== "super_admin") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-[12px] font-mono uppercase tracking-wider text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          Memverifikasi akses...
        </div>
      </div>
    );
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
