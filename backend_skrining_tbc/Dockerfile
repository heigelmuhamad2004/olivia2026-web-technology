# Gunakan Python 3.10 agar 100% kompatibel dengan TensorFlow & Librosa
FROM python:3.10-slim

WORKDIR /app

# Instalasi dependensi OS untuk AI Audio & Computer Vision
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy dan instal library Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy seluruh source code backend
COPY . .

EXPOSE 5000

# MENGGUNAKAN FLASK RUN (Dibuka untuk semua IP agar bisa diakses Frontend)
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]