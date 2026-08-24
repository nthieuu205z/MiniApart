# 03: Cài đặt `billing/calc` cho tới khi mọi kiểm thử xanh · BR-01 → BR-09, BR-15

**What to build:** Cài đặt phần tính tiền cho tới khi toàn bộ bộ kiểm thử ở ticket 02 chuyển từ đỏ sang xanh. **Không sửa kiểm thử để làm cho nó xanh** — nếu một ca sai thì đó là phát hiện đáng giá, phải nêu ra và bàn, không phải sửa lặng lẽ.

**Cấu trúc theo sơ đồ lớp Chương 3.** `11-class-billing-calc.mmd` đã thiết kế sẵn hai tầng chiến lược lồng nhau: `ChienLuocTinhTien` (cách tính: theo chỉ số, cố định, theo đầu người, theo số lượng) nhân với `ChienLuocGia` (chế độ giá: đơn giá cố định, bậc thang). Mở sơ đồ ra đọc trước khi tự nghĩ cấu trúc mới.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Toàn bộ kiểm thử ở ticket 02 xanh, và **số ca bằng đúng số ca đã ghi** ở Comments ticket đó — không ca nào bị xoá hay bị bỏ qua
- [ ] Không lớp nào trong `billing/calc` phụ thuộc Spring, JPA, hay cơ sở dữ liệu. ArchUnit canh việc này
- [ ] Không trường nào kiểu `double`/`float`/`Double`/`Float`. ArchUnit canh việc này
- [ ] Tên lớp khớp `Doc/diagrams-v2/11-class-billing-calc.mmd`
- [ ] Phép chia duy nhất trong toàn gói là ở BR-06 (chia tiền phòng theo ngày), và nó **nói rõ làm tròn thế nào**
- [ ] Bộ kiểm thử chạy dưới vài giây

**Nếu một ca kiểm thử ở ticket 02 hoá ra sai.** Chuyện này có xác suất xảy ra thật, và nó là **kết quả tốt** — nghĩa là việc viết kiểm thử trước đã làm bật ra một câu hỏi nghiệp vụ chưa ai trả lời. Cách xử lý: ghi vào Comments ticket này *ca nào, sai chỗ nào, và tài liệu nói gì*, rồi **hỏi người phụ trách nghiệp vụ**. Đừng tự sửa ca kiểm thử cho khớp với mã vừa viết — làm thế là biến kiểm thử thành bản sao của cài đặt, và nó sẽ xanh mãi mãi kể cả khi cả hai cùng sai.
