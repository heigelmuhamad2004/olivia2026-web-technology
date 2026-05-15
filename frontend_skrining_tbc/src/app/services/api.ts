// src/api.ts (atau sesuai lokasimu)
import axios from "axios";

// 1. KITA GUNAKAN RELATIVE PATH "/api_flask"
// Jika di-hosting di Vercel/Ngrok, ini otomatis akan gabung dengan domain public-nya
// Contoh: https://implosive-rope.ngrok-free.dev/api_flask
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api_flask";

const api = axios.create({
  baseURL: API_URL,
  // Dihapus Content-Type: application/json agar FormData bisa menggunakan multipart/form-data otomatis
});

export default api;