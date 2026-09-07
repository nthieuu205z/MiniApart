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
