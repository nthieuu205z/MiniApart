# Kiến trúc phần công khai

Bản xem trước: [prototype/index.html](prototype/index.html). Trong bản xem trước, đường dẫn nằm sau dấu `#` (ví dụ `index.html#/tim-phong`) để chạy được bằng `file://`; khi làm thật là route thường.

## 1. Route

| Route | Màn | Việc chính | Ảnh |
|---|---|---|---|
| `/` | Trang chủ | Hiểu MiniApart là gì, bấm Tìm phòng | [1440](screens/01-trang-chu-1440.jpg) · [390](screens/01-trang-chu-390.jpg) |
| `/tim-phong` | Tìm phòng | Lọc và chọn một phòng | [1440](screens/02-tim-phong-1440.jpg) · [390](screens/02-tim-phong-390.jpg) |
| `/phong/:id` | Chi tiết phòng | Xem giá từng khoản, gửi lịch hẹn | [1440](screens/03-chi-tiet-phong-1440.jpg) · [390](screens/03-chi-tiet-phong-390.jpg) |
| `/dang-nhap` | Cổng cư dân | Đăng nhập, sang ứng dụng V3 | [1440](screens/04-dang-nhap-1440.jpg) · [390](screens/04-dang-nhap-390.jpg) |
| `/kham-pha` | (route cũ) | Chuyển sang `/tim-phong`, giữ nguyên query | |

`/#vi-sao` và `/#chu-nha` là hai mục trong trang chủ, không phải trang riêng.

## 2. Menu trên

`MiniApart` · Tìm phòng · Vì sao MiniApart · Dành cho chủ nhà · … · **Cổng cư dân** (link chữ nhỏ, mép phải, không đóng hộp).

- Cố định trên cùng, cao 64px. Trên ảnh hero thì trong suốt, chữ trắng; cuộn qua hero thì nền giấy, chữ mực ([ảnh](screens/01-trang-chu-cuon-1440.jpg)).
- Dưới 900px: chỉ còn logo và chữ "Menu". Mở ra là ba mục lớn, bên dưới là Cổng cư dân kèm một dòng giải thích và nút Tìm phòng ([ảnh](screens/05-menu-390.jpg)). Esc hoặc "Đóng" để tắt; tiêu điểm bàn phím được giữ trong menu.
- Mục đang xem có gạch chân (`aria-current`).

## 3. Từng màn

### 3.1 Trang chủ `/`

Thứ tự từ trên xuống:

1. **Hero.** Ảnh phòng tràn màn. H1 "Chỗ ở tử tế, giá *rõ ràng*" ở góc trái dưới, một câu phụ có số thật. Góc phải dưới: thẻ "Giá thấp nhất đang trống" (dẫn thẳng tới phòng đó) và nút Tìm phòng. Không có form đăng nhập.
2. **Vì sao MiniApart.** Một câu lớn, rồi hai cột: bảng giá đang áp dụng của một toà (6 khoản đầu, lấy từ `bangGiaDichVu`) và ba bước thuê phòng (Tìm phòng → Hẹn giờ đến xem → Ký hợp đồng, vào ở).
3. **Sáu toà, ba thành phố.** Danh sách hàng kẻ, mỗi hàng: tên toà, thành phố, số phòng trống, mũi tên. Di chuột vào hàng nào thì ảnh dọc bên phải đổi theo toà đó. Bấm → `/tim-phong?toa=<id>`.
4. **Dải số liệu** nền xanh sẫm: số toà, số phòng trống trên tổng, giá thuê thấp nhất đang trống.
5. **Phòng đang trống.** Thẻ trắng nổi trên ảnh nền, mỗi toà một phòng rẻ nhất, lật bằng hai mũi tên.
6. **Dành cho chủ nhà.** Bốn giá trị, mỗi cái là tính năng đã có trong ứng dụng:

   | Giá trị | Đã có ở |
   |---|---|
   | Hoá đơn tự tính điện nước | Lập hoá đơn theo chỉ số và bảng giá dịch vụ |
   | Thu tiền bằng mã QR | `frontend/src/vietQr.ts`; người thuê "báo đã chuyển" (`/api/cong/hoa-don/{id}/bao-da-chuyen`) |
   | Sự cố có người nhận | `BaoHongKhach.tsx` (kèm tối đa 5 ảnh), `SuCoQuanLy.tsx` (giao thợ) |
   | Hợp đồng điện tử | `HopDongThaoTac.tsx`, `HoSoHopDong360.tsx` (phụ lục, gia hạn, ghi nhận đã ký) |

   Bên phải là mảnh hoá đơn dựng bằng font và màu của V3. Đơn giá thật của toà, chỉ số công tơ là ví dụ (có ghi chú ngay dưới).
7. **CTA cuối** "Chọn phòng, hẹn giờ, *đến xem*" và **chân trang** bốn cột. Đăng nhập xuất hiện lại ở đây, nhỏ.

