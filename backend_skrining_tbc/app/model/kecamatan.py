from app import db

class Kecamatan(db.Model):
    __tablename__ = 'kecamatan'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    nama_kecamatan = db.Column(db.String(100), unique=False, nullable=False)
    kabupaten_id = db.Column(db.BigInteger, db.ForeignKey('kabupaten.id'), nullable=False)

    pasien = db.relationship('Pasien', backref='kecamatan', lazy=True)

    def __repr__(self):
        return f'<Kecamatan {self.nama_kecamatan}>'