# 01 · Chẩn đoán app hiện tại

Xem ngày 26/11/2026 trên app thật `http://localhost:5190` (5 vai trò, chỉ GET), 40 ảnh trong [evidence-app/](evidence-app/), số liệu lấy lại từ 123 lệnh GET. Mỗi lỗi dưới đây em đã mở ảnh ra xem, không chép từ vòng trước.

Một điều phải nói trước: app hiện tại **qua hết phép đo máy** (không cuộn ngang, vùng chạm đủ, tương phản thấp nhất 4,78). Nó không hỏng về kỹ thuật. Nó hỏng ở chỗ người dùng mở lên mà không làm được việc của mình. 12 lỗi dưới xếp theo mức mất tiền, mất thời gian.

## 12 lỗi, nặng trước

| # | Lỗi | Ở đâu | Hại ai, hại gì |
|---|---|---|---|
| 1 | **Người thuê không trả tiền được trong app.** Màn Trả tiền ghi "Số tài khoản: Hỏi quản lý toà để lấy số tài khoản" và "Mã QR chưa có (chờ API)". Nội dung chuyển khoản là 4 mã hoá đơn nối nhau `DEMO-P1-1-2026-10 DEMO-P1-1-2026-09…`, 71 ký tự. | [kh-tra-tien-390](evidence-app/kh-tra-tien-390.png) | Người thuê muốn trả mà không trả được. Chủ nhà thu chậm, mọi khoản trả đều phải đi vòng qua quản lý. |
| 2 | **Chủ nhà không gọi, không nhắc được người nợ từ danh sách.** Dòng người nợ chỉ có mũi tên. Muốn gọi phải mở hồ sơ rồi mới thấy nút Gọi (2 chạm). Trong cả mã nguồn không có chức năng nhắc nợ nào (tìm "zalo", "nhắc" đều không ra). | [chu-hom-nay-1440](evidence-app/chu-hom-nay-1440.png), [chu-thu-tien-1440](evidence-app/chu-thu-tien-1440.png) | Chủ nhà 45–60 tuổi. Thấy nợ mà không có nút nào để đòi. |
| 3 | **Số to nhất trên trang đầu của Chủ nhà là số không ai hỏi.** Ô đầu tiên là "Thực thu 6 tháng 376.130.000 ₫". Câu hỏi buổi sáng là "tháng này thu được bao nhiêu". Việc cần quyết (sự cố khẩn, báo giá chờ duyệt) nằm dưới nếp gấp, trang cao 1.399 px. | [chu-hom-nay-1440](evidence-app/chu-hom-nay-1440.png) | Chủ nhà phải cuộn và tự suy ra việc phải làm. |
| 4 | **Ghi thu tiền theo từng kỳ, không theo người.** Người nợ 4 tháng thì mở dòng, bấm "Thu" 4 lần cho 4 kỳ. Mỗi dòng con còn phơi mã `DEMO-P5-52-2026-07`. (Nút "Ghi nhận thu tiền" ở đầu trang em chưa bấm vì chỉ được GET.) | [chu-thu-tien-1440](evidence-app/chu-thu-tien-1440.png) | Quản lý: một lần khách chuyển khoản đủ phải ghi 4 lần. Dễ ghi thiếu, sổ lệch. |
| 5 | **Chu kỳ tháng tự mâu thuẫn.** Thanh bước ghi "Ghi chỉ số 9/9 phòng · còn 0", menu lại gắn số 4, trang Hôm nay báo "4 công tơ chưa ghi". Bước 2 là một thẻ có một câu và một nút, cột phải dùng để giải thích tính năng ("Sau bước này"). | [ql-chu-ky-1440](evidence-app/ql-chu-ky-1440.png) | Quản lý không biết đã được chốt chưa. Chốt sai là hoá đơn sai cả toà. |
| 6 | **Màn Sự cố của Chủ nhà đưa việc của Quản lý.** Chủ mở ra thấy ô "Chọn thợ", 6 bước tiến độ xếp dọc chiếm 260 px, 4 dòng "Chưa có". Không có chỗ nào nói "việc này đang chờ anh duyệt tiền". Mô tả lộ câu "Dữ liệu tình huống mô phỏng". | [chu-su-co-1440](evidence-app/chu-su-co-1440.png) | Chủ nhà: báo giá nằm chờ, thợ đứng chờ, người thuê bực. |
| 7 | **Chữ của nghề kế toán, không phải của người cho thuê.** "Kỳ 07/2026", "Chốt kỳ", "Phát hành hoá đơn", "Thực thu", "Lấp đầy", "Chủ sở hữu", "chốt sổ sau 0 ngày". Hoá đơn của người thuê có dòng "Lam tron = 200.00" không dấu. | mọi màn tiền | Chủ nhà và người thuê phải dịch trong đầu. Người thuê thấy "4 kỳ quá hạn" không hiểu là 4 tháng. |
| 8 | **Phân cấp chữ phẳng.** Tên người, số tiền, mục menu, tiêu đề thẻ đều đậm vừa (500–600). Nhãn phụ xám trên nền kem. Nhìn lướt không thấy cái nào quan trọng hơn. Chi tiết ở mục Font bên dưới. | [chu-hom-nay-1440](evidence-app/chu-hom-nay-1440.png) | Tất cả. Mắt phải đọc từng dòng thay vì quét. |
| 9 | **Nhãn lặp không mang tin.** 5 dòng nợ đều gắn nhãn đỏ "Trễ 144 ngày" giống hệt nhau. 3 chip lọc "Tất cả 15", "Trễ trên 30 ngày 15" cho cùng kết quả. Ba thanh cam "Còn phải thu theo toà" gần như đầy cả ba. | [chu-hom-nay-1440](evidence-app/chu-hom-nay-1440.png) | Màu đỏ và cam dùng hết cho thứ không cần chú ý, đến lúc có việc khẩn thật thì không còn gì để báo. |
| 10 | **Thẻ rỗng chiếm chỗ đắt nhất.** Góc phải trên của trang đầu là "Lịch hẹn hôm nay: Không có lịch hẹn hôm nay" và "Kỳ tháng 11: Ghi chỉ số, chốt kỳ, phát hành…" (một câu giới thiệu). Trong khi đang có 9 lịch chờ xác nhận. | [chu-hom-nay-1440](evidence-app/chu-hom-nay-1440.png) | Chủ nhà, Quản lý: chỗ dễ thấy nhất không có việc gì để làm. |
| 11 | **Điện thoại của Chủ nhà mất 1/3 màn hình cho khung.** Thanh tìm kiếm, tiêu đề lớn, dòng phụ, rồi 4 ô số 2×2 cao 280 px. Người nợ đầu tiên xuất hiện ở khoảng 590/844 px (đo trên ảnh). Menu giấu sau nút ba gạch. | [chu-hom-nay-390](evidence-app/chu-hom-nay-390.png) | Chủ nhà dùng điện thoại là chính. |
| 12 | **Điều hướng thừa lớp.** 5 nhãn nhóm cho 10 mục, có nhóm "Báo cáo" chứa đúng một mục "Báo cáo", nhóm "Thu tiền" chứa mục "Thu tiền". Màn Thu tiền đặt hàng tab **trên** tiêu đề trang. Người thuê có tab "Cần trả / Lịch sử" ở trên lẫn nút "Cần trả" ở dưới. | menu trái, [chu-thu-tien-1440](evidence-app/chu-thu-tien-1440.png), [kh-can-tra-390](evidence-app/kh-can-tra-390.png) | Tất cả. Thêm thứ phải đọc mà không thêm đường đi. |

