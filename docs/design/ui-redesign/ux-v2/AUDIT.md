# Kiểm toán UX hiện trạng (22/11/2026) — căn cứ ảnh thật `evidence/dot-03/`

Chủ tịch: "thiết kế sắp xếp UX tệ lắm, làm lại, cần chuyên nghiệp hơn". Giai đoạn trước đã làm HỆ THIẾT KẾ (màu, font, component) và áp lên từng màn; nó chưa đụng CẤU TRÚC: màn nào chứa gì, đi từ đâu tới đâu, việc nào mất mấy bước. Đây là kiểm toán cấu trúc, không bàn màu sắc.

## A. Vấn đề cấu trúc xuyên suốt
1. **Menu phẳng theo "danh mục dữ liệu", không theo công việc.** CHU có 17 mục (Toà nhà, Người thuê, Hợp đồng, Cư trú, Lịch hẹn, Sự cố, An toàn, Dịch vụ và kỳ, Ghi chỉ số, Hoá đơn, Thu tiền, Công nợ, Báo cáo ×3, Nhật ký). Người dùng nghĩ "hôm nay tôi phải thu tiền ai / phòng nào sắp hết hạn", không nghĩ "mở bảng Công nợ". Hoá đơn / Thu tiền / Công nợ là ba bảng của cùng một việc (thu tiền).
2. **Không có bối cảnh dùng chung.** Mỗi trang tự có ô chọn toà riêng (Hoá đơn, Hợp đồng, Sự cố, Ghi chỉ số…); đổi trang là mất lựa chọn. Chủ nhiều toà phải chọn lại liên tục.
3. **Thanh trên cùng ("Không gian quản lý · 22 tháng 11, 2026 | Thông báo") + breadcrumb lặp lại tiêu đề trang.** Chiếm ~90px, không giúp việc gì; thiếu thứ cần: tìm nhanh toàn cục, chọn toà, thông báo có số, việc hôm nay.
4. **Không có điểm bắt đầu "việc hôm nay" cho Chủ.** Tổng quan Chủ là báo cáo (số, biểu đồ), không phải danh sách hành động; Nhắc việc (Quản lý) mới là danh sách hành động nhưng Chủ không có.
5. **Thực thể không liên thông.** Người thuê → không thấy hợp đồng, hoá đơn, sự cố của họ trên cùng một trang; phải đi 3 menu khác nhau rồi tự lọc lại. Phòng/Toà/Hợp đồng cũng vậy. Thiếu "hồ sơ 360°" cho Phòng, Người thuê, Hợp đồng.
6. **Hành động chính lẫn với bộ lọc/hành động thứ cấp.** Ví dụ Hoá đơn: hai nút xám ngang hàng ("Phát hành hoá đơn trong kỳ", "Tạo hoá đơn nháp hàng loạt") trông như bị vô hiệu cho tới khi chọn kỳ; câu hướng dẫn nằm dưới; bộ lọc trạng thái xuất hiện HAI lần (dropdown "Trạng thái" và chip "Đã phát hành 8 / Quá hạn 12").
7. **Danh sách lặp theo thời gian thay vì theo đối tượng.** Hoá đơn liệt kê 20 dòng cùng người thuê lặp qua nhiều tháng; câu hỏi thật ("ai đang nợ bao nhiêu") phải tự cộng. Không có hàng tổng, không nhóm theo người/phòng, mã hoá đơn kỹ thuật (`DEMO-P1-1-2026-07`) là chữ nổi nhất.
8. **Trang dài, nhiều bảng chồng nhau.** Sự cố 3.168px: bảng yêu cầu + bảng "Lịch sử sửa chữa" (cùng dữ liệu, hai cách nhìn, không liên kết). Người thuê: chi tiết/form mở bên dưới danh sách.
9. **Cột vô dụng trong bảng.** Người thuê: "CCCD/Hộ chiếu" đã che dấu sao (không giúp nhận diện), "Cảnh báo" gần như luôn rỗng, nhãn hành động dài "Xem và sửa hồ sơ" lặp 10 lần.
10. **Thông báo lỗi/quyền ngang hàng với màn thường** (màn "Không có quyền" dùng cả thẻ lớn + nút Đăng xuất + câu lặp 2 lần).
11. **Nhãn/độ sâu không đồng nhất giữa vai trò:** Quản lý có "Nhắc việc", Chủ không có; Thợ vào "Công việc" nhưng "Tổng quan thợ" nằm riêng; Khách thuê 5 tab ngang hàng không ưu tiên "Hoá đơn cần trả".
12. **Luồng nhiều bước chưa được thiết kế như luồng:** tạo hợp đồng (thao tác ở `HopDongThaoTac.tsx` 2.745 dòng), ghi chỉ số hàng tháng, kỳ thanh toán → phát hành → thu tiền. Mỗi bước là một trang/menu riêng; không có chỉ báo "đang ở bước nào / còn gì".

## B. Công việc thật của từng vai trò (cơ sở cho thiết kế mới)
- **Chủ nhà:** biết ngay hôm nay có gì cần mình (nợ quá hạn, hợp đồng sắp hết, sự cố cần duyệt chi phí, phòng trống); xem tiền thu/nợ theo toà; duyệt chi phí; xem báo cáo cuối kỳ.
- **Quản lý toà:** chu kỳ tháng — ghi chỉ số → chốt kỳ → phát hành hoá đơn → thu tiền → nhắc nợ; xử lý sự cố; lịch hẹn xem phòng; hợp đồng mới/gia hạn/thanh lý.
- **Thợ:** nhận việc → khảo sát → báo giá → làm xong → nhận tiền. Chủ yếu điện thoại.
- **Khách thuê:** xem phải trả bao nhiêu/hạn khi nào → trả → báo hỏng → xem hợp đồng. Điện thoại.
- **QTHT:** tài khoản, toà, nhật ký.

## C. Số bước hiện tại cho vài việc điển hình (đếm từ menu, 1440)
| Việc | Hiện tại |
|---|---|
| Chủ: xem ai đang nợ nhiều nhất rồi nhắc | Tổng quan (xem) → Công nợ (menu) → chọn toà → lọc → mở người → (nhắc không có chỗ) |
| Quản lý: phát hành hoá đơn tháng này | Dịch vụ và kỳ (chọn kỳ) → Ghi chỉ số (đủ?) → Hoá đơn → chọn kỳ → bấm 2 nút |
| Chủ: xem mọi thứ về một người thuê | Người thuê → mở hồ sơ → Hợp đồng (menu) → lọc tên → Hoá đơn (menu) → lọc → Sự cố (menu) → lọc |
| Khách thuê: trả hoá đơn tháng này | Hoá đơn của tôi (QR chưa có — phụ thuộc backend B2) |
