# BÁO CÁO x0 — Khung (nhánh ui/x0-khung)

## 1. Việc đã làm
1. Test khoá định tuyến cũ (42 mục menu × vai trò + 6 ca ngoài menu), xanh trước khi đổi App — f01cb10
2. App dùng `timTuyen` (bỏ chuỗi `hienThi*`), vỏ trang mới, điều hướng SPA ở `<main>` — 13c52b3 (App.tsx 1 284 → 740 dòng; `grep -c hienThi` = 0)
3. Toà dùng chung: `ToaDangChonProvider`, `useBuildings`/`BuildingSelect` đọc từ khung, chép `nhomNoTheoNguoi` — 612faf6
4. Khung mới: sidebar nhóm theo việc, `ChonToa`, TopBar (Tìm nhanh + chuông, bỏ "Không gian quản lý"), `TabTrang`, ngăn ☰ ≤767px, bottom-nav 3 mục Thợ/Khách, số đếm nav (`soDemDieuHuong`), `TrangKhongCoQuyen`, `ux-v2.css` — 00140cc
5. `GhiChiSo anNutChot` + 1 test — 58c20eb
6. Ảnh + QA + quét 42 đường dẫn — commit cuối (shots/x0)

## 2. Lệnh kiểm
- `npx tsc -b` sạch · `npm run build` ok
- `Test Files 59 passed (59) · Tests 498 passed (498)` (trước lô: 462 ở nhóm App; thêm test định tuyến/toà/khung/số đếm/anNutChot)

## 3. Ảnh (shots/x0, QA: overflow 0, belowHit 0, textBelowFloor 0, contrast.below 0, noAccessibleName 0 ở cả 17 ảnh)
| mã | đường dẫn | khung | khác prototype |
|---|---|---|---|
| chu-hom-nay | /hom-nay | 1440/390 | ruột là ChuDashboard cũ ("Tổng quan"), x2 thay |
| chu-thu-tien | /thu-tien | 1440/390 | tab trang Cần thu/Hoá đơn/… đã có; ruột còn tab trong cũ, x1 thay |
| chu-hoa-don, chu-tong-quan | /hoa-don, /tong-quan | 1440/390 | khung đúng; ruột cũ |
| chu-phong-khong-quyen | /phong | 1440/390 | khớp ảnh 15: h1 "Trang này dành cho Quản lý toà nhà", nút "Về Hôm nay" + "Mở Toà & phòng" |
| ql-hom-nay, ql-su-co | | 1440/390 | ô toà tĩnh "An Nhiên Residence · được phân công", đếm 4/3/1 |
| tho-viec | /viec-cua-toi | 390 | bottom-nav Việc·Tiền công·Thông báo; tiêu đề "Việc" của khung trùng "Công việc" của màn (x-sau) |
| khach-hoa-don | /hoa-don-cua-toi | 390 | bottom-nav 3 mục |
| chu-ngan-menu | /hom-nay | 390 | khớp ảnh 26: ngăn 288px, nền mờ, nhóm, người dùng + đăng xuất |
Quét 42/42 đường dẫn cũ × vai trò (1440): 0 trang "Không có quyền", 0 tràn ngang (quet-qa.json). Lưu ý: CHU báo cáo con là `/bao-cao/tieu-thu`, `/bao-cao/chi-phi-bao-tri`.

## 4. Test cũ đã sửa (14, < 25)
- App.test.tsx: bảng `MENU_BY_ROLE` (4 vai trò, nhãn menu mới) · test "manager shell" (nhóm, không còn "Không gian quản lý") · test 360px (ngăn ☰ thay bottom-nav 5 ô; +2 test: click nền, Khách 3 ô) · "Không có quyền" (h1 mới) · "FR-RPT-02 CHU" (tab trang + mục Báo cáo thay nhãn menu) · `readMenuLabels` chỉ đọc nav khung · bỏ "Trang chủ", bỏ NFR-USA-01 definition-list · `localStorage` toà dọn mỗi test
- App.tho.test.tsx: Thợ vào `/viec-cua-toi` (`/tho/tong-quan` chuyển hướng) · bỏ "Bàn làm việc thợ" · bottom-nav 4 → 3 mục

## 5. Cố ý không làm / chưa kiểm
- Tìm nhanh, chuông thật (x7): vỏ trả null / link `/thong-bao`. Không đổi quyền, API, font, token.
- Sửa `tools/app-shot.mjs`: thêm `job.click` và cờ `khongCoQuyen` (cần cho ảnh ngăn ☰ và quét).
- Chưa kiểm: 1280 (sidebar thu gọn) bằng ảnh; số đếm "Chu kỳ tháng" của Quản lý dựa `soCongToChuaGhi`.
- Tab trang "Hoá đơn/Đã thu/Tiền cọc" hiện là link tới `?tab=`; màn x1 phải đọc tham số.
