# app/services/rule_based_service.py
"""
Rule-Based Screening Engine - sesuai Formulir Skrining Gejala TBC Kemenkes.

Referensi aturan (dari form resmi Kemenkes - teks literal):
  Dinyatakan TERDUGA TBC jika memenuhi SATU ATAU LEBIH kriteria:
    1. Memiliki gejala utama TBC dengan atau tanpa gejala tambahan
    2. Memiliki riwayat kontak dengan faktor risiko ATAU salah satu gejala tambahan
    3. Memiliki faktor risiko dengan gejala tambahan

KEPUTUSAN FINAL (28/7/2026): mengikuti teks form Kemenkes apa adanya,
BUKAN revisi operasional dosen sebelumnya. Alasan: dosen pembimbing
bukan berlatar belakang medis, sehingga sumber kebenaran klinis yang
lebih tepat adalah dokumen resmi Kemenkes + konfirmasi langsung ke
petugas puskesmas, bukan interpretasi tambahan yang berpotensi
mengubah makna klinis form.

REVISI ARSITEKTUR (dosen minta pakai RF lagi, tanggal sama):
  Kriteria 1 TIDAK LAGI otomatis benar hanya krn batuk=Ya. Kriteria 1
  sekarang DIPUTUSKAN OLEH MODEL RF (dilatih di CODA_TB_Clinical_Meta_Info,
  lihat ai_service.py) yang menilai batuk + gejala tambahan + demografi
  bersama-sama. Fungsi evaluate_rule_based() di bawah menerima parameter
  kriteria_1_result (bool) dari luar - JANGAN lagi hitung Kriteria 1 dari
  'batuk' secara langsung di sini.

  Kriteria 2 & 3 TIDAK BERUBAH - tetap rule-based murni karena field-nya
  (kontak erat, malnutrisi, DM, ibu hamil, dst) tidak ada representasinya
  di dataset training RF.
"""

from typing import Dict, Any, Optional

MIN_GEJALA_TAMBAHAN_KRITERIA_2 = 1  # "salah satu gejala tambahan"
MIN_FAKTOR_RISIKO_KRITERIA_3 = 2    # "faktor risiko" (tidak disebut jumlah)
MIN_GEJALA_TAMBAHAN_KRITERIA_3 = 2  # "gejala tambahan" (tidak disebut jumlah)


def _is_yes(val) -> bool:
    """Normalisasi berbagai kemungkinan input jadi boolean Ya/Tidak."""
    if val is None:
        return False
    return str(val).strip().lower() in ["ya", "iya", "true", "1", "yes"]


