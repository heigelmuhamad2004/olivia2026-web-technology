"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import admins from "@/app/dashboard-super-admin/data-admin.json"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Tren penambahan admin baru dari waktu ke waktu"

const chartConfig = {
  newAdmins: {
    label: "Admin Baru",
    color: "var(--primary)",
  },
} satisfies ChartConfig

type AggregatedPoint = {
  date: string
  newAdmins: number
}

function buildChartData(): AggregatedPoint[] {
  const map = new Map<string, AggregatedPoint>()

  admins.forEach((admin) => {
    // Mengambil hanya bagian tanggal (YYYY-MM-DD) dari created_at
    const date = admin.created_at.split("T")[0]
    const entry = map.get(date) ?? {
      date: date,
      newAdmins: 0,
    }
    entry.newAdmins += 1
    map.set(date, entry)
  })

  // Mengurutkan data berdasarkan tanggal
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const chartData = React.useMemo(() => buildChartData(), [])
  const displayFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
    []
  )

  const latestDate = React.useMemo(() => {
    if (!chartData.length) return new Date()
    return new Date(chartData[chartData.length - 1].date)
  }, [chartData])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }

    const startDate = new Date(latestDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return chartData.filter((item) => {
      const date = new Date(item.date)
      return date >= startDate && date <= latestDate
    })
  }, [chartData, latestDate, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Tren Penambahan Admin</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total admin baru dalam rentang waktu yang dipilih
          </span>
          <span className="@[540px]/card:hidden">3 Bulan Terakhir</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">3 Bulan</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 Hari</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 Hari</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="3 Bulan Terakhir" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                3 Bulan
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 Hari
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 Hari
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/5 to-transparent">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillNewAdmins" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-newAdmins)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-newAdmins)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) =>
                  displayFormatter.format(new Date(value))
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      displayFormatter.format(new Date(value))
                    }
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="newAdmins"
                type="natural"
                fill="url(#fillNewAdmins)"
                stroke="var(--color-newAdmins)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}