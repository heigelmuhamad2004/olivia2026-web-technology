# reset_nik.py
from app import app, db
from sqlalchemy import text

with app.app_context():
    print("Memulai pembersihan data NIK yang rusak di database...")
    
    # 1. BACA MENGGUNAKAN RAW SQL
    # Kita hanya mengambil kolom 'id' saja, mengabaikan kolom 'nik' 
    # agar SQLAlchemy-utils tidak mencoba melakukan dekripsi
    raw_ids = db.session.execute(text("SELECT id FROM pasien")).fetchall()
    
    counter = 0
    for index, row in enumerate(raw_ids, start=1):
        pasien_id = row[0]
        
        # Buat NIK dummy 16 digit murni
        nik_bersih = f"331012{str(index).zfill(10)}"
        
        # 2. UPDATE MENGGUNAKAN RAW SQL
        db.session.execute(
            text("UPDATE pasien SET nik = :nik WHERE id = :id"),
            {"nik": nik_bersih, "id": pasien_id}
        )
        counter += 1

    db.session.commit()
    print("==========================================")
    print(f"BERHASIL! {counter} pasien telah di-reset ke NIK murni.")
    print("==========================================")