from app.model.pasien import Pasien
from app.model.user import User
from app import db

def get_pasien_filtered(current_user):
    user = User.query.get(current_user["id"])

    # super admin -> semua pasien
    if user.role.value == "super_admin":
        pasien_list = Pasien.query.all()

    # admin puskesmas -> pasien berdasarkan kecamatan admin
    elif user.role.value == "admin_puskesmas":
        pasien_list = Pasien.query.filter_by(kecamatan_id=user.kecamatan_id).all()

    # user biasa -> pasien miliknya sendiri
    else:
        pasien_list = Pasien.query.filter_by(user_id=user.id).all()

    result = []
    for p in pasien_list:
        result.append({
            "id": p.id,
            "nama": p.nama,
            "nik": p.nik,
            "alamat": p.alamat,
            "kecamatan": p.kecamatan.nama_kecamatan if p.kecamatan else None,
            "user_id": p.user_id,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return result
