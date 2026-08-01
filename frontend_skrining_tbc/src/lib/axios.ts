import axios from "axios";
// Impor helper untuk mendapatkan token yang aktif
import { getActiveToken } from "@/app/services/auth.services";
// Ambil base URL dari environment variable, dengan fallback ke localhost
const baseURL = process.env.NEXT_PUBLIC_API_URL || "/api_flask";

const axiosInstance = axios.create({
  baseURL: baseURL,
});

/**
 * Interceptor ini akan berjalan sebelum setiap request dikirim.
 * Tujuannya adalah untuk mengambil token dari localStorage dan
 * menyisipkannya ke dalam header Authorization.
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Pastikan kode ini hanya berjalan di sisi client (browser)
    if (typeof window !== "undefined") {
      // Gunakan fungsi getActiveToken untuk konsistensi
      const token = getActiveToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;