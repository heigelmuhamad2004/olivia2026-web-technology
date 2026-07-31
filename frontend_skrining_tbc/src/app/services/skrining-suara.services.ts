import axios from "axios";
import { getActiveToken } from "./auth.services"; 

export interface MathDetailsSigmoid {
  aktivasi?: string;
  probabilitas_p?: number;
  raw_logit_z?: number;
  vektor_klinis_scaled?: number[][];
}

export interface SkriningData {
  skrining_id?: string | number; // 🛡️ Menerima string
  hasil_deteksi_akhir?: string;
  skor_ai?: number;       
  metode_ai?: string;     
  spectrogram_image?: string;
  file_suara_url?: string;
}

export interface SkriningResponse {
  status: "success" | "error" | "fail";
  message?: string;
  data?: SkriningData;
  audio_base64?: string; 
}

export class SkriningSuaraService {
  private static getHeaders() {
    const token = getActiveToken();
    if (!token) throw new Error("Sesi telah habis. Silakan login kembali.");
    return { Authorization: `Bearer ${token}` };
  }

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

  static async deteksiAI(
    audioBase64: string,
    model: "cnn" | "densenet",
    skriningId: string | number // 🛡️ BISA STRING
  ): Promise<SkriningResponse> {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api_flask";
      
      const payload = {
        skrining_id: skriningId, // 🛡️ Kirim langsung (jangan di Number() kan)
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