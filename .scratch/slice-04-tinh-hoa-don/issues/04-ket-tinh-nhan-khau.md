# 04: Kết tinh nhân khẩu khi chốt kỳ · CR-002 phần (b)

**What to build:** Lúc chốt kỳ, ghi lại **số người ở của từng phòng trong kỳ đó** vào một bảng riêng, một lần, rồi không bao giờ đổi. Phép tính hoá đơn đọc con số từ bảng này, **không** đi truy vấn ngược sang `NGUOI_O_CUNG`.

**Vì sao phải kết tinh thay vì tính lại mỗi lần.** CR-002 nói rõ: nếu để phép tính truy vấn khoảng ngày mỗi lần cần dùng, thì **chỉ cần ai đó sửa lại ngày chuyển đến của một người ở cùng là toàn bộ hoá đơn cũ tự đổi số tiền** — vi phạm trực tiếp NFR-CMP-02.

Đây đúng là mẫu hình mà tài liệu **đã áp dụng** cho `CHI_TIET_HOA_DON.don_gia`: lưu lại đơn giá tại thời điểm phát hành thay vì tra ngược sang bảng giá. Ticket này chỉ mở rộng mẫu hình sẵn có sang dữ liệu nhân khẩu.

**Blocked by:** `slice-03 · 07` (chốt kỳ), `slice-02 · 06` (người ở cùng có chiều thời gian)

**Status:** ready-for-agent

- [ ] Bảng `NHAN_KHAU_KY(ky_id, phong_id, so_nguoi, thoi_diem_chot)` đúng như CR-002
- [ ] Ghi **một lần** tại thời điểm chốt kỳ, cho **mọi** phòng có hợp đồng hiệu lực trong kỳ
- [ ] Sau khi ghi thì **không sửa được** bằng thao tác thường
- [ ] `billing/calc` nhận số người ở **qua tham số**, không tự đi tra — nó là gói thuần tuý, ArchUnit canh
- [ ] Phòng không xác định được số người ở thì ghi rõ là **không xác định**, không ghi 0. Hai thứ đó khác nhau: 0 người là phòng trống, không xác định là phải áp bậc 3 theo BR-02c
- [ ] **Ca kiểm thử:** chốt kỳ, đổi `NGUOI_O_CUNG`, tính lại hoá đơn kỳ cũ → con số **không đổi**
- [ ] Tên test mang mã `CR-002`
