# app/controller/skrining_audio_controller.py

import os
import tempfile
from flask import request
from flask_jwt_extended import jwt_required, get_jwt
from app import db, response
from app.model.skrining import Skrining
from app.model.rujukan import Rujukan, StatusRujukan
from app.services.ai_audio_service import AIAudioService

@jwt_required()
def process_audio_skrining():
    try:
        claims = get_jwt()
        user_id = claims.get("id")

        # 1. Pastikan request memiliki audio dan skrining_id
        if 'audio' not in request.files:
            return response.bad_request([], "File audio tidak ditemukan.")
            
        file = request.files['audio']
        skrining_id = request.form.get('skrining_id')
        model_type = request.form.get('model', 'cnn').lower()

        # 2. Cari data skrining
        # Jika frontend tidak mengirim skrining_id (atau mengirim "0"), ambil skrining terakhir milik user ini
        if not skrining_id or str(skrining_id) == "0":
            skrining = Skrining.query.filter_by(user_id=user_id).order_by(Skrining.id.desc()).first()
            if not skrining:
                return response.bad_request([], "Belum ada data skrining sebelumnya untuk di-update. Silakan isi form skrining terlebih dahulu.")
        else:
            skrining = Skrining.query.filter_by(id=skrining_id, user_id=user_id).first()
            if not skrining:
                return response.bad_request([], "Data skrining tidak valid atau bukan milik Anda.")

        # 3. Simpan sementara audio
        fd, temp_path = tempfile.mkstemp(suffix=os.path.splitext(file.filename)[1])
        os.close(fd)
        
        try:
            file.save(temp_path)

            # 4. Analisis menggunakan Deep Learning CNN/DenseNet
            hasil_ai = AIAudioService.analyze(temp_path, model_type)

            # 5. Update Database Skrining
            skrining.metode_skrining = f"Hybrid (Form + {model_type.upper()})"
            skrining.skor_suara_ai = hasil_ai["prob_tbc"]
            skrining.gradcam_image = hasil_ai["spectrogram_image"]  # Simpan spektrogram ke gradcam_image
            skrining.detail_matematika = hasil_ai["math_details"]

            # Logika Hybrid: Jika suara mendeteksi Suspek TBC, status akhir diprioritaskan jadi TERDUGA TBC
            if hasil_ai["diagnosis"] == "Suspek TBC":
                skrining.hasil_deteksi = "TERDUGA TBC"
                
                # Cek apakah rujukan sudah dibuat oleh Random Forest sebelumnya. 
                # Jika belum, buat rujukan otomatis!
                existing_rujukan = Rujukan.query.filter_by(skrining_id=skrining.id).first()
                if not existing_rujukan:
                    new_rujukan = Rujukan(
                        skrining_id=skrining.id,
                        pasien_id=skrining.pasien_id,
                        status=StatusRujukan.PENDING,
                        catatan=f"Rujukan otomatis dari AI Suara ({hasil_ai['prob_tbc']:.0f}% TBC)"
                    )
                    db.session.add(new_rujukan)

            db.session.commit()

            return response.success({
                "skrining_id": skrining.id,
                "hasil_deteksi_akhir": skrining.hasil_deteksi,
                "probabilitas_tbc": hasil_ai["prob_tbc"],
                "probabilitas_normal": hasil_ai["prob_normal"],
                "spectrogram_image": hasil_ai["spectrogram_image"],
                "math_details": hasil_ai["math_details"]
            }, "Skrining suara berhasil diintegrasikan dengan form.")

        except ValueError as ve:
            return response.bad_request([], str(ve))
            
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        db.session.rollback()
        print("Error process_audio_skrining:", e)
        return response.bad_request([], f"Gagal memproses AI Suara: {str(e)}")