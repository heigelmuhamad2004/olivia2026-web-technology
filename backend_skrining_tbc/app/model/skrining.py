from app import db
from datetime import datetime
import enum

class SkriningStatus(enum.Enum):
    pending = 'pending'
    completed = 'completed'
    reviewed = 'reviewed'

class Skrining(db.Model):
    __tablename__ = 'skrining'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)
    pasien_id = db.Column(db.BigInteger, db.ForeignKey('pasien.id'), nullable=False)
    berat_badan = db.Column(db.Float, nullable=False)
    tinggi_badan = db.Column(db.Float, nullable=False)
    riwayat_kontak_tbc = db.Column(db.String(255), nullable=False)
    pernah_terdiagnosis_tbc = db.Column(db.String(255), nullable=False)
    pernah_berobat_tbc = db.Column(db.String(255), nullable=False)
    nama_obat_tbc = db.Column(db.String(255), nullable=True)
    pernah_beroobat_tbc_namun_tidak_tuntas = db.Column(db.String(255), nullable=False)
    malnutrisi = db.Column(db.String(255), nullable=False)
    merokok_atau_perokokok_pasif = db.Column(db.String(255), nullable=False)
    riwayat_diabetes_melitus_atau_kencing_manis = db.Column(db.String(255), nullable=False)
    lansia_lebih_dari_60_tahun = db.Column(db.String(255), nullable=False)
    ibu_hamil = db.Column(db.String(255), nullable=False)
    batuk = db.Column(db.String(255), nullable=False)
    bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun = db.Column(db.String(255), nullable=False)
    demam_yang_tidak_diketahui_penyebabnya = db.Column(db.String(255), nullable=False)
    badan_lemas = db.Column(db.String(255), nullable=False)
    berkesingat_malam_hari_tanpa_kegiatan = db.Column(db.String(255), nullable=False)
    sesak_napas_tanpa_nyeri_dada = db.Column(db.String(255), nullable=False)
    ada_pembengkakan_kelenjar_getah_bening_pada_leher_atau_ketiak = db.Column(db.String(255), nullable=False)
    tanggal_skrining = db.Column(db.Date, nullable=False)
    hasil_deteksi = db.Column(db.String(255), nullable=False)

    metode_skrining = db.Column(db.String(50), default="Form Only", nullable=False)
    skor_form_ai = db.Column(db.Float, nullable=True)  # Akurasi dari Random Forest (%)
    skor_suara_ai = db.Column(db.Float, nullable=True) # Probabilitas dari CNN (%) jika pasien batuk
    file_suara = db.Column(db.String(255), nullable=True) # Nama/Path file rekaman untuk riwayat
    gradcam_image = db.Column(db.Text, nullable=True) # Base64 Spektrogram (Pakai Text karena string base64 sangat panjang)
    detail_matematika = db.Column(db.JSON, nullable=True)

    status = db.Column(db.Enum(SkriningStatus), default=SkriningStatus.pending, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Skrining {self.id} - Pasien {self.pasien_id}>'