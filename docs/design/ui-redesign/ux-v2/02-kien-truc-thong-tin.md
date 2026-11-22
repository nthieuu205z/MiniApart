# 02 · Kiến trúc thông tin mới (Brief §B)

Nguyên tắc: nav sắp theo **công việc**, không theo bảng dữ liệu. **Không đổi quyền, đường dẫn API hay route của app.** Route cũ vẫn mở được và tự chuyển tới vị trí mới qua bảng `LEGACY` trong `prototype/app.js`. Trong bản xem trước có thể thử bằng cách mở `#/hoa-don`.

## 1. Khung ứng dụng

| Thành phần | Cũ | Mới |
|---|---|---|
| Thanh trên | "Không gian quản lý · ngày", chuông, đăng xuất, breadcrumb lặp tiêu đề (~90px) | Bỏ hẳn. Ô **Tìm nhanh (Ctrl/⌘+K)** đặt bên trái; **chuông có số** và nút vai trò bên phải. Breadcrumb chỉ hiện khi sâu từ 2 tầng (ví dụ `Toà & phòng › An Nhiên Residence`) |
| Bối cảnh toà | Mỗi trang có ô chọn toà riêng; đổi trang là mất lựa chọn | **Em chọn:** ô chọn toà nằm ở đầu sidebar, mặc định "Tất cả 3 toà", lưu vào `localStorage` (`ma.toa`). Mọi trang lọc theo toà này. Quản lý chỉ thấy toà được phân công (ô tĩnh, không bấm) |
| Tìm kiếm | Không có | Bảng lệnh: tìm người thuê, phòng, hợp đồng, hoá đơn và lệnh nhanh (Ghi nhận thu, Tạo hợp đồng). Tìm không dấu ("quang huy" ra "Nguyễn Quang Huy"). Hiện lọc phía client trên danh sách đã tải (xem phụ thuộc backend) |
| Thông báo | Một trang 3.958px | Popover từ chuông: số chưa đọc, 5 tin mới nhất, "Đánh dấu đã đọc" (`11`). Soạn thông báo cho cư dân tách sang Vận hành |
| Không có quyền | Thẻ lớn + nút Đăng xuất, câu lặp 2 lần | Trang gọn ngay trong khung: một câu nói rõ route thuộc vai trò nào + đường đi tiếp ("Mở Toà & phòng", "Về Hôm nay") (`15`) |
| Rỗng/lỗi/đang tải | Mỗi màn tự làm | Một bộ mẫu dùng chung: đang tải (thanh xương), rỗng có hành động kế tiếp, lỗi tải có "Thử lại" và câu "dữ liệu chưa bị thay đổi", thiếu quyền một phần (`16`) |
| Điện thoại (≤767px) | Sidebar ẩn, không có lối vào menu | Nút ☰ mở sidebar dạng ngăn (`26`). Thợ và khách thuê dùng bottom-nav tối đa 3 mục |

## 2. Nav mới theo vai trò

| Nhóm | CHU | QUAN_LY |
|---|---|---|
| (đầu) | **Hôm nay** | **Hôm nay** |
| Thu tiền | Thu tiền · Chu kỳ tháng | Chu kỳ tháng (số công tơ chưa ghi) · Thu tiền |
| Phòng & người thuê | Toà & phòng · Người thuê · Hợp đồng · Lịch hẹn (số chờ) | Phòng · Người thuê · Hợp đồng · Lịch hẹn (số chờ) |
| Vận hành | Sự cố (số cần phân công) · An toàn PCCC | Sự cố · An toàn PCCC · Thông báo cư dân |
| Báo cáo | Báo cáo (tab: Tổng quan · Tiêu thụ · Chi phí bảo trì · Nhật ký) | — |
| Chân sidebar | Dịch vụ & đơn giá · tài khoản | Dịch vụ & đơn giá · tài khoản |

- **QTHT:** Tài khoản · Toà nhà · Nhật ký thao tác (giữ nguyên).
- **THO** (bottom-nav): Việc · Tiền công · Thông báo.
- **NGUOI_THUE** (bottom-nav): Cần trả · Báo hỏng · Phòng của tôi.

**Gộp và đổi tên (Em chọn):**
- Hoá đơn + Thu tiền + Công nợ gộp thành **Thu tiền**, gồm tab Cần thu (nhóm theo người, có hàng tổng) · Hoá đơn · Đã thu.
- "Kỳ" trong Dịch vụ và kỳ + Ghi chỉ số + bước phát hành gộp thành **Chu kỳ tháng** (4 bước).
- Tổng quan + 3 trang báo cáo + Nhật ký gộp thành **Báo cáo**.
- Nhắc việc đổi tên thành **Hôm nay**, cho cả Chủ.
- Cư trú trở thành tab trong **Người thuê**.
- Tổng quan thợ gộp vào **Việc**.
- Lịch sử hoá đơn gộp vào **Cần trả**.
- Tiêu thụ và Hợp đồng của khách gộp vào **Phòng của tôi**.

