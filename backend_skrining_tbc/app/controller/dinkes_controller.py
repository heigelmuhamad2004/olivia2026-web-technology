from flask import request, jsonify
from app import db, response
from app.model.user import User, UserRole
from app.model.kecamatan import Kecamatan
from app.model.kabupaten import Kabupaten 
from app.model.kecamatan import Kecamatan
from flask_jwt_extended import jwt_required, get_jwt # <-- Perbaikan: Impor yang benar
from werkzeug.security import generate_password_hash
from app.model.pasien import Pasien
from app.model.skrining import Skrining
from app.controller.skrining_controller import format_array # Impor helper

# =========================================================================
# 1. API SUPER ADMIN: Membuat Akun Admin Dinkes
# =========================================================================
@jwt_required()
def register_admin_dinkes():
    try:
        claims = get_jwt()
        # Proteksi: Hanya Super Admin yang boleh membuat Admin Dinkes
        if claims.get("role") != UserRole.super_admin.value:
            return response.unauthorized("Akses ditolak. Hanya Super Admin yang diizinkan.")

        data = request.json
        nama = data.get('nama')
        email = data.get('email')
        password = data.get('password')
        kabupaten_id = data.get('kabupaten_id') # Wajib diisi untuk menentukan wilayah Dinkes

        if not all([nama, email, password, kabupaten_id]):
            return response.bad_request(None, "Data tidak lengkap. Pastikan nama, email, password, dan kabupaten_id terisi.")

        if not Kabupaten.query.get(kabupaten_id):
            return response.bad_request(None, "Kabupaten tidak ditemukan.")

        if User.query.filter_by(email=email).first():
            return response.bad_request(None, "Email sudah digunakan.")

        hashed_password = generate_password_hash(password)

        new_dinkes = User(
            nama=nama,
            email=email,
            password_hash=hashed_password,
            role=UserRole.admin_dinkes,
            kabupaten_id=kabupaten_id,
            kecamatan_id=None # Sengaja None karena Dinkes membawahi semua kecamatan di kabupaten
        )

        db.session.add(new_dinkes)
        db.session.commit()

        return response.success(None, "Akun Admin Dinkes berhasil dibuat!")

    except Exception as e:
        db.session.rollback()
        return response.bad_request(None, f"Terjadi kesalahan server: {str(e)}")


# =========================================================================
# 2. API ADMIN DINKES: Membuat Akun Admin Puskesmas
# =========================================================================
@jwt_required()
def register_admin_puskesmas_by_dinkes():
    try:
        claims = get_jwt()
        # Proteksi: Hanya Admin Dinkes yang boleh menggunakan fitur ini
        if claims.get("role") != UserRole.admin_dinkes.value:
            return response.unauthorized("Akses ditolak. Hanya Admin Dinkes yang diizinkan.")

        dinkes_kabupaten_id = claims.get("kabupaten_id")

        data = request.json
        nama = data.get('nama')
        email = data.get('email')
        password = data.get('password')
        kecamatan_id = data.get('kecamatan_id') # Puskesmas mana yang akan dibuatkan akun

        if not all([nama, email, password, kecamatan_id]):
            return response.bad_request(None, "Data tidak lengkap. Pastikan nama, email, password, dan kecamatan_id terisi.")

        kecamatan = Kecamatan.query.get(kecamatan_id)
        if not kecamatan or kecamatan.kabupaten_id != dinkes_kabupaten_id:
            return response.bad_request(None, "Kecamatan tidak valid atau berada di luar wilayah Anda.")

        if User.query.filter_by(email=email).first():
            return response.bad_request(None, "Email sudah digunakan.")

        hashed_password = generate_password_hash(password)

        new_puskesmas = User(
            nama=nama,
            email=email,
            password_hash=hashed_password,
            role=UserRole.admin_puskesmas,
            kecamatan_id=kecamatan_id,
            kabupaten_id=dinkes_kabupaten_id # Otomatis mewarisi kabupaten_id dari Admin Dinkes
        )

        db.session.add(new_puskesmas)
        db.session.commit()

        return response.success(None, "Akun Admin Puskesmas berhasil dibuat dan terhubung ke wilayah Anda!")

    except Exception as e:
        db.session.rollback()
        return response.server_error(f"Terjadi kesalahan: {str(e)}")

