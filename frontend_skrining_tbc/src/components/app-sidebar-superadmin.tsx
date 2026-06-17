"use client"

import * as React from "react"
import {
  IconHelp,
  IconInnerShadowTop,
  IconSettings,
  IconUserPlus,
  IconDashboard,
  IconUsers,
  IconChartBar,
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

// PERBAIKAN 1: Tambahkan interface untuk props, sama seperti sidebar admin
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    nama: string
    email: string
  } | null
}

// PERBAIKAN 2: Ganti nama 'data' menjadi 'navData' dan hapus object 'user' dari sini
const navData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard-super-admin",
      icon: IconDashboard,
    },
    {
      title: "Data User",
      url: "/dashboard-super-admin/data-admin-puskesmas",
      icon: IconUsers,
    },
    {
      title: "Tambah Admin Puskesmas",
      url: "/dashboard-super-admin/tambah-admin-puskesmas",
      icon: IconUserPlus,
    },
    {
      title: "Metrics",
      url: "/dashboard-super-admin/dashboard-metrics",
      icon: IconChartBar,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/superadmin/settings",
      icon: IconSettings,
    },
    {
      title: "Bantuan",
      url: "/help",
      icon: IconHelp,
    },
  ],
}

// PERBAIKAN 3: Terima 'user' sebagai props
export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="hover:bg-transparent"
            >
              <a href="/dashboard-super-admin" className="flex items-center gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <IconInnerShadowTop className="size-5" />
                </div>
                <span className="text-[14px] font-semibold tracking-tight">TBCheck Superadmin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Gunakan navData yang sudah diperbaiki */}
        <NavMainAdminPuskesmas items={navData.navMain} />
        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {/* PERBAIKAN 4: Gunakan 'user' dari props, bukan dari data statis */}
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}