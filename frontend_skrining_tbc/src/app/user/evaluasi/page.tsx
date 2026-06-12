"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, CalendarClock, Activity, Mic, ClipboardList, Stethoscope, Fingerprint, History, Calculator } from "lucide-react"
import api from "@/app/services/api"
import { getActiveToken } from "@/app/services/auth.services"
import { getRiwayatSkriningByPasien, SkriningRiwayat } from "@/app/services/skrining.services"

interface Pasien {
  id: number;
  nama: string;
  nik: string;
}

interface DualModelMetrics {
  cnn: { 
    probabilitas: number; 
    diagnosis: string; 
    spectrogram_image: string; 
    metrics?: { rmse: number; mae: number; mse: number }; 
  };
  densenet: { 
    probabilitas: number; 
    diagnosis: string; 
    spectrogram_image: string; 
    metrics?: { rmse: number; mae: number; mse: number }; 
  };
  metrics?: { rmse: number; mae: number; made?: number; mse?: number }; 
}

const formatTanggalJam = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  } catch {
    return dateString;
  }
}

export default function DashboardEvaluasi() {
  const [pasienList, setPasienList] = useState<Pasien[]>([])
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null)
  const [riwayat, setRiwayat] = useState<SkriningRiwayat[]>([])
  const [isLoadingPasien, setIsLoadingPasien] = useState(true)
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false)

  useEffect(() => {
    const fetchPasien = async () => {
      try {
        const token = getActiveToken()
        const res = await api.get('/pasien', { headers: { Authorization: `Bearer ${token}` } })
        const data = res.data.data || res.data
        setPasienList(data)
        if (data.length > 0) handleSelectPasien(data[0])
      } catch (error) {
        console.error("Gagal memuat pasien", error)
      } finally {
        setIsLoadingPasien(false)
      }
    }
    fetchPasien()
  }, [])

  const handleSelectPasien = async (pasien: Pasien) => {
    setSelectedPasien(pasien)
    setIsLoadingRiwayat(true)
    try {
      const data = await getRiwayatSkriningByPasien(pasien.id.toString())
      setRiwayat(data)
    } catch (error) {
      console.error("Gagal memuat riwayat", error)
      setRiwayat([])
    } finally {
      setIsLoadingRiwayat(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Evaluasi AI</h1>
          <p className="text-slate-500 mt-2 text-lg">Pantau komparasi algoritma dan bedah rumus perhitungan error secara langsung.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4">
            <Card className="shadow-md border-slate-200 sticky top-8">
              <CardHeader className="bg-slate-100/50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <User className="w-5 h-5 text-indigo-600" /> Daftar Pasien
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {isLoadingPasien ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <p className="text-sm">Memuat data...</p>
                    </div>
                  ) : (
                    pasienList.map((p) => (
                      <button
                        key={p.id} onClick={() => handleSelectPasien(p)}
                        className={`w-full text-left px-5 py-4 rounded-xl transition-all border ${
                          selectedPasien?.id === p.id 
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' 
                            : 'bg-white hover:bg-slate-50 hover:border-indigo-200 border-transparent text-slate-700'
                        }`}
                      >
                        <p className="font-semibold text-base truncate">{p.nama}</p>
                        <p className={`text-xs mt-1.5 flex items-center gap-1 ${selectedPasien?.id === p.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                          <Fingerprint className="w-3 h-3" /> NIK: {p.nik}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {isLoadingRiwayat ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-dashed border-slate-300">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500 font-medium">Mengambil riwayat skrining...</p>
              </div>
            ) : riwayat.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-dashed border-slate-300 text-center px-4">
                <History className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">Belum Ada Riwayat</h3>
                <p className="text-slate-500 mt-2 max-w-sm">Pasien ini belum pernah melakukan skrining suara maupun fisik.</p>
              </div>
            ) : (
              riwayat.map((item, index) => {
                const isSuspectForm = item.hasil_screening.toLowerCase() === "terduga";
                const dualData = item.detail_matematika as DualModelMetrics | undefined;
                const isDualModel = dualData && dualData.cnn !== undefined && dualData.densenet !== undefined;

                // Kunci Jawaban Asli (Ground Truth = y)
                const groundTruth = isSuspectForm ? 100 : 0;
                
                let cnnPred = "0", cnnAbs = "0", cnnSq = "0";
                let densePred = "0", denseAbs = "0", denseSq = "0";
                
                if (isDualModel && dualData) {
                  // Variabel CNN
                  cnnPred = dualData.cnn.probabilitas.toFixed(2);
                  cnnAbs = Math.abs(groundTruth - dualData.cnn.probabilitas).toFixed(2);
                  cnnSq = Math.pow(groundTruth - dualData.cnn.probabilitas, 2).toFixed(2);
                  
                  // Variabel DenseNet
                  densePred = dualData.densenet.probabilitas.toFixed(2);
                  denseAbs = Math.abs(groundTruth - dualData.densenet.probabilitas).toFixed(2);
                  denseSq = Math.pow(groundTruth - dualData.densenet.probabilitas, 2).toFixed(2);
                }

                return (
                  <Card key={item.id} className={`overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${isDualModel ? 'border-indigo-200' : 'border-slate-200'}`}>
                    
                    <div className={`px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isDualModel ? 'bg-indigo-50/50' : 'bg-slate-50/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${isDualModel ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          #{riwayat.length - index}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <CalendarClock className="w-4 h-4 text-slate-500" />
                            {formatTanggalJam(item.tanggal_screening)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`px-3 py-1 font-semibold ${isDualModel ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-white text-slate-600"}`}>
                        {item.metode_skrining || "Form Only"}
                      </Badge>
                    </div>

                    <CardContent className="p-6">
                      
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-slate-400" /> Hasil Form Fisik <span className="font-normal text-xs text-slate-400">(Kunci Asli)</span>
                        </span>
                        <Badge className={`px-4 py-1.5 text-sm ${isSuspectForm ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`} variant="secondary">
                          {item.hasil_screening}
                        </Badge>
                      </div>

                      {isDualModel && dualData && dualData.cnn && dualData.densenet ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <h3 className="text-sm font-extrabold flex items-center gap-2 text-indigo-900 tracking-wide uppercase">
                              <Activity className="w-4 h-4 text-indigo-600" /> Komparasi Model AI
                            </h3>
                            <div className="h-px bg-slate-200 flex-1"></div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* ===================== CARD CNN ===================== */}
                            <div className="relative border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white rounded-2xl p-5 flex flex-col shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                <p className="text-sm font-extrabold text-blue-900 uppercase tracking-wider">Custom CNN</p>
                              </div>
                              
                              <div className="bg-slate-900 p-2 rounded-xl mb-5 shadow-inner">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={dualData.cnn.spectrogram_image} alt="CNN Spectrogram" className="w-full aspect-square object-contain rounded-lg border border-slate-700" />
                              </div>

                              <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                  <span className="text-sm text-slate-500 font-medium">Probabilitas Tebakan</span>
                                  <span className="font-mono text-base font-bold text-slate-800">{cnnPred}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-slate-500 font-medium">Prediksi Akhir</span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${dualData.cnn.diagnosis === "Suspek TBC" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                                    {dualData.cnn.diagnosis}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Metrik Global */}
                              <div className="grid grid-cols-3 gap-2 mt-auto mb-4">
                                <div className="bg-blue-100/50 rounded-lg p-2 text-center border border-blue-100">
                                  <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">Global RMSE</p>
                                  <p className="text-sm font-mono font-bold text-blue-900">{dualData.cnn.metrics?.rmse ?? dualData.metrics?.rmse ?? "-"}</p>
                                </div>
                                <div className="bg-blue-100/50 rounded-lg p-2 text-center border border-blue-100">
                                  <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">Global MAE</p>
                                  <p className="text-sm font-mono font-bold text-blue-900">{dualData.cnn.metrics?.mae ?? dualData.metrics?.mae ?? "-"}</p>
                                </div>
                                <div className="bg-blue-100/50 rounded-lg p-2 text-center border border-blue-100">
                                  <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">Global MSE</p>
                                  <p className="text-sm font-mono font-bold text-blue-900">{dualData.cnn.metrics?.mse ?? dualData.metrics?.made ?? "-"}</p>
                                </div>
                              </div>

                              {/* Simulasi Rumus Eksplisit (CNN) */}
                              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-inner">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1 flex items-center gap-1">
                                  <Calculator className="w-3 h-3" /> Bedah Rumus Error (Instance)
                                </p>
                                <div className="font-mono text-[11px] leading-relaxed text-slate-700 space-y-3">
                                  
                                  {/* Definisi Variabel */}
                                  <div className="grid grid-cols-2 gap-2 text-slate-500">
                                    <div>Asli (<span className="italic">y</span>) = <span className="font-bold text-slate-800">{groundTruth}</span></div>
                                    <div>Tebakan (<span className="italic">ŷ</span>) = <span className="font-bold text-slate-800">{cnnPred}</span></div>
                                  </div>
                                  
                                  <div className="border-t border-dashed border-slate-200"></div>
                                  
                                  {/* Rumus Absolute Error */}
                                  <div className="bg-blue-50/50 p-2 rounded">
                                    <span className="font-bold text-blue-700 block mb-1">Abs Error (Komponen MAE)</span>
                                    = | <span className="italic">y</span> - <span className="italic">ŷ</span> | <br/>
                                    = | {groundTruth} - {cnnPred} | <br/>
                                    = <span className="font-bold text-blue-700 text-sm">{cnnAbs}</span>
                                  </div>
                                  
                                  {/* Rumus Squared Error */}
                                  <div className="bg-rose-50/50 p-2 rounded">
                                    <span className="font-bold text-rose-700 block mb-1">Sq Error (Komponen MSE)</span>
                                    = ( <span className="italic">y</span> - <span className="italic">ŷ</span> )² <br/>
                                    = ( {groundTruth} - {cnnPred} )² <br/>
                                    = <span className="font-bold text-rose-700 text-sm">{cnnSq}</span>
                                  </div>
                                  
                                </div>
                              </div>

                            </div>

                            {/* ===================== CARD DENSENET ===================== */}
                            <div className="relative border border-purple-200 bg-gradient-to-b from-purple-50/50 to-white rounded-2xl p-5 flex flex-col shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                                <p className="text-sm font-extrabold text-purple-900 uppercase tracking-wider">DenseNet-121</p>
                              </div>
                              
                              <div className="bg-slate-900 p-2 rounded-xl mb-5 shadow-inner">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={dualData.densenet.spectrogram_image} alt="DenseNet Spectrogram" className="w-full aspect-square object-contain rounded-lg border border-slate-700" />
                              </div>

                              <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                  <span className="text-sm text-slate-500 font-medium">Probabilitas Tebakan</span>
                                  <span className="font-mono text-base font-bold text-slate-800">{densePred}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-slate-500 font-medium">Prediksi Akhir</span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${dualData.densenet.diagnosis === "Suspek TBC" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                                    {dualData.densenet.diagnosis}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Metrik Global */}
                              <div className="grid grid-cols-3 gap-2 mt-auto mb-4">
                                <div className="bg-purple-100/50 rounded-lg p-2 text-center border border-purple-100">
                                  <p className="text-[9px] text-purple-600 font-bold uppercase tracking-wider mb-0.5">Global RMSE</p>
                                  <p className="text-sm font-mono font-bold text-purple-900">{dualData.densenet.metrics?.rmse ?? dualData.metrics?.rmse ?? "-"}</p>
                                </div>
                                <div className="bg-purple-100/50 rounded-lg p-2 text-center border border-purple-100">
                                  <p className="text-[9px] text-purple-600 font-bold uppercase tracking-wider mb-0.5">Global MAE</p>
                                  <p className="text-sm font-mono font-bold text-purple-900">{dualData.densenet.metrics?.mae ?? dualData.metrics?.mae ?? "-"}</p>
                                </div>
                                <div className="bg-purple-100/50 rounded-lg p-2 text-center border border-purple-100">
                                  <p className="text-[9px] text-purple-600 font-bold uppercase tracking-wider mb-0.5">Global MSE</p>
                                  <p className="text-sm font-mono font-bold text-purple-900">{dualData.densenet.metrics?.mse ?? dualData.metrics?.made ?? "-"}</p>
                                </div>
                              </div>

                              {/* Simulasi Rumus Eksplisit (DenseNet) */}
                              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-inner">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1 flex items-center gap-1">
                                  <Calculator className="w-3 h-3" /> Bedah Rumus Error (Instance)
                                </p>
                                <div className="font-mono text-[11px] leading-relaxed text-slate-700 space-y-3">
                                  
                                  {/* Definisi Variabel */}
                                  <div className="grid grid-cols-2 gap-2 text-slate-500">
                                    <div>Asli (<span className="italic">y</span>) = <span className="font-bold text-slate-800">{groundTruth}</span></div>
                                    <div>Tebakan (<span className="italic">ŷ</span>) = <span className="font-bold text-slate-800">{densePred}</span></div>
                                  </div>
                                  
                                  <div className="border-t border-dashed border-slate-200"></div>
                                  
                                  {/* Rumus Absolute Error */}
                                  <div className="bg-purple-50/50 p-2 rounded">
                                    <span className="font-bold text-purple-700 block mb-1">Abs Error (Komponen MAE)</span>
                                    = | <span className="italic">y</span> - <span className="italic">ŷ</span> | <br/>
                                    = | {groundTruth} - {densePred} | <br/>
                                    = <span className="font-bold text-purple-700 text-sm">{denseAbs}</span>
                                  </div>
                                  
                                  {/* Rumus Squared Error */}
                                  <div className="bg-rose-50/50 p-2 rounded">
                                    <span className="font-bold text-rose-700 block mb-1">Sq Error (Komponen MSE)</span>
                                    = ( <span className="italic">y</span> - <span className="italic">ŷ</span> )² <br/>
                                    = ( {groundTruth} - {densePred} )² <br/>
                                    = <span className="font-bold text-rose-700 text-sm">{denseSq}</span>
                                  </div>
                                  
                                </div>
                              </div>

                            </div>

                          </div>
                        </div>
                      ) : (
                        item.skor_suara_ai && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Stethoscope className="w-5 h-5 text-indigo-500" /> Prediksi Suara Tunggal
                              </span>
                              <Badge className={`px-4 py-1.5 ${item.skor_suara_ai > 50 ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                                {item.skor_suara_ai > 50 ? 'Suspek TBC' : 'Normal'}
                              </Badge>
                            </div>
                            <div className="bg-indigo-50/50 p-4 rounded-xl flex items-center justify-between border border-indigo-100">
                              <span className="text-sm font-medium text-indigo-900">Tingkat Probabilitas AI</span>
                              <span className="font-mono text-lg font-black text-indigo-700">{item.skor_suara_ai.toFixed(2)}%</span>
                            </div>
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
