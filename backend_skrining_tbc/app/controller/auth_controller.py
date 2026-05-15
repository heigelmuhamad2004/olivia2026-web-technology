from app import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.model.token_block_list import TokenBlocklist
from app.model.kecamatan import Kecamatan
from app.services.auth_services import register_user, login_user

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    #Validasi kecamatan_id jika diisi
    kecamatan_id = data.get("kecamatan_id")
    if kecamatan_id:
        kecamatan = Kecamatan.query.get(kecamatan_id)
        if not kecamatan:
            return jsonify({"message": "Kecamatan tidak ditemukan"}), 400

    user = register_user(
        nama=data["nama"],
        email=data["email"],
        password=data["password"],
        role=data.get("role", "user"),
        kecamatan_id=data.get("kecamatan_id")
    )
    return jsonify({
        "message": "Registrasi berhasil",
        "user": {
            "id": user.id,
            "nama": user.nama,
            "email": user.email,
            "role": user.role.value,
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    login_result = login_user(
        email=data["email"],
        password=data["password"]
    )
    if not login_result:
        return jsonify({"message": "Email atau password salah"}), 401

    # KEMBALI: sertakan id dan nama
    return jsonify({
        "message": "Login berhasil",
        "access_token": login_result["access_token"],
        "role": login_result["role"],
        "id": login_result["id"],
        "nama": login_result["nama"]
    }), 200



@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()  # ini string id user
        claims = get_jwt()  # tambahan info dari additional_claims

        return jsonify({
            "id": user_id,
            "nama": claims.get("nama"),
            "email": claims.get("email"),
            "role": claims.get("role"),
            "kecamatan_id": claims.get("kecamatan_id")
        }), 200

    except Exception as e:
        print("Error di /me:", e)
        return jsonify({"message": "Token invalid atau kadaluarsa"}), 401
    
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    try:
        jti = get_jwt()["jti"]  # Ambil ID unik token
        token = TokenBlocklist(jti=jti)
        db.session.add(token)
        db.session.commit()
        return jsonify({"message": "Logout berhasil. Token telah diblokir."}), 200
    except Exception as e:
        print("Error logout:", e)
        return jsonify({"message": "Gagal logout"}), 500



