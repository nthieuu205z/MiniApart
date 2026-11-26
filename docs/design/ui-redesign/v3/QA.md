# QA · V3

Ngày đo: 26/11/2026. Máy đo: Chrome headless qua [tools/shoot.mjs](tools/shoot.mjs) (chụp + đo trong trang) và [tools/smoke.mjs](tools/smoke.mjs) (bấm thử tự động). Số chi tiết từng ảnh: [screens/qa.json](screens/qa.json).

Con số dưới đây là em tự đo và tự khai. Chưa có người thứ hai kiểm.

## Phép đo máy

| Tiêu chí | Ngưỡng | Kết quả trên 48 ảnh |
|---|---|---|
| Cuộn ngang | 0 px | 0 ở cả 48 |
| Vùng chạm | ≥ 44 px ở 390 và ở màn Người thuê, Thợ; ≥ 36 px ở máy tính | 894 vùng chạm đã đo, 0 dưới ngưỡng |
| Cỡ chữ | ≥ 13 px; Người thuê, Thợ ≥ 16 px | 4.358 đoạn chữ đã đo, 0 dưới ngưỡng |
| Tương phản chữ | ≥ 4,5:1 | thấp nhất 5,83 |
| Nút chính | ≤ 1 mỗi màn | tối đa 1; 14 ảnh có 0 (màn chỉ đọc và lớp nổi không có việc ghi) |
| Tiêu đề h1 | đúng 1 | 1 ở cả 48 |
| Font | IBM Plex Sans nạp được, có dấu tiếng Việt và ₫ | đạt ở cả 48 |
| Bấm thử tự động | không lỗi JS, không màn trắng | đi 2.500 địa chỉ, 0 lỗi JS, 0 màn trắng |
| Lint taste-skill (chế độ app) | 0 FAIL | 0 FAIL, 7 cảnh báo (bóng của lớp nổi, dấu gạch cho ô thiếu dữ liệu) |

Cách đo có giới hạn: vùng chạm của ô đánh dấu tính theo nhãn bọc nó; đường dẫn nằm trong câu chữ không tính là vùng chạm; chữ trong nhãn "minh hoạ / cần backend" được miễn ngưỡng 16 px ở máy tính nhưng vẫn ≥ 13 px.

## Xem bằng mắt

Em mở ảnh ra xem theo ba lượt và sửa giữa các lượt. Đã mở ở độ phân giải đủ đọc chữ: 01, 02, 03, 04, 07, 09, 10, 13, 14, 16, 17, 20, 32, 34, 35, 36 (1440) và cả 18 ảnh 390. Các ảnh 05, 06, 11, 12, 15, 18, 19, 30, 37, 38 xem ở dạng ghép thu nhỏ một nửa, đủ thấy bố cục, không đủ soi từng chữ. Ảnh 31, 33 chỉ xem lượt đầu (bản cắt), chưa mở lại sau lần sửa cuối. Ảnh 08 chưa mở riêng; nó cùng khuôn với ảnh 09 đã xem.

Lỗi tìm thấy bằng mắt và đã sửa (phép đo máy không bắt được cái nào):

| Lỗi | Sửa |
|---|---|
| Mọi bảng đều chữ đậm 600 vì lớp `.b` (đậm) trùng tên với `table.b` | đặt lại độ đậm cho bảng |
| Một khối đen trôi giữa trang (thông báo đáy không ẩn) | `[hidden]` luôn ẩn |
| Bảng nợ trên điện thoại vỡ: tên xuống 4 dòng | điện thoại dùng danh sách thay bảng |
| Số lớn trên điện thoại chồng lên nhau ("15.367.000 ₫68%") | ô phụ dùng cỡ 19 |
| Tên toà cắt mất số phòng ("Bình Minh Riverside · p…") | đưa số phòng lên trước |
| Chip lọc đang chọn tô đen, giống nút chính thứ hai | đổi sang viền đậm nền xám |
| Màn đăng nhập chia đôi với nửa đen lớn, kiểu mẫu có sẵn | làm lại: một khối giữa trang |
| Một đường kẻ dọc lạc giữa màn điện thoại | bỏ nền kẻ, dùng viền của cột nội dung |
| Giá điện ghi "3.800 ₫ / tháng" | sửa thành "/ kWh" |
| Hộp hỏi lại ghi cứng "Gửi 8 hoá đơn" trong khi bảng là 9 | lấy số từ dữ liệu |
| Dòng nợ của người thuê xuống 3 dòng | chỉ còn "trễ 52 ngày" |

## Phép thử 3 giây: mở lên có biết việc tiếp theo không

