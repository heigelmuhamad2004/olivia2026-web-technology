// src/components/LayerAnimation.tsx

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface LayerAnimationProps {
  algoType: "cnn" | "densenet";
  currentLayer: number;
}

export function LayerAnimation({ algoType, currentLayer }: LayerAnimationProps) {
  // Konfigurasi layer berdasarkan algoritma
  const layers = algoType === "cnn" 
    ? [
        { name: "Layer 1: Conv2D", desc: "Deteksi Tepi Suara" },
        { name: "Layer 2: MaxPool", desc: "Reduksi Noise" },
        { name: "Layer 3: Conv2D", desc: "Ekstraksi Pola Batuk" },
        { name: "Layer 4: Dense", desc: "Klasifikasi Akhir" }
      ]
    : [
        { name: "Dense Block 1", desc: "Ekstraksi Fitur Awal" },
        { name: "Transition 1", desc: "Kompresi Matriks" },
        { name: "Dense Block 2", desc: "Pengenalan Pola Dalam" },
        { name: "Transition 2", desc: "Reduksi Dimensi" },
        { name: "Classification", desc: "Hitung Probabilitas" }
      ];

  return (
    <Card className="border-2 border-primary/20 bg-muted/30 mt-6 animate-in fade-in slide-in-from-top-4">
      <CardContent className="pt-6">
        <p className="text-sm font-semibold text-center mb-6 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Menyimulasikan Analisis Arsitektur {algoType === "cnn" ? "CNN 4-Layer" : "DenseNet"}...
        </p>

        <div className={cn(
          "grid gap-3",
          algoType === "cnn" ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-5"
        )}>
          {layers.map((layer, index) => {
            const stepNumber = index + 1;
            const isActive = currentLayer === stepNumber;
            const isPassed = currentLayer > stepNumber;

            return (
              <div 
                key={index} 
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all duration-500 flex flex-col items-center text-center",
                  isActive ? "border-primary bg-primary/10 shadow-md scale-105" : 
                  isPassed ? "border-green-500/50 bg-green-500/5" : "border-border bg-background"
                )}
              >
                {/* Garis Panah Penghubung (Kecuali kotak pertama) */}
                {index > 0 && (
                  <div className="absolute top-1/2 -left-3 w-3 border-t-2 border-dashed border-muted-foreground hidden md:block" />
                )}

                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-2 transition-colors",
                  isActive ? "bg-primary text-white" : 
                  isPassed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {isPassed ? "✓" : stepNumber}
                </div>
                
                <p className="text-xs font-bold text-foreground">{layer.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{layer.desc}</p>
                
                {/* Status Eksekusi */}
                <div className="mt-2 text-[10px] font-medium h-4">
                  {isActive && <span className="text-primary animate-pulse">Memproses matriks...</span>}
                  {isPassed && <span className="text-green-600 dark:text-green-400">Selesai</span>}
                  {!isActive && !isPassed && <span className="text-muted-foreground/50">Menunggu...</span>}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  );
}