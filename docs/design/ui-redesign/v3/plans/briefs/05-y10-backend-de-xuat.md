# Đề xuất y10 — Lô backend nhỏ (CHƯA chạy; cần Chủ tịch duyệt)

V3 có 6 chỗ chỉ làm trung thực được khi backend có thêm dữ liệu. Ở đợt UI, các chỗ này đã được **ẩn** hoặc **làm tạm phía client** và gắn nhãn "cần backend". Lô này làm sau y9, không chặn đợt UI. Chỉ chạy khi Chủ tịch duyệt, và khi đó tách thành brief code đầy đủ (kèm migration, test Spring, quyền theo vai).

| # | Việc | Endpoint / thay đổi đề xuất | Màn mở khoá | Quyền | Ước |
|---|---|---|---|---|---|
| 1 | Người thuê đọc thông tin chuyển khoản của toà mình | `GET /api/cong/thanh-toan` → `{ tenNganHang, soTaiKhoan, chuTaiKhoan, noiDungMau }` (chỉ trả toà của hợp đồng đang hiệu lực). **Không** mở `/api/toa-nha/:id/ben-a` cho người thuê vì endpoint đó có nhiều trường hơn | Trả tiền: hiện STK + nút Chép | NGUOI_THUE | 30′ |
| 2 | QR VietQR theo số tiền | Client tự tạo chuỗi EMVCo từ #1 (không cần backend), **hoặc** `GET /api/cong/thanh-toan/qr?soTien=` trả PNG | Trả tiền: QR | NGUOI_THUE | 30′ |
| 3 | "Tôi đã chuyển khoản" | `POST /api/cong/hoa-don/:id/bao-da-chuyen` → tạo thông báo cho QL toà; QL thấy trong Hôm nay "Người thuê báo đã chuyển" | Trả tiền: nút chính dính đáy | NGUOI_THUE → QUAN_LY | 45′ |
| 4 | Ghi chú / lịch sử liên hệ | `GET/POST /api/nguoi-thue/:id/ghi-chu` `{ noiDung, kenh: 'GOI'|'ZALO'|'GAP' }` | Hồ sơ người thuê: khối "Ghi chú liên hệ" | CHU, QUAN_LY | 45′ |
| 5 | Số "đã thu" thống nhất | Sửa `thucThu` của `/api/dashboard/chu` cho khớp Σ `daThu` hoá đơn (lúc lập plan `thucThu=0` trong khi `daThuHopDong=15.367.000`), hoặc bỏ trường | Hôm nay, Báo cáo (đợt UI đã tự cộng từ hoá đơn) | CHU | 30′ |
| 6 | Số công tơ thống nhất | `congToChuaGhi` của dashboard QL phải ra cùng con số với `/ky-thanh-toan/:ky/thieu-chi-so` (lúc lập plan: 20/24 so với 9 phòng có chỉ số) | Hôm nay QL, Tháng | QUAN_LY | 30′ |

Không đề xuất: nhắc nợ tự gửi qua hệ thống (SMS/Zalo OA). Việc này cần hợp đồng nhà cung cấp và chi phí, nên để Chủ tịch quyết riêng. Đợt UI đã dùng tin soạn sẵn mở bằng Zalo.
