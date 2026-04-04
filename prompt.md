# Technical Plan: Fix Evidence Upload Preview — File Name & Delete Button Tidak Terlihat

## 1. Deskripsi Masalah

**Halaman:** `/cs/claims/create` → Step 2 (Evidence Upload)
**File:** `app/pages/cs/claims/create.vue`
**Baris terdampak:** 1154–1182 (blok "Preview State")

**Gejala:**
Ketika user upload foto yang dimensinya besar (misalnya 4000×3000px), preview gambar memakan seluruh ruang container sehingga **nama file**, **ukuran file**, dan **tombol delete (ikon Trash2 merah)** di bagian bawah card tidak terlihat — tertutup/terdorong keluar area visible karena `overflow-hidden` pada parent container.

**Dampak UX:**
- User tidak tahu file apa yang sudah di-upload (nama file tersembunyi)
- User tidak bisa menghapus foto yang salah karena tombol delete tidak terlihat
- User harus refresh halaman untuk mengganti foto — sangat mengganggu workflow

---

## 2. Analisis Root Cause

### Struktur HTML Saat Ini (Baris 1106–1182)

```
div.h-64.overflow-hidden              ← PARENT: tinggi tetap 256px, potong konten yang meluber
│
└─ div.absolute.inset-0.flex.flex-col  ← isi penuh 256px, susun anak vertikal
   │
   ├─ div.flex-1                       ← AREA GAMBAR: ambil sisa ruang setelah bottom bar
   │  └─ img.w-full.h-full.object-cover
   │
   └─ div.p-4                          ← BOTTOM BAR: nama file + tombol delete
```

### Kenapa Rusak

1. Parent container memiliki `h-64` (256px) dan `overflow-hidden` — konten yang meluber dipotong.
2. Di dalam flexbox vertikal (`flex-col`), `div.flex-1` (area gambar) seharusnya mengambil sisa ruang setelah bottom bar.
3. **MASALAH INTI:** Pada CSS flexbox, default `min-height` sebuah flex item adalah `min-content` — artinya flex item **tidak akan menyusut lebih kecil dari ukuran intrinsik kontennya**.
4. Tag `<img>` memiliki ukuran intrinsik dari file aslinya (misal 3000px tinggi). Meskipun pakai `object-cover`, elemen `<img>` tetap punya intrinsic height yang besar.
5. Akibatnya, `div.flex-1` menolak menyusut di bawah 3000px, mendorong `div.p-4` (bottom bar) jauh ke bawah — melewati batas 256px parent.
6. Karena parent punya `overflow-hidden`, bottom bar terpotong dan tidak terlihat.

### Ilustrasi Visual

```
┌──────────────────────────────┐ ← h-64 (256px), overflow-hidden
│                              │
│   ┌──────────────────────┐   │
│   │                      │   │
│   │    GAMBAR PREVIEW    │   │  ← flex-1, tapi min-height = intrinsic (3000px!)
│   │    (object-cover)    │   │
│   │                      │   │
│───│──────────────────────│───│ ← batas visible 256px
│   │                      │   │  ← gambar masih berlanjut (invisible)
│   │                      │   │
│   └──────────────────────┘   │
│   ┌──────────────────────┐   │
│   │ filename.jpg  [🗑️]   │   │  ← BOTTOM BAR: terdorong ke sini, TIDAK TERLIHAT
│   └──────────────────────┘   │
└──────────────────────────────┘
```

---

## 3. Solusi

Tambahkan 2 Tailwind utility class pada 2 elemen. Tidak ada perubahan warna, spacing, font, border-radius, atau style visual lainnya.

### Perubahan A: Image Wrapper — Tambah `min-h-0 overflow-hidden`

**File:** `app/pages/cs/claims/create.vue`
**Baris:** 1159

**BEFORE (kode asli):**
```html
<div class="flex-1 bg-zinc-900 flex items-center justify-center p-2">
```

**AFTER (kode baru):**
```html
<div class="flex-1 min-h-0 overflow-hidden bg-zinc-900 flex items-center justify-center p-2">
```

**Penjelasan per class:**
- `min-h-0` → Set `min-height: 0`, menimpa default flexbox `min-height: min-content`. Ini mengizinkan div menyusut lebih kecil dari ukuran intrinsik gambar.
- `overflow-hidden` → Setelah div menyusut, gambar yang lebih besar dari div akan ter-clip rapi, tidak meluber ke elemen lain.

### Perubahan B: Bottom Bar — Tambah `shrink-0`

**File:** `app/pages/cs/claims/create.vue`
**Baris:** 1166

**BEFORE (kode asli):**
```html
<div class="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
```

**AFTER (kode baru):**
```html
<div class="shrink-0 p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
```

