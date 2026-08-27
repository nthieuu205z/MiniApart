# 05: Năm vai trò thấy năm menu khác nhau · FR-AUT-04

**What to build:** Đăng nhập lần lượt bằng năm tài khoản mẫu thì thấy năm menu khác nhau, đúng với phạm vi công việc của từng vai trò: Quản trị hệ thống, Chủ sở hữu, Quản lý toà nhà, Thợ sửa chữa, Người thuê.

**Điều phải nói rõ:** menu là chuyện **tiện dụng**, không phải chuyện an ninh. Ẩn một mục menu không có nghĩa là chặn được đường dẫn tương ứng. Việc chặn thật nằm ở ticket 06 và phải làm ở tầng máy chủ. Ticket này cố tình không nhận trách nhiệm đó.

**Blocked by:** 03

**Status:** done

- [x] Vai trò về từ máy chủ trong phản hồi đăng nhập, frontend không tự suy diễn
- [x] Năm vai trò cho ra năm cấu hình menu khác nhau, chụp được năm ảnh màn hình khác nhau để đưa vào Chương 5
- [x] Gõ tay một đường dẫn không có trong menu của mình thì frontend không vỡ — hiện trang "không có quyền" tử tế
- [x] Tên test mang mã `FR-AUT-04`

Evidence: `frontend/evidence/ticket-05/` chứa năm ảnh menu được chụp từ frontend chạy local.
