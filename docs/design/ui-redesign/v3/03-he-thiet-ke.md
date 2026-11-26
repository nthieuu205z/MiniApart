# 03 · Hệ thiết kế V3 "Sổ cái"

Một câu: **khung không màu, tiền và số bằng mực đen, màu chỉ xuất hiện khi có chuyện.** Người dùng mở MiniApart để đọc số và làm việc kế tiếp, nên giao diện phải lùi lại như trang sổ.

Em bỏ toàn bộ token, font và component của v1/v2. Nguồn sống của hệ này là [prototype/v3.css](prototype/v3.css) (một file, 28 KB, không phụ thuộc gì).

## 1. Font

### So sánh thật
8 ứng viên, cùng một nội dung tiếng Việt và số tiền, đo trong Chrome thật: [font-compare/index.html](font-compare/index.html), ảnh [so-sanh-font.png](font-compare/so-sanh-font.png), số đo [measure.json](font-compare/measure.json). Đơn vị: px ở cỡ chữ 100 px.

| Font | Cao chữ thường | Dấu chồng trên ("Ễ") | Dấu dưới ("ự") | Số thẳng cột mặc định | Câu mẫu 14 px dài | Có ₫ |
|---|---|---|---|---|---|---|
| Inter (đang dùng) | 54,6 | 108,7 | 20,6 | không, phải bật | 440 | có |
| Be Vietnam Pro | 53,0 | 113,7 | 22,7 | **không có số thẳng cột** | 453 | có |
| **IBM Plex Sans** | 51,6 | 105,4 | **16,9** | **có** | **412** | có |
| Source Sans 3 | 48,6 | 94,3 | 20,6 | có | 387 | có |
| Roboto | 52,8 | 98,7 | 17,1 | có | 411 | có |
| Noto Sans | 53,6 | 104,8 | 17,6 | có | 442 | có |
| Public Sans | 51,7 | 104,2 | 18,0 | không, phải bật | 430 | có |
| Geist | 53,0 | 103,8 | 15,0 | không, phải bật | 424 | có |

### Tôi chọn IBM Plex Sans (400, 500, 600)
- **Số thẳng cột ngay từ đầu.** Không phải nhớ bật `tnum` ở từng chỗ. Cột tiền luôn thẳng. Đây là lỗi lặp lại của app hiện tại.
- **Dấu dưới gọn** (16,9; trong bảng chỉ Geist thấp hơn). Hàng tiếng Việt không chật ở dòng cao 22 px.
- **Hẹp hơn Inter 6%** mà chữ thường vẫn cao (51,6). Tên toà, tên người ít bị cắt trên điện thoại.
- **Có cá tính vừa đủ.** Nét cắt vuông kiểu máy chữ kỹ thuật, hợp với sổ sách, không lẫn với hàng nghìn app Inter.

Vì sao loại các font khác:
- **Be Vietnam Pro**: không có số thẳng cột (đo ra `tabularEqual = false`), dấu cao nhất bảng. Đẹp cho tiêu đề, hỏng cho bảng tiền.
- **Source Sans 3**: gọn nhất nhưng chữ thường thấp (48,6), ở 13 px nhỏ hẳn so với các font khác.
- **Roboto**: số đo tốt ngang Plex. Loại vì là mặt chữ mặc định của Android, sản phẩm không còn gương mặt riêng.
- **Noto Sans**: rộng ngang Inter (442), không giải được chuyện cắt chữ.
- **Geist, Public Sans**: số không thẳng cột mặc định, lặp lại vấn đề của Inter.

### Giấy phép và đóng gói
- SIL Open Font License 1.1, dùng thương mại và tự host được. File giấy phép: [prototype/fonts/LICENSE-IBM-Plex-Sans-OFL.txt](prototype/fonts/LICENSE-IBM-Plex-Sans-OFL.txt).
- Nguồn: gói npm `@fontsource/ibm-plex-sans` 5.3.0. Lấy 9 file woff2: 3 độ đậm × 3 nhóm ký tự (latin, latin-ext, vietnamese). Tổng 164 KB, có `SHA256SUMS` để đối chiếu.
- Khai bằng `@font-face` kèm `unicode-range`, trình duyệt chỉ tải nhóm ký tự trang cần. Không gọi mạng ngoài. `font-display: swap`.
- Khi đưa vào app: chép 9 file vào `frontend/src/assets/fonts/`, thay khối `@font-face` Inter. Không thêm phụ thuộc lúc chạy.
- Chuỗi dự phòng: `"IBM Plex Sans", system-ui, sans-serif`.

