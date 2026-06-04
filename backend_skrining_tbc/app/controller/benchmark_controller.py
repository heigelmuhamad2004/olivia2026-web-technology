# app/controller/benchmark_controller.py

import os
import tempfile
import base64
import time
from flask import request
from flask_jwt_extended import jwt_required
from app import response
from app.services.ai_audio_service import AIAudioService

@jwt_required()
def run_consistency_test():
    """
    Skenario 1: Menguji 1 suara batuk sebanyak N kali (Default: 10x)
    Tujuan: Membuktikan bahwa model AI bersifat deterministik dan konsisten.
    """
    try:
        req_data = request.json
        if not req_data or 'audio_base64' not in req_data:
            return response.bad_request([], "Data audio_base64 tidak ditemukan.")

        audio_b64_string = req_data['audio_base64']
        model_type = req_data.get('model', 'cnn').lower()
        iterations = req_data.get('iterations', 10) # Default 10 kali test

        # 1. Decode Base64 menjadi file WAV fisik (simpan di temp)
        header, encoded = audio_b64_string.split(",", 1)
        audio_data = base64.b64decode(encoded)
        
        fd, temp_path = tempfile.mkstemp(suffix='.wav')
        os.close(fd)
        
        with open(temp_path, "wb") as f:
            f.write(audio_data)

        # 2. Lakukan perulangan pengujian
        hasil_pengujian = []
        for i in range(iterations):
            start_time = time.time()
            
            # Panggil AI Service kita
            hasil_ai = AIAudioService.analyze(temp_path, model_type)
            
            end_time = time.time()
            waktu_eksekusi = round((end_time - start_time) * 1000, 2) # dalam milidetik

            hasil_pengujian.append({
                "iterasi": i + 1,
                "diagnosis": hasil_ai["diagnosis"],
                "probabilitas_ai": hasil_ai["probabilitas_ai"],
                "waktu_eksekusi_ms": waktu_eksekusi,
                "spectrogram_image": hasil_ai["spectrogram_image"],
                "math_details": hasil_ai["math_details"]
            })

        # Hapus file temp setelah selesai
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return response.success({
            "model_digunakan": model_type.upper(),
            "total_iterasi": iterations,
            "hasil_detail": hasil_pengujian
        }, f"Uji Konsistensi {iterations}x berhasil diselesaikan.")

    except Exception as e:
        print("Error Consistency Test:", e)
        return response.bad_request([], f"Gagal menjalankan uji konsistensi: {str(e)}")

@jwt_required()
def run_variation_test():
    """
    Skenario 2: Menguji sekumpulan data audio berbeda (Batch Testing)
    Tujuan: Mengetahui performa AI pada berbagai macam pasien sekaligus.
    """
    try:
        req_data = request.json
        if not req_data or 'audio_list' not in req_data:
            return response.bad_request([], "Daftar audio (audio_list) tidak ditemukan.")

        audio_list = req_data['audio_list'] # Array berisi { id_pasien, nama, audio_base64 }
        model_type = req_data.get('model', 'cnn').lower()

        hasil_pengujian = []
        
        for item in audio_list:
            pasien_nama = item.get('nama', 'Unknown')
            audio_b64_string = item.get('audio_base64')
            
            if not audio_b64_string:
                continue

            header, encoded = audio_b64_string.split(",", 1)
            audio_data = base64.b64decode(encoded)
            
            fd, temp_path = tempfile.mkstemp(suffix='.wav')
            os.close(fd)
            
            with open(temp_path, "wb") as f:
                f.write(audio_data)

            # Prediksi AI
            start_time = time.time()
            hasil_ai = AIAudioService.analyze(temp_path, model_type)
            end_time = time.time()

            hasil_pengujian.append({
                "nama_pasien": pasien_nama,
                "diagnosis": hasil_ai["diagnosis"],
                "probabilitas_ai": hasil_ai["probabilitas_ai"],
                "waktu_eksekusi_ms": round((end_time - start_time) * 1000, 2),
                "spectrogram_image": hasil_ai["spectrogram_image"]
            })

            if os.path.exists(temp_path):
                os.remove(temp_path)

        return response.success({
            "model_digunakan": model_type.upper(),
            "total_data": len(hasil_pengujian),
            "hasil_detail": hasil_pengujian
        }, "Uji Variasi (Batch Test) berhasil diselesaikan.")

    except Exception as e:
        print("Error Variation Test:", e)
        return response.bad_request([], f"Gagal menjalankan uji variasi: {str(e)}")