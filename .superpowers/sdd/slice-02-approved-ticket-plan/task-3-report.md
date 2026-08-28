# Task 3 Report: Nối tài khoản đăng nhập với người thuê

## Status

DONE

## Scope Implemented

- Added Flyway migration `V11__link_account_to_tenant.sql`.
- Added nullable `NGUOI_DUNG.nguoi_thue_id`.
- Added real database foreign key `fk_nguoi_dung_nguoi_thue` to `NGUOI_THUE(id)`.
- Added real database unique constraint `uk_nguoi_dung_nguoi_thue`.
- Extended account-management create/update payload parsing with `nguoiThueId`.
- Extended account-management response with `nguoiThueId` for linked tenant accounts.
- Enforced the application-boundary invariant: role `NGUOI_THUE` requires a real `nguoiThueId`.
- Preserved `NULL` for non-tenant roles.
- Returned client errors for nonexistent tenant links and duplicate tenant links without exposing database internals.
- Carried `nguoiThueId` through authenticated account reconstruction so later tenant-facing flows can identify the tenant profile after login.
- Preserved existing seeded accounts and login/auth flows.

## TDD Evidence

Red tests were written before production changes and run against the current code:

```text
./gradlew test --tests '*CR_001*'
BUILD FAILED
6 tests completed, 6 failed
```

Expected red failures included the missing `nguoi_thue_id` column, unsupported `nguoiThueId` request field, missing required-link validation, and missing duplicate/nonexistent tenant handling.

## Tests Added

- `CR_001_taoTaiKhoanNguoiThueGanNguoiThueIdVaKhongTraVeMatKhau`
- `CR_001_taoTaiKhoanNguoiThueKhongCoNguoiThueIdBiTuChoi`
- `CR_001_taoTaiKhoanKhongPhaiNguoiThueChoPhepNguoiThueIdRong`
- `CR_001_taoTaiKhoanNguoiThueVoiNguoiThueKhongTonTaiBiTuChoiKhongLoChiTietNoiBo`
- `CR_001_taoTaiKhoanNguoiThueTrungLienKetBiTuChoiKhongLoChiTietNoiBo`
- `CR_001_nguoiDungNguoiThueIdLaKhoaNgoaiDuyNhatVaChoPhepRong`

Existing deny-by-default coverage for account-management endpoints remains in `FR_AUT_06_chiQuanTriHeThongMoiDuocThemSuaKhoaTaiKhoan`, which includes the seeded `NGUOI_THUE` account.

## Final Verification

```text
./gradlew test
BUILD SUCCESSFUL
```

The full backend suite passed after implementation and review fixes.

## Files Changed

- `backend/src/main/resources/db/migration/V11__link_account_to_tenant.sql`
- `backend/src/main/java/com/prj1/ccm/auth/NguoiDungDangNhap.java`
- `backend/src/main/java/com/prj1/ccm/auth/NguoiDungRepository.java`
- `backend/src/main/java/com/prj1/ccm/nguoidung/NguoiDung.java`
- `backend/src/main/java/com/prj1/ccm/nguoidung/QuanLyNguoiDungController.java`
- `backend/src/main/java/com/prj1/ccm/nguoidung/QuanLyNguoiDungService.java`
- `backend/src/main/java/com/prj1/ccm/nguoidung/ThongTinQuanLyNguoiDung.java`
- `backend/src/main/java/com/prj1/ccm/nguoidung/YeuCauQuanLyNguoiDung.java`
- `backend/src/test/java/com/prj1/ccm/auth/AuthMigrationRegressionTest.java`
- `backend/src/test/java/com/prj1/ccm/auth/XacThucServiceTest.java`
- `backend/src/test/java/com/prj1/ccm/nguoidung/NguoiDungQuanLyIntegrationTest.java`
- `.scratch/slice-02-nguoi-thue-hop-dong/issues/03-noi-tai-khoan-voi-nguoi-thue.md`

## Review Notes

- No files under `Doc/`, frontend, contracts, occupants, or room-status behavior were touched.
- No V1-V10 migrations were modified.
- No subagents were dispatched.