## 2. Thang chữ

Ba mật độ, cùng một bộ tên biến. Chỉ 5 cỡ mỗi mật độ, không có cỡ lẻ.

| Vai | Thân | Phụ | Tiêu đề khối | Tiêu đề trang | Số lớn | Hàng | Ô, nút |
|---|---|---|---|---|---|---|---|
| Làm việc: Quản lý, Chủ, Quản trị trên máy tính | 15/22 | 13/18 | 17 | 22 | 28 | 48 | 36 |
| Chủ nhà trên điện thoại (`.d-chu-m`) | 16/24 | 14/20 | 18 | 22 | 30 | 60 | 44 |
| Thoáng: Người thuê, Thợ (`.d-thoang`) | 17/26 | 16/22 | 20 | 24 | 38 | 64 | 52 |

Độ đậm: 400 cho chữ thân, 500 cho tên và nhãn cần nổi, 600 **chỉ** cho tiền, tiêu đề và nút chính. Không dùng 700. Không chữ IN HOA. Không chữ nghiêng.

## 3. Khoảng cách, lưới, bo góc, bóng

- Bước khoảng cách: 4, 8, 12, 16, 24, 32. Lề trong của khối là 16. Khe nhỏ bên trong một thành phần (biểu tượng với chữ, hai dòng của một hàng) dùng thêm 6 và 10.
- Máy tính: menu trái 224 px, nội dung tối đa 1.152 px, lưới 12 cột, khe 24. Bố cục hay dùng là 8 + 4 (việc chính + bối cảnh).
- Điện thoại (≤ 760 px): một cột, thanh dưới 4–5 mục, nút chính dính đáy.
- Bo góc: 8 cho khối, 6 cho ô và nút. Không bo 16–24 như app cũ.
- Bề mặt phẳng, tách bằng đường 1 px. **Không có bóng ở trạng thái nghỉ.** Bóng chỉ cho thứ nổi thật: menu, hộp thoại, ngăn bên, thông báo, nút dính đáy.
- Không gradient trang trí. Ngoại lệ duy nhất là ô gạch chéo của phòng đang sửa, vì đó là dữ liệu.

## 4. Màu

Nền và chữ:

| Biến | Mã | Dùng cho | Tương phản |
|---|---|---|---|
| `--nen` | #f4f5f7 | nền trang | |
| `--mat` | #ffffff | mặt khối | |
| `--muc` | #14181d | chữ chính, nút chính | 17,82 trên trắng |
| `--phu` | #47505a | chữ phụ | 8,19 trên trắng · 7,51 trên nền |
| `--mo` | #5c6670 | chữ gợi ý trong ô | 5,85 trên trắng |
| `--vien-o` | #868f99 | viền ô nhập, viền nút | 3,28 (đạt mức 3:1 cho viền) |

Màu ngữ nghĩa, mỗi màu một nghĩa, không dùng chéo:

| Nghĩa | Chữ | Nền nhạt | Chữ trên trắng | Chữ trên nền nhạt |
|---|---|---|---|---|
| Nợ, lỗi, khẩn | #b3261e | #fdecea | 6,54 | 5,72 |
| Cảnh báo, sắp đến hạn | #8a4b00 | #fff3d6 | 6,80 | 6,17 |
| Xong, đã trả | #1f6b43 | #e2f3e9 | 6,48 | 5,62 |
| Đang xử lý, đường dẫn | #1b56b0 | #e6eefb | 6,99 | 5,99 |

Mọi cặp ≥ 4,5:1. Số thấp nhất đo trên 48 ảnh là 5,83.

