from app import db

class Provinsi(db.Model):
    __tablename__ = 'provinsi'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    nama_provinsi = db.Column(db.String(100), unique=True, nullable=False)

    kabupaten = db.relationship('Kabupaten', backref='provinsi', lazy=True)

    def __repr__(self):
        return f'<Provinsi {self.nama_provinsi}>'