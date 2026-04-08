buatkan rencana teknis yang komprehensif untuk membangun backend dari aplikasi ini dengan schema yang sudah ada menggunakan sqlite, drizzle-orm, drizzle-zod, zod, typescript yang ketat. dan separation of concern seperti dibahah ini.

gunakan kode sintak terbaru dari nuxt official doc v4.4.2.


| Layer      | Tanggung Jawab                   | Tidak Boleh                   | Folder                               |
| ---------- | -------------------------------- | ----------------------------- | ------------------------------------ |
| API Route  | HTTP, Auth, Validasi input dasar | Business logic, Query DB      | server/api/\*                        |
| Service    | Business logic, Koordinasi       | Query DB langsung, HTTP stuff | server/services/\*.service.ts        |
| Repository | CRUD database                    | Business logic, Auth          | server/repositories/\*.repository.ts |

output menjadi task-backend.md yang bisa dijadikan panduan utama oleh developer junior atau model ai lain yang lebih murah.