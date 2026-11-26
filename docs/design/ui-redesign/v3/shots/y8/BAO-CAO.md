# Báo cáo y8 — Khung & Quản trị

## 1. Việc theo task
- T1 `8fe4b49` Đăng nhập: một thẻ 400, nền `--ma-paper-2`, bỏ ảnh minh hoạ, link "Đặt lại mật khẩu" mở `TaiKhoanTruyCap` (luồng `quen-mat-khau` có thật), "Xem phòng còn trống" dưới thẻ. Lỗi dưới ô qua `Field`.
- T2 `93f6755` Tìm nhanh: placeholder/chữ rỗng theo brief, nhóm mới **Màn** (Lịch xem phòng, PCCC, Dịch vụ, Thu tiền, Thông báo; Chủ thêm Nhật ký, Tiêu thụ, Chi phí bảo trì), đường dẫn giữ nguyên.
- T3 `cb9ed99` Chuông: thời gian tương đối; số đếm trong `aria-label` đã có sẵn. Màn `/thong-bao` không sửa (đã ăn token, ≤1 nút chính mỗi lúc).
- T4 `1e5a7c1` Không có quyền: giữa màn, khoá, h1 theo vai trò sở hữu, gợi ý theo vai trò, không in SĐT.
- T5 `2ab2460` Tài khoản: `DauTrang` (đếm theo vai trò), chip Nhân sự/Người thuê, cột Họ tên · Điện thoại · Vai trò · Số toà · Tình trạng · Sửa; Khoá = `danger` trong form Sửa, hỏi lại bằng `ConfirmDialog`.
- Chưa commit trong lô này: sửa sau chụp ảnh (ô tìm rộng, h1 không-có-quyền 22px, nút "Thêm tài khoản" trong `ChanDinh` ở 390, link "Xem tất cả" xanh) + ảnh + báo cáo.

## 2. Lệnh kiểm
`tsc -b` sạch · `vitest` **650 → 652** xanh · `npm run build` ok. Vite cổng 5380 đã tắt.

## 3. Ảnh (qa.json: overflow 0, belowHit 0, contrast 0, textBelowFloor 0, h1=1, noAccessibleName 0 cho cả 9 ảnh)
| Mã | Khung | Khác prototype |
|---|---|---|
| 30 | 1440/390 | Có logo chữ "M" thay biểu tượng; thêm nút chữ "Xem phòng còn trống" (brief). 390: thẻ giãn theo bề ngang, không đổi cấu trúc. |
| 32 | 1440 | Mở bằng click `.ux-search` (không gõ được chữ nên chỉ chụp hộp rỗng: có "Làm nhanh"). Không có phím tắt G/H. |
| 33 | 1440 | Ngăn thông báo là popover, prototype là panel phải toàn cao; không có nút "Đánh dấu đã đọc cả N" đáy panel (nút ở đầu popover). Không có link tới màn liên quan (API không trả). |
| 37 | 1440/390 | Prototype in SĐT QTHT — cố ý bỏ. 390: chữ xuống dòng; nút chính chưa nằm trong `ChanDinh`. |
| 38 | 1440/390 | Dữ liệu thật (70 tài khoản, 8 dòng/trang). 390: bảng thành thẻ, "Thêm tài khoản" dính đáy (`ChanDinh`). |
| 39 | 1440 | `/thong-bao` chỉ để kiểm token, không so prototype. |

## 4. Test đã sửa (lý do)
- `App.test.tsx`: "stacks the login panels at 360px" (không còn lưới 2 cột → kiểm thẻ rộng `min(400px,100%)`); 3 chỗ "Không có quyền" → "Trang này dành cho" (nhãn "Không có quyền" bỏ theo brief T4: dòng ~363, ~427, vòng lặp ~1990-2012); "gives QTHT an account management screen" và "lets QTHT create, edit… lock" (nhãn "Thêm tài khoản", "Hoạt động", Khoá chuyển vào form Sửa, "Đã khoá").
- `QuanLyTaiKhoan.test.tsx`: "liệt kê" (cột Số toà thay tên toà), "tạo", "vai trò quyết định trường", "chặn trùng" (nút mở form → "Thêm tài khoản"); "khoá qua API", "yêu cầu xác nhận khoá" (đường vào Khoá + "Đã khoá"); "chip vai trò" viết lại cho chip Nhân sự/Người thuê.
- `TimNhanh.test.tsx`: "Quản lý không gọi công nợ…" (câu rỗng mới). Thêm 1 test Màn → `/lich-hen`; thêm `TrangKhongCoQuyen.test.tsx`.

## 5. Không làm / cần lô khác
- `ConfirmDialog` (y0) luôn là nút `primary` → hộp "Khoá tài khoản" có nút chính; cần y0 thêm `tone="danger"`.
- Ngăn thông báo kiểu panel phải, link theo từng thông báo: cần backend/khung (TopBar).
- `ChuongThongBao.css`, `ThongBao.tsx`, `TaiKhoanTruyCap.tsx`, `KhamPhaPhong.tsx`: chưa sửa (đã dùng token; không phát hiện lỗi). Chưa kiểm tay luồng ghi trên app thật (chỉ GET).
- 4 trạng thái (T6): tải = khung xương, lỗi = "Tải lại" ở Tài khoản; chưa làm riêng cho Tìm nhanh ngoài những gì có sẵn. Chưa kiểm `SyncBanner` mất mạng.
