# 07: Xuất hoá đơn và biên lai dạng PDF · FR-INV-09 · FR-INV-13

**What to build:** Xuất một hoá đơn ra PDF để in hoặc gửi qua kênh chat, và xuất biên lai cho một lần ghi nhận thanh toán.

**Blocked by:** 02

**Status:** done

## Thiếu thư viện — thêm trước khi viết mã

`backend/build.gradle` **không có thư viện PDF nào**. Thêm phụ thuộc là việc đầu tiên.

## Nội dung phải hand-recomputable

`FR-INV-02` và mục 5.4.5 tài liệu phân tích đòi hoá đơn **tính lại được bằng tay**. `HoaDonChiTietService` đã dựng đúng nội dung đó cho màn hình — PDF phải chở **cùng bộ số liệu**, không phải bản rút gọn.

Nghĩa là mỗi dòng chi tiết phải có: tên khoản, chỉ số đầu, chỉ số cuối, số lượng, đơn giá, thành tiền. Bậc thang phải hiện từng bậc. Dòng làm tròn phải hiện, kể cả khi âm.

**Đừng làm PDF đẹp hơn màn hình bằng cách bỏ bớt cột.** Người thuê in hoá đơn ra chính là để ngồi cộng lại.

## Số dùng lại đường định dạng đã có, không tự viết

`NFR-USA-06` quy định `1.888.000 đ` và `dd/MM/yyyy`. Định dạng này đã tồn tại trong mã cho màn hình. PDF **dùng lại**, không viết hàm định dạng thứ hai — hai hàm định dạng tiền là hai chỗ để lệch nhau.

Bài học có sẵn ở kế hoạch, mục Vertical Slice 9:

> *"FR-RPT-04 yêu cầu số liệu xuất ra Excel **khớp đúng** với số trên màn hình. Nghe hiển nhiên nhưng rất hay sai, vì màn hình thường làm tròn để hiển thị còn file xuất lấy số gốc."*

Đúng cái bẫy đó áp cho PDF ở ticket này.

## Ảnh công tơ trong PDF — cẩn thận với quy ước 5

Hoá đơn trên màn hình có liên kết ảnh công tơ ký hạn 15 phút. **PDF thì không nhúng liên kết đó** — PDF sống lâu hơn 15 phút và có thể bị chuyển tiếp cho người khác.

Hai đường: hoặc nhúng thẳng ảnh vào PDF, hoặc không có ảnh. **Không được** nhúng liên kết ký, vì đó là phát tán một liên kết có quyền truy cập ra ngoài tầm kiểm soát — đi ngược `CR-013` và quy ước 5.

Chọn một và ghi lý do vào `## Comments`.

## Biên lai — FR-INV-13

Ticket 02 đã sinh `ma_bien_lai` và đặt ràng buộc duy nhất. Ticket này làm **bản in được** của nó: mã biên lai, hoá đơn tương ứng, số tiền, hình thức, ngày thu, người thu.

Biên lai của một bút toán **đối ứng** phải nói rõ đó là điều chỉnh và **hiện lý do** — không được trông giống biên lai thu tiền bình thường mang số âm.

## Hoàn thành khi

- [x] Thư viện PDF thêm vào `build.gradle` trước khi viết mã
- [x] PDF hoá đơn chở **đủ** số liệu như màn hình: từng dòng, từng bậc thang, dòng làm tròn kể cả âm
- [x] Định dạng tiền và ngày **dùng lại đường đã có**, không viết hàm thứ hai
- [x] **Test đối chiếu:** với cùng một hoá đơn, mọi con số trong PDF khớp đúng con số của `HoaDonChiTietService`
- [x] PDF **không nhúng liên kết ảnh ký hạn**; chọn nhúng ảnh hoặc bỏ ảnh, ghi lý do
- [x] Biên lai in được cho một bản ghi `THANH_TOAN`
- [x] Biên lai của bút toán đối ứng **nói rõ là điều chỉnh và hiện lý do**
- [x] Hoá đơn `NHAP` **không** xuất PDF được — chỉ hoá đơn đã phát hành mới là chứng từ
- [x] Test 403 cho QTHT và Quản lý sai toà
- [x] Tiếng Việt có dấu hiển thị đúng trong PDF — phông nhúng, không rơi về phông thiếu chữ

## Comments

- Đã thêm OpenPDF 2.0.3 và bộ font OpenPDF Extra; font Liberation Sans được nhúng bằng `IDENTITY_H` để giữ tiếng Việt có dấu.
- PDF hoá đơn dùng lại projection `HoaDonChiTietService` nhưng gọi biến thể không tạo signed link; vì PDF có thể sống lâu hơn 15 phút nên **bỏ ảnh công tơ**, không nhúng URL ký hạn và ghi rõ trong test.
- `DinhDangChungTu` là điểm định dạng dùng chung cho hoá đơn và biên lai, giữ đúng quy ước màn hình `dd/MM/yyyy`, phân nhóm hàng nghìn bằng dấu chấm và phần thập phân bằng dấu phẩy.
- Bảng PDF giữ đủ cột chi tiết, từng bậc, định mức quy đổi, dòng làm tròn âm, tổng/đã thu/còn lại; test đọc lại text PDF và kiểm tra font được embed.
- Biên lai thường hiển thị mã biên lai, hoá đơn, số tiền, hình thức, ngày thu, người thu; biên lai `DOI_UNG` hiển thị tiêu đề điều chỉnh, số âm, ngày tạo và lý do.
- Người thuê được tải biên lai của chính hợp đồng mình; truy cập biên lai của người thuê khác vẫn bị 403. Chủ sở hữu/quản lý giữ nguyên phạm vi quyền theo toà.
- Frontend và backend là hai build độc lập (Vite/TypeScript và Gradle/Java), nên không thể import cùng một hàm mã nguồn mà không kéo runtime của bên này vào bên kia. Formatter frontend được đặt tại `design/core/format.ts`, formatter server tại `DinhDangChungTu`; hai phía dùng cùng contract NFR-USA-06 và đều có test cho số lớn, số âm, số nguyên và ngày `dd/MM/yyyy`. Test PDF lấy projection thật từ endpoint chi tiết rồi đối chiếu động mọi trường được in (gồm cả diễn giải, lý do, dòng bậc thang và các trường số) với nội dung PDF trên toàn bộ số trang.
- Chạy `./gradlew test --no-daemon --max-workers=1 --rerun-tasks`: `BUILD SUCCESSFUL` (4 tasks). Lần chạy mặc định có race của Gradle binary test report (`NoSuchFileException`), nên dùng cấu hình tuần tự làm bằng chứng full suite ổn định.
