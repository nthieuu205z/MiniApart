# 03: Đăng nhập bằng số điện thoại và mật khẩu · FR-AUT-01

**What to build:** Người dùng mở trang, nhập số điện thoại và mật khẩu, bấm đăng nhập, và vào được trang chủ có tên mình cùng vai trò của mình. Tải lại trang thì vẫn còn đăng nhập. Bấm đăng xuất thì mất phiên.

Ticket này cũng dựng **lược đồ nền** mà mọi thứ sau dựa vào: `NGUOI_DUNG`, `TOA_NHA`, `PHAN_QUYEN_TOA`, theo đúng ERD ở `Doc/diagrams-v2/07-erd-v2.mmd`, kèm dữ liệu mẫu đủ năm vai trò và hai toà nhà.

**Ràng buộc thiết kế bắt buộc — đọc kỹ trước khi chọn cách làm phiên đăng nhập.** FR-AUT-07 ở Vertical Slice 10 đòi: người bị thu hồi quyền thì phiên đăng nhập phải chết trong vòng 5 phút. Một token không trạng thái hạn dài **không đáp ứng được** yêu cầu đó, và phát hiện ra điều này ở Slice 10 nghĩa là đập đi làm lại phần xác thực. Vì vậy ngay từ ticket này phải chọn một trong hai: token truy cập hạn ngắn kèm token làm mới, hoặc một cột phiên bản token trong `NGUOI_DUNG` được kiểm ở mỗi lần gọi. Ghi lựa chọn và lý do vào một ADR trong `docs/adr/`.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Migration Flyway `V1` dựng ba bảng, tên bảng và cột tiếng Việt không dấu viết hoa, khớp ERD
- [ ] Số điện thoại là duy nhất ở **tầng cơ sở dữ liệu**, không chỉ kiểm ở tầng ứng dụng
- [ ] Mật khẩu lưu dạng băm có muối. Không có chỗ nào trong mã, log, hay phản hồi API lộ mật khẩu gốc
- [ ] Migration dữ liệu mẫu: năm tài khoản ứng năm vai trò `QTHT|CHU|QUAN_LY|THO|NGUOI_THUE`, hai toà nhà, và bản ghi `PHAN_QUYEN_TOA` gán quản lý cho đúng một toà
- [ ] Dữ liệu mẫu là **dữ liệu bịa hoàn toàn** — rủi ro R-13, không dùng số điện thoại hay tên người thật
- [ ] Sai mật khẩu và sai số điện thoại trả về **cùng một thông báo**, không tiết lộ tài khoản nào có thật
- [ ] Có ADR trong `docs/adr/` ghi cách làm phiên đăng nhập và nói rõ nó đáp ứng FR-AUT-07 ra sao
- [ ] Có test cho endpoint đăng nhập, tên test mang mã `FR-AUT-01` — quy ước số 4
