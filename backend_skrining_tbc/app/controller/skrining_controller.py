from app.model.skrining import Skrining
from app.model.pasien import Pasien
from app.model.rujukan import Rujukan, StatusRujukan 
from app.services.skrining_services import process_new_skrining
from app.services.skrining_services import hitung_status_skrining
from app import response, db
from flask import request
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime

# 🛡️ IMPORT HASHIDS UTILS
from app.utils.hashids_util import encode_id, decode_id

# USER menambahkan skrining baru
@jwt_required()
def create_skrining():
    try:
        claims = get_jwt()
        user_id = claims.get("id")
        role = claims.get("role")

        if role != "user":
            return response.bad_request([], "Hanya pengguna (user) yang dapat menambahkan skrining")

        data = request.get_json() or {}

        # 🛡️ DECODE HASH ID DARI FRONTEND
        raw_pasien_id = data.get("pasien_id")
        real_pasien_id = decode_id(raw_pasien_id) if isinstance(raw_pasien_id, str) and not raw_pasien_id.isdigit() else raw_pasien_id
        
        if not real_pasien_id:
             return response.bad_request([], "ID Pasien tidak valid.")

        # 1. Validasi Pasien menggunakan Real ID
        pasien = Pasien.query.filter_by(id=real_pasien_id, user_id=user_id).first()
        if not pasien:
            return response.bad_request([], "Pasien tidak ditemukan atau bukan milik Anda")

        # Update payload agar service (RF/Multimodal) menggunakan Real ID
        data["pasien_id"] = real_pasien_id

        # 2. Siapkan Data Tambahan (Usia & Gender) untuk AI
        usia_pasien = 30  # Default
        if pasien.tanggal_lahir:
            today = datetime.today()
            usia_pasien = today.year - pasien.tanggal_lahir.year

        jk_str = str(pasien.jenis_kelamin)
        if hasattr(pasien.jenis_kelamin, 'value'):
            jk_str = pasien.jenis_kelamin.value

        data.update({
            "usia": usia_pasien,
            "jenis_kelamin": jk_str
        })

        # 3. Parse Tanggal
        tanggal_skrining_raw = data.get("tanggal_skrining")
        if tanggal_skrining_raw:
            try:
                tanggal_skrining = datetime.strptime(tanggal_skrining_raw, "%Y-%m-%d")
            except Exception:
                try:
                    tanggal_skrining = datetime.fromisoformat(tanggal_skrining_raw)
                except Exception:
                    tanggal_skrining = datetime.utcnow()
        else:
            tanggal_skrining = datetime.utcnow()
            
        data["tanggal_skrining"] = tanggal_skrining

        # Convert berat/tinggi badan agar pasti Float
        try:
            if data.get("berat_badan") is not None:
                data["berat_badan"] = float(data["berat_badan"])
            if data.get("tinggi_badan") is not None:
                data["tinggi_badan"] = float(data["tinggi_badan"])
        except Exception:
            return response.bad_request([], "Format berat/tinggi badan tidak valid")

        # ==================================================
        # 4. LEMPAR SEMUA LOGIKA KE SERVICE
        # ==================================================
        hasil_service = process_new_skrining(user_id, data)

        if hasil_service["status"] == "success":
            # 🛡️ ENCODE ID SEBELUM DIKEMBALIKAN KE FRONTEND
            if "id" in hasil_service["data"]:
                hasil_service["data"]["id"] = encode_id(hasil_service["data"]["id"])
            if "skrining_id" in hasil_service["data"]:
                hasil_service["data"]["skrining_id"] = encode_id(hasil_service["data"]["skrining_id"])
            
            # 🔥 INI PERBAIKANNYA: Encode juga pasien_id sebelum dibalikkan
            if "pasien_id" in hasil_service["data"]:
                hasil_service["data"]["pasien_id"] = encode_id(hasil_service["data"]["pasien_id"])
            else:
                # Jaga-jaga jika service tidak me-return pasien_id, kita ambil dari variabel real_pasien_id
                hasil_service["data"]["pasien_id"] = encode_id(real_pasien_id)

            return response.success(hasil_service["data"], hasil_service["message"])
        else:
            return response.bad_request([], hasil_service["message"])

    except Exception as e:
        print("Error create_skrining:", e)
        return response.bad_request([], f"Terjadi kesalahan sistem: {str(e)}")


# ✅ ADMIN / USER melihat data skrining
@jwt_required()
def index():
    try:
        claims = get_jwt()
        role = claims.get("role")
        user_id = claims.get("id")

        query = db.session.query(Skrining, Pasien).join(
            Pasien, Skrining.pasien_id == Pasien.id
        )

        if role == "super_admin":
            skrining_list = query.all()
        elif role == "admin_puskesmas":
            kecamatan_id = claims.get("kecamatan_id")
            skrining_list = query.filter(Pasien.kecamatan_id == kecamatan_id).all()
        elif role == "admin_dinkes":
            kabupaten_id = claims.get("kabupaten_id")
            skrining_list = query.filter(Pasien.kabupaten_id == kabupaten_id).all()
        else:  # 'user'
            skrining_list = query.filter(Skrining.user_id == user_id).all()

        data = format_array(skrining_list)
        return response.success(data, "Berhasil mengambil data skrining")

    except Exception as e:
        print("Error index skrining:", e)
        return response.bad_request([], "Gagal mengambil data skrining")


