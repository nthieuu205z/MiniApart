# QA bản xem trước phần công khai

Đo ngày 28/11/2026 trên Chrome headless, mở `prototype/index.html` bằng `file://`.

- Chạy lại: từ thư mục `landing/`, `node tools/shoot.mjs` → chụp 26 ảnh vào [screens/](screens/) và ghi số đo vào [screens/qa.json](screens/qa.json).
- Đo trên 17 lượt: Trang chủ, Tìm phòng, Chi tiết phòng, Đăng nhập ở 1440 / 1024 / 390, cộng các trạng thái không khớp, đã gửi lịch hẹn và menu điện thoại.
- Sau khi đo, em mở từng ảnh 1440 và 390 để xem bằng mắt, và xem phần đầu các màn ở 1024.

## Kết quả

| Tiêu chí | Kết quả | Số đo |
|---|---|---|
| Không cuộn ngang ở 390 | Đạt | `cuonNgang` = 0 trên cả 17 lượt, không phần tử nào tràn mép phải |
| Chữ thân ≥ 16px ở 390 | Đạt, có một ngoại lệ chủ ý | Chỉ còn ký hiệu ₫ (12,8 đến 13,6px), xem mục 1 bên dưới |
| Tương phản ≥ 4,5 | Đạt | Chữ trên nền phẳng: thấp nhất 4,75 (chữ trắng trên nút xanh Zalo), còn lại từ 6,11. Chữ trên ảnh: thấp nhất 4,75 |
| Vùng chạm ≥ 44px | Đạt | 0 phần tử nhỏ hơn 44px ở cả ba bề ngang |
| Tiếng Việt không chồng dấu ở tiêu đề | Đạt | Giãn dòng nhỏ nhất 1,06 (H1 trang chủ); đã xem bằng mắt các chữ ỗ, ữ, ẳ, ệ |
| `prefers-reduced-motion` | Đạt | Bật chế độ giảm chuyển động: 0 transition/animation còn chạy, 15/15 khối hiện ngay, cuộn không mượt hoá |
| Mỗi trang một `h1` | Đạt | `h1` = 1 trên cả 17 lượt |
| Lỗi console | Không có | 0 |
| Ảnh hỏng, ảnh thiếu `alt` | Không có | 0 / 0 |
| Font tải thật | Đúng | Be Vietnam Pro, Newsreader, IBM Plex Sans (không rơi về font hệ thống) |
| Chạy không cần mạng | Đúng | Mã nguồn không tham chiếu tài nguyên ngoài (đã grep); font và ảnh nằm trong `prototype/`. Chưa bật log mạng để đếm |

### Tương phản chữ trên ảnh

Đo bằng cách lấy điểm ảnh nền tệ nhất ngay dưới chữ trong ảnh chụp, không phải đo màu khai báo.

| Chữ | 1440 | 1024 | 390 |
|---|---|---|---|
| H1 hero | 7,26 | 7,24 | 8,25 |
| Câu phụ hero | 12,16 | 12,06 | 9,78 |
| Menu trên hero (mục thấp nhất) | 5,94 | 6,21 | 10,04 |
| "Sau khi đăng nhập" (dòng thấp nhất) | 5,13 | 4,75 | nền phẳng, 13,29 |

Chữ trên ảnh đều có lớp phủ tối phía sau. Ở 390, bảng "Sau khi đăng nhập" bỏ ảnh, dùng nền xanh sẫm.

## Ngoại lệ đã cân nhắc

1. **Ký hiệu ₫ nhỏ hơn 16px ở 390.** Ký hiệu ₫ được đặt bằng 80% cỡ con số đứng trước để số tiền nổi hơn. Con số và mọi chữ đọc khác đều từ 16px. Em giữ.
2. **Tiêu đề "Mỗi phòng đều ghi sẵn…" chiếm 3 dòng ở 1440, 4 dòng ở 390.** Đây là câu tuyên bố của trang, cố ý đặt to. Đã chặn ngắt dòng giữa "tiền thuê", "giá điện", "giá nước", "đến xem".
3. **Chữ phụ 14 đến 15px ở 1440 và 1024** (chú thích ảnh, dòng mô tả phòng, chân trang). Tiêu chí 16px áp cho điện thoại; ở 390 các chữ này đã lên 16px.
4. **Hàng chip lọc ở 390 vuốt ngang.** Chủ ý, để kết quả không bị đẩy xuống. Trang không cuộn ngang, chỉ riêng hàng chip.

## Đã sửa sau vòng xem ảnh đầu

- Chữ dưới 16px ở 390 (nhãn hero, mảnh hoá đơn, chú thích, chân trang) → nâng lên 16px; mảnh hoá đơn theo mật độ Thoáng của V3 (17/26).
- Link chân trang cao 36px → 44px.
- Bảng "Sau khi đăng nhập" trên ảnh: tương phản 3,65 → 4,75 trở lên (tăng lớp phủ).
- Menu trên hero: tăng lớp phủ phía trên, mục thấp nhất từ 4,83 lên 5,94.
- Cột form ở trang chi tiết: màn thấp thì dính theo đáy để nút Gửi luôn trong tầm nhìn.
- Khối "Phòng đang trống": hai thẻ ảnh nền chưa có `src` lúc mới tải (máy đo báo ảnh hỏng) → gán ảnh ngay từ đầu.
- Ước tính tháng khi có khoản bậc thang: đưa câu "chưa gồm …" lên cạnh tổng tiền thay vì cuối danh sách.
- Dịch vụ giá 0 trong bảng giá: "0 ₫/phòng" → "Miễn phí".

## Chưa kiểm

- Safari và Firefox; máy điện thoại thật (mới chỉ giả lập 390 trong Chrome).
- Trình đọc màn hình. Cấu trúc đã có (một `h1`, nhãn ô nhập, `aria-current`, `aria-invalid`, `role="status"` cho xác nhận) nhưng chưa nghe thử.
- Đi hết bằng bàn phím: menu điện thoại có Esc và giữ tiêu điểm, có link "bỏ qua tới nội dung", nhưng em chưa đi từng bước Tab qua cả bốn màn.
- 1024 chỉ xem phần đầu mỗi màn và khối Chủ nhà; phần còn lại dựa vào số đo.
- Ảnh hero gốc 960×720, ở 1440 bị phóng 1,5 lần. Trên ảnh chụp nhìn chấp nhận được nhờ lớp phủ, nhưng trên màn lớn hơn sẽ mềm.
