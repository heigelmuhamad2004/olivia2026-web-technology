from flask import jsonify
from app.model.provinsi import Provinsi
from app.model.kabupaten import Kabupaten
from app.model.kecamatan import Kecamatan

def get_provinsi():
    try:
        provinsi = Provinsi.query.all()
        if not provinsi:
            return jsonify({"status": "error", "message": "Tidak ada data provinsi"}), 404

        data = [{"id": p.id, "nama": p.nama_provinsi} for p in provinsi]
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        print("Error get_provinsi:", e)
        return jsonify({"status": "error", "message": "Gagal mengambil data provinsi"}), 500


def get_kabupaten(provinsi_id):
    try:
        kabupaten = Kabupaten.query.filter_by(provinsi_id=provinsi_id).all()
        if not kabupaten:
            return jsonify({"status": "error", "message": "Kabupaten tidak ditemukan"}), 404

        data = [{"id": k.id, "nama": k.nama_kabupaten} for k in kabupaten]
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        print("Error get_kabupaten:", e)
        return jsonify({"status": "error", "message": "Gagal mengambil data kabupaten"}), 500


def get_kecamatan(kabupaten_id):
    try:
        kecamatan = Kecamatan.query.filter_by(kabupaten_id=kabupaten_id).all()
        if not kecamatan:
            return jsonify({"status": "error", "message": "Kecamatan tidak ditemukan"}), 404

        data = [{"id": kc.id, "nama": kc.nama_kecamatan} for kc in kecamatan]
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        print("Error get_kecamatan:", e)
        return jsonify({"status": "error", "message": "Gagal mengambil data kecamatan"}), 500