Quy tắc dùng màu:
- **Nút chính màu mực đen**, không phải màu thương hiệu. Tôi chọn vậy để màu còn nguyên sức báo động: trên một màn bình thường không có điểm màu nào, thấy đỏ là có nợ.
- Màu đặt lên **dữ liệu** (số tiền nợ, chấm trạng thái, ô phòng), không đặt lên khung, tiêu đề, biểu tượng.
- Số tiền nợ màu đỏ. Số tiền thường màu mực. Không tô xanh lá cho tiền đã thu.
- Trạng thái lặp lại trên mọi dòng thì không gắn nhãn; chỉ dòng khác thường mới có nhãn.
- Không bao giờ chỉ dùng màu: luôn kèm chữ ("nợ 7,6 triệu") hoặc hoa văn (gạch chéo).

## 5. Biểu tượng

Nét 1,6 px, khung 24, cỡ hiển thị 18–20, cùng màu chữ đi kèm. Vẽ sẵn trong mã, không tải bộ ngoài. Biểu tượng chỉ đi cùng chữ; nút chỉ có biểu tượng (gọi, đóng, tìm) phải có `aria-label`. Không đặt biểu tượng trong vòng tròn màu.

## 6. Component

| Thành phần | Quy định |
|---|---|
| **Nút** | Bốn loại: chính (mực đen), thường (viền), chữ (xanh, cho đường đi phụ), nguy (viền đỏ). Chữ trên nút là động từ + đối tượng + số: "Ghi thu 7.580.000 ₫", "Gửi 9 hoá đơn". Không "OK", không "Xác nhận". |
| **Bảng** | Không sọc, đường kẻ 1 px. Số căn phải, chữ căn trái. Dòng cộng ở cuối. Tiêu đề cột chữ phụ 13 px, không đậm. Cả dòng bấm được thì mở hồ sơ. Trên điện thoại bảng nợ đổi thành danh sách. |
| **Ô nhập** | Nhãn luôn ở trên ô, không dùng chữ mờ thay nhãn. Gợi ý và lỗi nằm dưới ô. Tiền căn phải. Giá trị hay dùng điền sẵn (ngày hôm nay, tổng nợ, cọc 2 tháng). |
| **Chip lọc** | Kèm số đếm. Cái đang chọn viền đậm nền xám, không tô đen để khỏi tranh với nút chính. |
| **Ngăn bên** | Cho việc ghi nhanh mà vẫn cần thấy danh sách phía sau (ghi thu, thông báo). Rộng 440. Trên điện thoại chiếm cả màn. |
| **Hộp thoại** | Chỉ cho việc không sửa lại được (khoá chỉ số, gửi hoá đơn, thanh lý) và việc soạn ngắn (nhắc nợ). Nút hỏi lại ghi rõ việc: "Chưa, xem lại" / "Khoá chỉ số". |
| **Thông báo đáy** | 6 giây, có Hoàn tác khi làm được. Không chặn thao tác. |
| **Rỗng** | Một câu nói vì sao rỗng và một việc làm tiếp. Không hình minh hoạ. |
| **Lỗi tải** | Báo ngay trong khối bị lỗi, kèm giờ của số liệu gần nhất và nút Tải lại. |
| **Đang tải** | Khung xương đúng hình khối sẽ hiện, không nhảy bố cục. |
| **Mất mạng** | Dải đỏ đầu trang, giữ số liệu cũ kèm giờ, khoá nút ghi. |
| **Sơ đồ phòng** | Gương mặt riêng của sản phẩm: mỗi phòng một ô, xếp theo tầng. Đỏ nhạt là nợ, viền đứt là trống, gạch chéo là đang sửa. Bản thu nhỏ đi kèm tên toà ở mọi danh sách toà. |
| **Thanh 4 bước của tháng** | Luôn kèm số thật dưới tên bước. Bấm bước nào mở bước đó. |

## 7. Tiền, ngày, số

