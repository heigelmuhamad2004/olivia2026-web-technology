// src/components/LayerAnimation.tsx
"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface LayerAnimationProps {
  algoType: "cnn" | "densenet"
  onComplete?: () => void
}

const CNN_LAYERS = [
  { name: "Conv2D", desc: "Deteksi tepi suara" },
  { name: "MaxPool", desc: "Reduksi noise" },
  { name: "Conv2D", desc: "Ekstraksi pola batuk" },
  { name: "Dense", desc: "Klasifikasi akhir" },
]

const DENSENET_LAYERS = [
  { name: "Dense Block 1", desc: "Ekstraksi fitur awal" },
  { name: "Transition 1", desc: "Kompresi matriks" },
  { name: "Dense Block 2", desc: "Pengenalan pola dalam" },
  { name: "Transition 2", desc: "Reduksi dimensi" },
  { name: "Classification", desc: "Hitung probabilitas" },
]

const LAYER_DURATION_MS = 900

export function LayerAnimation({ algoType, onComplete }: LayerAnimationProps) {
  const layers = algoType === "cnn" ? CNN_LAYERS : DENSENET_LAYERS
  const total = layers.length

  const [currentLayer, setCurrentLayer] = useState(1)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    // Reset tiap kali algoType berubah
    setCurrentLayer(1)
    setIsDone(false)
  }, [algoType])

  useEffect(() => {
    if (isDone) return

    if (currentLayer > total) {
      setIsDone(true)
      onComplete?.()
      return
    }

    const timer = setTimeout(() => {
      setCurrentLayer((prev) => prev + 1)
    }, LAYER_DURATION_MS)

    return () => clearTimeout(timer)
  }, [currentLayer, total, isDone, onComplete])

  const progressPercent = isDone
    ? 100
    : Math.round(((currentLayer - 1) / total) * 100)

  return (
    <Card className="mt-6 border animate-in fade-in slide-in-from-top-4 duration-300">
      <CardContent className="pt-5 pb-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
            <p className="text-sm font-medium text-foreground">
              {isDone
                ? `Analisis ${algoType === "cnn" ? "CNN" : "DenseNet"} selesai`
                : `Menganalisis dengan ${algoType === "cnn" ? "CNN 4-Layer" : "DenseNet"}...`}
            </p>
          </div>
          <span className="text-xs font-semibold text-primary tabular-nums">
            {progressPercent}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-6">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-in-out",
              isDone ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Layer cards */}
        <div
          className={cn(
            "grid gap-3",
            algoType === "cnn"
              ? "grid-cols-2 md:grid-cols-4"
              : "grid-cols-2 md:grid-cols-5"
          )}
        >
          {layers.map((layer, index) => {
            const stepNumber = index + 1
            const isActive = !isDone && currentLayer === stepNumber
            const isPassed = isDone || currentLayer > stepNumber

            return (
              <div
                key={index}
                className={cn(
                  "relative flex flex-col items-center text-center rounded-xl border p-3 transition-all duration-500",
                  isActive
                    ? "border-primary/50 bg-primary/5 scale-[1.03]"
                    : isPassed
                    ? "border-green-500/30 bg-green-50 dark:bg-green-950/20"
                    : "border-border bg-muted/30"
                )}
              >
                {/* Connector line */}
                {index > 0 && (
                  <div className="absolute top-1/2 -left-[7px] hidden h-px w-3 -translate-y-1/2 border-t border-dashed border-muted-foreground/30 md:block" />
                )}

                {/* Step indicator */}
                <div
                  className={cn(
                    "mb-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-colors duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isPassed
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isPassed ? (
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Layer info */}
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {algoType === "cnn" ? `Layer ${stepNumber}` : `Blok ${stepNumber}`}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                  {layer.name}
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">
                  {layer.desc}
                </p>

                {/* Status teks */}
                <div className="mt-2 h-3.5 text-[10px] font-medium">
                  {isActive && (
                    <span className="animate-pulse text-primary">Memproses...</span>
                  )}
                  {isPassed && (
                    <span className="text-green-600 dark:text-green-400">Selesai</span>
                  )}
                  {!isActive && !isPassed && (
                    <span className="text-muted-foreground/40">Menunggu</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Done banner */}
        {isDone && (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 animate-in fade-in duration-300">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <p className="text-xs font-medium text-green-700 dark:text-green-400">
              Semua layer selesai diproses — hasil siap ditampilkan
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}