## 2. Shared Utils & Types

### 2.1 `shared/types/database.ts` (253 baris)

**ISSUE — CRITICAL: Transaction table types TIDAK ADA**
- `Claim`, `ClaimPhoto`, `ClaimHistory`, `VendorClaim`, `VendorClaimItem`, `PhotoReview`, `SequenceGenerator` — **tidak ada inferred types** meskipun ini adalah core entities.
- Ini berarti service/repository layer untuk claim dan vendor-claim kemungkinan menggunakan `any` atau inline types.

**ISSUE — MEDIUM: Union types terlalu sempit**
- `StatusTable` hanya mencakup `NotificationMaster`, padahal `Claim` dan `VendorClaim` juga punya status fields.
- `SoftDeleteTable` union tidak mencakup transaction tables.

**ISSUE — LOW: Leaky abstraction**
- `export * from '../utils/constants'` di akhir file — artinya `import { ... } from 'shared/types/database'` juga membawa semua constants. Sebaiknya dipisah.

### 2.2 `shared/utils/constants.ts` (187 baris)

**ISSUE — MEDIUM: Hardcoded password di source code**
- `DEFAULT_INITIAL_PASSWORD = 'sharp1234'` — sebaiknya di-drive via environment variable untuk seed scripts.

buatkan prompt template task card seperi contoh di @cara-prompt untuk memperbaiki issue ini dan buat agar bisa di delegasikan ke model ai murah.
buatkan output di @prompt.md