# ✅ ADMIN PUSKESMAS mengubah status hasil skrining
@jwt_required()
def update_status_skrining(id):
    try:
        claims = get_jwt()
        role = claims.get("role")
        kecamatan_id = claims.get("kecamatan_id")

        if role != "admin_puskesmas":
            return response.bad_request([], "Hanya admin puskesmas yang dapat mengubah status skrining")

        # 🛡️ DECODE ID
        real_id = decode_id(id) if isinstance(id, str) and not id.isdigit() else id

        skrining = (
            Skrining.query.join(Pasien)
            .filter(Skrining.id == real_id, Pasien.kecamatan_id == kecamatan_id)
            .first()
        )

        if not skrining:
            return response.bad_request([], "Data skrining tidak ditemukan atau bukan wilayah Anda")

        data = request.get_json() or {}

        skrining.status = data.get("status", skrining.status)
        db.session.commit()

        return response.success(
            single_object(skrining, skrining.pasien),
            "Status skrining berhasil diperbarui"
        )

    except Exception as e:
        print("Error update_status_skrining:", e)
        return response.bad_request([], "Gagal memperbarui status skrining")


# GET STATISTIK DI ADMIN PUSKESMAS
@jwt_required()
def get_statistik():
    try:
        claims = get_jwt()
        role = claims.get("role")
        kecamatan_id = claims.get("kecamatan_id")
        user_id = claims.get("id")

        query = db.session.query(Skrining, Pasien).join(
            Pasien, Skrining.pasien_id == Pasien.id
        )

        if role == "super_admin":
            records = query.all()
        elif role == "admin_puskesmas":
            records = query.filter(Pasien.kecamatan_id == kecamatan_id).all()
        elif role == "admin_dinkes":
            kabupaten_id = claims.get("kabupaten_id")
            records = query.filter(Pasien.kabupaten_id == kabupaten_id).all()
        else:
            records = query.filter(Skrining.user_id == user_id).all()

        total_pasien = len(records)

        suspect = sum(
            1 for skrining, pasien in records
            if skrining.hasil_deteksi.upper() in ["TERDUGA", "TERDUGA TBC", "POSITIF"]
        )

        non_suspect = total_pasien - suspect
        total_screening = len(records)

        statistik = {
            "total_pasien": total_pasien,
            "suspect": suspect,
            "non_suspect": non_suspect,
            "total_screening": total_screening,
        }

        return response.success(statistik, "Statistik berhasil diambil")

    except Exception as e:
        print("Error get_statistik:", e)
        return response.bad_request([], "Gagal mengambil statistik")


# GET RIWAYAT SKRINING BY SKRINING ID UNTUK RUJUKAN
@jwt_required()
def get_skrining_detail(id):
    try:
        # 🛡️ DECODE ID
        real_id = decode_id(id) if isinstance(id, str) and not id.isdigit() else id
        skrining = Skrining.query.get(real_id)

        if not skrining:
            return response.bad_request([], "Data skrining tidak ditemukan")

        claims = get_jwt()
        role = claims.get("role")
        user_id = claims.get("id")
        kecamatan_id = claims.get("kecamatan_id")

        if role == 'user' and skrining.user_id != user_id:
            return response.bad_request([], "Akses Ditolak: Anda tidak berhak melihat data skrining ini")
        elif role == 'admin_puskesmas' and skrining.pasien.kecamatan_id != kecamatan_id:
            return response.bad_request([], "Akses Ditolak: Data skrining berada di luar wilayah Puskesmas Anda")

        data = single_object(skrining, skrining.pasien)

        return response.success(data, "Berhasil mengambil detail skrining")

    except Exception as e:
        print("Error get_skrining_detail:", e)
        return response.bad_request([], "Terjadi kesalahan server")


