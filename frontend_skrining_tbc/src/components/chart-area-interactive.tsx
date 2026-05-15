"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
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
import screenings from "@/app/dashboard-admin-puskesmas/data.json"

export const description = "Tren pasien berdasarkan hasil screening"

const chartConfig = {
  desktop: {
    label: "Suspect TB",
    color: "var(--primary)",
  },
  mobile: {
    label: "Non Suspect TB",
    color: "var(--primary)",
  },
} satisfies ChartConfig

type AggregatedPoint = {
  date: string
  desktop: number
  mobile: number
}

function buildChartData(): AggregatedPoint[] {
  const map = new Map<string, AggregatedPoint>()

  screenings.forEach((patient) => {
    patient.riwayat_screening.forEach((record) => {
      const entry = map.get(record.tanggal) ?? {
        date: record.tanggal,
        desktop: 0,
        mobile: 0,
      }
      if (record.hasil.toLowerCase() === "positif") {
        entry.desktop += 1
      } else {
        entry.mobile += 1
      }
      map.set(record.tanggal, entry)
    })
  })

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
        <CardTitle>Data Pasien</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total pasien dalam rentang waktu yang dipilih
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
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
              <SelectValue placeholder="Last 3 months" />
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
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
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
              tickFormatter={(value) => displayFormatter.format(new Date(value))}
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
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
