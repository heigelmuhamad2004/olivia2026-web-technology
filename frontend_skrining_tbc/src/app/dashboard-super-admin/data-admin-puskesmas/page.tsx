"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import {
  deleteUser,
  getUsers,
  updateUser,
  User,
} from "@/app/services/user-services"
import { DataTable } from "@/components/data-table-super-admin" // Impor DataTable
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Skema validasi untuk form edit user
const formSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  role: z.enum(["user", "admin_puskesmas", "super_admin"]),
})

export default function UserManagementPage() {
  const [users, setUsers] = React.useState<User[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [roleFilter, setRoleFilter] = React.useState("")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  // Fungsi untuk memuat data dari API
  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true)
    const data = await getUsers(roleFilter || undefined)
    setUsers(data)
    setIsLoading(false)
  }, [roleFilter])

  // Memuat data saat komponen mount dan saat filter berubah
  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    form.reset({
      nama: user.nama,
      email: user.email,
      role: user.role,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (userId: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      try {
        await deleteUser(userId)
        alert("Pengguna berhasil dihapus.")
        fetchUsers() // Muat ulang data
      } catch (error) {
        alert("Gagal menghapus pengguna.")
      }
    }
  }

  async function onEditSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedUser) return
    try {
      await updateUser(selectedUser.id, values)
      alert("Data pengguna berhasil diperbarui.")
      setIsModalOpen(false)
      fetchUsers() // Muat ulang data
    } catch (error) {
      alert("Gagal memperbarui data.")
    }
  }

  return (
    <div className="container mx-auto py-10">
      {isLoading ? (
        <p>Memuat data...</p>
      ) : (
        // PERBAIKAN: Teruskan state filter dan handler-nya ke DataTable
        <DataTable
          data={users}
          onEdit={handleEdit}
          onDelete={handleDelete}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
        />
      )}

      {/* Modal Edit */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui detail untuk pengguna {selectedUser?.nama}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin_puskesmas">
                          Admin Puskesmas
                        </SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}