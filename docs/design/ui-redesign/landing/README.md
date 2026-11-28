# Phần công khai MiniApart: bản thiết kế để duyệt

Vòng này chỉ có tài liệu và bản xem trước tĩnh, chưa đụng `frontend/src` hay backend.

- Mở xem: [prototype/index.html](prototype/index.html) (bấm đúp là chạy, không cần mạng hay server).
- Ảnh chụp sẵn: [screens/](screens/), mỗi màn ở 1440 và 390.
- Cấu trúc trang, luồng, chỗ chưa có backend: [01-kien-truc.md](01-kien-truc.md).
- Kết quả đo: [QA.md](QA.md).

## 1. Vì sao màn cũ trông rẻ

Xem [reference/miniapart-hien-tai.jpg](reference/miniapart-hien-tai.jpg).

1. **Một màn gánh ba việc.** Không có trang chủ. Vào `/` là gặp ngay form lọc, lưới 72 phòng và nút Đăng nhập. Khách chưa kịp biết MiniApart là gì đã bị bắt chọn bộ lọc.
2. **Hộp lồng hộp.** Thẻ trắng bo tròn chứa khung xám bo tròn chứa ô nhập. Ảnh cũng bị đóng thành thẻ bo tròn, kèm nhãn viên thuốc "Ảnh minh hoạ không gian căn hộ". Mỗi thẻ phòng lại chồng thêm hai nhãn lên ảnh.
3. **Chữ của phần mềm, không phải của trang đón khách.** Cả màn dùng IBM Plex Sans đậm 600 như bảng quản trị, một cỡ tiêu đề, không có nhịp to nhỏ. Tiêu đề rớt một chữ "nước" xuống dòng riêng.
4. **Ảnh nhỏ và bị ép khung.** Ảnh phòng là thứ đẹp nhất mình có nhưng chỉ chiếm một góc.
5. **Số liệu lộ chuyện nội bộ.** "8 toà nhà" tính cả 2 toà thử nghiệm không có phòng nào; "72 phòng phù hợp" trong khi chỉ 12 phòng trống; "Phòng đang quản lý 72" là số của chủ nhà, không phải của người tìm phòng.
6. **Đăng nhập là thứ nổi nhất góc phải**, đóng hộp, ngang hàng với việc tìm phòng. Chủ nhà muốn tìm hiểu thì không có lối nào.

## 2. Hướng mới

Tách thành bốn màn, mỗi màn một việc. Giọng biên tập, ấm, ít chữ: ảnh phòng tràn màn, tiêu đề lớn có một từ nhấn chữ nghiêng, nội dung chia bằng đường kẻ mảnh thay cho thẻ. Tham chiếu chính là Stellar Management (xem [reference/stellar-teardown.md](reference/stellar-teardown.md)), thêm nền giấy ấm kiểu Casa Momo. Không lấy font, màu, ảnh hay câu chữ của họ.

Ba thứ MiniApart có mà họ không có, nên được đưa lên trước: giá điện nước ghi sẵn từng khoản, bảng ước tính tiền một tháng, và khối "Dành cho chủ nhà" có mảnh hoá đơn thật của ứng dụng.

Mọi con số trên trang đều tính từ API công khai (6 toà, 12 phòng trống trên 72, giá thấp nhất 3.600.000 ₫). Không có số marketing.

## 3. Sơ đồ trang và luồng

```
/  Trang chủ ──┬─ Tìm phòng ─────────► /tim-phong ──► /phong/:id ──► Đặt lịch xem ──► Xác nhận
               ├─ Vì sao MiniApart      (neo trong trang chủ)
               ├─ Dành cho chủ nhà ───► Nhắn Zalo  hoặc  /dang-nhap
               └─ Cổng cư dân ────────► /dang-nhap ──► ứng dụng V3 (trang đầu theo vai)
/kham-pha ──► chuyển sang /tim-phong (giữ nguyên bộ lọc trên URL)
```

- Người tìm phòng: Trang chủ → Tìm phòng → Chi tiết → gửi lịch hẹn. Ba lần bấm tới form; từ thẻ "giá thấp nhất" ở hero thì còn một.
- Chủ nhà: Trang chủ → Dành cho chủ nhà → Nhắn Zalo hoặc Đăng nhập.
- Người đang thuê: Cổng cư dân → đăng nhập → Hoá đơn của tôi.

## 4. Font