# GET RIWAYAT SKRINING BY PASIEN ID
@jwt_required()
def get_by_pasien(pasien_id):
    try:
        claims = get_jwt()
        role = claims.get("role")
        user_id = claims.get("id")
        kecamatan_id = claims.get("kecamatan_id")

        # 🛡️ DECODE ID
        real_pasien_id = decode_id(pasien_id) if isinstance(pasien_id, str) and not pasien_id.isdigit() else pasien_id

        pasien_target = Pasien.query.get(real_pasien_id)
        if not pasien_target:
            return response.bad_request([], "Pasien tidak ditemukan")

        if role == "user" and pasien_target.user_id != user_id:
            return response.bad_request([], "Akses Ditolak: Anda tidak berhak melihat riwayat pasien ini")
        elif role == "admin_puskesmas" and pasien_target.kecamatan_id != kecamatan_id:
            return response.bad_request([], "Akses Ditolak: Pasien berada di luar wewenang Puskesmas Anda")

        query = db.session.query(Skrining, Pasien).join(
            Pasien, Skrining.pasien_id == Pasien.id
        ).filter(Pasien.id == real_pasien_id)

        result = query.all()

        return response.success(format_array(result), "Berhasil mengambil riwayat screening")

    except Exception as e:
        print("Error get_by_pasien:", e)
        return response.bad_request([], "Gagal mengambil data screening pasien")


# HELPER FUNCTIONS
def format_array(datas):
    array = []
    for skrining, pasien in datas:
        array.append(single_object(skrining, pasien))
    return array


def single_object(skrining, pasien):
    rujukan = getattr(skrining, 'rujukan_detail', None)

    status_rujukan = None
    tgl_verifikasi = None

    if rujukan:
        status_rujukan = rujukan.status.value if hasattr(rujukan.status, 'value') else str(rujukan.status)
        if status_rujukan == 'Terverifikasi' and rujukan.updated_at:
            tgl_verifikasi = rujukan.updated_at.isoformat()

    # 🛡️ DATA MASKING: Sensor NIK
    nik_asli = str(pasien.nik) if pasien.nik else ""
    if len(nik_asli) >= 16:
        nik_sensor = nik_asli[:6] + "******" + nik_asli[-4:]
    elif len(nik_asli) > 0:
        nik_sensor = "******"
    else:
        nik_sensor = "-"

    return {
        # 🛡️ ENCODE SEMUA ID
        "id": encode_id(skrining.id),
        "pasien_id": encode_id(pasien.id),
        
        "nama": pasien.nama,
        "nik": nik_sensor,
        "no_hp": pasien.no_hp,
        "alamat": pasien.alamat,
        "hasil_screening": skrining.hasil_deteksi,
        "tanggal_screening": skrining.tanggal_skrining.isoformat(),
        "total_screening": 1,
        "email": pasien.user.email if hasattr(pasien, 'user') and pasien.user else None,
        "tanggal_lahir": pasien.tanggal_lahir.isoformat() if pasien.tanggal_lahir else None,
        "usia": f"{pasien.usia} tahun" if pasien.usia else None,
        "pekerjaan": pasien.pekerjaan,
        "kelamin": pasien.jenis_kelamin.value if pasien.jenis_kelamin else None,
        "berat_badan": str(skrining.berat_badan),
        "tinggi_badan": str(skrining.tinggi_badan),

        "riwayat_kontak_tbc": skrining.riwayat_kontak_tbc,
        "pernah_terdiagnosa": skrining.pernah_terdiagnosis_tbc,
        "pernah_berobat_tbc": skrining.pernah_berobat_tbc,
        "pernah_berobat_tb_tapi_tidak_tuntas": skrining.pernah_beroobat_tbc_namun_tidak_tuntas,
        "malnutrisi": skrining.malnutrisi,
        "merokok_perokok_pasif": skrining.merokok_atau_perokokok_pasif,
        "riwayat_dm_kencing_manis": skrining.riwayat_diabetes_melitus_atau_kencing_manis,
        "lansia": skrining.lansia_lebih_dari_60_tahun,
        "ibu_hamil": skrining.ibu_hamil,
        "batuk": skrining.batuk,
        "bb_turun_tanpa_sebab_nafsu_makan_turun": skrining.bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun,
        "demam_tidak_diketahui_penyebabnya": skrining.demam_yang_tidak_diketahui_penyebabnya,
        "badan_lemas": skrining.badan_lemas,
        "berkeringat_malam_tanpa_kegiatan": skrining.berkesingat_malam_hari_tanpa_kegiatan,
        "sesak_napas_tanpa_nyeri_dada": skrining.sesak_napas_tanpa_nyeri_dada,
        "ada_pembesaran_getah_bening_dileher": skrining.ada_pembengkakan_kelenjar_getah_bening_pada_leher_atau_ketiak,

        # --- DATA METODE AI ---
        "skor_form_ai": skrining.skor_form_ai,
        "skor_suara_ai": skrining.skor_suara_ai,
        "metode_skrining": skrining.metode_skrining,
        "gradcam_image": skrining.gradcam_image,
        "detail_matematika": skrining.detail_matematika,

        "rujukan_status": status_rujukan,
        "rujukan_verified_at": tgl_verifikasi,

        "nama_kecamatan": pasien.kecamatan.nama_kecamatan if pasien.kecamatan else "-",
        "nama_kabupaten": pasien.kecamatan.kabupaten.nama_kabupaten if (pasien.kecamatan and pasien.kecamatan.kabupaten) else "-",
    }