# 03: Đăng nhập bằng số điện thoại và mật khẩu · FR-AUT-01

**What to build:** Người dùng mở trang, nhập số điện thoại và mật khẩu, bấm đăng nhập, và vào được trang chủ có tên mình cùng vai trò của mình. Tải lại trang thì vẫn còn đăng nhập. Bấm đăng xuất thì mất phiên.

Ticket này cũng dựng **lược đồ nền** mà mọi thứ sau dựa vào: `NGUOI_DUNG`, `TOA_NHA`, `PHAN_QUYEN_TOA`, theo đúng ERD ở `Doc/diagrams-v2/07-erd-v2.mmd`, kèm dữ liệu mẫu đủ năm vai trò và hai toà nhà.

**Ràng buộc thiết kế bắt buộc — đọc kỹ trước khi chọn cách làm phiên đăng nhập.** FR-AUT-07 ở Vertical Slice 10 đòi: người bị thu hồi quyền thì phiên đăng nhập phải chết trong vòng 5 phút. Một token không trạng thái hạn dài **không đáp ứng được** yêu cầu đó, và phát hiện ra điều này ở Slice 10 nghĩa là đập đi làm lại phần xác thực. Vì vậy ngay từ ticket này phải chọn một trong hai: token truy cập hạn ngắn kèm token làm mới, hoặc một cột phiên bản token trong `NGUOI_DUNG` được kiểm ở mỗi lần gọi. Ghi lựa chọn và lý do vào một ADR trong `docs/adr/`.

**Blocked by:** 01

**Status:** ready-for-agent
> **Mã nguồn đã bị xoá ngày 2026-08-25 để bắt đầu lại sạch.** Ticket này quay về `ready-for-agent`. Các bài học ở mục `## Comments` bên dưới vẫn đúng — đọc trước khi làm lại để khỏi vấp lại cùng chỗ.


- [x] Migration Flyway `V1` dựng ba bảng, tên bảng và cột tiếng Việt không dấu viết hoa, khớp ERD
- [x] Số điện thoại là duy nhất ở **tầng cơ sở dữ liệu**, không chỉ kiểm ở tầng ứng dụng
- [x] Mật khẩu lưu dạng băm có muối. Không có chỗ nào trong mã, log, hay phản hồi API lộ mật khẩu gốc
- [x] Migration dữ liệu mẫu: năm tài khoản ứng năm vai trò `QTHT|CHU|QUAN_LY|THO|NGUOI_THUE`, hai toà nhà, và bản ghi `PHAN_QUYEN_TOA` gán quản lý cho đúng một toà
- [x] Dữ liệu mẫu là **dữ liệu bịa hoàn toàn** — rủi ro R-13, không dùng số điện thoại hay tên người thật
- [x] Sai mật khẩu và sai số điện thoại trả về **cùng một thông báo**, không tiết lộ tài khoản nào có thật
- [x] Có ADR trong `docs/adr/` ghi cách làm phiên đăng nhập và nói rõ nó đáp ứng FR-AUT-07 ra sao
- [x] Có test cho endpoint đăng nhập, tên test mang mã `FR-AUT-01` — quy ước số 4

## Comments

### Cách làm phiên đăng nhập — xem ADR-0001

Chọn: **access token 30 phút mang claim `ver`**, đối chiếu với cột `NGUOI_DUNG.phien_ban_token` ở mỗi lần gọi API. Thu hồi quyền chỉ việc tăng cột đó lên một, và mọi token đã phát cho người đó **chết ngay lập tức** — không phải chờ 5 phút như FR-AUT-07 cho phép.

Không dùng bảng phiên đăng nhập ở máy chủ, vì như thế phải thêm một thực thể không có trong ERD ở Chương 3, kéo theo phải sửa sơ đồ. Một cột đạt cùng mục đích.

Chưa làm refresh token. Hoãn được mà không sợ phải làm lại: phần đắt là cơ chế thu hồi thì đã có sẵn.

Lý do đầy đủ và các phương án đã loại: `docs/adr/0001-phien-dang-nhap-va-thu-hoi-quyen.md`.

### Chống dò tài khoản

Hai điều đã làm mà yêu cầu không nói tới, nhưng thiếu thì hở:

**Thông báo giống hệt nhau.** Sai mật khẩu và không có tài khoản trả về **cùng một chuỗi byte**. Có một ca kiểm thử so sánh trực tiếp hai phản hồi. Nếu hai thông báo khác nhau thì bất kỳ ai cũng dò được số điện thoại nào có tài khoản — với một khu trọ, đó là dò được ai đang ở đây.

**Thời gian trả lời giống nhau.** Khi không tìm thấy tài khoản, hệ thống **vẫn băm mật khẩu vừa nhập** rồi mới từ chối. Nếu trả về ngay thì yêu cầu cho số điện thoại lạ sẽ nhanh hơn hẳn yêu cầu cho tài khoản có thật, và chỉ cần một chiếc đồng hồ bấm giây là dò ra danh sách tài khoản. Đây là loại lỗ hổng mà thông báo giống nhau **không** che được.

### Một khác biệt nữa của Spring Boot 4

Boot 4 dùng **Jackson 3**, gói là `tools.jackson`, không phải `com.fasterxml.jackson`. Mọi ví dụ trên mạng viết cho Boot 3 đều import sai gói. Đây là lần thứ ba trong Slice 0 gặp chuyện Boot 4 dời đồ đạc — hai lần trước ở ticket 01.

### Việc để lại cho slice sau

- `NGUOI_DUNG.nguoi_thue_id` (CR-001) **chưa có** trong V1, vì bảng `NGUOI_THUE` chưa tồn tại. Vertical Slice 2 thêm bằng một migration mới. Đây đúng là kiểu việc mà Flyway sinh ra để làm.
- Ba cột `so_lan_sai`, `lan_sai_dau_tien`, `khoa_den` đã có sẵn trong V1 nhưng **chưa ai ghi vào**. Ticket 04 dùng tới.
- `JWT_SECRET` đang có giá trị mặc định trong `application.yml`, chỉ dùng khi phát triển. **Vertical Slice 11 bắt buộc phải truyền giá trị thật qua biến môi trường** — để nguyên chuỗi trong repo nghĩa là ai đọc được mã nguồn cũng tự ký được token quản trị.
