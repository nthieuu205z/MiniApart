# Task 1 Report — FR-INV-10 Mã QR chuyển khoản

## Implementation summary

- Added ZXing `core` and `javase` 3.5.3 to `backend/build.gradle` before adding production QR code.
- Added `GET /api/toa-nha/{toaNhaId}/ky-thanh-toan/{kyId}/hoa-don/{hoaDonId}/ma-qr-chuyen-khoan`, documented with `FR-INV-10`, returning an on-demand `image/png` QR code.
- The service authorizes only scoped owners/managers through `PhanQuyenToaService`, reads the selected invoice joined to its own building, calculates `tong_tien - da_thu` with `BigDecimal`, and encodes account, outstanding amount, and invoice code.
- Fully paid or overpaid invoices return HTTP 409 with a clear Vietnamese reason. No migration, image persistence, cache, or floating-point money was added.

## TDD RED

Command:

```text
cd backend && ./gradlew test --tests com.prj1.ccm.billing.MaQrChuyenKhoanIntegrationTest
```

Relevant output before production implementation:

```text
MaQrChuyenKhoanIntegrationTest > FR_INV_10_systemAdminAndOutOfScopeManagerReceive403() FAILED
MaQrChuyenKhoanIntegrationTest > FR_INV_10_refusesQrWhenInvoiceIsPaidInFullWithClearReason() FAILED
MaQrChuyenKhoanIntegrationTest > FR_INV_10_decodesBuildingAccountOutstandingAmountAndInvoiceCodeFromGeneratedQr() FAILED
3 tests completed, 3 failed
BUILD FAILED
```

The absent route returned 404 where the focused test expected the specified endpoint behavior.

## GREEN

Command:

```text
cd backend && ./gradlew test --tests com.prj1.ccm.billing.MaQrChuyenKhoanIntegrationTest
```

Output:

```text
BUILD SUCCESSFUL in 7s
4 actionable tasks: 2 executed, 2 up-to-date
```

The three focused tests decode the generated PNG payload and assert Toà B's account `9704000000000202`, the outstanding `BigDecimal` amount `888000.00`, and invoice code `TN-B-201-202608`; they also cover paid-in-full 409 and QTHT/out-of-scope manager 403.

## Final tests

```text
cd backend && ./gradlew test
BUILD SUCCESSFUL in 845ms
4 actionable tasks: 4 up-to-date
```

The preceding clean full run generated 50 JUnit XML result files, each reporting zero failures and zero errors.

## Files changed

- `backend/build.gradle`
- `backend/src/main/java/com/prj1/ccm/billing/HoaDonController.java`
- `backend/src/main/java/com/prj1/ccm/billing/MaQrChuyenKhoanRepository.java`
- `backend/src/main/java/com/prj1/ccm/billing/MaQrChuyenKhoanService.java`
- `backend/src/test/java/com/prj1/ccm/billing/MaQrChuyenKhoanIntegrationTest.java`
- `.scratch/slice-05-thanh-toan-cong-no/issues/06-ma-qr-chuyen-khoan.md`

## Self-review findings

- Confirmed the repository joins `TOA_NHA` through the invoice's contract and room, preventing a different building account from entering the payload.
- Confirmed `BigDecimal.subtract` and `toPlainString` are the only amount derivation/formatting path; no `double`, `float`, `Double`, or `Float` was introduced.
- Confirmed QR bytes are returned directly and no Flyway migration, column, table, or stored image was added.
- Confirmed endpoint Javadoc includes `FR-INV-10`, and test names include `FR_INV_10`.
- Confirmed `git diff --check` has no whitespace errors.

## Concerns

None. An initial full-suite attempt ended with Gradle `EOFException` after two overlapping Gradle clients remained active from a command-window interruption. Stopping those clients and rerunning one clean sequential suite yielded zero-failure XML results and a successful final Gradle verification.

## Fix Round 1 — amended contract evidence (2026-09-06)

### Implementation summary

