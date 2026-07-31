import api from "./api"
import { getActiveToken } from "./auth.services"
import { type FormValues as CreatePatientFormValues } from "../user/screening-data/page"
import { isAxiosError } from "axios"
import CryptoJS from "crypto-js" // Import library pembuka gembok

const rawKey = process.env.NEXT_PUBLIC_AES_SECRET_KEY || "KunciCadangan123";
const SECRET_KEY = CryptoJS.enc.Utf8.parse(rawKey.substring(0, 16));

// FUNGSI UNTUK MEMBUKA GEMBOK
const decryptData = (encryptedText?: string) => {
    if (!encryptedText || encryptedText === "-") return encryptedText;
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY, {
            mode: CryptoJS.mode.ECB,
        });
        const originalText = decrypted.toString(CryptoJS.enc.Utf8);
        return originalText || encryptedText; // Jika gagal (string kosong), kembalikan aslinya
    } catch (e) {
        return encryptedText; 
    }
};

export interface Patient {
  id: string | number
  user_id: string | number
  kecamatan_id: number
  nama: string
  nik: string
  alamat: string
  tanggal_lahir: string
  usia: number
  jenis_kelamin: "Laki-Laki" | "Perempuan"
  no_hp: string
  pekerjaan: string
  nama_kecamatan?: string
  nama_kabupaten?: string
  nama_provinsi?: string
  total_screening?: number
}

export interface UpdatePatientData {
  nama: string
  nik: string
  no_hp: string
  alamat: string
  email?: string
  tanggal_lahir?: string
  pekerjaan?: string
}

export const getMyPatients = async (): Promise<Patient[]> => {
  try {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")
    const response = await api.get("/pasien", {
      headers: { Authorization: `Bearer ${token}` },
    })
    
    // 🛡️ BUKA GEMBOK ALAMAT DAN NO HP SEBELUM MASUK KE TABEL
    const decryptedData = response.data.data.map((pasien: any) => ({
        ...pasien,
        alamat: decryptData(pasien.alamat),
        no_hp: decryptData(pasien.no_hp)
    }));

    return decryptedData;
  } catch (error) {
    console.error("Gagal mengambil data pasien:", error)
    return []
  }
}

export const createPatient = async (formData: CreatePatientFormValues) => {
  try {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")

    const payload = {
      ...formData,
      tanggal_lahir:
        formData.tanggal_lahir instanceof Date
          ? formData.tanggal_lahir.toISOString().split("T")[0]
          : formData.tanggal_lahir,
      jenis_kelamin: formData.jenis_kelamin === "L" ? "Laki-Laki" : "Perempuan",
      usia: typeof formData.usia === "string" ? parseInt(formData.usia, 10) : formData.usia,
      kecamatan_id: formData.kecamatan_id ? parseInt(String(formData.kecamatan_id), 10) : null,
    }

    const response = await api.post("/pasien/create", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    
    // Buka gembok data yang baru di-create
    if (response.data && response.data.data) {
        response.data.data.alamat = decryptData(response.data.data.alamat);
        response.data.data.no_hp = decryptData(response.data.data.no_hp);
    }
    
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Gagal menambahkan pasien");
    }
    throw new Error("Terjadi kesalahan pada sistem");
  }
}

export const updatePatient = async (patientId: string | number, formData: UpdatePatientData) => {
  try {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")
    const response = await api.put(`/pasien/edit/${patientId}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    
    // Buka gembok data yang baru di-update
    if (response.data && response.data.data) {
        response.data.data.alamat = decryptData(response.data.data.alamat);
        response.data.data.no_hp = decryptData(response.data.data.no_hp);
    }
    
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Gagal memperbarui pasien");
    }
    throw new Error("Terjadi kesalahan pada sistem");
  }
}

export const deletePatient = async (patientId: string | number) => {
  try {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")
    const response = await api.delete(`/pasien/delete/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Gagal menghapus pasien");
    }
    throw new Error("Terjadi kesalahan pada sistem");
  }
}