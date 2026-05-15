import api from "./api"; 
import axios from "axios";
import { getActiveToken } from "./auth.services"; 

export interface SkriningData {
  skrining_id?: number;
  hasil_deteksi_akhir: string;
  probabilitas_tbc: number;
  gradcam_image: string;
}

export interface SkriningResponse {
  status: "success" | "error" | "fail";
  message?: string;
  data?: SkriningData;
}

export class SkriningSuaraService {
  static async deteksi(
    audioData: File | Blob,
    fileName: string,
    model: "cnn" | "densenet" = "cnn",
    skriningId?: number | string
  ): Promise<SkriningResponse> {
    
    // Validasi super ketat agar tidak ditolak Flask
    if (!skriningId || skriningId === "0" || skriningId === 0) {
        return {
            status: "error",
            message: "ID Skrining tidak valid. Harap isi form gejala terlebih dahulu."
        };
    }

    // Siapkan data biner untuk dikirim ke backend
    const formData = new FormData();
    formData.append("audio", audioData, fileName);
    formData.append("model", model);
    formData.append("skrining_id", String(skriningId));

    try {
      // Ambil token sesi aktif milik User/Kader
      const token = getActiveToken();
      if (!token) {
        throw new Error("Sesi telah habis. Silakan login kembali.");
      }

      // Gunakan axios murni untuk menghindari default header dari api.ts
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api_flask";
      const response = await axios.post(`${API_URL}/skrining/audio`, formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          // Biarkan axios otomatis menambahkan Content-Type: multipart/form-data beserta boundary-nya
        },
      });

      return response.data;
      
    } catch (error: any) {
      console.error("API Error AI Suara:", error);
      
      // Menangkap pesan error spesifik dari Flask (misal: "Suara terlalu pelan")
      const errorMessage = error.response?.data?.message || error.message || "Gagal memproses AI Suara.";
      
      return {
        status: "error",
        message: errorMessage,
      };
    }
  }
}