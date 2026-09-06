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
