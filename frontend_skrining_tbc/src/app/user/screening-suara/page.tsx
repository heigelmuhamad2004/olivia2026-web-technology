"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Upload, Mic, Search, Music, X, Loader2, AlertTriangle, CheckCircle, Scissors 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SkriningSuaraService, SkriningData } from "@/app/services/skrining-suara.services"
import { LayerAnimation } from "@/components/LayerAnimation"

// 👇 Import komponen Dialog untuk Popup cantik
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

type Algorithm = "cnn" | "densenet"

function DeteksiSuaraContent() {
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<"upload" | "record">("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedDuration, setRecordedDuration] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm>("cnn")

  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null)
  const [recordPreviewUrl, setRecordPreviewUrl] = useState<string | null>(null)

  // State untuk ID dari sessionStorage
  const [skriningId, setSkriningId] = useState<string | null>(null)
  const [pasienId, setPasienId] = useState<string | null>(null)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // STATE UNTUK ALUR UX BARU (2 TAHAP POTONG & DETEKSI)
  const [isCropping, setIsCropping] = useState(false)
  const [croppedAudioBase64, setCroppedAudioBase64] = useState<string | null>(null)

  // STATE UNTUK ANIMASI
  const [showLayerAnimation, setShowLayerAnimation] = useState(false)
  const [isProcessingResult, setIsProcessingResult] = useState(false) // Loading dramatis
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)   // Popup cantik
  const [pendingResult, setPendingResult] = useState<SkriningData | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [seconds, setSeconds] = useState(0)

  const hasAudio =
    (activeTab === "upload" && uploadedFile !== null) ||
    (activeTab === "record" && recordedBlob !== null)

  useEffect(() => {
    // Ambil ID dari sessionStorage saat komponen dimuat di client
    const sId = sessionStorage.getItem("currentSkriningId")
    const pId = sessionStorage.getItem("currentPasienId")
    setSkriningId(sId)
    setPasienId(pId)
  }, [])

  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile)
      setUploadPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setUploadPreviewUrl(null)
    }
  }, [uploadedFile])

  useEffect(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob)
      setRecordPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setRecordPreviewUrl(null)
    }
  }, [recordedBlob])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setCroppedAudioBase64(null) // Reset crop jika ganti file
    }
  }

  function clearFile() {
    setUploadedFile(null)
    setCroppedAudioBase64(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function toggleRecord() {
    if (!isRecording) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setRecordedBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      setIsRecording(true)
      setCroppedAudioBase64(null) // Reset crop saat mulai rekam baru
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      setRecordedDuration(seconds)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  function clearRecord() {
    setRecordedBlob(null)
    setRecordedDuration(0)
    setSeconds(0)
    setCroppedAudioBase64(null)
  }

  // ==========================================
  // TAHAP 1: MEMINTA BACKEND MEMOTONG AUDIO
  // ==========================================
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

  // ==========================================
  // TAHAP 2: DETEKSI AI MENGGUNAKAN AUDIO POTONGAN
  // ==========================================
  async function handleDeteksi() {
    if (!skriningId) {
      setErrorMsg("ID Skrining tidak ditemukan. Silakan isi form skrining kesehatan terlebih dahulu.")
      return
    }

    if (!croppedAudioBase64) return

    setIsAnalyzing(true)
    setErrorMsg(null)
    setShowSuccessDialog(false)
    setPendingResult(null)
    setShowLayerAnimation(false) // Reset animasi

    try {
      const response = await SkriningSuaraService.deteksiAI(croppedAudioBase64, selectedAlgo, skriningId)

      if (response.data) {
        setPendingResult(response.data)
        // LANJUT KE ANIMASI (Jangan tampilkan pesan apapun dulu)
        setShowLayerAnimation(true) 
      } else {
        // Jika benar-benar gagal
        setErrorMsg(response.message || "Gagal mendeteksi suara dari server.")
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan sistem saat menghubungi server AI.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 3. TAHAP SETELAH ANIMASI SELESAI
  function handleAnimationComplete() {
    setShowLayerAnimation(false) // Tutup animasi per layer
    setIsProcessingResult(true)  // Jalankan Loading "Memproses hasil..."

    // Beri jeda dramatis 2 detik agar terlihat AI sedang menyusun laporan
    setTimeout(() => {
      setIsProcessingResult(false)
      setShowSuccessDialog(true) // Tampilkan Popup Cantik
    }, 2000)
  }

  // 4. TAHAP REDIRECT DARI POPUP
  function goToResult() {
    // ID sudah ada di sessionStorage, jadi cukup navigasi
    router.push(`/user/hasil-screening`)
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6 relative">
      <div>
        <h1 className="text-2xl font-medium text-foreground">Deteksi Suara AI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unggah atau rekam suara batuk, verifikasi potongannya, lalu pilih algoritma untuk deteksi TBC.
        </p>
      </div>

      {/* Step 1: Sumber suara */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center font-semibold">
              1
            </span>
            Sumber suara mentah
          </p>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "record")}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="upload" className="flex-1">
                <Upload className="w-4 h-4 mr-2" /> Unggah file
              </TabsTrigger>
              <TabsTrigger value="record" className="flex-1">
                <Mic className="w-4 h-4 mr-2" /> Rekam langsung
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-0">
              {!uploadedFile ? (
                <div
                  className="border-2 border-dashed border-border rounded-xl py-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Klik atau seret file audio ke sini</p>
                  <input
                    ref={fileInputRef} type="file" accept="audio/*" className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3 bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{uploadedFile.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearFile} className="shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* Pemutar suara asli disembunyikan jika sudah di-crop agar user tidak bingung */}
                  {!croppedAudioBase64 && uploadPreviewUrl && (
                    <audio controls src={uploadPreviewUrl} className="w-full h-10" />
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="record" className="mt-0">
              <div className="text-center py-4">
                <button
                  onClick={toggleRecord}
                  className={cn(
                    "w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-3 transition-all",
                    isRecording ? "border-destructive bg-destructive/10 animate-pulse" : "border-primary bg-background hover:bg-primary/5"
                  )}
                >
                  <span className={cn("transition-all", isRecording ? "w-5 h-5 rounded-sm bg-destructive" : "w-6 h-6 rounded-full bg-primary")} />
                </button>
                <p className="text-sm font-medium text-foreground">
                  {isRecording ? "Sedang merekam batuk..." : recordedBlob ? "Rekaman selesai" : "Tekan untuk mulai rekam"}
                </p>
              </div>
              {recordedBlob && !isRecording && (
                <div className="flex flex-col gap-3 bg-muted rounded-lg px-4 py-3 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Mic className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Rekaman Suara Batuk</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearRecord} className="shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* Pemutar suara asli disembunyikan jika sudah di-crop */}
                  {!croppedAudioBase64 && recordPreviewUrl && (
                    <audio controls src={recordPreviewUrl} className="w-full h-10" />
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Step 2: Pilih algoritma */}
      <Card className={cn("transition-opacity", (!hasAudio || croppedAudioBase64) && "opacity-40 pointer-events-none")}>
        <CardContent className="pt-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center font-semibold">2</span>
            Pilih algoritma deteksi
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(["cnn", "densenet"] as Algorithm[]).map((algo) => (
              <button
                key={algo} onClick={() => setSelectedAlgo(algo)}
                className={cn("text-left rounded-xl border-[1.5px] p-4 transition-all", selectedAlgo === algo ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-foreground uppercase">{algo === "cnn" ? "CNN" : "DenseNet"}</span>
                  <div className="flex items-center gap-2">
                    {algo === "cnn" && <Badge variant="secondary" className="text-[10px] px-2 py-0">Cepat</Badge>}
                    <span className={cn("w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center", selectedAlgo === algo ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                      {selectedAlgo === algo && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ====================================================== */}
      {/* TOMBOL LOGIKA BERCABANG (CROP vs DETEKSI)              */}
      {/* ====================================================== */}
      
      {!croppedAudioBase64 ? (
        <div className="flex justify-end">
          <Button size="lg" disabled={!hasAudio || isCropping} onClick={handleCropAudio} className="gap-2 min-w-[200px]">
            {isCropping ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Mengekstrak Suara...</>
            ) : (
              <><Scissors className="w-4 h-4" /> Ekstrak Puncak Batuk</>
            )}
          </Button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
          {/* Step 3: Card Validasi */}
          <Card className="border-primary shadow-sm bg-primary/5">
            <CardContent className="pt-5">
              <p className="text-xs font-medium text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center font-semibold">3</span>
                Validasi Potongan Suara
              </p>
              <div className="bg-background p-4 rounded-xl border border-primary/20">
                <p className="text-sm text-muted-foreground mb-3">
                  Pastikan ini adalah suara puncak batuk (1.2 detik). Jika AI salah memotong, silakan <b>Hapus</b> (X) di Step 1 dan unggah/rekam ulang.
                </p>
                <audio controls src={croppedAudioBase64} className="w-full h-12 outline-none" />
              </div>
            </CardContent>
          </Card>

          {/* Tombol Deteksi AI */}
          <div className="flex justify-end">
            <Button 
              size="lg" 
              disabled={isAnalyzing || showLayerAnimation || isProcessingResult} 
              onClick={handleDeteksi} 
              className="gap-2 min-w-[200px] bg-green-600 hover:bg-green-700 text-white shadow-md"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menganalisis AI...</>
              ) : (
                <><Search className="w-4 h-4" /> Ya, Analisis Suara Ini</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Animasi Layering */}
      {showLayerAnimation && (
        <LayerAnimation algoType={selectedAlgo} onComplete={handleAnimationComplete} />
      )}

      {/* Efek Loading Dramatis Setelah Animasi */}
      {isProcessingResult && (
        <div className="mt-8 py-10 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Menyusun laporan hasil akhir...</p>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 flex items-center gap-3 animate-in fade-in mt-6">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* 🌟 POPUP CANTIK (DIALOG SHADCN) 🌟 */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md text-center flex flex-col items-center pt-10 pb-8 px-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Analisis Selesai!</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Suara batuk telah berhasil dianalisis menggunakan <b>{selectedAlgo.toUpperCase()}</b>. Data perhitungan matematika dan spektrogram telah disimpan ke sistem.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="w-full mt-6 sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto px-8" onClick={goToResult}>
              Lihat Hasil Skrining
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default function DeteksiSuara() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <DeteksiSuaraContent />
    </Suspense>
  )
}