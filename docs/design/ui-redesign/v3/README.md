# MiniApart V3 · bản thiết kế để duyệt

Ngày 26/11/2026. Chưa đụng `frontend/src`, chưa commit. Mọi thứ nằm trong thư mục này.

**Xem nhanh:** mở [prototype/index.html](prototype/index.html) bằng trình duyệt (không cần mạng, không cần chạy lệnh). Thanh đen trên cùng để đổi vai trò và nhảy tới từng màn. Ảnh so cũ với mới: [compare/](compare/).

## Hướng thiết kế: "Sổ cái"

Khung không màu, tiền và số bằng mực đen, màu chỉ xuất hiện khi có chuyện. Mỗi vai trò mở app là thấy việc của mình trong màn đầu, có nút để làm ngay.

## 5 quyết định lớn

1. **Tôi chọn sắp trang đầu theo câu hỏi, không theo dữ liệu.** Chủ nhà thấy: còn phải thu bao nhiêu, ai đang nợ (kèm nút gọi và nhắc), việc gì cần quyết. Quản lý thấy tháng này đang ở bước nào và nút làm bước đó.
2. **Tôi chọn gom tiền theo người, bỏ chữ "kỳ".** Một người nợ 4 tháng là một dòng, một lần ghi thu. Người dùng chỉ thấy "tháng".
3. **Tôi chọn IBM Plex Sans thay Inter.** Số thẳng cột mặc định, dấu tiếng Việt gọn, hẹp hơn 6%. So sánh 8 font đo thật ở [03-he-thiet-ke.md](03-he-thiet-ke.md).
4. **Tôi chọn nút chính màu mực đen, bỏ xanh teal và nền kem.** Màu để dành cho nợ, cảnh báo, xong, đang xử lý. Mỗi màn nhiều nhất một nút chính.
5. **Tôi chọn ba mật độ cho ba kiểu người dùng.** Quản lý dày (chữ 15, hàng 48). Chủ nhà trên điện thoại vừa (chữ 16, nút 44). Người thuê và Thợ thoáng (chữ 17, nút 52).

## Vì sao tốt hơn v2

- v2 sắp lại menu và thẻ; V3 sửa việc người dùng không làm được: gọi và nhắc người nợ, ghi thu một lần, trả tiền bằng QR, duyệt báo giá trong 2 chạm.
- v2 xây trên file token và component của v1 (`ux.css` ghi rõ điều đó), nên vẫn teal, nền kem, thẻ bo tròn. V3 làm lại từ font tới màu, có số đo.
- V3 có 11 lỗi do em tự mở ảnh tìm ra và sửa mà phép đo máy không bắt được, ghi ở [QA.md](QA.md).

Chỗ V3 chưa hơn: màn Thợ hiện tại vốn đã ổn, V3 chỉ chỉnh nhẹ. Màn danh sách Người thuê và Hồ sơ toà vẫn là màn tra cứu, chưa có việc kế tiếp rõ.

## Trước / sau

| Việc | Hiện tại | V3 |
|---|---|---|
| Chủ gọi người nợ nhiều nhất | 2 chạm | 1 chạm |
| Chủ nhắc nợ | không có | 2 chạm, tin soạn sẵn |
| Chủ duyệt báo giá | ≥ 3 chạm | 2 chạm |
| Quản lý ghi thu người nợ 4 tháng | ≥ 9 chạm | 3 chạm |
| Quản lý gửi hoá đơn cả toà | 3 việc riêng | 2 việc |
| Người thuê trả tiền | không làm được | 1 chạm tới mã QR (cần backend) |

Đủ bảng và cách đếm ở [02-workflow.md](02-workflow.md). Số "hiện tại" có dấu ≥ là số tối thiểu vì em chỉ được GET.

## Đầu ra