# =========================================================================
# 3. API ADMIN DINKES: Melihat Statistik per Puskesmas
# =========================================================================
@jwt_required()
def get_skrining_by_kabupaten():
    try:
        claims = get_jwt()
        if claims.get("role") != UserRole.admin_dinkes.value:
            return response.unauthorized("Akses ditolak.")

        kabupaten_id = claims.get("kabupaten_id")
        
        # --- DEBUG LOG --- 
        # Cek di terminal Flask apakah kabupaten_id terbaca dari token
        print(f"DEBUG: Admin Dinkes request data untuk Kabupaten ID = {kabupaten_id}")

        if not kabupaten_id:
             return response.bad_request(None, "Akun ini belum memiliki wilayah Kabupaten. Silakan login ulang.")

        # PERBAIKAN QUERY: Kita ambil langsung ketiga tabelnya (Skrining, Pasien, Kecamatan)
        skrining_list = db.session.query(Skrining, Pasien, Kecamatan).join(
            Pasien, Skrining.pasien_id == Pasien.id
        ).join(
            Kecamatan, Pasien.kecamatan_id == Kecamatan.id
        ).filter(Kecamatan.kabupaten_id == kabupaten_id).all()

        # --- DEBUG LOG ---
        print(f"DEBUG: Ditemukan {len(skrining_list)} data skrining untuk kabupaten ini.")

        # Kita format manual agar Next.js menerima data yang SANGAT JELAS
        data = []
        for skrining, pasien, kecamatan in skrining_list:
            data.append({
                "id": skrining.id,
                "pasien_id": pasien.id,
                "pasien_nama": pasien.nama,
                "pasien_nik": pasien.nik,
                "kecamatan_id": kecamatan.id,
                "nama_kecamatan": kecamatan.nama_kecamatan,
                "hasil_deteksi": skrining.hasil_deteksi,
                "tanggal_skrining": skrining.created_at.isoformat() if skrining.created_at else None
            })

        return response.success(data, "Data skrining kabupaten berhasil diambil.")

    except Exception as e:
        db.session.rollback()
        import traceback
        print(traceback.format_exc())
        return response.bad_request(None, f"Terjadi kesalahan server: {str(e)}")

@jwt_required()
def get_admin_puskesmas_by_kabupaten():
    try:
        claims = get_jwt()
        if claims.get("role") != UserRole.admin_dinkes.value:
            return response.unauthorized("Akses ditolak.")

        kabupaten_id = claims.get("kabupaten_id")
        
        # Cari semua akun Admin Puskesmas di kabupaten ini
        admins = User.query.filter_by(
            role=UserRole.admin_puskesmas,
            kabupaten_id=kabupaten_id
        ).all()

        data = []
        for admin in admins:
            # Cari nama kecamatan untuk akun tersebut
            nama_kecamatan = "Tidak diketahui"
            if admin.kecamatan_id:
                kecamatan = Kecamatan.query.get(admin.kecamatan_id)
                if kecamatan:
                    nama_kecamatan = kecamatan.nama_kecamatan

            data.append({
                "id": admin.id,
                "nama": admin.nama,
                "email": admin.email,
                "kecamatan_id": admin.kecamatan_id,
                "nama_kecamatan": nama_kecamatan,
            })

        return response.success(data, "Data Admin Puskesmas berhasil diambil.")

    except Exception as e:
        db.session.rollback()
        import traceback
        print(traceback.format_exc())
        return response.bad_request(None, f"Terjadi kesalahan server: {str(e)}")

@jwt_required()
def update_admin_puskesmas(id):
    try:
        claims = get_jwt()
        if claims.get("role") != UserRole.admin_dinkes.value:
            return response.unauthorized("Akses ditolak.")

        kab_id = claims.get("kabupaten_id")
        
        # Cari user, pastikan dia admin puskesmas DAN di kabupaten yang sama
        admin = User.query.get(id)
        if not admin or admin.role != UserRole.admin_puskesmas or admin.kabupaten_id != kab_id:
            return response.bad_request(None, "Data tidak valid atau Anda tidak memiliki akses ke akun ini.")

        data = request.get_json()
        admin.nama = data.get('nama', admin.nama)
        # Email bisa diupdate jika perlu: admin.email = data.get('email', admin.email)
        
        db.session.commit()
        return response.success(None, "Data Admin Puskesmas berhasil diperbarui.")

    except Exception as e:
        db.session.rollback()
        return response.bad_request(None, f"Terjadi kesalahan server: {str(e)}")

@jwt_required()
def delete_admin_puskesmas(id):
    try:
        claims = get_jwt()
        if claims.get("role") != UserRole.admin_dinkes.value:
            return response.unauthorized("Akses ditolak.")

        kab_id = claims.get("kabupaten_id")
        
        # Keamanan ganda
        admin = User.query.get(id)
        if not admin or admin.role != UserRole.admin_puskesmas or admin.kabupaten_id != kab_id:
            return response.bad_request(None, "Data tidak valid atau Anda tidak memiliki hak untuk menghapus akun ini.")

        db.session.delete(admin)
        db.session.commit()
        return response.success(None, "Akun Admin Puskesmas berhasil dihapus.")

    except Exception as e:
        db.session.rollback()
        return response.bad_request(None, f"Terjadi kesalahan: {str(e)}")