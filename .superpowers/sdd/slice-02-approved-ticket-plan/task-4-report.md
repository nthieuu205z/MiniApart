# Task 4 Report — Tạo hợp đồng thuê

Date: August 28, 2026
Ticket: `04-hop-dong-thue.md`
Status: `DONE_WITH_CONCERNS`

## Implementation

Implemented a new `hopdong` backend slice with:

- Flyway migration `V12__rental_contracts.sql` creating `HOP_DONG` and `HOP_DONG_DICH_VU`
- `HopDongController` for:
  - `GET /api/hop-dong?toaNhaId=&trangThai=`
  - `POST /api/hop-dong`
  - `GET /api/hop-dong/{id}`
  - `POST /api/hop-dong/{id}/nhan-coc`
  - `POST /api/hop-dong/{id}/kich-hoat`
  - `POST /api/hop-dong/{id}/thanh-ly`
- `HopDongService` for validation, scope enforcement, action-based state transitions, and near-expiry query-time computation via `Clock`
- JDBC repository support for contract aggregates and applied-service rows
- Integration and authorization tests carrying `FR-TNT-04` and `CR-005`

Implementation rulings recorded explicitly:

- Preserved the approved ERD and did **not** add a per-contract payment-cycle column, per the carried-forward ruling in the task brief.
- Rejected caller-supplied `trangThai` by rejecting unknown payload keys in the controller, matching the repo’s existing JSON parsing convention.
- When `donGiaApDung` is omitted for an applied service, the implementation snapshots the currently effective fixed price as of `Clock` today. This was the minimal way to populate `HOP_DONG_DICH_VU` without inventing new schema.
- Activation (`/kich-hoat`) is blocked before `ngayBatDau`, because `HIEU_LUC` is defined as “đang thuê,” not merely “đã chuyển trạng thái”.

## Files

- `backend/src/main/resources/db/migration/V12__rental_contracts.sql`
- `backend/src/main/java/com/prj1/ccm/hopdong/HopDongController.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/HopDongRepository.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/HopDong.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/HopDongDichVu.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/TrangThaiHopDong.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/YeuCauHopDong.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/YeuCauHopDongDichVu.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/ThongTinHopDong.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/ThongTinHopDongDichVu.java`
- `backend/src/main/java/com/prj1/ccm/nguoithue/NguoiThueRepository.java`
- `backend/src/test/java/com/prj1/ccm/hopdong/HopDongIntegrationTest.java`
- `backend/src/test/java/com/prj1/ccm/hopdong/HopDongAuthorizationIntegrationTest.java`
- `.scratch/slice-02-nguoi-thue-hop-dong/issues/04-hop-dong-thue.md`

## TDD Evidence

### RED

Ran on August 28, 2026:

```text
./gradlew test --tests com.prj1.ccm.hopdong.HopDongIntegrationTest --tests com.prj1.ccm.hopdong.HopDongAuthorizationIntegrationTest
```

Observed failing results before production code existed:

- `HopDongIntegrationTest.FR_TNT_04_CR_005_taoHopDongLuuGiaTriHopDongVaDichVuApDungKhongNhanTrangThaiTuClient`
- `HopDongIntegrationTest.FR_TNT_04_CR_005_tuChoiHopDongCoNgayKetThucKhongSauNgayBatDau`
- `HopDongIntegrationTest.FR_TNT_04_CR_005_chuyenTrangThaiHopDongBangHanhDongThayViChoSuaTay`
- `HopDongIntegrationTest.FR_TNT_04_CR_005_danhSachSapHetHanTuDoiTheoClockKhongCanTacVuNen`
- `HopDongAuthorizationIntegrationTest.FR_TNT_04_CR_005_thoVaNguoiThueNhan403ChoTatCaHopDongEndpoints`
- `HopDongAuthorizationIntegrationTest.FR_TNT_04_CR_005_quanLyNhan403KhiVuotPhamViToaNhaDuocGan`

Initial RED reasons matched “feature missing”:

- Contract endpoints returned `404` instead of the expected success/`403`
- Contract-specific schema/behavior did not exist yet

### GREEN

Focused GREEN rerun on August 28, 2026:

```text
./gradlew test --tests com.prj1.ccm.hopdong.HopDongIntegrationTest --tests com.prj1.ccm.hopdong.HopDongAuthorizationIntegrationTest
BUILD SUCCESSFUL in 12s
```

Full backend verification on August 28, 2026:

```text
./gradlew test
BUILD SUCCESSFUL in 56s
```

## Tests And Output

