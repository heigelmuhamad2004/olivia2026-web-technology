# app/model/pasien.py
import os
from app import db
from datetime import datetime
import enum
from sqlalchemy_utils import StringEncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import AesEngine

# Kunci rahasia untuk membuka/mengunci NIK (Dalam produksi, letakkan di .env)
# Harus sama persis. Jika kunci ini hilang, semua NIK pasien tidak akan bisa dibaca selamanya!
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY', 'rahasia-kunci-enkripsi-tbc-2026!')

class JenisKelamin(enum.Enum):
    LAKI_LAKI = 'Laki-Laki'
    PEREMPUAN = 'Perempuan'

class Pasien(db.Model):
    __tablename__ = 'pasien'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)
    kecamatan_id = db.Column(db.BigInteger, db.ForeignKey('kecamatan.id'), nullable=False)
    nama = db.Column(db.String(100), nullable=False)
    
    # 🔒 LEVEL 2 SECURITY: Kolom NIK Dienkripsi Otomatis menggunakan AES
    # Panjang kolom diubah ke 255 karena ciphertext (hasil enkripsi) sangat panjang
    # unique=True dihapus dari database level, kita tangani di controller
    nik = db.Column(StringEncryptedType(db.String(255), ENCRYPTION_KEY, AesEngine, 'pkcs5'), nullable=False)
    
    alamat = db.Column(db.String(255), nullable=False)
    tanggal_lahir = db.Column(db.Date, nullable=False)
    usia = db.Column(db.Integer, nullable=False)
    jenis_kelamin = db.Column(db.Enum(JenisKelamin), nullable=False)
    no_hp = db.Column(db.String(15), nullable=True)
    pekerjaan = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Menambahkan cascade="all, delete-orphan" agar pasien bisa dihapus meski punya skrining
    skrining = db.relationship('Skrining', backref='pasien', cascade="all, delete-orphan", lazy=True)

    def __repr__(self):
        return f'<Pasien {self.nama}>'