# 03: Nối tài khoản đăng nhập với hồ sơ người thuê · CR-001

**What to build:** Một tài khoản vai trò `NGUOI_THUE` chỉ ra được nó là hồ sơ người thuê nào. Quản trị viên gán được liên kết đó khi tạo tài khoản.

**Vì sao ticket nhỏ này quan trọng.** CR-001 nói: thiếu liên kết này thì hệ thống **không có cách nào** biết tài khoản vừa đăng nhập tương ứng với người thuê nào, do đó không truy ra hợp đồng, không ra phòng, không ra hoá đơn. **Toàn bộ Vertical Slice 6 — cổng người thuê, 9 yêu cầu — không khởi động được nếu chưa có ticket này.**

**Blocked by:** 01

**Status:** done

- [x] Migration thêm `nguoi_thue_id` vào `NGUOI_DUNG`: khoá ngoại, **cho phép rỗng**, và **duy nhất**
- [x] Cho phép rỗng vì tài khoản của Chủ sở hữu, Quản lý, Thợ, Quản trị hệ thống không gắn với hồ sơ người thuê nào
- [x] Duy nhất để một hồ sơ người thuê không bị hai tài khoản cùng nhận là mình
- [x] Quy tắc ở tầng ứng dụng: vai trò là `NGUOI_THUE` thì `nguoi_thue_id` **bắt buộc** phải có giá trị. Có test cho việc tạo tài khoản người thuê mà bỏ trống thì bị từ chối
- [x] Tên test mang mã `CR-001`

## Agent comment

Task 3 implemented in `codex/slice-02-nguoi-thue-hop-dong` with TDD. Added Flyway `V11__link_account_to_tenant.sql`, account-management request/response support for `nguoiThueId`, application-boundary validation for `NGUOI_THUE`, duplicate/nonexistent tenant client errors, and auth-side propagation of the linked tenant id for future tenant portal flows. Red check: `./gradlew test --tests '*CR_001*'` failed before production changes with missing `nguoi_thue_id`/unsupported payload behavior. Final verification: `./gradlew test` passed.
