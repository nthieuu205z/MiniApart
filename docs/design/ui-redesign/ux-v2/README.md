# UX v2 · Thiết kế lại cấu trúc, luồng và bố cục MiniApart (bản xem trước)

**Mở thử:** `prototype/index.html`. Mở thẳng bằng trình duyệt, không cần mạng hay máy chủ. Trang đầu là mục lục các màn. Nút vai trò ở chân sidebar (hoặc góc trên trên điện thoại) đổi giữa 5 vai trò. Phím **Ctrl+K** mở tìm nhanh.

**Ràng buộc đã giữ:**
- Dữ liệu thật lấy từ app 5190 bằng GET, chụp ngày 22/11/2026.
- Không sửa code app, không đổi quyền, route hay API.
- Không thêm token. Lớp CSS mới nằm trong `prototype/ux.css` và được đánh dấu "MỚI".

## Hướng đi
App cũ đã có hệ thiết kế đẹp nhưng xếp theo **bảng dữ liệu**: Chủ có 17 mục ngang hàng, mỗi trang tự chọn toà, và cùng một việc bị tách ra 3 trang. Bản mới xếp theo **việc người dùng làm trong ngày**:
- Mở app là thấy việc cần làm hôm nay.
- Tiền nằm ở một chỗ.
- Mỗi người, phòng, hợp đồng, toà có một hồ sơ nối mọi thứ liên quan.
- Việc nhiều bước có thanh bước và đúng một nút chính cho bước hiện tại.

Phong cách theo kiểu công cụ quản trị gọn, dày thông tin, ít màu như Linear và Stripe Dashboard: lấy cấu trúc và nhịp, không chép pixel (**Em chọn**).

## 5 quyết định lớn
1. **Nav theo công việc.** Thứ tự: Hôm nay · Thu tiền · Phòng & người thuê · Vận hành · Báo cáo. Chủ còn 10 mục, Quản lý 10, Thợ 3, Khách thuê 3. Không mất mục nào: đủ bảng ánh xạ 44 mục và route cũ tự chuyển (`02`).
2. **Bối cảnh toà chọn một lần ở khung và được nhớ.** Bỏ thanh "Không gian quản lý" và breadcrumb lặp. Thêm **Ctrl+K** tìm người thuê/phòng/hợp đồng/hoá đơn và **chuông có số**.
3. **Gộp Hoá đơn + Thu tiền + Công nợ thành "Thu tiền"**, mặc định nhóm theo người, có hàng tổng. Chọn dòng thì hiện thanh hành động. Phần "kỳ" + Ghi chỉ số + phát hành gộp thành **Chu kỳ tháng** 4 bước.
4. **Hồ sơ 360°** cho Người thuê, Phòng, Hợp đồng, Toà. Bấm hàng là vào hồ sơ, không mở form bên dưới danh sách.
5. **Mỗi màn tối đa một nút chính**, đổi theo trạng thái thật. Hợp đồng sắp hết hạn có nút Gia hạn; hợp đồng chờ ký có nút Ký; phòng trống có nút Tạo hợp đồng. "Thanh lý" là hành động phá huỷ nên không bao giờ là nút chính.

## Trước / sau (số bước tới khi xong việc, đo từ app thật; chi tiết ở `01`)
| Việc | Trước | Sau |
|---|---|---|
| Chủ biết hôm nay cần xử lý gì | 8 (4 trang × chọn toà) | **1** |
| Chủ xem ai nợ rồi ghi nhận thu | 7, không có chỗ nhắc nợ | **3** |
| Chủ xem mọi thứ về một người thuê | 7 | **1** |
| Chủ duyệt chi phí sự cố | 5 | **2** |
| Quản lý chạy chu kỳ tháng | ≥ 9 trên 4 trang, không biết đang ở bước nào | **4** trên 1 trang có thanh bước |
| Quản lý tạo hợp đồng | 1 form dài, không có chỉ báo | 5 bước có chỉ báo |
| Thợ gửi báo giá | 3 | **1** |
| Khách biết mình phải trả bao nhiêu | 2 (kỳ mới hiện 1.895.000 ₫; 3 kỳ nợ cũ bị giấu) | **1** (7.580.000 ₫, 4 kỳ) |

