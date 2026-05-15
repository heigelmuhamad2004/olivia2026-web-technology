"use client"

import * as React from "react"
import {
  IconHelp,
  IconInnerShadowTop,
  IconSettings,
  IconUserPlus,
  IconDashboard,
  IconUsers,
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
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard-super-admin">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  TBCheck Superadmin
                </span>
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