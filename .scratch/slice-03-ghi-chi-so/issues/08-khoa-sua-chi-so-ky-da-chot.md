# 08: Khoá sửa chỉ số của kỳ đã chốt · FR-MTR-10

**What to build:** Chỉ số của một kỳ đã chốt thì không sửa được. Trừ vai trò **Chủ sở hữu**, và mỗi lần sửa như vậy **phải ghi nhật ký**: ai sửa, sửa gì, từ giá trị nào sang giá trị nào, lúc nào, vì lý do gì.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] Bốn vai trò còn lại sửa chỉ số kỳ đã chốt thì nhận 403
- [ ] Chủ sở hữu sửa được nhưng **bắt buộc nhập lý do**, không cho bỏ trống
- [ ] Nhật ký ghi đủ: người, thời điểm, phòng, dịch vụ, giá trị cũ, giá trị mới, lý do
- [ ] Nhật ký **chỉ thêm, không sửa không xoá** — chuẩn bị sẵn cho FR-SEC-07 ở Slice 10, nơi ràng buộc này được ép bằng quyền ở tầng cơ sở dữ liệu
- [ ] Tên test mang mã `FR-MTR-10`

**Ghi chú về phạm vi.** FR-MTR-10 viết nguyên văn là *"kỳ đã phát hành hoá đơn"*, mà hoá đơn là việc của Slice 4. Ticket này cài đặt theo **kỳ đã chốt**, là điều kiện chặt hơn và có sẵn ở slice này. Khi Slice 4 xong, xem lại xem có cần nới hay không — nhưng nhiều khả năng không, vì hoá đơn chỉ phát hành được sau khi chốt kỳ.
