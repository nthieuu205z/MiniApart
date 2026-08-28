# Task 2 report — Ảnh giấy tờ qua liên kết ký hạn

## Scope delivered

- Added Flyway `V10__attachment_images.sql`; it creates the canonical generic `ANH_DINH_KEM` table required by the approved ruling. The table uses the polymorphic owner identity `(doi_tuong_loai, doi_tuong_id)`, stores only `khoa_luu_tru` (never a browser URL), and supports multiple attachments for an owner.
- Added tenant document upload at `POST /api/nguoi-thue/{nguoiThueId}/anh`. Uploaded bytes are limited to 5 MB and accepted only where their contents identify a PNG or JPEG. The source filename and supplied MIME type are not trusted. UUID-derived storage keys are written below `app.anh.storage-root`, whose default is `/var/lib/miniapart/private-attachments` in the backend container.
- Added an authorized signed-link issuer at `GET /api/anh/{anhId}/lien-ket` plus the checked download route `GET /api/anh/{anhId}/xem`. The HMAC binds image ID and Unix-second expiry; the configured TTL is exactly 900 seconds (15 minutes). Expired and invalid signatures return 403 with `Liên kết ảnh không hợp lệ hoặc đã hết hạn`.
- Preserved Task 1 authorization: `QTHT`, `CHU`, and `QUAN_LY` may upload and issue links; `THO` and `NGUOI_THUE` receive 403. The download route alone is unauthenticated because it independently verifies the signed capability, and no Nginx location exposes the storage directory.

## TDD evidence

1. The inherited `NguoiThueAnhGiayToIntegrationTest` first failed because its test clock duplicated the production `authClock` bean. The test-only bean was renamed while remaining primary, allowing the intended RED state to run.
2. The corrected RED run failed because the upload endpoint did not exist and `ANH_DINH_KEM` was missing.
3. After the minimal production implementation, a fixture-isolation failure showed two prior attachments remained in the generic table. The test was repaired to clear `ANH_DINH_KEM` before each case; this preserves the test’s assertion that invalid uploads create no attachment.
4. The focused Task 2 test then passed, followed by the complete backend suite.

## Verification

- `./gradlew test --tests com.prj1.ccm.nguoithue.NguoiThueAnhGiayToIntegrationTest` — passed: 3 tests.
- `./gradlew test` — passed: complete backend suite.
- `git diff --check` — passed.
- Manual configuration review: no Nginx location maps the configured private attachment storage root, and no `duong_dan` storage field was introduced.

## Deliberate boundaries

- No frontend, `Doc/`, account-linking, contract, occupant, or room-status changes.
- V1–V9 migrations remain untouched.
- The generic schema permits the future `CHI_SO_DICH_VU` and `YEU_CAU_SUA_CHUA` attachment owners without a second storage/signing implementation.
