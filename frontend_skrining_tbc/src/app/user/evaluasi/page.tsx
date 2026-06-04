"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Calendar, Activity, FileImage, Mic, ClipboardList } from "lucide-react"
import api from "@/app/services/api"
import { getActiveToken } from "@/app/services/auth.services"
import { getRiwayatSkriningByPasien, SkriningRiwayat } from "@/app/services/skrining.services"

// Interface untuk data Pasien
interface Pasien {
  id: number;
  nama: string;
  nik: string;
  jenis_kelamin: string;
  usia: number;
}

export default function DashboardEvaluasi() {
  const [pasienList, setPasienList] = useState<Pasien[]>([])
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null)
  
  const [riwayat, setRiwayat] = useState<SkriningRiwayat[]>([])
  const [isLoadingPasien, setIsLoadingPasien] = useState(true)
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false)

  // 1. Ambil daftar pasien saat halaman dimuat
  useEffect(() => {
    const fetchPasien = async () => {
      try {
        const token = getActiveToken()
        const res = await api.get('/pasien', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = res.data.data || res.data
        setPasienList(data)
        
        // Pilih pasien pertama secara otomatis jika ada
        if (data.length > 0) {
          handleSelectPasien(data[0])
        }
      } catch (error) {
        console.error("Gagal memuat daftar pasien", error)
      } finally {
        setIsLoadingPasien(false)
      }
    }
    fetchPasien()
  }, [])

  // 2. Ambil riwayat saat pasien dipilih
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
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold text-foreground">Dashboard Evaluasi AI</h1>
        <p className="text-muted-foreground mt-1">
          Pantau konsistensi dan hasil deteksi algoritma (Form & Suara) berdasarkan riwayat data pasien.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        
        {/* ========================================= */}
        {/* SIDEBAR KIRI: DAFTAR PASIEN               */}
        {/* ========================================= */}
        <Card className="w-full md:w-1/3 lg:w-1/4 flex flex-col shadow-sm border-muted overflow-hidden">
          <div className="p-4 border-b bg-muted/30 shrink-0">
            <h2 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Daftar Pasien
            </h2>
          </div>
          {/* Scroll Area Manual */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingPasien ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : pasienList.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Belum ada data pasien.</div>
            ) : (
              <div className="p-2 space-y-1">
                {pasienList.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPasien(p)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      selectedPasien?.id === p.id 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <p className="font-medium text-sm truncate">{p.nama}</p>
                    <p className={`text-xs mt-1 ${selectedPasien?.id === p.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      NIK: {p.nik}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ========================================= */}
        {/* KONTEN KANAN: GRID CARD RIWAYAT SKRINING  */}
        {/* ========================================= */}
        <div className="flex-1 flex flex-col min-h-0 bg-muted/10 rounded-xl border border-muted p-4 sm:p-6 overflow-hidden">
          {selectedPasien && (
            <div className="mb-4 shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Data Skrining: {selectedPasien.nama}</h2>
                <p className="text-sm text-muted-foreground">Menampilkan seluruh riwayat pengujian untuk pasien ini.</p>
              </div>
              <Badge variant="outline" className="bg-white">{riwayat.length} Riwayat</Badge>
            </div>
          )}

          {/* Scroll Area Manual */}
          <div className="flex-1 overflow-y-auto pr-2">
            {isLoadingRiwayat ? (
              <div className="flex h-full items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : riwayat.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl border-muted">
                <ClipboardList className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
                <p className="font-medium">Tidak ada riwayat skrining</p>
                <p className="text-sm text-muted-foreground mt-1">Pasien ini belum pernah melakukan skrining form maupun suara.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-10">
                {riwayat.map((item, index) => {
                  const isSuspectForm = item.hasil_screening.toLowerCase() === "terduga";
                  const hasAudioAI = item.skor_suara_ai !== null && item.skor_suara_ai !== undefined;
                  const isSuspectVoice = hasAudioAI && item.skor_suara_ai! > 50;
                  
                  return (
                    <Card key={item.id} className="border-2 hover:border-primary/50 transition-colors shadow-sm">
                      <CardContent className="p-0">
                        {/* Header Card */}
                        <div className="flex justify-between items-center p-4 border-b bg-muted/20">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {riwayat.length - index}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              {item.tanggal_screening}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-semibold bg-white">
                            {item.metode_skrining || "Form Only"}
                          </Badge>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Hasil Form */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                              <ClipboardList className="w-4 h-4" /> Hasil Form Fisik
                            </span>
                            <Badge className={isSuspectForm ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-green-100 text-green-700 hover:bg-green-100"} variant="secondary">
                              {item.hasil_screening}
                            </Badge>
                          </div>

                          {/* Hasil AI Suara (Jika Ada) */}
                          {hasAudioAI ? (
                            <>
                              <hr className="border-dashed" />
                              
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                  <Mic className="w-4 h-4" /> Prediksi Suara AI
                                </span>
                                <span className={`font-bold text-sm ${isSuspectVoice ? 'text-red-600' : 'text-green-600'}`}>
                                  {isSuspectVoice ? 'Suspek TBC' : 'Normal'}
                                </span>
                              </div>

                              <div className="bg-secondary/30 p-3 rounded-lg flex items-center justify-between border">
                                <div className="flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-medium text-foreground">Probabilitas (Sigmoid)</span>
                                </div>
                                <span className={`font-mono font-bold ${isSuspectVoice ? 'text-red-600' : 'text-green-600'}`}>
                                  {item.skor_suara_ai?.toFixed(2)}%
                                </span>
                              </div>

                              {item.gradcam_image && (
                                <div className="space-y-2">
                                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <FileImage className="w-3.5 h-3.5" /> Pola Spektrogram
                                  </span>
                                  <div className="h-24 w-full rounded-md border bg-black/5 flex items-center justify-center overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                      src={item.gradcam_image} 
                                      alt="Spektrogram" 
                                      className="h-full w-auto object-cover"
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="bg-muted/40 p-4 rounded-lg text-center border border-dashed">
                              <p className="text-xs text-muted-foreground">Pasien tidak melakukan tes suara pada sesi ini.</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}