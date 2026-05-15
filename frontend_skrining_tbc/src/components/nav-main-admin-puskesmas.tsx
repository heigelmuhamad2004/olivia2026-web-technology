"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { IconProps } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavMainAdminPuskesmasProps
  extends React.HTMLAttributes<HTMLElement> {
  items: {
    title: string
    url: string
    icon: React.ComponentType<IconProps>
  }[]
}

export function NavMainAdminPuskesmas({
  className,
  items,
  ...props
}: NavMainAdminPuskesmasProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("px-3", className)} {...props}>
      <SidebarMenu>
        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.url
          return (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton
                asChild
                className={cn(
                  isActive &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                )}
              >
                <Link href={item.url}>
                  <Icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </nav>
  )
}