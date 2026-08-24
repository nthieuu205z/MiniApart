# 05: Tạo hoá đơn hàng loạt · FR-INV-01, FR-INV-03, FR-INV-04, FR-INV-07

**What to build:** Quản lý bấm một nút "Tạo hoá đơn kỳ tháng 8/2026", hệ thống tạo hoá đơn **nháp** cho mọi phòng có hợp đồng hiệu lực trong kỳ. Phòng nào thiếu dữ liệu thì **bỏ qua và báo rõ lý do**, không làm gián đoạn phần còn lại. Kết thúc hiện một bảng tổng kết: bao nhiêu phòng thành công, bao nhiêu bỏ qua và vì sao.

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [ ] Mã hoá đơn theo định dạng `<Mã toà>-<Số phòng>-<YYYYMM>` — FR-INV-07 — và **duy nhất**, ép ở tầng cơ sở dữ liệu
- [ ] Ràng buộc duy nhất trên `(hop_dong_id, ky_id)` chặn việc tạo hai hoá đơn cho cùng phòng cùng kỳ — FR-INV-04. Ép ở tầng cơ sở dữ liệu, không phải kiểm ở tầng ứng dụng: chạy tạo hàng loạt hai lần đồng thời là hở ngay
- [ ] Chạy lại lần hai cho cùng kỳ thì **không tạo trùng** và báo rõ đã có bao nhiêu hoá đơn
- [ ] Lý do bỏ qua được **phân loại**, không phải một chuỗi tự do: thiếu chỉ số, thiếu bảng giá cho kỳ, không xác định được số người ở… Sơ đồ lớp Chương 3 có kiểu `LyDoBoQua` cho việc này
- [ ] Một phòng lỗi **không** làm hỏng giao dịch của phòng khác
- [ ] `CHI_TIET_HOA_DON` lưu **đơn giá tại thời điểm phát hành**, không tham chiếu sang bảng giá
- [ ] Số tiền dòng chi tiết **không đặt ràng buộc phải dương** — dòng làm tròn ở BR-15 có thể âm
- [ ] Diễn giải dòng tiền phòng ghi rõ tỷ lệ, ví dụ `Tiền phòng (12/31 ngày)` — BR-06
- [ ] **Không có dòng thuế GTGT** — CR-011 đã bỏ khỏi phạm vi
- [ ] Tạo hoá đơn cho 20 phòng xong trong thời gian người dùng chịu chờ được
- [ ] Tên test mang mã `FR-INV-01`, `FR-INV-03`, `FR-INV-04`, `FR-INV-07`
