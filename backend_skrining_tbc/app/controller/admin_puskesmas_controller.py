from flask import request
from flask_jwt_extended import jwt_required, get_jwt
from app import response, db, app
from app.model.rujukan import Rujukan, StatusRujukan
from app.model.pasien import Pasien
from app.model.skrining import Skrining
from datetime import datetime

# app/controller/admin_puskesmas_controller.py

@jwt_required()
def get_rujukan_by_kecamatan():
    try:
        claims = get_jwt()
        kecamatan_id = claims.get("kecamatan_id")
        user_id = claims.get("id")

        # --- DEBUG LOG ---
        print(f"DEBUG ADMIN: ID={user_id}, Kecamatan di Token={kecamatan_id}")
        
        if not kecamatan_id:
            return response.bad_request([], "Akses ditolak. Token tidak punya kecamatan_id.")

        rujukan_list = Rujukan.query\
            .join(Pasien, Rujukan.pasien_id == Pasien.id)\
            .filter(Pasien.kecamatan_id == kecamatan_id)\
            .order_by(Rujukan.created_at.desc())\
            .all()
        
        # --- DEBUG LOG ---
        print(f"DEBUG QUERY: Ditemukan {len(rujukan_list)} rujukan untuk kecamatan {kecamatan_id}")

        data = format_array(rujukan_list)
        return response.success(data, "Berhasil mengambil data rujukan masuk")

    except Exception as e:
        app.logger.exception("Gagal mengambil data rujukan")
        return response.bad_request([], "Terjadi kesalahan server")
        
@jwt_required()
def verify_rujukan(id):
    try:
        current_user = get_jwt()
        admin_id = current_user["id"]
        kecamatan_id = current_user.get("kecamatan_id")

        data = request.get_json() or {}
        
        # Cari rujukan berdasarkan ID
        rujukan = Rujukan.query.filter_by(id=id).first()

        if not rujukan:
            return response.bad_request([], "Data rujukan tidak ditemukan")

        # Security Check: Pastikan rujukan ini milik pasien di kecamatan admin tersebut
        # Kita cek via relasi pasien
        if rujukan.pasien.kecamatan_id != kecamatan_id:
            return response.bad_request([], "Anda tidak berhak memverifikasi pasien dari kecamatan lain")

        # Update Data
        rujukan.status = StatusRujukan.VERIFIED
        rujukan.verified_by_user_id = admin_id
        rujukan.catatan = data.get("catatan", rujukan.catatan) # Update catatan jika ada kiriman
        rujukan.updated_at = datetime.utcnow()

        db.session.commit()

        data_rujukan = single_object(rujukan)
        return response.success(data_rujukan, "Pasien berhasil diverifikasi")

    except Exception as e:
        app.logger.exception("Gagal verifikasi rujukan")
        return response.bad_request([], "Gagal memverifikasi rujukan")

# --- Helper Functions (Sama style dengan pasien_controller) ---

def format_array(datas):
    array = []
    for data_table in datas:
        array.append(single_object(data_table))
    return array

def single_object(data):
    # Handle Enum StatusRujukan
    status_value = ""
    if hasattr(data.status, 'value'):
        status_value = data.status.value
    else:
        status_value = str(data.status)

    # Kita ratakan (flatten) object agar frontend mudah membacanya
    # Mengambil data detail dari relasi Pasien dan Skrining
    data_dict = {
        "id": data.id,
        "skrining_id": data.skrining_id,
        "pasien_id": data.pasien_id,
        "status": status_value,
        "catatan": data.catatan,
        "created_at": data.created_at.isoformat() if data.created_at else None,
        "updated_at": data.updated_at.isoformat() if data.updated_at else None,
        "verified_by_user_id": data.verified_by_user_id,
        
        # Data Pasien (Flatten)
        "pasien_nama": data.pasien.nama if data.pasien else None,
        "pasien_nik": data.pasien.nik if data.pasien else None,
        "pasien_alamat": data.pasien.alamat if data.pasien else None,
        "pasien_no_hp": data.pasien.no_hp if data.pasien else None,

        # Data Hasil Skrining
        "hasil_deteksi": data.skrining.hasil_deteksi if data.skrining else None
    }

    return data_dict