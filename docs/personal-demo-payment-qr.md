# QR nhận tiền tạm thời cho demo local

- Ảnh do người dùng cung cấp: QR Viettel Money, tên hiển thị Trần Ngọc Đức.
- Asset đã cắt: `frontend/public/payments/viettel-money-demo-qr.png`.
- Đã decode cả ảnh gốc và ảnh cắt bằng ZXing, xác nhận payload giống hệt; test lưu fingerprint SHA-256 để ngăn thay đổi mã ngoài ý muốn. Không suy đoán payload từ số tài khoản hiển thị.
- Ảnh cắt giữ logo, toàn bộ QR, vùng trắng và tên người nhận; bỏ status bar, cài đặt và điều hướng điện thoại.

## Kích hoạt

File `frontend/.env.local` (được Git ignore) đang có `VITE_DEMO_PERSONAL_QR=true`.
Chỉ hoạt động khi chạy Vite development (`import.meta.env.DEV`). Tắt bằng cách đổi cờ thành `false` rồi khởi động lại Vite nếu cần.

Chi tiết hóa đơn → mở **Thu tiền, biên lai và bút toán đối ứng** → **Hiện QR nhận tiền demo**. Chỉ hiện nút khi số tiền còn lại lớn hơn 0 và hóa đơn được phép thu.

Đây là QR nhận tiền tĩnh: người chuyển phải nhập số tiền còn lại và mã hóa đơn được hiển thị bên dưới. Không khẳng định số tiền/nội dung đã nhúng trong QR, không hiển thị thời hạn 15 phút cho mã tĩnh. Không tự ghi nhận thanh toán khi mở hoặc quét mã; quản lý vẫn phải đối chiếu giao dịch và ghi nhận thu tiền.

Không sửa tài khoản ngân hàng của tòa nhà, dữ liệu hóa đơn, ledger hoặc API sinh VietQR. Production build vẫn dùng QR động từ tài khoản tòa nhà, số tiền còn lại và mã hóa đơn qua endpoint có chữ ký, thời hạn 15 phút như trước.

Ảnh là mã nhận tiền người dùng cung cấp, không phải tài khoản giả. Chỉ sử dụng cho demo local theo yêu cầu; không mang cấu hình tạm này sang vận hành thu tiền cho các chủ nhà khác.
