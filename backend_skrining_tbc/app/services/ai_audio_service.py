# app/services/ai_audio_service.py

import os
import io
import subprocess
import tempfile
import numpy as np
import librosa
import librosa.display
import cv2
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model
import base64

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


# =========================================================
# 🌟 PATCH KHUSUS UNTUK MODEL DARI GOOGLE COLAB
# Mencegah error "Unrecognized keyword arguments passed to Dense"
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
# INISIALISASI MODEL AI GLOBAL (VERSI BYPASS DARURAT)
# ==========================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'ml_models')

print("⏳ Bypass load model AI Audio (Hemat RAM untuk Railway)...")
# MATIKAN SEMENTARA AGAR SERVER TIDAK MATI
# try:
#     # Menggunakan custom_objects_patch agar model bisa dimuat dengan aman
#     MODELS = {
#         "cnn": load_model(os.path.join(MODELS_DIR, 'model_custom4_cnn.h5'), custom_objects=custom_objects_patch),
#         "densenet": load_model(os.path.join(MODELS_DIR, 'model_densenet.h5'), custom_objects=custom_objects_patch)
#     }
#     print("✅ Model AI Audio berhasil dimuat!")
# except Exception as e:
#     print(f"❌ Gagal memuat model Audio: {e}")

MODELS = {} # Set kosong agar server ringan

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
            plt.savefig(buf, format='png', bbox_inches=None, pad_inches=0, dpi=100)
            plt.close(fig)
            buf.seek(0)

            img_pil = Image.open(buf).convert('RGB')
            img_array = np.array(img_pil)
            img_resized = cv2.resize(img_array, (224, 224))
            
            img_final = img_resized.astype(np.float32) / 255.0
            return np.expand_dims(img_final, axis=0)
        finally:
            if os.path.exists(wav_path):
                os.remove(wav_path)

    @staticmethod
    def get_last_conv_layer_name(model):
        # 1. Cara Paling Aman: Cari dari belakang, pastikan layer tersebut outputnya 4D (Gambar)
        for layer in reversed(model.layers):
            try:
                # Cek apakah bentuk output layer ini adalah 4 Dimensi (Batch, Height, Width, Channel)
                if len(layer.output.shape) == 4:
                    # Jangan ambil layer Pooling atau Input agar warna Grad-CAM lebih fokus
                    if 'input' not in layer.name.lower() and 'pool' not in layer.name.lower():
                        return layer.name
            except Exception:
                continue
                
        # 2. Fallback (Rencana Cadangan): Cari paksa layer yang ada kata 'conv'
        for layer in reversed(model.layers):
            if 'conv' in layer.name.lower():
                return layer.name
                
        return None

    @staticmethod
    def make_gradcam_heatmap(img_array, model, last_conv_layer_name, pred_index=None):
        if last_conv_layer_name is None:
            raise ValueError("Tidak menemukan layer Konvolusi untuk XAI.")
        try:
            grad_model = tf.keras.models.Model(
                model.inputs, [model.get_layer(last_conv_layer_name).output, model.output]
            )
        except Exception as e:
            inputs = tf.keras.Input(shape=(224, 224, 3))
            x = inputs
            conv_output = None
            for layer in model.layers:
                x = layer(x)
                if layer.name == last_conv_layer_name:
                    conv_output = x
            grad_model = tf.keras.models.Model(inputs, [conv_output, x])

        with tf.GradientTape() as tape:
            last_conv_layer_output, preds = grad_model(img_array)
            if pred_index is None:
                pred_index = tf.argmax(preds[0])
            class_channel = preds[:, pred_index]

        grads = tape.gradient(class_channel, last_conv_layer_output)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        last_conv_layer_output = last_conv_layer_output[0]

        heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)
        heatmap = tf.maximum(heatmap, 0)

        max_val = tf.math.reduce_max(heatmap)
        if max_val != 0:
            heatmap = heatmap / max_val

        return heatmap.numpy()

    @staticmethod
    def overlay_gradcam(img_array, heatmap):
        img = img_array[0] * 255.0
        img = np.uint8(img)

        heatmap_resized = cv2.resize(heatmap, (img.shape[1], img.shape[0]))
        heatmap_resized = np.uint8(255 * heatmap_resized)

        heatmap_colored = cv2.applyColorMap(heatmap_resized, cv2.COLORMAP_JET)
        heatmap_colored_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        superimposed_img = cv2.addWeighted(heatmap_colored_rgb, 0.4, img, 0.6, 0)
        superimposed_bgr = cv2.cvtColor(superimposed_img, cv2.COLOR_RGB2BGR)
        is_success, buffer = cv2.imencode(".jpg", superimposed_bgr)
        img_str = base64.b64encode(buffer).decode("utf-8")

        return f"data:image/jpeg;base64,{img_str}"

    @classmethod
    def analyze(cls, audio_path, model_type="cnn"):
        if model_type not in MODELS:
            raise ValueError(f"Model {model_type} tidak dikenali.")
            
        model = MODELS[model_type]
        input_image = cls.process_audio(audio_path)
        
        prediction = model.predict(input_image)
        pred_index = np.argmax(prediction[0])

        prob_normal = float(prediction[0][0]) * 100
        prob_tbc = float(prediction[0][1]) * 100

        diagnosis = "Suspek TBC" if prob_tbc > prob_normal else "Normal"
        
        last_conv_layer = cls.get_last_conv_layer_name(model)
        heatmap = cls.make_gradcam_heatmap(input_image, model, last_conv_layer, pred_index)
        gradcam_image_base64 = cls.overlay_gradcam(input_image, heatmap)

        return {
            "diagnosis": diagnosis,
            "prob_tbc": prob_tbc,
            "prob_normal": prob_normal,
            "gradcam_image": gradcam_image_base64
        }
