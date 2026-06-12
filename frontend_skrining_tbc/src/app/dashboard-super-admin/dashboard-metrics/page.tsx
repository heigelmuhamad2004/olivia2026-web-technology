"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertOctagon, BarChart3, Database, BrainCircuit, Loader2, RefreshCcw } from "lucide-react"

import { BenchmarkService } from "@/app/services/benchmark.services"

// --- INTERFACE DATA ---
interface GlobalMetrics {
  total_pasien: number;
  total_suspek: number;
  cnn: { rmse: number; mae: number; mse: number };
  densenet: { rmse: number; mae: number; mse: number };
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
  
  // State untuk menyimpan data metrik (Saat ini berisi data DUMMY untuk demonstrasi UI)
  const [metrics, setMetrics] = useState<GlobalMetrics>({
    total_pasien: 0,
    total_suspek: 0,
    cnn: { rmse: 0, mae: 0, mse: 0 },
    densenet: { rmse: 0, mae: 0, mse: 0 }
  })
  
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([])

  // Fungsi untuk memuat data dari Backend (Simulasi)
  const fetchGlobalData = async () => {
    setIsLoading(true)
    try {
      // Panggil langsung dari service tanpa perlu atur axios dan token lagi
      const res = await BenchmarkService.getGlobalMetrics();

      if (res.status === "success" && res.metrics && res.anomalies) {
        setMetrics(res.metrics);
        setAnomalies(res.anomalies);
      } else {
        console.error("Gagal menarik metrik:", res.message);
      }

      setLastUpdated(new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()))
    } catch (error) {
      console.error("Gagal memuat data analitik global", error)
    } finally {
      setIsLoading(false)
    }
}

  useEffect(() => {
    fetchGlobalData()
  }, [])

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      
      {/* HEADER SUPER ADMIN */}
      <div className="bg-background border-b border-border pt-12 pb-12 px-6 sm:px-10">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <Badge variant="secondary" className="mb-4 font-mono text-[12px] bg-secondary text-secondary-foreground border-border pointer-events-none">
              Super Admin Access
            </Badge>
            <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-foreground leading-tight">
              Global AI Analytics.
            </h1>
            <p className="text-muted-foreground mt-3 text-[16px] max-w-2xl leading-relaxed">
              Pemantauan performa akumulatif model CNN & DenseNet pada populasi pasien di lapangan (Production).
            </p>
          </div>
          <button 
            onClick={fetchGlobalData} 
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 h-10 rounded-full text-[14px] font-medium transition-all disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={2.5} />
            {isLoading ? 'Memperbarui...' : 'Perbarui Data'}
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-8 space-y-8">
        
        {/* 1. KARTU METRIK UTAMA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="shadow-[0_1px_1px_rgba(0,0,0,0.05),0_2px_2px_rgba(0,0,0,0.1)] border border-border rounded-lg bg-card">
            <CardContent className="p-6">
              <div className="flex flex-col justify-between">
                <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Total Skrining</p>
                <div className="flex justify-between items-end">
                  <p className="text-[32px] font-semibold tracking-tight text-foreground leading-none">{isLoading ? "-" : metrics.total_pasien}</p>
                  <Database className="w-5 h-5 text-muted-foreground mb-1" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-[0_1px_1px_rgba(0,0,0,0.05),0_2px_2px_rgba(0,0,0,0.1)] border border-border rounded-lg bg-card">
            <CardContent className="p-6">
              <div className="flex flex-col justify-between">
                <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Total Suspek</p>
                <div className="flex justify-between items-end">
                  <p className="text-[32px] font-semibold tracking-tight text-foreground leading-none">{isLoading ? "-" : metrics.total_suspek}</p>
                  <AlertOctagon className="w-5 h-5 text-destructive mb-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[0_1px_1px_rgba(0,0,0,0.05),0_2px_2px_rgba(0,0,0,0.1)] border border-border rounded-lg bg-card">
            <CardContent className="p-6">
              <div className="flex flex-col justify-between">
                <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-wider mb-3">RMSE CNN</p>
                <div className="flex justify-between items-end">
                  <div className="flex items-end gap-1">
                    <p className="text-[32px] font-semibold tracking-tight text-foreground leading-none">{isLoading ? "-" : metrics.cnn.rmse}</p>
                    <span className="text-muted-foreground text-[16px] font-medium mb-0.5">%</span>
                  </div>
                  <BrainCircuit className="w-5 h-5 text-blue-500 mb-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[0_1px_1px_rgba(0,0,0,0.05),0_2px_2px_rgba(0,0,0,0.1)] border border-border rounded-lg bg-card">
            <CardContent className="p-6">
              <div className="flex flex-col justify-between">
                <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-wider mb-3">RMSE DenseNet</p>
                <div className="flex justify-between items-end">
                  <div className="flex items-end gap-1">
                    <p className="text-[32px] font-semibold tracking-tight text-foreground leading-none">{isLoading ? "-" : metrics.densenet.rmse}</p>
                    <span className="text-muted-foreground text-[16px] font-medium mb-0.5">%</span>
                  </div>
                  <BrainCircuit className="w-5 h-5 text-purple-500 mb-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. BAGIAN BAWAH: GRAFIK & ANOMALI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* KOMPARASI METRIK */}
          <Card className="shadow-[0_1px_1px_rgba(0,0,0,0.05),0_2px_2px_rgba(0,0,0,0.1)] border border-border rounded-lg bg-card flex flex-col">
            <CardHeader className="border-b border-border pb-4 px-6 pt-6">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2 text-foreground">
                <BarChart3 className="w-4 h-4 text-muted-foreground"/> Deviasi Performa Keseluruhan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-secondary/30 flex-1">
              {isLoading ? (
                <div className="h-full flex items-center justify-center min-h-[250px]">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* MAE */}
                  <div>
                    <div className="flex justify-between items-end border-b border-border pb-2 mb-4">
                      <span className="text-[14px] font-medium text-foreground">Mean Absolute Error (MAE)</span>
                      <span className="text-muted-foreground font-mono text-[12px]">Lower is better</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] w-16 text-muted-foreground font-mono uppercase">CNN</span>
                        <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(metrics.cnn.mae * 2, 100)}%` }}></div>
                        </div>
                        <span className="text-[14px] font-mono font-medium w-12 text-right text-foreground">{metrics.cnn.mae}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] w-16 text-muted-foreground font-mono uppercase">DenseNet</span>
                        <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(metrics.densenet.mae * 2, 100)}%` }}></div>
                        </div>
                        <span className="text-[14px] font-mono font-medium w-12 text-right text-foreground">{metrics.densenet.mae}</span>
                      </div>
                    </div>
                  </div>

                  {/* RMSE */}
                  <div>
                    <div className="flex justify-between items-end border-b border-border pb-2 mb-4">
                      <span className="text-[14px] font-medium text-foreground">Root Mean Squared Error (RMSE)</span>
                      <span className="text-muted-foreground font-mono text-[12px]">Penalti kesalahan fatal</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] w-16 text-muted-foreground font-mono uppercase">CNN</span>
                        <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(metrics.cnn.rmse * 2, 100)}%` }}></div>
                        </div>
                        <span className="text-[14px] font-mono font-medium w-12 text-right text-foreground">{metrics.cnn.rmse}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] w-16 text-muted-foreground font-mono uppercase">DenseNet</span>
                        <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${Math.min(metrics.densenet.rmse * 2, 100)}%` }}></div>
                        </div>
                        <span className="text-[14px] font-mono font-medium w-12 text-right text-foreground">{metrics.densenet.rmse}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TABEL ANOMALI */}
          <Card className="shadow-[0_1px_1px_rgba(0,0,0,0.05),0_2px_2px_rgba(0,0,0,0.1)] border border-border rounded-lg bg-card flex flex-col overflow-hidden">
            <CardHeader className="border-b border-border pb-4 px-6 pt-6">
              <CardTitle className="text-[16px] font-semibold flex items-center justify-between text-foreground">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-destructive"/> Deteksi Outlier (&gt; 50% Error)
                </div>
                <Badge variant="outline" className="font-mono text-[12px] bg-destructive/10 text-destructive border-destructive/20">
                  Perlu Evaluasi
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col bg-card">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead className="bg-secondary/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-[12px] font-mono uppercase text-muted-foreground tracking-wider">Pasien</th>
                      <th className="px-6 py-3 text-[12px] font-mono uppercase text-muted-foreground tracking-wider text-center">Fisik (Asli)</th>
                      <th className="px-6 py-3 text-[12px] font-mono uppercase text-muted-foreground tracking-wider text-center">Tebakan AI</th>
                      <th className="px-6 py-3 text-[12px] font-mono uppercase text-destructive tracking-wider text-right">Error Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[14px] text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Memuat data anomali...
                        </td>
                      </tr>
                    ) : anomalies.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[14px] text-muted-foreground">
                          Tidak ada tebakan AI yang meleset fatal.
                        </td>
                      </tr>
                    ) : (
                      anomalies.map((anomali) => (
                        <tr key={anomali.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-[14px] font-medium text-foreground">{anomali.nama}</p>
                            <p className="text-[12px] font-mono text-muted-foreground mt-0.5">Model: {anomali.model}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${anomali.kunci_asli === "Suspek TBC" ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                              {anomali.kunci_asli}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-[13px] font-mono text-foreground">{anomali.prediksi_ai}</td>
                          <td className="px-6 py-4 text-right text-[13px] font-mono font-semibold text-destructive">
                            {anomali.error_margin}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-secondary/30 border-t border-border flex justify-between items-center text-[12px] font-mono text-muted-foreground">
                <span>Diperbarui: {lastUpdated || "-"}</span>
                <span>Retraining dataset context.</span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}