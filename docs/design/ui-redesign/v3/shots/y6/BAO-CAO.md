# Báo cáo y6 — Người thuê (thoáng)

Nhánh `ui/y6-nguoi-thue`. Chưa push, chưa merge.

## 1. Việc theo task
- T1+T2 `634b7bc`: Tiền nhà, Trả tiền (`CanTra.tsx/.css`), chi tiết hoá đơn người thuê có nút chính "Trả X ₫" (`HoaDon.tsx`). `Tieu` giữ nguyên props.
- T3+T4 `0320c2c`: Báo hỏng (lưới 3×2, nút chính trong `ChanDinh`), Phòng tôi.
- T5 `df36120` + commit sửa sau chụp ảnh: Lịch sử (hoá đơn + bảng điện nước), `/tieu-thu` đổi chữ/token, sửa test App.
- Chữ "Kỳ" → "Tháng" ở mọi màn người thuê của lô.

## 2. Lệnh kiểm
`npx tsc -b` sạch · `npx vitest run` 650 → 651 (thêm 1 test bảng điện nước) · `npm run build` ok.
Ảnh: 6 ảnh + 1 ảnh khung 844 (`23-…-khung`, để thấy nút dính đáy), vite cổng 5360, đã tắt.

## 3. Ảnh
| Mã | Khung | Khác prototype |
|---|---|---|
| 21 | 390 | Số tháng trễ lệch 1 ngày so với ảnh V3 (tính theo ngày hôm nay). Dòng "Tien phong", "Lam tron" thiếu dấu là dữ liệu demo. Thanh Cần trả/Lịch sử phía trên là khung y0. |
| 21 | 1440 | 390: một cột. 1440: danh sách tháng và cách tính bên trái, khung tổng + nút chính dính bên phải, tối đa 960px. |
| 22 | 390 | **Không QR, không số tài khoản** (người thuê bị 403 `/ben-a`); thay bằng khối "cần backend"; không có nút "Tôi đã chuyển khoản"; không có nút gọi quản lý vì không có SĐT đọc được. |
| 23 | 390 | Giống prototype. Không bấm Gửi. Nút dính đáy chỉ thấy ở ảnh `-khung` (ảnh full-page không mô phỏng sticky). Ô Phòng chỉ hiện khi có > 1 phòng. |
| 24 | 390 | Phụ đề chỉ "Phòng 101" (không có tên toà trong API hợp đồng). Nhãn "Tiền cọc thoả thuận" thay "đã đóng" (API không nói đã đóng). Không có nút gọi quản lý (không có SĐT). |
| 25 | 390 | Hàng hoá đơn đỏ khi quá hạn còn nợ. Điện nước demo giống nhau mọi tháng (96/5) là dữ liệu. |

QA 390: `horizontalOverflow` 0, `belowHit` 0, `h1.count` 1, `noAccessibleName` 0, contrast ≥ 4.5. `textBelowFloor` còn lại chỉ ở khung y0 (xem mục 5).

## 4. Test cũ đã sửa
- `CanTra.test`: 5 test. Đổi chữ "kỳ"→"tháng", câu không nợ, `data-qr-chua-co` (xoá dòng "Mã QR chưa có", nay có nhãn cần backend + nút Chép), "Chỉ trả tháng 7 trước" trỏ tháng cũ nhất (`?tra=1`, trước là tháng mới nhất `?tra=31`) theo brief.
- `BaoHongKhach.test`: 1 test. Nhãn nút "Gửi báo hỏng" trong `ChanDinh`; hạng mục chọn bằng ô thay vì gõ; payload giữ khoá cũ (`phongId, hangMuc, moTa, mucDo`).
- `HopDongNguoiThue.test`: 1 test. Câu "còn hiệu lực" → "Còn N ngày. Muốn trả phòng, báo trước 30 ngày." (mobile); thêm 0 `.btn-primary`.
- `LichSuHoaDon.test`: 3 test (liệt kê, rỗng; thêm 1 mới). Chữ tháng, dòng "đã trả … còn …"; mobile và desktop tách kỳ vọng.
- `HoaDon.test`: 2 `it` ("2 kỳ quá hạn" → "2 tháng chưa trả đủ"; "Không có kỳ nào còn nợ" → "tháng"). Luồng Chủ/QL không đổi.
- `BieuDoTieuThu.test`: 1 test ("Kỳ 08/2026" → "Tháng 8/2026").
- `App.test`: 3 `it`: `FR-POR-05 renders separate electricity and water charts…` (Tháng 8/2026), `FR-POR-03 renders the tenant invoice history newest first…` (Tháng 8/2026), `FR-POR-03 shows a first-use empty state…` ("Chưa có hoá đơn nào").

## 5. Không làm / chưa kiểm / cần lô khác / backend
- Cần lô y0 (khung): chuông badge "8" 13px; tab trên cùng "Cần trả/Lịch sử", "Hợp đồng/Tiêu thụ" 15px (< 16); mục `nav-item` 1440 cao 36 (< 44); tiêu đề thanh trên trùng h2 của màn.
- Cần backend: số tài khoản/QR cho người thuê; SĐT quản lý (nút Gọi quản lý bị ẩn); tên thợ trong "Đã báo" (API chỉ có `nguoiXuLyId`, hiện "đã có thợ nhận"); báo "đã chuyển khoản".
- Toast "quản lý sẽ gọi lại trong hôm nay": không dùng (chưa chắc quy trình), chỉ "Đã gửi báo hỏng."
- Bỏ khỏi Báo hỏng: lọc trạng thái, ô gõ hạng mục tự do, ô mức độ (thay bằng ô Khẩn cấp).
- Chưa chụp chi tiết hoá đơn (`?hoaDonId=`) và trạng thái lỗi/đang tải trên app thật; chỉ có test.
