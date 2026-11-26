# BAO-CAO y9 — Dọn & đo (nhánh `ui/y9-don`)

## 1. Việc theo task (commit)
Bổ sung ngoài brief:
1. `4a889d8` Gỡ nhóm tab khung `thu-tien` (màn Tiền tự có tab trong thẻ). Các nhóm còn lại (nguoi-thue, bao-cao, can-tra, phong-cua-toi) màn không tự có tab → không có chỗ nào 2 hàng.
2. `e57f5e0` `ChanDinh`: `.ma-app-shell[data-bottom-nav] .ma-chandinh { bottom: nav + safe-area }` (App đặt `data-bottom-nav` khi có thanh dưới). Xoá ghi đè ở ThuTien.css, SuCo.css, ThoCongViec (CSS_THO), CanTra.css, HoSoHopDongToa.css. Sửa luôn lỗi Chủ/QL không có nav mà vẫn chừa 60px.
3. `429b853` `ConfirmDialog variant="danger"`; dùng cho khoá tài khoản. Thanh lý, huỷ hoá đơn, từ chối báo giá không dùng ConfirmDialog (đã là nút `danger` mở ngăn riêng) → chưa đổi.
4. `70e59ac` + `ade5431` Mật độ `thoang` ≥16 trong components.css (btn, label, irow, tab, chuông 22px/16px, nav, avatar, pager, th); xoá CSS font trong CSS_THO.
5. Desktop: chọn **nav ≥44/16 ở thoang** (V3 §2: thoang áp mọi bề rộng; sửa probe sẽ hạ chuẩn của người dùng lớn tuổi). `.ma-app-shell .nav-item` (ux-v2) 36/14.5 thắng độ ưu tiên nên viết lại với `.ma-app-shell[data-density="thoang"]`.
6. `5d8c3f0` Nav Thợ "Việc của tôi" (nhãn ngắn "Việc" ở bottom-nav); Người thuê 390: tiêu đề trong màn chuyển `sr-only` (Báo hỏng, Phòng tôi, Lịch sử) vì thanh trên đã là h1.
7. `b6f9850` Nhãn "Tháng N" của QL lấy theo kỳ đang mở (`thangDangMo`, API kỳ), fallback tháng hiện tại.
8. `0a9d803` /tong-quan: thẻ, biểu đồ (`daThuTheoHoaDon`) và "Toà thu nhiều nhất" (`daThuHopDong` từng toà qua `fetchDashboardChu`) cùng nguồn hoá đơn; bỏ `thucThu`.
9. `ee5313c` Hàng tab cuộn ngang ≤767: mép mờ + bóng, đệm cuối.
Brief:
- `e90e472` app-shot tự tìm cdp.mjs.
- T2 `7156b23` quét sót. T1 `7338a93` màn giữ.

## 2. Lệnh kiểm
`npx tsc -b` sạch · `npx vitest run` 707 → **710** xanh (76 file) · `npm run build` qua · `git diff --stat feat/v3...HEAD` gồm cả file khung/design do mục bổ sung cho phép.
Ảnh: `app-shot.mjs` 75 job (`jobs.json`), vite 5390 đã tắt.

## 3. T2 quét sót (trước → sau)
- Chữ cũ: 103 → 4: `HopDongThaoTac.tsx:361,442` (`'Chủ sở hữu'` = chức vụ bên A in vào hợp đồng, giá trị gửi API), `QuanLyDashboard.tsx:237,415` (regex `/^Kỳ/` đọc chuỗi máy chủ "Kỳ 11/2026"). Còn lại đổi theo bảng; "định kỳ" → "theo lịch", "Chu kỳ kiểm tra" → "Kiểm tra mỗi".
- Hex: 27 → 0 (`#fff` → `--ma-text-on-inverse`, avatar/banner/toast → token trạng thái; bỏ fallback hex trong `var()`; QR giữ nền `--ma-bg-card`). Toast/error icon nay cùng màu `--ma-text-secondary-on-inverse`.
- Weight 700/uppercase/letterSpacing dương: 28 → 0 (700 → 600).

## 4. Bảng đo (75 ảnh, đủ ngưỡng)
Cả 75: overflow 0 · belowHit 0 · **textBelowFloor 0** · contrast.below 0 · noAccessibleName 0 · font = IBM Plex Sans · h1.count 1.
| Khung | h1.left | h1.top | Ghi chú |
|---|---|---|---|
| 1440 | 288 | 96 (15 màn) · 122 (5: toà/phòng/người/hợp đồng chi tiết, tạo hợp đồng — có breadcrumb) · 133 (5: tab trang) | sidebar đầy chữ, ô số liệu đủ cột |
| 1024 | 136 | 96 / 122 / 133 | sidebar thu thành icon 44px; tên người dùng ẩn |
| 390 | 16 | 84 (12) · 112 (5) · 129 (2) · 16 (6: Thợ/Người thuê, h1 nằm ở thanh trên) | bảng → danh sách; ChanDinh dính trên bottom-nav; nav đáy |
`h1.top` không bằng nhau: lệch do khung (hàng breadcrumb +26, hàng tab trang +37, thanh trên của Thợ/Người thuê ở 390) — thuộc y0/controller, không sửa ở đây.

## 5. Test sửa (lý do)
- `dinhTuyen.test.ts` 'tab đang chọn…', 'nhóm tab theo vai trò': nhóm thu-tien bị gỡ → đổi sang bao-cao, thêm khẳng định thu-tien không có nhóm.
- `designComponents.test.tsx` 'TabTrang: link thật…': cùng lý do; thêm 'ConfirmDialog variant=danger'.
- `App.test.tsx` 'FR-INV-02 isolates application chrome…': /hoa-don còn 2 `.ma-no-print` (không còn hàng tab). Cùng file: đổi chuỗi "Chủ sở hữu mẫu/…" (dữ liệu giả) và 'Kỳ 09/2026' theo bảng tiếng nói.
- `ChuDashboard.test`: 'Chi phí kỳ này' → 'tháng này'. `DichVuVaKy.test` 'liệt kê dịch vụ…': 'Tháng đang mở: 9/2026' (nay ở thẻ, không ở dòng phụ DauTrang) + 'Tháng tính tiền'. `GhiChiSo.test` (3 it): "tháng này/TB 3 tháng/Khoá chỉ số". `HomNay.test` (2 it): "Hạn khoá chỉ số ngày". `ThuTien.test` 'Xuất Excel…': cột "Số tháng". `QuanLyDashboard.test`: "Chi phí tháng này".
- Mới: `managementFlows.test` (4 màn giữ: 1 h1, ≤1 nút chính), `soDemDieuHuong.test` (`thangDangMo`).

## 6. Không làm / chưa kiểm / cần lô khác
- Màn giữ: chỉ đổi vỏ sang `DauTrang`; bảng tự viết khác giữ nguyên.
- `SO-V3.md`: chỉ lập bảng theo tên ảnh, chưa soi cặp; `compare.sh` không dùng (ghép ảnh `evidence-app` cũ). V3 35, 36 chưa có ảnh app.
- Cần lô khác: Hợp đồng Chủ 390 — tên người nằm lệch hàng trong thẻ (y3); NT 1440 cột chính chỉ ~2/3 bề rộng (y6); dữ liệu demo "Tien phong", "Lam tron" không dấu (dữ liệu máy chủ).
- "Toà thu nhiều nhất" gọi thêm 1 request dashboard mỗi toà khi xem tất cả toà (API so sánh không có số theo hoá đơn): cần backend thêm trường (y10).
- Không có test cho thẻ /tong-quan mới (fixture trùng giá trị thucThu = daThuTheoHoaDon).
