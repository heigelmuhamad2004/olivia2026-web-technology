from app import db
from datetime import datetime
import enum

class UserRole(enum.Enum):
    user = 'user'
    admin_puskesmas = 'admin_puskesmas'
    admin_dinkes = 'admin_dinkes'   # <--- TAMBAHAN ROLE DINKES
    super_admin = 'super_admin'

class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    nama = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.user)
    
    # Relasi Wilayah
    kecamatan_id = db.Column(db.BigInteger, db.ForeignKey('kecamatan.id'), nullable=True)
    kabupaten_id = db.Column(db.BigInteger, db.ForeignKey('kabupaten.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi ke tabel Pasien
    pasien = db.relationship('Pasien', backref='user', lazy=True)
    
    # Relasi ke Kabupaten (untuk admin dinkes)
    kabupaten = db.relationship('Kabupaten', backref='users', lazy=True)

    def __repr__(self):
        return f'<User {self.nama}>'