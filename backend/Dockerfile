
# 1. Menggunakan Node.js sebagai base image
FROM node:22-alpine

# 2. Menentukan working directory
WORKDIR /app

# 3. Menyalin package.json dan package-lock.json
COPY package*.json ./

# 4. Menginstal dependencies
RUN npm ci --omit=dev

# 5. Menyalin source code backend
COPY src/ ./src/

# 6. Membuka port backend
EXPOSE 3000

# 7. Menjalankan aplikasi
CMD ["npm", "start"]
