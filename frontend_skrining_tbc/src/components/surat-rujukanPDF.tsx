import React, { forwardRef } from "react"

interface SuratRujukanProps {
    data: any // Sesuaikan dengan tipe data kamu
}

// Menggunakan forwardRef agar bisa ditarget oleh html2canvas
export const SuratRujukanPDF = forwardRef<HTMLDivElement, SuratRujukanProps>(({ data }, ref) => {
    if (!data) return null

    // Format Tanggal Indonesia
    const tglVerifikasi = data.rujukan_verified_at
        ? new Date(data.rujukan_verified_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
        : "-"

    return (
        <div
            ref={ref}
            className="p-8 font-serif w-[210mm] min-h-[297mm] mx-auto relative hidden-print"
            style={{ backgroundColor: "#ffffff", color: "#000000" }}
        >
            {/* STYLE KHUSUS SURAT: Gunakan style inline/Tailwind untuk layout kertas A4 */}

            {/* KOP SURAT */}
            <div
                className="border-b-4 border-double pb-4 mb-6 text-center"
                style={{ borderColor: "#000000" }}
            >
                <h3 className="text-lg font-bold uppercase">PEMERINTAH KABUPATEN {data.nama_kabupaten || "..."}</h3>
                <h2 className="text-xl font-bold uppercase">DINAS KESEHATAN</h2>
                <h1 className="text-2xl font-extrabold uppercase mt-1">UPT PUSKESMAS {data.nama_kecamatan || "..."}</h1>
                <p className="text-sm mt-1 italic">Alamat: Kantor Kecamatan {data.nama_kecamatan}, Kabupaten {data.nama_kabupaten}</p>
            </div>

            {/* JUDUL SURAT */}
            <div className="text-center mb-8">
                <h2 className="text-lg font-bold underline decoration-2 underline-offset-4">SURAT KETERANGAN RUJUKAN</h2>
                <p className="text-sm">Nomor: {data.id}/TBC-RUJ/{new Date().getFullYear()}</p>
            </div>

            {/* ISI SURAT */}
            <div className="px-4 text-justify leading-relaxed">
                <p className="mb-4">
                    Yang bertanda tangan di bawah ini, Petugas Admin Skrining TBC Puskesmas <b>{data.nama_kecamatan}</b>, menerangkan bahwa:
                </p>

                <table className="w-full mb-6 ml-4">
                    <tbody>
                        <tr>
                            <td className="w-40 py-1 font-semibold">Nama Lengkap</td>
                            <td>: {data.nama}</td>
                        </tr>
                        <tr>
                            <td className="py-1 font-semibold">NIK</td>
                            <td>: {data.nik}</td>
                        </tr>
                        <tr>
                            <td className="py-1 font-semibold">Usia</td>
                            <td>: {data.usia}</td>
                        </tr>
                        <tr>
                            <td className="py-1 font-semibold">Alamat</td>
                            <td>: {data.alamat}</td>
                        </tr>
                        <tr>
                            <td className="py-1 font-semibold">Hasil Skrining</td>
                            <td
                                className="font-bold uppercase"
                                style={{ color: "#dc2626" }} // text-red-600
                            >
                                : {data.hasil_screening}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <p className="mb-4">
                    Berdasarkan hasil skrining awal mandiri dan verifikasi data administrasi yang telah dilakukan pada tanggal <b>{tglVerifikasi}</b>, pasien tersebut dinyatakan berisiko tinggi (Suspect TBC) dan memerlukan pemeriksaan medis lanjutan (Tes Dahak/TCM/Rontgen).
                </p>

                <p className="mb-8">
                    Demikian surat rujukan ini dibuat untuk dapat digunakan sebagai syarat pendaftaran pemeriksaan di Poli Paru Puskesmas {data.nama_kecamatan}.
                </p>
            </div>

            {/* TANDA TANGAN */}
            <div className="flex justify-end mt-12 px-10">
                <div className="text-center">
                    <p>{data.nama_kecamatan}, {tglVerifikasi}</p>
                    <p className="mb-20 font-semibold">Petugas Verifikator</p>

                    {/* Cap/Stempel Digital (Opsional) */}
                    <div
                        className="absolute -mt-24 ml-4 opacity-30 rotate-12 border-4 p-2 font-black rounded-lg"
                        style={{ borderColor: "#1e40af", color: "#1e40af" }} // border-blue-800, text-blue-800
                    >
                        TERVERIFIKASI
                        <br />
                        DIGITAL
                    </div>

                    <p className="font-bold underline text-lg">ADMIN PUSKESMAS</p>
                    <p>NIP. -</p>
                </div>
            </div>

            {/* FOOTER KECIL */}
            <div
                className="absolute bottom-10 left-0 right-0 text-center text-xs border-t pt-2 mx-10"
                style={{ color: "#9ca3af", borderColor: "#e5e7eb" }} // text-gray-400
            >
                Dokumen ini diterbitkan secara elektronik oleh Sistem Informasi Skrining TBC (TBCheck).
                Scan QR Code pada aplikasi untuk validasi keaslian.
            </div>
        </div>
    )
})

SuratRujukanPDF.displayName = "SuratRujukanPDF"