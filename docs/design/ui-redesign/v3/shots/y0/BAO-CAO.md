# Báo cáo y0 — nền V3 (nhánh `ui/y0-nen`)

## 1. Việc theo task
- **A** `d67f7a4` — token V3 + overlay, font IBM Plex Sans (9 file, SHA OK 9/9; xoá Inter), 4 giá trị `colors.css`, hex teal/kem trong `components.css` → token, nút mực (+`variant="danger"` viền đỏ), StatusTag chấm+chữ, Card/Table/Input/Chip/Toast theo `v3.css`, guard V3.
- **B** `9a98fb5` — `data-density` theo vai trò (`matDo.ts`), nav theo `NAV` V3 (CHU có bottom-nav 4 mục + "Thêm" mở ngăn), TopBar "Tìm phòng, người, hoá đơn… ⌘K", tách `ManDangNhap.tsx` (`App.dangNhap.test.tsx` qua, không sửa), 8 component mới (`DauTrang, KhoiSo, DongViec, DongNguoiNo, NganNhacNo, ThanhBuoc, HangTong, NhanMinhHoa, ChanDinh`) + `DataTable.tongHang`, công cụ đo.
- **Sửa sau chụp ảnh** (commit cuối): bottom-nav dùng cỡ chữ theo mật độ (≥16 ở thoáng), `--ma-control-h-sm` 32→36 (để belowHit desktop = 0), `.tag` không `!important` (chú thích trên ảnh đăng nhập bị mất nền), bỏ weight 700 trong `design/**`.

## 2. Lệnh kiểm (chạy thật)
`npx tsc -b && npx vitest run && npm run build` đều qua. **Test: 617 → 650** (75 file). `grep Inter/teal/kem` trong `src/**/*.css|tsx` (không tính test) rỗng. `contrast.py`: 24 cặp V3, trượt 0 (mực/trắng 17,82; phụ 8,19; link 6,99; đỏ/đỏ nhạt 5,72; link toast/mực 10,44; viền ô 3,01…).

## 3. Ảnh (app thật qua vite 5300, 9 ảnh; `qa.json` cùng thư mục)
| Mã | h1 (left,top) | Khác prototype |
|---|---|---|
| chu-hom-nay-1440 | 288,96 | Khung đúng V3 (sidebar 224, nav chọn xám, chuông ở topbar). Thân màn là HomNay cũ (chưa có "Ai đang nợ"/"Cần quyết hôm nay": lô y1). Sidebar hiện tên người dùng ở chân, prototype cũng vậy. |
| chu-hom-nay-390 | 16,84 | Đáy: Hôm nay·Tiền·Toà·Sự cố·Thêm. Thân vẫn màn cũ. |
| ql-hom-nay-1440 / 390 | 288,96 / 16,84 | Nav QL theo V3 (Tháng 11 đếm, Thu tiền, Lịch xem phòng). 390 dùng ngăn ☰ như cũ. |
| tho-viec-390 | 16,16 | Đáy 2 mục Việc·Tiền công, chuông trên đầu. Nút chính mực. |
| kh-tien-nha-390 | 16,16 | Đáy 4 mục Tiền nhà·Báo hỏng·Phòng tôi·Lịch sử. Nút "Trả …" mực. |
| qtht-tai-khoan-1440 | 288,99 | Chip lọc nền xám + viền mực khi chọn. |
| dang-nhap-1440 / 390 | 208,252 / 36,197 | Nút mực; bố cục cũ (y8 làm lại). |
- 1440 → 390: sidebar → ngăn ☰ / thanh đáy; dải số 4 cột → lưới 2 cột; nút cao 36 → 44 (Thợ/Người thuê 52).
- QA: `horizontalOverflow` 0, `h1.count` 1, `contrast.below` 0, `noAccessibleName` 0 ở cả 9; `belowHit` 0 ở cả 9 (sau sửa); `fontsLoaded` có Plex 400/500/600, `fontFamiliesUsed` chỉ IBM Plex Sans. **`textBelowFloor` ≠ 0 ở THO và NGUOI_THUE** (13–15px cứng trong màn: số liệu, nhãn chip, "Chỉ trả kỳ…") — nằm trong file màn nghiệp vụ, để các lô y-màn sửa.
- `qa.json` là lần chụp thứ hai (sau sửa); riêng `y0-dang-nhap-1440.png` chụp lại lần ba sau sửa `.tag`, qa.json chưa cập nhật mục đó.
- Ảnh full-page 390: thanh đáy cố định hiện giữa ảnh (do cách chụp full-page), không phải lỗi bố cục.

## 4. Test cũ đã sửa (lý do)
- `ViecCuaToi.test` (FR-MNT-04): nút Thử lại kiểm `var(--ma-control-h)` thay `44px` — Button không còn minHeight cứng, cao theo mật độ.
- `App.test` — `MENU_BY_ROLE` (QTHT, CHU, QL, NGUOI_THUE, THO): nhãn nav V3 (ảnh hưởng 4 `it.each` "exact menu", "manager shell", "☰ drawer", "vertical left nav", "no-permission state"); `it` "three-slot bottom bar" → "four-slot": Người thuê có 4 mục; "manager shell": bỏ kiểm nhãn nhóm "Phòng & người thuê"/"Vận hành" (nav V3 không còn nhãn nhóm), kiểm "Hôm nay"/"Sự cố".
- `App.tho.test`: nav Thợ bỏ "Thông báo" (chuông ở đầu trang): 2 `it` (entry point; bottom-nav 2 tab). Thêm kiểm `data-density="thoang"`.
- `designTokens.test`: khoá `--ma-paper-1` #F7F8FA (cũ #F9F7F6) · `--ma-font-ui` có "IBM Plex Sans" · tập hex cho phép bỏ `#8fd3c8 #e6f2f0 #115e59` và hex ấm `#fdf1dc #92400e #f3e8e2 #8a3b12 #efece7 #57534e`, thêm `#a9c7ff #2a313a #eceef1` · thêm test "không file CSS nào còn Inter/teal/kem v2" · 4 guard mono/IN HOA/letterSpacing giữ nguyên.
- `designComponents.test`: +9 test mới (không sửa test cũ). Tổng test sửa: 13 `it` ở 4 file.

## 5. Không làm / chưa kiểm / cần lô khác
- Không đổi `ManDangNhap` giao diện (y8). Thân Hôm nay, bảng "Ai đang nợ" (y1).
- TopBar chưa có "tên + vai trò" riêng (đã có ở chân sidebar; Thợ/NT dùng đăng xuất icon). `TabTrang` chỉ đổi qua CSS có sẵn (gạch chân mực).
- Chưa có test cho "Thêm" của CHU mở ngăn nav (chỉ thấy bằng ảnh) và không chụp ảnh ngăn mở.
- `.tag` ẩn icon bằng CSS (DOM vẫn có icon); `Toast` 6 giây/Hoàn tác do nơi gọi (chưa có chỗ gọi nào đổi).
- `--ma-control-h-sm` 36 (brief ghi 32): lệch so với brief vì tiêu chí `belowHit` ≥36 desktop.
- Nhãn "Tháng N" của QL lấy tháng hiện tại lúc nạp module (không theo tháng kỳ đang mở).
- Không chạy `run-repo-guard.sh`, `dinhTuyen.test` không phải sửa. Vite 5300 đã tắt.
