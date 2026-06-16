from flask import request
from flask_jwt_extended import jwt_required, get_jwt
from app import response, db, app
from app.model.pasien import Pasien, JenisKelamin
from app.model.skrining import Skrining
from datetime import datetime, date

@jwt_required()
def create_pasien():
    try:
        current_user = get_jwt()
        user_id = current_user["id"]

        data = request.get_json() or {}
        
        # 1. CEK DUPLIKASI NIK SECARA MANUAL (Metode Python Memory)
        nik_input = data.get("nik")
        if not nik_input:
            return response.bad_request([], "NIK wajib diisi")
            
        # AMBIL SEMUA DATA, LALU COCOKKAN DI PYTHON
        semua_pasien = Pasien.query.all()
        for p in semua_pasien:
            if p.nik == nik_input: # Saat dipanggil p.nik, otomatis didekripsi
                return response.bad_request([], "NIK tersebut sudah terdaftar di sistem")

        # 2. NORMALISASI JENIS KELAMIN
        jenis_raw = data.get("jenis_kelamin")
        if jenis_raw in ("L", "P"):
            jenis_map = {"L": "Laki-Laki", "P": "Perempuan"}
            jenis_value = jenis_map[jenis_raw]
        else:
            jenis_value = jenis_raw

        try:
            jk_enum = JenisKelamin(jenis_value)
        except Exception as ve:
            return response.bad_request([], "Jenis kelamin tidak valid. Pilih 'Laki-Laki' atau 'Perempuan'")

        # 3. PARSE TANGGAL LAHIR
        tgl = data.get("tanggal_lahir")
        tanggal_obj = None
        if isinstance(tgl, str):
            try:
                tanggal_obj = datetime.strptime(tgl, "%Y-%m-%d").date()
            except ValueError:
                try:
                    tanggal_obj = datetime.fromisoformat(tgl).date()
                except Exception:
                    return response.bad_request([], "Format tanggal_lahir tidak valid. Gunakan YYYY-MM-DD")
        elif isinstance(tgl, (date, datetime)):
            tanggal_obj = tgl if isinstance(tgl, date) else tgl.date()
        else:
            return response.bad_request([], "tanggal_lahir wajib diisi")

        # 4. SIMPAN PASIEN BARU
        pasien = Pasien(
            user_id=user_id,
            kecamatan_id=data.get("kecamatan_id"),
            nama=data.get("nama"),
            nik=nik_input, # <-- NIK Masuk, otomatis dienkripsi oleh model
            alamat=data.get("alamat"),
            tanggal_lahir=tanggal_obj,
            usia=data.get("usia"),
            jenis_kelamin=jk_enum,
            no_hp=data.get("no_hp"),
            pekerjaan=data.get("pekerjaan"),
        )

        db.session.add(pasien)
        db.session.commit()

        data_pasien = single_object(pasien)
        return response.success(data_pasien, "Berhasil menambahkan data pasien")
    except Exception as e:
        db.session.rollback()
        app.logger.exception("Gagal menambahkan pasien")
        return response.bad_request([], "Gagal menambahkan data pasien")

@jwt_required()
def index():
    try:
        current_user = get_jwt()
        role = current_user["role"]
        kecamatan_id = current_user.get("kecamatan_id")
        user_id = current_user["id"]

        if role == "super_admin":
            pasien = Pasien.query.all()
        elif role == "admin_puskesmas":
            pasien = Pasien.query.filter_by(kecamatan_id=kecamatan_id).all()
        else:  # role == "user"
            pasien = Pasien.query.filter_by(user_id=user_id).all()

        data = format_array(pasien)
        return response.success(data, "Berhasil mengambil data pasien")

    except Exception as e:
        print(e)
        return response.bad_request([], "Gagal mengambil data pasien")
    
