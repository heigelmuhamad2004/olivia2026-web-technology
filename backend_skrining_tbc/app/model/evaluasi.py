from app import db
from datetime import datetime

class EvaluasiModel(db.Model):
    __tablename__ = 'evaluasi_model'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    nama_file_audio = db.Column(db.String(255), nullable=True)
    prob_cnn = db.Column(db.Float, nullable=False)
    prob_densenet = db.Column(db.Float, nullable=False)
    mae = db.Column(db.Float, nullable=False)
    rmse = db.Column(db.Float, nullable=False)
    made = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<EvaluasiModel {self.id} - CNN:{self.prob_cnn}% vs Dense:{self.prob_densenet}%>'