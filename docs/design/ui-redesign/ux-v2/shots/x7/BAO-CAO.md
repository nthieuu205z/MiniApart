# Báo cáo lô x7 — Tìm nhanh (Ctrl/⌘+K) + chuông thông báo

1. Việc đã làm
- T1 `beb5159` Tìm nhanh: `TimNhanh.tsx` + `chiMucTimNhanh.ts`(+test, chép nguyên mã mẫu). Ctrl/⌘+K, "/" (khi không ở ô nhập), nút ô tìm; combobox/listbox/option ARIA; ↑↓ Enter Esc; focus trả về (useDialogTrap); tải lần đầu mở, cache theo tập toà trong phiên; QL 1 toà, Chủ mọi toà; không gọi công nợ.
- T2 `12c0e2b` Chuông: `ChuongThongBao.tsx/.css` (huy hiệu lệch góc −4/−6px, không đè biểu tượng; hộp 5 tin; "Đánh dấu đã đọc" gọi `danhDauThongBaoDaDoc` cho từng tin chưa đọc rồi tải lại; Esc/click ngoài đóng). `ThongBao.tsx`: bỏ ô chọn toà riêng (dùng `useBuildings`/`BuildingSelect`), Chủ/QL thu gọn 5 tin + nút "Xem cả n thông báo", phát sự kiện `ma:thong-bao-chua-doc` để chuông theo trang.
- T3 `80e211c` Test: `TimNhanh.test.tsx` (5), `ChuongThongBao.test.tsx` (3).

2. Kiểm
- `npx tsc -b`: sạch. `npm run build`: OK.
- `npx vitest run`: Test Files 66 passed (66), Tests 560 passed (560) (trước lô 543).

3. Ảnh (app thật, vite 5317, backend 5190)
| ảnh | khung | khác prototype |
|---|---|---|
| x7-chu-cmdk-quang-huy-1440 (so 03) | 1440 | 03 là menu chọn toà (không có Ctrl+K); đối chiếu với prototype cmdk: giống bố cục/nhóm/tô đậm; thật có 4 người + Hợp đồng/Hoá đơn, danh sách cuộn |
| x7-chu-cmdk-rong-1440, x7-ql-cmdk-quang-huy-1440/390 | 1440/390 | chân hộp ở 390 xuống dòng hơi chật |
| x7-ql-chuong-1440 (so 11) | 1440 | huy hiệu 25 nằm lệch góc, không che chuông (prototype đè); thiếu dòng chú "Bấm một thông báo…" (cố ý, đã có "Xem tất cả") |
| x7-ql-chuong-390 | 390 | hộp cố định mép phải, vừa khung |
| x7-ql-thong-bao-1440/390, x7-tho-thong-bao-390 | 1440/390 | qa.json: overflow 0, belowHit 0, contrast.below 0 cả 3 |
- Chủ ở 1440: chuông 0 chưa đọc nên không có huy hiệu (`x7-chu-chuong-1440`).
- Ghi nhận (x0b, không bù): lề trang `/thong-bao` còn lệch so với thanh trên; tab trang chưa thấy trong ảnh.

4. Test cũ đã sửa: không có.

5. Cố ý không làm / chưa kiểm
- Tên `timNhanh.ts` trùng `TimNhanh.tsx` (Windows/tsc phân biệt hoa-thường lỗi) → đổi thành `chiMucTimNhanh.ts`.
- Chuông dùng `data-testid` `chuong-nut`/`chuong-so` để test App cũ (link dự phòng `topbar-notifications`) vẫn xanh; link dự phòng bị CSS ẩn.
- "Đánh dấu đã đọc" của chuông không báo ngược sang trang `/thong-bao` đang mở (chỉ chiều ngược lại). Không bấm nút ghi trên app thật. Chưa kiểm Safari/⌘K thật.
