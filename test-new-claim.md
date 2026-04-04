# Test Plan: CS Create Claim (`/cs/claims/create`)

> **Module:** Customer Service — New RMA Claim Creation  
> **Page:** `/cs/claims/create`  
> **Wizard Steps:** 1. Info & Defect → 2. Evidence Upload → 3. Review  
> **Last Updated:** 2026-04-03

---

## Reference Data (Mock)

| Code | Notification Code | Status | Vendor | Model | Branch |
|------|------------------|--------|--------|-------|--------|
| — | `1000392` | *(not in DB)* | — | — | — |
| 3 | `NTF-2026003` | **NEW** | SDP (id:3) | 4T-C50FJ1I (50") | MEDAN |
| 2 | `NTF-2026002` | **USED** | MTC (id:2) | 4T-C55HJ6000I (55") | SURABAYA |
| 5 | `NTF-2025005` | **EXPIRED** | MTC (id:2) | 2T-C-42FD1I (42") | MAKASSAR |
| 1 | `NTF-2026001` | **NEW** | MOKA (id:1) | 4T-C43HJ6000I (43") | JAKARTA |

### Vendor Photo/Field Rules

| Vendor | Required Photos | Required ODF Fields |
|--------|----------------|---------------------|
| **MOKA** | CLAIM, CLAIM_ZOOM, PANEL_SN, ODF, WO_PANEL, WO_PANEL_SN | odfNumber, version, week |
| **MTC** | CLAIM, CLAIM_ZOOM, PANEL_SN, ODF | *(none)* |
| **SDP** | CLAIM, CLAIM_ZOOM, PANEL_SN, ODF | *(none)* |

---

## Section 1 — Page Load & Header

### TC-1.1: Direct navigation to create page

| Field | Value |
|-------|-------|
| **Precondition** | User is logged in as CS role |
| **Steps** | 1. Navigate to `/cs/claims/create` |
| **Expected** | Page loads with header "NEW RMA CLAIM CREATION". Stepper shows 3 steps: "Info & Defect", "Evidence", "Review". Current step = 1. Step 1 content is visible. Notification input is empty and focused. |
| result | OK |

### TC-1.2: Navigation with query param `?notification=NTF-2026003`

| Field | Value |
|-------|-------|
| **Precondition** | Notification `NTF-2026003` exists in database with status NEW |
| **Steps** | 1. Navigate to `/cs/claims/create?notification=NTF-2026003` |
| **Expected** | Page loads. Notification input is pre-filled with `NTF-2026003`. Auto-lookup is triggered on mount. Success banner appears: "Notifikasi ditemukan! Data produk terisi otomatis." Product Model = `4T-C50FJ1I`, Inch = `50`, Branch = `MEDAN`, Vendor = `SDP`. Status badge shows **NEW** (green). Auto-filled fields are disabled. |
| result | Pass |

### TC-1.3: Navigation with query param for non-existent code

| Field | Value |
|-------|-------|
| **Precondition** | Code `1000392` does not exist in database |
| **Steps** | 1. Navigate to `/cs/claims/create?notification=1000392` |
| **Expected** | Page loads. Notification input is pre-filled with `1000392`. Auto-lookup is triggered. Warning banner appears: `Notifikasi "1000392" tidak ditemukan. Anda tetap bisa melanjutkan input manual.` All form fields remain editable (not disabled). No status badge shown. |
| result | Pass |

### TC-1.4: Autosave indicator on form change

| Field | Value |
|-------|-------|
| **Precondition** | On create page, Step 1 |
| **Steps** | 1. Type any value in Panel Part Number field |
| **Expected** | After ~1.5s delay, autosave indicator appears with "Saving draft…" + spinner. After ~0.8s, changes to "Draft saved" with save icon (green). After ~3s, indicator fades away. |
| result | Pass |

### TC-1.5: Navigation with query param `?notification=NTF-2026002`

| Field | Value |
|-------|-------|
| **Precondition** | Notification `NTF-2026002` exists in database with status USED |
| **Steps** | 1. Navigate to `/cs/`. 2. isi field hero notifikasi dengan `NTF-2026002`. 3. Klik tombol 'Ambil Data' (or press Enter) |
| **Expected** | Page loads. muncul toast error 'Gagal Memproses' Notification `NTF-2026002` memiliki status USED. Hanya statusNEW yang dapat diproses. toast error hilang setelah 3 detik |
| result | Pass |

### TC-1.6: Navigation with query param `?notification=NTF-2026005`

| Field | Value |
|-------|-------|
| **Precondition** | Notification `NTF-2026005` exists in database with status EXPIRED |
| **Steps** | 1. Navigate to `/cs/`. 2. isi field hero notifikasi dengan `NTF-2026005`. 3. Klik tombol 'Ambil Data' (or press Enter) |
| **Expected** | Page loads. muncul toast error 'Gagal Memproses' Notification `NTF-2026005` memiliki status EXPIRED. Hanya statusNEW yang dapat diproses. toast error hilang setelah 3 detik |
| result | OK |
---

## Section 2 — Notification Lookup (Step 1)

### TC-2.1: Lookup — code NOT in database (e.g. `1000392`)

| Field | Value |
|-------|-------|
| **Precondition** | On Step 1. Notification input is empty. |
| **Steps** | 1. Type `1000392` in notification code input. 2. Click VERIFY button (or press Enter). |
| **Expected** | Loading spinner appears on VERIFY button. After API response (404), amber warning banner appears: `Notifikasi "1000392" tidak ditemukan. Anda tetap bisa melanjutkan input manual.` No status badge is shown. All form fields remain editable. Defect options reset to default list (7 defects). Vendor fallback rules are used (no lookup override). |
| result | Pass |


### TC-2.2: Lookup — code in database with status NEW (e.g. `NTF-2026003`)

| Field | Value |
|-------|-------|
| **Precondition** | On Step 1. Notification input is empty. |
| **Steps** | 1. Type `NTF-2026003` in notification code input. 2. Click VERIFY. |
| **Expected** | Loading spinner on VERIFY button. Success banner: "Notifikasi ditemukan! Data produk terisi otomatis." Status badge shows **NEW** (green: `bg-[#B6F500]/20 text-[#B6F500]`). Auto-filled fields: Model = `4T-C50FJ1I`, Inch = `50`, Branch = `MEDAN`, Vendor = `SDP`. These fields become **disabled**. Notification code input becomes **disabled**. Defect dropdown shows API-provided defects. |
| result | Pass |


### TC-2.3: Lookup — code in database with status USED (e.g. `NTF-2026002`)

| Field | Value |
|-------|-------|
| **Precondition** | On Step 1. Notification input is empty. |
| **Steps** | 1. Type `NTF-2026002` in notification code input. 2. Click VERIFY. |
| **Expected** | Page loads. muncul toast error 'Gagal Memproses' Notification `NTF-2026002` memiliki status USED. Hanya status NEW yang dapat diproses. toast error hilang setelah 3 detik |
| result | Failed |

### TC-2.4: Lookup — code in database with status EXPIRED (e.g. `NTF-2025005`)

| Field | Value |
|-------|-------|
| **Precondition** | On Step 1. Notification input is empty. |
| **Steps** | 1. Type `NTF-2025005` in notification code input. 2. Click VERIFY. |
| **Expected** | Page loads. muncul toast error 'Gagal Memproses' Notification `NTF-2026005` memiliki status EXPIRED. Hanya status NEW yang dapat diproses. toast error hilang setelah 3 detik |
| result | Failed |

### TC-2.5: Lookup — MOKA vendor (e.g. `NTF-2026001`)

| Field | Value |
|-------|-------|
| **Precondition** | On Step 1. Notification input is empty. |
| **Steps** | 1. Type `NTF-2026001`. 2. Click VERIFY. |
| **Expected** | Vendor auto-fills to `MOKA`. ODF fields section appears ("Required ODF Data"): ODF Number, Version, and Week inputs are shown. These are all required for MOKA vendor. Photo requirements will show 6 photos (CLAIM, CLAIM_ZOOM, PANEL_SN, ODF, WO_PANEL, WO_PANEL_SN). |
| result | Pass |


### TC-2.6: Lookup — empty input, click VERIFY

| Field | Value |
|-------|-------|
| **Precondition** | Notification code input is empty. |
| **Steps** | 1. Click VERIFY button. |
| **Expected** | VERIFY button is **disabled** (class `disabled:bg-white/10 disabled:text-white/20`). No API call is made. Nothing happens. |
| result | Pass |

### TC-2.7: Lookup — press Enter in notification input

| Field | Value |
|-------|-------|
| **Precondition** | Notification code input has value `NTF-2026003`. |
| **Steps** | 1. Focus on notification input. 2. Press Enter key. |
| **Expected** | Same behavior as clicking VERIFY — triggers `handleLookup()`. Lookup completes successfully. |
| result | Pass |

### TC-2.8: Lookup — case insensitivity

| Field | Value |
|-------|-------|
| **Precondition** | On Step 1. |
| **Steps** | 1. Type `ntf-2026003` (lowercase). 2. Click VERIFY. |
| **Expected** | Lookup succeeds — API does case-insensitive comparison. Auto-fill proceeds normally. Notification code in form is replaced with the canonical code `NTF-2026003`. |
| result | Pass |


---

## Section 3 — Step 1: Info & Defect (Form Fields & Validation)

### TC-3.1: All required fields empty — attempt Continue

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. No lookup performed. All fields empty. |
| **Steps** | 1. Click "CONTINUE" button. |
| **Expected** | Navigation is **blocked** (stays on Step 1). `stepAttempted[1]` is set to `true`. Error summary banner appears: "6 field wajib belum diisi. Lengkapi sebelum melanjutkan." Inline red error messages appear below each required field: Notification Code, Product Model, Display Size, Branch, Vendor, Defect Type. Input borders turn red. Stepper step 1 shows error state (red). |
| result | Pass |


### TC-3.2: Fill all required fields — attempt Continue

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. |
| **Steps** | 1. Enter notification code manually (e.g. `TEST-001`). 2. Select product model from UInputMenu. 3. Enter inch value (e.g. `55`). 4. Select branch from USelectMenu. 5. Select vendor (e.g. `MTC`) from USelectMenu. 6. Select defect type from USelectMenu. 7. Click "CONTINUE". |
| **Expected** | Validation passes. Navigation proceeds to Step 2. Stepper updates: step 1 shows ✓ (valid), step 2 is active. |
| result | Pass |

### TC-3.3: Vendor = MOKA — ODF fields required

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. Vendor is set to "MOKA" (either via lookup or manual select). |
| **Steps** | 1. Fill all standard required fields. Leave ODF Number, Version, Week empty. 2. Click "CONTINUE". |
| **Expected** | Navigation **blocked**. Error summary shows 3 additional errors: "ODF number is required for this vendor", "ODF version is required for this vendor", "ODF week is required for this vendor". Inline errors appear below each ODF field. |
| result | Pass |

### TC-3.4: Vendor = MOKA — ODF fields filled

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. Vendor = MOKA. All standard required fields filled. |
| **Steps** | 1. Enter ODF Number (e.g. `ODF-123`). 2. Enter Version (e.g. `V2`). 3. Enter Week (e.g. `W12`). 4. Click "CONTINUE". |
| **Expected** | Validation passes. Navigation to Step 2. |
| result | Pass |

### TC-3.5: Vendor = MTC or SDP — no ODF fields shown

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. Vendor = MTC or SDP. |
| **Steps** | 1. Observe the Vendor Data sidebar. |
| **Expected** | "Required ODF Data" section is **not visible**. ODF fields are not required for validation. Only 6 standard fields required. |
| result | Pass |
`
### TC-3.6: Switch vendor from MOKA to MTC — ODF fields clear

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. Vendor = MOKA. ODF fields have values entered. |
| **Steps** | 1. Change vendor to `MTC`. |
| **Expected** | ODF section disappears. ODF Number, Version, Week values are cleared (`form.odfNumber = ''`, etc.). Values are not carried over. |
| result | Pass |

### TC-3.7: Product Model — search/autocomplete via UInputMenu

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. Not locked from lookup. |
| **Steps** | 1. Click the Product Model UInputMenu. 2. Start typing "4T-C55". |
| **Expected** | Dropdown shows matching options filtered by search text. Options: `4T-C55HJ6000I`, `4T-C55HL6500I`, `4T-C55FJ1I` (if applicable from frontend list). User can select from the filtered list. |
| result | Pass |



### TC-3.8: Optional fields — Panel Part Number and OC Serial Number

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. All required fields filled. |
| **Steps** | 1. Leave Panel Part Number and OC Serial Number empty. 2. Click "CONTINUE". |
| **Expected** | Validation passes — these fields are **not required**. Navigation proceeds to Step 2. |
| result | Pass |


### TC-3.9: Auto-populated fields disabled after lookup

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. Successful lookup for `NTF-2026003`. |
| **Steps** | 1. Try to edit Product Model field. 2. Try to edit Display Size field. 3. Try to edit Branch field. 4. Try to edit Vendor field. 5. Try to edit Notification Code field. |
| **Expected** | All 5 fields are **disabled** (`disabled` attribute set). User cannot modify auto-populated data. Panel Part Number and OC Serial Number remain editable. Defect Type remains editable. |
| result | Pass |


### TC-3.10: Inline error visibility — only after step attempted

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. Fresh page load, no actions taken. |
| **Steps** | 1. Observe all form fields. |
| **Expected** | No red borders, no error messages, no error summary banner visible. `stepAttempted[1]` is `false`. All fields have default white/10 borders. |
| result | Pass |


---

## Section 4 — Step 2: Evidence Upload

### TC-4.1: Photo requirements — vendor MTC

| Field | Value |
|-------|-------|
| **Precondition** | Step 2 reached with Vendor = MTC. |
| **Steps** | 1. Observe the photo upload grid. |
| **Expected** | 4 upload zones shown: "Main Claim Photo" (CLAIM), "Defect Zoom" (CLAIM_ZOOM), "Panel Part Number" (PANEL_SN), "ODF Document" (ODF). All marked as "Required". Progress shows `0 / 4`. |
| result | Pass |


### TC-4.2: Photo requirements — vendor MOKA

| Field | Value |
|-------|-------|
| **Precondition** | Step 2 reached with Vendor = MOKA. |
| **Steps** | 1. Observe the photo upload grid. |
| **Expected** | 6 upload zones shown: Main Claim Photo, Defect Zoom, Panel Part Number, ODF Document, Work Order Panel, Work Order Panel Part Number. All "Required". Progress shows `0 / 6`. |
| result | Pass |


### TC-4.3: Upload valid image file (click)

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. CLAIM upload zone is empty. |
| **Steps** | 1. Click the CLAIM upload zone. 2. Select a valid image file (e.g., `photo.jpg`, 2MB, type `image/jpeg`). |
| **Expected** | File dialog opens. After selection: upload zone changes to preview mode with the image displayed. File name and size shown below preview (e.g. `photo.jpg`, `2.00 MB`). Red delete button (trash icon) visible. Border changes to green (#B6F500). Progress counter increments (e.g. `1 / 4`). |
| result | Failed, saya tidak lihat File name and size shown below preview (e.g. `photo.jpg`, `2.00 MB`). Red delete button (trash icon) jika beri photo ukuran yang besar, tapi jika diberi photo yang tingginya lebih pendek, baru file name dan size dan delete button terlihat |


### TC-4.4: Upload file exceeding 5MB

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. Any empty upload zone. |
| **Steps** | 1. Click upload zone. 2. Select an image file larger than 5MB (e.g. 6MB). |
| **Expected** | File is **rejected**. Error message appears below the upload zone: "File terlalu besar (maks 5MB)". No preview is shown. Upload zone remains empty. File input is reset. |
| result | Pass |

### TC-4.5: Upload non-image file

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. Any empty upload zone. |
| **Steps** | 1. Click upload zone. 2. Select a non-image file (e.g. `document.pdf`). |
| **Expected** | File is **rejected**. Error message: "Hanya file gambar yang diperbolehkan". No preview. Upload zone stays empty. |
| result | Pass |


### TC-4.6: Upload valid image via drag-and-drop

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. Upload zone is empty. |
| **Steps** | 1. Drag a valid image file (< 5MB) over an empty upload zone. 2. Observe visual feedback. 3. Drop the file. |
| **Expected** | On drag over: border changes to green, zone scales slightly (`scale-[1.02]`). On drop: file is accepted, preview appears. Same behavior as click upload. |
| result | minor, border tidak berubah menjadi hijau saat drag over |

### TC-4.7: Drag-and-drop with invalid file (> 5MB)

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. Upload zone is empty. |
| **Steps** | 1. Drag a file > 5MB over upload zone. 2. Drop the file. |
| **Expected** | Error message: "File terlalu besar (maks 5MB)". File rejected. No preview. |
| result | Pass |


### TC-4.8: Remove uploaded photo

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. A photo has been uploaded to CLAIM zone. |
| **Steps** | 1. Click the red trash button on the CLAIM photo preview. |
| **Expected** | Photo is removed. Upload zone returns to empty/dropzone state with camera icon. Progress counter decrements. Preview URL is revoked (`URL.revokeObjectURL`). |
| result | pass |


### TC-4.9: Upload error clears on successful re-upload

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. Previous upload attempt showed error "File terlalu besar". |
| **Steps** | 1. Click the same upload zone again. 2. Select a valid image file (< 5MB). |
| **Expected** | Previous error message disappears. File is accepted. Preview appears normally. |
| result | pass |

### TC-4.10: All required photos missing — attempt Continue

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. Vendor = MTC. No photos uploaded (0/4). |
| **Steps** | 1. Click "CONTINUE". |
| **Expected** | Navigation **blocked** (stays on Step 2). `stepAttempted[2]` = true. Error summary: "4 foto wajib belum diunggah. Lengkapi sebelum melanjutkan." Each empty upload zone gets red dashed border and error text: e.g. "Main Claim Photo photo is required". Stepper step 2 shows error state. |
| result | pass |


### TC-4.11: Partial photos uploaded — attempt Continue

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. Vendor = MTC. Only CLAIM and PANEL_SN uploaded (2/4). |
| **Steps** | 1. Click "CONTINUE". |
| **Expected** | Navigation **blocked**. Error summary shows 2 remaining errors. Only the missing photo zones (CLAIM_ZOOM and ODF) show error state. Uploaded zones retain green border and preview. |
| result | pass |

### TC-4.12: All required photos uploaded — Continue to Step 3

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. Vendor = MTC. All 4 photos uploaded. Progress: `4 / 4`. |
| **Steps** | 1. Click "CONTINUE". |
| **Expected** | Validation passes. Navigation to Step 3 (Review). Stepper: step 2 shows ✓, step 3 is active. |
| result | pass |

### TC-4.13: Replace existing uploaded photo

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. Photo already uploaded in CLAIM zone. |
| **Steps** | 1. Remove existing photo (trash button). 2. Upload a different image file. |
| **Expected** | Old preview URL is revoked. New image shows in preview. File name/size reflect the new file. |
| result | pass |

---

## Section 5 — Step 3: Review & Submit

### TC-5.1: Review screen — all data displayed correctly

| Field | Value |
|-------|-------|
| **Precondition** | Step 3 reached after completing Steps 1 & 2 with: Notification = `NTF-2026003`, Vendor = SDP, all photos uploaded. |
| **Steps** | 1. Observe the review screen. |
| **Expected** | "Final Claim Summary" header with green (#B6F500) background. **Product & Defect section**: Notification = `NTF-2026003`, Model = `4T-C50FJ1I`, Size = `50 Inch`, Branch = `MEDAN`, Vendor = `SDP`, Defect = selected defect name. **Hardware Identification**: Panel Part Number and OC SN (or "NOT PROVIDED"). **Evidence Checklist**: All photo requirements listed with green ✓ + "ATTACHED" for uploaded photos. Certification checkbox visible at bottom. |
| result | pass |


### TC-5.2: Review screen — missing optional fields show "NOT PROVIDED"

| Field | Value |
|-------|-------|
| **Precondition** | Step 3. Panel Part Number and OC SN were left empty. |
| **Steps** | 1. Check Hardware Identification section. |
| **Expected** | Panel Part Number shows `NOT PROVIDED` in red-tinted text. OC SN shows `NOT PROVIDED` in red-tinted text. |
| result | pass |


### TC-5.3: Submit as SUBMITTED — all valid

| Field | Value |
|-------|-------|
| **Precondition** | Step 3. All required fields filled. All photos uploaded. No validation errors. |
| **Steps** | 1. Click "SUBMIT TO QRCC" button. |
| **Expected** | `submitClaim('SUBMITTED')` is called. No validation errors → submit proceeds. Toast notification appears: Title = "Claim Dikirim", Description = "Claim berhasil dikirim ke QRCC untuk review.", Color = success, Icon = send. Console logs the full form data. |

### TC-5.4: Submit as SUBMITTED — with validation errors

| Field | Value |
|-------|-------|
| **Precondition** | Step 3. Some required field on Step 1 was somehow cleared or was never filled (edge case — e.g. notification code manually cleared before navigating). |
| **Steps** | 1. Click "SUBMIT TO QRCC". |
| **Expected** | Submit is **blocked** (`hasErrors` is true). All steps marked as attempted (`stepAttempted[1,2,3]` = true). Automatically navigates to the first step that has errors. Inline errors become visible on that step. |

### TC-5.5: Save as DRAFT (from any step)

| Field | Value |
|-------|-------|
| **Precondition** | Any wizard step. Form partially filled. |
| **Steps** | 1. Click "SAVE AS DRAFT" button (visible on md+ screens). |
| **Expected** | `submitClaim('DRAFT')` is called. Draft is saved regardless of validation errors (no blocking). Toast notification: Title = "Draft Tersimpan", Description = "Claim berhasil disimpan sebagai draft.", Color = success, Icon = save. |

### TC-5.6: SAVE AS DRAFT button visibility on mobile

| Field | Value |
|-------|-------|
| **Precondition** | Any step. Mobile viewport (< md breakpoint). |
| **Steps** | 1. Observe the sticky footer action bar. |
| **Expected** | "SAVE AS DRAFT" button is **hidden** on mobile (`hidden md:flex`). Only BACK (if step > 1) and CONTINUE/SUBMIT buttons are visible. |

---

## Section 6 — Wizard Navigation & Stepper

### TC-6.1: Step 1 → Step 2 (Continue)

| Field | Value |
|-------|-------|
| **Precondition** | Step 1, all required fields valid. |
| **Steps** | 1. Click "CONTINUE" button. |
| **Expected** | `currentStep` becomes `2`. Step 2 content fades in (animation: `fade-in slide-in-from-bottom-4`). Stepper: step 1 shows ✓ checkmark (valid, not current), step 2 is active (green). BACK button now visible in footer. |

### TC-6.2: Step 2 → Step 1 (Back)

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. |
| **Steps** | 1. Click "BACK" button. |
| **Expected** | `currentStep` becomes `1`. Step 1 content appears. No validation triggered on back navigation. Previously entered data is preserved. Stepper: step 1 active. |

### TC-6.3: Step 2 → Step 3 (Continue)

| Field | Value |
|-------|-------|
| **Precondition** | Step 2, all required photos uploaded. |
| **Steps** | 1. Click "CONTINUE". |
| **Expected** | `currentStep` becomes `3`. Step 3 Review content appears. Footer changes: CONTINUE replaced by "SUBMIT TO QRCC" button. BACK button still visible. |

### TC-6.4: Step 3 → Step 2 (Back)

| Field | Value |
|-------|-------|
| **Precondition** | Step 3. |
| **Steps** | 1. Click "BACK". |
| **Expected** | Returns to Step 2. All uploaded photos still intact (previews still visible). Footer shows CONTINUE again. |

### TC-6.5: Step 1 — BACK button not visible

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. |
| **Steps** | 1. Observe footer action bar. |
| **Expected** | BACK button is **not rendered** (v-if="currentStep > 1" is false). Only SAVE AS DRAFT and CONTINUE visible. |

### TC-6.6: Step 3 — CONTINUE not visible, SUBMIT visible

| Field | Value |
|-------|-------|
| **Precondition** | Step 3. |
| **Steps** | 1. Observe footer action bar. |
| **Expected** | CONTINUE button is **not rendered** (v-if="currentStep < 3" is false). "SUBMIT TO QRCC" button is shown instead. Has glow effect on hover (`shadow-[0_0_30px_rgba(182,245,0,0.5)]`). |

### TC-6.7: Validation blocking prevents step skip

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. All fields empty. |
| **Steps** | 1. Click "CONTINUE" 3 times rapidly. |
| **Expected** | Stays on Step 1 after each click. Cannot skip to Step 2 or 3. Error summary increments/stays visible. `stepAttempted[1]` remains true. |

### TC-6.8: Stepper visual — error state

| Field | Value |
|-------|-------|
| **Precondition** | Step 1 attempted with errors. |
| **Steps** | 1. Observe stepper in header. |
| **Expected** | Step 1 indicator has red styling: `bg-red-500/20 text-red-400 border-red-500/40`. Label text is red. Connector lines remain white/5 for steps not yet reached. |

### TC-6.9: Stepper visual — valid (completed) state

| Field | Value |
|-------|-------|
| **Precondition** | Step 1 completed successfully. Now on Step 2. |
| **Steps** | 1. Observe stepper. |
| **Expected** | Step 1 shows ✓ checkmark SVG (not the number "1"). Green (#B6F500) background with shadow. Step 2 is active (green, number "2"). Connector between 1→2 is green. |

### TC-6.10: Stepper visual — default (not attempted) state

| Field | Value |
|-------|-------|
| **Precondition** | On Step 1. Steps 2 and 3 not yet reached. |
| **Steps** | 1. Observe stepper steps 2 and 3. |
| **Expected** | Steps 2 and 3 show numbers "2", "3" with muted styling: `bg-white/5 text-white/20`. Labels are `text-white/20`. Connectors are `bg-white/5`. |

---

## Section 7 — Vendor Context Sidebar

### TC-7.1: Info tip banner visibility

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. |
| **Steps** | 1. Scroll to bottom of Step 1 content. |
| **Expected** | Green info banner visible: "Pastikan semua data sesuai dengan foto yang dilampirkan untuk menghindari penolakan oleh Verifikator." With AlertCircle icon. |

### TC-7.2: Vendor select — manual selection without lookup

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. No lookup performed. |
| **Steps** | 1. Click vendor USelectMenu. 2. Select "MOKA". |
| **Expected** | Vendor is set to MOKA. Fallback rules are used: Photo requirements update to 6 photos (CLAIM, CLAIM_ZOOM, PANEL_SN, ODF, WO_PANEL, WO_PANEL_SN — from fallback). ODF fields appear with `odfNumber`, `version`, `week` required. |

### TC-7.3: Vendor select — disabled after lookup

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. Successful lookup performed (e.g. `NTF-2026003`). |
| **Steps** | 1. Try to change vendor via USelectMenu. |
| **Expected** | Vendor dropdown is **disabled**. Cannot change vendor. Value locked to lookup result (SDP). |

---

## Section 8 — Edge Cases & Regression

### TC-8.1: Number input — spinner buttons hidden

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. Display Size (inch) input visible. |
| **Steps** | 1. Focus on the inch input. |
| **Expected** | Browser native number spinner (up/down arrows) is **hidden** via CSS (`-webkit-appearance: none`). |

### TC-8.2: Page animation on step change

| Field | Value |
|-------|-------|
| **Precondition** | Any step transition. |
| **Steps** | 1. Navigate between steps. |
| **Expected** | Content enters with animation: `animate-in fade-in slide-in-from-bottom-4 duration-500`. Smooth transition, no content flash. |

### TC-8.3: Autosave triggered on photo change

| Field | Value |
|-------|-------|
| **Precondition** | Step 2. |
| **Steps** | 1. Upload a photo. |
| **Expected** | Autosave indicator appears after 1.5s debounce, same as form changes. |

### TC-8.4: Memory cleanup — preview URLs on unmount

| Field | Value |
|-------|-------|
| **Precondition** | Photos have been uploaded (preview URLs created via `URL.createObjectURL`). |
| **Steps** | 1. Navigate away from the create page entirely. |
| **Expected** | `onUnmounted` hook calls `URL.revokeObjectURL` for each preview URL. No memory leak from blob URLs. |

### TC-8.5: Concurrent fast clicks on CONTINUE

| Field | Value |
|-------|-------|
| **Precondition** | Step 1, all fields valid. |
| **Steps** | 1. Double-click "CONTINUE" rapidly. |
| **Expected** | Steps advance to 2, then validation runs on Step 2. Does not skip to Step 3 unless Step 2 also passes validation (unlikely since photos aren't uploaded). No crash or visual glitch. |

### TC-8.6: Submit DRAFT with empty form

| Field | Value |
|-------|-------|
| **Precondition** | Step 1. All fields completely empty. |
| **Steps** | 1. Click "SAVE AS DRAFT". |
| **Expected** | Draft saves successfully (no validation blocking for DRAFT). Toast: "Draft Tersimpan". Console logs the empty form data. |

---

## Test Matrix Summary

| Section | Total TCs | Positive | Negative |
|---------|----------|----------|----------|
| 1. Page Load & Header | 6 | 5 | 1 |
| 2. Notification Lookup | 8 | 5 | 3 |
| 3. Step 1 Form Validation | 10 | 5 | 5 |
| 4. Step 2 Photo Upload | 13 | 6 | 7 |
| 5. Step 3 Review & Submit | 6 | 3 | 3 |
| 6. Wizard Navigation & Stepper | 10 | 7 | 3 |
| 7. Vendor Context Sidebar | 3 | 2 | 1 |
| 8. Edge Cases & Regression | 6 | 4 | 2 |
| **TOTAL** | **60** | **35** | **25** |
