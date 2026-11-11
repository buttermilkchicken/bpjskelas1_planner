
# Menggunakan Nginx Alpine sebagai base image
FROM nginx:alpine

# Menghapus konfigurasi default Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Menyalin konfigurasi Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Menyalin file frontend
COPY public/ /usr/share/nginx/html/

# Membuka port 80
EXPOSE 80
