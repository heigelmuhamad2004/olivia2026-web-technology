"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react";
import { useAuth } from "@/app/services/useAuth";
import { AppSidebarDinkes } from "@/components/app-sidebar-dinkes"; // New Sidebar
import { SiteHeader } from "@/components/site-header-superadmin" // Re-using header
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardDinkesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin_dinkes")) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin_dinkes") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-[12px] font-mono uppercase tracking-wider text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          Memverifikasi akses Admin Dinkes...
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
      <AppSidebarDinkes variant="sidebar" user={user} />
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