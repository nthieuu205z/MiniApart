# 05: Tạo hoá đơn hàng loạt · FR-INV-01, FR-INV-03, FR-INV-04, FR-INV-07

**What to build:** Quản lý bấm một nút "Tạo hoá đơn kỳ tháng 8/2026", hệ thống tạo hoá đơn **nháp** cho mọi phòng có hợp đồng hiệu lực trong kỳ. Phòng nào thiếu dữ liệu thì **bỏ qua và báo rõ lý do**, không làm gián đoạn phần còn lại. Kết thúc hiện một bảng tổng kết: bao nhiêu phòng thành công, bao nhiêu bỏ qua và vì sao.

**Blocked by:** 03, 04

**Status:** done

- [x] Mã hoá đơn theo định dạng `<Mã toà>-<Số phòng>-<YYYYMM>` — FR-INV-07 — và **duy nhất**, ép ở tầng cơ sở dữ liệu
- [x] Ràng buộc duy nhất trên `(hop_dong_id, ky_id)` chặn việc tạo hai hoá đơn cho cùng phòng cùng kỳ — FR-INV-04. Ép ở tầng cơ sở dữ liệu, không phải kiểm ở tầng ứng dụng: chạy tạo hàng loạt hai lần đồng thời là hở ngay
- [x] Chạy lại lần hai cho cùng kỳ thì **không tạo trùng** và báo rõ đã có bao nhiêu hoá đơn
- [x] Lý do bỏ qua được **phân loại**, không phải một chuỗi tự do: thiếu chỉ số, thiếu bảng giá cho kỳ, không xác định được số người ở… Sơ đồ lớp Chương 3 có kiểu `LyDoBoQua` cho việc này
- [x] Một phòng lỗi **không** làm hỏng giao dịch của phòng khác
- [x] `CHI_TIET_HOA_DON` lưu **đơn giá tại thời điểm phát hành**, không tham chiếu sang bảng giá
- [x] Số tiền dòng chi tiết **không đặt ràng buộc phải dương** — dòng làm tròn ở BR-15 có thể âm
- [x] Diễn giải dòng tiền phòng ghi rõ tỷ lệ, ví dụ `Tiền phòng (12/31 ngày)` — BR-06
- [x] **Không có dòng thuế GTGT** — CR-011 đã bỏ khỏi phạm vi
- [x] Tạo hoá đơn cho 20 phòng xong trong thời gian người dùng chịu chờ được
- [x] Tên test mang mã `FR-INV-01`, `FR-INV-03`, `FR-INV-04`, `FR-INV-07`

## Comments

- Đã triển khai tạo hoá đơn nháp hàng loạt qua migration `V22__draft_invoices.sql`, bao gồm mã hoá đơn, các ràng buộc duy nhất và tổng kết thành công/bỏ qua theo từng phòng.
- Mỗi phòng được xử lý độc lập; thiếu dữ liệu không làm rollback các phòng hợp lệ. Chạy lại hoặc chạy đồng thời cùng kỳ không tạo trùng nhờ ràng buộc cơ sở dữ liệu và kiểm tra idempotency.
- Chi tiết hoá đơn lưu snapshot đơn giá, diễn giải tỷ lệ ngày, không thêm dòng thuế GTGT; dòng làm tròn được phép mang dấu âm.
- Kiểm thử tích hợp mang mã `FR-INV-01`, `FR-INV-03`, `FR-INV-04`, `FR-INV-07` bao phủ ca 20 phòng, phòng lỗi, chạy lặp và cạnh tranh.
