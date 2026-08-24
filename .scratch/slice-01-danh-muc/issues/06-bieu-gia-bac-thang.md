# 06: Biểu giá điện bậc thang · FR-BLD-07, FR-BLD-08 · CR-003

**What to build:** Khai báo được biểu giá điện sinh hoạt nhiều bậc theo quy định Nhà nước, và chuyển được một dịch vụ điện giữa hai chế độ: đơn giá cố định theo hợp đồng, hoặc bậc thang.

Cơ cấu hiện hành là năm bậc, mỗi bậc là một **tỷ lệ phần trăm của giá bán lẻ điện bình quân**. Nhập giá bình quân một lần là cả năm bậc tự quy ra tiền.

**Ba điều CR-003 nói rõ, làm sai là phải sửa cấu trúc bảng về sau:**

1. **Mỗi bậc một dòng, không phải mỗi bậc một cột.** Đừng làm `don_gia_bac_1` đến `don_gia_bac_6`. Phiếu CR-015 đã chứng minh giá trị của điều này: cơ cấu đổi từ 6 bậc xuống 5 bậc mà cấu trúc bảng không phải sửa dòng nào.
2. **Bậc cuối không có giới hạn trên.** `den_so_luong` cho phép rỗng, hiểu là vô cực.
3. **Lưu cả `ty_le` lẫn `don_gia` đã quy đổi.** `ty_le` để cập nhật cả biểu giá bằng một thao tác khi Nhà nước đổi giá bình quân; `don_gia` đã quy đổi để hoá đơn cũ in lại vẫn ra đúng số cũ.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Bảng `BANG_GIA_BAC_THANG(id, dich_vu_id, bac, tu_so_luong, den_so_luong, ty_le, don_gia, ngay_hieu_luc)` đúng như CR-003
- [ ] Cả bộ bậc thang có chung một `ngay_hieu_luc`, và lưu được **nhiều bộ** theo thời gian — FR-BLD-08
- [ ] Nhập giá bán lẻ bình quân thì `don_gia` từng bậc tự tính từ `ty_le`, làm tròn theo quy tắc ghi rõ trên màn hình
- [ ] Ràng buộc: các bậc phải **liền nhau không hở, không chồng**. Bậc 1 bắt đầu từ 0, bậc sau bắt đầu đúng chỗ bậc trước kết thúc. Kiểm khi lưu, và có test cho cả hở lẫn chồng
- [ ] Đúng một bậc có `den_so_luong` rỗng, và đó phải là bậc cuối
- [ ] Tra bộ bậc thang áp dụng cho một kỳ theo **cùng quy tắc ngày hiệu lực** như ticket 05, không viết lại logic riêng
- [ ] Chuyển một dịch vụ điện giữa hai chế độ giá mà không mất dữ liệu của chế độ kia
- [ ] Tên test mang mã `FR-BLD-07` và `FR-BLD-08`

**Ghi chú.** Ticket này **chỉ lưu và tra được biểu giá**. Việc thực sự tính tiền theo bậc — cộng dồn qua các bậc, nhân định mức với số hộ quy đổi theo BR-02c — là của Slice 4. Đừng cài đặt phép tính ở đây; nó thuộc `billing/calc` và phải viết kiểm thử trước.
