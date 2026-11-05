# 01: Hồ sơ người thuê · FR-TNT-01

**What to build:** Lưu được hồ sơ một người thuê: họ tên, ngày sinh, số điện thoại, số giấy tờ tuỳ thân, quê quán. Tìm được người thuê theo tên hoặc số điện thoại.

Ảnh giấy tờ là ticket 02, tách riêng vì nó là bài toán an ninh chứ không phải bài toán biểu mẫu.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Bảng `NGUOI_THUE` theo ERD, tách khỏi `NGUOI_DUNG` — không phải người thuê nào cũng có tài khoản
- [x] **Số giấy tờ tuỳ thân là dữ liệu cá nhân nhạy cảm.** Không ghi nó vào log, không đưa nó vào thông báo lỗi, không để nó xuất hiện trong đường dẫn URL
- [x] Danh sách người thuê hiện số giấy tờ **che bớt** (chỉ 4 số cuối); muốn xem đủ phải bấm một lần nữa, và lần bấm đó ghi nhật ký
- [x] Trùng số giấy tờ thì cảnh báo nhưng **không chặn** — thực tế có trường hợp nhập nhầm rồi sửa, và có người đổi từ chứng minh thư sang căn cước
- [x] Dữ liệu mẫu thêm vào phải là **dữ liệu bịa** (R-13)
- [x] Tên test mang mã `FR-TNT-01`

## Comments

- Added Flyway `V9__tenant_profiles.sql` to introduce `NGUOI_THUE` and the minimal `NHAT_KY_THAO_TAC` table needed for one-click reveal auditing. I did not add `NGUOI_DUNG.nguoi_thue_id`; that remains ticket 03 by design.
- Kept Task 1 scoped to backend tenant identity/profile APIs only: create, update, list/search, and explicit detail reveal. No attachment links, account linking, contracts, occupants, room status, renewal, or frontend changes were included.
- Full document numbers never appear in URLs, generic validation errors, or audit payloads. The detail endpoint reveals the raw value in the response body only after an explicit `GET /api/nguoi-thue/{id}`, and the audit row stores only the masked suffix.
- Because `NGUOI_THUE` is still intentionally detached from contracts/buildings at this slice point, authorization is role-based for `QTHT`, `CHU`, and `QUAN_LY`, while `THO` and `NGUOI_THUE` are locked to `403`. Building-scoped ownership for tenant profiles can be tightened once later tickets introduce the missing relations.
- No production seed rows were added for `NGUOI_THUE`; all new test fixtures and examples in this task use synthetic names, phones, hometowns, and document numbers only.
