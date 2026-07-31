# Tambahan untuk ai_audio_service.py
# Selective classification / reject option: model hanya "berani" memberi
# kesimpulan saat cukup yakin (>=0.9 atau <=0.3). Di luar itu, hasil
# dianggap tidak dapat disimpulkan (ditolak/di-reject), bukan dipaksa
# jadi 0/1 di angka 0.5.

ZONA_YAKIN_SUSPEK = 0.9   # >= nilai ini -> Suspek TBC (confidence tinggi)
ZONA_YAKIN_NORMAL = 0.3   # <= nilai ini -> Normal (confidence tinggi)


def klasifikasi_zona_audio(probabilitas: float) -> dict:
    """
    probabilitas: hasil sigmoid model (0.0 - 1.0), 1.0 = suspek TBC.

    Return dict berisi label, apakah boleh ditampilkan ke user,
    dan zona confidence-nya (untuk keperluan audit/laporan).
    """
    if probabilitas >= ZONA_YAKIN_SUSPEK:
        return {
            "zona": "suspek_yakin",
            "label": "Suspek TBC (AI Audio - Confidence Tinggi)",
            "tampilkan_ke_user": True,
        }
    elif probabilitas <= ZONA_YAKIN_NORMAL:
        return {
            "zona": "normal_yakin",
            "label": "Normal (AI Audio - Confidence Tinggi)",
            "tampilkan_ke_user": True,
        }
    else:
        return {
            "zona": "abu_abu",
            "label": "Tidak dapat disimpulkan oleh AI Audio",
            "tampilkan_ke_user": False,  # sembunyikan dari hasil utama
        }


if __name__ == "__main__":
    for p in [0.02, 0.29, 0.3, 0.31, 0.5, 0.6, 0.89, 0.9, 0.91, 0.99]:
        print(p, "->", klasifikasi_zona_audio(p))