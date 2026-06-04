import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Activity, AlertTriangle, CheckCircle } from "lucide-react"
import { BenchmarkResultItem } from "@/app/services/benchmark.services"

interface Props {
  data: BenchmarkResultItem;
  audioBase64?: string; // Untuk memutar suara (opsional)
}

export function BenchmarkCard({ data, audioBase64 }: Props) {
  const isSuspect = data.diagnosis === "Suspek TBC";
  const title = data.iterasi ? `Iterasi ke-${data.iterasi}` : data.nama_pasien;

  return (
    <Card className={`border-2 transition-all hover:shadow-md ${isSuspect ? 'border-red-100' : 'border-green-100'}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header: Judul & Waktu */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-sm text-foreground">{title}</h3>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3" /> {data.waktu_eksekusi_ms} ms
            </div>
          </div>
          <Badge variant={isSuspect ? "destructive" : "default"} className={isSuspect ? "bg-red-500" : "bg-green-500"}>
            {data.diagnosis}
          </Badge>
        </div>

        {/* Spektrogram Image */}
        <div className="rounded-lg bg-muted flex justify-center p-1 border">
          {data.spectrogram_image ? (
             <img src={data.spectrogram_image} alt="Spektrogram" className="h-20 w-full object-cover rounded-md" />
          ) : (
             <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">No Image</div>
          )}
        </div>

        {/* Data Probabilitas */}
        <div className="flex justify-between items-center bg-secondary/30 p-2 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Probabilitas (Sigmoid)
          </div>
          <span className={`font-bold text-sm ${isSuspect ? 'text-red-600' : 'text-green-600'}`}>
            {data.probabilitas_ai.toFixed(2)}%
          </span>
        </div>

        {/* Audio Player (Jika dikirimkan) */}
        {audioBase64 && (
          <audio controls src={audioBase64} className="w-full h-8 outline-none mt-2" />
        )}
      </CardContent>
    </Card>
  )
}