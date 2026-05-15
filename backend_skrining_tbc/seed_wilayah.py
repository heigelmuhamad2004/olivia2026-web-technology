import time
import requests
from requests.exceptions import RequestException
from app import app, db
from app.model.provinsi import Provinsi
from app.model.kabupaten import Kabupaten
from app.model.kecamatan import Kecamatan

def get_json_with_retry(url, retries=3, delay=2):
    """Mencoba ambil data dengan retry beberapa kali jika gagal."""
    for attempt in range(retries):
        try:
            res = requests.get(url, timeout=10)
            res.raise_for_status()
            return res.json()
        except RequestException as e:
            print(f"⚠️ Gagal ambil {url} ({e}), percobaan {attempt+1}/{retries}")
            time.sleep(delay)
    return []

with app.app_context():
    print("🗺️ Mengambil data provinsi...")
    provinces = get_json_with_retry("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")

    for prov in provinces:
        db.session.merge(Provinsi(id=prov["id"], nama_provinsi=prov["name"]))
    db.session.commit()
    print(f"✅ {len(provinces)} provinsi disimpan.")

    for prov in provinces:
        print(f"📍 Mengambil kabupaten untuk {prov['name']}...")
        regencies = get_json_with_retry(f"https://www.emsifa.com/api-wilayah-indonesia/api/regencies/{prov['id']}.json")

        for reg in regencies:
            db.session.merge(Kabupaten(id=reg["id"], nama_kabupaten=reg["name"], provinsi_id=prov["id"]))
        db.session.commit()

    kabupaten_all = Kabupaten.query.all()
    for kab in kabupaten_all:
        print(f"🏘️  Mengambil kecamatan untuk {kab.nama_kabupaten}...")
        districts = get_json_with_retry(f"https://www.emsifa.com/api-wilayah-indonesia/api/districts/{kab.id}.json")

        for dist in districts:
            db.session.merge(Kecamatan(id=dist["id"], nama_kecamatan=dist["name"], kabupaten_id=kab.id))
        db.session.commit()

    print("🎉 Semua data wilayah berhasil disimpan.")
