# app/services/ai_audio_service.py

import os
import io
import math
import subprocess
import tempfile
import numpy as np
import librosa
import librosa.display
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model
import base64

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# =========================================================
# 🌟 PATCH KHUSUS UNTUK MODEL DARI GOOGLE COLAB
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
    'Conv2D': CustomConv2D
}
# =========================================================

# ==========================================
# INISIALISASI MODEL AI GLOBAL (PENGGUNAAN NORMAL)
# ==========================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'ml_models')

print("⏳ Memuat model AI Audio (CNN & DenseNet)...")
MODELS = {}
try:
    MODELS = {
        "cnn": load_model(os.path.join(MODELS_DIR, 'model_custom4_cnn.h5'), custom_objects=custom_objects_patch),
        "densenet": load_model(os.path.join(MODELS_DIR, 'model_densenet.h5'), custom_objects=custom_objects_patch)
    }
    print("✅ Model AI Audio berhasil dimuat!")
except Exception as e:
    print(f"❌ Gagal memuat model Audio: {e}")


class AIAudioService:
    @staticmethod
    def process_audio(audio_path):
        wav_fd, wav_path = tempfile.mkstemp(suffix=".wav")
        os.close(wav_fd)

        subprocess.call(['ffmpeg', '-y', '-i', audio_path, '-ar', '22050', '-ac', '1', wav_path], 
                        stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)

        try:
            y, sr = librosa.load(wav_path, sr=22050)
            max_amp = np.max(np.abs(y))
            
            if max_amp < 0.05:
                raise ValueError("Suara terlalu pelan. Silakan rekam ulang batuk yang lebih jelas.")

            duration = librosa.get_duration(y=y, sr=sr)
            target_length = sr * 1  
            
            if duration <= 1.1:
                y_final = y
            else:
                peak_idx = np.argmax(np.abs(y))
                start = peak_idx - (target_length // 2)
                end = start + target_length
                
                if start < 0:
                    start = 0
                    end = target_length
                elif end > len(y):
                    end = len(y)
                    start = end - target_length
                    
                y_final = y[start:end]

            if len(y_final) < target_length:
                y_final = np.pad(y_final, (0, target_length - len(y_final)), 'constant')

            S = librosa.feature.melspectrogram(y=y_final, sr=sr, n_mels=128, fmax=8000)
            S_dB = librosa.power_to_db(S, ref=np.max)

            fig = plt.figure(figsize=(3, 3))
            ax = plt.axes([0., 0., 1., 1.], frameon=False, xticks=[], yticks=[])
            librosa.display.specshow(S_dB, sr=sr, fmax=8000, cmap='viridis', ax=ax)

            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, dpi=100)
            plt.close(fig)
            buf.seek(0)

            # 1. Ambil Base64 dari gambar Spektrogram asli untuk dikirim ke Frontend
            spectrogram_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
            spectrogram_b64_string = f"data:image/png;base64,{spectrogram_base64}"

            # 2. Resize gambar menggunakan PIL (menggantikan cv2) untuk masuk ke Model AI
            img_pil = Image.open(buf).convert('RGB')
            img_resized_pil = img_pil.resize((224, 224)) # Pengganti cv2.resize
            
            img_array = np.array(img_resized_pil)
            img_final = img_array.astype(np.float32) / 255.0
            input_tensor = np.expand_dims(img_final, axis=0)

            # Kembalikan TENSOR (untuk AI) dan STRING BASE64 (untuk Frontend)
            return input_tensor, spectrogram_b64_string
            
        finally:
            if os.path.exists(wav_path):
                os.remove(wav_path)

    @classmethod
    def analyze(cls, audio_path, model_type="cnn"):
        if model_type not in MODELS:
            raise ValueError(f"Model {model_type} tidak dikenali.")
            
        model = MODELS[model_type]
        
        # Ambil tensor input dan base64 spektrogram murni
        input_image, spectrogram_base64 = cls.process_audio(audio_path)
        
        prediction = model.predict(input_image)
        
        # Ekstrak nilai probabilitas 0 - 1.0
        prob_normal = float(prediction[0][0])
        prob_tbc = float(prediction[0][1])

        # ======================================================
        # KALKULASI REVERSE SOFTMAX UNTUK TRANSPARANSI FRONTEND
        # ======================================================
        epsilon = 1e-7 # Mencegah error log(0)
        z_norm = math.log(prob_normal + epsilon)
        z_tbc = math.log(prob_tbc + epsilon)
        
        exp_norm = math.exp(z_norm)
        exp_tbc = math.exp(z_tbc)
        sum_exp = exp_norm + exp_tbc 

        diagnosis = "Suspek TBC" if prob_tbc > prob_normal else "Normal"

        return {
            "diagnosis": diagnosis,
            "prob_tbc": prob_tbc * 100, 
            "prob_normal": prob_normal * 100,
            "spectrogram_image": spectrogram_base64, # Mengirim gambar spektrogram murni
            "math_details": {
                "z_tbc": round(z_tbc, 4),
                "z_norm": round(z_norm, 4),
                "exp_tbc": round(exp_tbc, 4),
                "exp_norm": round(exp_norm, 4),
                "sum_exp": round(sum_exp, 4)
            }
        }