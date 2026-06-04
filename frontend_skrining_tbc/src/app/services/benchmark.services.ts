import axios from "axios";
import { getActiveToken } from "./auth.services";
import { MathDetailsSigmoid } from "./skrining-suara.services";

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

export class BenchmarkService {
  private static getHeaders() {
    const token = getActiveToken();
    if (!token) throw new Error("Sesi telah habis. Silakan login kembali.");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }

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
}