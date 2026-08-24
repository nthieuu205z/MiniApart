# 08: Xem hoá đơn chi tiết · FR-INV-02

**What to build:** Mở một hoá đơn ra thấy đầy đủ từng khoản mục, mỗi khoản có diễn giải **đủ để người thuê tự kiểm tra lại được**: chỉ số đầu, chỉ số cuối, mức tiêu thụ, đơn giá từng bậc nếu tính bậc thang, số ngày ở nếu chia theo ngày.

**Đây là ticket quyết định người thuê có tin hoá đơn hay không.** Một dòng ghi "Tiền điện: 203.000" thì không kiểm tra được. Một dòng ghi "Tiền điện: (1.298 − 1.240) × 3.500 = 203.000" thì kiểm tra được bằng máy tính bỏ túi. Khác biệt giữa hai cách trình bày này là khác biệt giữa tranh cãi và không tranh cãi.

Với hoá đơn tính theo bậc thang, phải hiện **từng bậc một dòng** kèm định mức đã nhân với số hộ quy đổi, vì đó là chỗ người thuê hay thắc mắc nhất.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Mỗi dòng chi tiết hiện đủ dữ liệu để tính lại bằng tay
- [ ] Hoá đơn bậc thang hiện từng bậc: khoảng sản lượng, định mức sau khi nhân số hộ quy đổi, đơn giá, thành tiền
- [ ] Hiện rõ **số người ở đã dùng để tính** và số hộ quy đổi, kèm một câu giải thích quy tắc 4 người một hộ
- [ ] Dòng làm tròn hiện cả khi **mang dấu âm**, không giấu đi
- [ ] Ảnh công tơ của kỳ tương ứng xem được từ đây, qua liên kết ký hạn của `slice-02 · 02`
- [ ] In ra giấy A4 đọc được, không vỡ cột — đây là thứ dán lên cửa phòng
- [ ] Số tiền hiển thị theo định dạng Việt Nam, dấu chấm ngăn nghìn
- [ ] Tên test mang mã `FR-INV-02`

**Ghi chú.** Xuất PDF (FR-INV-09) và mã QR chuyển khoản (FR-INV-10) **không thuộc slice này** — cả hai ở Vertical Slice 5.
