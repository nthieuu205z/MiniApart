# 08: Xem hoá đơn chi tiết · FR-INV-02

**What to build:** Mở một hoá đơn ra thấy đầy đủ từng khoản mục, mỗi khoản có diễn giải **đủ để người thuê tự kiểm tra lại được**: chỉ số đầu, chỉ số cuối, mức tiêu thụ, đơn giá từng bậc nếu tính bậc thang, số ngày ở nếu chia theo ngày.

**Đây là ticket quyết định người thuê có tin hoá đơn hay không.** Một dòng ghi "Tiền điện: 203.000" thì không kiểm tra được. Một dòng ghi "Tiền điện: (1.298 − 1.240) × 3.500 = 203.000" thì kiểm tra được bằng máy tính bỏ túi. Khác biệt giữa hai cách trình bày này là khác biệt giữa tranh cãi và không tranh cãi.

Với hoá đơn tính theo bậc thang, phải hiện **từng bậc một dòng** kèm định mức đã nhân với số hộ quy đổi, vì đó là chỗ người thuê hay thắc mắc nhất.

**Blocked by:** 05

**Status:** done

- [x] Mỗi dòng chi tiết hiện đủ dữ liệu để tính lại bằng tay
- [x] Hoá đơn bậc thang hiện từng bậc: khoảng sản lượng, định mức sau khi nhân số hộ quy đổi, đơn giá, thành tiền
- [x] Hiện rõ **số người ở đã dùng để tính** và số hộ quy đổi, kèm một câu giải thích quy tắc 4 người một hộ
- [x] Dòng làm tròn hiện cả khi **mang dấu âm**, không giấu đi
- [x] Ảnh công tơ của kỳ tương ứng xem được từ đây, qua liên kết ký hạn của `slice-02 · 02`
- [x] In ra giấy A4 đọc được, không vỡ cột — đây là thứ dán lên cửa phòng
- [x] Số tiền hiển thị theo định dạng Việt Nam, dấu chấm ngăn nghìn
- [x] Tên test mang mã `FR-INV-02`

## Comments

- API chi tiết trả snapshot đủ để kiểm tra lại bằng tay: chỉ số, mức tiêu thụ, số ngày, đơn giá, bậc thang, số người và số hộ quy đổi.
- Đã thêm màn hình hoá đơn và chế độ in A4; dòng làm tròn âm vẫn được hiển thị. Liên kết ảnh công tơ dùng signed URL thời hạn 900 giây.
- Định dạng tiền giữ nguyên giá trị decimal từ backend và nhóm dấu chấm theo định dạng Việt Nam, không chuyển qua số thực ở frontend.
- Kiểm thử backend/frontend mang mã `FR-INV-02` bao phủ dữ liệu bậc thang, quyền truy cập, signed link, quá hạn và luồng mở hoá đơn theo ID.

**Ghi chú.** Xuất PDF (FR-INV-09) và mã QR chuyển khoản (FR-INV-10) **không thuộc slice này** — cả hai ở Vertical Slice 5.
