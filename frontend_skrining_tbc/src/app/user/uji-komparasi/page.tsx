"use client"

import { useState, useRef, Suspense } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSearchParams, useRouter } from "next/navigation"
import { Upload, Mic, Search, X, Loader2, FileImage, Activity, Scissors, AlertTriangle, Plus, LayoutDashboard } from "lucide-react"
import { SkriningSuaraService, DualEvaluationResponse } from "@/app/services/skrining-suara.services"

function UjiKomparasiContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const skriningId = searchParams.get("skriningId")
  const pasienId = searchParams.get("pasienId")
  const [activeTab, setActiveTab] = useState<"upload" | "record">("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  
  // State untuk proses Crop & Hasil
  const [isCropping, setIsCropping] = useState(false)
  const [croppedAudioBase64, setCroppedAudioBase64] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<DualEvaluationResponse["data"] | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const hasAudio = (activeTab === "upload" && uploadedFile !== null) || (activeTab === "record" && recordedBlob !== null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      resetState()
    }
  }

  async function toggleRecord() {
    if (!isRecording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = () => {
        setRecordedBlob(new Blob(chunksRef.current, { type: "audio/webm" }))
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      setIsRecording(true)
      resetState()
    } else {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    }
  }

  function resetState() {
    setCroppedAudioBase64(null)
    setResult(null)
    setErrorMsg(null)
  }

  // TAHAP 1: EKSTRAK AUDIO (0.5 DETIK)
  async function handleCropAudio() {
    const audioData = activeTab === "upload" ? uploadedFile : recordedBlob
    if (!audioData) return

    setIsCropping(true)
    setErrorMsg(null)
    
    const fileName = activeTab === "upload" ? uploadedFile?.name || "upload.wav" : "rekaman_langsung.webm"

    try {
      const response = await SkriningSuaraService.previewCrop(audioData, fileName)
      if (response.data?.audio_base64) {
        setCroppedAudioBase64(response.data.audio_base64)
      } else {
        setErrorMsg(response.message || "Gagal mengekstrak potongan suara.")
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan sistem saat memotong suara.")
    } finally {
      setIsCropping(false)
    }
  }

  // TAHAP 2: EKSEKUSI 2 MODEL AI
  async function handleEksekusiKomparasi() {
    if (!skriningId) {
      setErrorMsg("ID Skrining tidak ditemukan. Isi form dahulu.");
      return;
    }
    if (!croppedAudioBase64) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const evalRes = await SkriningSuaraService.evaluateDualAI(croppedAudioBase64, skriningId)
      if (evalRes.data) {
        setResult(evalRes.data)
      } else {
        setErrorMsg(evalRes.message || "Gagal melakukan komparasi model.")
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan komputasi di server AI.")
    } finally {
      setIsProcessing(false)
    }
  }

  function handleBuatSkriningBaru() {
    router.push(`/user/screening?pasienId=${pasienId}`)
  }

  function handleKeDashboard() {
    router.push(`/user/evaluasi`)
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Benchmarking Model AI</h1>
        <p className="text-sm text-muted-foreground mt-1">Evaluasi performa CNN vs DenseNet-121 secara simultan pada potongan batuk (0.5 detik).</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "record")}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="upload" className="flex-1"><Upload className="w-4 h-4 mr-2" /> Unggah File Uji</TabsTrigger>
              <TabsTrigger value="record" className="flex-1"><Mic className="w-4 h-4 mr-2" /> Rekam Langsung</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              {!uploadedFile ? (
                <div className="border-2 border-dashed border-border rounded-xl py-10 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Klik untuk memilih file audio</p>
                  <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
                </div>
              ) : (
                <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                  <span className="text-sm font-medium">{uploadedFile.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => { setUploadedFile(null); resetState(); }}><X className="w-4 h-4" /></Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="record" className="text-center py-6">
               <Button variant={isRecording ? "destructive" : "secondary"} className="rounded-full w-20 h-20" onClick={toggleRecord}>
                 {isRecording ? <span className="w-6 h-6 bg-white rounded-sm animate-pulse" /> : <Mic className="w-8 h-8" />}
               </Button>
               {recordedBlob && !isRecording && <p className="mt-4 text-sm text-green-600 font-medium">Rekaman tersimpan.</p>}
            </TabsContent>
          </Tabs>

          {/* TOMBOL CROP */}
          {!croppedAudioBase64 && (
            <Button 
              className="w-full mt-6" size="lg" 
              disabled={!hasAudio || isCropping} 
              onClick={handleCropAudio}
            >
              {isCropping ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengekstrak Suara...</> : <><Scissors className="w-4 h-4 mr-2" /> Ekstrak Puncak Batuk</>}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ERROR MESSAGE */}
      {errorMsg && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* PREVIEW POTONGAN AUDIO & TOMBOL EVALUASI */}
      {croppedAudioBase64 && !result && (
        <Card className="border-primary shadow-sm bg-primary/5 animate-in fade-in slide-in-from-bottom-4">
          <CardContent className="pt-5 space-y-6">
             <div className="bg-background p-4 rounded-xl border border-primary/20">
               <p className="text-sm text-muted-foreground mb-3 font-medium">
                 Validasi Potongan Suara: Pastikan ini adalah suara puncak batuk.
               </p>
               <audio controls src={croppedAudioBase64} className="w-full h-12 outline-none" />
             </div>
             
             <Button 
               size="lg" 
               className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md"
               disabled={isProcessing} 
               onClick={handleEksekusiKomparasi}
             >
               {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menjalankan Komputasi Ganda...</> : <><Search className="w-4 h-4 mr-2" /> Jalankan Evaluasi Komparasi</>}
             </Button>
          </CardContent>
        </Card>
      )}

      {/* HASIL EVALUASI */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* KARTU CNN */}
            <Card className="border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white shadow-sm">
              <CardContent className="pt-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4 border-b border-blue-100 pb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <h3 className="text-base font-extrabold text-blue-900 uppercase tracking-wider">Custom CNN</h3>
                </div>

                {/* Spektrogram (Persegi) */}
                <div className="bg-slate-900 p-2 rounded-xl mb-5 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.cnn.spectrogram_image} alt="Spectrogram CNN" className="w-full aspect-square object-contain rounded-lg border border-slate-700" />
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500 font-medium">Probabilitas</span>
                    <span className="font-mono text-base font-bold text-slate-800">{result.cnn.probabilitas.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium">Prediksi Akhir</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.cnn.diagnosis === "Suspek TBC" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {result.cnn.diagnosis}
                    </span>
                  </div>
                </div>

                {/* Metrik CNN */}
                <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-blue-100">
                  <div className="bg-blue-100/50 rounded-lg p-2 text-center border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">RMSE</p>
                    <p className="text-sm font-mono font-bold text-blue-900">{result.cnn.metrics?.rmse ?? "-"}</p>
                  </div>
                  <div className="bg-blue-100/50 rounded-lg p-2 text-center border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">MAE</p>
                    <p className="text-sm font-mono font-bold text-blue-900">{result.cnn.metrics?.mae ?? "-"}</p>
                  </div>
                  <div className="bg-blue-100/50 rounded-lg p-2 text-center border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">MSE</p>
                    <p className="text-sm font-mono font-bold text-blue-900">{result.cnn.metrics?.mse ?? "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KARTU DENSENET */}
            <Card className="border border-purple-200 bg-gradient-to-b from-purple-50/50 to-white shadow-sm">
              <CardContent className="pt-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4 border-b border-purple-100 pb-3">
                  <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                  <h3 className="text-base font-extrabold text-purple-900 uppercase tracking-wider">DenseNet-121</h3>
                </div>

                {/* Spektrogram (Persegi) */}
                <div className="bg-slate-900 p-2 rounded-xl mb-5 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.densenet.spectrogram_image} alt="Spectrogram DenseNet" className="w-full aspect-square object-contain rounded-lg border border-slate-700" />
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500 font-medium">Probabilitas</span>
                    <span className="font-mono text-base font-bold text-slate-800">{result.densenet.probabilitas.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium">Prediksi Akhir</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.densenet.diagnosis === "Suspek TBC" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {result.densenet.diagnosis}
                    </span>
                  </div>
                </div>

                {/* Metrik DenseNet */}
                <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-purple-100">
                  <div className="bg-purple-100/50 rounded-lg p-2 text-center border border-purple-100">
                    <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-0.5">RMSE</p>
                    <p className="text-sm font-mono font-bold text-purple-900">{result.densenet.metrics?.rmse ?? "-"}</p>
                  </div>
                  <div className="bg-purple-100/50 rounded-lg p-2 text-center border border-purple-100">
                    <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-0.5">MAE</p>
                    <p className="text-sm font-mono font-bold text-purple-900">{result.densenet.metrics?.mae ?? "-"}</p>
                  </div>
                  <div className="bg-purple-100/50 rounded-lg p-2 text-center border border-purple-100">
                    <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-0.5">MSE</p>
                    <p className="text-sm font-mono font-bold text-purple-900">{result.densenet.metrics?.mse ?? "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* TOMBOL NAVIGASI SETELAH EVALUASI SELESAI */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border mt-6">
            <Button 
              variant="outline" 
              size="lg" 
              className="flex-1 gap-2"
              onClick={handleKeDashboard}
            >
              <LayoutDashboard className="w-4 h-4" />
              Lihat Dashboard Evaluasi
            </Button>
            <Button 
              size="lg" 
              className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleBuatSkriningBaru}
            >
              <Plus className="w-4 h-4" />
              Tambah Skrining Baru (Pasien Ini)
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UjiKomparasiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat halaman komparasi...
          </div>
        </div>
      }
    >
      <UjiKomparasiContent />
    </Suspense>
  )
}