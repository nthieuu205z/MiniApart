# 03: Nối tài khoản đăng nhập với hồ sơ người thuê · CR-001

**What to build:** Một tài khoản vai trò `NGUOI_THUE` chỉ ra được nó là hồ sơ người thuê nào. Quản trị viên gán được liên kết đó khi tạo tài khoản.

**Vì sao ticket nhỏ này quan trọng.** CR-001 nói: thiếu liên kết này thì hệ thống **không có cách nào** biết tài khoản vừa đăng nhập tương ứng với người thuê nào, do đó không truy ra hợp đồng, không ra phòng, không ra hoá đơn. **Toàn bộ Vertical Slice 6 — cổng người thuê, 9 yêu cầu — không khởi động được nếu chưa có ticket này.**

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Migration thêm `nguoi_thue_id` vào `NGUOI_DUNG`: khoá ngoại, **cho phép rỗng**, và **duy nhất**
- [ ] Cho phép rỗng vì tài khoản của Chủ sở hữu, Quản lý, Thợ, Quản trị hệ thống không gắn với hồ sơ người thuê nào
- [ ] Duy nhất để một hồ sơ người thuê không bị hai tài khoản cùng nhận là mình
- [ ] Quy tắc ở tầng ứng dụng: vai trò là `NGUOI_THUE` thì `nguoi_thue_id` **bắt buộc** phải có giá trị. Có test cho việc tạo tài khoản người thuê mà bỏ trống thì bị từ chối
- [ ] Tên test mang mã `CR-001`
