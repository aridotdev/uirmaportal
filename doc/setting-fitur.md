# Usulan Fitur Settings MVP

Dokumen ini merangkum usulan fitur halaman `Settings` untuk aplikasi RMA Portal, disesuaikan dengan `prd.md` dan praktik MVP yang umum dipakai di aplikasi internal operasional. Fokusnya sengaja dibuat sederhana agar cepat dibangun, mudah dipakai user, dan mudah diintegrasikan ke backend.

## Scope MVP

- Halaman `Settings` hanya fokus pada pengaturan akun user yang sedang login.
- Berlaku untuk role dashboard: `QRCC`, `MANAGEMENT`, dan `ADMIN`.
- Untuk area `CS`, tetap gunakan halaman `Profile` terpisah seperti yang sudah disebut di PRD.
- Menu yang disarankan untuk MVP hanya 2:
  - `General`
  - `Security`

## 1. Settings / General

### Tujuan
- Memberi user akses cepat untuk melihat identitas akun yang sedang dipakai.
- Menjaga data inti akun tetap terkendali dan tidak diubah sembarangan oleh user.

### Akses
- `QRCC`
- `MANAGEMENT`
- `ADMIN`

### Isi Utama
- `Full Name`
- `Username`
- `Email`
- `Role`
- `Branch`
- Opsional ringan:
  - `Status akun`
  - `Last login`

### Perilaku
- Semua field tampil `read-only`.
- Tidak ada edit langsung pada halaman ini untuk MVP.
- Jika ada perubahan data identitas, user diarahkan untuk menghubungi admin.

### Komponen UI
- Card profil / account information
- Badge role
- Helper text singkat, misalnya: `Data akun inti dikelola oleh admin.`

### State Minimum
- Loading
- Empty / fallback jika ada field belum terisi
- Error state jika data profile gagal dimuat

## 2. Settings / Security

### Tujuan
- Memenuhi kebutuhan keamanan dasar user tanpa membuat scope terlalu besar.

### Akses
- `QRCC`
- `MANAGEMENT`
- `ADMIN`

### Isi Utama
- `Current Password`
- `New Password`
- `Confirm New Password`

### Validasi Minimum
- Semua field wajib diisi
- Password baru minimal `8 karakter`
- Password baru tidak boleh sama dengan password lama
- Konfirmasi password harus sama dengan password baru

### Perilaku
- Tombol submit hanya aktif jika form valid
- Saat submit, tampil loading state
- Jika berhasil, tampilkan `success toast`
- Jika gagal, tampilkan `error alert` yang jelas

### Komponen UI
- Form security dalam card
- Tombol show / hide password
- Submit button

### State Minimum
- Validation error
- Submit loading
- Success state
- Server error state

## Navigasi yang Disarankan

- Tab `General`
- Tab `Security`

## Aturan MVP

- User hanya boleh melihat data akunnya sendiri
- User tidak boleh mengubah `role`, `branch`, `username`, atau identitas inti sendiri pada MVP
- Perubahan password wajib menggunakan password lama sebagai verifikasi
- Belum perlu fitur lanjutan seperti:
  - Two-factor authentication
  - Device / session management
  - Notification preferences
  - Members management
  - API tokens

## Kenapa Scope Ini Paling Pas

- Sudah sesuai PRD: `basic account information` dan `security form untuk password update`
- Cocok untuk internal operational app yang lebih mengutamakan efisiensi dan keamanan dasar
- Scope kecil, cepat dibangun, dan tidak tumpang tindih dengan modul `Users`

## Requirement Backend Minimal

Supaya frontend settings mudah diintegrasikan, backend MVP cukup menyediakan 2 area utama: `profile self` dan `change password`.

### A. Get Current User Profile

#### Tujuan
- Mengambil data akun user yang sedang login untuk ditampilkan di tab `General`.

#### Endpoint yang disarankan
- `GET /api/settings/profile`

