import axios from "axios";
import { getActiveToken } from "./auth.services"; 

export interface MathDetailsSigmoid {
  aktivasi: string;
  probabilitas_p: number;
  raw_logit_z: number;
  threshold: number;
  rumus: string;
  keterangan: string;
}

export interface SkriningData {
  skrining_id?: number;
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api_flask";
      const response = await axios.post(`${API_URL}/skrining/audio/preview`, formData, {
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

  // TAHAP 2: Eksekusi Deteksi AI dengan Base64
  static async deteksiAI(
    audioBase64: string,
    model: "cnn" | "densenet",
    skriningId: number | string
  ): Promise<SkriningResponse> {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api_flask";
      const payload = {
        skrining_id: Number(skriningId),
        model: model,
        audio_base64: audioBase64
      };

      const response = await axios.post(`${API_URL}/skrining/audio/detect`, payload, {
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
}