Một vài số đo trang của app thật: Ghi chỉ số dài **11.151px** và có **18** nút chính; Công nợ 4.134px; Công việc của thợ 4.135px và không có nút chính nào. Trong bản mới, Chu kỳ tháng dài 1.030px, Thu tiền 1.184px, Việc của thợ 1.186px, mỗi màn 1 nút chính.

## Đầu ra
| File | Nội dung |
|---|---|
| `01-nhiem-vu.md` | Top 5 việc × 5 vai trò, số bước trước/sau, số đo app thật |
| `02-kien-truc-thong-tin.md` | Khung mới, nav mới, **ánh xạ 44 mục**, phụ thuộc backend |
| `03-ho-so-va-luong.md` | 4 hồ sơ 360°, 4 luồng (sơ đồ + màn khung) |
| `prototype/` | HTML bấm thử được: `index.html`, `app.js`, `ux.css`, `data.js` (sinh từ GET) |
| `screens/png/` | 24 ảnh: 16 màn 1440, 7 màn 390, 1 màn 1180 |
| `compare/` | 10 ảnh trước (`evidence/dot-03`) / sau đặt cạnh nhau |
| `figma/` | 20 SVG figma-ready + `IMPORT.md`; lệch pixel 0,26–1,88 % |
| `QA.md` | 24/24 màn đạt cả 4 tiêu chí: không cuộn ngang, vùng chạm, tương phản ≥ 4,98:1, chữ ≥ 13px. Kiểm tương tác 11/11, guard token 6/6 |
| `tools/`, `evidence-app/` | Script chụp, QA, so sánh, lấy dữ liệu; kết quả probe app thật |

## Câu hỏi cho Chủ tịch ("duyệt" nghĩa là lấy hết đề xuất)
1. **Trang mở đầu của Chủ là "Hôm nay"** (việc cần làm), còn Tổng quan vòng 2 chuyển vào Báo cáo? *Đề xuất: có.*
2. **Gộp Hoá đơn, Thu tiền, Công nợ thành "Thu tiền"**, mặc định nhóm theo người thuê? *Đề xuất: có. Nhóm theo phòng là tuỳ chọn trên cùng màn.*
3. **Toà chọn một lần ở sidebar và được nhớ**, mặc định "Tất cả toà"? *Đề xuất: có.*
4. **Chu kỳ tháng** gộp phần kỳ của "Dịch vụ và kỳ", Ghi chỉ số và phát hành hoá đơn; phần đơn giá chuyển xuống chân sidebar ("Dịch vụ & đơn giá")? *Đề xuất: có.*
5. **Thông báo của chính mình xem ở chuông**, còn soạn thông báo cho cư dân để ở mục riêng trong Vận hành? *Đề xuất: có.*
6. **Khách thuê còn 3 tab** (Cần trả · Báo hỏng · Phòng của tôi); Lịch sử, Tiêu thụ và Hợp đồng thành tab con? *Đề xuất: có.*
7. **Nhắc nợ tự động và QR chuyển khoản** cần API mới (`02` §4). Có đưa vào đợt backend kế tiếp không? *Đề xuất: làm QR (B2) trước, nhắc nợ sau. Trong lúc chờ, dùng "Xuất danh sách" để gọi tay.*
8. **Bước kế tiếp:** áp vào code theo thứ tự khung → Thu tiền → Hồ sơ 360° → Chu kỳ tháng → Sự cố → mobile? *Đề xuất: có, mỗi bước một PR nhỏ, giữ route cũ.*

## Điều chưa kiểm
- Chưa import Figma.
- Chưa thử trình đọc màn hình thật.
- Các màn chưa vẽ chi tiết (Lịch hẹn, An toàn, Báo cáo, các danh sách) là trang giữ chỗ, ghi rõ nội dung được giữ.
- Chu kỳ tháng mới vẽ bước 1. Bước 2–4 có mô tả nhưng chưa có màn riêng.
