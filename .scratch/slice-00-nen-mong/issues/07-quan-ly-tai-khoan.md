# 07: Tạo, sửa, khoá tài khoản — nhưng không xoá · FR-AUT-06

**What to build:** Quản trị hệ thống tạo được tài khoản mới, sửa thông tin, gán toà nhà, và **khoá** tài khoản. Không có đường nào xoá được tài khoản đã phát sinh dữ liệu.

**Vì sao cấm xoá.** Tài khoản là thứ được tham chiếu từ bản ghi chỉ số, bản ghi thanh toán, và nhật ký thao tác. Xoá nó đi là làm rách lịch sử: một khoản thu không còn biết ai ghi. Khoá thì người đó không vào được nữa mà lịch sử vẫn nguyên. Đây là cùng một tinh thần với việc cấm xoá bản ghi thanh toán ở Vertical Slice 5 — sửa sai bằng cách ghi thêm, không bằng cách xoá đi.

**Blocked by:** 05, 06

**Status:** done

- [x] Tạo tài khoản, gán vai trò, gán danh sách toà nhà — làm được trọn trên giao diện
- [x] Khoá tài khoản; người bị khoá đăng nhập thì bị từ chối
- [x] **Không có endpoint xoá.** Nếu có, phải từ chối khi tài khoản đã phát sinh dữ liệu, và có test chứng minh
- [x] Chỉ quản trị hệ thống làm được việc này; bốn vai trò kia gọi vào nhận 403
- [x] Người tạo tài khoản không tự đặt được mật khẩu hộ người khác theo cách mình biết mật khẩu đó
- [x] Tên test mang mã `FR-AUT-06`
