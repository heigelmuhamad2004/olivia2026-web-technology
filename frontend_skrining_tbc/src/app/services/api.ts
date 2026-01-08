import axios from "axios"

// Ganti URL ini jika backend Anda berjalan di port atau host yang berbeda
const API_URL = "tugasakhirskriningtbc-production.up.railway.app"

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export default api