from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db, response
from app.model.user import User, UserRole

# Buat Blueprint baru untuk manajemen user
user_bp = Blueprint("user_bp", __name__)

def check_is_super_admin():
    """Helper untuk memeriksa apakah user saat ini adalah super_admin."""
    claims = get_jwt() or {}
    role = claims.get("role")
    return role == "super_admin"

def format_user_object(user):
    """Mengubah objek User menjadi dictionary."""
    return {
        "id": user.id,
        "nama": user.nama,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "kecamatan_id": user.kecamatan_id,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat()
    }

@user_bp.route("", methods=["GET"])
@jwt_required()
def get_all_users():
    """Endpoint untuk mendapatkan semua user dengan filter role."""
    if not check_is_super_admin():
        return response.unauthorized("Akses ditolak: Hanya Super Admin yang diizinkan.")

    role_filter = request.args.get('role')
    query = User.query

    if role_filter:
        try:
            role_enum = UserRole(role_filter)
            query = query.filter_by(role=role_enum)
        except ValueError:
            return response.bad_request([], f"Role '{role_filter}' tidak valid.")

    users = query.all()
    user_list = [format_user_object(user) for user in users]
    return response.success(user_list, "Data semua pengguna berhasil diambil.")

@user_bp.route("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def edit_user(id):
    """Endpoint untuk mengedit data user."""
    if not check_is_super_admin():
        return response.unauthorized("Akses ditolak.")

    user = User.query.get_or_404(id)
    data = request.get_json()

    user.nama = data.get('nama', user.nama)
    user.email = data.get('email', user.email)
    
    if 'role' in data:
        try:
            user.role = UserRole(data['role'])
        except ValueError:
            return response.bad_request([], f"Role '{data['role']}' tidak valid.")

    db.session.commit()
    return response.success(format_user_object(user), "Data pengguna berhasil diperbarui.")

@user_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_user(id):
    """Endpoint untuk menghapus user."""
    if not check_is_super_admin():
        return response.unauthorized("Akses ditolak.")
        
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return response.success({}, "Pengguna berhasil dihapus.")