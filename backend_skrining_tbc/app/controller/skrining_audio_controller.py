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
    """API 2: Menerima Base64 audio yang sudah divalidasi user, lalu mendeteksi."""
    try:
        claims = get_jwt()
        user_id = claims.get("id")
        
        req_data = request.json
        if not req_data or 'audio_base64' not in req_data:
            return response.bad_request([], "Data audio_base64 tidak ditemukan.")
            
        audio_b64_string = req_data['audio_base64']
        skrining_id = req_data.get('skrining_id')
        model_type = req_data.get('model', 'cnn').lower()

        # Validasi Skrining ID
        if not skrining_id or str(skrining_id) == "0":
            skrining = Skrining.query.filter_by(user_id=user_id).order_by(Skrining.id.desc()).first()
            if not skrining:
                return response.bad_request([], "Belum ada data skrining sebelumnya.")
        else:
            skrining = Skrining.query.filter_by(id=skrining_id, user_id=user_id).first()
            if not skrining:
                return response.bad_request([], "Data skrining tidak valid.")

        # Ubah Base64 kembali menjadi file WAV fisik untuk disimpan di Docker Server
        header, encoded = audio_b64_string.split(",", 1)
        audio_data = base64.b64decode(encoded)
        
        # Buat nama file unik dan simpan permanen
        filename = f"skrining_{skrining.id}_{uuid.uuid4().hex[:8]}.wav"
        permanent_audio_path = os.path.join(UPLOAD_FOLDER, filename)
        
        with open(permanent_audio_path, "wb") as f:
            f.write(audio_data)

        # Analisis menggunakan AI
        hasil_ai = AIAudioService.analyze(permanent_audio_path, model_type)

        # Update Database Skrining
        skrining.metode_skrining = f"Hybrid (Form + {model_type.upper()})"
        skrining.skor_suara_ai = hasil_ai["probabilitas_ai"]
        skrining.file_suara = f"/uploads/audio/{filename}" # Simpan path/URL relatif
        skrining.gradcam_image = hasil_ai["spectrogram_image"] 
        skrining.detail_matematika = hasil_ai["math_details"] # Otomatis tersimpan sebagai JSON

        # Logika Hybrid Rujukan
        if hasil_ai["diagnosis"] == "Suspek TBC":
            skrining.hasil_deteksi = "TERDUGA TBC"
            
            existing_rujukan = Rujukan.query.filter_by(skrining_id=skrining.id).first()
            if not existing_rujukan:
                new_rujukan = Rujukan(
                    skrining_id=skrining.id,
                    pasien_id=skrining.pasien_id,
                    status=StatusRujukan.PENDING,
                    catatan=f"Rujukan otomatis dari AI Suara ({hasil_ai['probabilitas_ai']:.0f}% TBC)"
                )
                db.session.add(new_rujukan)

        db.session.commit()

        return response.success({
            "skrining_id": skrining.id,
            "hasil_deteksi_akhir": skrining.hasil_deteksi,
            "probabilitas_tbc": hasil_ai["probabilitas_ai"],
            "spectrogram_image": hasil_ai["spectrogram_image"],
            "math_details": hasil_ai["math_details"],
            "file_suara_url": skrining.file_suara
        }, "Skrining suara berhasil diintegrasikan.")

    except Exception as e:
        db.session.rollback()
        print("Error process_audio_detect:", e)
        return response.bad_request([], f"Gagal memproses AI Suara: {str(e)}")
    
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