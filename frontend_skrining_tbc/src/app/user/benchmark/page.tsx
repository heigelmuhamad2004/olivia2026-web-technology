"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, PlayCircle, Upload } from "lucide-react"
import { BenchmarkService, BenchmarkResultItem } from "@/app/services/benchmark.services"
import { BenchmarkCard } from "@/components/BenchmarkCard"
// Opsional: Gunakan service previewCrop lama untuk mengubah audio menjadi Base64
import { SkriningSuaraService } from "@/app/services/skrining-suara.services"

export default function BenchmarkDashboard() {
  const [activeTab, setActiveTab] = useState("consistency")
  const [selectedAlgo, setSelectedAlgo] = useState<"cnn" | "densenet">("cnn")
  
  // State untuk Konsistensi
  const [testAudio, setTestAudio] = useState<File | null>(null)
  const [testAudioBase64, setTestAudioBase64] = useState<string | null>(null)
  const [iterations, setIterations] = useState(10)
  
  // State Eksekusi
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<BenchmarkResultItem[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 1. Convert File to Base64 (Untuk simplifikasi, kita pakai previewCrop agar langsung terpotong 1.2s)
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setTestAudio(file)
    setTestAudioBase64(null)
    
    try {
      // Pinjam fungsi crop dari Skrining Service agar file siap diuji
      const res = await SkriningSuaraService.previewCrop(file, file.name)
      if (res.data?.audio_base64) {
        setTestAudioBase64(res.data.audio_base64)
      }
    } catch (err) {
      setErrorMsg("Gagal mengkonversi audio.")
    }
  }

  // 2. Jalankan Uji Konsistensi
  async function runConsistencyTest() {
    if (!testAudioBase64) return
    setIsRunning(true)
    setErrorMsg(null)
    setResults([])

    const res = await BenchmarkService.runConsistency(testAudioBase64, selectedAlgo, iterations)
    
    if (res.status === "success" && res.data) {
      setResults(res.data.hasil_detail)
    } else {
      setErrorMsg(res.message || "Pengujian gagal.")
    }
    setIsRunning(false)
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Benchmark AI</h1>
        <p className="text-muted-foreground mt-1">Lakukan pengujian teknis (konsistensi dan variasi batch) pada model Deep Learning secara on-the-fly.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="consistency">Uji Konsistensi (1 File = Nx)</TabsTrigger>
          <TabsTrigger value="variation">Uji Variasi (Batch Files)</TabsTrigger>
        </TabsList>

        <TabsContent value="consistency" className="space-y-6">
          {/* Form Control */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
              
              {/* File Upload */}
              <div className="flex-1 w-full">
                <label className="text-sm font-semibold mb-2 block">1. File Suara Batuk</label>
                <div className="flex items-center gap-3">
                  <Input type="file" accept="audio/*" onChange={handleFileChange} className="bg-background" />
                  {testAudioBase64 && <span className="text-xs text-green-600 font-bold flex shrink-0">✅ Siap</span>}
                </div>
              </div>

              {/* Pilih Iterasi */}
              <div className="w-full md:w-32">
                <label className="text-sm font-semibold mb-2 block">2. Jumlah Loop</label>
                <Input type="number" min={2} max={50} value={iterations} onChange={(e) => setIterations(Number(e.target.value))} className="bg-background" />
              </div>

              {/* Pilih Model */}
              <div className="w-full md:w-48">
                <label className="text-sm font-semibold mb-2 block">3. Model AI</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  value={selectedAlgo} 
                  onChange={(e) => setSelectedAlgo(e.target.value as "cnn" | "densenet")}
                >
                  <option value="cnn">Custom CNN</option>
                  <option value="densenet">DenseNet-121</option>
                </select>
              </div>

              {/* Tombol Run */}
              <div className="w-full md:w-auto mt-6 md:mt-0">
                <Button size="lg" disabled={!testAudioBase64 || isRunning} onClick={runConsistencyTest} className="w-full gap-2">
                  {isRunning ? <Loader2 className="animate-spin w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  Mulai Pengujian
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Error & Loading */}
          {errorMsg && <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{errorMsg}</div>}
          {isRunning && <div className="text-center py-10 text-muted-foreground animate-pulse">Memproses {iterations} pengujian ke Server...</div>}

          {/* Result Grid (Tampilan untuk Dosen) */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Hasil Uji Konsistensi ({iterations} Iterasi)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((res, index) => (
                  <BenchmarkCard key={index} data={res} audioBase64={testAudioBase64 || undefined} />
                ))}
              </div>
            </div>
          )}

        </TabsContent>

        <TabsContent value="variation">
          <Card>
             <CardContent className="py-20 text-center text-muted-foreground">
                Bagian Uji Variasi (Batch Upload) bisa kita selesaikan setelah Uji Konsistensi ini berhasil!
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}