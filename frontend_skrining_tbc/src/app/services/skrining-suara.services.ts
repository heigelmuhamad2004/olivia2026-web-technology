// 1. Definisikan bentuk kembalian dari Flask API
export interface SkriningData {
  diagnosis: "Suspek TBC" | "Normal";
  confidence: number;
  algoritma: string;
}

export interface SkriningResponse {
  status: "success" | "error";
  message?: string;
  data?: SkriningData;
}

export class SkriningSuaraService {
  private static readonly API_URL = "https://fabric-verbose-eloquent.ngrok-free.dev/api/skrining";

  static async deteksi(
    audioData: File | Blob,
    fileName: string,
    model: "cnn" | "densenet"
  ): Promise<SkriningResponse> {
    
    const formData = new FormData();
    formData.append("audio", audioData, fileName);
    formData.append("model", model);

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        body: formData,
        headers: {
          "ngrok-skip-browser-warning": "69420",
        },
      });

      const result: SkriningResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Terjadi kesalahan pada server");
      }

      return result;
    } catch (error: unknown) {
      console.error("API Error:", error);
      return {
        status: "error",
        message: error.message || "Gagal menghubungi server AI. Pastikan Colab menyala dan URL benar.",
      };
    }
  }
}