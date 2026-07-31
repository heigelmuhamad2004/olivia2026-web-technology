from app import app, db
from sqlalchemy import text
from app.controller import pasien_controller
from app.controller import skrining_controller
from app.controller import skrining_audio_controller
from app.controller import wilayah_controller
from flask import Blueprint
from app.controller import auth_controller
from app.controller.auth_controller import auth_bp
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from flask import request, make_response

# Import service yang baru kamu buat
from app.services.metrics_evaluation import MetricsEvaluationService
# Impor user_controller yang baru
from app.controller.user_controller import user_bp
from app.controller import admin_puskesmas_controller
from app.controller import benchmark_controller
from app.controller import dinkes_controller # <-- Impor controller dinkes

try:
    from app.model import user, pasien, kecamatan, skrining, token_block_list
except ImportError as e:
    print(f"Error Import Model: {e}")
# ----------------------------------

@app.route('/debug-db')
def debug_db():
    try:
        # 1. Cek Koneksi
        db.session.execute(text('SELECT 1'))
        
        # 2. Paksa Buat Tabel
        db.create_all()
        
        # 3. Cek apakah tabel benar-benar terbuat
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        
        return {
            "status": "Sukses",
            "message": "Perintah create_all() sudah dijalankan.",
            "tabel_yang_ada_sekarang": tables,
            "database_url_dipakai": app.config['SQLALCHEMY_DATABASE_URI'].split('@')[1] # Demi keamanan, hanya tampilkan host
        }
    except Exception as e:
        return {
            "status": "Gagal",
            "error": str(e)
        }

#TEST ROUTES
@app.route('/')
def index():
    return "Hello, World!"

@app.route('/test', methods=['GET'])
def test():
    return {"message": "server ok"}, 200

#PASIEN ROUTES
@app.route('/pasien/create', methods=['POST'])
def create_pasien():
    return pasien_controller.create_pasien()

@app.route('/pasien', methods=['GET'])
def get_pasien():
    return pasien_controller.index()

@app.route('/pasien/<id>', methods=['GET'])
def get_pasien_by_id(id):
    return pasien_controller.get_by_id(id)

@app.route('/pasien/kecamatan/<int:kecamatan_id>', methods=['GET'])
def get_pasien_by_kecamatan(kecamatan_id):
    return pasien_controller.get_pasien_by_kecamatan(kecamatan_id)

@app.route('/pasien/edit/<int:id>', methods=['PUT'])
def edit_pasien(id):
    return pasien_controller.edit_pasien(id)

@app.route('/pasien/delete/<int:id>', methods=['DELETE'])
def delete_pasien(id):
    return pasien_controller.delete_pasien(id)

#SKRINING ROUTES
@app.route('/skrining', methods=['GET'])
def get_all_skrining():
    return skrining_controller.index()

@app.route('/skrining/create', methods=['POST'])
def create_skrining():
    return skrining_controller.create_skrining()

@app.route('/skrining/status/<int:id>', methods=['PUT'])
def update_status_skrining(id):
    return skrining_controller.update_status_skrining(id)

@app.route('/skrining/statistik', methods=['GET'])
def get_skrining_statistik():
    return skrining_controller.get_statistik()

@app.route('/skrining/pasien/<int:pasien_id>', methods=['GET'])
def get_skrining_by_pasien(pasien_id):
    return skrining_controller.get_by_pasien(pasien_id)

@app.route('/skrining/audio', methods=['POST'])
def process_audio_skrining():
    return skrining_audio_controller.process_audio_skrining()

@app.route('/skrining/audio/preview', methods=['POST'])
def route_preview_audio():
    return skrining_audio_controller.preview_audio_crop()

@app.route('/skrining/audio/detect', methods=['POST'])
def route_detect_audio():
    return skrining_audio_controller.process_audio_detect()

@app.route('/skrining/audio/evaluate-dual', methods=['POST'])
def route_evaluate_dual_audio():
    return skrining_audio_controller.evaluate_dual_audio()

#BENCHMARK ROUTES
# 1. Rute Uji Konsistensi (1 Audio diulang N kali)
@app.route('/benchmark/consistency', methods=['POST'])
def route_benchmark_consistency():
    return benchmark_controller.run_consistency_test()

