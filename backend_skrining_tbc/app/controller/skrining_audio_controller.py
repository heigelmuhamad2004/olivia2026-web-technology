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
from app.utils.hashids_util import encode_id, decode_id # 🛡️ Tambahkan encode_id di sini

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'audio')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@jwt_required()
def preview_audio_crop():
    """API 1: Menerima rekaman mentah, memotong 0.5s, mengembalikan Base64 ke Frontend"""
    if 'audio' not in request.files:
        return response.bad_request([], "File audio tidak ditemukan.")

    file = request.files['audio']
    fd, temp_path = tempfile.mkstemp(suffix=os.path.splitext(file.filename)[1] or '.wav')
    os.close(fd)

    try:
        file.save(temp_path)
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
    """
    API 2: Menerima Base64 audio, memproses MULTIMODAL AI (CNN/DenseNet + Klinis).
    DI SINI HASIL DETEKSI (RF) SEBELUMNYA AKAN DITIMPA OLEH HASIL MULTIMODAL.
    """
    try:
        claims = get_jwt()
        user_id = claims.get("id")

        req_data = request.json
        if not req_data or 'audio_base64' not in req_data:
            return response.bad_request([], "Data audio_base64 tidak ditemukan.")

        audio_b64_string = req_data['audio_base64']
        model_type = req_data.get('model', 'cnn').lower()

        # 🛡️ BENTENG IDOR: Decode Hash ID
        raw_id = req_data.get('skrining_id')
        skrining_id = decode_id(raw_id) if isinstance(raw_id, str) and not raw_id.isdigit() else raw_id
        
        if not skrining_id:
             return response.bad_request([], "ID Skrining tidak valid atau telah dimanipulasi.")

        skrining = Skrining.query.filter_by(id=skrining_id, user_id=user_id).first()
        if not skrining:
            return response.bad_request([], "Data skrining tidak ditemukan di database.")

        # 1. Simpan file audio
        header, encoded = audio_b64_string.split(",", 1)
        audio_data = base64.b64decode(encoded)
        filename = f"skrining_{skrining.id}_{uuid.uuid4().hex[:8]}.wav"
        permanent_audio_path = os.path.join(UPLOAD_FOLDER, filename)

        with open(permanent_audio_path, "wb") as f:
            f.write(audio_data)

        # =========================================================
        # 2. PREDIKSI MULTIMODAL AI
        # =========================================================
        hasil_multimodal = AIAudioService.analyze_multimodal(permanent_audio_path, skrining, model_type)
        prob_desimal = hasil_multimodal["probabilitas_desimal"]
        prob_persen = prob_desimal * 100

        # =========================================================
        # 3. KEPUTUSAN THRESHOLD (Berdasarkan Hasil Test Set Colab)
        # =========================================================
        if model_type == "densenet":
            # Threshold DenseNet v2 = 0.6104
            status_baru = "TERDUGA TBC" if prob_desimal >= 0.6104 else "TIDAK TERDUGA TBC"
            nama_metode = "Multimodal AI (DenseNet v2)"
        else:
            # Threshold CNN v1 = 0.5507 (Default)
            status_baru = "TERDUGA TBC" if prob_desimal >= 0.5507 else "TIDAK TERDUGA TBC"
            nama_metode = "Multimodal AI (CNN v1)"

        # =========================================================
        # 4. UPDATE STATUS & RUJUKAN DI DATABASE
        # =========================================================
        skrining.hasil_deteksi = status_baru
        skrining.metode_skrining = nama_metode
        skrining.skor_suara_ai = prob_persen  # Simpan sebagai info Multimodal
        skrining.file_suara = f"/uploads/audio/{filename}"
        skrining.gradcam_image = hasil_multimodal["spectrogram_image"]

        # Catat rincian matematis untuk sidang skripsi
        existing_detail = skrining.detail_matematika or {}
        existing_detail["multimodal_ai_info"] = {
            "model_dipakai": nama_metode,
            "probabilitas": prob_desimal,
            "vektor_klinis_input": hasil_multimodal["raw_klinis_input"]
        }
        skrining.detail_matematika = existing_detail

        # Manajemen Rujukan Otomatis (Jika status ditimpa AI Multimodal)
        rujukan_existing = Rujukan.query.filter_by(skrining_id=skrining.id).first()
        if status_baru == "TERDUGA TBC":
            if not rujukan_existing:
                new_rujukan = Rujukan(
                    skrining_id=skrining.id,
                    pasien_id=skrining.pasien_id,
                    status=StatusRujukan.PENDING,
                    catatan=f"Rujukan otomatis sistem. {nama_metode}"
                )
                db.session.add(new_rujukan)
            else:
                rujukan_existing.catatan = f"Rujukan otomatis sistem. {nama_metode}"
        else:
            # Jika AI bilang Sehat, namun Rujukan terlanjur dibuat saat form RF awal, Hapus Rujukan!
            if rujukan_existing:
                db.session.delete(rujukan_existing)

        db.session.commit()

        # =========================================================
        # 5. RESPONSE KE FRONTEND
        # =========================================================
        return response.success({
            "skrining_id": encode_id(skrining.id), # 🛡️ PENTING: Wajib di-encode agar frontend menerima String Hash!
            "hasil_deteksi_akhir": skrining.hasil_deteksi,  # Status Final Multimodal
            "skor_ai": prob_persen,
            "metode_ai": nama_metode,
            "spectrogram_image": hasil_multimodal["spectrogram_image"],
            "file_suara_url": skrining.file_suara,
        }, "Skrining Multimodal (Audio + Form) Berhasil Diproses!")

    except Exception as e:
        db.session.rollback()
        import traceback
        print("====== ERROR PROSES AUDIO MULTIMODAL ======")
        print(traceback.format_exc())
        return response.bad_request([], f"Gagal memproses AI Multimodal: {str(e)}")


