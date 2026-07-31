# app/services/skrining_services.py

from app import db
from app.model.skrining import Skrining
from app.model.rujukan import Rujukan, StatusRujukan
from app.services.rule_based_service import evaluate_rule_based
from app.services.ai_service import AIService
from datetime import datetime


# Inisialisasi AI Service (Random Forest), Singleton
ai_service = AIService()

# Mapping Form Input -> Rule Based variables
_FORM_KEY_MAP = {
    "batuk": "batuk",
    "bb_turun": "bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun",
    "demam": "demam_yang_tidak_diketahui_penyebabnya",
    "badan_lemas": "badan_lemas",
    "keringat_malam": "berkesingat_malam_hari_tanpa_kegiatan",
    "sesak_napas": "sesak_napas_tanpa_nyeri_dada",
    "pembesaran_kgb": "ada_pembengkakan_kelenjar_getah_bening_pada_leher_atau_ketiak",
    "riwayat_kontak_tbc": "riwayat_kontak_tbc",
    "pernah_terdiagnosis_tbc": "pernah_terdiagnosis_tbc",
    "pernah_berobat_tidak_tuntas": "pernah_beroobat_tbc_namun_tidak_tuntas",
    "malnutrisi": "malnutrisi",
    "merokok": "merokok_atau_perokokok_pasif",
    "riwayat_dm": "riwayat_diabetes_melitus_atau_kencing_manis",
    "lansia_60plus": "lansia_lebih_dari_60_tahun",
    "ibu_hamil": "ibu_hamil",
}

def _map_payload_to_rule_input(payload: dict) -> dict:
    return {
        rule_key: payload.get(payload_key)
        for rule_key, payload_key in _FORM_KEY_MAP.items()
    }

def is_yes(value):
    truthy = {"ya", "iya", "true", "1", "yes", True, 1}
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in truthy


def hitung_status_skrining(payload, data_pasien_tambahan=None):
    """
    Menghitung status skrining awal:
    Jika pasien BATUK -> Random Forest di-skip (ditunda), menunggu AI Multimodal.
    Jika pasien TIDAK BATUK -> Random Forest dijalankan sebagai penentu akhir Kriteria 1.
    """
    rule_input = _map_payload_to_rule_input(payload)
    is_batuk = is_yes(rule_input.get("batuk"))

    rf_info = None
    kriteria_1_result = False

    # 1. JIKA PASIEN TIDAK BATUK -> JALANKAN RANDOM FOREST (RF)
    if not is_batuk:
        ai_input = dict(payload)
        if data_pasien_tambahan:
            ai_input.update(data_pasien_tambahan)
        
        ai_input["bb_turun"] = rule_input.get("bb_turun")
        ai_input["demam"] = rule_input.get("demam")
        ai_input["keringat_malam"] = rule_input.get("keringat_malam")
        ai_input["merokok"] = rule_input.get("merokok")
        ai_input["pernah_terdiagnosis_tbc"] = rule_input.get("pernah_terdiagnosis_tbc")

        # Prediksi menggunakan RF
        pred_rf, prob_rf = ai_service.predict(ai_input)
        kriteria_1_result = bool(pred_rf == 1)
        rf_info = {
            "prediksi": pred_rf,
            "probabilitas": prob_rf,
            "threshold_dipakai": ai_service.artifact["threshold"] if ai_service.artifact else None,
        }

    # 2. EVALUASI RULE-BASED KEMENKES (Misal: DM, Hamil, Kontak, dll tetap jalan)
    hasil = evaluate_rule_based(rule_input, kriteria_1_result=kriteria_1_result)
    hasil["rf_info"] = rf_info

    # 3. PENENTUAN STATUS AWAL
    if is_batuk:
        # Tahan status, akan diupdate oleh proses Audio AI nanti
        status_hasil = "Menunggu Rekaman Suara"
        metode = "Menunggu Multimodal AI"
    else:
        # Putuskan sekarang dengan RF + Rule-Based Kemenkes
        status_hasil = hasil["hasil"]
        if hasil["kriteria_terpenuhi"]:
            metode = "Random Forest + Rule-Based (" + "; ".join(hasil["kriteria_terpenuhi"]) + ")"
        else:
            metode = "Random Forest + Rule-Based (Tidak memenuhi kriteria manapun)"

    return status_hasil, metode, hasil