# 2. Rute Uji Variasi (Kumpulan Audio diuji sekaligus)
@app.route('/benchmark/variation', methods=['POST'])
def route_benchmark_variation():
    return benchmark_controller.run_variation_test()

@app.route('/admin/metrics/global', methods=['GET'])
@jwt_required() # Jika Next.js mengirim token
def get_global_metrics_route():
    # Panggil logika dari file service
    result = MetricsEvaluationService.calculate_global_metrics()
    
    if result["status"] == "success":
        return jsonify(result), 200
    else:
        return jsonify(result), 500

#WILAYAH ROUTES
@app.route('/provinsi', methods=['GET'])
def get_provinsi():
    return wilayah_controller.get_provinsi()

@app.route('/kabupaten/<int:provinsi_id>', methods=['GET'])
def get_kabupaten(provinsi_id):
    return wilayah_controller.get_kabupaten(provinsi_id)

@app.route('/kecamatan/<int:kabupaten_id>', methods=['GET'])
def get_kecamatan(kabupaten_id):
    return wilayah_controller.get_kecamatan(kabupaten_id)

# ADMIN PUSKESMAS BUAT RUJUKAN
# 1. Get List Rujukan Masuk
@app.route('/admin/rujukan', methods=['GET'])
def get_rujukan_admin():
    return admin_puskesmas_controller.get_rujukan_by_kecamatan()

# 2. Verifikasi Pasien Datang
@app.route('/admin/rujukan/verifikasi/<int:id>', methods=['PUT'])
def verify_rujukan_admin(id):
    return admin_puskesmas_controller.verify_rujukan(id)

@app.route('/skrining/<int:id>', methods=['GET'])
def get_skrining_detail(id):
    return skrining_controller.get_skrining_detail(id)

# =================================================
# DINKES & SUPER ADMIN ROUTES (Manajemen Akun)
# =================================================
@app.route('/superadmin/register-dinkes', methods=['POST'])
def register_admin_dinkes():
    return dinkes_controller.register_admin_dinkes()

@app.route('/dinkes/register-puskesmas', methods=['POST'])
def register_admin_puskesmas_by_dinkes():
    return dinkes_controller.register_admin_puskesmas_by_dinkes()

@app.route('/dinkes/skrining', methods=['GET', 'OPTIONS'])
def get_skrining_by_kabupaten():
    # 1. Tangkap Preflight Request dari Browser
    if request.method == "OPTIONS":
        resp = make_response()
        resp.headers.add("Access-Control-Allow-Origin", "*")
        resp.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        resp.headers.add("Access-Control-Allow-Methods", "GET, OPTIONS")
        return resp
        
    # 2. Eksekusi kode asli jika method GET
    return dinkes_controller.get_skrining_by_kabupaten()

@app.route('/dinkes/admin-puskesmas', methods=['GET', 'OPTIONS'])
def get_admin_puskesmas_list():
    # Tangkap Preflight Request untuk CORS
    if request.method == "OPTIONS":
        resp = make_response()
        resp.headers.add("Access-Control-Allow-Origin", "*")
        resp.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        resp.headers.add("Access-Control-Allow-Methods", "GET, OPTIONS")
        return resp
        
    return dinkes_controller.get_admin_puskesmas_by_kabupaten()

# Tambahkan rute ini di bagian bawah routes.py Anda

@app.route('/dinkes/admin-puskesmas/<int:id>', methods=['PUT', 'DELETE', 'OPTIONS'])
def manage_admin_puskesmas(id):
    # Proteksi CORS Preflight
    if request.method == "OPTIONS":
        resp = make_response()
        resp.headers.add("Access-Control-Allow-Origin", "*")
        resp.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        resp.headers.add("Access-Control-Allow-Methods", "PUT, DELETE, OPTIONS")
        return resp
        
    if request.method == 'PUT':
        return dinkes_controller.update_admin_puskesmas(id)
    elif request.method == 'DELETE':
        return dinkes_controller.delete_admin_puskesmas(id)

# Daftarkan Blueprint untuk user management dengan prefix /users
app.register_blueprint(user_bp, url_prefix='/users')
app.register_blueprint(auth_bp, url_prefix='/auth')
