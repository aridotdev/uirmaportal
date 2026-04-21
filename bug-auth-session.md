# Bug Investigation - Auth Session Refresh Redirect

## Ringkasan
- Bug ini bukan spesifik di defect page, tetapi masalah auth/session global yang bisa mempengaruhi seluruh halaman protected.
- Gejala utama: saat hard refresh di halaman yang membutuhkan auth, user yang sebenarnya masih punya session valid bisa diarahkan kembali ke `/login`.
- Akar masalah paling kuat ada pada race condition bootstrap session di layer client, khususnya interaksi antara `useAsyncData(..., { lazy: true })`, route middleware global, dan propagasi state `user/session` di composable auth.

## Gejala yang ditemukan
- Hard refresh pada route protected kadang melempar user ke `/login`.
- Potensi gejala serupa juga ada pada:
  - redirect setelah login
  - redirect dari root page `/`
  - akses langsung ke URL protected dalam tab baru
  - route CS dan dashboard yang sama-sama memakai auth global

## Dampak area yang berisiko
- Semua halaman dengan `middleware: 'auth'`
- Semua route `/dashboard/*`
- Semua route `/cs/*`
- Root route `/`
- Flow login/logout dan landing page resolution

## Peta alur auth saat ini

### 1. Login flow
- `app/pages/login.vue:48` memanggil `login()` dari `app/composables/useAuthSession.ts`.
- `app/composables/useAuthSession.ts:76` melakukan `POST` ke `/api/auth/sign-in`.
- `server/api/auth/sign-in.post.ts:11` meneruskan request ke Better Auth.
- Better Auth dipanggil dengan `asResponse: true` di:
  - `server/api/auth/sign-in.post.ts:16`
  - `server/api/auth/sign-in.post.ts:27`
- Artinya, cookie session diset oleh response Better Auth.
- Setelah itu, `login()` memanggil `refreshSession()` di `app/composables/useAuthSession.ts:85`.

### 2. Session fetch flow
- Session di client dimuat oleh `useAsyncData('auth-session', ...)` di `app/composables/useAuthSession.ts:25`.
- Fetch session dilakukan ke `server/api/auth/session.get.ts:4`.
- Endpoint session memanggil `auth.api.getSession({ headers })` di `server/api/auth/session.get.ts:6`.

### 3. Route protection flow
- Route protection utama ada di `app/middleware/auth.global.ts:1`.
- Middleware membaca:
  - `session`
  - `status`
  - `refreshSession`
  - `getLandingPage`
- Jika `status` masih `idle` atau `pending`, middleware mencoba memanggil `await refreshSession()` di `app/middleware/auth.global.ts:9`.
- Jika setelah itu `session.value` kosong, middleware redirect ke `/login` di `app/middleware/auth.global.ts:20`.

### 4. Protected API flow
- Semua API protected dijaga oleh `server/middleware/auth.ts:5`.
- Middleware server memanggil `auth.api.getSession({ headers })` di `server/middleware/auth.ts:20`.
- Jika session tidak ada, request API ditolak dengan `401 Unauthorized` di `server/middleware/auth.ts:22`.

## Root cause utama

### Root cause 1 - race condition bootstrap session client
Confidence: sangat tinggi

- `useAuthSession()` memakai `useAsyncData(..., { lazy: true, default: () => null })` di `app/composables/useAuthSession.ts:25`.
- Dengan `lazy: true`, state awal session akan tetap `null` sampai fetch session selesai.
- Middleware global memang mencoba mengatasi ini dengan `await refreshSession()`, tetapi keputusan akhir redirect tetap bergantung pada `session.value`.
- `session.value` sendiri bukan langsung hasil `sessionData.value`, melainkan turunan dari `user.value`.
- `user.value` diisi lewat `watchEffect()` pada `app/composables/useAuthSession.ts:36`.
- Artinya ada dua titik timing yang bisa tidak sinkron:
  - `refreshSession()` selesai atau belum
  - `watchEffect()` sudah memetakan `sessionData -> user -> session` atau belum
- Jika middleware membaca `session.value` sebelum propagasi state selesai, user dianggap belum login dan langsung diarahkan ke `/login`.

### Root cause 2 - source of truth auth state tersebar
Confidence: tinggi

- Saat ini source of truth auth di client tidak sepenuhnya langsung memakai `sessionData.value`.
- Ada state tambahan `user` (`useState('auth-user')`) di `app/composables/useAuthSession.ts:19`.
- `session`, `role`, `isAuthenticated`, dan `getLandingPage()` bergantung pada state `user.value`, bukan langsung pada `sessionData.value`.
- Struktur ini menambah kemungkinan state sementara tidak sinkron saat bootstrap, refresh, dan redirect.

### Root cause 3 - login redirect juga berpotensi flakey
Confidence: sedang-tinggi