| Vai | Font | Dùng ở đâu |
|---|---|---|
| Chữ đọc và tiêu đề | Be Vietnam Pro 400, 500 | Toàn bộ phần công khai |
| Từ nhấn | Newsreader Italic 400 | Nhiều nhất một từ mỗi tiêu đề |
| Mảnh của ứng dụng | IBM Plex Sans 400, 500, 600 | Form đăng nhập, mảnh hoá đơn |

- **Vì sao Be Vietnam Pro:** vẽ riêng cho tiếng Việt nên dấu chồng (ỗ, ữ, ẳng) gọn và cân ở cỡ 88px; nét tròn, ấm hơn Plex. Tài liệu V3 đã nhận xét đúng: font này "đẹp cho tiêu đề, hỏng cho bảng tiền" vì không có số thẳng cột. Phần công khai không có bảng tiền dày, nên dùng đúng chỗ mạnh của nó.
- **Vì sao Newsreader Italic:** chữ nghiêng có dấu tiếng Việt vẽ tử tế, tạo chất biên tập mà không cần thêm màu.
- **Vì sao giữ Plex ở form đăng nhập và hoá đơn:** bấm Đăng nhập xong người dùng vào ứng dụng V3; hai mảnh này nhìn giống hệt bên trong nên không bị giật.
- **Kiểm subset tiếng Việt:** `curl -A "<UA Chrome 131>" "https://fonts.googleapis.com/css2?family=..."` trả khối `/* vietnamese */` cho cả ba. Đã loại Instrument Serif, Instrument Sans, Schibsted Grotesk vì chỉ có latin. Ảnh so sánh các ứng viên: [reference/so-sanh-font.png](reference/so-sanh-font.png).
- **Tự chứa:** 12 file woff2 (latin + vietnamese) nằm trong [prototype/fonts/](prototype/fonts/), kèm giấy phép OFL và `SHA256SUMS`. Không gọi Google Fonts. Font chưa tải kịp thì rơi về font hệ thống.
- Tiêu đề: đậm 500, giãn dòng 1,06 đến 1,1, khít chữ −2%. Chữ thân 17px, giãn dòng 1,55.

## 5. Màu

| Tên | Mã | Dùng |
|---|---|---|
| Giấy | `#faf8f4` | Nền trang, trắng ấm |
| Giấy đậm | `#f1ede5` | Khối Chủ nhà, khung ước tính |
| Mực | `#14181d` | Chữ chính, nút chính (trùng `--muc` của V3) |
| Phụ | `#47505a` | Chữ phụ (trùng `--phu` của V3) |
| Rừng | `#17352b` | Dải số liệu, chân trang; lấy từ màu cây trong ảnh phòng |
| Ngữ nghĩa | `#1f6b43` `#8a4b00` `#b3261e` `#1b56b0` | Còn trống, cảnh báo, lỗi, link trong form (màu của V3) |
| Zalo | `#0068ff` | Chỉ một nút: "Nhắn Zalo để được tư vấn" |

Không gradient. Nút chính màu mực như V3; trên ảnh thì nút trắng. Màu rực duy nhất là xanh Zalo trên đúng nút mở Zalo, để người dùng nhận ra ngay.

## 6. Ba việc cần anh quyết

1. **Phần công khai có được dùng font riêng không?** Ứng dụng đang dùng IBM Plex Sans; bản này thêm Be Vietnam Pro và Newsreader Italic (thêm khoảng 112 KB font). *Đề xuất: đồng ý.* Đây là thay đổi lớn nhất để hết "phèn"; nếu anh muốn một font duy nhất thì em dựng lại bằng Plex nhưng sẽ kém ấm.
2. **Chủ nhà liên hệ qua kênh nào?** Chưa có backend nhận yêu cầu tư vấn. *Đề xuất: nút "Nhắn Zalo để được tư vấn" mở Zalo tới một số của anh, không làm form.* Em cần số Zalo đó; trong bản xem trước nút chỉ hiện ghi chú.
3. **Đã đăng nhập mà vào `/` thì sao?** *Đề xuất: giữ như hiện tại, chuyển thẳng về trang đầu theo vai (người thuê về Hoá đơn của tôi, chủ nhà về Hôm nay).* Người dùng hằng ngày không cần xem lại trang giới thiệu. `/tim-phong` và `/phong/:id` vẫn mở được, chỉ đổi "Cổng cư dân" thành "Vào ứng dụng".
