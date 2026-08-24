# 02: Ảnh giấy tờ qua liên kết ký hạn · FR-TNT-01 · CR-013 · NFR-SEC-04

**What to build:** Tải lên được ảnh hai mặt giấy tờ tuỳ thân của người thuê, và xem lại được. Nhưng ảnh **không bao giờ được phục vụ trực tiếp**: muốn xem, giao diện phải gọi API, được kiểm quyền, rồi mới nhận về một liên kết đã ký **hết hạn sau 15 phút**.

**Vì sao không lưu URL trong cơ sở dữ liệu.** CR-013 nói rõ: URL cố định thì không có hạn dùng, nên chỉ cần một lần lộ là lộ vĩnh viễn. Tên trường phải là `khoa_luu_tru` chứ không phải `duong_dan` — `duong_dan` gợi ý rằng giá trị đó đưa thẳng cho trình duyệt được, và người viết mã sau sẽ làm đúng như thế.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Dùng lại bảng `ANH_DINH_KEM` với cặp `doi_tuong_loai` = `NGUOI_THUE` và `doi_tuong_id`, không tạo bảng riêng
- [ ] Thẻ căn cước **có hai mặt** — lưu được nhiều ảnh cho một người, không phải một trường chuỗi
- [ ] Nginx **không có cấu hình nào** trỏ tới thư mục lưu ảnh — quy ước 5
- [ ] **Ca kiểm thử bắt buộc:** lấy một liên kết ký, chờ qua hạn, gọi lại — phải bị từ chối. Test không được chờ thật 15 phút; đẩy đồng hồ tới
- [ ] Người không có quyền xem hồ sơ đó thì **không xin được liên kết**, nhận 403
- [ ] Kích thước và định dạng tệp có giới hạn, vượt thì báo rõ. Tệp không phải ảnh bị từ chối theo **nội dung tệp**, không phải theo phần mở rộng của tên
- [ ] Tên test mang mã `FR-TNT-01` và `NFR-SEC-04`