- Focused contract suite: `6 tests completed, 0 failed`
- Full backend suite: `BUILD SUCCESSFUL`

Key behaviors covered:

- Create contract with applied services and default status `CHO_KY`
- Reject caller-supplied status
- Reject invalid end-date ordering
- Transition state only through action endpoints
- Return `403` for wrong roles and out-of-scope building access
- Recompute `sapHetHan` from `Clock` without any background task

## Self-Review

Checked the final diff against the approved ticket and repo conventions:

- Naming follows the Vietnamese domain names already present in diagrams and code (`HopDong`, `TrangThaiHopDong`)
- Money values stay in `NUMERIC(15,2)` and are serialized back as two-decimal strings
- Controller Javadocs carry `FR-TNT-04`, `CR-005`, and `CR-012`
- Tests carry `FR-TNT-04` and `CR-005`
- Authorization coverage includes wrong-role `403` checks for every exposed contract endpoint
- No existing Flyway migration was modified; the next version `V12` was added

No correctness issue was found in self-review that would block commit, but the concerns below remain explicit scope boundaries.

## Concerns

1. The ticket brief required carrying forward the ruling that no per-contract payment-cycle column should be invented. This implementation preserves that ruling, but the API therefore does not expose a new contract-level payment-cycle field even though the original wording mentions one.
2. `HOP_DONG_DICH_VU` stores one resolved `don_gia_ap_dung` value per service row. That fits fixed-price services cleanly; tiered services may need a later design decision if billing must snapshot more than one scalar price.
3. This ticket does not recompute `PHONG.trang_thai` from contract actions. I left that out intentionally to avoid silently expanding scope beyond the approved ticket.
4. BR-10 room-date overlap protection was not added because it was not listed in the approved acceptance bullets for this task. If the team wants it enforced at contract creation time in Slice 02, it should be added as explicit accepted scope first or handled in a follow-up ticket.

## Fix Round 1 — Empty Applied-Service List

Date: August 28, 2026

Review issue addressed:

- Removed the unapproved restriction that rejected a valid contract when `dichVuApDung` was an empty array.

Changed files:

- `backend/src/test/java/com/prj1/ccm/hopdong/HopDongIntegrationTest.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`

What changed:

- Added a focused `FR-TNT-04` / `CR-005` integration test proving a valid contract can be created with `dichVuApDung: []`.
- Relaxed `HopDongService.chuanHoa(...)` so `dichVuApDung` must still be present and array-shaped, but may be empty.
- Kept the rest of the payload validation unchanged:
  - `dichVuApDung == null` is still rejected
  - duplicate service ids are still rejected
  - non-existent services are still rejected
  - cross-building service checks are still enforced

TDD evidence:

RED command run first on August 28, 2026:

```text
./gradlew test --tests com.prj1.ccm.hopdong.HopDongIntegrationTest.FR_TNT_04_CR_005_taoHopDongHopLeVoiDanhSachDichVuApDungRong
```

Observed RED output:

```text
HopDongIntegrationTest > FR_TNT_04_CR_005_taoHopDongHopLeVoiDanhSachDichVuApDungRong() FAILED
1 test completed, 1 failed
BUILD FAILED in 8s
```

The failure was expected because the existing service still rejected `yeuCau.dichVuApDung().isEmpty()`.

GREEN and covering verification commands run on August 28, 2026:

```text
./gradlew test --tests com.prj1.ccm.hopdong.HopDongIntegrationTest.FR_TNT_04_CR_005_taoHopDongHopLeVoiDanhSachDichVuApDungRong
./gradlew test --tests com.prj1.ccm.hopdong.HopDongIntegrationTest --tests com.prj1.ccm.hopdong.HopDongAuthorizationIntegrationTest
./gradlew test
```

Observed GREEN output:

```text
./gradlew test --tests com.prj1.ccm.hopdong.HopDongIntegrationTest.FR_TNT_04_CR_005_taoHopDongHopLeVoiDanhSachDichVuApDungRong
BUILD SUCCESSFUL in 5s

./gradlew test --tests com.prj1.ccm.hopdong.HopDongIntegrationTest --tests com.prj1.ccm.hopdong.HopDongAuthorizationIntegrationTest
BUILD SUCCESSFUL in 7s

./gradlew test
BUILD SUCCESSFUL in 44s
```

Covering tests:

- `HopDongIntegrationTest.FR_TNT_04_CR_005_taoHopDongHopLeVoiDanhSachDichVuApDungRong`
- Entire `HopDongIntegrationTest`
- Entire `HopDongAuthorizationIntegrationTest`
- Full backend suite via `./gradlew test`
