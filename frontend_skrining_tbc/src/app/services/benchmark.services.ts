import axios from "axios";
import { getActiveToken } from "./auth.services";
import { MathDetailsSigmoid } from "./skrining-suara.services";

// ==========================================
// INTERFACE UNTUK BENCHMARK (UJI KONSISTENSI & VARIASI)
// ==========================================
export interface BenchmarkResultItem {
  iterasi?: number;
  nama_pasien?: string;
  diagnosis: string;
  probabilitas_ai: number;
  waktu_eksekusi_ms: number;
  spectrogram_image: string;
  math_details?: MathDetailsSigmoid;
}

export interface BenchmarkResponse {
  status: "success" | "error" | "fail";
  message?: string;
  data?: {
    model_digunakan: string;
    total_iterasi?: number;
    total_data?: number;
    hasil_detail: BenchmarkResultItem[];
  };
}

// ==========================================
// INTERFACE BARU UNTUK DASHBOARD METRIK GLOBAL
// ==========================================
export interface GlobalMetricsData {
  total_pasien: number;
  total_suspek: number;
  cnn: { rmse: number; mae: number; mse: number };
  densenet: { rmse: number; mae: number; mse: number };
}

export interface AnomalyRecord {
  id: number;
  nama: string;
  kunci_asli: string;
  prediksi_ai: string;
  model: "CNN" | "DenseNet";
  error_margin: number;
}

export interface GlobalMetricsResponse {
  status: "success" | "error" | "fail";
  message?: string;
  metrics?: GlobalMetricsData;
  anomalies?: AnomalyRecord[];
}

// ==========================================
// CLASS SERVICE UTAMA
// ==========================================
export class BenchmarkService {
  private static getHeaders() {
    const token = getActiveToken();
    if (!token) throw new Error("Sesi telah habis. Silakan login kembali.");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }

  // 1. Uji Konsistensi
  static async runConsistency(audioBase64: string, model: "cnn" | "densenet", iterations: number = 10): Promise<BenchmarkResponse> {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api_flask";
      const payload = { audio_base64: audioBase64, model, iterations };
      const response = await axios.post(`${API_URL}/benchmark/consistency`, payload, { headers: this.getHeaders() });
      return response.data;
    } catch (error: any) {
      return { status: "error", message: error.response?.data?.message || "Gagal menjalankan Uji Konsistensi." };
    }
  }

  // 2. Uji Variasi
  static async runVariation(audioList: { nama: string; audio_base64: string }[], model: "cnn" | "densenet"): Promise<BenchmarkResponse> {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api_flask";
      const payload = { audio_list: audioList, model };
      const response = await axios.post(`${API_URL}/benchmark/variation`, payload, { headers: this.getHeaders() });
      return response.data;
    } catch (error: any) {
      return { status: "error", message: error.response?.data?.message || "Gagal menjalankan Uji Variasi." };
    }
  }

  // 3. AMBIL DATA METRIK GLOBAL UNTUK DASHBOARD SUPER ADMIN
  static async getGlobalMetrics(): Promise<GlobalMetricsResponse> {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api_flask";
      // Pastikan path "/admin/metrics/global" ini sama persis dengan yang kamu tulis di routes Flask-mu
      const response = await axios.get(`${API_URL}/admin/metrics/global`, { 
        headers: this.getHeaders() 
      });
      return response.data;
    } catch (error: any) {
      console.error("Error Fetch Global Metrics:", error);
      return { 
        status: "error", 
        message: error.response?.data?.message || "Gagal mengambil data analitik global dari server." 
      };
    }
  }
}