- Replaced the arbitrary `account=...&amount=...&content=...` QR payload with a VietQR/NAPAS EMVCo TLV payload: format indicator, dynamic point-of-initiation, VietQR GUID, BIN/account/service data, VND currency, outstanding amount, invoice content, and CRC16-CCITT.
- Kept money as `BigDecimal`; the payload amount is derived as `HOA_DON.tong_tien - HOA_DON.da_thu` and formatted with `toPlainString()`.
- Added `V28__viet_qr_bank_identifier.sql`: required six-digit `ma_ngan_hang`, account constraint `1–19` digits, seeded BIN backfill, and legacy account normalization that removes the old `9704` prefix before separators.
- Building create/update/read now carries and validates both `ma_ngan_hang` and `tk_ngan_hang`.
- The authenticated FR-INV-10 endpoint issues a 900-second HMAC-SHA256 path-bound link. The JWT-exempt image route validates signature and expiry, checks the current invoice state, and regenerates PNG on demand without QR image/payload storage.

### TDD RED

Command run before the amended production implementation:

```text
cd backend && ./gradlew test --tests com.prj1.ccm.billing.MaQrChuyenKhoanIntegrationTest --tests com.prj1.ccm.toanha.DanhMucToaNhaIntegrationTest
```

Relevant output: the amended focused tests failed against the first-round implementation because the invoice endpoint still returned `image/png` directly instead of JSON containing a signed `url`; the VietQR/TLV assertions and signed-image flow therefore could not pass. This was the expected RED for the review changes.

### TDD GREEN / focused verification

Command:

```text
cd backend && ./gradlew test --rerun-tasks --tests com.prj1.ccm.billing.MaQrChuyenKhoanIntegrationTest --tests com.prj1.ccm.toanha.DanhMucToaNhaIntegrationTest
```

Output:

```text
BUILD SUCCESSFUL in 15s
4 actionable tasks: 4 executed
```

The selected suites exercise 5 QR tests and 7 building tests, including PNG decode back into TLV, BIN/account/amount/content checks, CRC, owner and manager success, overpaid/paid-in-full behavior, link tampering/expiry, 403 scope checks, configuration read/write/validation, regeneration, and no QR storage.

### Final tests

```text
cd backend && ./gradlew test --rerun-tasks
```

```text
BUILD SUCCESSFUL in 1m 30s
4 actionable tasks: 4 executed
50 JUnit XML suites; 371 tests, 0 failures, 0 errors, 0 skipped
```

### Files changed

- `backend/build.gradle` (ZXing dependency added before production QR code in the first task commit)
- `backend/src/main/resources/db/migration/V28__viet_qr_bank_identifier.sql`
- `backend/src/main/java/com/prj1/ccm/billing/{HoaDonController,MaQrChuyenKhoanRepository,MaQrChuyenKhoanService,LienKetMaQrChuyenKhoan,VietQrPayloadBuilder}.java`
- `backend/src/main/java/com/prj1/ccm/auth/AuthWebConfig.java`
- `backend/src/main/java/com/prj1/ccm/toanha/{ToaNha,ThongTinToaNha,YeuCauToaNha,ToaNhaRepository,DanhMucToaNhaService}.java`
- `backend/src/test/java/com/prj1/ccm/billing/MaQrChuyenKhoanIntegrationTest.java`, building integration tests, and affected `ToaNha` constructor fixtures
- `.scratch/slice-05-thanh-toan-cong-no/issues/06-ma-qr-chuyen-khoan.md`
- This report file

### Self-review findings

- Repository lookup follows the invoice contract → room → building join, so the QR cannot use another building’s account; the signed image regenerates from current database values.
- The payload is standard VietQR/NAPAS TLV with `A000000727`, `QRIBFTTA`, VND, and CRC16-CCITT; ZXing only renders the payload as PNG.
- HMAC input binds building, period, invoice, and expiry; the signed route is the only added JWT interceptor exclusion and rejects duplicate signed parameters.
- No QR table/column, image file, cache, `double`, `float`, `Double`, or `Float` was added. `git diff --check` is clean.

### Commits and concerns

- The first-round dependency/implementation is in `b57650d` (`feat(billing): add transfer QR for invoices`); the amended fix-round implementation is in `e1fc7df` (`fix(billing): deliver invoice QR as signed VietQR`). The report is committed in the follow-up documentation commit named in the final handoff.
- The approved amendment in `.scratch/slice-05-thanh-toan-cong-no/spec.md` was pre-existing user work and was intentionally left unstaged; no product or implementation concern remains.
