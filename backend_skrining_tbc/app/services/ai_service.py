# app/services/ai_service.py
"""
RF Service - dilatih pada CODA TB Clinical Meta Info (data klinis riil dari
Synapse), BUKAN lagi tuberculosis_xray_dataset.csv (dataset sintetis yang
terbukti tidak punya sinyal statistik apapun terhadap label - lihat catatan
evaluasi di training script).

PERAN RF dalam sistem (revisi arsitektur):
  RF MENGGANTIKAN Kriteria 1 form Kemenkes ("batuk saja cukup"). RF hanya
  dipanggil KETIKA batuk = Ya (karena dataset training-nya berasal dari
  kohort yang semuanya sudah batuk >=4 hari). RF menilai kombinasi
  batuk + gejala tambahan + demografi untuk memutuskan probabilitas TBC,
  alih-alih menganggap batuk sendirian otomatis cukup.

  Kriteria 2 & 3 form Kemenkes TETAP rule-based murni (lihat
  rule_based_service.py) karena field-nya (kontak erat, malnutrisi,
  DM, ibu hamil, dst) tidak ada representasinya di dataset ini.

Fitur yang dipakai (semua SUDAH ADA di skema DB, TIDAK perlu field baru):
  age, sex, berat_badan, tinggi_badan, weight_loss, fever, night_sweats,
  smoke_lweek (merokok), tb_prior (pernah terdiagnosis TBC)

Fitur yang SENGAJA TIDAK dipakai walau signifikan secara statistik
(hemoptysis, reported_cough_dur, heart_rate, temperature) karena tidak ada
field-nya di form/DB saat ini dan disepakati untuk tidak menambah field baru.
"""

import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # folder app/
MODEL_PATH = os.path.join(BASE_DIR, 'ml_models', 'rf_model_coda.pkl')


class AIService:
    _instance = None
    artifact = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
            cls._instance.load_model()
        return cls._instance

    def load_model(self):
        try:
            self.artifact = joblib.load(MODEL_PATH)
            print(
                f"Model RF (CODA TB) berhasil dimuat. "
                f"AUROC test={self.artifact['auroc_test']:.4f}, "
                f"threshold={self.artifact['threshold']:.4f}, "
                f"sensitivitas={self.artifact['sensitivity_test']:.4f}, "
                f"spesifisitas={self.artifact['specificity_test']:.4f}"
            )
        except Exception as e:
            print(f"GAGAL memuat model RF dari {MODEL_PATH}: {e}")
            self.artifact = None

    @staticmethod
    def _is_yes(val):
        if val is None:
            return False
        return str(val).strip().lower() in ['ya', 'iya', 'true', '1', 'yes']

    def predict(self, form_data: dict):
        """
        form_data diharapkan berisi (nama field bebas, di-passing dari
        skrining_services.py):
          usia, jenis_kelamin, berat_badan, tinggi_badan,
          bb_turun, demam, keringat_malam, merokok, pernah_terdiagnosis_tbc

        Return: (prediction: int 0/1, probability: float 0-1)
        Jika model gagal dimuat -> return (0, 0.0) sebagai fallback aman
        (rule-based Kriteria 2 & 3 tetap jalan meski RF mati).
        """
        if self.artifact is None:
            return 0, 0.0

        model = self.artifact['model']
        feature_columns = self.artifact['feature_columns']
        threshold = self.artifact['threshold']
        median_impute = self.artifact['median_impute']

        jk = str(form_data.get('jenis_kelamin', '')).strip().lower()

        row = {
            'age': form_data.get('usia'),
            'sex_male': 1 if jk == 'laki-laki' else 0,
            'weight': form_data.get('berat_badan'),
            'height': form_data.get('tinggi_badan'),
            'weight_loss': 1 if self._is_yes(form_data.get('bb_turun')) else 0,
            'fever': 1 if self._is_yes(form_data.get('demam')) else 0,
            'night_sweats': 1 if self._is_yes(form_data.get('keringat_malam')) else 0,
            'smoke_lweek': 1 if self._is_yes(form_data.get('merokok')) else 0,
            'tb_prior': 1 if self._is_yes(form_data.get('pernah_terdiagnosis_tbc')) else 0,
        }

        df_input = pd.DataFrame([row])

        # Imputasi median PERSIS sama seperti training (bukan fit ulang)
        for col, val in median_impute.items():
            df_input[col] = df_input[col].fillna(val)
        # Kalau usia/BB/TB tidak diisi sama sekali, isi median juga
        df_input['age'] = df_input['age'].fillna(median_impute.get('age', 30))

        df_input = df_input[feature_columns]

        probability = float(model.predict_proba(df_input)[0][1])
        prediction = int(probability >= threshold)

        return prediction, probability