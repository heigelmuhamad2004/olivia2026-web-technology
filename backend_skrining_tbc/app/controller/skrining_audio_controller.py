# app/controller/skrining_audio_controller.py

import os
import tempfile
import base64
import uuid
from flask import request
from flask_jwt_extended import jwt_required, get_jwt
from app import db, response
from app.model.skrining import Skrining
from app.model.rujukan import Rujukan, StatusRujukan
from app.services.ai_audio_service import AIAudioService
from app.services.ai_service import AIService
from app.model.evaluasi import EvaluasiModel
import shutil

# Tentukan folder penyimpanan permanen di Docker server
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'audio')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@jwt_required()
def preview_audio_crop():
    """API 1: Menerima rekaman mentah, memotong 1.2s, mengembalikan Base64 ke Frontend"""
    if 'audio' not in request.files:
        return response.bad_request([], "File audio tidak ditemukan.")
        
    file = request.files['audio']
    fd, temp_path = tempfile.mkstemp(suffix=os.path.splitext(file.filename)[1] or '.wav')
    os.close(fd)
    
    try:
        file.save(temp_path)
        # Hasilkan Base64 potongan 1.2 detik
        audio_base64 = AIAudioService.generate_preview_base64(temp_path)
        
        return response.success({
            "message": "Audio berhasil dipotong. Silakan putar dan konfirmasi.",
            "audio_base64": audio_base64
        }, "Preview Audio Berhasil")
        
    except ValueError as ve:
        return response.bad_request([], str(ve))
    except Exception as e:
        return response.bad_request([], f"Gagal memproses preview: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@jwt_required()
def process_audio_detect():
    """API 2: Menerima Base64 audio, memproses AI Suara, & menimpa hasil form dengan Hybrid Fusion."""
    try:
        claims = get_jwt()
        user_id = claims.get("id")
        
        req_data = request.json
        if not req_data or 'audio_base64' not in req_data:
            return response.bad_request([], "Data audio_base64 tidak ditemukan.")
            
        audio_b64_string = req_data['audio_base64']
        skrining_id = req_data.get('skrining_id')
        model_type = req_data.get('model', 'cnn').lower()

        # 1. CARI DATA SKRINING DARI TAHAP 1 (FORM KLINIS)
        if not skrining_id or str(skrining_id) == "0":
            return response.bad_request([], "ID Skrining tidak valid.")
            
        skrining = Skrining.query.filter_by(id=skrining_id, user_id=user_id).first()
        if not skrining:
            return response.bad_request([], "Data skrining tidak ditemukan di database.")

        # Ubah Base64 kembali menjadi file WAV fisik
        header, encoded = audio_b64_string.split(",", 1)
        audio_data = base64.b64decode(encoded)
        filename = f"skrining_{skrining.id}_{uuid.uuid4().hex[:8]}.wav"
        permanent_audio_path = os.path.join(UPLOAD_FOLDER, filename)
        
        with open(permanent_audio_path, "wb") as f:
            f.write(audio_data)

        # =========================================================
        # 2. DAPATKAN PREDIKSI AUDIO (CNN/DenseNet)
        # =========================================================
        hasil_ai_audio = AIAudioService.analyze(permanent_audio_path, model_type)
        prob_audio_persen = hasil_ai_audio["probabilitas_ai"] # Sudah format 0-100

        # =========================================================
        # 3. AMBIL DATA FORM & PREDIKSI KLINIS (Random Forest)
        # =========================================================
        # Pastikan 'skrining.data_klinis' sesuai dengan nama kolom JSON form Anda di database
        data_form_pasien = {
            "usia": skrining.pasien.usia if (skrining.pasien and hasattr(skrining.pasien, 'usia')) else 30, # Ambil dari relasi pasien
            "jenis_kelamin": skrining.pasien.jenis_kelamin.value if (skrining.pasien and hasattr(skrining.pasien, 'jenis_kelamin') and skrining.pasien.jenis_kelamin) else 'laki-laki',
            "batuk": skrining.batuk,
            "demam_yang_tidak_diketahui_penyebabnya": skrining.demam_yang_tidak_diketahui_penyebabnya,
            "bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun": skrining.bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun,
            "badan_lemas": skrining.badan_lemas,
            "berkesingat_malam_hari_tanpa_kegiatan": skrining.berkesingat_malam_hari_tanpa_kegiatan,
            "sesak_napas_tanpa_nyeri_dada": skrining.sesak_napas_tanpa_nyeri_dada,
            "merokok_atau_perokokok_pasif": skrining.merokok_atau_perokokok_pasif,
            "pernah_terdiagnosis_tbc": skrining.pernah_terdiagnosis_tbc,
            "kontak_erat_tbc": skrining.riwayat_kontak_tbc, # Sesuaikan nama untuk Rule Kemenkes
            "hiv": "Tidak", # Asumsi jika tidak ada di form
            "diabetes": skrining.riwayat_diabetes_melitus_atau_kencing_manis
        }
        
        ai_service = AIService()
        _, prob_rf_decimal = ai_service.predict(data_form_pasien)
        
        # Ubah desimal ke persen
        prob_klinis_persen = prob_rf_decimal * 100 

        # =========================================================
        # 4. MULTIMODAL FUSION (Klinis 60% + Suara 40%)
        # =========================================================
        prob_gabungan = (0.60 * prob_klinis_persen) + (0.40 * prob_audio_persen)

        # Cek Aturan Kemenkes sebagai Bypass (Rule Based)
        def is_yes(val):
            return str(val).lower() in ['ya', 'iya', 'true', '1', 'yes']
            
        batuk_parah = is_yes(data_form_pasien.get('batuk_lebih_2_minggu')) or is_yes(data_form_pasien.get('batuk_berdarah'))
        gejala_lain = is_yes(data_form_pasien.get('demam_yang_tidak_diketahui_penyebabnya')) or is_yes(data_form_pasien.get('berkesingat_malam_hari_tanpa_kegiatan')) or is_yes(data_form_pasien.get('bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun'))
        kontak = is_yes(data_form_pasien.get('kontak_erat_tbc'))
        risiko = is_yes(data_form_pasien.get('hiv')) or is_yes(data_form_pasien.get('diabetes')) or float(data_form_pasien.get('usia', 0)) >= 60

        if batuk_parah or (kontak and (risiko or gejala_lain)) or (risiko and gejala_lain):
            status_akhir = "TERDUGA TBC"
        elif prob_gabungan > 50.0:
            status_akhir = "TERDUGA TBC"
        else:
            status_akhir = "NORMAL"

        # =========================================================
        # 5. PROSES TIMPA (REPLACE) DATA DI DATABASE
        # =========================================================
        skrining.hasil_deteksi = status_akhir # <-- MENIMPA HASIL FORM LAMA
        skrining.metode_skrining = f"Hybrid Fusion (RF + {model_type.upper()})" # <-- MENIMPA METODE
        skrining.skor_suara_ai = prob_audio_persen 
        skrining.file_suara = f"/uploads/audio/{filename}"
        skrining.gradcam_image = hasil_ai_audio["spectrogram_image"] 
        
        # Simpan jejak detail probabilitas ke JSON (opsional tapi bagus untuk debugging)
        skrining.detail_matematika = {
            "audio_details": hasil_ai_audio["math_details"],
            "fusion_details": {
                "prob_klinis_rf": round(prob_klinis_persen, 2),
                "prob_audio_ai": round(prob_audio_persen, 2),
                "prob_gabungan": round(prob_gabungan, 2)
            }
        }

        # Logika Rujukan Otomatis
        if status_akhir == "TERDUGA TBC":
            existing_rujukan = Rujukan.query.filter_by(skrining_id=skrining.id).first()
            if not existing_rujukan:
                new_rujukan = Rujukan(
                    skrining_id=skrining.id,
                    pasien_id=skrining.pasien_id,
                    status=StatusRujukan.PENDING,
                    catatan=f"Rujukan Otomatis dari Evaluasi Suara (Skor: {prob_gabungan:.1f}%)"
                )
                db.session.add(new_rujukan)

        db.session.commit()

        return response.success({
            "skrining_id": skrining.id,
            "hasil_deteksi_akhir": skrining.hasil_deteksi,
            "probabilitas_tbc": prob_gabungan, 
            "spectrogram_image": hasil_ai_audio["spectrogram_image"],
            "file_suara_url": skrining.file_suara
        }, "Skrining hybrid berhasil diproses dan data berhasil diperbarui.")

    except Exception as e:
        db.session.rollback()
        import traceback
        print("====== ERROR MULTIMODAL FUSION ======")
        print(traceback.format_exc())
        return response.bad_request([], f"Gagal memproses AI Hybrid: {str(e)}")
    
@jwt_required()
def evaluate_dual_audio():
    """API 3: Evaluasi Ganda Disimpan Langsung ke Tabel Skrining Pasien"""
    try:
        claims = get_jwt()
        user_id = claims.get("id")
        
        req_data = request.json
        if not req_data or 'audio_base64' not in req_data:
            return response.bad_request([], "Data audio_base64 tidak ditemukan.")
            
        skrining_id = req_data.get('skrining_id')
        if not skrining_id:
            return response.bad_request([], "ID Skrining tidak ditemukan.")
            
        # Cari data skrining milik pasien ini
        skrining = Skrining.query.filter_by(id=skrining_id, user_id=user_id).first()
        if not skrining:
            return response.bad_request([], "Data skrining tidak valid.")

        audio_b64_string = req_data['audio_base64']
        header, encoded = audio_b64_string.split(",", 1)
        audio_data = base64.b64decode(encoded)
        
        # Simpan file fisik
        filename = f"skrining_dual_{skrining.id}_{uuid.uuid4().hex[:8]}.wav"
        permanent_audio_path = os.path.join(UPLOAD_FOLDER, filename)
        with open(permanent_audio_path, "wb") as f:
            f.write(audio_data)

        # Hitung Komparasi
        hasil_evaluasi = AIAudioService.analyze_dual_model(permanent_audio_path)

        # UPDATE DATABASE SKRINING UTAMA
        skrining.metode_skrining = "Uji Komparasi (CNN vs DenseNet)"
        skrining.skor_suara_ai = hasil_evaluasi["cnn"]["probabilitas"] # Gunakan CNN sebagai skor utama
        skrining.file_suara = f"/uploads/audio/{filename}"
        skrining.gradcam_image = hasil_evaluasi["cnn"]["spectrogram_image"] 
        
        # MAGIC: Selipkan SEMUA data metrik dan densenet ke dalam kolom JSON ini!
        skrining.detail_matematika = hasil_evaluasi 
        
        db.session.commit()

        return response.success(hasil_evaluasi, "Evaluasi komparasi berhasil disimpan ke data pasien.")

    except Exception as e:
        db.session.rollback()
        import traceback
        print("====== ERROR EVALUASI GANDA ======")
        print(traceback.format_exc())
        return response.bad_request([], f"Gagal memproses evaluasi komparasi: {str(e)}")