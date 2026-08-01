import os
import io
import math
import numpy as np
import librosa
import librosa.display
import soundfile as sf
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model
import base64
import joblib
import traceback

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
    'Recall': tf.keras.metrics.Recall,
    'AUC': tf.keras.metrics.AUC,
    'Concatenate': tf.keras.layers.Concatenate,
    'BatchNormalization': tf.keras.layers.BatchNormalization,
    'Dropout': tf.keras.layers.Dropout,
    'GlobalAveragePooling2D': tf.keras.layers.GlobalAveragePooling2D
}

# =========================================================
# LAZY LOADING STATE (Global Variables)
# =========================================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'ml_models')

_SCALER = None
_MODELS = {}

def _init_models_if_needed():
    """Fungsi pembantu untuk me-load model HANYA ketika dibutuhkan (Lazy Loading)"""
    global _SCALER, _MODELS
    
    # Jika sudah pernah diload, langsung kembalikan (tidak perlu load ulang)
    if _SCALER is not None and "cnn" in _MODELS and "densenet" in _MODELS:
        return 

    print("\n🚀 [Multimodal AI] Memulai pemuatan Model & Scaler...")
    
    SCALER_PATH = os.path.join(MODELS_DIR, 'scaler_klinis.pkl')
    CNN_PATH = os.path.join(MODELS_DIR, 'model_cnn_multimodal_best.h5')
    DENSENET_PATH = os.path.join(MODELS_DIR, 'model_densenet_multimodal_v2_best.h5')

    # Cek keberadaan file fisik 
    if not os.path.exists(SCALER_PATH):
        raise FileNotFoundError(f"Scaler tidak ditemukan di: {SCALER_PATH}")
    if not os.path.exists(CNN_PATH):
        raise FileNotFoundError(f"Model CNN tidak ditemukan di: {CNN_PATH}")
    if not os.path.exists(DENSENET_PATH):
        raise FileNotFoundError(f"Model DenseNet tidak ditemukan di: {DENSENET_PATH}")

    try:
        print("   -> Memuat Scaler Klinis...")
        _SCALER = joblib.load(SCALER_PATH)
        
        print("   -> Memuat Model CNN Multimodal...")
        # compile=False SANGAT PENTING untuk mencegah error deserialization optimizer
        _MODELS["cnn"] = load_model(CNN_PATH, custom_objects=custom_objects_patch, compile=False)
        
        print("   -> Memuat Model DenseNet Multimodal...")
        _MODELS["densenet"] = load_model(DENSENET_PATH, custom_objects=custom_objects_patch, compile=False)
        
        print("✅ [Multimodal AI] Semua Model dan Scaler BERHASIL dimuat!\n")
    except Exception as e:
        print("\n❌❌❌ FATAL ERROR SAAT MEMUAT MODEL AI ❌❌❌")
        print(traceback.format_exc())
        print("❌❌❌======================================❌❌❌\n")
        raise e