def evaluate_rule_based(form_data: Dict[str, Any], kriteria_1_result: Optional[bool] = None) -> Dict[str, Any]:
    """
    Evaluasi form skrining TBC berdasarkan 3 kriteria resmi Kemenkes.

    Parameter:
      form_data: dict berisi field gejala/faktor risiko (lihat daftar di bawah)
      kriteria_1_result: hasil Kriteria 1 dari LUAR fungsi ini (biasanya dari
        prediksi RF). Jika None, fallback ke pembacaan literal form
        (batuk=Ya sudah cukup) - dipakai untuk testing/fallback saat RF mati.

      Gejala tambahan:
        bb_turun, demam, badan_lemas, keringat_malam, sesak_napas, pembesaran_kgb

      Riwayat kontak:
        riwayat_kontak_tbc

      Faktor risiko:
        pernah_terdiagnosis_tbc, pernah_berobat_tidak_tuntas, malnutrisi,
        merokok, riwayat_dm, lansia_60plus, ibu_hamil

    Return:
      dict berisi hasil akhir + rincian kriteria mana yang terpenuhi (audit trail)
    """

    # --- Gejala Utama (fallback literal jika kriteria_1_result tidak diberikan) ---
    gejala_utama_batuk = _is_yes(form_data.get("batuk"))

    # --- Gejala Tambahan ---
    gejala_tambahan_map = {
        "bb_turun": _is_yes(form_data.get("bb_turun")),
        "demam": _is_yes(form_data.get("demam")),
        "badan_lemas": _is_yes(form_data.get("badan_lemas")),
        "keringat_malam": _is_yes(form_data.get("keringat_malam")),
        "sesak_napas": _is_yes(form_data.get("sesak_napas")),
        "pembesaran_kgb": _is_yes(form_data.get("pembesaran_kgb")),
    }
    jumlah_gejala_tambahan = sum(gejala_tambahan_map.values())
    gejala_tambahan_cukup_k2 = jumlah_gejala_tambahan >= MIN_GEJALA_TAMBAHAN_KRITERIA_2
    gejala_tambahan_cukup_k3 = jumlah_gejala_tambahan >= MIN_GEJALA_TAMBAHAN_KRITERIA_3

    # --- Riwayat Kontak ---
    riwayat_kontak = _is_yes(form_data.get("riwayat_kontak_tbc"))

    # --- Faktor Risiko ---
    faktor_risiko_map = {
        "pernah_terdiagnosis_tbc": _is_yes(form_data.get("pernah_terdiagnosis_tbc")),
        "pernah_berobat_tidak_tuntas": _is_yes(form_data.get("pernah_berobat_tidak_tuntas")),
        "malnutrisi": _is_yes(form_data.get("malnutrisi")),
        "merokok": _is_yes(form_data.get("merokok")),
        "riwayat_dm": _is_yes(form_data.get("riwayat_dm")),
        "lansia_60plus": _is_yes(form_data.get("lansia_60plus")),
        "ibu_hamil": _is_yes(form_data.get("ibu_hamil")),
    }
    jumlah_faktor_risiko = sum(faktor_risiko_map.values())
    ada_faktor_risiko = jumlah_faktor_risiko >= MIN_FAKTOR_RISIKO_KRITERIA_3

    # --- 3 Kriteria ---
    # Kriteria 1: PAKAI HASIL RF jika disediakan (arsitektur baru).
    #             Fallback ke literal (batuk saja cukup) kalau RF tidak jalan.
    kriteria_1 = kriteria_1_result if kriteria_1_result is not None else gejala_utama_batuk
    kriteria_2 = riwayat_kontak and (ada_faktor_risiko or gejala_tambahan_cukup_k2)
    kriteria_3 = ada_faktor_risiko and gejala_tambahan_cukup_k3

    terduga_tbc = kriteria_1 or kriteria_2 or kriteria_3

    kriteria_terpenuhi = []
    if kriteria_1:
        sumber = "RF" if kriteria_1_result is not None else "literal batuk-saja (fallback)"
        kriteria_terpenuhi.append(f"Kriteria 1: Gejala utama+tambahan dinilai model ({sumber})")
    if kriteria_2:
        kriteria_terpenuhi.append("Kriteria 2: Riwayat kontak + faktor risiko/gejala tambahan")
    if kriteria_3:
        kriteria_terpenuhi.append("Kriteria 3: Faktor risiko + gejala tambahan")

    return {
        "hasil": "TERDUGA TBC" if terduga_tbc else "TIDAK TERDUGA TBC",
        "terduga_tbc": terduga_tbc,
        "kriteria_terpenuhi": kriteria_terpenuhi,
        "detail": {
            "gejala_utama_batuk": gejala_utama_batuk,
            "kriteria_1_sumber": "RF" if kriteria_1_result is not None else "literal",
            "gejala_tambahan": gejala_tambahan_map,
            "jumlah_gejala_tambahan": jumlah_gejala_tambahan,
            "riwayat_kontak": riwayat_kontak,
            "faktor_risiko": faktor_risiko_map,
            "jumlah_faktor_risiko": jumlah_faktor_risiko,
        },
    }


# --- Pengujian manual ---
if __name__ == "__main__":
    print("=== Mode fallback literal (kriteria_1_result=None, RF dianggap mati) ===")
    kasus_fallback = [
        ("Batuk sendirian -> fallback literal, Kriteria 1 True", {"batuk": "Ya"}, None, True),
        ("Tanpa batuk, tanpa apapun -> Tidak terduga", {}, None, False),
    ]
    for desc, k, k1, expected in kasus_fallback:
        hasil = evaluate_rule_based(k, kriteria_1_result=k1)
        status = "OK" if hasil["terduga_tbc"] == expected else "!! MISMATCH !!"
        print(f"[{status}] {desc} -> {hasil['hasil']} {hasil['kriteria_terpenuhi']}")

    print("\n=== Mode RF aktif (kriteria_1_result eksplisit dari RF) ===")
    kasus_rf = [
        ("Batuk=Ya tapi RF bilang TIDAK suspek, tanpa kriteria lain -> Tidak terduga", {"batuk": "Ya"}, False, False),
        ("Batuk=Ya, RF bilang SUSPEK -> Kriteria 1 True", {"batuk": "Ya"}, True, True),
        ("Kontak + 1 faktor risiko (RF tidak relevan) -> Kriteria 2 tetap jalan", {"riwayat_kontak_tbc": "Ya", "merokok": "Ya"}, False, True),
        ("Kontak + 1 gejala tambahan -> Kriteria 2 ('salah satu')", {"riwayat_kontak_tbc": "Ya", "demam": "Ya"}, False, True),
        ("1 faktor risiko + 1 gejala tambahan -> Kriteria 3", {"malnutrisi": "Ya", "demam": "Ya"}, False, True),
        ("Faktor risiko saja, tanpa gejala tambahan -> gagal Kriteria 3", {"malnutrisi": "Ya"}, False, False),
        ("Tidak ada apa-apa, RF juga bilang tidak -> Tidak terduga", {}, False, False),
    ]
    for desc, k, k1, expected in kasus_rf:
        hasil = evaluate_rule_based(k, kriteria_1_result=k1)
        status = "OK" if hasil["terduga_tbc"] == expected else "!! MISMATCH !!"
        print(f"[{status}] {desc}\n    input={k}, kriteria_1_result={k1}\n    -> {hasil['hasil']} {hasil['kriteria_terpenuhi']}\n")