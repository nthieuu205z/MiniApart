# 04: Khai báo dịch vụ với bốn cách tính · FR-BLD-05

**What to build:** Mỗi toà nhà khai báo được các dịch vụ của mình, mỗi dịch vụ chọn một trong bốn cách tính:

| Cách tính | Nghĩa là | Ví dụ |
|---|---|---|
| Theo chỉ số | Đọc công tơ đầu kỳ và cuối kỳ, lấy hiệu | Điện, nước |
| Cố định theo phòng | Một số tiền cho cả phòng, bất kể mấy người | Internet, rác |
| Theo đầu người | Nhân với số người ở trong kỳ | Nước tính theo người, phí quản lý |
| Theo số lượng | Nhân với một số lượng khai báo | Gửi xe, chỗ để đồ |

**Đây là ticket quan trọng hơn vẻ ngoài.** Bốn cách tính này chính là **bốn nhánh** mà `billing/calc` ở Slice 4 phải cài đặt (BR-03). Đặt tên và tập giá trị ở đây sai thì Slice 4 phải sửa lại cả bảng lẫn mã. Tên các giá trị phải khớp với sơ đồ lớp `11-class-billing-calc.mmd` ở Chương 3 — mở ra đọc trước khi đặt tên.

**Blocked by:** 01

**Status:** done

- [x] Bảng `DICH_VU` gắn với một toà nhà, có `cach_tinh` là tập giá trị đóng, ép bằng `CHECK` ở tầng cơ sở dữ liệu
- [x] Tên giá trị `cach_tinh` khớp với sơ đồ lớp Chương 3, không tự đặt tên mới
- [x] Dịch vụ tính theo chỉ số có thêm cờ đánh dấu nó là **điện**, vì chỉ điện mới dùng được biểu giá bậc thang (ticket 06)
- [x] Đơn vị tính (kWh, m³, tháng, chiếc) khai báo được và hiện lên hoá đơn sau này
- [x] Bật/tắt được một dịch vụ mà **không xoá** nó — dịch vụ đã dùng trên hoá đơn cũ thì xoá đi là rách lịch sử, cùng lý do như cấm xoá tài khoản ở FR-AUT-06
- [x] Tên test mang mã `FR-BLD-05`

## Comments

- Implemented the FR-BLD-05 service catalog API with four closed calculation modes, electric-service validation, unit metadata, and non-destructive enable/disable behavior.
- Reused `PhanQuyenToaService` for building scope and added explicit 403 coverage for forbidden roles and out-of-scope managers.
- Verification: full backend suite passed with Java 21 and `--rerun-tasks` (64 tests, 0 failures); task review approved with one deferred Minor about test fixture self-containment.
