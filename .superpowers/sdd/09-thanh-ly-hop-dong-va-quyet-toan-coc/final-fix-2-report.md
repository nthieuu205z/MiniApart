# Ticket 09 final fix round 2 report

Baseline: `408ababf93c926afbd9a6cf7bd71729ee088fe7a`

## Changes

- Added direct BR-06 coverage for a contract beginning on 2026-09-10 and ending on 2026-09-20. The final-rent calculator returns 10 days while retaining the period denominator and fixed-fee behavior.
- Bound settlement-invoice payments to both the requested contract and invoice before delegating to the existing payment path.
- Added an integration regression proving an authorized manager receives 404, without ledger or invoice-balance mutation, when a settlement invoice from Contract A is presented through Contract B in the same building.

## TDD evidence

- Fix A baseline result: the new direct calculator regression was unexpectedly green at the requested baseline. `QuyTacThanhLyHopDong` already returns 10 for 2026-09-10 through 2026-09-20, capped by the contract end; no speculative production change was made.
- Fix B red: the new integration regression failed at the requested baseline because the endpoint returned 201 instead of 404.
- Fix B green: after the contract-scoped settlement-invoice lookup was added after building authorization, the same regression passed.

## Verification

- Focused calculator and settlement integration classes: `./gradlew test --tests 'com.prj1.ccm.billing.calc.QuyTacThanhLyHopDongTest' --tests 'com.prj1.ccm.hopdong.ThanhLyHopDongIntegrationTest' --max-workers=1 --console=plain` — BUILD SUCCESSFUL in 2m 1s.
- Full backend suite: `./gradlew clean test --max-workers=1 --console=plain` — BUILD SUCCESSFUL in 10m 54s.
- `git diff --check` — clean.

## Scope and concern

- No migration or frontend file changed.
- Fix A's claim that the calculator omits the move-in day conflicts with the baseline behavior: it already returns the requested 10-day result. Separately, `billing.calc.HopDong.soNgayOTrongKy` adds one day for a mid-period start, so it returns 11 for the same 2026-09-10 to 2026-09-20 case. Aligning those two rules requires a clarified BR-06 decision and was not changed in this focused follow-up.
