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
    'Recall': tf.keras.metrics.Recall 
}
# =========================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'ml_models')

print("Memuat model AI Audio...")
MODELS = {}
try:
    # PASTIKAN NAMA FILE INI SESUAI DENGAN YANG ADA DI FOLDER ml_models KAMU
    MODELS = {
        "cnn": load_model(os.path.join(MODELS_DIR, 'model_Custom_CNN_epoch_75.h5'), custom_objects=custom_objects_patch),
        "densenet": load_model(os.path.join(MODELS_DIR, 'model_DenseNet_epoch_150.h5'), custom_objects=custom_objects_patch)
    }
    print("Model AI Audio berhasil dimuat!")
except Exception as e:
    print(f"Gagal memuat model Audio: {e}")

class AIAudioService:
    
    @staticmethod
    def generate_preview_base64(audio_path):
        """Memotong audio tepat 0.5s di puncak suara (Sesuai dataset Synapse)."""
        try:
            y, sr = librosa.load(audio_path, sr=22050)
            
            # Hapus hening
            y_trimmed, _ = librosa.effects.trim(y, top_db=20)
            
            # PENAMBAHAN: Cek jika audio terlalu hening setelah di-trim
            if len(y_trimmed) == 0:
                raise ValueError("Suara tidak terdeteksi atau terlalu hening. Silakan rekam ulang.")

            if np.max(np.abs(y_trimmed)) < 0.05:
                raise ValueError("Suara terlalu pelan. Silakan rekam ulang batuk yang lebih jelas.")

            # PERUBAHAN KRUSIAL 1: Pemotongan Pintar 0.5 Detik (Bukan 1.2 lagi)
            target_samples = int(0.5 * sr)
            titik_puncak = np.argmax(np.abs(y_trimmed))
            
            # Ambil rentang tengah dari puncak
            awal = max(0, titik_puncak - (target_samples // 2))
            akhir = min(len(y_trimmed), awal + target_samples)
            y_potong = y_trimmed[awal:akhir]

            # Jika durasi kurang dari 0.5 detik, lakukan Zero-Padding agar dimensi gambar konsisten
            if len(y_potong) < target_samples:
                y_potong = np.pad(y_potong, (0, target_samples - len(y_potong)), mode='constant')

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
        """Membuat spektrogram dengan ketelitian tinggi dan memprediksi."""
        if model_type not in MODELS:
            raise ValueError(f"Model {model_type} tidak dikenali.")
            
        model = MODELS[model_type]
        
        # 1. Load audio (sudah dipotong 0.5s secara sempurna di tahap preview)
        y, sr = librosa.load(audio_path, sr=22050)
        
        # PERUBAHAN KRUSIAL 2: Parameter hop_length=64 dan n_fft=1024 agar pola visual sama dengan saat training
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, n_fft=1024, hop_length=64)
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

        # 4. Prediksi AI
        prediction = model.predict(input_tensor, verbose=0)
        probabilitas = float(prediction[0][0])
        
        # 5. Matematika Inverse Sigmoid
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
        """Menjalankan CNN dan DenseNet secara bersamaan dengan Data Evaluasi Asli."""
        try:
            # 1. Load Audio & Buat Spektrogram (Dengan hop_length=64)
            y, sr = librosa.load(audio_path, sr=22050)
            S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, n_fft=1024, hop_length=64)
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

            # PERUBAHAN KRUSIAL 3: Memasukkan nilai metrik asli dari hasil evaluasi semalam
            # CNN menggunakan nilai dari Epoch 75, DenseNet menggunakan Epoch 150
            METRIK_CNN = {"rmse": 51.31, "mae": 44.58, "auroc": 0.7390}
            METRIK_DENSE = {"rmse": 50.76, "mae": 29.81, "auroc": 0.7393}

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