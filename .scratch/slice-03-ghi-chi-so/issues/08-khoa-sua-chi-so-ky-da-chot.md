# 08: Khoá sửa chỉ số của kỳ đã chốt · FR-MTR-10

**What to build:** Chỉ số của một kỳ đã chốt thì không sửa được. Trừ vai trò **Chủ sở hữu**, và mỗi lần sửa như vậy **phải ghi nhật ký**: ai sửa, sửa gì, từ giá trị nào sang giá trị nào, lúc nào, vì lý do gì.

**Blocked by:** 07

**Status:** done

- [x] Bốn vai trò còn lại sửa chỉ số kỳ đã chốt thì nhận 403
- [x] Chủ sở hữu sửa được nhưng **bắt buộc nhập lý do**, không cho bỏ trống
- [x] Nhật ký ghi đủ: người, thời điểm, phòng, dịch vụ, giá trị cũ, giá trị mới, lý do
- [x] Nhật ký **chỉ thêm, không sửa không xoá** — chuẩn bị sẵn cho FR-SEC-07 ở Slice 10, nơi ràng buộc này được ép bằng quyền ở tầng cơ sở dữ liệu
- [x] Tên test mang mã `FR-MTR-10`

**Ghi chú về phạm vi.** FR-MTR-10 viết nguyên văn là *"kỳ đã phát hành hoá đơn"*, mà hoá đơn là việc của Slice 4. Ticket này cài đặt theo **kỳ đã chốt**, là điều kiện chặt hơn và có sẵn ở slice này. Khi Slice 4 xong, xem lại xem có cần nới hay không — nhưng nhiều khả năng không, vì hoá đơn chỉ phát hành được sau khi chốt kỳ.

## Comments

- Chốt closed-period edit bằng một `PUT` riêng cho `CHU` giúp giữ đường `POST /chi-so` đúng vai trò “ghi mới kỳ đang mở” và tránh upsert vô tình thay đổi kỳ `DA_CHOT`.
- `NHAT_KY_THAO_TAC` được mở rộng bằng `V20` thay vì tạo bảng audit mới để tái sử dụng hạ tầng nhật ký sẵn có nhưng vẫn truy vết được `phong_id`, `dich_vu_id`, và `ly_do`.
- Bộ test dở dang ban đầu có case `NGUOI_THUE` đăng nhập bằng `0900000005`; seed thật trong `V2__auth_foundation.sql` là `0900000006`, nên cần sửa dữ liệu test để assertion `403` chạm đúng nhánh phân quyền.
