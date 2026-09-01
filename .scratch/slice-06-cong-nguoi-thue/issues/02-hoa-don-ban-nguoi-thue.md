# 02: Hoá đơn bản người thuê · FR-POR-02 · FR-POR-06 · BR-15

**What to build:** Màn `#33` — hoá đơn chi tiết tới mức **cộng lại được bằng tay**, kèm ảnh công tơ của đúng kỳ.

**Blocked by:** 01

**Status:** ready-for-agent

## Đây là màn quyết định niềm tin

`Doc/UX/03-nguoi-thue.md` gọi `#33` như vậy, và lý do rất cụ thể: người thuê mở hoá đơn ra để trả lời đúng một câu — ***"sao tháng này đắt hơn tháng trước"***.

Trả lời được thì hết tranh cãi. Không trả lời được thì người thuê gọi điện cho quản lý, và cả hệ thống mất giá trị.

## `FR-POR-02` đòi gì

> *"chi tiết **từng khoản mục** kèm chỉ số đầu kỳ, cuối kỳ, mức tiêu thụ, đơn giá, thành tiền"*

Cộng thêm, theo bản chất phép tính đã cài ở Slice 04:

- **Từng bậc thang** phải hiện riêng — điện bậc thang mà chỉ hiện tổng thì không cộng lại được
- **Dòng làm tròn** phải hiện, kể cả khi âm

## Dòng làm tròn âm — không được giấu, không được đổi dấu

`BR-15` ghi rõ làm tròn là **nửa lên đến 1.000 đồng**, khác *"làm tròn lên"*, nên phần chênh lệch **có thể âm**:

> *"1.887.200 đồng: quy tắc nửa lên cho 1.887.000 đồng, còn làm tròn lên cho 1.888.000 đồng."*

Một dòng *"Làm tròn: −200 đ"* trông như lỗi nếu không giải thích. Slice 04 đã cài đúng và có test. Ticket này phải **hiển thị tử tế**: giữ nguyên dấu, và có câu giải thích ngắn cạnh dòng đó.

Đổi dấu cho đẹp hoặc ẩn dòng đi là làm hỏng chính thứ `FR-POR-02` yêu cầu.

## Dùng lại đường dữ liệu, không viết đường thứ hai

`HoaDonChiTietService` đã trả về **đúng bộ dữ liệu này** cho phía quản lý — hand-recomputable, có bậc thang, có dòng làm tròn, có liên kết ảnh công tơ ký hạn 15 phút.

Ticket này **dùng lại nó**, chỉ đổi phần kiểm quyền sang nhánh người thuê. Hai đường tính là hai chỗ để lệch nhau, và hoá đơn quản lý xem khác hoá đơn người thuê xem là lỗi tệ nhất slice này có thể tạo ra.

Định dạng tiền và ngày cũng dùng lại (`NFR-USA-06`: `1.888.000 đ`, `dd/MM/yyyy`).

## Ảnh công tơ — `FR-POR-06`

Xem được ảnh công tơ **của đúng kỳ tương ứng**, qua liên kết ký hạn 15 phút. Không có đường dẫn tĩnh nào (quy ước 5, `CR-013`).

`Doc/UX/03-nguoi-thue.md` ghi màn này có hai trạng thái ảnh: **đang lấy** và **hết hạn**. Liên kết hết hạn phải xin lại được, không bắt tải lại cả trang.

## In được — không phải màn riêng

`Doc/UX/03-nguoi-thue.md` luồng số 10: *"In → Bản in A4 — **chế độ in của `#33`**, không phải màn riêng"*.

Dùng CSS in. Không dựng màn thứ hai, không sinh PDF ở đây — PDF là `FR-INV-09`, ticket `slice-05 · 07`.

## Hoàn thành khi

- [ ] Mỗi khoản hiện đủ: tên, chỉ số đầu, chỉ số cuối, mức tiêu thụ, đơn giá, thành tiền
- [ ] **Từng bậc thang hiện riêng** — cộng tay ra đúng tổng
- [ ] **Dòng làm tròn hiện, giữ nguyên dấu kể cả âm**, kèm câu giải thích ngắn
- [ ] **Test đối chiếu:** mọi con số ở màn người thuê **khớp đúng** con số `HoaDonChiTietService` trả cho quản lý
- [ ] Ảnh công tơ đúng kỳ, qua liên kết ký 15 phút; hết hạn thì xin lại được tại chỗ
- [ ] Định dạng tiền và ngày dùng lại đường đã có, **không viết hàm thứ hai**
- [ ] In A4 bằng chế độ in của chính màn này, **không màn riêng, không PDF**
- [ ] Hoá đơn của người khác → 403 (kế thừa ticket 01)
- [ ] Tên test mang mã `FR-POR-02`, `FR-POR-06`, `BR-15`

## Comments
