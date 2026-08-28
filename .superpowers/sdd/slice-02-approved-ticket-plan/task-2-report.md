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

## Round 1 reviewer fixes

### Finding 1 — real image decoding

Replaced the PNG-header/JPEG-marker check in `AnhDinhKemService` with the JDK `ImageReader` pipeline. The validator now discovers an image reader from the bytes, sets the reader to seek-forward-only mode, decodes the first image with `read(0)`, and accepts only PNG or JPEG reader formats. Unknown formats, missing readers, and decode exceptions return the existing exact 400 validation message. The upload size limit and storage behavior are unchanged.

TDD evidence: the test first changed its invalid fixture to a payload beginning with a valid-looking PNG signature followed by undecodable bytes. Against the previous implementation it failed with 201 instead of 400. After the decoder change it passes. The valid synthetic fixtures were generated through `ImageIO` so the stricter reader validates real decodable inputs.

### Finding 2 — signed-link query integrity

Added a 403 regression assertion that appends a second `hetHan` query parameter to an otherwise valid signed URL. The download controller now rejects duplicate `hetHan` or `chuKy` values before binding them, preventing ambiguous parameter parsing from bypassing the signed capability. Existing HMAC binding of attachment ID and expiry remains in place, as do the exact expiry and error behavior.

TDD evidence: the new duplicate-parameter test failed against the previous implementation with 200 instead of 403. After rejecting duplicate signed parameters it passes.

### Round 1 verification

- `./gradlew test --tests com.prj1.ccm.nguoithue.NguoiThueAnhGiayToIntegrationTest` — passed: 3 tests, 0 failures.
- `./gradlew test --rerun-tasks` — passed: 20 test classes, 93 tests, 0 failures and 0 errors.
- `git diff --check` — passed before staging the fix commit.
