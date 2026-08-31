# 03: Cài đặt `billing/calc` cho tới khi mọi kiểm thử xanh · BR-01 → BR-09, BR-15

**What to build:** Cài đặt phần tính tiền cho tới khi toàn bộ bộ kiểm thử ở ticket 02 chuyển từ đỏ sang xanh. **Không sửa kiểm thử để làm cho nó xanh** — nếu một ca sai thì đó là phát hiện đáng giá, phải nêu ra và bàn, không phải sửa lặng lẽ.

**Cấu trúc theo sơ đồ lớp Chương 3.** `11-class-billing-calc.mmd` đã thiết kế sẵn hai tầng chiến lược lồng nhau: `ChienLuocTinhTien` (cách tính: theo chỉ số, cố định, theo đầu người, theo số lượng) nhân với `ChienLuocGia` (chế độ giá: đơn giá cố định, bậc thang). Mở sơ đồ ra đọc trước khi tự nghĩ cấu trúc mới.

**Blocked by:** 02

**Status:** done

- [x] Toàn bộ kiểm thử ở ticket 02 xanh, và **số ca bằng đúng số ca đã ghi** ở Comments ticket đó — không ca nào bị xoá hay bị bỏ qua
- [x] Không lớp nào trong `billing/calc` phụ thuộc Spring, JPA, hay cơ sở dữ liệu. ArchUnit canh việc này
- [x] Không trường nào kiểu `double`/`float`/`Double`/`Float`. ArchUnit canh việc này
- [x] Tên lớp khớp `Doc/diagrams-v2/11-class-billing-calc.mmd`
- [x] Phép chia duy nhất trong toàn gói là ở BR-06 (chia tiền phòng theo ngày), và nó **nói rõ làm tròn thế nào**
- [x] Bộ kiểm thử chạy dưới vài giây

**Nếu một ca kiểm thử ở ticket 02 hoá ra sai.** Chuyện này có xác suất xảy ra thật, và nó là **kết quả tốt** — nghĩa là việc viết kiểm thử trước đã làm bật ra một câu hỏi nghiệp vụ chưa ai trả lời. Cách xử lý: ghi vào Comments ticket này *ca nào, sai chỗ nào, và tài liệu nói gì*, rồi **hỏi người phụ trách nghiệp vụ**. Đừng tự sửa ca kiểm thử cho khớp với mã vừa viết — làm thế là biến kiểm thử thành bản sao của cài đặt, và nó sẽ xanh mãi mãi kể cả khi cả hai cùng sai.

## Comments

- Task 3 đã cài đặt phần pure `billing/calc`; 53/54 ca billing xanh, còn 1 ca BR-02b không khớp.
- Ca `FR_INV_02_BR_02b_accumulatesAcrossFiveGovernmentTiersForLargeConsumption` đang kỳ vọng `2.166.800` cho 750 kWh.
- Nguồn sự thật tại `Doc/PRJ1_Phan-tich-yeu-cau_Chung-cu-mini.md` mục BR-02b quy định 5 bậc: 1.984 / 2.380 / 2.998 / 3.571 / 3.967 đ/kWh. Theo công thức cộng dồn: `100×1.984 + 100×2.380 + 200×2.998 + 300×3.571 + 50×3.967 = 2.305.650`.
- Hai ca biên 100 và 101 kWh, cùng các ca hộ quy đổi và không xác định số người, đều khớp công thức. Đây là mâu thuẫn dữ liệu giữa test và tài liệu, không phải lỗi có thể tự sửa an toàn.
- Tạm dừng trước khi đánh dấu ticket done và trước khi nối database/API. Cần người phụ trách nghiệp vụ xác nhận giữ `2.166.800` hay sửa mốc kỳ vọng theo bảng tài liệu (`2.305.650`).
- Đã được người phụ trách xác nhận: biểu giá hiện hành là 6 bậc theo QĐ 1279, hiệu lực từ 10/05/2025; biểu giá 5 bậc theo QĐ 14 là phiên bản tương lai, chỉ áp dụng từ lần điều chỉnh giá bán lẻ điện bình quân kế tiếp sau 29/05/2025.
- Vì vậy, ca 750 kWh dùng biểu giá hiện hành và kỳ vọng `2.285.500`; giữ riêng fixture/test cho biểu giá 5 bậc tương lai. Việc chọn biểu giá phải theo ngày hiệu lực để không làm thay đổi hoá đơn lịch sử.
- Task 3 hoàn tất sau khi xử lý review: dòng làm tròn dùng đúng tổng trước làm tròn để các dòng khớp tổng hoá đơn; bối cảnh thuần nhận số lượng dịch vụ theo từng `DichVu`; `MayTinhHoaDon` chọn chiến lược từ danh sách được tiêm. Bộ billing cuối cùng có 56 ca (54 ca gốc và 2 ca hồi quy mới), ArchUnit xanh, full backend xanh.
- Review vòng sửa 1: cả 3 finding Important đã được xác nhận ADDRESSED, không có breakage Critical/Important mới. Minor deferred: xử lý tiêu thụ vượt tier cuối và hành vi mặc định của constructor tương thích cũ sẽ được xem xét khi nối persistence ở các task sau.
