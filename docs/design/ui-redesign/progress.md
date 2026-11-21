# Ledger thi công UI redesign (nhánh `feat/ui-tokens`, worktree `PRJ/MiniApart-ui`)

## Đã xong (21/11/2026)
- Overlay token + font Việt `f39bad2`; `.gitattributes` LF `a494d62`.
- Plan 00 (component nền): `0b-1…0b-5`, `0-6` — gộp, 274 test.
- Plan 01: 01-1 Hợp đồng, 01-2 Ghi chỉ số, 01-3 Thợ, 01-4 Hoá đơn khách — gộp.
- Plan 02: 02-1 sidebar/bottom-nav + sửa lỗi khung, 02-2 Dashboard Chủ, 02-3 Nhắc việc — gộp.
- Gộp 6 nhánh `ui/w1…w6` không xung đột: `npx tsc -b` sạch, `npm test` 43 file / 301 test xanh, build qua (JS 803,80 kB).
- Ảnh nghiệm thu bản gộp từ app thật (5190): `evidence/dot-01/` (8 ảnh + qa-*.json): `horizontalOverflow=0`, `belowHit=0` ở cả 8; `contrast.below` còn 1 mục/ảnh (dấu "›" breadcrumb 1,35:1).
- Stack 5190 đang chạy frontend build của bản gộp này.

## Nợ ghi nhận cho plan 03 / lô 03-0 (từ ảnh thật)
1. `design/shell/Breadcrumb.tsx`: dấu "›" dùng `--ma-border-dashed` → đổi `--ma-text-muted` (hết lỗi tương phản 1,35:1).
2. Breadcrumb trang `/tong-quan` và `/nhac-viec` ghi "Bảng việc vận hành" — sai nhãn.
3. `DataTable`: thiếu icon kính lúp ô tìm; nút phân trang `‹ ›` nhỏ, tương phản 1,35 khi vô hiệu; không gắn được `data-*` lên `<tr>`; không có dạng thẻ mobile (màn Hợp đồng đang dùng CSS thẻ cục bộ `.hd-bang`); chip mặc định (`?sapHetHan=true`) chưa bật sẵn.
4. Nhãn bottom-nav 11–12px bị probe gắn `textBelowFloor` (8 mục ở 390).
5. Nút `md` giữ 44px (test `ViecCuaToi` khoá) lệch spec 40px desktop — Chủ tịch chưa quyết.
6. Sidebar CHU 17 mục: cuộn nội bộ ở 900px — mục cuối (Chi phí bảo trì, Nhật ký thao tác) nằm dưới nếp cuộn; chưa kiểm bằng thao tác thật.
7. `ThoCongViec`: nút "Lập báo giá"/"Báo xong" chỉ mở drawer (cần nhập liệu); chưa bấm thử vì không ghi vào backend demo.
8. `app-shot.mjs`: mỗi lần chỉ chạy được 1 job có `role` — chạy từng job trong vòng lặp.
9. Backend demo: B1 (`@Order` seeder) … B13 — chưa làm, ghi ở cuối các plan.

## CHỜ (quota)
- Lúc ghi: phiên Claude còn 20% (reset sau ~2h16m), tuần còn 29% (reset sau ~2 ngày 23 giờ).
- TIẾP: plan 03 — lô 03-0 trước, rồi lô A–F song song (6 worktree/nhánh `ui/03-a…f`), rồi lô 03-Z. Brief mẫu: `plans/briefs/*.md` (đợt 01/02) + `plans/03-man-con-lai.md`.

## Vòng 2 màn Tổng quan Chủ (21/11/2026, `ui/w7-chu2` đã gộp)
- Chủ tịch: màn Tổng quan "không ổn, làm lại"; màn Hợp đồng OK.
- Làm lại: 1973 → 1221px cao ở 1440; bỏ 4 thẻ thừa; đầu trang 1 hàng; biểu đồ tháng chưa có số = trống; sidebar Chủ vừa 17 mục ở 900px. 302 test xanh. Ảnh: `evidence/dot-02/`. QA 1440/900: overflow 0, belowHit 0, contrast 0 mục.
- Nợ còn lại: đoạn nét đứt tháng đang mở rơi về 0 (11/2026 chưa có số) trông như doanh thu sụp — nên để trống tháng đang mở khi cả hai chuỗi bằng 0 (hoặc chỉ ghi chú "chưa có số").

## Lô B — bảng quản trị & danh mục (`ui/b-bang-quan-tri`, 21/11/2026)
- 6 màn dùng `DataTable` + design system: Tài khoản (chip vai trò có số, lọc trạng thái, avatar, menu ⋯), Toà nhà (+ thẻ chi tiết), Nhật ký thao tác / Cư trú / An toàn, Người thuê, Phòng (chip trạng thái, chuyển Dạng bảng/Sơ đồ tầng), Tài sản phòng (DataTable + Field + chip).
- Dùng chung: `frontend/src/bangQuanTriChung.tsx` (avatar, SĐT nhóm 4-3-3, menu ⋯, CSS `.bq-*`).
- Test: thêm `HoSoNguoiThue.test.tsx` (5), `TuanThuVanHanh.test.tsx` (5); sửa test Tài khoản, Phòng, App, stylesCleanup theo UI mới. `tsc` sạch, 45 file / 318 test xanh, build qua.
- Ảnh nghiệm thu (1440/1024/390, app thật 5190): overflow 0, belowHit 0. Còn lệch: ô phòng "Trống" ở sơ đồ mobile 3,23:1 (RoomCell, design system — chưa sửa); Tài khoản 1024 / Nhật ký 1024 / Cư trú / An toàn / Người thuê 1024 chưa chụp lại sau lần sửa cuối.
- Tab Biên bản bàn giao của Tài sản chỉ kiểm bằng test (cần `hopDongId`, màn Phòng không truyền).