- Tiền: `7.580.000 ₫`. Dấu chấm ngăn nghìn, cách một khoảng rồi tới ₫. Ký hiệu ₫ nhỏ hơn và nhạt hơn con số. Không viết "VNĐ", "đ", "đồng".
- Số 0 thật in `0 ₫`. Thiếu dữ liệu in gạch `—` màu xám. Không để ô trống.
- Rút gọn chỉ ở chỗ chật và có số đủ ngay cạnh: "nợ 7,6 triệu" trên ô phòng.
- Ngày: `26/11/2026`. Trong danh sách cùng năm: `26/11`. Không viết "2026-11-26", không viết tên tháng tiếng Anh.
- Khoảng thời gian nói theo cách người ta nói: "còn 12 ngày", "trễ 144 ngày", "hết hạn 08/12".
- Tháng: "Tháng 11/2026". **Không dùng chữ "kỳ"** ở bất kỳ màn nào của Chủ nhà, Người thuê, Thợ.
- Số điện thoại: `0999 100 001`, bấm được.
- Điện nước: `384 → 480 · 96 kWh`. Luôn hiện cả số cũ, số mới và lượng dùng.
- Phần trăm không lẻ: `68%`.
- Mã nội bộ (mã hoá đơn, mã sự cố) không hiện ở danh sách. Chỉ hiện ở dòng phụ của màn chi tiết để đọc qua điện thoại khi cần.

## 8. Mật độ theo vai trò

- **Quản lý**: dày. Hàng 48, bảng 12 phòng vừa một màn 900 px, gõ liên tục bằng bàn phím. Phím tắt: Ctrl K tìm, Tab và Enter trong bảng chỉ số, Esc đóng lớp nổi.
- **Chủ nhà**: vừa. Trên máy tính dùng chung thang với Quản lý nhưng mỗi khối ít dòng (6 người nợ nhiều nhất, 7 việc cần quyết). Trên điện thoại chữ 16, hàng 60, nút gọi 44.
- **Người thuê, Thợ**: thoáng. Chữ thân 17, chữ phụ 16, nút 52, một việc chính mỗi màn. Thợ đọc được dưới nắng: chữ mực đen trên trắng, không chữ xám cho thông tin cần đọc.

## 9. Một nút chính mỗi màn

- Mỗi màn có nhiều nhất **một** nút nền đen. Đo trên 48 ảnh: không ảnh nào quá một.
- Nút chính theo dữ liệu: Quản lý hôm nay còn thiếu công tơ thì nút là "Ghi 4 công tơ còn thiếu"; ghi đủ rồi thì thành "Khoá chỉ số tháng 11".
- Màn chỉ để đọc (Hôm nay của Chủ, Báo cáo, Lịch sử) **không có** nút chính. Không cố nhét cho đủ.
- Việc phá huỷ (thanh lý, từ chối, trả việc) không bao giờ là nút chính.
- Việc lặp theo dòng (Gọi, Nhắc, Ghi thu) là nút thường.
- Trên điện thoại nút chính dính đáy, trên thanh điều hướng.

## 10. Tiếng nói

Nói như một người quản lý nhà cẩn thận nói với chủ nhà: ngắn, đủ chủ ngữ, có con số, không doạ, không xin lỗi thừa.

| Đừng viết | Hãy viết |
|---|---|
| Kỳ 07/2026 | Tháng 7/2026 |
| Chốt kỳ | Khoá chỉ số |
| Phát hành hoá đơn | Gửi hoá đơn |
| Thực thu | Đã thu |
| Tỷ lệ lấp đầy 75% | 27/36 phòng đang thuê |
| Công nợ | Còn nợ, Còn phải thu |
| Chủ sở hữu | Chủ nhà |
| Yêu cầu sửa chữa | Báo hỏng (người thuê), Sự cố (quản lý) |
| Phân công | Giao thợ |
| Xác nhận | động từ thật: Khoá chỉ số, Gửi 9 hoá đơn |
| Thao tác thành công | Đã ghi thu 1.895.000 ₫ của phòng 101 |
| Có lỗi xảy ra | Không tải được danh sách nợ. Số liệu gần nhất lúc 21:59. |
| Không có dữ liệu | Toà này chưa có sự cố nào trong tháng 11. |

Người thuê và thợ được gọi là "bạn". Chủ nhà và quản lý: câu không cần đại từ. Không dấu chấm than. Không biểu tượng cảm xúc.