@jwt_required() # 🛡️ Tambahkan perlindungan JWT di sini
def get_by_id(id):  
    try:
        current_user = get_jwt()
        role = current_user.get("role")
        user_id = current_user.get("id")
        kecamatan_id = current_user.get("kecamatan_id")

        pasien = Pasien.query.filter_by(id=id).first()
        if not pasien:
            return response.bad_request([], "Pasien tidak ditemukan")

        # 🛡️ BENTENG IDOR: Validasi Hak Akses
        if role == "user" and pasien.user_id != user_id:
            return response.bad_request([], "Akses Ditolak: Anda tidak memiliki hak akses ke data pasien ini")
        elif role == "admin_puskesmas" and pasien.kecamatan_id != kecamatan_id:
            return response.bad_request([], "Akses Ditolak: Pasien ini berada di luar wilayah Puskesmas Anda")

        data = single_object(pasien)
        return response.success(data, "Berhasil mengambil data pasien")

    except Exception as e:
        print(e)
        return response.bad_request([], "Gagal mengambil data pasien")
    
@jwt_required()
def edit_pasien(id):
    try:
        current_user = get_jwt()
        role = current_user.get("role")
        user_id = current_user.get("id")
        kecamatan_id = current_user.get("kecamatan_id")

        data = request.get_json()
        if not data:
            return response.bad_request([], "Data tidak boleh kosong")

        pasien = Pasien.query.get_or_404(id)

        # 🛡️ BENTENG IDOR: Cegah user edit data orang lain
        if role == "user" and pasien.user_id != user_id:
            return response.bad_request([], "Akses Ditolak: Anda tidak dapat mengedit data pasien ini")
        elif role == "admin_puskesmas" and pasien.kecamatan_id != kecamatan_id:
            return response.bad_request([], "Akses Ditolak: Tidak dapat mengedit pasien dari Puskesmas lain")

        # CEK DUPLIKASI NIK SAAT EDIT
        new_nik = data.get('nik')
        if new_nik and new_nik != pasien.nik: # NIK pasien.nik akan didekripsi otomatis untuk perbandingan
            semua_pasien = Pasien.query.all()
            for p in semua_pasien:
                if p.nik == new_nik and p.id != pasien.id:
                    return response.bad_request([], "NIK tersebut sudah digunakan oleh pasien lain")
            pasien.nik = new_nik

        pasien.nama = data.get('nama', pasien.nama)
        pasien.alamat = data.get('alamat', pasien.alamat)
        pasien.tanggal_lahir = data.get('tanggal_lahir', pasien.tanggal_lahir)
        pasien.usia = data.get('usia', pasien.usia)
        pasien.no_hp = data.get('no_hp', pasien.no_hp)
        pasien.pekerjaan = data.get('pekerjaan', pasien.pekerjaan)

        if 'jenis_kelamin' in data:
            jenis_kelamin_str = data.get('jenis_kelamin')
            try:
                pasien.jenis_kelamin = JenisKelamin(jenis_kelamin_str)
            except ValueError:
                return response.bad_request([], f"'{jenis_kelamin_str}' bukan nilai yang valid untuk Jenis Kelamin")

        db.session.commit()
        
        return response.success(single_object(pasien), "Data pasien berhasil diperbarui")

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error saat mengedit pasien: {e}")
        return response.bad_request([], "Terjadi kesalahan internal saat mengedit pasien")

@jwt_required() # 🛡️ Tambahkan perlindungan JWT di sini
def get_pasien_by_kecamatan(kecamatan_id):
    try:
        current_user = get_jwt()
        role = current_user.get("role")
        user_kecamatan_id = current_user.get("kecamatan_id")

        # 🛡️ BENTENG IDOR
        if role == "admin_puskesmas" and int(kecamatan_id) != user_kecamatan_id:
            return response.bad_request([], "Akses Ditolak: Anda tidak diizinkan melihat data kecamatan lain")

        pasien = Pasien.query.filter_by(kecamatan_id=kecamatan_id).all()
        data = format_array(pasien)
        return response.success(data, "Berhasil mengambil data pasien berdasarkan kecamatan")
    except Exception as e:
        print(e)
        return response.bad_request([], "Gagal mengambil data pasien berdasarkan kecamatan")

