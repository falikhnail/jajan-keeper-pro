# Sistem POS (Point of Sale)

Aplikasi kasir dan manajemen toko berbasis web dengan fitur lengkap untuk mengelola penjualan, stok, supplier, dan laporan.

## Fitur Utama

### 🛒 Kasir (POS)
- Transaksi penjualan cepat dengan pencarian produk
- Keranjang belanja dengan manajemen kuantitas
- Dukungan metode pembayaran tunai dan non-tunai
- Cetak struk otomatis

### 📦 Manajemen Produk
- Tambah, edit, dan hapus produk
- Kategori produk
- Harga jual dan harga modal
- Pelacakan stok otomatis

### 🏢 Manajemen Supplier
- Data supplier lengkap (nama, telepon, alamat)
- Hubungan produk dengan supplier
- Catatan dan keterangan supplier

### 📊 Stok Opname
- Pengecekan stok fisik vs sistem
- Pencatatan selisih stok
- Catatan hasil opname

### 💰 Deposit Supplier
- Pencatatan titipan barang dari supplier
- Status pembayaran deposit
- Riwayat deposit per supplier

### 📈 Laporan
- Laporan penjualan harian/mingguan/bulanan
- Laporan laba rugi
- Grafik pendapatan
- Export laporan ke PDF/Excel

### 💾 Backup & Sinkronisasi
- **Sinkronisasi Cloud**: Upload dan download data ke cloud
- **Backup JSON**: Export/import data dalam format JSON
- **Export Excel**: Export semua data ke file Excel
- Reset data untuk memulai dari awal

### 👥 Manajemen User
- Role admin dan kasir
- Admin: akses penuh ke semua fitur
- Kasir: akses terbatas hanya ke menu kasir

### 📱 Progressive Web App (PWA)
- Dapat diinstall di perangkat mobile/desktop
- Akses offline
- Notifikasi push

## Teknologi

| Teknologi | Kegunaan |
|-----------|----------|
| React 18 | Frontend framework |
| TypeScript | Type-safe JavaScript |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first CSS framework |
| shadcn/ui | Komponen UI |
| Zustand | State management |
| Supabase | Backend & database cloud |
| React Router | Navigasi |
| Recharts | Grafik dan chart |
| jsPDF | Generate PDF |
| xlsx | Export Excel |

## Struktur Database

### Tabel Utama
- `products` - Data produk
- `suppliers` - Data supplier
- `transactions` - Riwayat transaksi
- `stock_opnames` - Catatan stok opname
- `supplier_deposits` - Deposit/titipan supplier
- `profiles` - Profil pengguna
- `user_roles` - Role pengguna (admin/kasir)

## Role & Akses

| Fitur | Admin | Kasir |
|-------|-------|-------|
| Dashboard | ✅ | ❌ |
| Kasir | ✅ | ✅ |
| Produk | ✅ | ❌ |
| Supplier | ✅ | ❌ |
| Stok Opname | ✅ | ❌ |
| Laporan | ✅ | ❌ |
| Backup & Import | ✅ | ❌ |
| Install App | ✅ | ❌ |
| Manajemen User | ✅ | ❌ |

## Instalasi & Pengembangan

```bash
# Clone repository
git clone <YOUR_GIT_URL>

# Masuk ke direktori project
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

## Penggunaan

### Setup Awal
1. Akses aplikasi dan buat akun admin pertama
2. Login dengan kredensial admin
3. Tambahkan supplier di menu **Supplier**
4. Tambahkan produk di menu **Produk**
5. Mulai transaksi di menu **Kasir**

### Menambah User Kasir
1. Buka menu **Manajemen User**
2. Klik **Tambah User**
3. Isi username, nama lengkap, password
4. Pilih role **Kasir**

### Sinkronisasi Data
1. Buka menu **Backup & Import**
2. Tab **Sinkronisasi Cloud**
3. Klik **Upload ke Cloud** untuk menyimpan data
4. Klik **Download dari Cloud** untuk mengambil data

### Backup Manual
1. Buka menu **Backup & Import**
2. Tab **Backup & Restore**
3. Klik **Export Backup JSON** untuk download
4. Untuk restore, klik **Pilih File Backup** dan pilih file JSON

## Lisensi

Hak Cipta © 2025. All rights reserved.

---

Dibuat dengan ❤️