Lỗi dữ liệu thấy trong lúc xem (không phải lỗi giao diện, backend cần sửa): hạn thanh toán 05/07 sớm hơn ngày phát hành 25/07; bảng điều khiển Chủ báo 0 phòng đang sửa trong khi danh sách phòng có 3; "4 công tơ chưa ghi" đối với "9/9 đã ghi".

Màn ít lỗi nhất là **Việc của Thợ**: đã có nút gọi và nút việc tiếp theo to trên từng thẻ. V3 chỉ chỉnh nhẹ ở đó.

## Đánh giá thẳng theo 6 đề mục của brief

### Font chữ: Inter (bản đang chạy), Archivo (bản v1)
- **Inter không sai, nhưng không hợp với sổ tiền tiếng Việt.** Em đo 8 font trong Chrome thật ([font-compare/measure.json](font-compare/measure.json), ảnh [so-sanh-font.png](font-compare/so-sanh-font.png)). Ở cỡ 100 px, dấu chồng của Inter ("Ễ") cao 108,7 và dấu dưới ("ự") thò 20,6. Đây là bộ dấu cao gần nhất bảng. Với dòng cao 20–22 px, hàng tiếng Việt trông chật dù đo đạt.
- **Số của Inter mặc định không thẳng cột.** Phải bật `tnum` mới thẳng. App có bật ở vài chỗ, vài chỗ không, nên cột tiền chỗ thẳng chỗ lệch.
- **Inter rộng.** Câu mẫu 14 px dài 440 px, IBM Plex Sans 412 px. Rộng hơn 7% nghĩa là tên toà bị cắt sớm hơn ("An Nhiên Residence…" trên điện thoại).
- **Độ đậm dùng tràn.** Gần như mọi thứ đều 500–600. Ký hiệu ₫ cùng cỡ, cùng đậm với số nên đuôi "₫" gạch chân nặng ngang con số.
- **Cỡ chữ.** Tiêu đề trang to nhất màn hình (khoảng 28 px, đo trên ảnh) trong khi chữ phụ 13–14 px xám mới là chỗ chứa thông tin thật (phòng, toà, số tháng nợ). To nhầm chỗ.
- **Archivo** (v1) đã bị chính nhóm bỏ, ghi trong `overlay-ui-redesign.css`: dấu tiếng Việt chật. Em đồng ý, không xét lại.

