from app import db
from datetime import datetime
import enum

class StatusRujukan(enum.Enum):
    PENDING = 'Pending'
    VERIFIED = 'Terverifikasi'
    REJECTED = 'Ditolak'

class Rujukan(db.Model):
    __tablename__ = 'rujukan'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    
    # Kita hanya me-refer ke ID tabel lain.
    # Ini AMAN karena kita tidak mengubah tabel Skrining/Pasien, 
    # kita hanya "menunjuk" mereka dari sini.
    skrining_id = db.Column(db.BigInteger, db.ForeignKey('skrining.id'), nullable=False, unique=True)
    pasien_id = db.Column(db.BigInteger, db.ForeignKey('pasien.id'), nullable=False)
    verified_by_user_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=True)
    
    status = db.Column(db.Enum(StatusRujukan), default=StatusRujukan.PENDING, nullable=False)
    catatan = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi (Backref)
    # Ini hanya shortcut level kode Python, tidak mengubah struktur tabel di DB
    skrining = db.relationship('Skrining', backref=db.backref('rujukan_detail', uselist=False))
    pasien = db.relationship('Pasien', backref='list_rujukan')