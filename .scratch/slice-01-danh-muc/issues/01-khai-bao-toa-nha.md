# 01: Khai báo và sửa toà nhà · FR-BLD-01

**What to build:** Chủ sở hữu mở màn hình danh sách toà nhà, bấm thêm mới, điền tên, địa chỉ, số tầng, ngày chốt số, hạn thanh toán, tài khoản ngân hàng nhận tiền, rồi lưu. Toà vừa tạo hiện ngay trong danh sách và sửa lại được.

Bảng `TOA_NHA` đã có từ Slice 0 nhưng chỉ nạp được bằng tệp migration. Ticket này làm phần giao diện và API cho nó.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Danh sách toà nhà **chỉ hiện những toà người đang đăng nhập được xem** — dùng lại đúng cơ chế của ticket 06 Slice 0, không viết lại phép lọc mới
- [ ] Chỉ Chủ sở hữu và Quản trị hệ thống tạo được toà mới; Quản lý toà nhà sửa được toà của mình nhưng không tạo được toà mới; ba vai trò còn lại gọi vào nhận 403
- [ ] `ngay_chot_so` giới hạn 1..28, và giao diện **nói rõ vì sao** chứ không chỉ báo "giá trị không hợp lệ" — người dùng cần biết là do tháng hai
- [ ] `nguong_that_thoat` nhập bằng ô số thập phân, lưu vào `NUMERIC`, hiển thị lại đúng như đã nhập
- [ ] Trùng `ma_toa` bị từ chối kèm thông báo đọc được, không phải lỗi 500
- [ ] Tên test mang mã `FR-BLD-01`
