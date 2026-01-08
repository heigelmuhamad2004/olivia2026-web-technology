# app/services/skrining_services.py

from app import db
from app.model.skrining import Skrining
from app.model.rujukan import Rujukan, StatusRujukan
from app.services.ai_service import AIService
from datetime import datetime

# Inisialisasi AI Service
ai_service = AIService()

def is_yes(value):
    """Konversi string 'ya', 'iya', 'true', '1' menjadi True."""
    truthy = {"ya", "iya", "true", "1", "yes", True, 1}
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in truthy

def hitung_status_skrining(payload, data_pasien_tambahan=None):
    """
    Fungsi murni untuk menghitung status kesehatan (Rule Based + AI).
    Tidak berinteraksi langsung dengan Database.
    """
    # --- 1. PERSIAPAN DATA ---
    batuk = is_yes(payload.get("batuk"))
    
    # List Gejala Tambahan (Serius)
    gejala_serius_list = [
        payload.get("bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun"),
        payload.get("demam_yang_tidak_diketahui_penyebabnya"),
        payload.get("berkesingat_malam_hari_tanpa_kegiatan"),
    ]
    gejala_serius_count = sum([is_yes(g) for g in gejala_serius_list])

    # List Gejala Ringan Lainnya
    gejala_lain_list = [
        payload.get("badan_lemas"),
        payload.get("sesak_napas_tanpa_nyeri_dada"),
        payload.get("ada_pembengkakan_kelenjar_getah_bening_pada_leher_atau_ketiak"),
    ]
    gejala_lain_count = sum([is_yes(g) for g in gejala_lain_list])
    
    # Faktor Risiko
    faktor_risiko_list = [
        payload.get("riwayat_kontak_tbc"),
        payload.get("odhiv"), # Pastikan key ini sesuai dengan FE
        payload.get("riwayat_diabetes_melitus_atau_kencing_manis"),
    ]
    faktor_risiko_count = sum([is_yes(f) for f in faktor_risiko_list])

    # --- 2. PREDIKSI AI ---
    ai_input = payload.copy()
    if data_pasien_tambahan:
        ai_input.update(data_pasien_tambahan)
    
    pred_ai, prob_ai = ai_service.predict(ai_input)

    # --- 3. LOGIKA PENENTUAN (REVISI CERDAS) ---
    status = "SEHAT" # Default SEHAT (atau 'TIDAK TERDUGA')
    metode_penentuan = "Evaluasi Gejala Ringan"

    # SKENARIO A: Gejala Parah (Rule Based Mutlak)
    if batuk and gejala_serius_count >= 1:
        status = "TERDUGA TBC"
        metode_penentuan = "Rule-Based (Batuk + Gejala Khas TBC)"

    # SKENARIO B: Tanpa Batuk tapi Gejala Banyak (Rule Based - Ekstra Paru)
    elif (gejala_serius_count + gejala_lain_count) >= 3:
        status = "TERDUGA TBC"
        metode_penentuan = "Rule-Based (Kombinasi Gejala Signifikan)"
        
    # SKENARIO C: Batuk + Faktor Risiko Tinggi (Rule Based)
    elif batuk and faktor_risiko_count >= 1:
        status = "TERDUGA TBC"
        metode_penentuan = "Rule-Based (Batuk + Faktor Risiko)"

    # SKENARIO D: "Cuma Batuk Doang" (PERAN AI DISINI!)
    elif batuk and gejala_serius_count == 0:
        if pred_ai == 1:
            status = "TERDUGA TBC"
            metode_penentuan = "AI Random Forest (Analisis Pola Risiko)"
        else:
            status = "SEHAT" 
            metode_penentuan = "Evaluasi Medis (Risiko Rendah)"

    # SKENARIO E: Tidak ada gejala, tapi AI menemukan pola aneh (Deteksi Dini)
    elif pred_ai == 1 and prob_ai > 0.7:
        status = "TERDUGA TBC"
        metode_penentuan = "AI Random Forest (Deteksi Dini)"

    return status, metode_penentuan, float(prob_ai)

def process_new_skrining(user_id, data_input):
    """
    Fungsi Utama: Menerima input -> Hitung Status -> Simpan DB -> Buat Rujukan (Jika Perlu)
    """
    try:
        # 1. Panggil Logika Perhitungan (Fungsi di atas)
        # Kita asumsikan data_input sudah berisi data pasien yang dibutuhkan AI (usia, jk, dll)
        # Jika belum, query data pasien dulu disini berdasarkan data_input['pasien_id']
        
        status_hasil, metode, probabilitas = hitung_status_skrining(data_input, data_input)

        # 2. Simpan Data Skrining ke Database
        new_skrining = Skrining(
            user_id=user_id,
            pasien_id=data_input['pasien_id'],
            # Mapping manual field gejala agar tersimpan rapi
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
            
            # Hasil Perhitungan
            tanggal_skrining=datetime.utcnow(),
            hasil_deteksi=status_hasil, 
            status='completed'
        )

        db.session.add(new_skrining)
        db.session.flush() # Generate ID skrining dulu

        # 3. LOGIC RUJUKAN OTOMATIS
        # Jika hasil "TERDUGA TBC", buat tiket rujukan
        pesan_tambahan = ""
        if status_hasil == "TERDUGA TBC":
            new_rujukan = Rujukan(
                skrining_id=new_skrining.id,
                pasien_id=data_input['pasien_id'],
                status=StatusRujukan.PENDING,
                catatan=f"Rujukan otomatis sistem. Metode: {metode_penentuan} (Probabilitas AI: {probabilitas:.2f})"
            )
            db.session.add(new_rujukan)
            pesan_tambahan = " Sistem telah membuat rujukan otomatis ke Puskesmas."

        db.session.commit()

        return {
            "status": "success",
            "message": f"Skrining berhasil disimpan.{pesan_tambahan}",
            "data": {
                "skrining_id": new_skrining.id,
                "hasil": status_hasil,
                "metode": metode,
                "probabilitas": probabilitas
            }
        }

    except Exception as e:
        db.session.rollback()
        # Log error sebenarnya untuk debugging
        print(f"Error processing skrining: {e}") 
        return {
            "status": "error", 
            "message": f"Gagal memproses skrining: {str(e)}"
        }