- Di `app/pages/login.vue:48`, submit login memanggil `await login(...)`.
- Setelah itu page langsung memanggil `navigateTo(getLandingPage(), { replace: true })` di `app/pages/login.vue:49`.
- `getLandingPage()` membaca `user.value` di `app/composables/useAuthSession.ts:106`.
- Jika state `user` belum benar-benar settle setelah `refreshSession()`, landing page bisa salah, terlambat, atau bergantung pada race condition yang sama.

### Root cause 4 - root page `/` redirect client-only
Confidence: sedang

- `app/pages/index.vue:6` hanya memakai `onMounted(() => navigateTo(getLandingPage(), { replace: true }))`.
- Tidak ada mekanisme tunggu session bootstrap sebelum redirect.
- Karena `getLandingPage()` bergantung pada `user.value`, halaman `/` berpotensi mengarahkan user yang masih login ke `/login` bila session belum siap saat mounted.

## Temuan tambahan

### Field `rememberMe` belum diteruskan dari client login
- `server/api/auth/sign-in.post.ts:8` menerima `rememberMe`.
- Tetapi `app/composables/useAuthSession.ts:80` hanya mengirim:
  - `identifier`
  - `password`
- Ini bukan penyebab utama redirect saat refresh, tetapi bisa mempengaruhi ekspektasi perilaku sesi bila fitur "ingat sesi" diharapkan aktif.

### Route root diprerender
- `nuxt.config.ts:18` memiliki `routeRules: { '/': { prerender: true } }`.
- Ini bukan penyebab utama session loss, tetapi membuat flow redirect root `/` lebih sensitif bila auth resolution hanya dilakukan di client setelah mount.

## Kenapa ini bukan bug defect page
- `app/pages/dashboard/master/defect.vue` hanya menggunakan pola auth yang sama dengan halaman protected lain.
- Halaman seperti `app/pages/dashboard/master/vendor.vue` juga memakai `useAuthSession()` dan middleware auth yang sama.
- Jadi issue refresh ke login adalah masalah shared auth/session layer, bukan hasil wiring CRUD defect secara spesifik.

## File yang relevan
- `app/composables/useAuthSession.ts`
- `app/middleware/auth.global.ts`
- `app/pages/login.vue`
- `app/pages/index.vue`
- `server/api/auth/sign-in.post.ts`
- `server/api/auth/sign-out.post.ts`
- `server/api/auth/session.get.ts`
- `server/middleware/auth.ts`
- `server/utils/auth-config.ts`
- `server/utils/request-headers.ts`

## Strategi fix yang direkomendasikan

### 1. Jadikan session fetch sebagai source of truth tunggal
- Kurangi ketergantungan pada state turunan yang diisi terpisah via `watchEffect()`.
- Sebisa mungkin derive:
  - `user`
  - `session`
  - `role`
  - `isAuthenticated`
  langsung dari `sessionData.value`.

### 2. Tambahkan helper bootstrap session yang deterministik
- Buat helper seperti `ensureSessionResolved()` / `resolveSession()` di `useAuthSession()`.
- Helper ini harus:
  - menunggu `refreshSession()` selesai
  - memastikan state final benar-benar settled
  - mengembalikan hasil final auth yang aman untuk dipakai middleware

### 3. Perkuat `auth.global.ts`
- Middleware jangan memutuskan redirect hanya dari snapshot sementara `session.value`.
- Middleware harus memakai helper bootstrap di atas, lalu baru memutuskan:
  - lanjut ke page protected
  - redirect ke `/login`
  - redirect ke landing page sesuai role

### 4. Perkuat login flow
- Setelah login berhasil, redirect sebaiknya memakai hasil auth final yang sudah resolve.
- Hindari bergantung pada state `user.value` yang mungkin belum sinkron di tick yang sama.

### 5. Perkuat root route `/`
- Redirect di `/` sebaiknya juga memakai auth bootstrap yang sama.
- Hindari client-only redirect berbasis snapshot auth yang belum settle.

### 6. Rapikan support `rememberMe`
- Jika fitur ini memang dimaksudkan aktif, teruskan nilai `remember` dari form ke `rememberMe` pada request login.

## Rencana verifikasi setelah fix

### Manual test inti
- Login lalu hard refresh di `/dashboard/master/defect`
- Login lalu hard refresh di `/dashboard`
- Login sebagai CS lalu hard refresh di `/cs`
- Paste URL protected di tab baru saat session masih valid
- Akses `/login` saat session aktif dan pastikan diarahkan ke landing page
- Akses `/` saat session aktif dan pastikan diarahkan ke landing page yang benar
- Logout lalu refresh route protected dan pastikan tetap diarahkan ke `/login`

### Manual test tambahan
- Refresh beberapa kali beruntun setelah login
- Biarkan app idle beberapa menit lalu refresh lagi
- Cek apakah user dengan role `CS` tidak bisa masuk area dashboard
- Cek apakah role non-CS tidak bisa masuk area CS

## Prioritas perbaikan
- Prioritas sangat tinggi, karena bug ini mempengaruhi stabilitas session secara global.
- Fix harus dilakukan di shared auth layer sebelum melanjutkan validasi UX halaman protected yang lain.