## 3. Ánh xạ 44 mục cũ → vị trí mới (không mất chức năng)

`→` là đích mà route cũ tự chuyển tới. Cột "Bản xem trước" cho biết màn đó đã vẽ khung (số ảnh trong `screens/png/`) hay mới có trang giữ chỗ ghi rõ nội dung được giữ.

| # | Vai trò | Route cũ | Nhãn cũ | Vị trí mới | Bản xem trước |
|---|---|---|---|---|---|
| 1 | Công khai | `/dang-nhap` | Đăng nhập | Giữ nguyên | (đã duyệt, `screens/01`) |
| 2 | Công khai | `/kham-pha` | Khám phá | Giữ nguyên | (đã duyệt, `screens/02`) |
| 3 | QTHT | `/tai-khoan` | Tài khoản | Tài khoản | giữ chỗ (bảng 09 đã duyệt) |
| 4 | QTHT | `/toa-nha` | Toà nhà | Toà nhà → hồ sơ toà | `09` |
| 5 | QTHT | `/nhat-ky-thao-tac` | Nhật ký thao tác | Nhật ký thao tác | giữ chỗ |
| 6 | CHU | `/tong-quan` | Tổng quan | Báo cáo › Tổng quan. Trang mở đầu chuyển sang **Hôm nay** | `01` |
| 7 | CHU | `/toa-nha` | Toà nhà | Toà & phòng → hồ sơ toà → hồ sơ phòng | `09`, `07` |
| 8 | CHU | `/nguoi-thue` | Người thuê | Người thuê → hồ sơ 360° | `06` |
| 9 | CHU | `/hop-dong` | Hợp đồng | Hợp đồng (bảng đã duyệt) → hồ sơ hợp đồng | `08` |
| 10 | CHU | `/cu-tru` | Cư trú | Người thuê › tab Khai báo cư trú | giữ chỗ |
| 11 | CHU | `/lich-hen` | Lịch hẹn | Lịch hẹn; lịch chờ hiện ở Hôm nay | giữ chỗ |
| 12 | CHU | `/su-co` | Sự cố | Sự cố (danh sách + ngăn) | `13` |
| 13 | CHU | `/an-toan` | An toàn | An toàn PCCC (tab) | giữ chỗ |
| 14 | CHU | `/dich-vu` | Dịch vụ và kỳ | Dịch vụ & đơn giá (chân sidebar); phần kỳ → Chu kỳ tháng | giữ chỗ, `12` |
| 15 | CHU | `/ghi-chi-so` | Ghi chỉ số | Chu kỳ tháng › Bước 1 | `12` |
| 16 | CHU | `/hoa-don` | Hoá đơn | Thu tiền › tab Hoá đơn | `04` |
| 17 | CHU | `/thu-tien` | Thu tiền | Thu tiền › tab Đã thu; ghi nhận thu từ hàng/bulkbar | `04`, `05` |
| 18 | CHU | `/cong-no` | Công nợ | Thu tiền › Cần thu (mặc định) | `04` |
| 19 | CHU | `/bao-cao` | Báo cáo | Báo cáo › Tổng quan | giữ chỗ |
| 20 | CHU | `/bao-cao/tieu-thu` | Tiêu thụ điện nước | Báo cáo › tab Tiêu thụ | giữ chỗ |
| 21 | CHU | `/bao-cao/chi-phi-bao-tri` | Chi phí bảo trì | Báo cáo › tab Chi phí bảo trì | giữ chỗ |
| 22 | CHU | `/nhat-ky-thao-tac` | Nhật ký thao tác | Báo cáo › tab Nhật ký | giữ chỗ |
| 23 | QUAN_LY | `/nhac-viec` | Nhắc việc | **Hôm nay** | `10` |
| 24 | QUAN_LY | `/ghi-chi-so` | Ghi chỉ số | Chu kỳ tháng › Bước 1 (điện thoại: màn ghi riêng) | `12`, `23` |
| 25 | QUAN_LY | `/hoa-don` | Hoá đơn | Chu kỳ tháng › Bước 3 Phát hành + Thu tiền › Hoá đơn | `12`, `04` |
| 26 | QUAN_LY | `/thu-tien` | Thu tiền | Thu tiền | `04` |
| 27 | QUAN_LY | `/phong` | Phòng | Phòng → hồ sơ phòng | `07` |
| 28 | QUAN_LY | `/hop-dong` | Hợp đồng | Hợp đồng → hồ sơ, Tạo hợp đồng (5 bước) | `08`, `14` |
| 29 | QUAN_LY | `/nguoi-thue` | Người thuê | Người thuê → hồ sơ 360° | `06` |
| 30 | QUAN_LY | `/dich-vu` | Dịch vụ và kỳ | Dịch vụ & đơn giá; kỳ → Chu kỳ tháng | `12` |
| 31 | QUAN_LY | `/cu-tru` | Cư trú | Người thuê › Khai báo cư trú | giữ chỗ |
| 32 | QUAN_LY | `/an-toan` | An toàn | An toàn PCCC | giữ chỗ |
| 33 | QUAN_LY | `/lich-hen` | Lịch hẹn | Lịch hẹn; lịch hôm nay ở Hôm nay | `10` |
| 34 | QUAN_LY | `/su-co` | Sự cố | Sự cố (danh sách + ngăn, duyệt báo giá trong ngăn) | `13` |
| 35 | QUAN_LY | `/thong-bao` | Thông báo | Chuông (popover) + Vận hành › Thông báo cư dân (soạn) | `11` |
| 36 | THO | `/tho/tong-quan` | Tổng quan | Việc (3 số ở đầu) | `20` |
| 37 | THO | `/viec-cua-toi` | Công việc | Việc | `20` |
| 38 | THO | `/tho/chi-phi` | Báo giá & thanh toán | Báo giá: nút trên thẻ việc. Thanh toán: tab Tiền công | `20`, giữ chỗ |
| 39 | THO | `/thong-bao` | Thông báo | Thông báo | giữ chỗ |
| 40 | NGUOI_THUE | `/hoa-don-cua-toi` | Hoá đơn | **Cần trả** → Trả tiền | `21`, `22` |
| 41 | NGUOI_THUE | `/lich-su` | Lịch sử | Cần trả › Lịch sử | giữ chỗ |
| 42 | NGUOI_THUE | `/tieu-thu` | Tiêu thụ | Phòng của tôi › Tiêu thụ | giữ chỗ |
| 43 | NGUOI_THUE | `/hop-dong` | Hợp đồng | Phòng của tôi › Hợp đồng | giữ chỗ |
| 44 | NGUOI_THUE | `/bao-hong` | Báo hỏng | Báo hỏng (giữ nội dung) | giữ chỗ |

