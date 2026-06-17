import api from "./api"

const isBrowser = () => typeof window !== "undefined"

interface RegisterData { nama: string; email: string; password: string }
interface LoginData { email: string; password: string; recaptcha_token?: string }

// REGISTER
export const registerUser = async (data: RegisterData) => {
  const response = await api.post("/auth/register", data)
  return response.data
}

// LOGIN
export const loginUser = async (data: LoginData) => {
  const response = await api.post("/auth/login", data)

  // localStorage hanya bisa digunakan di browser
  if (isBrowser() && response.data.access_token && response.data.id) {
    const userId = String(response.data.id)
    localStorage.setItem(`accessToken:${userId}`, response.data.access_token)
    localStorage.setItem("activeSessionId", userId)
  }

  return response.data
}

// GET ACTIVE TOKEN
export const getActiveToken = (): string | null => {
  if (!isBrowser()) return null   // FIX SSR
  const active = localStorage.getItem("activeSessionId")
  if (!active) return localStorage.getItem("accessToken") // Fallback legacy
  return localStorage.getItem(`accessToken:${active}`) || localStorage.getItem("accessToken")
}

// LOGOUT
export const logoutUser = async (sessionId?: string) => {
  if (!isBrowser()) return   // FIX SSR

  const sid = sessionId || localStorage.getItem("activeSessionId")

  const tokenKey = sid ? `accessToken:${sid}` : "accessToken"
  const token = localStorage.getItem(tokenKey) || localStorage.getItem("accessToken")

  try {
    if (token) {
      await api.post("/auth/logout", {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }
  } catch (error) {
    console.error("Gagal logout:", error)
  } finally {
    if (sid) {
      localStorage.removeItem(`accessToken:${sid}`)
    }
    localStorage.removeItem("accessToken") // Hapus token legacy

    if (sid && localStorage.getItem("activeSessionId") === sid) {
      const otherKey = Object.keys(localStorage).find(k => k.startsWith("accessToken:"))
      if (otherKey) {
        const nextId = otherKey.split(":")[1]
        localStorage.setItem("activeSessionId", nextId)
      } else {
        localStorage.removeItem("activeSessionId")
      }
    } else if (!sid) {
      localStorage.removeItem("activeSessionId")
    }
  }
}

// GET CURRENT USER
export const getCurrentUser = async () => {
  const token = getActiveToken()
  if (!token) throw new Error("No active session")

  const response = await api.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}