### 3.2 Tìm phòng `/tim-phong`

- Bộ lọc: Toà nhà (gồm cả nhóm theo thành phố), Mức giá mỗi tháng (dưới 3,5 triệu · 3,5 đến 5 triệu · trên 5 triệu), Loại phòng, ô tìm theo số phòng hoặc địa chỉ. Hàng chip: "Chỉ phòng trống" (bật sẵn) và các tiện ích kèm số phòng khớp. Chip có 0 phòng thì mờ đi.
- Lọc chạy ngay khi đổi, không có nút "Tìm". Bộ lọc ghi lên URL (`?toa=3&gia=3_5_DEN_5&ti=Ban công`) nên gửi link cho người khác vẫn đúng.
- Lưới 3 cột (1024: 2 cột, 390: 1 cột). Mỗi phòng: ảnh, giá, "Phòng 401 · tên toà", loại · diện tích · tầng, giá điện và nước. Không có nhãn chồng trên ảnh khi phòng đang trống; phòng đang thuê hoặc sửa chữa mới có nhãn.
- Sắp xếp: phòng trống trước, giá thấp đến cao (giữ như hiện tại).
- Giữ đủ chức năng của `KhamPhaPhong` hiện có: lọc toà, giá, loại, từ khoá, tiện ích, xem cả phòng đang thuê.
- Trạng thái đã dựng: [không khớp](screens/02-tim-phong-khong-khop-390.jpg) (nói rõ có bao nhiêu phòng khớp nhưng đang có người thuê, kèm nút đặt lại), [đang tải](screens/02-tim-phong-dang-tai-390.jpg), [lỗi mạng](screens/02-tim-phong-loi-390.jpg), [xem cả phòng đang thuê](screens/02-tim-phong-ca-phong-dang-thue-1440.jpg).
- 390: hàng chip vuốt ngang trên một dòng, không đẩy kết quả xuống.

### 3.3 Chi tiết phòng `/phong/:id`

- Trái: ảnh, "Mỗi tháng trả *những gì*" (bảng giá chia nhóm: Tiền thuê · Theo công tơ riêng · Cố định mỗi tháng · Theo số người ở · Chỉ tính khi bạn dùng), khung ước tính một tháng, tiện ích có sẵn, mô tả, phòng trống khác cùng toà.
- Phải (dính theo khi cuộn): tên toà, "Phòng 401", loại · diện tích · tầng · sức chứa, giá, trạng thái, form **Đặt lịch xem phòng**.
- Form ngắn: Họ và tên, Số điện thoại, Ngày giờ muốn xem. Email và lời nhắn nằm sau link "Thêm email hoặc lời nhắn". Đúng các trường của `YeuCauDatLichHen`.
- Lỗi hiện ngay dưới ô sai, tiêu điểm nhảy tới ô đầu tiên sai ([ảnh](screens/03-chi-tiet-phong-loi-form-390.jpg)).
- Gửi xong: form đổi thành bảng xác nhận (phòng, giờ hẹn, người hẹn) và câu "Quản lý toà sẽ gọi … để xác nhận" ([ảnh](screens/03-chi-tiet-phong-da-gui-390.jpg)).
- Phòng không trống: không có form, thay bằng dòng trạng thái và link tới phòng trống cùng toà ([ảnh](screens/03-chi-tiet-phong-dang-thue-1440.jpg)).
- 390: thanh dính đáy "giá + Đặt lịch xem" hiện khi form đã cuộn khỏi màn.
- **Ước tính một tháng:** nhập số người, số xe, điện, nước → ra tổng và từng dòng. Khoản tính bậc thang không cộng được thì nói rõ "chưa gồm …" ([ảnh](screens/03-chi-tiet-phong-bac-thang-390.jpg), dữ liệu mô phỏng vì demo chưa có toà nào dùng bậc thang).

### 3.4 Cổng cư dân `/dang-nhap`

- Trái: H1 "Đăng *nhập*", một câu nói rõ ai dùng (người đang thuê, chủ nhà, quản lý, thợ), form Số điện thoại + Mật khẩu dựng bằng Plex và nút mực như V3.
- Dưới form: "Quên mật khẩu?" và "Kích hoạt tài khoản lần đầu" (mở `TaiKhoanTruyCap` đã có), câu nhắc người thuê hỏi quản lý để nhận tin kích hoạt, link về Tìm phòng.
- Phải: ảnh phòng và bảng "Sau khi đăng nhập" theo vai. Ở 390 bảng này xuống dưới form, nền xanh sẫm, không dùng ảnh.
- Đăng nhập xong: `dieuHuongToi(TRANG_DAU[vaiTro])` như hiện tại (người thuê `/hoa-don-cua-toi`, chủ và quản lý `/hom-nay`, thợ `/viec-cua-toi`, quản trị `/tai-khoan`).

