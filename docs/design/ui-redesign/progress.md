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

## Lô 03-Z — bật reset, dọn styles.css, guard cấm cũ, nghiệm thu 44 mục (`ui/z1`, 22/11/2026)
- `design/base.css` đã bật; `styles.css` gỡ `.ma-table-container`, `.ma-consumption-bar`, `.ma-topbar-notification`, reset h1/h2/p thừa; guard cấm `IBM Plex Mono`, `--ma-font-mono`, `textTransform: uppercase`, `letterSpacing` dương trong `.tsx` (designTokens.test.ts); gỡ @font-face + 4 woff2 Plex.
- Nghiệm thu 88 ảnh (44 mục × 1440/390) + 8 ảnh 1024: overflow 0, belowHit 0, contrast.below 0, không Plex. `textBelowFloor` còn lại: chỉ nhãn bottom-nav / breadcrumb 12px ở 390.
- Nợ còn: bảng Hợp đồng / Sự cố ở 1024 cắt cột cuối trong khung cuộn; chữ IN HOA viết cứng trong HopDongThaoTac, phiếu in ThoChiPhi, QuanLyTaiSanPhong (danh mục), QuanLyDashboard; Nhật ký thao tác hiện chuỗi kỹ thuật thô.

| # | Mục | Role | 1440 sau (ov/hit/contrast/text<) | 390 sau | 1440 trước | 390 trước |
|--|--|--|--|--|--|--|
| 1 | /dang-nhap | công khai | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| 2 | /kham-pha | công khai | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| 3 | /nhat-ky-thao-tac | QTHT | 0/0/0/0 | 0/0/0/5 | 0/0/0/0 | 0/0/0/5 |
| 4 | /tai-khoan | QTHT | 0/0/0/0 | 0/0/0/5 | 0/0/0/0 | 0/0/0/5 |
| 5 | /toa-nha | QTHT | 0/0/0/0 | 0/0/0/5 | 0/0/0/0 | 0/0/0/5 |
| 6 | /an-toan | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 7 | /bao-cao | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 8 | /bao-cao/chi-phi-bao-tri | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 9 | /bao-cao/tieu-thu | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 10 | /cong-no | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 11 | /cu-tru | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 12 | /dich-vu | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 13 | /ghi-chi-so | CHU | 0/0/0/0 | 0/0/0/5 | 0/0/0/22 | 0/0/0/5 |
| 14 | /hoa-don | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 15 | /hop-dong | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 16 | /lich-hen | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 17 | /nguoi-thue | CHU | 0/0/0/0 | 0/0/0/7 | 0/0/0/0 | 0/0/0/7 |
| 18 | /nhat-ky-thao-tac | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 19 | /su-co | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 20 | /thu-tien | CHU | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 21 | /toa-nha | CHU | 0/0/0/0 | 0/0/0/7 | 0/0/0/0 | 0/0/0/7 |
| 22 | /tong-quan | CHU | 0/0/0/0 | 0/0/0/5 | 0/0/0/0 | 0/0/0/5 |
| 23 | /an-toan?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 24 | /cu-tru?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 25 | /dich-vu?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 26 | /ghi-chi-so?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/5 | 0/0/0/22 | 0/0/0/5 |
| 27 | /hoa-don?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 28 | /hop-dong?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 29 | /lich-hen?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 30 | /nguoi-thue?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 31 | /nhac-viec?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/7 | 0/0/0/0 | 0/0/0/8 |
| 32 | /phong?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/3/11 |
| 33 | /su-co?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 34 | /thong-bao?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 35 | /thu-tien?toaNhaId=3 | QUAN_LY | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 36 | /tho/chi-phi | THO | 0/0/0/0 | 0/0/0/7 | 0/0/0/0 | 0/0/0/7 |
| 37 | /tho/tong-quan | THO | 0/0/0/0 | 0/0/0/4 | 0/0/0/0 | 0/0/0/4 |
| 38 | /thong-bao | THO | 0/0/0/0 | 0/0/0/6 | 0/0/0/0 | 0/0/0/6 |
| 39 | /viec-cua-toi | THO | 0/0/0/0 | 0/0/0/6 | 0/0/0/0 | 0/0/0/6 |
| 40 | /bao-hong | NGUOI_THUE | 0/0/0/0 | 0/0/0/7 | 0/0/0/0 | 0/0/0/7 |
| 41 | /hoa-don-cua-toi | NGUOI_THUE | 0/0/0/0 | 0/0/0/8 | 0/0/0/5 | 0/0/0/8 |
| 42 | /hop-dong | NGUOI_THUE | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 43 | /lich-su | NGUOI_THUE | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
| 44 | /tieu-thu | NGUOI_THUE | 0/0/0/0 | 0/0/0/8 | 0/0/0/0 | 0/0/0/8 |