class AIAudioService:
    
    @staticmethod
    def generate_preview_base64(audio_path):
        """Memotong audio tepat 0.5s di puncak suara (Sesuai dataset Synapse)."""
        try:
            y, sr = librosa.load(audio_path, sr=22050)
            y_trimmed, _ = librosa.effects.trim(y, top_db=20)
            
            if len(y_trimmed) == 0:
                raise ValueError("Suara tidak terdeteksi atau terlalu hening. Silakan rekam ulang.")
            if np.max(np.abs(y_trimmed)) < 0.05:
                raise ValueError("Suara terlalu pelan. Silakan rekam ulang batuk yang lebih jelas.")

            target_samples = int(0.5 * sr)
            titik_puncak = np.argmax(np.abs(y_trimmed))
            awal = max(0, titik_puncak - (target_samples // 2))
            akhir = min(len(y_trimmed), awal + target_samples)
            y_potong = y_trimmed[awal:akhir]

            if len(y_potong) < target_samples:
                y_potong = np.pad(y_potong, (0, target_samples - len(y_potong)), mode='constant')

            buffer = io.BytesIO()
            sf.write(buffer, y_potong, sr, format='WAV')
            buffer.seek(0)
            
            audio_base64 = base64.b64encode(buffer.read()).decode('utf-8')
            return f"data:audio/wav;base64,{audio_base64}"
            
        except Exception as e:
            raise ValueError(f"Gagal memproses preview audio: {str(e)}")

    @staticmethod
    def _is_yes(value):
        truthy = {"ya", "iya", "true", "1", "yes", True, 1}
        if value is None:
            return 0
        if isinstance(value, bool):
            return 1 if value else 0
        return 1 if str(value).strip().lower() in truthy else 0

    @staticmethod
    def _siapkan_data_klinis(skrining):
        """Mengambil persis 9 fitur klinis dari DB, di-scale agar identik dengan Colab."""
        _init_models_if_needed()
        global _SCALER

        pasien = skrining.pasien
        
        age = 30
        if pasien.tanggal_lahir:
            import datetime
            age = datetime.date.today().year - pasien.tanggal_lahir.year
            
        sex_str = pasien.jenis_kelamin.value if hasattr(pasien.jenis_kelamin, 'value') else str(pasien.jenis_kelamin)
        sex = 1 if sex_str.strip().lower() in ['laki-laki', 'l', 'male'] else 0
        
        weight = float(skrining.berat_badan) if skrining.berat_badan else 50.0
        height = float(skrining.tinggi_badan) if skrining.tinggi_badan else 160.0
        weight_loss = AIAudioService._is_yes(skrining.bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun)
        fever = AIAudioService._is_yes(skrining.demam_yang_tidak_diketahui_penyebabnya)
        night_sweats = AIAudioService._is_yes(skrining.berkesingat_malam_hari_tanpa_kegiatan)
        smoke_lweek = AIAudioService._is_yes(skrining.merokok_atau_perokokok_pasif)
        tb_prior = AIAudioService._is_yes(skrining.pernah_terdiagnosis_tbc)
        
        fitur_mentah = np.array([[age, sex, weight, height, weight_loss, fever, night_sweats, smoke_lweek, tb_prior]])
        
        # Gunakan variabel _SCALER global yang sudah diload
        fitur_scaled = _SCALER.transform(fitur_mentah)
        return fitur_scaled.astype(np.float32)


    @staticmethod
    def _siapkan_gambar_spektrogram(audio_path):
        """Membuat Tensor Gambar Spektrogram dari Audio.
        
        PERBAIKAN: sekarang trim hening dulu (librosa.effects.trim) SEBELUM
        cari puncak - konsisten dengan generate_preview_base64(). Tanpa ini,
        argmax bisa 'terjebak' pada noise/klik di awal rekaman mentah,
        bukan pada suara batuk sesungguhnya - menyebabkan spektrogram yang
        dihasilkan nyaris sama terus meski audio aslinya beda-beda.
        """
        y, sr = librosa.load(audio_path, sr=22050)

        # --- LANGKAH BARU: trim hening dulu, SAMA seperti generate_preview_base64 ---
        y_trimmed, _ = librosa.effects.trim(y, top_db=20)

        if len(y_trimmed) == 0:
            raise ValueError("Suara tidak terdeteksi atau terlalu hening. Silakan rekam ulang.")
        if np.max(np.abs(y_trimmed)) < 0.05:
            raise ValueError("Suara terlalu pelan. Silakan rekam ulang batuk yang lebih jelas.")

        target_samples = int(0.5 * sr)
        if len(y_trimmed) > target_samples:
            # Cari puncak DI DALAM audio yang SUDAH bersih dari hening/noise awal
            puncak = np.argmax(np.abs(y_trimmed))
            awal = max(0, puncak - (target_samples // 2))
            akhir = min(len(y_trimmed), awal + target_samples)
            y_final = y_trimmed[awal:akhir]
        else:
            y_final = y_trimmed

        if len(y_final) < target_samples:
            y_final = np.pad(y_final, (0, target_samples - len(y_final)), mode='constant')

        S = librosa.feature.melspectrogram(y=y_final, sr=sr, n_mels=128, n_fft=1024, hop_length=64)
        S_dB = librosa.power_to_db(S, ref=np.max)

        fig = plt.figure(figsize=(3, 3))
        ax = plt.axes([0., 0., 1., 1.], frameon=False, xticks=[], yticks=[])
        librosa.display.specshow(S_dB, sr=sr, fmax=8000, cmap='viridis', ax=ax)

        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, dpi=100)
        plt.close(fig)
        buf.seek(0)

        img_b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
        img_pil = Image.open(buf).convert('RGB').resize((224, 224))
        input_tensor = np.expand_dims(np.array(img_pil).astype(np.float32) / 255.0, axis=0)

        return input_tensor, img_b64

    @classmethod
    def analyze_multimodal(cls, audio_path, skrining, model_type="cnn"):
        """Fungsi Utama Prediksi Multimodal AI (Gambar Spektrogram + Vektor Klinis)"""
        _init_models_if_needed()
        global _MODELS

        if model_type not in _MODELS:
            raise ValueError(f"Model {model_type} tidak dikenali.")
            
        model = _MODELS[model_type]
        
        tensor_audio, spectrogram_b64 = cls._siapkan_gambar_spektrogram(audio_path)
        tensor_klinis = cls._siapkan_data_klinis(skrining)

        # Prediksi Multimodal (Membutuhkan List 2 Element)
        prediction = model.predict([tensor_audio, tensor_klinis], verbose=0)
        probabilitas = float(prediction[0][0])
        
        # Matematika Inverse Sigmoid
        epsilon = 1e-7
        p_safe = max(min(probabilitas, 1 - epsilon), epsilon)
        raw_logit_z = math.log(p_safe / (1 - p_safe))

        return {
            "probabilitas_desimal": probabilitas,
            "spectrogram_image": spectrogram_b64,
            "raw_klinis_input": tensor_klinis.tolist(),
            "math_details": {
                "aktivasi": "Sigmoid (Binary Classification)",
                "probabilitas_p": round(probabilitas, 4),
                "raw_logit_z": round(raw_logit_z, 4),
                "vektor_klinis_scaled": tensor_klinis.tolist()
            }
        }