**Penjelasan:**
- `shrink-0` → Set `flex-shrink: 0`. Menjamin bottom bar TIDAK PERNAH menyusut meskipun ruang terbatas. Area gambar yang akan menyesuaikan, bukan bottom bar.

---

## 4. Hasil Setelah Fix

```
┌──────────────────────────────┐ ← h-64 (256px), overflow-hidden
│                              │
│   ┌──────────────────────┐   │
│   │                      │   │
│   │    GAMBAR PREVIEW    │   │  ← flex-1 + min-h-0: menyusut sesuai ruang
│   │    (object-cover)    │   │     overflow-hidden: clip gambar rapi
│   │                      │   │
│   └──────────────────────┘   │
│   ┌──────────────────────┐   │
│   │ filename.jpg  [🗑️]   │   │  ← shrink-0: SELALU TERLIHAT
│   └──────────────────────┘   │
│                              │
└──────────────────────────────┘
```

---

## 5. Langkah Implementasi (Copy-Paste Ready)

### Step 1: Buka file
```
app/pages/cs/claims/create.vue
```

### Step 2: Cari baris 1159, ganti satu baris

Cari teks ini (exact match):
```
<div class="flex-1 bg-zinc-900 flex items-center justify-center p-2">
```

Ganti dengan:
```
<div class="flex-1 min-h-0 overflow-hidden bg-zinc-900 flex items-center justify-center p-2">
```

### Step 3: Cari baris 1166, ganti satu baris

Cari teks ini (exact match):
```
<div class="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
```

Ganti dengan:
```
<div class="shrink-0 p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
```

### Step 4: Simpan file

Tidak ada file lain yang perlu diubah.

---

## 6. Verifikasi Manual

1. Jalankan `pnpm dev`
2. Buka `http://localhost:3000/cs/claims/create`
3. Di Step 1, isi semua field wajib (pilih vendor **MOKA** agar muncul 6 slot foto)
4. Klik **CONTINUE** ke Step 2

**Test Case 1 — Gambar Besar:**
- Upload foto beresolusi tinggi (4000×3000px atau lebih besar, >1MB)
- ✅ Gambar preview tampil di area atas, ter-crop rapi
- ✅ Nama file terlihat di bawah preview (teks terpotong dengan ellipsis jika terlalu panjang)
- ✅ Ukuran file (dalam MB) terlihat di bawah nama file
- ✅ Tombol delete (ikon tempat sampah merah) terlihat di kanan bawah
- ✅ Klik tombol delete berhasil menghapus foto dan kembali ke dropzone

**Test Case 2 — Gambar Kecil:**
- Upload foto kecil (200×200px, <100KB)
- ✅ Preview tetap tampil normal, tidak ada regresi
- ✅ Bottom bar tetap di posisi yang benar

**Test Case 3 — Gambar Landscape Sangat Lebar:**
- Upload foto panorama (8000×1000px)
- ✅ Gambar ter-crop oleh `object-cover`, preview tetap rapi
- ✅ Bottom bar tetap terlihat

**Test Case 4 — Gambar Portrait Sangat Tinggi:**
- Upload foto portrait (1000×8000px)
- ✅ Gambar ter-crop oleh `object-cover`, preview tetap rapi
- ✅ Bottom bar tetap terlihat

**Test Case 5 — Responsive:**
- Resize browser ke lebar mobile (~375px)
- ✅ Grid berubah ke 1 kolom, setiap card tetap menampilkan bottom bar dengan benar

---

## 7. Apa yang TIDAK Boleh Diubah

- ❌ Jangan ubah `h-64` pada parent container (baris 1108)
- ❌ Jangan ubah `rounded-4xl`, `border-2 border-dashed`, atau class visual lainnya
- ❌ Jangan ubah `object-cover` pada tag `<img>` (baris 1163)
- ❌ Jangan ubah padding, warna, font, atau ukuran ikon yang sudah ada
- ❌ Jangan tambah JavaScript/TypeScript — fix ini murni CSS (Tailwind class)
- ❌ Jangan ubah logika upload/preview di bagian `<script setup>`

---

## 8. Referensi Teknis

- **MDN — min-height pada flex items:** Flex items default `min-height: auto` (yang resolve ke `min-content`), menyebabkan item tidak mau menyusut di bawah ukuran kontennya. Set `min-height: 0` untuk override behavior ini.
  Ref: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Controlling_ratios_of_flex_items_along_the_main_axis
- **Tailwind `min-h-0`:** Menghasilkan `min-height: 0px`
- **Tailwind `shrink-0`:** Menghasilkan `flex-shrink: 0`
- **Tailwind `overflow-hidden`:** Menghasilkan `overflow: hidden`
