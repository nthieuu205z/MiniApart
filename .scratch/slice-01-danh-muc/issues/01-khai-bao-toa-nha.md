# 01: Khai báo và sửa toà nhà · FR-BLD-01

**What to build:** Chủ sở hữu mở màn hình danh sách toà nhà, bấm thêm mới, điền tên, địa chỉ, số tầng, ngày chốt số, hạn thanh toán, tài khoản ngân hàng nhận tiền, rồi lưu. Toà vừa tạo hiện ngay trong danh sách và sửa lại được.

Bảng `TOA_NHA` đã có từ Slice 0 nhưng chỉ nạp được bằng tệp migration. Ticket này làm phần giao diện và API cho nó.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Danh sách toà nhà **chỉ hiện những toà người đang đăng nhập được xem** — dùng lại đúng cơ chế của ticket 06 Slice 0, không viết lại phép lọc mới
- [x] Chỉ Chủ sở hữu và Quản trị hệ thống tạo được toà mới; Quản lý toà nhà sửa được toà của mình nhưng không tạo được toà mới; ba vai trò còn lại gọi vào nhận 403
- [x] `ngay_chot_so` giới hạn 1..28, và giao diện **nói rõ vì sao** chứ không chỉ báo "giá trị không hợp lệ" — người dùng cần biết là do tháng hai
- [x] `nguong_that_thoat` nhập bằng ô số thập phân, lưu vào `NUMERIC`, hiển thị lại đúng như đã nhập
- [x] Trùng `ma_toa` bị từ chối kèm thông báo đọc được, không phải lỗi 500
- [x] Tên test mang mã `FR-BLD-01`

## Comments

- Ticket này bám đúng source-of-truth đã duyệt: dùng lại `PhanQuyenToaService` cho phạm vi nhìn thấy của `TOA_NHA`, không tạo cơ chế lọc mới ở backend hay frontend.
- Shared schema ruling được áp dụng bằng đúng một migration `V7__building_catalog.sql`, tạo đồng thời `PHONG`, `DICH_VU`, `BANG_GIA`, `BANG_GIA_BAC_THANG`, nhưng không cài sớm API hay logic của các ticket sau.
- Tạo toà mới bởi `CHU` tự gắn `PHAN_QUYEN_TOA` cho người tạo để toà vừa lưu xuất hiện ngay trong danh sách; `QTHT` vẫn thấy toà nhờ quyền toàn cục từ ticket 06 Slice 0.
- `ngay_chot_so` bị chặn ở cả hai tầng: backend trả thông báo nhắc rõ lý do tháng hai, còn frontend hiển thị helper text ngay trong form thay vì chỉ dựa vào lỗi chung của trình duyệt.
- Trong lúc đưa migration vào, test reset của hai file integration mới lộ lỗi fixture độc lập: hàng `PHAN_QUYEN_TOA(3,1)` đã được seed từ Slice 00 nên không được chèn lại ở mỗi `@BeforeEach`. Phần này được sửa để RED/GREEN phản ánh đúng nghiệp vụ.
