# 05: Hợp đồng và cảnh báo hết hạn · FR-POR-07 · BR-14

**What to build:** Màn `#36` — thông tin hợp đồng của người thuê, kèm cảnh báo khi còn dưới 30 ngày đến hạn.

**Blocked by:** 02

**Status:** ready-for-agent

## `BR-14` và ghi chú `CR-012` — đừng lưu thành trạng thái

`BR-14`: *"Hợp đồng có `Ngày kết thúc − Ngày hiện tại ≤ 30 ngày` xuất hiện trên bảng nhắc việc của quản lý và trên cổng người thuê."*

Ghi chú **CR-012** nói rõ cách cài, và lý do:

> *"'Sắp hết hạn' **không phải một trạng thái của hợp đồng** mà là một cách nhìn hợp đồng đang hiệu lực dưới góc độ thời gian: giá trị của nó thay đổi theo ngày ngay cả khi không ai động vào dữ liệu. Vì vậy nó được thực hiện bằng **điều kiện truy vấn**, không lưu thành một giá trị trong cột trạng thái. Nếu lưu, hệ thống sẽ cần một tác vụ chạy hằng ngày quét lại toàn bộ hợp đồng, và tác vụ đó lỗi một hôm thì dữ liệu sai mà không ai biết."*

`slice-02 · 08` đã cài đúng cách này cho phía quản lý — có `HopDong.sapHetHan()` và `soNgayConLai()`, và test *"danh sách sắp hết hạn tự đổi theo clock không cần tác vụ nền"*.

**Dùng lại. Không viết luật 30 ngày lần thứ hai.**

## Bốn trạng thái hợp đồng người thuê thấy

`Doc/UX/03-nguoi-thue.md` mục 6 đặc tả bốn ca. Mỗi ca là một câu khác nhau, không phải một câu có tham số:

| Ca | Ý |
|---|---|
| Còn xa hạn | Thông tin bình thường, không cảnh báo |
| **Còn dưới 30 ngày** | Cảnh báo kèm **số ngày cụ thể**, không nói chung chung |
| Đã hết hạn nhưng chưa thanh lý | Trạng thái cần hành động |
| **Đã thanh lý** | Chỉ xem lại — ruling 3A cho phép |

Cảnh báo phải mang con số: *"Hợp đồng còn 12 ngày"*, không phải *"Hợp đồng sắp hết hạn"*. Đây là quy tắc microcopy của `Doc/UX/00-nen-tang-ux.md` — mọi câu quan trọng đều có số liệu.

## Ruling 3A: đã thanh lý vẫn xem được

Người thuê đã thanh lý **vẫn mở được** hợp đồng cũ của chính mình. Lý do đầy đủ ở spec slice và ở ticket 01 — tóm tắt: ticket `slice-05 · 09` sinh hoá đơn quyết toán **sau** khi thanh lý, cắt quyền xem lúc đó là chặn người thuê xem chính hoá đơn họ phải trả.

## Không hiện tiền cọc như một dòng hoá đơn

`BR-07` mở đầu: *"Tiền cọc thu một lần khi ký hợp đồng, **không** là một dòng trong hoá đơn kỳ, mà là một khoản mục riêng."*

Nếu màn này hiện tiền cọc thì hiện như **thông tin hợp đồng**, tách khỏi mọi con số hoá đơn. Bảng `GIAO_DICH_COC` là việc của `slice-05 · 08` — nếu chưa có thì hiện số thoả thuận trên hợp đồng và **nói rõ đó là số thoả thuận**, không phải số đã thu.

## Hoàn thành khi

- [ ] Hiện thông tin hợp đồng: phòng, ngày bắt đầu, ngày kết thúc, giá thuê, dịch vụ áp dụng
- [ ] **Cảnh báo khi còn dưới 30 ngày, kèm số ngày cụ thể**
- [ ] Bốn ca ở bảng trên là **bốn câu khác nhau**
- [ ] Cảnh báo tính bằng **điều kiện truy vấn**, dùng lại `sapHetHan()`/`soNgayConLai()` — **không cột trạng thái, không tác vụ nền**
- [ ] Test bằng **đồng hồ đẩy được**: đẩy tới ngày thứ 30 và 31, cảnh báo bật/tắt đúng, **không chạy tác vụ nào**
- [ ] Hợp đồng **đã thanh lý vẫn mở được** (ruling 3A)
- [ ] Tiền cọc — nếu hiện — tách khỏi số hoá đơn, ghi rõ là thoả thuận hay đã thu
- [ ] Hợp đồng của người khác → 403 (kế thừa ticket 01)
- [ ] Tên test mang mã `FR-POR-07` và `BR-14`

## Comments