### Thang cỡ chữ và khoảng cách
File token của app khai 14 cỡ chữ: 44, 40, 32, 24, 19, 17, 16, 15,5, 15, 14,5, 14, 13, 12,5, 10,5 px. Có bốn cỡ lẻ nửa điểm ảnh, tức là chỉnh bằng mắt từng chỗ chứ không theo thang. Thẻ đệm rộng, bo góc lớn làm trang đầu chỉ hiện 5 người nợ và 3 hợp đồng trong 900 px.

### Mật độ
Một mật độ cho cả năm vai trò. Quản lý ngồi máy tính cả ngày thì thưa (hàng cao 56 px, bảng nợ hiện 7 người). Người thuê và Thợ ngoài trời thì chữ thân 14–15 px là nhỏ.

### Phân cấp thông tin
Sắp theo dữ liệu có sẵn, không theo câu hỏi của người dùng. Xem lỗi 3, 6, 10.

### Màu: xanh teal trên nền kem
- Teal làm bốn việc cùng lúc: nút chính, đường dẫn, mục menu đang chọn, ảnh đại diện. Mắt không phân biệt được "bấm vào đây" với "đang ở đây".
- Nền kem cộng thẻ trắng bo 24 px cho cảm giác app tiêu dùng, mềm. Với sổ tiền, người ta cần cảm giác chắc và rõ.
- Đỏ, cam bị tiêu hết vào nhãn lặp (lỗi 9).
- Ảnh đại diện chữ cái nền pastel nhiều màu: màu không mang nghĩa gì.

### Điều hướng
Xem lỗi 11, 12. Điểm giữ lại: ô chọn toà ở đầu menu và tìm nhanh Ctrl K là đúng hướng, V3 giữ cả hai.

## Vì sao v1 và v2 chưa chữa được
v1 đổi da (màu, bo góc, font) trên cùng bố cục. v2 sắp lại cấu trúc và đã gỡ được vài lỗi (gom nợ theo người, có trang Hôm nay), nhưng vẫn giữ ngôn ngữ thẻ bo tròn, vẫn chữ "kỳ", vẫn không có nút gọi và nhắc, vẫn không trả tiền được. Hai vòng đều sửa cái nhìn thấy trước khi sửa cái người dùng cần làm.
