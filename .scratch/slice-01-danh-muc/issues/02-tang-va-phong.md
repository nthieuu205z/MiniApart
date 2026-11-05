# 02: Khai báo tầng và phòng · FR-BLD-02

**What to build:** Trong một toà nhà, khai báo được từng phòng: số phòng, tầng, diện tích, sức chứa tối đa, giá thuê mặc định, loại phòng. Khai xong 20 phòng thì thấy đủ 20 phòng trong danh sách, lọc được theo tầng.

Khai báo 20 phòng bằng tay là việc buồn tẻ và hay gõ nhầm. Nên có cách tạo nhanh một loạt phòng theo mẫu — ví dụ tầng 2 gồm phòng 201 đến 208 — rồi sửa lẻ từng phòng sau.

**Blocked by:** 01

**Status:** done

- [x] Bảng `PHONG` theo đúng ERD: `so_phong`, `tang`, `dien_tich`, `suc_chua`, `gia_thue_mac_dinh`, `trang_thai`
- [x] `gia_thue_mac_dinh` là `NUMERIC(15,2)` — quy ước 1, và ArchUnit sẽ bắt nếu lỡ dùng `double`
- [x] Số phòng **duy nhất trong phạm vi một toà**, không phải duy nhất toàn hệ thống — hai toà đều có phòng 101 là chuyện bình thường. Ép bằng ràng buộc duy nhất trên cặp `(toa_nha_id, so_phong)`
- [x] Tạo nhanh một dãy phòng theo tầng, xem trước danh sách sắp tạo **trước khi** ghi
- [x] `trang_thai` khởi tạo là `TRONG`. Đây là **giá trị đệm** do hệ thống ghi (CR-012) — giao diện không được cho người dùng sửa tay
- [x] `suc_chua` phải lớn hơn 0. Slice 2 dùng con số này để cảnh báo vượt sức chứa
- [x] Tên test mang mã `FR-BLD-02`

## Comments

- Kept `PHONG` on the shared `V7__building_catalog.sql` migration with `gia_thue_mac_dinh NUMERIC(15,2)` and the `(toa_nha_id, so_phong)` unique constraint; no extra migration was needed for this ticket.
- Room create and batch create both keep `trang_thai` system-owned as `TRONG`; the UI does not expose a status field and the backend ignores an extra client `trangThai` payload.
- Added focused FR-BLD-02 regression coverage for deny-by-default authorization, per-building duplicate handling, non-persistent batch preview, out-of-range batch room numbers returning `400`, and batch transaction rollback when the database rejects a mid-batch duplicate collision.
- Fix round: the frontend now stores the exact batch request used for preview and reuses that snapshot at confirmation, even if the form is edited afterwards; single and batch create results are appended only when they belong to the active floor filter.
- Fix round verification: focused and full frontend tests pass (`22/22`), the production frontend build passes, and the clean full backend suite passes with Java 21. Scoped re-review found no Critical, Important, or Minor issues.
- Preserved the approved navigation ruling: `/phong` remains a `QUAN_LY` menu item while backend room endpoints retain deny-by-default authorization for `QTHT`, `CHU`, and `QUAN_LY` within building scope.
