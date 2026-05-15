// src/components/ResultVisualizer.tsx
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Activity, FileImage, FileText, Info } from "lucide-react"

interface MathDetails {
  z_tbc: number
  z_norm: number
  exp_tbc: number
  exp_norm: number
  sum_exp: number
}

interface ResultProps {
  diagnosis: string
  prob_tbc: number
  prob_normal: number
  spectrogram_image?: string 
  gradcam_image?: string // Fallback jika menggunakan data lama
  math_details: MathDetails 
  algoritma: string
}

export function ResultVisualizer({ data }: { data: ResultProps }) {
  const isSuspect = data.diagnosis === "Suspek TBC"
  
  // Jika karena alasan tertentu math_details gagal termuat, kita berikan nilai default (fallback aman)
  const math = data.math_details || { z_tbc: 0, z_norm: 0, exp_tbc: 0, exp_norm: 0, sum_exp: 1 }

  // Mencari confidence rate terbesar untuk ditampilkan di banner utama
  const confidence = isSuspect ? data.prob_tbc : data.prob_normal

  return (
    <div className="space-y-4 animate-in fade-in zoom-in duration-500">

      {/* 1. Banner verdik utama */}
      <div
        className={`flex items-center gap-4 rounded-2xl border px-6 py-4 ${
          isSuspect ? "border-red-200 bg-red-50/50" : "border-green-200 bg-green-50/50"
        }`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            isSuspect ? "bg-red-100" : "bg-green-100"
          }`}
        >
          {isSuspect ? (
            <AlertTriangle className="h-6 w-6 text-red-500" />
          ) : (
            <CheckCircle className="h-6 w-6 text-green-500" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Hasil deteksi suara AI</p>
          <p className={`text-xl font-semibold ${isSuspect ? "text-red-600" : "text-green-600"}`}>
            {data.diagnosis}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">{confidence.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">tingkat keyakinan AI</p>
        </div>
      </div>

      {/* 2. Probabilitas + Heatmap/Spektrogram */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border">
          <CardContent className="pt-5">
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Probabilitas
            </p>
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-sm font-medium">
                  <span className="text-red-500">Suspek TBC</span>
                  <span className="font-semibold text-red-500">{data.prob_tbc.toFixed(2)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-red-100">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-500"
                    style={{ width: `${data.prob_tbc}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-sm font-medium">
                  <span className="text-green-600">Normal</span>
                  <span className="font-semibold text-green-600">{data.prob_normal.toFixed(2)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-green-100">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${data.prob_normal}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  isSuspect ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isSuspect ? "bg-red-500" : "bg-green-500"}`} />
                Diagnosa: {data.diagnosis}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="pt-5">
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileImage className="h-3.5 w-3.5" />
              Pola Frekuensi Spektrogram
            </p>
            <div className="overflow-hidden rounded-xl bg-muted flex justify-center items-center">
              <img
                src={data.spectrogram_image || data.gradcam_image} 
                alt="Visualisasi Spektrogram Suara"
                className="h-auto max-h-40 w-auto object-cover rounded-lg"
              />
            </div>
            <p className="mt-3 text-[10px] text-center text-muted-foreground">
              Warna cerah (kuning/hijau) menunjukkan titik ledakan energi frekuensi suara.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Transparansi matematika */}
      <Card className="border">
        <CardContent className="pt-5">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Cara AI menghitung keputusan ini
          </p>
          <p className="mb-5 text-xs text-muted-foreground">
            AI mengolah suara melalui 3 tahap matematika menggunakan arsitektur {data.algoritma || "Deep Learning"}.
          </p>
          
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {/* Step 1: Logits Asli */}
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tahap 1 — skor mentah (logits)
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Z TBC</span>
                  <span className="font-semibold text-primary">= {math.z_tbc}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Z Normal</span>
                  <span className="font-semibold text-primary">= {math.z_norm}</span>
                </div>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="hidden items-center pt-5 text-muted-foreground md:flex">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
            
            {/* Step 2: Eksponensial Asli */}
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tahap 2 — eksponensial (e^z)
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground truncate">e^({math.z_tbc})</span>
                  <span className="font-semibold text-primary">= {math.exp_tbc}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground truncate">e^({math.z_norm})</span>
                  <span className="font-semibold text-primary">= {math.exp_norm}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Total (Σ)</span>
                  <span className="font-semibold text-primary">= {math.sum_exp}</span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden items-center pt-5 text-muted-foreground md:flex">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
            
            {/* Step 3: Probabilitas */}
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tahap 3 — hasil softmax (%)
              </p>
              <div className="space-y-2">
                <div className="rounded-lg bg-red-50 p-2.5 font-mono text-xs">
                  <p className="text-[10px] text-red-400">P(TBC) = {math.exp_tbc} / {math.sum_exp}</p>
                  <p className="mt-0.5 text-base font-bold text-red-600">= {data.prob_tbc.toFixed(2)}%</p>
                </div>
                <div className="rounded-lg bg-green-50 p-2.5 font-mono text-xs">
                  <p className="text-[10px] text-green-500">P(Normal) = {math.exp_norm} / {math.sum_exp}</p>
                  <p className="mt-0.5 text-base font-bold text-green-600">= {data.prob_normal.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-primary/80">
              Semakin tinggi persentase suatu kategori, semakin yakin AI bahwa pola akustik menyerupai 
              kategori tersebut. Hasil ini bukan diagnosis medis resmi — selalu konsultasikan ke dokter.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}