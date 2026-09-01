# 01: Sửa máy trạng thái hoá đơn · BR-08 · FR-INV-12

**What to build:** Bổ sung ba đường chuyển trạng thái còn thiếu trong `QuyTacTrangThaiHoaDon`. **Thuần `billing/calc`, không chạm cơ sở dữ liệu, không chạm Spring.**

**Blocked by:** None

**Status:** ready-for-agent

## Vì sao ticket này phải đi trước mọi ticket có migration

Cả `THANH_TOAN` lẫn `SO_DU_KHA_DUNG` đều **ghi trạng thái hoá đơn khi kết thúc giao dịch**. Viết migration trước rồi mới phát hiện trạng thái sai thì Flyway **không cho sửa tệp đã chạy** (`BAN-GIAO.md` mục 5.2) — phải đẻ thêm `V<n+1>` để vá, trên bảng có thể đã có dữ liệu.

Ticket này không demo được gì cho người dùng. Đó là chủ ý, giống ticket `slice-04 · 02`.

## Ba đường đi đang hỏng

Đã xác minh bằng chạy thật trên bytecode hiện tại, không phải đọc mã đoán:

| # | Ca | Hiện tại | Phải thành | Căn cứ |
|---|---|---|---|---|
| 1 | Trả **đủ một lần** từ `DA_PHAT_HANH`, còn hạn | **Ném `IllegalArgumentException`** | `DA_THANH_TOAN` | Sơ đồ tuần tự Chương 3 |
| 2 | Huỷ hoá đơn đang `QUA_HAN` (Chủ sở hữu, có lý do) | **Ném lỗi** | `DA_HUY` | Ruling 6 |
| 3 | Bút toán đối ứng kéo đã-thu tụt từ `DA_THANH_TOAN` | **Ném lỗi** | `DA_THU_MOT_PHAN`/`QUA_HAN` | Ruling 1 |

**Ca 1 không cần ruling.** `Doc/diagrams-v2/14-seq-uc12-ghi-thanhtoan.mmd` ghi rõ `daThu == tongTien → Trang thai DA_TT`. Bảng chuyển ở `QuyTacTrangThaiHoaDon.java:66` cho `DA_PHAT_HANH` chỉ có `{DA_THU_MOT_PHAN, QUA_HAN, DA_HUY}` — thiếu `DA_THANH_TOAN`. Đây là **defect so với Chương 3**, không phải thiết kế có chủ ý.

Lọt được vì `HoaDonLifecycleRulesTest` chỉ có **một** test cho `ghiNhanThanhToan`, và nó test đúng ca `QUA_HAN`. Đường phổ biến nhất — người thuê trả đủ hoá đơn trong một lần — chưa từng được test.

## Ca 3: cạnh lùi phải bị khoá chặt

Ruling 1 cho lùi `DA_THANH_TOAN`, nhưng **chỉ khi nguyên nhân là bút toán đối ứng**. BR-08 vẫn cấm mọi đường lùi khác, và câu *"Đã thanh toán không thể quay lại trạng thái trước đó"* vẫn đúng cho phần còn lại.

Nghĩa là `ghiNhanThanhToan` **không được** tự do lùi khi thấy đã-thu giảm — phải có tham số nói rõ đây là bút toán đối ứng. Một hàm riêng, hoặc một cờ tường minh; **không** suy ra ngầm từ việc số tiền giảm.

Lý do: nếu suy ngầm thì một lỗi tính toán làm đã-thu giảm cũng lặng lẽ kéo lùi trạng thái, và không ai biết. Cạnh lùi phải là thứ **được gọi có chủ đích**.

## Hoàn thành khi

- [ ] `DA_PHAT_HANH → DA_THANH_TOAN` hợp lệ; trả đủ một lần cho ra `DA_THANH_TOAN`
- [ ] `QUA_HAN → DA_HUY` hợp lệ, giữ nguyên điều kiện Chủ sở hữu + lý do không rỗng
- [ ] Cạnh lùi từ `DA_THANH_TOAN` **chỉ mở khi gọi tường minh cho bút toán đối ứng**, không suy ngầm từ số tiền giảm
- [ ] Mọi đường lùi khác từ `DA_THANH_TOAN` vẫn bị chặn — BR-08 phần còn lại không đổi
- [ ] `NHAP` vẫn là trạng thái duy nhất sửa được nội dung
- [ ] Ba ca ở bảng trên có test riêng, tên mang mã `BR-08`
- [ ] Test cho **cạnh lùi bị lạm dụng**: gọi đường thường trên hoá đơn `DA_THANH_TOAN` với số tiền giảm → vẫn phải ném lỗi
- [ ] Gói `billing.calc` **không** thêm phụ thuộc Spring/JPA nào — ArchUnit vẫn xanh
- [ ] Toàn bộ 333 test hiện có vẫn xanh

## Comments
