# app/services/ai_service.py

import pandas as pd
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from flask import current_app

class AIService:
    _instance = None
    model = None
    rf_columns = []

    def __new__(cls):
        # Singleton: Agar training hanya terjadi 1x saat aplikasi jalan
        if cls._instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
            cls._instance.train_model()
        return cls._instance

    def train_model(self):
        try:
            # Sesuaikan path dataset dengan struktur foldermu
            # Asumsi: dataset ada di folder 'app/ml_models'
            base_dir = os.path.abspath(os.path.dirname(__file__)) # folder services
            app_dir = os.path.dirname(base_dir) # folder app
            dataset_path = os.path.join(app_dir, 'ml_models', 'tuberculosis_xray_dataset.csv')
            
            print(f"⏳ Training AI Model dari: {dataset_path} ...")
            df = pd.read_csv(dataset_path)

            # --- Preprocessing ---
            # Mapping manual untuk kolom ordinal
            maps = {
                'Fever': {'Mild': 0, 'Moderate': 1, 'High': 2},
                'Sputum_Production': {'Low': 0, 'Medium': 1, 'High': 2},
                'Smoking_History': {'Never': 0, 'Former': 1, 'Current': 2}
            }
            for col, mapping in maps.items():
                if col in df.columns:
                    df[col] = df[col].map(mapping).fillna(0)

            # Label Encoder untuk kolom kategori
            categorical_cols = ['Gender', 'Chest_Pain', 'Night_Sweats', 'Blood_in_Sputum', 'Previous_TB_History', 'Class']
            for col in categorical_cols:
                if col in df.columns:
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col].astype(str))

            # Training
            X = df.drop(['Class', 'Patient_ID'], axis=1, errors='ignore')
            y = df['Class']
            self.rf_columns = X.columns.tolist() # Simpan urutan kolom

            self.model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
            self.model.fit(X, y)
            print("✅ Model AI Random Forest Siap!")
            
        except Exception as e:
            print(f"❌ Error Training AI: {e}")

    def predict(self, form_data):
        if not self.model:
            return 0, 0.0
        
        # Mapping Data Form Indonesia (User) -> Dataset Inggris (AI)
        # Helper function
        def parse_yn(val, yes_score):
            # Cek berbagai variasi input "Ya"
            return yes_score if str(val).lower() in ['ya', 'iya', 'true', '1', 'yes'] else 0

        row = {}
        # Mapping field form kamu ke kolom dataset
        # Nilai default (score) disesuaikan agar AI mengerti (misal Batuk 'Ya' = 5/Moderate)
        row['Age'] = float(form_data.get('usia', 30))
        # Jika form pakai Laki-laki/Perempuan, dataset pakai 1/0
        row['Gender'] = 1 if str(form_data.get('jenis_kelamin')).lower() == 'laki-laki' else 0
        
        row['Cough_Severity'] = parse_yn(form_data.get('batuk'), 5) 
        row['Fever'] = parse_yn(form_data.get('demam_yang_tidak_diketahui_penyebabnya'), 1)
        row['Weight_Loss'] = parse_yn(form_data.get('bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun'), 5.0)
        row['Fatigue'] = parse_yn(form_data.get('badan_lemas'), 5)
        row['Night_Sweats'] = parse_yn(form_data.get('berkesingat_malam_hari_tanpa_kegiatan'), 1)
        row['Breathlessness'] = parse_yn(form_data.get('sesak_napas_tanpa_nyeri_dada'), 5)
        row['Smoking_History'] = parse_yn(form_data.get('merokok_atau_perokokok_pasif'), 2)
        row['Previous_TB_History'] = parse_yn(form_data.get('pernah_terdiagnosis_tbc'), 1)
        
        # Isi kolom sisa dataset yang tidak ada di form dengan 0
        df_input = pd.DataFrame([row])
        for col in self.rf_columns:
            if col not in df_input.columns:
                df_input[col] = 0
                
        # Urutkan kolom sesuai saat training
        df_input = df_input[self.rf_columns]
        
        prediction = self.model.predict(df_input)[0]
        probability = self.model.predict_proba(df_input)[0][1]
        
        return prediction, probability