@jwt_required()
def delete_pasien(id):
    try:
        current_user = get_jwt()
        role = current_user.get("role")
        user_id = current_user.get("id")
        kecamatan_id = current_user.get("kecamatan_id")

        pasien = Pasien.query.filter_by(id=id).first()
        if pasien is None:
            return response.bad_request([], "Pasien tidak ditemukan")
            
        # 🛡️ BENTENG IDOR: Cek hak akses penghapusan
        if role == "user" and pasien.user_id != user_id:
            return response.bad_request([], "Akses Ditolak: Anda tidak dapat menghapus pasien ini")
        elif role == "admin_puskesmas" and pasien.kecamatan_id != kecamatan_id:
            return response.bad_request([], "Akses Ditolak: Tidak dapat menghapus pasien dari Puskesmas lain")

        # KEMBALIKAN ATURAN REKAM MEDIS: Cek apakah ada data skrining
        skrining_terkait = Skrining.query.filter_by(pasien_id=id).first()
        if skrining_terkait:
            # Tolak penghapusan dan kirim pesan ke Frontend
            return response.bad_request([], "Pasien yang sudah melakukan skrining tidak bisa dihapus karena riwayat medis tidak boleh hilang.")
            
        # Jika belum ada skrining, boleh dihapus
        db.session.delete(pasien)
        db.session.commit()
        return response.success([], "Berhasil menghapus data pasien")
        
    except Exception as e:
        db.session.rollback()
        print(e)
        return response.bad_request([], "Gagal menghapus data pasien")

def format_array(datas):
    array = []
    for data_table in datas:
        array.append(single_object(data_table))
    return array

def single_object(data_pasien):
    jk_value = ""
    if hasattr(data_pasien.jenis_kelamin, 'value'):
        jk_value = data_pasien.jenis_kelamin.value
    elif isinstance(data_pasien.jenis_kelamin, str):
        jk_value = data_pasien.jenis_kelamin

    data_dict = {
        "id": data_pasien.id,
        "user_id": data_pasien.user_id,
        "kecamatan_id": data_pasien.kecamatan_id,
        "nama": data_pasien.nama,
        "nik": data_pasien.nik, # <-- SQLAlchemy otomatis mendekripsi ini jadi angka normal untuk ditampilkan
        "alamat": data_pasien.alamat,
        "tanggal_lahir": data_pasien.tanggal_lahir.isoformat() if data_pasien.tanggal_lahir else None,
        "usia": data_pasien.usia,
        "jenis_kelamin": jk_value,
        "no_hp": data_pasien.no_hp,
        "pekerjaan": data_pasien.pekerjaan,
    }

    if data_pasien.kecamatan:
        data_dict["nama_kecamatan"] = data_pasien.kecamatan.nama_kecamatan
        data_dict["nama_kabupaten"] = data_pasien.kecamatan.kabupaten.nama_kabupaten
        data_dict["nama_provinsi"] = data_pasien.kecamatan.kabupaten.provinsi.nama_provinsi

    return data_dict

@jwt_required()
def get_pasien():
    try:
        claims = get_jwt()
        role = claims.get("role")
        current_user_id = claims.get("id")

        q_user_id = request.args.get("user_id", None)
        query = Pasien.query

        if role == "user":
            query = query.filter_by(user_id=current_user_id)
        else:
            if q_user_id:
                try:
                    qid = int(q_user_id)
                    query = query.filter_by(user_id=qid)
                except ValueError:
                    return response.bad_request([], "user_id tidak valid")

        pasien_list = query.all()
        results = [single_object(p) for p in pasien_list]

        return response.success(results, "Daftar pasien berhasil diambil")
    except Exception as e:
        app.logger.exception("Error saat mengambil pasien")
        return response.bad_request([], "Gagal mengambil daftar pasien")