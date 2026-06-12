'use client'

import { Activity, Map as MapIcon, MessageCircle } from 'lucide-react'
import DottedMap from 'dotted-map'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

export function Features9() {
    return (
        <section className="px-4 py-16 md:py-32 w-full flex justify-center bg-background text-foreground overflow-hidden">
            <div className="mx-auto grid max-w-5xl border border-border md:grid-cols-2 rounded-xl bg-card shadow-sm overflow-hidden">
                
                {/* SECTION 1: MAP (Penyebaran / Peringkat Dunia) */}
                <div>
                    <div className="p-6 sm:p-12">
                        <span className="text-muted-foreground flex items-center gap-2 font-medium text-sm">
                            <MapIcon className="size-4 text-primary" />
                            Beban TBC Global
                        </span>
                        <p className="mt-6 text-2xl font-semibold leading-tight text-balance">
                            Indonesia menduduki peringkat #2 di dunia dengan kasus TBC tertinggi.
                        </p>
                    </div>

                    <div aria-hidden className="relative">
                        <div className="absolute inset-0 z-10 m-auto size-fit">
                            <div className="rounded-[--radius] bg-background z-[1] dark:bg-muted relative flex size-fit w-fit items-center gap-2 border border-border px-3 py-1.5 text-xs font-semibold shadow-md shadow-black/5">
                                <span className="text-lg">🇮🇩</span> 1.090.000 Kasus Baru / Tahun
                            </div>
                            <div className="rounded-[--radius] bg-background absolute inset-2 -bottom-2 mx-auto border border-border px-3 py-4 text-xs font-medium shadow-md shadow-black/5 dark:bg-zinc-900"></div>
                        </div>

                        <div className="relative overflow-hidden h-[220px] flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10"></div>
                            <Map />
                        </div>
                    </div>
                </div>

                {/* SECTION 2: CHAT SIMULATION */}
                <div className="overflow-hidden border-t border-border bg-muted/30 p-6 sm:p-12 md:border-0 md:border-l dark:bg-transparent">
                    <div className="relative z-10">
                        <span className="text-muted-foreground flex items-center gap-2 font-medium text-sm">
                            <MessageCircle className="size-4 text-primary" />
                            Asisten AI 24/7
                        </span>
                        <p className="my-6 text-2xl font-semibold leading-tight text-balance">
                            Dapatkan deteksi awal dan rujukan instan dari rumah.
                        </p>
                    </div>
                    
                    <div aria-hidden className="flex flex-col gap-6 mt-8">
                        {/* Bubble Pasien */}
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="flex justify-center items-center size-5 rounded-full border border-border">
                                    <span className="size-3 rounded-full bg-muted-foreground"/>
                                </span>
                                <span className="text-muted-foreground text-xs font-medium">Pasien</span>
                            </div>
                            <div className="rounded-2xl rounded-tl-none bg-background mt-2 w-[85%] border border-border p-3.5 text-sm text-foreground shadow-sm">
                                Saya sudah batuk berdahak lebih dari 2 minggu, kadang demam malam hari.
                            </div>
                        </div>

                        {/* Bubble AI */}
                        <div>
                            <div className="flex items-center gap-2 justify-end">
                                <span className="text-muted-foreground text-xs font-medium">AI Skrining</span>
                                <span className="flex justify-center items-center size-5 rounded-full border border-primary/30 bg-primary/10">
                                    <span className="size-3 rounded-full bg-primary"/>
                                </span>
                            </div>
                            <div className="rounded-2xl rounded-tr-none mb-1 mt-2 ml-auto w-[85%] bg-primary p-3.5 text-sm text-primary-foreground shadow-sm">
                                Gejala tersebut berisiko. Segera lakukan perekaman suara batuk di platform ini untuk dianalisis lebih lanjut.
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 3: BIG TEXT */}
                <div className="col-span-full border-y border-border p-8 md:p-12 bg-card">
                    <p className="text-center text-5xl font-bold tracking-tight lg:text-7xl text-foreground">
                        125.000<span className="text-2xl lg:text-4xl text-muted-foreground font-semibold"> kematian/tahun</span>
                    </p>
                    <p className="mt-6 text-center text-sm md:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Estimasi Kementerian Kesehatan menunjukkan terdapat sekitar <span className="font-semibold text-foreground">1.090.000 kasus TBC baru setiap tahun</span>, dengan rasio insiden sebesar 388 kasus per 100.000 penduduk di Tanah Air.
                    </p>
                </div>

                {/* SECTION 4: CHART (Tren Kasus) */}
                <div className="relative col-span-full bg-muted/10">
                    <div className="absolute z-10 max-w-lg px-6 pr-12 pt-6 md:px-12 md:pt-12 pointer-events-none">
                        <span className="text-muted-foreground flex items-center gap-2 font-medium text-sm">
                            <Activity className="size-4 text-primary" />
                            Tren Kasus TBC di Indonesia
                        </span>
                        <p className="my-6 text-2xl font-semibold leading-tight text-balance text-foreground">
                            Kesenjangan deteksi dini. <span className="text-muted-foreground font-normal">Masih banyak kasus yang belum ditemukan dan diobati.</span>
                        </p>
                    </div>
                    <div className="pt-48 md:pt-32">
                        <MonitoringChart />
                    </div>
                </div>
            </div>
        </section>
    )
}

const map = new DottedMap({ height: 55, grid: 'diagonal' })
const points = map.getPoints()

const Map = () => {
    return (
        <svg viewBox="0 0 120 60" className="w-full h-full text-muted-foreground/30">
            {points.map((point, index) => (
                <circle key={index} cx={point.x} cy={point.y} r={0.2} fill="currentColor" />
            ))}
        </svg>
    )
}

const chartConfig = {
    estimasi: { label: 'Estimasi Kasus Baru', color: 'hsl(var(--destructive))' },
    ditemukan: { label: 'Kasus Ditemukan', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

const chartData = [
    { year: '2019', estimasi: 845000, ditemukan: 566623 },
    { year: '2020', estimasi: 824000, ditemukan: 393323 },
    { year: '2021', estimasi: 969000, ditemukan: 397377 },
    { year: '2022', estimasi: 1060000, ditemukan: 717941 },
    { year: '2023', estimasi: 1090000, ditemukan: 809000 },
]

const MonitoringChart = () => {
    return (
        <ChartContainer className="h-[250px] md:h-80 w-full" config={chartConfig}>
            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} className="text-muted-foreground text-xs" />
                <ChartTooltip active cursor={false} content={<ChartTooltipContent className="dark:bg-muted" />} />
                <Area strokeWidth={2} dataKey="estimasi" type="monotone" fill="var(--color-estimasi)" fillOpacity={0.1} stroke="var(--color-estimasi)" />
                <Area strokeWidth={2} dataKey="ditemukan" type="monotone" fill="var(--color-ditemukan)" fillOpacity={0.2} stroke="var(--color-ditemukan)" />
            </AreaChart>
        </ChartContainer>
    )
}