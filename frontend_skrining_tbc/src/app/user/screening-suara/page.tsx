"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Upload, Mic, Search, Music, X, Loader2, AlertTriangle, CheckCircle 
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const skriningId = searchParams.get("skriningId")
  const pasienId = searchParams.get("pasienId")
  
  const [activeTab, setActiveTab] = useState<"upload" | "record">("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedDuration, setRecordedDuration] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm>("cnn")

  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null)
  const [recordPreviewUrl, setRecordPreviewUrl] = useState<string | null>(null)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // STATE UNTUK ALUR UX BARU
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
    if (file) setUploadedFile(file)
  }

  function clearFile() {
    setUploadedFile(null)
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
  }

  // 1. TAHAP PEMANGGILAN API
  async function handleDeteksi() {
    if (!skriningId) {
      setErrorMsg("ID Skrining tidak ditemukan. Silakan isi form skrining kesehatan terlebih dahulu.")
      return
    }

    const audioData = activeTab === "upload" ? uploadedFile : recordedBlob
    if (!audioData) return

    setIsAnalyzing(true)
    setErrorMsg(null)
    setShowSuccessDialog(false)
    setPendingResult(null)
    setShowLayerAnimation(false) // Reset animasi

    const fileName = activeTab === "upload" ? uploadedFile?.name || "upload.wav" : "rekaman_langsung.webm"

    try {
      const response = await SkriningSuaraService.deteksi(audioData, fileName, selectedAlgo, skriningId)

      // ✅ PERBAIKAN: Cek data, bukan status string "success" yang kaku
      if (response.data) {
        setPendingResult(response.data)
        // LANJUT KE ANIMASI (Jangan tampilkan pesan apapun dulu)
        setShowLayerAnimation(true) 
      } else {
        // Jika benar-benar gagal (misal: suara tidak terbaca)
        setErrorMsg(response.message || "Gagal mendeteksi suara dari server.")
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan sistem saat menghubungi server AI.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 2. TAHAP SETELAH ANIMASI SELESAI
  function handleAnimationComplete() {
    setShowLayerAnimation(false) // Tutup animasi per layer
    setIsProcessingResult(true)  // Jalankan Loading "Memproses hasil..."

    // Beri jeda dramatis 2 detik agar terlihat AI sedang menyusun laporan
    setTimeout(() => {
      setIsProcessingResult(false)
      setShowSuccessDialog(true) // Tampilkan Popup Cantik
    }, 2000)
  }

  // 3. TAHAP REDIRECT DARI POPUP
  function goToResult() {
    router.push(`/user/hasil-screening?pasienId=${pasienId}&skriningId=${skriningId}`)
  }

  function formatTime(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6 relative">
      <div>
        <h1 className="text-2xl font-medium text-foreground">Deteksi Suara AI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unggah atau rekam suara batuk, lalu pilih algoritma untuk mendeteksi indikasi TBC.
        </p>
      </div>

      {/* Step 1: Sumber suara */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center font-semibold">
              1
            </span>
            Sumber suara
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
                  {uploadPreviewUrl && <audio controls src={uploadPreviewUrl} className="w-full h-10" />}
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
                  {recordPreviewUrl && <audio controls src={recordPreviewUrl} className="w-full h-10" />}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Step 2: Pilih algoritma */}
      <Card className={cn("transition-opacity", !hasAudio && "opacity-40 pointer-events-none")}>
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

      {/* Tombol deteksi */}
      <div className="flex justify-end">
        <Button size="lg" disabled={!hasAudio || isAnalyzing || showLayerAnimation || isProcessingResult} onClick={handleDeteksi} className="gap-2 min-w-[200px]">
          {isAnalyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Menganalisis AI...</>
          ) : (
            <><Search className="w-4 h-4" /> Mulai Skrining TBC</>
          )}
        </Button>
      </div>

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