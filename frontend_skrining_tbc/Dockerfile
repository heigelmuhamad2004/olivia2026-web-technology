FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Tambahkan build agar aplikasi siap dijalankan di server
RUN npm run build

EXPOSE 3000

# Ubah dev menjadi start untuk menjalankan versi ringan/produksi
CMD ["npm", "run", "start"]
