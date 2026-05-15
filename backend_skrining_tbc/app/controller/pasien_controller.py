from flask import request
from flask_jwt_extended import jwt_required, get_jwt
from app import response, db, app
from app.model.pasien import Pasien, JenisKelamin
from datetime import datetime, date


@jwt_required()
def create_pasien():
    try:
        current_user = get_jwt()
        user_id = current_user["id"]

        data = request.get_json() or {}
        # normalisasi jenis_kelamin: terima "L"/"P" atau "Laki-Laki"/"Perempuan"
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

        # parse tanggal_lahir jika dikirim sebagai string "YYYY-MM-DD"
        tgl = data.get("tanggal_lahir")
        tanggal_obj = None
        if isinstance(tgl, str):
            try:
                tanggal_obj = datetime.strptime(tgl, "%Y-%m-%d").date()
            except ValueError:
                # coba parse ISO full jika perlu
                try:
                    tanggal_obj = datetime.fromisoformat(tgl).date()
                except Exception:
                    return response.bad_request([], "Format tanggal_lahir tidak valid. Gunakan YYYY-MM-DD")
        elif isinstance(tgl, (date, datetime)):
            tanggal_obj = tgl if isinstance(tgl, date) else tgl.date()
        else:
            return response.bad_request([], "tanggal_lahir wajib diisi")

        pasien = Pasien(
            user_id=user_id,
            kecamatan_id=data.get("kecamatan_id"),
            nama=data.get("nama"),
            nik=data.get("nik"),
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
        app.logger.exception("Gagal menambahkan pasien")
        return response.bad_request([], "Gagal menambahkan data pasien")

@jwt_required()
def index():
    try:
        current_user = get_jwt()
        role = current_user["role"]
        kecamatan_id = current_user["kecamatan_id"]
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
    
def get_by_id(id):  
    try:
        pasien = Pasien.query.filter_by(id=id).first()
        if not pasien:
            return response.bad_request([], "Pasien tidak ditemukan")
        data = single_object(pasien)
        return response.success(data, "Berhasil mengambil data pasien")

    except Exception as e:
        print(e)
        return response.bad_request([], "Gagal mengambil data pasien")
    
@jwt_required()
def edit_pasien(id):
    try:
        data = request.get_json()
        if not data:
            # Perbaikan: Menggunakan bad_request yang benar
            return response.bad_request([], "Data tidak boleh kosong")

        pasien = Pasien.query.get_or_404(id)

        # Validasi dan update data
        pasien.nama = data.get('nama', pasien.nama)
        pasien.nik = data.get('nik', pasien.nik)
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
        
        # Perbaikan: Menggunakan fungsi single_object, bukan to_dict
        return response.success(single_object(pasien), "Data pasien berhasil diperbarui")

    except Exception as e:
        app.logger.error(f"Error saat mengedit pasien: {e}")
        # Perbaikan: Menggunakan bad_request, bukan serverError
        return response.bad_request([], "Terjadi kesalahan internal saat mengedit pasien")

    
def get_pasien_by_kecamatan(kecamatan_id):
    try:
        pasien = Pasien.query.filter_by(kecamatan_id=kecamatan_id).all()
        data = format_array(pasien)
        return response.success(data, "Berhasil mengambil data pasien berdasarkan kecamatan")
    except Exception as e:
        print(e)
        return response.bad_request([], "Gagal mengambil data pasien berdasarkan kecamatan")

@jwt_required()
def delete_pasien(id):
    try:
        pasien = Pasien.query.filter_by(id=id).first()
        if pasien is None:
            return response.bad_request([], "Pasien tidak ditemukan")
        db.session.delete(pasien)
        db.session.commit()
        return response.success([], "Berhasil menghapus data pasien")
    except Exception as e:
        print(e)
        return response.bad_request([], "Gagal menghapus data pasien")


def format_array(datas):
    array = []
    for data_table in datas:
        array.append(single_object(data_table))

    return array

def single_object(data_pasien):
    # PERBAIKAN: Menangani kasus jika jenis_kelamin adalah string atau enum
    jk_value = ""
    if hasattr(data_pasien.jenis_kelamin, 'value'):
        # Jika ini adalah objek enum, ambil nilainya
        jk_value = data_pasien.jenis_kelamin.value
    elif isinstance(data_pasien.jenis_kelamin, str):
        # Jika ini sudah berupa string (dari data lama), gunakan langsung
        jk_value = data_pasien.jenis_kelamin

    data_dict = {
        "id": data_pasien.id,
        "user_id": data_pasien.user_id,
        "kecamatan_id": data_pasien.kecamatan_id,
        "nama": data_pasien.nama,
        "nik": data_pasien.nik,
        "alamat": data_pasien.alamat,
        "tanggal_lahir": data_pasien.tanggal_lahir.isoformat(),
        "usia": data_pasien.usia,
        "jenis_kelamin": jk_value,
        "no_hp": data_pasien.no_hp,
        "pekerjaan": data_pasien.pekerjaan,
    }

    #Tampilkan nama kecamatan, kabupaten, dan provinsi
    if data_pasien.kecamatan:
        data_dict["nama_kecamatan"] = data_pasien.kecamatan.nama_kecamatan
        data_dict["nama_kabupaten"] = data_pasien.kecamatan.kabupaten.nama_kabupaten
        data_dict["nama_provinsi"] = data_pasien.kecamatan.kabupaten.provinsi.nama_provinsi

    return data_dict

@jwt_required()
def get_pasien():
    """
    GET /pasien
    - Jika role == 'user' => kembalikan hanya pasien yang user miliki (user_id dari JWT)
    - Jika role == 'admin_puskesmas' atau 'super_admin' => kembalikan semua pasien
    - Opsional: support query ?user_id= untuk admin
    """
    try:
        claims = get_jwt()
        role = claims.get("role")
        current_user_id = claims.get("id")

        # Jika admin ingin mem-filter berdasarkan query param user_id
        q_user_id = request.args.get("user_id", None)
        query = Pasien.query

        if role == "user":
            # hanya pasien milik user yang sedang login
            query = query.filter_by(user_id=current_user_id)
        else:
            # admin dapat memfilter dengan query param user_id jika diberikan
            if q_user_id:
                try:
                    qid = int(q_user_id)
                    query = query.filter_by(user_id=qid)
                except ValueError:
                    return response.bad_request([], "user_id tidak valid")

        pasien_list = query.all()

        # Konversi ke dict sederhana
        results = []
        for p in pasien_list:
            results.append({
                "id": p.id,
                "nama": p.nama,
                "nik": p.nik,
                "alamat": p.alamat,
                "tanggal_lahir": p.tanggal_lahir.isoformat() if getattr(p, "tanggal_lahir", None) else None,
                "usia": p.usia,
                "jenis_kelamin": p.jenis_kelamin.value if getattr(p, "jenis_kelamin", None) else None,
                "no_hp": p.no_hp,
                "pekerjaan": p.pekerjaan,
                "user_id": p.user_id,
                "kecamatan_id": p.kecamatan_id,
            })

        return response.success(results, "Daftar pasien berhasil diambil")
    except Exception as e:
        app.logger.exception("Error saat mengambil pasien")
        return response.bad_request([], "Gagal mengambil daftar pasien")
