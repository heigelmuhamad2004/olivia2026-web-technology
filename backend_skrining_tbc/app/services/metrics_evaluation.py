import math
from app import db 
from app.model.skrining import Skrining

class MetricsEvaluationService:
    @staticmethod
    def calculate_global_metrics():
        try:
            skrinings = Skrining.query.filter(Skrining.detail_matematika != None).all()

            total_diuji = 0
            total_suspek = 0

            # Keranjang Error
            cnn_abs_errors, cnn_sq_errors = [], []
            dense_abs_errors, dense_sq_errors = [], []
            anomalies = []

            # ==========================================
            # VARIABEL CONFUSION MATRIX BARU
            # ==========================================
            cnn_tp = cnn_tn = cnn_fp = cnn_fn = 0
            dense_tp = dense_tn = dense_fp = dense_fn = 0

            for sk in skrinings:
                data = sk.detail_matematika
                if not data or 'cnn' not in data or 'densenet' not in data:
                    continue

                total_diuji += 1

                is_suspek = 'terduga' in sk.hasil_deteksi.lower()
                if is_suspek:
                    total_suspek += 1
                    
                y_true = 100.0 if is_suspek else 0.0
                y_true_class = 1 if is_suspek else 0 # 1 = TBC, 0 = Sehat

                # --- CNN ---
                cnn_prob = data['cnn'].get('probabilitas', 0.0)
                cnn_abs_errors.append(abs(y_true - cnn_prob))
                cnn_sq_errors.append((y_true - cnn_prob) ** 2)

                # Klasifikasi CNN (Threshold 50%)
                cnn_pred_class = 1 if cnn_prob >= 50.0 else 0
                if y_true_class == 1 and cnn_pred_class == 1: cnn_tp += 1
                elif y_true_class == 0 and cnn_pred_class == 0: cnn_tn += 1
                elif y_true_class == 0 and cnn_pred_class == 1: cnn_fp += 1
                elif y_true_class == 1 and cnn_pred_class == 0: cnn_fn += 1

                # --- DENSENET ---
                dense_prob = data['densenet'].get('probabilitas', 0.0)
                dense_abs_errors.append(abs(y_true - dense_prob))
                dense_sq_errors.append((y_true - dense_prob) ** 2)

                # Klasifikasi DenseNet (Threshold 50%)
                dense_pred_class = 1 if dense_prob >= 50.0 else 0
                if y_true_class == 1 and dense_pred_class == 1: dense_tp += 1
                elif y_true_class == 0 and dense_pred_class == 0: dense_tn += 1
                elif y_true_class == 0 and dense_pred_class == 1: dense_fp += 1
                elif y_true_class == 1 and dense_pred_class == 0: dense_fn += 1

                # --- ANOMALI (Tetap sama) ---
                nama_pasien = sk.pasien.nama if hasattr(sk, 'pasien') and sk.pasien else f"Pasien ID: {sk.pasien_id}" 
                if abs(y_true - cnn_prob) > 50.0:
                    anomalies.append({"id": int(f"10{sk.id}"), "nama": nama_pasien, "kunci_asli": sk.hasil_deteksi, "prediksi_ai": f"{cnn_prob:.2f}%", "model": "CNN", "error_margin": round(abs(y_true - cnn_prob), 2)})
                if abs(y_true - dense_prob) > 50.0:
                    anomalies.append({"id": int(f"20{sk.id}"), "nama": nama_pasien, "kunci_asli": sk.hasil_deteksi, "prediksi_ai": f"{dense_prob:.2f}%", "model": "DenseNet", "error_margin": round(abs(y_true - dense_prob), 2)})

            anomalies = sorted(anomalies, key=lambda x: x['error_margin'], reverse=True)[:10]

            # ==========================================
            # FUNGSI PEMBANTU MENGHITUNG METRIK
            # ==========================================
            def calc_classification_metrics(tp, tn, fp, fn):
                total = tp + tn + fp + fn
                accuracy = (tp + tn) / total if total > 0 else 0
                precision = tp / (tp + fp) if (tp + fp) > 0 else 0
                recall = tp / (tp + fn) if (tp + fn) > 0 else 0
                f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
                return {
                    "tp": tp, "tn": tn, "fp": fp, "fn": fn,
                    "accuracy": round(accuracy * 100, 2),
                    "precision": round(precision * 100, 2),
                    "recall": round(recall * 100, 2),
                    "f1_score": round(f1 * 100, 2)
                }

            if total_diuji > 0:
                cnn_metrics = {
                    "mae": round(sum(cnn_abs_errors) / total_diuji, 2),
                    "mse": round(sum(cnn_sq_errors) / total_diuji, 2),
                    "rmse": round(math.sqrt(sum(cnn_sq_errors) / total_diuji), 2),
                    **calc_classification_metrics(cnn_tp, cnn_tn, cnn_fp, cnn_fn)
                }
                dense_metrics = {
                    "mae": round(sum(dense_abs_errors) / total_diuji, 2),
                    "mse": round(sum(dense_sq_errors) / total_diuji, 2),
                    "rmse": round(math.sqrt(sum(dense_sq_errors) / total_diuji), 2),
                    **calc_classification_metrics(dense_tp, dense_tn, dense_fp, dense_fn)
                }
            else:
                empty_metrics = {"mae": 0.0, "mse": 0.0, "rmse": 0.0, "tp": 0, "tn": 0, "fp": 0, "fn": 0, "accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1_score": 0.0}
                cnn_metrics = empty_metrics
                dense_metrics = empty_metrics

            return {
                "status": "success",
                "metrics": {
                    "total_pasien": total_diuji,
                    "total_suspek": total_suspek,
                    "cnn": cnn_metrics,
                    "densenet": dense_metrics
                },
                "anomalies": anomalies
            }
        except Exception as e:
            print(f"Error pada MetricsEvaluationService: {str(e)}")
            return {"status": "error", "message": "Terjadi kesalahan saat menghitung metrik evaluasi."}