**H-BE3. `report.repo.ts` terlalu besar (492 lines) dan berisi business logic**
- **File**: `server/repositories/report.repo.ts`
- **Detail**: Report repo melakukan business logic computations (approval rate calculation, lead time aggregation, aging bucket classification, acceptance rate) yang seharusnya di service layer. `reportService.ts` (40 lines) hanya proxy call ke repo tanpa value-add.
- **Impact**: Melanggar layered architecture — repo seharusnya hanya data access. Testing repo berarti testing business logic + SQL sekaligus.
- **Fix**: Pindahkan computations (approval rate, lead time, aging buckets) ke `reportService.ts`. Repo hanya return raw data.

buatkan prompt template task card  yang ringkas namun efektif seperi contoh di @cara-prompt.md untuk memperbaiki issue di @ref-prompt.md dan buat agar bisa di delegasikan ke model ai murah.
jika task nya sedikit, gabungkan menjadi 1 task card saja. jika banyak pisahkan menjadi beberapa task card. 
buatkan output di @prompt.md