| Màn | Thấy gì trước | Việc kế tiếp | Đạt |
|---|---|---|---|
| Chủ · Hôm nay | 173.450.000 ₫ đỏ, rồi danh sách người nợ kèm nút gọi | gọi hoặc nhắc người đầu danh sách | đạt |
| Chủ · Tiền | tổng nợ theo toà, bảng nợ theo người | Ghi thu tiền | đạt |
| Chủ · Sự cố | "Cần quyết 7", việc đầu đã mở sẵn báo giá | Duyệt 450.000 ₫ | đạt |
| Chủ · Hợp đồng 303 | dải vàng "hết hạn 08/12, còn 12 ngày" | Gia hạn hợp đồng | đạt |
| Chủ · Báo cáo | đã thu, còn nợ, biểu đồ | không có việc, chỉ đọc | đạt (màn đọc) |
| Quản lý · Hôm nay | dải đỏ "tháng 11 đang trễ", thanh 4 bước | Ghi 4 công tơ còn thiếu | đạt |
| Quản lý · Tháng 11 bước 1 | hai dòng đỏ đầu bảng | gõ số, Lưu chỉ số | đạt |
| Quản lý · Tạo hợp đồng | ba khối đánh số, bên phải "Còn thiếu" | điền người thuê | đạt |
| Người thuê · Cần trả | 7.580.000 ₫ | Trả 7.580.000 ₫ | đạt |
| Người thuê · Trả tiền | mã QR | quét | đạt (cần backend) |
| Thợ · Việc của tôi | "Làm trước: Chiếu sáng · phòng 201" | Gọi khách hoặc Gửi báo giá | đạt |
| Chủ · Hồ sơ toà | sơ đồ phòng | không rõ việc kế tiếp | **chưa đạt hẳn**: là màn tra cứu, cột "Cần chú ý" bên phải mới là việc |
| Chủ · Người thuê (danh sách) | bảng 27 dòng | không có | **chưa đạt**: mới là bảng, chưa sắp theo việc |

## Kiểm chống "giống app cũ" và "mẫu AI"

- Thẻ rỗng: không còn khối nào chỉ để giới thiệu tính năng. Khối rỗng thật (Sự cố của phòng, Ghi chú liên hệ) có một câu.
- Hộp lồng hộp: còn một chỗ, hộp hỏi lại nằm trong khối ở màn Trạng thái, vì đó là mẫu trưng bày.
- Gradient: chỉ ô gạch chéo của phòng đang sửa.
- Nhiều nút chính: không.
- Chữ xám nhạt: chữ phụ 8,19:1.
- Khoảng trắng thừa: màn Quản lý · Hôm nay còn trống nửa dưới ở 900 px vì chỉ có 6 việc. Em để vậy, không bịa nội dung lấp chỗ.
- Còn giống app cũ: cấu trúc menu trái + nội dung, hàng 4 số đầu trang. Em giữ vì đó là quy ước đúng; khác ở nội dung của từng ô.

## Dữ liệu

- Chữ và số lấy từ 123 lệnh GET thật ([tools/fetch.py](tools/fetch.py) → [tools/gen-data.py](tools/gen-data.py) → `prototype/data.js`). Tổng nợ 173.450.000 ₫, 15 người, 60 hoá đơn khớp `/api/dashboard/chu`. Báo cáo có phép tự kiểm "đã gửi = đã thu + còn nợ".
- **Lệch chưa giải được:** gọi `/api/dashboard/chu` cho 01–26/11/2026 thì `thucThu = 0` còn `daThuHopDong = 15.367.000`. Trang đầu của Chủ ghi "Hoá đơn tháng 11 đã thu 15.367.000 ₫" theo hoá đơn, không phải theo tiền thực nhận trong tháng. Câu hỏi "tháng này thu được bao nhiêu" vì thế mới trả lời được một nửa.
- Thứ **không có trong demo**, gắn nhãn "minh hoạ" trên màn: báo giá 3 dòng 450.000 ₫ của thợ; ngân hàng, số tài khoản, mã QR; bước 2, 3, 4 của tháng 11 (dữ liệu thật đang ở bước 1); hoá đơn nháp tháng 11 (em tính từ chỉ số thật và đơn giá thật, khớp hoá đơn tháng 10 của phòng 101 là 3.790.000 ₫).
- Màn Hồ sơ người thuê dùng điện nước của phòng 101 cho mọi người (có ghi chú trên màn) vì tài khoản Chủ không có API tiêu thụ theo phòng trong bộ đã lấy.

## Chưa kiểm

1. Chưa ai ngoài em bấm thử. Chưa thử với một chủ nhà thật 45–60 tuổi.
2. Chỉ đo ở 1440 và 390. Chưa đo 1024, 768, 360, chưa xoay ngang.
3. Chưa thử trình đọc màn hình. Có `aria-label` cho nút biểu tượng và một h1 mỗi màn, nhưng thứ tự Tab và bẫy tiêu điểm trong hộp thoại chưa làm trong prototype.
4. Chưa thử phóng chữ hệ thống 200%.
5. Chưa thử dưới nắng thật cho màn Thợ.
6. Chỉ chụp bằng Chrome. Chưa mở Safari trên iPhone.
7. Prototype không ghi dữ liệu: mọi nút ghi chỉ hiện thông báo "Bản xem thử".
8. Bảng ghi chỉ số liệt kê 11/12 phòng (thiếu 402) vì API chỉ số chỉ trả 9 phòng đang thuê, trong khi số "20/24 công tơ" lấy từ bảng điều khiển. Hai nguồn này vốn lệch nhau ở backend.
9. Số chạm "hiện tại" ở các việc phải bấm nút ghi là số tối thiểu, có ghi rõ trong [02-workflow.md](02-workflow.md).
