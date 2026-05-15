from app import db
from datetime import datetime
import enum

class JenisKelamin(enum.Enum):
    LAKI_LAKI = 'Laki-Laki'
    PEREMPUAN = 'Perempuan'

class Pasien(db.Model):
    __tablename__ = 'pasien'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)
    kecamatan_id = db.Column(db.BigInteger, db.ForeignKey('kecamatan.id'), nullable=False)
    nama = db.Column(db.String(100), nullable=False)
    nik = db.Column(db.String(16), unique=True, nullable=False)
    alamat = db.Column(db.String(255), nullable=False)
    tanggal_lahir = db.Column(db.Date, nullable=False)
    usia = db.Column(db.Integer, nullable=False)
    jenis_kelamin = db.Column(db.Enum(JenisKelamin), nullable=False)
    no_hp = db.Column(db.String(15), nullable=True)
    pekerjaan = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    skrining = db.relationship('Skrining', backref='pasien', lazy=True)

    def __repr__(self):
        return f'<Pasien {self.nama}>'