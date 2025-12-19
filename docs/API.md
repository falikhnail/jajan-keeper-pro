# Dokumentasi API Edge Functions

Dokumentasi lengkap untuk Edge Functions yang tersedia pada sistem POS.

## Base URL

```
https://dyyxsgbmnpdsgerlxtqe.supabase.co/functions/v1
```

---

## 1. Setup Admin

Endpoint untuk membuat akun admin pertama saat sistem baru diinstal.

### Endpoint

```
POST /setup-admin
```

### Headers

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Ya |

### Request Body

```json
{
  "username": "string",
  "fullName": "string",
  "password": "string"
}
```

### Parameters

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| username | string | Username untuk login (akan di-lowercase) | Ya |
| fullName | string | Nama lengkap admin | Ya |
| password | string | Password untuk login | Ya |

### Response

#### Success (200)

```json
{
  "success": true,
  "message": "Admin pertama berhasil dibuat"
}
```

#### Error Responses

| Status | Response | Keterangan |
|--------|----------|------------|
| 400 | `{ "error": "Missing required fields" }` | Field yang diperlukan tidak lengkap |
| 400 | `{ "error": "Admin sudah terdaftar. Gunakan halaman login." }` | Admin sudah ada |
| 400 | `{ "error": "Username sudah digunakan" }` | Username sudah terpakai |
| 500 | `{ "error": "..." }` | Gagal membuat user/profil/role |

### Catatan

- Fungsi ini hanya bisa dijalankan **sekali** saat sistem belum memiliki admin
- Email otomatis dibuat dengan format: `{username}@pos.local`
- Tidak memerlukan autentikasi

### Contoh Penggunaan

```typescript
const response = await supabase.functions.invoke('setup-admin', {
  body: {
    username: 'admin',
    fullName: 'Administrator',
    password: 'password123'
  }
});

if (response.error) {
  console.error('Error:', response.error);
} else {
  console.log('Admin berhasil dibuat');
}
```

---

## 2. Admin Users

Endpoint untuk manajemen user oleh admin. Memerlukan autentikasi dan role admin.

### Endpoint

```
POST /admin-users
```

### Headers

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Ya |
| Authorization | Bearer {JWT_TOKEN} | Ya |

### Authentication

- Memerlukan JWT token dari user yang sudah login
- User harus memiliki role `admin`

---

### Action: Create User

Membuat user baru (admin atau kasir).

#### Request Body

```json
{
  "action": "create",
  "username": "string",
  "fullName": "string",
  "password": "string",
  "role": "admin" | "kasir"
}
```

#### Parameters

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| action | string | Harus `"create"` | Ya |
| username | string | Username untuk login | Ya |
| fullName | string | Nama lengkap user | Ya |
| password | string | Password untuk login | Ya |
| role | string | Role user: `"admin"` atau `"kasir"` | Ya |

#### Response Success (200)

```json
{
  "success": true,
  "userId": "uuid-of-created-user"
}
```

#### Contoh Penggunaan

```typescript
const { data, error } = await supabase.functions.invoke('admin-users', {
  body: {
    action: 'create',
    username: 'kasir01',
    fullName: 'Kasir Satu',
    password: 'password123',
    role: 'kasir'
  }
});
```

---

### Action: Reset Password

Mengubah password user.

#### Request Body

```json
{
  "action": "reset_password",
  "userId": "string",
  "newPassword": "string"
}
```

#### Parameters

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| action | string | Harus `"reset_password"` | Ya |
| userId | string | UUID user yang akan di-reset password | Ya |
| newPassword | string | Password baru | Ya |

#### Response Success (200)

```json
{
  "success": true
}
```

#### Contoh Penggunaan

```typescript
const { data, error } = await supabase.functions.invoke('admin-users', {
  body: {
    action: 'reset_password',
    userId: 'user-uuid-here',
    newPassword: 'newpassword123'
  }
});
```

---

### Action: Delete User

Menghapus user dari sistem.

#### Request Body

```json
{
  "action": "delete",
  "userId": "string"
}
```

#### Parameters

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| action | string | Harus `"delete"` | Ya |
| userId | string | UUID user yang akan dihapus | Ya |

#### Response Success (200)

```json
{
  "success": true
}
```

#### Error Khusus

| Status | Response | Keterangan |
|--------|----------|------------|
| 400 | `{ "error": "Tidak dapat menghapus akun sendiri" }` | Admin tidak bisa menghapus akunnya sendiri |

#### Contoh Penggunaan

```typescript
const { data, error } = await supabase.functions.invoke('admin-users', {
  body: {
    action: 'delete',
    userId: 'user-uuid-to-delete'
  }
});
```

---

### Error Responses Umum (admin-users)

| Status | Response | Keterangan |
|--------|----------|------------|
| 401 | `{ "error": "Unauthorized" }` | Token tidak valid atau tidak ada |
| 403 | `{ "error": "Forbidden: Admin access required" }` | User bukan admin |
| 400 | `{ "error": "Missing required fields" }` | Field yang diperlukan tidak lengkap |
| 400 | `{ "error": "Username sudah digunakan" }` | Username sudah terpakai |
| 400 | `{ "error": "Invalid action" }` | Action tidak valid |
| 500 | `{ "error": "..." }` | Server error |

---

## Database Schema Reference

### Tabel: profiles

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference ke auth.users |
| username | text | Username unik |
| full_name | text | Nama lengkap |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu update |

### Tabel: user_roles

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference ke auth.users |
| role | app_role | Enum: `admin` atau `kasir` |
| created_at | timestamp | Waktu dibuat |

### Database Function: has_role

```sql
has_role(_user_id uuid, _role app_role) RETURNS boolean
```

Mengecek apakah user memiliki role tertentu.

---

## CORS Headers

Semua endpoint mendukung CORS dengan header:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

Preflight request (OPTIONS) akan mengembalikan response kosong dengan header CORS.

---

## Rate Limiting

Tidak ada rate limiting khusus yang diterapkan pada edge functions ini. Namun, Supabase memiliki rate limiting default pada level platform.

---

## Security Considerations

1. **setup-admin**: Hanya bisa dijalankan sekali (saat belum ada admin)
2. **admin-users**: Memerlukan autentikasi dan role admin
3. Email format `@pos.local` digunakan untuk membedakan dari email normal
4. Password di-hash secara otomatis oleh Supabase Auth
5. RLS policies diterapkan pada tabel profiles dan user_roles

---

## Changelog

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 1.0.0 | 2025-01 | Initial release dengan setup-admin dan admin-users |
