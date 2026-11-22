# 01 · Việc cần làm theo vai trò → cấu trúc (Brief §A)

**Cách đo "hiện tại":** đăng nhập app thật ở 5190 cho từng vai trò (chỉ GET), dùng `tools/app-probe.mjs` để duyệt từng mục menu. Với mỗi trang, công cụ ghi lại số ô chọn, số bảng, số nút, số nút chính và chiều dài trang. Kết quả nằm ở `evidence-app/probe-*.json`. Số bước được tính là số lần bấm menu, ô chọn toà/kỳ và hàng cần mở để xong việc, không tính thao tác gõ.

**Cách đo "đề xuất":** đếm số bước tương ứng trong `prototype/index.html`. `tools/interact-check.mjs` kiểm 11 thao tác cốt lõi và cả 11 đều đạt.

Mỗi lần đổi trang ở app cũ, người dùng phải chọn lại toà (AUDIT §A2). Bản mới chọn toà một lần ở khung và nhớ lựa chọn, nên các bước đề xuất bên dưới đã bỏ những lần chọn lại này.

## Số đo nổi bật từ app thật (1440px, trừ khi ghi 390)

| Trang | Chiều dài | Ô chọn | Nút chính | Vấn đề |
|---|---|---|---|---|
| Ghi chỉ số | **11.151px** | 2 | **18** | Mọi phòng xếp chồng; 18 nút "chính" ngang hàng nhau |
| Công nợ | 4.134px | 1 | 0 | Danh sách dài nhưng không có hành động nào |
| Thông báo (Quản lý) | 3.958px | 0 | 1 | Lẫn thông báo của chính mình với soạn thông báo cho cư dân |
| Công việc (Thợ, 390) | 4.135px | 0 | **0** | Không chỉ ra việc nào cần làm trước |
| Báo hỏng (Khách, 390) | 3.872px | 3 | 1 | Form và danh sách dài |
| Lịch hẹn (Chủ) | 3.046px | 1 | 0 | |
| Hoá đơn | 1.840px | 3 | **0** | Hai nút xám ngang hàng; bộ lọc trạng thái xuất hiện 2 lần |
| Người thuê → bấm "Xem và sửa hồ sơ" | 1.079 → **1.760px** | 0 | 1 | Form mở **bên dưới** danh sách (y = 1.140px), ngoài màn nhìn thấy |
| Khách: Hoá đơn của tôi (390) | 1.562px | 0 | 0 | Chỉ hiện kỳ 10 (còn 1.895.000 ₫); 3 kỳ cũ chưa trả không xuất hiện |

## Bảng trước/sau theo vai trò

### CHU · Chủ sở hữu (17 mục menu → 10 mục trong 5 nhóm, cộng "Dịch vụ & đơn giá" ở chân sidebar)
| # | Việc | Hiện tại (bước) | Đề xuất (bước) | Màn mới |
|---|---|---|---|---|
| 1 | Biết hôm nay cần mình xử lý gì | Tổng quan, Công nợ, Hợp đồng, Sự cố, mỗi trang chọn toà: **8** | Mở app: **1** | Hôm nay (`01`) |
| 2 | Ai nợ bao nhiêu, ghi nhận thu hoặc nhắc nợ | Công nợ, chọn toà, lọc, Thu tiền, chọn toà, tìm người, ghi nhận: **7** (chưa có chỗ nhắc nợ) | Thu tiền, chọn dòng, Ghi nhận thu: **3** | Thu tiền nhóm theo người (`04`, `05`) |
| 3 | Xem mọi thứ về một người thuê | Theo AUDIT §C: **7** | Ctrl+K gõ tên hoặc bấm hàng: **1** | Hồ sơ người thuê 360° (`06`) |
| 4 | Duyệt chi phí sự cố | Sự cố, chọn toà, tìm dòng, mở chi tiết, duyệt: **5** | Hàng "chờ duyệt" ở Hôm nay, rồi Duyệt trong ngăn: **2** | Sự cố + ngăn (`13`) |
| 5 | Xem thu/nợ theo toà, báo cáo cuối kỳ | 3 mục báo cáo riêng, mỗi mục chọn toà: **6** | Báo cáo (có tab); toà đã chọn ở khung: **2** | Báo cáo (giữ Tổng quan Chủ vòng 2) |

