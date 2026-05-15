"use client"

import * as React from "react"
import {
  IconDashboard,
  IconUsers,
  IconReportAnalytics,
  IconSettings,
  IconHelp,
  IconInnerShadowTop,
  IconSend
} from "@tabler/icons-react"

import { NavMainAdminPuskesmas } from "@/components/nav-main-admin-puskesmas"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// PERBAIKAN: Tipe data untuk props, termasuk user
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    nama: string
    email: string
  } | null
}

const navData = {
  // Hapus 'user' dari sini, pindahkan ke props
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard-admin-puskesmas",
      icon: IconDashboard,
    },
    {
      title: "Data Pasien",
      url: "/dashboard-admin-puskesmas/data-pasien",
      icon: IconUsers,
    },
    {
      title: "Data Rujukan",
      url: "/dashboard-admin-puskesmas/data-rujukan",
      icon: IconSend,
    },
    {
      title: "Laporan",
      url: "/admin/laporan",
      icon: IconReportAnalytics,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Bantuan",
      url: "/help",
      icon: IconHelp,
    },
  ],
}

// PERBAIKAN: Terima 'user' sebagai props
export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard-admin-puskesmas">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">TBCheck Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMainAdminPuskesmas items={navData.navMain} />
        <NavSecondary className="mt-auto" items={navData.navSecondary} />
      </SidebarContent>

      <SidebarFooter>
        {/* PERBAIKAN: Gunakan 'user' dari props dan hanya render jika ada */}
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}
