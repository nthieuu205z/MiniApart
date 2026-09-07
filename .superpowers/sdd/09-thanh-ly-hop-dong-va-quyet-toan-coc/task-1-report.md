# Ticket 09 implementation report

## Changed files

- `V30__settlement_invoices.sql` makes `HOA_DON.ky_id` nullable and replaces the table constraint with a partial unique index for ordinary invoices.
- Contract, billing, deposit, payment, and period services implement final invoice creation, BR-07 settlement, settlement invoice payment, and audit.
- `ThanhLyHopDongIntegrationTest` covers RED-to-GREEN final invoice/refund, negative settlement/payment/retry conflict, deduction validation, audit, and authorization cases.

## Design

Settlement invoices use `ky_id = NULL`; ordinary invoices retain uniqueness through `WHERE ky_id IS NOT NULL`. The final ordinary invoice is created and published with the existing `TinhHoaDonService` / repository calculation path. Negative BR-07 results create an issued `QT-...` invoice, which calls the existing `ThanhToanService` rather than inserting payments directly.

## TDD evidence

RED: `./gradlew test --tests com.prj1.ccm.hopdong.ThanhLyHopDongIntegrationTest` initially failed with missing final-invoice/refund behavior.

GREEN: the same command completed `BUILD SUCCESSFUL` with 4 tests after implementation.

## Authorization and audit

The contract entry point preserves role/building authorization through `PhanQuyenToaService`; integration tests assert 403 for QTHT and an out-of-scope manager. `THANH_LY_HOP_DONG` is written with actor and before/after status; payment retains its existing audit path.

## Concerns

The full suite was started twice but did not complete within the available bounded command window; only the focused integration suite has fresh successful output. Final meter values must be recorded in the open payment period before settlement because the approved endpoint request contains no meter inputs.

## Commit

Implementation commit: `6324113b408d8e9a436f6c137867353b34bd750d`.

## Review round 1 fixes

Changed files: `YeuCauThanhLy`, `HopDongService`, `TaoHoaDonHangLoatService`, `GiaoDichCocService`, `ThongTinQuyetToan`, and `ThanhLyHopDongIntegrationTest`.

The settlement request now accepts `chiSoCuoi` entries and writes them via `ChiSoDichVuService` in the open period before invoking the existing final-invoice calculator. The settlement audit now includes final invoice id/amount, collected deposit, debt, deduction, refund, and settlement invoice id. Deduction validation now rejects scale/precision violations as HTTP 400 before scale normalization.

Focused verification: `./gradlew test --tests com.prj1.ccm.hopdong.ThanhLyHopDongIntegrationTest` completed `BUILD SUCCESSFUL` (6 tests). `./gradlew clean test` was launched in the background for full verification; its result was not available at the time this report update was written.

## Review round 2 fixes

Changed files: `GiaoDichCocRepository`, `GiaoDichCocService`, `ThanhLyHopDongIntegrationTest`, `HopDongIntegrationTest`, and `PhongTrangThaiDemIntegrationTest`.

The three stale contract/room-status fixtures now create an open 2040 payment period and reset invoice/payment/deposit state before exercising the approved final-invoice settlement flow. Regression coverage now verifies ordinary invoice uniqueness versus nullable settlement invoices, rollback leaves the contract active and leaves no invoice after invalid deduction money, zero settlement creates no refund or settlement invoice, and both positive and negative audit records contain actor, final invoice id/amount, collected deposit, debt, deduction, refund, and settlement-invoice outcome.

Commands and results:

- `./gradlew test --tests com.prj1.ccm.hopdong.ThanhLyHopDongIntegrationTest` — `BUILD SUCCESSFUL` (7 tests).
- `./gradlew test --tests com.prj1.ccm.hopdong.HopDongIntegrationTest.FR_TNT_04_CR_005_chuyenTrangThaiHopDongBangHanhDongThayViChoSuaTay --tests com.prj1.ccm.hopdong.HopDongIntegrationTest.FR_TNT_05_CR_001_choPhepHopDongMoiKhiHopDongCuDaThanhLy --tests com.prj1.ccm.toanha.PhongTrangThaiDemIntegrationTest.FR_BLD_04_CR_012_hanhDongHopDongCapNhatNgayTrangThaiDemChoPhongVaDanhSachPhong` — `BUILD SUCCESSFUL` (3 selected tests).
- `./gradlew clean test` — reached `:test` but failed while finalizing Gradle binary results with `NoSuchFileException: .../build/test-results/test/binary/in-progress-results-generic.bin`; no test XML was produced.
- `./gradlew clean test --max-workers=1 --console=plain` — `BUILD SUCCESSFUL` (2m23s; all backend tests).

The default parallel full command has a Gradle/Test task result-file race in this environment; the same clean full suite passes single-worker.
