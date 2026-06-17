"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" // Import useRouter
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { logoutUser } from "@/app/services/auth.services" // Import fungsi logout
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Sesuaikan tipe data 'user' agar lebih sederhana
export function NavUser({
  user,
}: {
  user: {
    nama: string
    email: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  // Fungsi untuk menangani logout
  const handleLogout = async () => {
    try {
      await logoutUser()
      // Pembersihan ekstra
      localStorage.removeItem("accessToken")
      localStorage.removeItem("activeSessionId")
      toast.success("Anda berhasil logout.")
      // Gunakan window.location agar total reset state
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Terjadi kesalahan saat logout.")
    }
  }

  // Ambil inisial nama untuk AvatarFallback
  const nameInitials = user.nama
    ? user.nama
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "AD"

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarImage src="" alt={user.nama} />
                  <AvatarFallback className="rounded-lg">
                    {nameInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.nama}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
                <IconDotsVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt={user.nama} />
                    <AvatarFallback className="rounded-lg">
                      {nameInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.nama}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <IconUserCircle />
                  Account
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {/* PERBAIKAN: Gunakan onSelect untuk membuka modal konfirmasi */}
              <DropdownMenuItem onSelect={() => setIsLogoutModalOpen(true)} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                <IconLogout />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Modal Konfirmasi Logout ala Vercel Style */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 sm:p-8 sm:rounded-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
              Konfirmasi Keluar
            </DialogTitle>
            <DialogDescription className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
              Apakah Anda yakin ingin keluar dari TBCheck? Sesi Anda akan diakhiri dan harus login kembali untuk mengakses sistem.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
              className="rounded-full px-6 h-10 font-medium w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="rounded-full px-6 h-10 font-medium shadow-sm w-full sm:w-auto"
            >
              Ya, Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
