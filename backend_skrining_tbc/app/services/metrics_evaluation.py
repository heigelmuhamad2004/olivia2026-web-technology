import math
# TODO: Pastikan import model Skrining di bawah ini sesuai dengan struktur folder Flask-mu
# Misalnya: from app.models import Skrining
from app import db 
from app.model.skrining import Skrining

class MetricsEvaluationService:
    @staticmethod
    def calculate_global_metrics():
        try:
            # 1. Tarik HANYA data skrining yang sudah diuji AI (memiliki detail_matematika)
            skrinings = Skrining.query.filter(Skrining.detail_matematika != None).all()

            total_diuji = 0
            total_suspek = 0

            cnn_abs_errors = []
            cnn_sq_errors = []
            
            dense_abs_errors = []
            dense_sq_errors = []

            anomalies = []

            for sk in skrinings:
                data = sk.detail_matematika
                
                # Lewati jika bukan data Dual Evaluasi (belum ada CNN/DenseNet)
                if not data or 'cnn' not in data or 'densenet' not in data:
                    continue

                total_diuji += 1

                # Kunci Jawaban Asli (Ground Truth)
                is_suspek = 'terduga' in sk.hasil_deteksi.lower()
                if is_suspek:
                    total_suspek += 1
                    
                y_true = 100.0 if is_suspek else 0.0

                # Hitung Error CNN
                cnn_prob = data['cnn'].get('probabilitas', 0.0)
                cnn_abs = abs(y_true - cnn_prob)
                cnn_sq = (y_true - cnn_prob) ** 2
                
                cnn_abs_errors.append(cnn_abs)
                cnn_sq_errors.append(cnn_sq)

                # Hitung Error DenseNet
                dense_prob = data['densenet'].get('probabilitas', 0.0)
                dense_abs = abs(y_true - dense_prob)
                dense_sq = (y_true - dense_prob) ** 2
                
                dense_abs_errors.append(dense_abs)
                dense_sq_errors.append(dense_sq)

                # Dapatkan Nama Pasien
                nama_pasien = f"Pasien ID: {sk.pasien_id}" 
                if hasattr(sk, 'pasien') and sk.pasien:
                    nama_pasien = sk.pasien.nama

                # Deteksi Anomali (Meleset di atas 50%)
                if cnn_abs > 50.0:
                    anomalies.append({
                        "id": int(f"10{sk.id}"),
                        "nama": nama_pasien,
                        "kunci_asli": sk.hasil_deteksi,
                        "prediksi_ai": f"{cnn_prob:.2f}%",
                        "model": "CNN",
                        "error_margin": round(cnn_abs, 2)
                    })
                
                if dense_abs > 50.0:
                    anomalies.append({
                        "id": int(f"20{sk.id}"),
                        "nama": nama_pasien,
                        "kunci_asli": sk.hasil_deteksi,
                        "prediksi_ai": f"{dense_prob:.2f}%",
                        "model": "DenseNet",
                        "error_margin": round(dense_abs, 2)
                    })

            # Urutkan Anomali dari error tertinggi ke terendah, ambil maksimal 10 data
            anomalies = sorted(anomalies, key=lambda x: x['error_margin'], reverse=True)[:10]

            # Lakukan Perhitungan Rata-Rata
            if total_diuji > 0:
                cnn_mae = sum(cnn_abs_errors) / total_diuji
                cnn_mse = sum(cnn_sq_errors) / total_diuji
                cnn_rmse = math.sqrt(cnn_mse)

                dense_mae = sum(dense_abs_errors) / total_diuji
                dense_mse = sum(dense_sq_errors) / total_diuji
                dense_rmse = math.sqrt(dense_mse)
            else:
                cnn_mae = cnn_mse = cnn_rmse = 0.0
                dense_mae = dense_mse = dense_rmse = 0.0

            # Kembalikan Dictionary murni ke Controller
            return {
                "status": "success",
                "metrics": {
                    "total_pasien": total_diuji,
                    "total_suspek": total_suspek,
                    "cnn": {
                        "mae": round(cnn_mae, 2),
                        "mse": round(cnn_mse, 2),
                        "rmse": round(cnn_rmse, 2)
                    },
                    "densenet": {
                        "mae": round(dense_mae, 2),
                        "mse": round(dense_mse, 2),
                        "rmse": round(dense_rmse, 2)
                    }
                },
                "anomalies": anomalies
            }

        except Exception as e:
            print(f"Error pada MetricsEvaluationService: {str(e)}")
            return {
                "status": "error",
                "message": "Terjadi kesalahan saat menghitung metrik evaluasi."
            }