Kiểm đủ: 2 + 3 + 17 + 13 + 4 + 5 = **44**. Không mục nào bị bỏ. Hai mục không có đích riêng trong bản xem trước là `/dang-nhap` và `/kham-pha`, vì cả hai giữ nguyên.

**Lưu ý quyền:** Chủ không có route `/phong` trong `roleNavigation.ts`. Vì vậy trong bản xem trước, Chủ mở `#/CHU/phong` sẽ ra trang "Không có quyền". Chủ xem phòng qua Toà & phòng → hồ sơ phòng: route `/toa-nha` vốn có. Việc này cần dev xác nhận API phòng mà Chủ được phép GET (`/api/toa-nha/{id}/phong` chạy được với tài khoản Chủ).

## 4. Phụ thuộc backend (không vẽ như đã có)

| Thứ trong thiết kế | Cần gì | Cách làm tạm bằng dữ liệu đã có |
|---|---|---|
| Tìm nhanh Ctrl+K | API tìm toàn cục | Lọc phía client trên `/api/nguoi-thue`, `/api/phong`, `/api/hop-dong`, `/api/hoa-don` đã tải. Bỏ dấu bằng `normalize('NFD')` |
| Gửi nhắc nợ (bulkbar Thu tiền) | API gửi SMS/Zalo, lịch nhắc | Nút ghi rõ "cần API nhắc nợ"; tạm thời "Xuất danh sách" để gọi tay |
| Lịch sử liên hệ trong hồ sơ người thuê | Bảng ghi chú cuộc gọi/nhắn | Ẩn khối này; hồ sơ hiện ghi chú "cần API mới" |
| QR chuyển khoản cho khách (`22`) | B2 `/api/hoa-don/{id}/ma-qr-chuyen-khoan` (hiện 404) | Hiện số tài khoản + nội dung chuyển khoản, khung QR ghi "chờ API B2" |
| "Tôi đã chuyển khoản" (khách báo đã trả) | Endpoint khách báo thanh toán | Ẩn nút; khách gọi quản lý |
| Số trên nav và chuông | Không cần API mới | Đếm từ `/api/yeu-cau-sua-chua`, `/api/lich-hen`, `/api/thong-bao`, `/api/dashboard/quan-ly` |
| Nhớ toà đã chọn | Không cần API mới | `localStorage` |
| Gộp nợ theo người (Thu tiền) | Không cần API mới | Gộp phía client từ `/api/bao-cao/cong-no` (15 người, 173.450.000 ₫ ngày 22/11/2026) |
