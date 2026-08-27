# 04: Khoá tạm thời sau 5 lần đăng nhập sai · FR-AUT-02

**What to build:** Gõ sai mật khẩu năm lần liên tiếp trong vòng 15 phút thì lần thứ sáu bị từ chối, kèm thông báo cho biết bao giờ mở lại — **kể cả khi lần thứ sáu gõ đúng mật khẩu**. Hết thời gian khoá thì đăng nhập lại được bình thường.

**Blocked by:** 03

**Status:** done

- [x] Đếm số lần sai theo cửa sổ trượt 15 phút, không phải đếm dồn từ đầu đời tài khoản
- [x] Đăng nhập thành công thì bộ đếm về không
- [x] Trạng thái khoá nằm ở **phía máy chủ**. Xoá cookie, đổi trình duyệt, hay gọi thẳng API vẫn bị khoá
- [x] Thông báo khoá không tiết lộ tài khoản đó có tồn tại hay không
- [x] Có test: sai 5 lần rồi lần 6 gõ **đúng** mật khẩu, khẳng định vẫn bị từ chối. Đây là ca dễ cài sai nhất
- [x] Có test cho việc hết hạn khoá thì vào được, không phải chờ thật 15 phút mới chạy xong test
- [x] Tên test mang mã `FR-AUT-02`
