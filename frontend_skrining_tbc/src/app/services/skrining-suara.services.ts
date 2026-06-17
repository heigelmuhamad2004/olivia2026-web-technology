import { getActiveToken } from "./auth.services"; 
import api from "./api";

export interface MathDetailsSigmoid {
  aktivasi: string;
  probabilitas_p: number;
  raw_logit_z: number;
  threshold: number;
  rumus: string;
  keterangan: string;
}

export interface SkriningRiwayat {
  id: number;
  tanggal_screening: string;
  hasil_screening: string;
  metode_skrining?: string;
  skor_suara_ai?: number;
  
  detail_matematika?: {
    cnn?: { probabilitas: number; diagnosis: string; spectrogram_image: string; metrics: { rmse: number; mae: number; mse: number } };
    densenet?: { probabilitas: number; diagnosis: string; spectrogram_image: string; metrics: { rmse: number; mae: number; mse: number } };
    
    aktivasi?: string;
    probabilitas_p?: number;
    raw_logit_z?: number;
    threshold?: number;
    rumus?: string;
    keringan?: string;
  } | null; 
}

export interface SkriningData {
  skrining_id?: number | string;
  hasil_deteksi_akhir?: string;
  probabilitas_tbc?: number;
  spectrogram_image?: string;
  file_suara_url?: string;
  math_details?: MathDetailsSigmoid;
  audio_base64?: string;
}

export interface SkriningResponse {
  status: "success" | "error" | "fail";
  message?: string;
  data?: SkriningData;
  audio_base64?: string; // Khusus untuk response preview
}

export interface DualEvaluationResponse {
  status: "success" | "error" | "fail";
  message?: string;
  data?: {
    cnn: { probabilitas: number; diagnosis: string; spectrogram_image: string; metrics: { rmse: number; mae: number; mse: number } };
    densenet: { probabilitas: number; diagnosis: string; spectrogram_image: string; metrics: { rmse: number; mae: number; mse: number } };
  }
}

export class SkriningSuaraService {
  private static getHeaders() {
    const token = getActiveToken();
    if (!token) throw new Error("Sesi telah habis. Silakan login kembali.");
    return { Authorization: `Bearer ${token}` };
  }

  // TAHAP 1: Minta Backend memotong suara 1.2 detik
  static async previewCrop(
    audioData: File | Blob,
    fileName: string
  ): Promise<SkriningResponse> {
    const formData = new FormData();
    formData.append("audio", audioData, fileName);

    try {
      const response = await api.post(`/skrining/audio/preview`, formData, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error("Error Preview Audio:", error);
      return {
        status: "error",
        message: error.response?.data?.message || "Gagal memotong audio.",
      };
    }
  }

  // TAHAP 2: Eksekusi Deteksi AI dengan Base64 (Tanpa mengubah ID menjadi Number)
  static async deteksiAI(
    audioBase64: string,
    model: "cnn" | "densenet",
    skriningId: string | number
  ): Promise<SkriningResponse> {
    try {
      const payload = {
        skrining_id: skriningId, // <-- DIBIARKAN STRING UNTUK HASHIDS
        model: model,
        audio_base64: audioBase64
      };

      const response = await api.post(`/skrining/audio/detect`, payload, {
        headers: {
          ...this.getHeaders(),
          "Content-Type": "application/json"
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error Deteksi AI:", error);
      return {
        status: "error",
        message: error.response?.data?.message || "Gagal memproses analisis AI.",
      };
    }
  }

  // TAHAP 3: Eksekusi Evaluasi Ganda CNN + DenseNet (Tanpa mengubah ID menjadi Number)
  static async evaluateDualAI(audioBase64: string, skriningId: string | number): Promise<DualEvaluationResponse> {
    try {
      const payload = { 
        audio_base64: audioBase64,
        skrining_id: skriningId // <-- DIBIARKAN STRING UNTUK HASHIDS
      };
      const response = await api.post(`/skrining/audio/evaluate-dual`, payload, {
        headers: {
          ...this.getHeaders(),
          "Content-Type": "application/json"
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error Evaluasi Dual AI:", error);
      return { status: "error", message: error.response?.data?.message || "Gagal memproses komparasi AI." };
    }
  }
}