#### Auth
- Wajib login
- Semua role dashboard yang valid boleh akses endpoint ini untuk data dirinya sendiri

#### Response yang disarankan

```json
{
  "data": {
    "id": "usr_xxx",
    "fullName": "John Doe",
    "username": "jdoe",
    "email": "john.doe@company.com",
    "role": "QRCC",
    "branch": "Jakarta",
    "isActive": true,
    "lastLoginAt": 1711111111111,
    "lastPasswordChangedAt": 1711000000000
  }
}
```

#### Catatan implementasi
- Ambil user berdasarkan session user yang sedang login, bukan dari parameter user id dari client
- `branch` bisa berasal dari relasi profile / user master, tergantung desain schema nanti
- `lastPasswordChangedAt` boleh dikirim walaupun belum langsung dipakai di UI awal, karena berguna untuk pengembangan berikutnya

### B. Change Password

#### Tujuan
- Mengizinkan user mengganti password akunnya sendiri secara aman

#### Endpoint yang disarankan
- `POST /api/settings/change-password`

#### Request body yang disarankan

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password-123",
  "confirmPassword": "new-password-123"
}
```

#### Validasi backend minimum
- Semua field wajib diisi
- `newPassword.length >= 8`
- `newPassword !== currentPassword`
- `confirmPassword === newPassword`
- Password lama harus valid terhadap user yang sedang login
- User harus aktif

#### Response sukses yang disarankan

```json
{
  "message": "Password berhasil diperbarui"
}
```

#### Response error yang disarankan

```json
{
  "message": "Password saat ini tidak valid"
}
```

#### Error cases yang perlu dibedakan
- `400 Bad Request`: payload tidak valid / konfirmasi password tidak cocok
- `401 Unauthorized`: belum login / session invalid
- `403 Forbidden`: user inactive / tidak diizinkan
- `422 Unprocessable Entity`: current password salah atau rule password gagal
- `500 Internal Server Error`: kegagalan tak terduga

## Struktur Data Backend yang Disarankan

Untuk MVP, tidak perlu tabel settings terpisah jika kebutuhan hanya profile self dan ubah password.

### Minimal data yang perlu tersedia di user domain
- `id`
- `name` / `fullName`
- `username`
- `email`
- `role`
- `branch`
- `isActive`
- `lastLoginAt` opsional
- `passwordChangedAt` opsional

Jika saat ini data branch atau profile belum menyatu di tabel user auth, cukup sediakan service gabungan yang mengembalikan payload siap pakai untuk frontend.

## Kontrak Frontend-Backend yang Disarankan

Supaya integrasi lebih mudah, frontend cukup mengandalkan 2 contract berikut:

### 1. Profile contract
- Frontend memanggil `GET /api/settings/profile`
- Backend mengembalikan data profile user yang sedang login
- Frontend hanya render data, tanpa mode edit

### 2. Change password contract
- Frontend submit ke `POST /api/settings/change-password`
- Backend melakukan validasi payload dan verifikasi password lama
- Jika sukses, frontend tampilkan toast sukses dan reset form

## Acceptance Criteria Ringkas

### Settings / General
- User dapat membuka halaman settings
- User dapat melihat data akun dirinya sendiri
- Field tidak bisa diedit
- Jika data gagal dimuat, tampil error state yang jelas

### Settings / Security
- User dapat mengubah password menggunakan password lama
- Validasi form berjalan di frontend dan backend
- Jika password lama salah, user mendapat pesan error yang jelas
- Jika sukses, password tersimpan dan user mendapat notifikasi sukses

## Summary Akhir

- MVP `Settings` cukup terdiri dari 2 tab: `General` dan `Security`
- `General` hanya menampilkan data akun read-only
- `Security` hanya menangani ubah password
- Backend minimal cukup menyediakan endpoint profile self dan change password
- Dengan scope ini, implementasi tetap sederhana, aman, dan cepat diintegrasikan ke modul auth/backend yang akan dibangun nanti
