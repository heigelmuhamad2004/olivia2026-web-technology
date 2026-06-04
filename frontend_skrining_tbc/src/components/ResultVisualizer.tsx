import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Activity, FileImage, FileText, Info } from "lucide-react"

interface MathDetails {
  aktivasi: string;
  probabilitas_p: number;
  raw_logit_z: number;
  threshold: number;
  rumus: string;
  keterangan: string;
}

interface ResultProps {
  diagnosis: string
  prob_tbc: number
  prob_normal: number
  spectrogram_image?: string 
  math_details: MathDetails 
  algoritma: string
}

export function ResultVisualizer({ data }: { data: ResultProps }) {
  const isSuspect = data.diagnosis === "Suspek TBC"
  const math = data.math_details || { aktivasi: "N/A", probabilitas_p: 0, raw_logit_z: 0, threshold: 0.5, rumus: "", keterangan: "" }
  const confidence = isSuspect ? data.prob_tbc : data.prob_normal

  return (
    <div className="space-y-4 animate-in fade-in zoom-in duration-500">
      {/* 1. Banner & 2. Heatmap (TETAP SAMA SEPERTI KODEMU SEBELUMNYA) */}
      <div className={`flex items-center gap-4 rounded-2xl border px-6 py-4 ${isSuspect ? "border-red-200 bg-red-50/50" : "border-green-200 bg-green-50/50"}`}>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isSuspect ? "bg-red-100" : "bg-green-100"}`}>
          {isSuspect ? <AlertTriangle className="h-6 w-6 text-red-500" /> : <CheckCircle className="h-6 w-6 text-green-500" />}
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Hasil deteksi suara AI</p>
          <p className={`text-xl font-semibold ${isSuspect ? "text-red-600" : "text-green-600"}`}>{data.diagnosis}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">{confidence.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">tingkat keyakinan AI</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border">
          <CardContent className="pt-5">
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Activity className="h-3.5 w-3.5" />Probabilitas</p>
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-sm font-medium">
                  <span className="text-red-500">Suspek TBC</span><span className="font-semibold text-red-500">{data.prob_tbc.toFixed(2)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-red-100">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${data.prob_tbc}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-sm font-medium">
                  <span className="text-green-600">Normal</span><span className="font-semibold text-green-600">{data.prob_normal.toFixed(2)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-green-100">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${data.prob_normal}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="pt-5 text-center">
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><FileImage className="h-3.5 w-3.5" />Pola Spektrogram</p>
            <div className="overflow-hidden rounded-xl bg-muted flex justify-center p-2">
              <img src={data.spectrogram_image} alt="Spektrogram" className="h-auto max-h-32 w-auto object-cover rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. TRANSISI MATEMATIKA SIGMOID (BARU) */}
      <Card className="border">
        <CardContent className="pt-5">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> Cara AI menghitung keputusan ini
          </p>
          <p className="mb-5 text-xs text-muted-foreground">
            AI memproses gambar spektrogram menjadi satu nilai probabilitas menggunakan fungsi aktivasi <b>{math.aktivasi}</b>.
          </p>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Step 1: Raw Logit */}
            <div className="rounded-xl border bg-muted/40 p-4 relative">
              <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Tahap 1 — Skor Mentah Jaringan (Logit)</p>
              <div className="bg-white border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Nilai Logit Z:</p>
                <p className="text-lg font-mono font-bold text-primary">{math.raw_logit_z}</p>
              </div>
              <div className="hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2 z-10 bg-background rounded-full p-1 border text-muted-foreground">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
            
            {/* Step 2: Fungsi Sigmoid */}
            <div className="rounded-xl border bg-muted/40 p-4 relative">
              <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Tahap 2 — Fungsi Aktivasi</p>
              <div className="bg-white border rounded-lg p-3 text-center">
                <p className="text-xs font-mono font-semibold text-primary mb-1">P = 1 / (1 + e^-z)</p>
                <p className="text-[10px] text-muted-foreground">Mengonversi skor Z menjadi skala 0.0 hingga 1.0</p>
              </div>
              <div className="hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2 z-10 bg-background rounded-full p-1 border text-muted-foreground">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
            
            {/* Step 3: Probabilitas */}
            <div className={`rounded-xl border p-4 ${isSuspect ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className={`mb-2 text-[10px] font-semibold uppercase ${isSuspect ? 'text-red-500' : 'text-green-600'}`}>Tahap 3 — Keputusan Final</p>
              <div className="flex flex-col h-full justify-center pb-4">
                <p className="text-xs text-muted-foreground">Nilai Probabilitas (P):</p>
                <p className={`text-2xl font-bold font-mono ${isSuspect ? 'text-red-600' : 'text-green-600'}`}>
                  {math.probabilitas_p} <span className="text-sm font-normal text-muted-foreground">({data.prob_tbc.toFixed(1)}%)</span>
                </p>
                <p className="text-[10px] mt-2 text-muted-foreground">Batas Threshold = {math.threshold}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-primary/80">
              <b>Keterangan:</b> {math.keterangan}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}