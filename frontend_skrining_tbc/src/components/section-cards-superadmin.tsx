"use client"

import { IconTrendingUp } from "@tabler/icons-react"

import admins from "@/app/dashboard-super-admin/data-admin.json"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Helper untuk format angka
const numberFormatter = new Intl.NumberFormat("id-ID")

// --- LOGIKA PENGOLAHAN DATA ---
const now = new Date()
const currentMonth = now.getMonth()
const currentYear = now.getFullYear()

// 1. Filter hanya untuk 'admin_puskesmas'
const adminsPuskesmas = admins.filter(
  (admin) => admin.role === "admin_puskesmas"
)

// 2. Hitung total admin puskesmas
const totalAdmins = adminsPuskesmas.length

// 3. Hitung admin baru bulan ini
const newAdminsThisMonth = adminsPuskesmas.filter((admin) => {
  const createdAt = new Date(admin.created_at)
  return (
    createdAt.getMonth() === currentMonth &&
    createdAt.getFullYear() === currentYear
  )
}).length

// 4. Hitung jumlah kecamatan unik yang tercover
const activeKecamatan = new Set(
  adminsPuskesmas
    .map((admin) => admin.kecamatan_id)
    .filter((id) => id !== null)
).size

// --- STRUKTUR DATA UNTUK CARD ---
const cards = [
  {
    title: "Total Admin Puskesmas",
    value: totalAdmins,
    badge: `${activeKecamatan} kecamatan tercover`,
    description: "Jumlah total akun admin puskesmas yang aktif",
    trendLabel: "Pertumbuhan Admin",
    trendIcon: IconTrendingUp,
  },
  {
    title: "Admin Baru (Bulan Ini)",
    value: newAdminsThisMonth,
    badge: `+${newAdminsThisMonth} admin baru`,
    description: "Admin puskesmas yang ditambahkan pada bulan ini",
    trendLabel: "Aktivitas Pendaftaran",
    trendIcon: IconTrendingUp,
  },
  {
    title: "Kecamatan Tercover",
    value: activeKecamatan,
    badge: "wilayah aktif",
    description: "Jumlah kecamatan unik yang telah memiliki admin",
    trendLabel: "Cakupan Wilayah",
    trendIcon: IconTrendingUp,
  },
]

export function SectionCardsSuperadmin() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="@container/card">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {numberFormatter.format(card.value)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <card.trendIcon className="size-4" />
                {card.badge}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.trendLabel} <card.trendIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">{card.description}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}