| Thứ | Ở đâu | Tình trạng |
|---|---|---|
| Chẩn đoán 12 lỗi | [01-chan-doan.md](01-chan-doan.md) | xong |
| Workflow 5 vai trò, 4 vòng đời | [02-workflow.md](02-workflow.md) | xong |
| Hệ thiết kế | [03-he-thiet-ke.md](03-he-thiet-ke.md) | xong |
| Prototype bấm thử, 38 màn | [prototype/index.html](prototype/index.html) | chạy, 0 lỗi JS qua 2.500 địa chỉ |
| Ảnh 1440 và 390 | [screens/png/](screens/png/) | 48 ảnh |
| Cũ cạnh mới | [compare/](compare/) | 10 cặp |
| So sánh font | [font-compare/](font-compare/) | 8 font |
| Ảnh app hiện tại | [evidence-app/](evidence-app/) | 40 ảnh |
| Tự kiểm | [QA.md](QA.md) | đo máy đạt hết; mắt còn 2 màn chưa đạt hẳn |

**Chưa vẽ** (prototype hiện trang "chưa vẽ"): Giá dịch vụ & cài đặt, Lịch xem phòng, An toàn PCCC, Báo cho cư dân, Nhật ký, Thợ báo sửa xong, hoá đơn điều chỉnh, trạng thái "không nợ" của Chủ và Người thuê.

## Câu hỏi cho Chủ tịch

1. **Nút chính màu đen, bỏ teal?** Đề xuất: đồng ý. Nếu Chủ tịch muốn giữ màu thương hiệu, em đề xuất chỉ giữ ở logo.
2. **Đổi tên: "kỳ" thành "tháng", "chốt kỳ" thành "khoá chỉ số", "phát hành" thành "gửi hoá đơn"?** Đề xuất: đổi ở giao diện, giữ tên cũ trong mã và API.
3. **Nhắc nợ qua Zalo cá nhân trước (mở Zalo, tin soạn sẵn), Zalo OA tự động làm sau?** Đề xuất: đồng ý, vì cách đầu không cần backend.
4. **Người thuê có được trả một phần ("chỉ trả tháng 7 trước") không?** Đề xuất: có, trừ tháng cũ trước.
5. **Ô thứ hai trên trang đầu của Chủ nên là số nào?** API tháng 11 trả `thucThu = 0` nhưng `daThuHopDong = 15.367.000`. Đề xuất: dùng tiền thực nhận trong tháng, sau khi backend xác nhận số nào đúng.
6. **Khoá chỉ số xong thì tự tạo hoá đơn nháp, bỏ bước "tạo nháp"?** Đề xuất: đồng ý.
7. **Làm màn nào trước khi code?** Đề xuất thứ tự: Người thuê trả tiền, Hôm nay của Chủ, Thu tiền, Tháng 11 của Quản lý.

## Phụ thuộc backend

| Cần | Vì sao | Làm tạm khi chưa có |
|---|---|---|
| Người thuê đọc được số tài khoản và mã QR, một mã cho tổng nhiều tháng, nội dung ngắn | hiện bị 403, app ghi "hỏi quản lý" | hiện số tài khoản để chép (vẫn cần mở quyền đọc) |
| Người thuê báo "tôi đã chuyển khoản" | quản lý biết để đối chiếu | bỏ nút, giữ câu "quản lý sẽ xác nhận" |
| Một lần ghi thu trừ vào nhiều hoá đơn | thanh toán hiện gắn từng hoá đơn | frontend gọi lần lượt, tháng cũ trước |
| Nhắc nợ hàng loạt (Zalo OA hoặc SMS) | nhắc nhiều người một lần | mở Zalo từng người, tin soạn sẵn |
| Ghi chú liên hệ theo người thuê | biết đã hẹn gì | ẩn khối |
| Báo giá của thợ theo dòng | chủ duyệt cần thấy từng khoản | API `bao-gia` có sẵn, em chưa kiểm cấu trúc vì demo không có báo giá nào |
| Sửa số lệch: `thucThu` với `daThuHopDong`; "4 công tơ chưa ghi" với "9/9"; 0 với 3 phòng đang sửa; hạn trả trước ngày gửi; "Lam tron" không dấu | giao diện không che được số sai | ghi giờ cập nhật cạnh số |

## Chưa kiểm

Chưa ai ngoài em bấm thử. Chưa thử với chủ nhà thật. Chỉ đo 1440 và 390 trên Chrome. Chưa thử trình đọc màn hình, chưa thử Safari iPhone. Chi tiết ở cuối [QA.md](QA.md).