@jwt_required()
def evaluate_dual_audio():
    """API 3: Evaluasi Ganda (CNN vs DenseNet) untuk keperluan riset/evaluasi model.
    Tidak menyentuh hasil_deteksi - murni data pembanding performa model."""
    try:
        claims = get_jwt()
        user_id = claims.get("id")

        req_data = request.json
        if not req_data or 'audio_base64' not in req_data:
            return response.bad_request([], "Data audio_base64 tidak ditemukan.")

        # 🛡️ BENTENG IDOR: Decode Hash ID
        raw_id = req_data.get('skrining_id')
        skrining_id = decode_id(raw_id) if isinstance(raw_id, str) and not raw_id.isdigit() else raw_id

        if not skrining_id:
            return response.bad_request([], "ID Skrining tidak valid.")

        skrining = Skrining.query.filter_by(id=skrining_id, user_id=user_id).first()
        if not skrining:
            return response.bad_request([], "Data skrining tidak valid.")

        audio_b64_string = req_data['audio_base64']
        header, encoded = audio_b64_string.split(",", 1)
        audio_data = base64.b64decode(encoded)

        filename = f"skrining_dual_{skrining.id}_{uuid.uuid4().hex[:8]}.wav"
        permanent_audio_path = os.path.join(UPLOAD_FOLDER, filename)
        with open(permanent_audio_path, "wb") as f:
            f.write(audio_data)

        hasil_evaluasi = AIAudioService.analyze_dual_model(permanent_audio_path)

        # Ini murni data evaluasi/komparasi model, tidak menimpa hasil_deteksi
        existing_detail = skrining.detail_matematika or {}
        existing_detail["evaluasi_dual_model"] = hasil_evaluasi
        skrining.detail_matematika = existing_detail
        skrining.file_suara = f"/uploads/audio/{filename}"

        db.session.commit()

        return response.success(hasil_evaluasi, "Evaluasi komparasi berhasil disimpan (data riset).")

    except Exception as e:
        db.session.rollback()
        import traceback
        print("====== ERROR EVALUASI GANDA ======")
        print(traceback.format_exc())
        return response.bad_request([], f"Gagal memproses evaluasi komparasi: {str(e)}")