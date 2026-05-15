from app import db

class Kabupaten(db.Model):
    __tablename__ = 'kabupaten'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    nama_kabupaten = db.Column(db.String(100), unique=True, nullable=False)
    provinsi_id = db.Column(db.BigInteger, db.ForeignKey('provinsi.id'), nullable=False)

    kecamatan = db.relationship('Kecamatan', backref='kabupaten', lazy=True)

    def __repr__(self):
        return f'<Kabupaten {self.nama_kabupaten}>'