// src/components/ResultVisualizer.tsx
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Activity, FileImage, FileText, Info } from "lucide-react"

interface ResultProps {
  diagnosis: string
  confidence: number
  prob_tbc: number
  prob_normal: number
  gradcam_image: string
  algoritma: string
}

export function ResultVisualizer({ data }: { data: ResultProps }) {
  const isSuspect = data.diagnosis === "Suspek TBC"

  const p_tbc = Math.max(data.prob_tbc / 100, 0.0001)
  const p_norm = Math.max(data.prob_normal / 100, 0.0001)
  const z_tbc = Math.log(p_tbc).toFixed(3)
  const z_norm = Math.log(p_norm).toFixed(3)
  const exp_tbc = Math.exp(parseFloat(z_tbc)).toFixed(3)
  const exp_norm = Math.exp(parseFloat(z_norm)).toFixed(3)
  const sum_exp = (parseFloat(exp_tbc) + parseFloat(exp_norm)).toFixed(3)

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
          <p className="text-3xl font-bold text-primary">{data.confidence.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">tingkat keyakinan AI</p>
        </div>
      </div>

      {/* 2. Probabilitas + Heatmap */}
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
              Heatmap Grad-CAM
            </p>
            <div className="overflow-hidden rounded-xl bg-muted">
              <img
                src={data.gradcam_image}
                alt="Heatmap spektrogram Grad-CAM"
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="mt-3 flex items-center justify-center gap-5">
              {[
                { color: "bg-blue-500", label: "Tidak aktif" },
                { color: "bg-orange-400", label: "Sedang" },
                { color: "bg-red-500", label: "Paling aktif" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
                  {label}
                </div>
              ))}
            </div>
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
            AI mengolah suara melalui 3 tahap matematika menggunakan arsitektur {data.algoritma}.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tahap 1 — skor mentah (logits)
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Z TBC</span>
                  <span className="font-semibold text-primary">= {z_tbc}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Z Normal</span>
                  <span className="font-semibold text-primary">= {z_norm}</span>
                </div>
              </div>
            </div>
            <div className="hidden items-center pt-5 text-muted-foreground md:flex">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tahap 2 — eksponensial (e^z)
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground truncate">e^({z_tbc})</span>
                  <span className="font-semibold text-primary">= {exp_tbc}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground truncate">e^({z_norm})</span>
                  <span className="font-semibold text-primary">= {exp_norm}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Total (Σ)</span>
                  <span className="font-semibold text-primary">= {sum_exp}</span>
                </div>
              </div>
            </div>
            <div className="hidden items-center pt-5 text-muted-foreground md:flex">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tahap 3 — hasil softmax (%)
              </p>
              <div className="space-y-2">
                <div className="rounded-lg bg-red-50 p-2.5 font-mono text-xs">
                  <p className="text-[10px] text-red-400">P(TBC) = {exp_tbc} / {sum_exp}</p>
                  <p className="mt-0.5 text-base font-bold text-red-600">= {data.prob_tbc.toFixed(2)}%</p>
                </div>
                <div className="rounded-lg bg-green-50 p-2.5 font-mono text-xs">
                  <p className="text-[10px] text-green-500">P(Normal) = {exp_norm} / {sum_exp}</p>
                  <p className="mt-0.5 text-base font-bold text-green-600">= {data.prob_normal.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-primary/80">
              Semakin tinggi persentase suatu kategori, semakin yakin AI bahwa rekaman termasuk
              kategori tersebut. Hasil ini bukan diagnosis medis resmi — selalu konsultasikan ke dokter.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}