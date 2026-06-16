from app import app, db
from app.model.pasien import Pasien
from sqlalchemy import text

with app.app_context():
    print("Memulai proses enkripsi data NIK lama...")
    
    # 1. BACA DATA RAW (Mentah)
    # Kita menggunakan raw SQL agar SQLAlchemy tidak mencoba mendekripsinya 
    # (karena jika didekripsi padahal datanya belum dienkripsi, akan terjadi Error)
    raw_pasiens = db.session.execute(text("SELECT id, nik FROM pasien")).fetchall()

    berhasil = 0
    dilewati = 0

    for p in raw_pasiens:
        pasien_id = p[0]
        nik_mentah = p[1]

        # Cek apakah NIK sudah berbentuk cipher (hasil enkripsi biasanya lebih dari 50 karakter)
        if len(nik_mentah) > 20:
            dilewati += 1
            continue

        # 2. UPDATE MENGGUNAKAN ORM
        # Fungsi query.update() akan memicu engine AES dari sqlalchemy-utils 
        # untuk mengenkripsi 'nik_mentah' sebelum menyimpannya ke MySQL
        db.session.query(Pasien).filter_by(id=pasien_id).update({"nik": nik_mentah})
        berhasil += 1

    # Simpan perubahan permanen ke database
    db.session.commit()
    
    print("=" * 40)
    print("MIGRASI SELESAI!")
    print(f"Data berhasil dienkripsi : {berhasil} pasien")
    print(f"Data dilewati (sudah aman) : {dilewati} pasien")
    print("=" * 40)