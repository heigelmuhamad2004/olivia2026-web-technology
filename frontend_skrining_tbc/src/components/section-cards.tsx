"use client"

import { useEffect, useState } from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { getSkriningStatistik } from "@/app/services/skrining.services"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const numberFormatter = new Intl.NumberFormat("id-ID")

export interface StatistikSkrining {
  total_pasien: number
  total_screening: number
  suspect: number
  non_suspect: number
}

export function SectionCards() {
  const [statistik, setStatistik] = useState<StatistikSkrining | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSkriningStatistik()
        setStatistik(data)
      } catch (err) {
        console.error("Gagal fetch:", err)
        setError("Gagal memuat data")
      }
    }
    load()
  }, [])

  if (error) return <div>{error}</div>
  if (!statistik) return <div>Memuat data...</div>

  const cards = [
    {
      title: "Total Pasien",
      value: statistik.total_pasien,
      badge: `${statistik.total_screening} kali skrining`,
      description: "Pasien unik yang tercatat melakukan skrining",
      trendLabel: "Tren Pasien",
      trendIcon: IconTrendingUp,
    },
    {
      title: "Suspect TBC",
      value: statistik.suspect,
      badge: `${(
        (statistik.suspect / statistik.total_pasien) * 100 || 0
      ).toFixed(1)}%`,
      description: "Pasien dengan hasil skrining TERDUGA",
      trendLabel: "Tren Suspect",
      trendIcon: IconTrendingDown,
    },
    {
      title: "Non Suspect TBC",
      value: statistik.non_suspect,
      badge: `${(
        (statistik.non_suspect / statistik.total_pasien) * 100 || 0
      ).toFixed(1)}%`,
      description: "Pasien dengan hasil skrining TIDAK TERDUGA",
      trendLabel: "Tren Non Suspect",
      trendIcon: IconTrendingUp,
    },
  ]

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
