"use client"

import { useState, useRef, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Mic, Search, Music, X, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SkriningSuaraService, SkriningData } from "@/app/services/skrining-suara.services"

// IMPORT KOMPONEN ANIMASI YANG BARU DIBUAT
// Sesuaikan path import dengan lokasi sebenarnya di proyekmu
import { LayerAnimation } from "@/components/LayerAnimation" 

type Algorithm = "cnn" | "densenet"

export default function DeteksiSuara() {
  const [activeTab, setActiveTab] = useState<"upload" | "record">("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedDuration, setRecordedDuration] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm>("cnn")

  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null)
  const [recordPreviewUrl, setRecordPreviewUrl] = useState<string | null>(null)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasilSkrining, setHasilSkrining] = useState<SkriningData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // STATE BARU UNTUK KONTROL ANIMASI
  const [showLayerAnimation, setShowLayerAnimation] = useState(false)
  const [currentLayerState, setCurrentLayerState] = useState<number>(0)

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
      // Mengubah pengaturan mic agar lebih mentah (raw audio)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
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

  async function handleDeteksi() {
    const audioData = activeTab === "upload" ? uploadedFile : recordedBlob;
    if (!audioData) return;

    // Reset State
    setIsAnalyzing(true)
    setHasilSkrining(null)
    setErrorMsg(null)
    
    // Mulai UI Animasi
    setShowLayerAnimation(true)
    setCurrentLayerState(0)

    const fileName = activeTab === "upload" ? uploadedFile?.name || "upload.wav" : "rekaman_langsung.webm";

    try {
      const response = await SkriningSuaraService.deteksi(audioData, fileName, selectedAlgo);

      if (response.status === "success" && response.data) {
        
        // --- LOGIKA SIMULASI JEDA ANIMASI ---
        // Kita membuat jeda agar user bisa menikmati animasi bergeraknya
        const totalLayers = selectedAlgo === "cnn" ? 4 : 5;
        
        for (let i = 1; i <= totalLayers; i++) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Berhenti 0.5 detik per kotak layer
          setCurrentLayerState(i);
        }
        
        // Jeda kecil sebelum kotak hasil akhir turun
        await new Promise(resolve => setTimeout(resolve, 300)); 
        // ------------------------------------

        setHasilSkrining(response.data)
      } else {
        setErrorMsg(response.message || "Gagal mendeteksi suara dari server.")
        setShowLayerAnimation(false)
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan sistem saat menghubungi server AI.")
      setShowLayerAnimation(false)
    } finally {
      setIsAnalyzing(false)
    }
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
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      {/* ... (Header dan Step 1 & 2 tetap SAMA PERSIS seperti sebelumnya) ... */}
      <div>
        <h1 className="text-2xl font-medium text-foreground">Deteksi Suara AI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unggah atau rekam suara batuk, lalu pilih algoritma untuk mendeteksi indikasi TBC.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center font-semibold">
              1
            </span>
            Sumber suara
          </p>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "upload" | "record")}
          >
            <TabsList className="w-full mb-4">
              <TabsTrigger value="upload" className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Unggah file
              </TabsTrigger>
              <TabsTrigger value="record" className="flex-1">
                <Mic className="w-4 h-4 mr-2" />
                Rekam langsung
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
                  <p className="text-sm font-medium text-foreground">
                    Klik atau seret file audio ke sini
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mendukung .mp3, .wav, .ogg, .flac — maks 50 MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
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
                      <p className="text-sm font-medium truncate text-foreground">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearFile} className="shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {uploadPreviewUrl && (
                    <audio 
                      controls 
                      src={uploadPreviewUrl} 
                      className="w-full h-10" 
                    />
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
                    isRecording
                      ? "border-destructive bg-destructive/10 animate-pulse"
                      : "border-primary bg-background hover:bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "transition-all",
                      isRecording
                        ? "w-5 h-5 rounded-sm bg-destructive"
                        : "w-6 h-6 rounded-full bg-primary"
                    )}
                  />
                </button>
                <p className="text-sm font-medium text-foreground">
                  {isRecording
                    ? "Sedang merekam batuk..."
                    : recordedBlob
                    ? "Rekaman selesai"
                    : "Tekan untuk mulai rekam"}
                </p>
                {isRecording && (
                  <p className="text-xs text-muted-foreground mt-1">{formatTime(seconds)}</p>
                )}
              </div>

              {recordedBlob && !isRecording && (
                <div className="flex flex-col gap-3 bg-muted rounded-lg px-4 py-3 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Mic className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Rekaman Suara Batuk</p>
                      <p className="text-xs text-muted-foreground">{recordedDuration} detik</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearRecord} className="shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {recordPreviewUrl && (
                    <audio 
                      controls 
                      src={recordPreviewUrl} 
                      className="w-full h-10" 
                    />
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className={cn("transition-opacity", !hasAudio && "opacity-40 pointer-events-none")}>
        <CardContent className="pt-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center font-semibold">
              2
            </span>
            Pilih algoritma deteksi
          </p>

          <div className="grid grid-cols-2 gap-3">
            {(["cnn", "densenet"] as Algorithm[]).map((algo) => (
              <button
                key={algo}
                onClick={() => setSelectedAlgo(algo)}
                className={cn(
                  "text-left rounded-xl border-[1.5px] p-4 transition-all",
                  selectedAlgo === algo
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-foreground uppercase">
                    {algo === "cnn" ? "CNN" : "DenseNet"}
                  </span>
                  <div className="flex items-center gap-2">
                    {algo === "cnn" && (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0">
                        Cepat
                      </Badge>
                    )}
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center",
                        selectedAlgo === algo
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {selectedAlgo === algo && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {algo === "cnn"
                    ? "Custom CNN 4-Layer. Sangat efisien dan akurat untuk mengenali pola suara batuk spesifik."
                    : "Dense Convolutional Network. Melakukan ekstraksi lapisan dalam (deep layer analysis)."}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!hasAudio || isAnalyzing}
          onClick={handleDeteksi}
          className="gap-2 min-w-[200px]"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menganalisis AI...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Mulai Skrining TBC
            </>
          )}
        </Button>
      </div>

      {/* --- MEMANGGIL KOMPONEN LAYER ANIMATION --- */}
      {showLayerAnimation && !hasilSkrining && !errorMsg && (
        <LayerAnimation 
          algoType={selectedAlgo} 
          currentLayer={currentLayerState} 
        />
      )}

      {/* Step 3: Hasil Skrining / Error */}
      {errorMsg && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {hasilSkrining && (
        <Card className="border-2 border-primary/20 bg-gradient-to-b from-background to-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-background rounded-full border shadow-sm mb-2">
                {hasilSkrining.diagnosis === "Suspek TBC" ? (
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Hasil Analisis ({hasilSkrining.algoritma})
                </p>
                <h3 className={cn(
                  "text-2xl font-bold",
                  hasilSkrining.diagnosis === "Suspek TBC" ? "text-orange-600 dark:text-orange-500" : "text-green-600 dark:text-green-500"
                )}>
                  {hasilSkrining.diagnosis}
                </h3>
              </div>

              <div className="bg-background rounded-lg border p-4 max-w-sm mx-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Tingkat Keyakinan AI:</span>
                  <span className="text-sm font-bold text-foreground">
                    {hasilSkrining.confidence.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-1000",
                      hasilSkrining.diagnosis === "Suspek TBC" ? "bg-orange-500" : "bg-green-500"
                    )}
                    style={{ width: `${hasilSkrining.confidence}%` }}
                  ></div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-4">
                Catatan: Hasil ini adalah skrining awal berbasis kecerdasan buatan dan bukan merupakan diagnosis medis final. Harap konsultasikan ke dokter untuk pemeriksaan lebih lanjut.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}