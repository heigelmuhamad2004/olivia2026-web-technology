from app.model.skrining import Skrining
from app.model.pasien import Pasien
# 1. IMPORT RUJUKAN DISINI
from app.model.rujukan import Rujukan, StatusRujukan 
from app.services.skrining_services import hitung_status_skrining
from app import response, db
from flask import request
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime


# ✅ USER menambahkan skrining baru
@jwt_required()
def create_skrining():
    try:
        claims = get_jwt()
        user_id = claims.get("id")
        role = claims.get("role")

        if role != "user":
            return response.bad_request([], "Hanya pengguna (user) yang dapat menambahkan skrining")

        data = request.get_json() or {}

        # 1. Validasi Pasien
        pasien = Pasien.query.filter_by(id=data.get("pasien_id"), user_id=user_id).first()
        if not pasien:
            return response.bad_request([], "Pasien tidak ditemukan atau bukan milik Anda")

        # 2. Siapkan Data Tambahan untuk AI (Usia & Gender)
        usia_pasien = 30 # Default
        if pasien.tanggal_lahir:
            today = datetime.today()
            usia_pasien = today.year - pasien.tanggal_lahir.year
        
        jk_str = str(pasien.jenis_kelamin)
        if hasattr(pasien.jenis_kelamin, 'value'):
            jk_str = pasien.jenis_kelamin.value

        data_pasien_tambahan = {
            "usia": usia_pasien,
            "jenis_kelamin": jk_str
        }

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

        # 4. Helper Pick Data
        def pick(*keys, default=None):
            for k in keys:
                if k in data:
                    return data.get(k)
            return default

        # 5. Susun Payload Awal
        payload = {
            "user_id": user_id,
            "pasien_id": pick("pasien_id", "pasienId"),
            "berat_badan": pick("berat_badan", "beratBadan"),
            "tinggi_badan": pick("tinggi_badan", "tinggiBadan"),
            
            # Faktor risiko
            "riwayat_kontak_tbc": pick("riwayat_kontak_tbc"),
            "pernah_terdiagnosis_tbc": pick("pernah_terdiagnosis_tbc"),
            "pernah_berobat_tbc": pick("pernah_berobat_tbc"),
            "nama_obat_tbc": pick("nama_obat_tbc"),
            "pernah_beroobat_tbc_namun_tidak_tuntas": pick("pernah_berobat_tbc_namun_tidak_tuntas", "pernah_beroobat_tbc_namun_tidak_tuntas"),
            "malnutrisi": pick("malnutrisi"),
            "merokok_atau_perokokok_pasif": pick("merokok_atau_perokok_pasif"),
            "riwayat_diabetes_melitus_atau_kencing_manis": pick("riwayat_diabetes_melitus_atau_kencing_manis"),
            "lansia_lebih_dari_60_tahun": pick("lansia_lebih_dari_60_tahun"),
            "ibu_hamil": pick("ibu_hamil"),

            # Gejala
            "batuk": pick("batuk"),
            "bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun": pick("bb_turun_tanpa_sebab_jelas_bb_tidak_naik_nafsu_makan_turun"),
            "demam_yang_tidak_diketahui_penyebabnya": pick("demam_yang_tidak_diketahui_penyebabnya"),
            "badan_lemas": pick("badan_lemas"),
            "berkesingat_malam_hari_tanpa_kegiatan": pick("berkesingat_malam_hari_tanpa_kegiatan"),
            "sesak_napas_tanpa_nyeri_dada": pick("sesak_napas_tanpa_nyeri_dada"),
            "ada_pembengkakan_kelenjar_getah_bening_pada_leher_atau_ketiak": pick("ada_pembengkakan_kelenjar_getah_bening_pada_leher_atau_ketiak"),

            "tanggal_skrining": tanggal_skrining,
            "status": "pending",
        }

        # 6. HITUNG HASIL HYBRID (AI + MANUAL)
        status_hasil, metode, confidence = hitung_status_skrining(payload, data_pasien_tambahan)

        # Masukkan ke payload
        payload["hasil_deteksi"] = status_hasil
        
        # 7. Convert Angka
        try:
            if payload.get("berat_badan") is not None:
                payload["berat_badan"] = float(payload["berat_badan"])
            if payload.get("tinggi_badan") is not None:
                payload["tinggi_badan"] = float(payload["tinggi_badan"])
        except Exception:
            return response.bad_request([], "Format berat/tinggi badan tidak valid")

        # 8. Simpan ke Database (Skrining)
        skrining = Skrining(**payload)
        db.session.add(skrining)
        
        # PENTING: Flush agar skrining.id terbentuk sebelum commit
        db.session.flush() 

        # ------------------------------------------------------------------
        # 9. LOGIC BUAT RUJUKAN OTOMATIS DISINI
        # ------------------------------------------------------------------
        if status_hasil == "TERDUGA TBC":
            new_rujukan = Rujukan(
                skrining_id=skrining.id,
                pasien_id=pasien.id,
                status=StatusRujukan.PENDING,
                # Simpan info metode deteksi & confidence skor AI di catatan admin
                catatan=f"Rujukan otomatis. Deteksi: {metode} ({confidence*100:.0f}%)"
            )
            db.session.add(new_rujukan)
        # ------------------------------------------------------------------

        db.session.commit()

        # Return Data ke Frontend
        data_response = {
            "id": skrining.id,
            "hasil_deteksi": skrining.hasil_deteksi,
            "info_tambahan": {
                "metode": metode,
                "akurasi_ai": confidence
            }
        }
        
        return response.success(data_response, "Berhasil menambahkan data skrining")

    except Exception as e:
        db.session.rollback() # Rollback jika error
        print("Error create_skrining:", e)
        return response.bad_request([], f"Gagal menambahkan data skrining: {str(e)}")


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
            # Super admin melihat semua
            skrining_list = query.all()
        elif role == "admin_puskesmas":
            # Admin puskesmas melihat berdasarkan kecamatan_id dari pasien
            kecamatan_id = claims.get("kecamatan_id")
            skrining_list = query.filter(Pasien.kecamatan_id == kecamatan_id).all()
        else:  # 'user'
            # User hanya melihat skrining miliknya
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

        skrining = (
            Skrining.query.join(Pasien)
            .filter(Skrining.id == id, Pasien.kecamatan_id == kecamatan_id)
            .first()
        )

        if not skrining:
            return response.bad_request([], "Data skrining tidak ditemukan atau bukan wilayah Anda")

        data = request.get_json() or {}

        skrining.status = data.get("status", skrining.status)
        db.session.commit()

        # FIXED → kirim skrining + pasien
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

        # Query join Skrining + Pasien
        query = db.session.query(Skrining, Pasien).join(
            Pasien, Skrining.pasien_id == Pasien.id
        )

        # Superadmin -> lihat semuanya
        if role == "super_admin":
            records = query.all()

        # Admin Puskesmas -> filter by kecamatan pasien
        elif role == "admin_puskesmas":
            records = query.filter(Pasien.kecamatan_id == kecamatan_id).all()

        # User -> hanya skrining miliknya
        else:
            records = query.filter(Skrining.user_id == user_id).all()

        # Hitung statistik
        total_pasien = len(records)

        suspect = sum(
            1 for skrining, pasien in records
            if skrining.hasil_deteksi.upper() in ["TERDUGA", "TERDUGA TBC", "POSITIF"] # Update keyword
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


#GET RIWAYAT SKRINING BY PASIEN ID UNTUK RUJUKAN
@jwt_required()
def get_skrining_detail(id):
    try:
        # Cari skrining berdasarkan ID
        skrining = Skrining.query.get(id)
        
        if not skrining:
            return response.bad_request([], "Data skrining tidak ditemukan")

        # Cek hak akses: User biasa hanya boleh lihat punya sendiri
        claims = get_jwt()
        if claims['role'] == 'user' and skrining.user_id != claims['id']:
             return response.bad_request([], "Anda tidak berhak melihat data ini")

        # Gunakan helper single_object (yang sudah support data rujukan)
        data = single_object(skrining, skrining.pasien)
        
        return response.success(data, "Berhasil mengambil detail skrining")

    except Exception as e:
        print("Error get_skrining_detail:", e)
        return response.bad_request([], "Terjadi kesalahan server")

#GET RIWAYAT SKRINING BY PASIEN ID
@jwt_required()
def get_by_pasien(pasien_id):
    try:
        claims = get_jwt()
        role = claims.get("role")
        user_id = claims.get("id")

        query = db.session.query(Skrining, Pasien).join(
            Pasien, Skrining.pasien_id == Pasien.id
        ).filter(Pasien.id == pasien_id)

        # User hanya boleh melihat skrining milik pasiennya sendiri
        if role == "user":
            query = query.filter(Pasien.user_id == user_id)

        # Admin puskesmas hanya melihat sesuai kecamatan
        if role == "admin_puskesmas":
            query = query.filter(Pasien.kecamatan_id == claims.get("kecamatan_id"))

        result = query.all()

        return response.success(format_array(result), "Berhasil mengambil riwayat screening")

    except Exception as e:
        print("Error get_by_pasien:", e)
        return response.bad_request([], "Gagal mengambil data screening pasien")


#HELPER FUNCTIONS
def format_array(datas):
    array = []
    for skrining, pasien in datas:
        array.append(single_object(skrining, pasien))
    return array

def single_object(skrining, pasien):
    # --- LOGIC TAMBAHAN: DATA RUJUKAN & WILAYAH ---
    # Mengambil data rujukan dari backref (jika ada)
    rujukan = getattr(skrining, 'rujukan_detail', None) # Gunakan getattr biar aman
    
    status_rujukan = None
    tgl_verifikasi = None

    if rujukan:
        # Handle Enum StatusRujukan
        status_rujukan = rujukan.status.value if hasattr(rujukan.status, 'value') else str(rujukan.status)
        
        # Ambil tanggal jika sudah verified
        if status_rujukan == 'Terverifikasi' and rujukan.updated_at:
             tgl_verifikasi = rujukan.updated_at.isoformat()

    return {
        "id": skrining.id,
        "nama": pasien.nama,
        "nik": pasien.nik,
        "no_hp": pasien.no_hp,
        "alamat": pasien.alamat,
        "hasil_screening": skrining.hasil_deteksi,
        "tanggal_screening": skrining.tanggal_skrining.isoformat(),
        "total_screening": 1,
        "email": pasien.user.email if pasien.user else None,
        "tanggal_lahir": pasien.tanggal_lahir.isoformat() if pasien.tanggal_lahir else None,
        "usia": f"{pasien.usia} tahun" if pasien.usia else None,
        "pekerjaan": pasien.pekerjaan,
        "kelamin": pasien.jenis_kelamin.value if pasien.jenis_kelamin else None,
        "berat_badan": str(skrining.berat_badan),
        "tinggi_badan": str(skrining.tinggi_badan),
        
        # Map field gejala
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

        # --- TAMBAHAN DATA AI SUARA ---
        "skor_suara_ai": skrining.skor_suara_ai,
        "metode_skrining": skrining.metode_skrining,
        "gradcam_image": skrining.gradcam_image,

        # --- TAMBAHAN UNTUK FITUR SURAT RUJUKAN ---
        "rujukan_status": status_rujukan,          
        "rujukan_verified_at": tgl_verifikasi,     
        
        # Ambil Data Wilayah untuk KOP SURAT
        # Menggunakan safe navigation (getattr/check None)
        "nama_kecamatan": pasien.kecamatan.nama_kecamatan if pasien.kecamatan else "-",
        "nama_kabupaten": pasien.kecamatan.kabupaten.nama_kabupaten if (pasien.kecamatan and pasien.kecamatan.kabupaten) else "-",
    }