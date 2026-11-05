# 02: Ảnh giấy tờ qua liên kết ký hạn · FR-TNT-01 · CR-013 · NFR-SEC-04

**What to build:** Tải lên được ảnh hai mặt giấy tờ tuỳ thân của người thuê, và xem lại được. Nhưng ảnh **không bao giờ được phục vụ trực tiếp**: muốn xem, giao diện phải gọi API, được kiểm quyền, rồi mới nhận về một liên kết đã ký **hết hạn sau 15 phút**.

**Vì sao không lưu URL trong cơ sở dữ liệu.** CR-013 nói rõ: URL cố định thì không có hạn dùng, nên chỉ cần một lần lộ là lộ vĩnh viễn. Tên trường phải là `khoa_luu_tru` chứ không phải `duong_dan` — `duong_dan` gợi ý rằng giá trị đó đưa thẳng cho trình duyệt được, và người viết mã sau sẽ làm đúng như thế.

**Blocked by:** 01

**Status:** done

- [x] Dùng lại bảng `ANH_DINH_KEM` với cặp `doi_tuong_loai` = `NGUOI_THUE` và `doi_tuong_id`, không tạo bảng riêng
- [x] Thẻ căn cước **có hai mặt** — lưu được nhiều ảnh cho một người, không phải một trường chuỗi
- [x] Nginx **không có cấu hình nào** trỏ tới thư mục lưu ảnh — quy ước 5
- [x] **Ca kiểm thử bắt buộc:** lấy một liên kết ký, chờ qua hạn, gọi lại — phải bị từ chối. Test không được chờ thật 15 phút; đẩy đồng hồ tới
- [x] Người không có quyền xem hồ sơ đó thì **không xin được liên kết**, nhận 403
- [x] Kích thước và định dạng tệp có giới hạn, vượt thì báo rõ. Tệp không phải ảnh bị từ chối theo **nội dung tệp**, không phải theo phần mở rộng của tên
- [x] Tên test mang mã `FR-TNT-01` và `NFR-SEC-04`

## Comments

- Added immutable Flyway `V10__attachment_images.sql`: the canonical polymorphic `ANH_DINH_KEM` schema has `doi_tuong_loai`, `doi_tuong_id`, opaque `khoa_luu_tru`, note, detected content type, and byte size. V1–V9 were not changed.
- `POST /api/nguoi-thue/{nguoiThueId}/anh` accepts multiple PNG/JPEG document sides for an existing tenant. It validates bytes by PNG/JPEG signatures rather than filename or supplied MIME type, limits each upload to 5 MB, writes only a UUID-derived storage key under the backend-private storage root, and returns metadata without the key.
- `GET /api/anh/{anhId}/lien-ket` requires the existing Task 1 management roles (`QTHT`, `CHU`, `QUAN_LY`). It returns a HMAC-signed URL whose attachment ID and Unix-second expiry are bound together; the sole unauthenticated download route independently validates both and refuses expired or altered links with 403. The configured TTL is exactly 900 seconds (15 minutes).
- `NguoiThueAnhGiayToIntegrationTest` uses only synthetic fixtures and a mutable clock. It covers two stored sides, byte-content rejection, size rejection, forbidden `THO` and `NGUOI_THUE` requests, successful signed download, and expiry after a 16-minute clock advance. Its fixture cleanup clears the generic attachment table explicitly because a polymorphic association has no database foreign key to cascade.
- No frontend, Nginx, account, contract, occupant, room-status, or documentation source changes were made. `frontend/nginx.conf` has no location pointing to the private attachment storage root.
