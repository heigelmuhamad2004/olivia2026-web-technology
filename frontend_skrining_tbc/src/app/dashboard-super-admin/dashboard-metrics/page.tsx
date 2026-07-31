"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertOctagon, BarChart3, Database, BrainCircuit, Loader2, RefreshCcw, Target } from "lucide-react"

import { BenchmarkService } from "@/app/services/benchmark.services"

// --- INTERFACE DATA ---
interface ModelMetrics {
  rmse: number; mae: number; mse: number;
  tp: number; tn: number; fp: number; fn: number;
  accuracy: number; precision: number; recall: number; f1_score: number;
}

interface GlobalMetrics {
  total_pasien: number;
  total_suspek: number;
  cnn: ModelMetrics;
  densenet: ModelMetrics;
}

interface AnomalyRecord {
  id: number;
  nama: string;
  kunci_asli: string;
  prediksi_ai: string;
  model: "CNN" | "DenseNet";
  error_margin: number;
}

export default function DashboardMetricGlobal() {
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  
  const [metrics, setMetrics] = useState<GlobalMetrics>({
    total_pasien: 0, total_suspek: 0,
    cnn: { rmse: 0, mae: 0, mse: 0, tp: 0, tn: 0, fp: 0, fn: 0, accuracy: 0, precision: 0, recall: 0, f1_score: 0 },
    densenet: { rmse: 0, mae: 0, mse: 0, tp: 0, tn: 0, fp: 0, fn: 0, accuracy: 0, precision: 0, recall: 0, f1_score: 0 }
  })
  
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([])

  const fetchGlobalData = async () => {
    setIsLoading(true)
    try {
      const res = await BenchmarkService.getGlobalMetrics();
      if (res.status === "success" && res.metrics && res.anomalies) {
        setMetrics(res.metrics);
        setAnomalies(res.anomalies);
      }
      setLastUpdated(new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()))
    } catch (error) {
      console.error("Gagal memuat data", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchGlobalData() }, [])

  // Komponen pembantu untuk menampilkan Confusion Matrix Box
  const MatrixBox = ({ label, value, type }: { label: string, value: number, type: 'good' | 'bad' | 'neutral' }) => (
    <div className={`p-3 rounded-md border ${type === 'good' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : type === 'bad' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-secondary border-border text-foreground'}`}>
      <p className="text-[11px] font-mono uppercase opacity-80 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      
      {/* HEADER SUPER ADMIN (Sama seperti sebelumnya) */}
      <div className="bg-background border-b border-border pt-12 pb-12 px-6 sm:px-10">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <Badge variant="secondary" className="mb-4 font-mono text-[12px] bg-secondary text-secondary-foreground border-border pointer-events-none">Super Admin Access</Badge>
            <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-foreground leading-tight">Global AI Analytics.</h1>
            <p className="text-muted-foreground mt-3 text-[16px] max-w-2xl leading-relaxed">Pemantauan performa akumulatif model CNN & DenseNet pada populasi pasien di lapangan.</p>
          </div>
          <button onClick={fetchGlobalData} disabled={isLoading} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 h-10 rounded-full text-[14px] font-medium transition-all disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={2.5} /> {isLoading ? 'Memperbarui...' : 'Perbarui Data'}
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-8 space-y-8">
        
        {/* 1. KARTU METRIK UTAMA (Total Pasien, Suspek, RMSE) - Sama seperti sebelumnya */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* ... (Isi 4 Card Statistik Utama yang lama taruh di sini) ... */}
          <Card className="shadow-sm border border-border rounded-lg bg-card">
            <CardContent className="p-6">
              <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Total Skrining</p>
              <div className="flex justify-between items-end">
                <p className="text-[32px] font-semibold tracking-tight leading-none">{isLoading ? "-" : metrics.total_pasien}</p>
                <Database className="w-5 h-5 text-muted-foreground mb-1" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-border rounded-lg bg-card">
            <CardContent className="p-6">
              <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Total Suspek</p>
              <div className="flex justify-between items-end">
                <p className="text-[32px] font-semibold tracking-tight leading-none">{isLoading ? "-" : metrics.total_suspek}</p>
                <AlertOctagon className="w-5 h-5 text-destructive mb-1" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-border rounded-lg bg-card">
            <CardContent className="p-6">
              <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-wider mb-3">RMSE CNN</p>
              <div className="flex justify-between items-end">
                <p className="text-[32px] font-semibold tracking-tight leading-none">{isLoading ? "-" : metrics.cnn.rmse}%</p>
                <BrainCircuit className="w-5 h-5 text-blue-500 mb-1" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-border rounded-lg bg-card">
            <CardContent className="p-6">
              <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-wider mb-3">RMSE DenseNet</p>
              <div className="flex justify-between items-end">
                <p className="text-[32px] font-semibold tracking-tight leading-none">{isLoading ? "-" : metrics.densenet.rmse}%</p>
                <BrainCircuit className="w-5 h-5 text-purple-500 mb-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. CONFUSION MATRIX & CLASSIFICATION REPORT (BARU) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card Matrik CNN */}
          <Card className="shadow-sm border border-border">
            <CardHeader className="border-b border-border pb-4 bg-secondary/20">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500"/> Classification Report (CNN)
              </CardTitle>
              <CardDescription>Evaluasi biner berdasarkan Threshold 50%</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                 <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-2 text-center border-b pb-6">
                    <div><p className="text-[11px] text-muted-foreground uppercase mb-1">Accuracy</p><p className="font-semibold text-lg">{metrics.cnn.accuracy}%</p></div>
                    <div><p className="text-[11px] text-muted-foreground uppercase mb-1">Precision</p><p className="font-semibold text-lg">{metrics.cnn.precision}%</p></div>
                    <div><p className="text-[11px] text-muted-foreground uppercase mb-1">Recall</p><p className="font-semibold text-lg">{metrics.cnn.recall}%</p></div>
                    <div><p className="text-[11px] text-muted-foreground uppercase mb-1">F1-Score</p><p className="font-semibold text-lg text-blue-600">{metrics.cnn.f1_score}%</p></div>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium mb-3">Confusion Matrix</p>
                    <div className="grid grid-cols-2 gap-3">
                      <MatrixBox label="True Positive (TP)" value={metrics.cnn.tp} type="good" />
                      <MatrixBox label="False Positive (FP)" value={metrics.cnn.fp} type="bad" />
                      <MatrixBox label="False Negative (FN)" value={metrics.cnn.fn} type="bad" />
                      <MatrixBox label="True Negative (TN)" value={metrics.cnn.tn} type="good" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Matrik DenseNet */}
          <Card className="shadow-sm border border-border">
            <CardHeader className="border-b border-border pb-4 bg-secondary/20">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500"/> Classification Report (DenseNet)
              </CardTitle>
              <CardDescription>Evaluasi biner berdasarkan Threshold 50%</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                 <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-2 text-center border-b pb-6">
                    <div><p className="text-[11px] text-muted-foreground uppercase mb-1">Accuracy</p><p className="font-semibold text-lg">{metrics.densenet.accuracy}%</p></div>
                    <div><p className="text-[11px] text-muted-foreground uppercase mb-1">Precision</p><p className="font-semibold text-lg">{metrics.densenet.precision}%</p></div>
                    <div><p className="text-[11px] text-muted-foreground uppercase mb-1">Recall</p><p className="font-semibold text-lg">{metrics.densenet.recall}%</p></div>
                    <div><p className="text-[11px] text-muted-foreground uppercase mb-1">F1-Score</p><p className="font-semibold text-lg text-purple-600">{metrics.densenet.f1_score}%</p></div>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium mb-3">Confusion Matrix</p>
                    <div className="grid grid-cols-2 gap-3">
                      <MatrixBox label="True Positive (TP)" value={metrics.densenet.tp} type="good" />
                      <MatrixBox label="False Positive (FP)" value={metrics.densenet.fp} type="bad" />
                      <MatrixBox label="False Negative (FN)" value={metrics.densenet.fn} type="bad" />
                      <MatrixBox label="True Negative (TN)" value={metrics.densenet.tn} type="good" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 3. BAGIAN BAWAH: GRAFIK & ANOMALI (Sama seperti kode Anda sebelumnya) */}
        {/* ... Paste Div Grid yang berisi Card Deviasi Performa (MAE/RMSE) dan Card Tabel Anomali dari kode Anda di sini ... */}

      </div>
    </div>
  )
}