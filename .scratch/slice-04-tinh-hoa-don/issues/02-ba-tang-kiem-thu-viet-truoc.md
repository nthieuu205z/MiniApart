# 02: Ba tầng kiểm thử cho toàn bộ BR — viết trước, chưa cài đặt

**What to build:** Toàn bộ bộ kiểm thử cho `billing/calc`, **viết xong trước khi có một dòng cài đặt nào**. Kết thúc ticket này, bộ kiểm thử biên dịch được và **toàn bộ đỏ**.

**Đây là ticket cố ý không demo được gì, và đó là chủ đích.** Nó là ngoại lệ có cân nhắc với nguyên tắc lát cắt dọc. Đọc mục "Thứ tự bắt buộc" trong `spec.md` để hiểu vì sao đảo thứ tự là mất phần lớn giá trị của cả slice.

Cách kiểm chứng ticket này xong: chạy bộ kiểm thử, đếm số ca **đỏ**, và không có ca nào **xanh giả** vì thiếu khẳng định.

**Blocked by:** 01

**Status:** ready-for-agent

## Tầng 1 — Ca ví dụ

- [ ] **Ca số một, chép nguyên từ mục 5.4.5:** phòng 305 toà A, kỳ 28/07–28/08/2026 (31 ngày), giá thuê 3.500.000, dọn vào 17/08 nên ở 12 ngày, điện 1.240→1.298 đơn giá 3.500, nước 210→214 đơn giá 25.000, rác 30.000, internet 100.000, gửi xe 100.000. **Kỳ vọng đúng 1.888.000 đồng**, với dòng làm tròn `+161`
- [ ] Mỗi quy tắc BR-01 → BR-09 và BR-15 có **tối thiểu ba ca**: thông thường, ở biên, ngoại lệ
- [ ] **BR-02c phải có ca cho số hộ quy đổi:** 3 người → 1 hộ, 4 người → 1 hộ, 5 người → 2 hộ, 8 người → 2 hộ, 9 người → 3 hộ. Đây là hàm trần, và biên của nó là chỗ dễ lệch một đơn vị nhất
- [ ] **BR-02c ca ngoại lệ:** không xác định được số người ở → áp đơn giá **bậc 3** cho toàn bộ sản lượng
- [ ] **BR-15 phải có ca dòng làm tròn mang dấu âm.** Làm tròn **nửa lên** khác **làm tròn lên**: 1.887.200 → nửa lên cho 1.887.000 (chênh **−200**), còn làm tròn lên cho 1.888.000. Có ca cho đúng mốc `x.500` để chốt hướng làm tròn
- [ ] **BR-06 ca biên:** hợp đồng phủ trọn kỳ thì tiền phòng **bằng đúng giá thuê tháng**, không lệch một đồng do phép chia
- [ ] **BR-01 ca biên:** toà cấu hình chốt số ngày 30, gặp tháng 2 → lấy ngày cuối tháng

## Tầng 2 — Kiểm thử theo tính chất

Dùng jqwik. Mỗi tính chất để máy sinh hàng nghìn bộ dữ liệu thử phá:

- [ ] Tổng các dòng chi tiết cộng khoản làm tròn **luôn** bằng tổng tiền hoá đơn, **kể cả khi khoản làm tròn mang dấu âm**
- [ ] Tiền điện bậc thang **luôn** lớn hơn hoặc bằng tiền tính theo đơn giá bậc một
- [ ] Tiền thuê tính theo ngày của một kỳ trọn vẹn **luôn** bằng đúng giá thuê tháng
- [ ] Tiền điện là hàm **đơn điệu không giảm** theo sản lượng — dùng nhiều hơn không bao giờ trả ít hơn
- [ ] Tổng hoá đơn sau làm tròn **luôn** là bội của 1.000
- [ ] Chênh lệch do làm tròn **luôn** nằm trong khoảng −500 đến +500

## Tầng 3 — Bất biến lịch sử

- [ ] Tạo hoá đơn, chốt kỳ, rồi **đổi bảng giá** → in lại hoá đơn cũ, con số **không đổi**
- [ ] Tạo hoá đơn, chốt kỳ, rồi **đổi số người ở** → in lại, con số **không đổi**
- [ ] Tạo hoá đơn, chốt kỳ, rồi **đổi đơn giá dịch vụ** → in lại, con số **không đổi**
- [ ] Ba ca trên là thứ chứng minh CR-002, CR-003 và NFR-CMP-02 được xử lý đúng. Chúng nên nằm ở một lớp kiểm thử **đặt tên nói rõ mục đích**, vì đây là bộ ca đem ra bảo vệ

## Ràng buộc chung

- [ ] **Không viết một dòng cài đặt nghiệp vụ nào trong ticket này.** Cần gì để biên dịch thì để hàm ném ngoại lệ "chưa cài đặt"
- [ ] Bộ kiểm thử chạy **không cần Spring, không cần cơ sở dữ liệu**, tổng thời gian dưới vài giây
- [ ] Mọi tên ca kiểm thử mang mã `BR-xx` tương ứng — quy ước 4
- [ ] Ghi lại **số ca đỏ** vào phần Comments khi đóng ticket. Con số đó là mốc để ticket 03 biết mình đã xong chưa
