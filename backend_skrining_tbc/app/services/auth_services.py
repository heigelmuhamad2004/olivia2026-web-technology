from datetime import timedelta
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.model.user import User, UserRole

def register_user(nama, email, password, role="user", kecamatan_id=None):
    hashed_pw = generate_password_hash (password)

    if role not in [r.value for r in UserRole]:
        raise ValueError(f"Role '{role}' tidak valid. Pilih salah satu dari {[r.value for r in UserRole]}")
    
    new_user = User(
        nama=nama,
        email=email,
        password_hash=hashed_pw,
        role=UserRole(role),
        kecamatan_id=kecamatan_id
    )
    db.session.add(new_user)
    db.session.commit()
    return new_user

def login_user(email, password):
    user = User.query.filter_by(email=email).first()

    if not user:
        print("User tidak ditemukan")
        return None

    # Verifikasi password
    if not check_password_hash(user.password_hash, password):
        print("Password salah")
        return None

    # Ambil nilai role dengan aman
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)

    # Buat JWT token — gunakan user.id sebagai identity (string)
    try:
        access_token = create_access_token(
            identity=str(user.id),  # penting! harus string
            additional_claims={
                "id"  : user.id,
                "nama": user.nama,
                "email": user.email,
                "role": role_value,
                "kecamatan_id": user.kecamatan_id,
            },
            expires_delta=timedelta(hours=24)
        )
        print("Token berhasil dibuat")
        # KEMBALI: sertakan id dan nama agar frontend bisa menyimpan token per-user
        return {"access_token": access_token, "role": role_value, "id": user.id, "nama": user.nama}
    except Exception as e:
        print("Gagal membuat token:", e)
        return None

def check_user_role(user, required_role):
    return user['role'] == required_role