## 4. Luồng

| Ai | Đường đi | Số lần bấm tới việc chính |
|---|---|---|
| Người tìm phòng | Trang chủ → Tìm phòng → chọn phòng → điền form, Gửi | 3 (1 nếu bấm thẻ giá thấp nhất ở hero) |
| Chủ nhà chưa dùng | Trang chủ → Dành cho chủ nhà → Nhắn Zalo | 2 |
| Chủ nhà đã có tài khoản | Cổng cư dân → đăng nhập | 2 |
| Người đang thuê | Cổng cư dân → đăng nhập → Hoá đơn của tôi | 2 |

## 5. Đã đăng nhập mà vào `/` (đề xuất)

- `/` → chuyển thẳng về `TRANG_DAU[vaiTro]`. Đây là hành vi hiện có của `timTuyen(vaiTro, '/')`, không phải viết thêm.
- `/tim-phong`, `/phong/:id` → vẫn mở được; "Cổng cư dân" trên menu đổi thành "Vào ứng dụng".
- `/dang-nhap` → chuyển về `TRANG_DAU[vaiTro]`.
- Đăng xuất → về `/`.

## 6. Dữ liệu

Bản xem trước dùng JSON thật lấy bằng GET từ demo, lưu trong `prototype/data.js`. Sinh lại: `node tools/gen-data.mjs [http://localhost:5190]`.

| Chỗ trên màn | Nguồn |
|---|---|
| Danh sách toà, số phòng trống | `GET /api/public/toa-nha` (`ten`, `diaChi`, `soPhongTrong`) |
| Lưới phòng, chi tiết | `GET /api/public/phong?chiPhongTrong=false`, `GET /api/public/phong/{id}` |
| Bảng giá từng khoản | `bangGiaDichVu[]` (`ten`, `cachTinh`, `cheDoGia`, `donGia`, `donVi`) |
| Gửi lịch hẹn | `POST /api/public/dat-lich-hen` (bản xem trước **không** gọi) |
| Đăng nhập | API đăng nhập hiện có (bản xem trước **không** gọi) |

## 7. Chỗ chưa có backend hoặc dữ liệu, và cách tạm

| Việc | Hiện trạng | Cách tạm trong thiết kế |
|---|---|---|
| Chủ nhà gửi yêu cầu tư vấn | Không có endpoint | Nút mở Zalo tới một số cố định (dùng lại `linkZalo` trong `tienTheoNguoi.ts`). Cần số từ anh. |
| Lọc theo thành phố | API không có trường thành phố | Tách từ đuôi `diaChi` ("…, Hà Nội"). Dễ gãy nếu địa chỉ viết khác; về sau nên thêm trường `thanhPho`. |
| Lọc theo tiện ích | API không có tham số | Lọc ở trình duyệt, như `KhamPhaPhong` đang làm. |
| Nhiều ảnh cho một phòng | API chỉ có `anhDaiDien` | Trang chi tiết dùng một ảnh. Không dựng thư viện ảnh giả. |
| Hai toà thử nghiệm TN-A, TN-B | `/toa-nha` trả 8 toà, 2 toà không có phòng công khai | Chỉ hiện toà có ít nhất một phòng công khai. |
| Số phòng đang thuê theo toà | Kiểu `PublicToaNha` khai `soPhongDangThue` nhưng API không trả | Không dùng. Tổng số phòng đếm từ `/phong`. |
| Tiền điện bậc thang trong ước tính | API công khai không trả bảng bậc | Không cộng, ghi rõ "chưa gồm". |
| Mô tả phòng | Dữ liệu demo kết thúc bằng "Dữ liệu mô phỏng phục vụ báo cáo." | Hiện nguyên văn. Cần sửa ở dữ liệu, không sửa ở giao diện. |
| Ảnh đủ lớn cho hero | Ảnh trong repo là 960×720 | Dùng tạm, có lớp phủ tối. Cần ảnh ngang từ 2400px. |
| Dịch vụ giá 0 (Internet) | `donGia: 0` | Bảng giá ghi "Miễn phí"; trong hoá đơn và ước tính vẫn là 0 ₫. |

## 8. Khi làm thật (chưa thuộc vòng này)

- `App.tsx` `cheDoKhach`: thêm chế độ trang chủ cho `/`; `/kham-pha` chuyển sang `/tim-phong`.
- `KhamPhaPhong.tsx` tách thành Tìm phòng và Chi tiết phòng, giữ nguyên các hàm gọi API trong `api.ts`.
- `ManDangNhap.tsx` giữ logic, đổi khung ngoài.
- Thêm 6 file woff2 (Be Vietnam Pro 400/500, Newsreader Italic 400; latin + vietnamese), chỉ nạp ở phần công khai.
