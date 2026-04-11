**H-BE6. `settingsService` pakai `useStorage('data')` — Nitro unstorage tanpa persistence guarantee**
- **File**: `server/services/settings.service.ts`
- **Detail**: Settings disimpan di Nitro's `useStorage('data')` yang default ke memory storage. Artinya settings hilang setiap kali server restart.
- **Impact**: Admin mengubah settings → server restart (deploy, crash) → settings kembali ke default.
- **Fix**: Migrate ke database table `app_settings`


buatkan prompt template task card  yang ringkas namun efektif seperi contoh di @cara-prompt.md untuk memperbaiki issue di @ref-prompt.md dan buat agar bisa di delegasikan ke model ai murah.
jika task nya sedikit, gabungkan menjadi 1 task card saja. jika banyak pisahkan menjadi beberapa task card. 
buatkan output di @prompt.md