### QUAN_LY · Quản lý toà (13 mục → 10 mục trong 4 nhóm, cộng "Dịch vụ & đơn giá" ở chân)
| # | Việc | Hiện tại | Đề xuất | Màn mới |
|---|---|---|---|---|
| 1 | Chu kỳ tháng: ghi số, chốt, phát hành, thu | Dịch vụ và kỳ (chọn kỳ), Ghi chỉ số (chọn toà/kỳ), Hoá đơn (chọn kỳ, 2 nút), Thu tiền: **≥ 9**, không biết đang ở bước nào | Chu kỳ tháng, làm 4 bước trên một trang: **4**, mỗi bước 1 nút chính | `12` |
| 2 | Ghi chỉ số bằng điện thoại | Trang 11.151px, tự tìm phòng chưa ghi | Công tơ chưa ghi xếp lên đầu, ô số to, Lưu rồi chuyển tiếp: **1 mỗi công tơ** | `23` |
| 3 | Xử lý một sự cố tới khi trả tiền thợ | Bảng yêu cầu + bảng Lịch sử, chi tiết mở bên dưới: **5** | Bấm hàng, ngăn bên phải hiện 6 bước và nút chính của bước: **2** | `13` |
| 4 | Tạo hợp đồng | Hợp đồng, form dài một trang trong `HopDongThaoTac`: **2 + cuộn**, không có chỉ báo | Luồng 5 bước có thanh bước, mỗi bước 1 nút "Tiếp": **5** | `14` |
| 5 | Biết hôm nay có gì (lịch hẹn, nhắc việc, thông báo) | Nhắc việc, Lịch hẹn, Thông báo: **3** | Hôm nay + chuông: **1** | `10`, `11` |

### THO · Thợ (4 tab → 3 tab)
| # | Việc | Hiện tại | Đề xuất | Màn mới |
|---|---|---|---|---|
| 1 | Biết việc nào làm trước | Tổng quan, rồi Công việc (4.135px, 0 nút chính): **2** | Việc, việc gấp lên đầu: **1** | `20` |
| 2 | Gửi báo giá | Công việc, Báo giá & thanh toán, chọn việc trong ô chọn: **3** | Bấm nút chính trên thẻ việc: **1** | `20` |
| 3 | Báo đã sửa xong | Công việc, tìm thẻ, bấm: **2** | Bấm nút chính trên thẻ: **1** | `20` |
| 4 | Xem tiền công | Báo giá & thanh toán, lọc: **2** | Tab Tiền công: **1** | (giữ nội dung) |
| 5 | Xem thông báo | 1 | 1 (có số trên tab) | |

### NGUOI_THUE · Khách thuê (5 tab → 3 tab)
| # | Việc | Hiện tại | Đề xuất | Màn mới |
|---|---|---|---|---|
| 1 | Biết phải trả bao nhiêu | Hoá đơn (chỉ kỳ mới), Lịch sử để thấy kỳ nợ cũ: **2** | Cần trả, gộp mọi kỳ: **1** (7.580.000 ₫, 4 kỳ) | `21` |
| 2 | Trả tiền | Chưa làm được: QR là phụ thuộc backend B2, `/ma-qr-chuyen-khoan` trả 404 | Trả, chuyển khoản, chờ xác nhận: **3**, có thanh bước | `22` |
| 3 | Báo hỏng | 1 trang 3.872px | 1 (giữ nội dung, form ngắn đặt trên) | |
| 4 | Xem hợp đồng | 1 | 1 (Phòng của tôi) | |
| 5 | Xem tiêu thụ điện nước | 1 tab riêng | 1 (tab trong Phòng của tôi) | |

### QTHT · Quản trị (3 mục, không đổi)
QTHT chỉ có 3 việc: tài khoản, toà, nhật ký. Mỗi việc đã xong trong **1** bước. Thay đổi duy nhất là QTHT dùng khung mới (Ctrl+K, chuông) và trang "Không có quyền" mới.

## Từ việc → cấu trúc
- Việc 1 của CHU và QUAN_LY đều là "hôm nay có gì", nên trang mở đầu của hai vai trò là **Hôm nay**, gồm danh sách hành động và số liệu gọn.
- Việc 2 của CHU và việc 1 của QUAN_LY là cùng một dòng tiền, tách thành hai không gian: **Chu kỳ tháng** (tạo ra hoá đơn) và **Thu tiền** (thu và theo dõi nợ).
- Việc 3 của CHU chỉ còn 1 bước nhờ **hồ sơ 360°** và **Ctrl+K**.
- Thợ và khách thuê mỗi vai trò có một màn chủ đạo, mỗi thẻ có đúng một hành động kế tiếp.
