# 01: Hồ sơ người thuê · FR-TNT-01

**What to build:** Lưu được hồ sơ một người thuê: họ tên, ngày sinh, số điện thoại, số giấy tờ tuỳ thân, quê quán. Tìm được người thuê theo tên hoặc số điện thoại.

Ảnh giấy tờ là ticket 02, tách riêng vì nó là bài toán an ninh chứ không phải bài toán biểu mẫu.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Bảng `NGUOI_THUE` theo ERD, tách khỏi `NGUOI_DUNG` — không phải người thuê nào cũng có tài khoản
- [ ] **Số giấy tờ tuỳ thân là dữ liệu cá nhân nhạy cảm.** Không ghi nó vào log, không đưa nó vào thông báo lỗi, không để nó xuất hiện trong đường dẫn URL
- [ ] Danh sách người thuê hiện số giấy tờ **che bớt** (chỉ 4 số cuối); muốn xem đủ phải bấm một lần nữa, và lần bấm đó ghi nhật ký
- [ ] Trùng số giấy tờ thì cảnh báo nhưng **không chặn** — thực tế có trường hợp nhập nhầm rồi sửa, và có người đổi từ chứng minh thư sang căn cước
- [ ] Dữ liệu mẫu thêm vào phải là **dữ liệu bịa** (R-13)
- [ ] Tên test mang mã `FR-TNT-01`
