import api from "./api"
import { getActiveToken } from "./auth.services"

export interface Rujukan {
    id: number
    skrining_id: number
    pasien_id: number
    status: "Pending" | "Terverifikasi" | "Ditolak"
    catatan: string | null
    created_at: string
    updated_at: string
    verified_by_user_id: number | null

    // Data Pasien Flattened
    pasien_nama: string
    pasien_nik: string
    pasien_alamat: string
    pasien_no_hp: string | null

    // Data Hasil Skrining
    hasil_deteksi: string
}

export const getRujukanByKecamatan = async (): Promise<Rujukan[]> => {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")

    const res = await api.get("/admin/rujukan", {
        headers: { Authorization: `Bearer ${token}` },
    })

    return res.data.data
}

export const verifyRujukan = async (id: number, catatan: string) => {
    const token = getActiveToken()
    if (!token) throw new Error("No active session token")

    const res = await api.put(
        `/admin/rujukan/verifikasi/${id}`,
        { catatan },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    )

    return res.data
}