def process_new_skrining(user_id, data_input):
    """Fungsi Utama: Simpan Skrining. Rujukan hanya diterbitkan jika pasien TIDAK BATUK."""
    try:
        status_hasil, metode, hasil_rule = hitung_status_skrining(data_input, data_input)
        is_batuk = is_yes(data_input.get('batuk'))

        # Ekstraksi Skor Mentah RF (Hanya ada jika pasien tidak batuk)
        probabilitas_rf = None
        if hasil_rule.get("rf_info") and hasil_rule["rf_info"].get("probabilitas") is not None:
            probabilitas_rf = float(hasil_rule["rf_info"]["probabilitas"])

        new_skrining = Skrining(
            user_id=user_id,
            pasien_id=data_input['pasien_id'],
            berat_badan=data_input.get('berat_badan'),
            tinggi_badan=data_input.get('tinggi_badan'),
            riwayat_kontak_tbc=str(data_input.get('riwayat_kontak_tbc')),
            pernah_terdiagnosis_tbc=str(data_input.get('pernah_terdiagnosis_tbc')),
            pernah_berobat_tbc=str(data_input.get('pernah_berobat_tbc')),
            nama_obat_tbc=data_input.get('nama_obat_tbc'),
            pernah_beroobat_tbc_namun_tidak_tuntas=str(data_input.get('pernah_beroobat_tbc_namun_tidak_tuntas')),
            malnutrisi=str(data_input.get('malnutrisi')),
            merokok_atau_perokokok_pasif=str(data_input.get('merokok_atau_perokokok_pasif')),
            riwayat_diabetes_melitus_atau_kencing_manis=str(data_input.get('riwayat_diabetes_melitus_atau_kencing_manis')),
            lansia_lebih_dari_60_tahun=str(data_input.get('lansia_lebih_dari_60_tahun')),
            ibu_hamil=str(data_input.get('ibu_hamil')),
            batuk=str(data_input.get('batuk')),
            bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun=str(data_input.get('bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun')),
            demam_yang_tidak_diketahui_penyebabnya=str(data_input.get('demam_yang_tidak_diketahui_penyebabnya')),
            badan_lemas=str(data_input.get('badan_lemas')),
            berkesingat_malam_hari_tanpa_kegiatan=str(data_input.get('berkesingat_malam_hari_tanpa_kegiatan')),
            sesak_napas_tanpa_nyeri_dada=str(data_input.get('sesak_napas_tanpa_nyeri_dada')),
            ada_pembengkakan_kelenjar_getah_bening_pada_leher_atau_ketiak=str(data_input.get('ada_pembengkakan_kelenjar_getah_bening_pada_leher_atau_ketiak')),

            tanggal_skrining=datetime.utcnow(),
            hasil_deteksi=status_hasil,
            metode_skrining=metode,
            detail_matematika={"rule_based": hasil_rule},
            status='completed',
            skor_form_ai=probabilitas_rf
        )

        db.session.add(new_skrining)
        db.session.flush() 

        pesan_tambahan = ""
        
        # =========================================================
        # LOGIKA RUJUKAN:
        # HANYA buat rujukan jika pasien TIDAK BATUK dan berstatus TERDUGA TBC.
        # Jika pasien batuk, Rujukan ditunda menunggu endpoint Audio AI dipanggil.
        # =========================================================
        if not is_batuk and status_hasil == "TERDUGA TBC":
            new_rujukan = Rujukan(
                skrining_id=new_skrining.id,
                pasien_id=data_input['pasien_id'],
                status=StatusRujukan.PENDING,
                catatan=f"Rujukan otomatis sistem. {metode}"
            )
            db.session.add(new_rujukan)
            pesan_tambahan = " Sistem telah membuat rujukan otomatis ke Puskesmas."
        elif is_batuk:
            pesan_tambahan = " Silakan rekam suara batuk Anda untuk menyelesaikan skrining menggunakan AI Suara."

        db.session.commit()

        return {
            "status": "success",
            "message": f"Skrining berhasil disimpan.{pesan_tambahan}",
            "data": {
                "id": new_skrining.id,               # <--- WAJIB ADA agar Frontend bisa menangkap ID
                "skrining_id": new_skrining.id,      # Cadangan
                "hasil_deteksi": status_hasil,       # <--- Frontend mengharapkan nama key ini
                "info_tambahan": {                   # <--- Dikembalikan ke format nested
                    "metode": metode,
                    "kriteria_terpenuhi": hasil_rule["kriteria_terpenuhi"],
                }
            }
        }

    except Exception as e:
        db.session.rollback()
        print(f"Error processing skrining: {e}")
        return {
            "status": "error",
            "message": f"Gagal memproses skrining: {str(e)}"
        }