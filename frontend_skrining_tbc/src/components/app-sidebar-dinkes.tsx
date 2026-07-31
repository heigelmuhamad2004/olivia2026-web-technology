"use client"

import * as React from "react"
import {
  IconHelp,
  IconInnerShadowTop,
  IconSettings,
  IconUserPlus,
  IconDashboard,
  IconBuildingCommunity,
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    nama: string
    email: string
  } | null
}

const navData = {
  navMain: [
    {
      title: "Dashboard Kabupaten",
      url: "/dashboard-admin-dinkes",
      icon: IconDashboard,
    },
    {
      title: "Tambah Admin Puskesmas",
      url: "/dashboard-admin-dinkes/tambah-admin-puskesmas",
      icon: IconUserPlus,
    },
    {
      title: "Data Admin Puskesmas",
      url: "/dashboard-admin-dinkes/data-admin-puskesmas",
      icon: IconBuildingCommunity,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dinkes/settings",
      icon: IconSettings,
    },
    {
      title: "Bantuan",
      url: "/help",
      icon: IconHelp,
    },
  ],
}

export function AppSidebarDinkes({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="hover:bg-transparent">
              <a href="/dashboard-admin-dinkes" className="flex items-center gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <IconBuildingCommunity className="size-5" />
                </div>
                <span className="text-[14px] font-semibold tracking-tight">Dinkes Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMainAdminPuskesmas items={navData.navMain} />
        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}