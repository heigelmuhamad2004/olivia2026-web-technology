import math
# TODO: Pastikan import model Skrining di bawah ini sesuai dengan struktur folder Flask-mu
# Misalnya: from app.models import Skrining
from app import db 
from app.model.skrining import Skrining

class MetricsEvaluationService:
    @staticmethod
    def calculate_global_metrics():
        """
        Fungsi ini menghitung evaluasi metrik (MAE, MSE, RMSE) dari seluruh data pengujian.
        Rumus RMSE: Akar dari (Rata-rata Kuadrat Selisih)
        Rumus MAE: Rata-rata dari (Nilai Absolut Selisih)
        """
        try:
            # 1. Tarik HANYA data skrining yang sudah diuji AI (memiliki detail_matematika)
            skrinings = Skrining.query.filter(Skrining.detail_matematika != None).all()

            total_diuji = 0  # Ini adalah variabel 'n' (Total jumlah data)
            total_suspek = 0

            # Keranjang untuk mengumpulkan Error per baris data
            cnn_abs_errors = []  # Menampung nilai absolut untuk perhitungan MAE
            cnn_sq_errors = []   # Menampung nilai kuadrat untuk perhitungan RMSE
            
            dense_abs_errors = []
            dense_sq_errors = []

            anomalies = []

            for sk in skrinings:
                data = sk.detail_matematika
                
                # Lewati jika bukan data Dual Evaluasi (belum ada CNN/DenseNet)
                if not data or 'cnn' not in data or 'densenet' not in data:
                    continue

                total_diuji += 1

                # ==============================================================
                # TAHAP 1: MENENTUKAN NILAI AKTUAL (GROUND TRUTH / y_i)
                # ==============================================================
                is_suspek = 'terduga' in sk.hasil_deteksi.lower()
                if is_suspek:
                    total_suspek += 1
                    
                # y_i = 100 jika Terduga TBC, 0 jika Sehat
                y_true = 100.0 if is_suspek else 0.0

                # ==============================================================
                # TAHAP 2: HITUNG ERROR UNTUK MODEL CNN
                # ==============================================================
                # y_topi (y_prediksi) dari keluaran model AI
                cnn_prob = data['cnn'].get('probabilitas', 0.0)
                
                # MAE Error: | y_i - y_topi | (Selisih mutlak tanpa minus)
                cnn_abs = abs(y_true - cnn_prob)
                
                # RMSE Error: (y_i - y_topi)^2 (Selisih dikuadratkan)
                cnn_sq = (y_true - cnn_prob) ** 2
                
                # Simpan error pasien ini ke keranjang (untuk dijumlahkan nanti)
                cnn_abs_errors.append(cnn_abs)
                cnn_sq_errors.append(cnn_sq)

                # ==============================================================
                # TAHAP 3: HITUNG ERROR UNTUK MODEL DENSENET
                # ==============================================================
                dense_prob = data['densenet'].get('probabilitas', 0.0)
                
                dense_abs = abs(y_true - dense_prob)
                dense_sq = (y_true - dense_prob) ** 2
                
                dense_abs_errors.append(dense_abs)
                dense_sq_errors.append(dense_sq)

                # ==============================================================
                # TAHAP 4: MENCATAT ANOMALI (KESALAHAN FATAL)
                # ==============================================================
                # Dapatkan Nama Pasien
                nama_pasien = f"Pasien ID: {sk.pasien_id}" 
                if hasattr(sk, 'pasien') and sk.pasien:
                    nama_pasien = sk.pasien.nama

                # Deteksi Anomali jika tebakan meleset lebih dari 50%
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

            # ==============================================================
            # TAHAP 5: PERHITUNGAN FINAL METRIK (RATA-RATA & AKAR)
            # ==============================================================
            if total_diuji > 0: # Pastikan n > 0 agar tidak error pembagian nol
                
                # --- FINALISASI CNN ---
                # Rumus MAE: (Sigma Error Absolut) dibagi (n)
                cnn_mae = sum(cnn_abs_errors) / total_diuji
                
                # Rumus MSE: (Sigma Error Kuadrat) dibagi (n)
                cnn_mse = sum(cnn_sq_errors) / total_diuji
                
                # Rumus RMSE: Akar Kuadrat dari MSE 
                cnn_rmse = math.sqrt(cnn_mse)

                # --- FINALISASI DENSENET ---
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