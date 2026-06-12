# app/services/ai_audio_service.py

import os
import io
import math
import tempfile
import numpy as np
import librosa
import librosa.display
import soundfile as sf
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model
import base64
import math

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# =========================================================
# PATCH KHUSUS UNTUK MODEL DARI GOOGLE COLAB
# =========================================================
class CustomDense(tf.keras.layers.Dense):
    def __init__(self, **kwargs):
        kwargs.pop('quantization_config', None)
        super().__init__(**kwargs)

class CustomConv2D(tf.keras.layers.Conv2D):
    def __init__(self, **kwargs):
        kwargs.pop('quantization_config', None)
        super().__init__(**kwargs)

custom_objects_patch = {
    'Dense': CustomDense,
    'Conv2D': CustomConv2D,
    'Recall': tf.keras.metrics.Recall # Tambahkan ini karena kita pakai Recall saat training!
}
# =========================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'ml_models')

print("⏳ Memuat model AI Audio...")
MODELS = {}
try:
    MODELS = {
        "cnn": load_model(os.path.join(MODELS_DIR, 'model_custom4_cnn_terbaik.h5'), custom_objects=custom_objects_patch),
        "densenet": load_model(os.path.join(MODELS_DIR, 'model_densenet_terbaik.h5'), custom_objects=custom_objects_patch)
    }
    print("✅ Model AI Audio berhasil dimuat!")
except Exception as e:
    print(f"❌ Gagal memuat model Audio: {e}")

class AIAudioService:
    
    @staticmethod
    def generate_preview_base64(audio_path):
        """Memotong audio 1.2s di puncak suara dan mengembalikan Base64 Audio untuk diputar di Frontend."""
        try:
            y, sr = librosa.load(audio_path, sr=22050)
            
            # Hapus hening
            y_trimmed, _ = librosa.effects.trim(y, top_db=20)
            if np.max(np.abs(y_trimmed)) < 0.05:
                raise ValueError("Suara terlalu pelan. Silakan rekam ulang batuk yang lebih jelas.")

            # Smart Crop 1.2 Detik
            titik_puncak = np.argmax(np.abs(y_trimmed))
            total_samples = int(1.2 * sr)
            titik_awal = max(0, titik_puncak - int(0.2 * sr))
            titik_akhir = min(len(y_trimmed), titik_awal + total_samples)
            
            if titik_akhir - titik_awal < total_samples:
                titik_awal = max(0, titik_akhir - total_samples)
                
            y_potong = y_trimmed[titik_awal:titik_akhir]

            # Simpan ke memori (buffer) lalu jadikan Base64
            buffer = io.BytesIO()
            sf.write(buffer, y_potong, sr, format='WAV')
            buffer.seek(0)
            
            audio_base64 = base64.b64encode(buffer.read()).decode('utf-8')
            return f"data:audio/wav;base64,{audio_base64}"
            
        except Exception as e:
            raise ValueError(f"Gagal memproses preview audio: {str(e)}")

    @classmethod
    def analyze(cls, audio_path, model_type="cnn"):
        """Menerima file audio yang sudah DISETUJUI user, membuat spektrogram, dan memprediksi."""
        if model_type not in MODELS:
            raise ValueError(f"Model {model_type} tidak dikenali.")
            
        model = MODELS[model_type]
        
        # 1. Load audio (audio ini sudah dipotong 1.2s dari tahap preview)
        y, sr = librosa.load(audio_path, sr=22050)
        
        # 2. Buat Spektrogram
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
        S_dB = librosa.power_to_db(S, ref=np.max)

        fig = plt.figure(figsize=(3, 3))
        ax = plt.axes([0., 0., 1., 1.], frameon=False, xticks=[], yticks=[])
        librosa.display.specshow(S_dB, sr=sr, fmax=8000, cmap='viridis', ax=ax)

        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, dpi=100)
        plt.close(fig)
        buf.seek(0)

        # 3. Base64 Spektrogram & Resize
        spectrogram_b64_string = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
        img_pil = Image.open(buf).convert('RGB').resize((224, 224)) 
        
        input_tensor = np.expand_dims(np.array(img_pil).astype(np.float32) / 255.0, axis=0)

        # 4. Prediksi AI (Sigmoid menghasilkan 1 nilai)
        prediction = model.predict(input_tensor, verbose=0)
        probabilitas = float(prediction[0][0])
        
        # 5. Matematika Inverse Sigmoid (Logit)
        epsilon = 1e-7
        p_safe = max(min(probabilitas, 1 - epsilon), epsilon)
        raw_logit_z = math.log(p_safe / (1 - p_safe))
        
        diagnosis = "Suspek TBC" if probabilitas > 0.50 else "Normal"

        return {
            "diagnosis": diagnosis,
            "probabilitas_ai": probabilitas * 100,
            "spectrogram_image": spectrogram_b64_string,
            "math_details": {
                "aktivasi": "Sigmoid (Binary Classification)",
                "probabilitas_p": round(probabilitas, 4),
                "raw_logit_z": round(raw_logit_z, 4),
                "threshold": 0.50,
                "rumus": "z = ln(P / (1 - P))",
                "keterangan": f"Nilai probabilitas {probabilitas:.2f} {'>' if probabilitas > 0.5 else '<='} threshold 0.50. Kesimpulan: {diagnosis}."
            }
        }

    @classmethod
    def analyze_dual_model(cls, audio_path):
        """Menjalankan CNN dan DenseNet secara bersamaan untuk 1 file audio."""
        try:
            # 1. Load Audio & Buat Spektrogram
            y, sr = librosa.load(audio_path, sr=22050)
            S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
            S_dB = librosa.power_to_db(S, ref=np.max)

            fig = plt.figure(figsize=(3, 3))
            ax = plt.axes([0., 0., 1., 1.], frameon=False, xticks=[], yticks=[])
            librosa.display.specshow(S_dB, sr=sr, fmax=8000, cmap='viridis', ax=ax)

            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, dpi=100)
            plt.close(fig)
            buf.seek(0)

            spectrogram_b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
            img_pil = Image.open(buf).convert('RGB').resize((224, 224)) 
            input_tensor = np.expand_dims(np.array(img_pil).astype(np.float32) / 255.0, axis=0)

            # 2. Prediksi 2 Model
            pred_cnn = float(MODELS["cnn"].predict(input_tensor, verbose=0)[0][0])
            pred_dense = float(MODELS["densenet"].predict(input_tensor, verbose=0)[0][0])

            # 3. Metrik Statis Hasil Training (Ganti dengan angkamu sendiri nanti)
            METRIK_CNN = {"rmse": 12.45, "mae": 8.30, "mse": 1.55}
            METRIK_DENSE = {"rmse": 10.12, "mae": 7.05, "mse": 1.02}

            return {
                "cnn": {
                    "probabilitas": pred_cnn * 100,
                    "diagnosis": "Suspek TBC" if pred_cnn > 0.50 else "Normal",
                    "spectrogram_image": spectrogram_b64,
                    "metrics": METRIK_CNN
                },
                "densenet": {
                    "probabilitas": pred_dense * 100,
                    "diagnosis": "Suspek TBC" if pred_dense > 0.50 else "Normal",
                    "spectrogram_image": spectrogram_b64,
                    "metrics": METRIK_DENSE
                }
            }
        except Exception as e:
            raise ValueError(f"Gagal melakukan komparasi model: {str(e)}")