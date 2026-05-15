from app import db
from datetime import datetime
import enum

class UserRole(enum.Enum):
    user = 'user'
    admin_puskesmas = 'admin_puskesmas'
    super_admin = 'super_admin'

class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    nama = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.user)
    kecamatan_id = db.Column(db.BigInteger, db.ForeignKey('kecamatan.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi ke tabel Pasien
    pasien = db.relationship('Pasien', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.nama}>'