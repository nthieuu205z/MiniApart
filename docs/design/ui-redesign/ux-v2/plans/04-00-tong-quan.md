# Plan 04 — Thi công UX v2 vào frontend (tổng quan)

> Trạng thái: **chờ Chủ tịch duyệt**. Nguồn: `ux-v2/` (README, 01, 02, 03, prototype, screens) đã duyệt cả 8 câu, lấy hết đề xuất.
> Thi công: controller (Opus) giao từng lô cho coder Sonnet theo `briefs/04-*.md`, review theo `04-review-checklist.md`. Mã mẫu đã chạy thật: `ma-mau/` (87 test, 37/37 đột biến bị bắt).

## Số đo thật — lần kiểm 22/11/2026 (scratch clone của `feat/ui-tokens@028edcd`)
- `npx tsc -b` sạch · `npx vitest run` **55 file / 358 test** xanh (5,5 s).
- Kích thước file chính: `HopDongThaoTac.tsx` 2.743 dòng · `App.test.tsx` 1.961 · `GhiChiSo.tsx` 1.454 · `ThoCongViec.tsx` 1.410 · `App.tsx` 1.284 (chuỗi `hienThi*` + 2 lớp ternary ~450 dòng) · `KhamPhaPhong.tsx` 1.150 · `ThoChiPhi.tsx` 854 · `QuanLyTaiSanPhong.tsx` 845 · `QuanLyDashboard.tsx` 707 · `DanhMucPhong.tsx` 673.
- Định tuyến hiện tại: không có thư viện router; `App.tsx` đọc `location.pathname`, ~25 cờ `hienThi*`, quyền = `roleNavigation.ts` (42 mục). 17 màn tự gọi `fetchToaNha` và tự có ô chọn toà (`BangViecVanHanh`, `BaoCaoTongQuan`, `ChiPhiBaoTriBaoCao`, `ChuDashboard`, `CongNoBaoCao`, `DanhMucPhong`, `DanhMucToaNha`, `GhiChiSo`, `HoaDonQuanLy`, `HopDongQuanLy`, `LichSuSuaChua`, `QuanLyDashboard`, `QuanLyLichHen`, `QuanLyTaiKhoan`, `ThongBao`, `ThuTien`, `TieuThuBaoCao`); 5 màn qua `useBuildings()` của `ManagementShared.tsx` (`DichVuVaKy`, `HopDongThaoTac`, `QuanLySuaChua`, `SuCoQuanLy`, `TuanThuVanHanh`).
- Quyền API đo bằng GET (token 5 vai trò): Chủ đọc được `/api/bao-cao/cong-no`, `/api/toa-nha/{id}/phong`, `/api/toa-nha/{id}/bang-viec`, `/api/yeu-cau-sua-chua`, `/api/lich-hen`, `/api/nguoi-thue`, `/api/dashboard/quan-ly?toaNhaId=`. **Quản lý: `/api/bao-cao/cong-no` = 403**, `/api/dashboard/chu` = 403, `/api/toa-nha` trả đúng 1 toà (id 3).
- `nginx.conf` có `try_files … /index.html` → đường dẫn mới (`/hom-nay`, `/nguoi-thue/1`) mở thẳng được trên stack.
- Font đã đổi ở `028edcd` (Inter). Biến font của app là `--ma-font-ui` / các token `--ma-text-*`; **không có `--font-sans`** (brief ghi nhầm) → lô dùng `font: var(--ma-text-…)` hoặc class sẵn có.

## Cách làm cho các lô không giẫm nhau (Em chọn)
1. **Một bảng định tuyến** (`dinhTuyen.ts`, mã mẫu) thay chuỗi `hienThi*`: đường dẫn → `KhoaTrang` → component. Chỉ lô nền sửa `App.tsx`.
2. **Màn mới = file riêng có sẵn từ lô nền.** Lô nền tạo file trang mỏng (`HomNay.tsx`, `ChuKyThang.tsx`, `HoSoNguoiThue360.tsx`, `HoSoPhong360.tsx`, `HoSoHopDong360.tsx`, `HoSoToa360.tsx`, `TaoHopDong.tsx`, `TrangSuCo.tsx`, `TimNhanh.tsx`, `ChuongThongBao.tsx`) với props cố định `TrangProps`; ban đầu chỉ ghép lại màn cũ (app vẫn chạy đủ khi chỉ có lô nền). Lô sau **thay ruột** file của mình, không đụng `App.tsx`.
3. **Ít chuyển hướng nhất.** Màn cũ nào vẫn còn nguyên thì giữ đường dẫn, chỉ đứng chung một mục nav + một hàng tab (`NHOM_TAB`): Thu tiền (`/thu-tien` · `/hoa-don` · `?tab=da-thu` · `?tab=coc`), Người thuê (`/nguoi-thue` · `/cu-tru`), Báo cáo (`/tong-quan` · `/bao-cao` · 2 báo cáo con · `/nhat-ky-thao-tac`), Khách (`/hoa-don-cua-toi` · `/lich-su`; `/hop-dong` · `/tieu-thu`). Chỉ 4 đường dẫn bị gộp hẳn mới tự chuyển: `/nhac-viec → /hom-nay`, `/cong-no → /thu-tien`, `/ghi-chi-so → /chu-ky`, `/tho/tong-quan → /viec-cua-toi` (giữ query). Đường dẫn mới chỉ có: `/hom-nay`, `/chu-ky`, `/hop-dong/moi`, và hồ sơ `/{nguoi-thue|phong|hop-dong|toa-nha}/:id`.
4. **Toà chọn một lần**: `ToaDangChonProvider` (mã mẫu) ở khung; `useBuildings()` của `ManagementShared` đọc/ghi context → 5 màn theo luôn. Màn tự có ô chọn toà thì lô sở hữu đổi sang `useToaDangChon()` / `useMotToa()`; màn "giữ nguyên" còn lại do lô dọn đổi.
5. **CSS mới một chỗ**: lô nền chép phần "MỚI" của `prototype/ux.css` thành `design/ux-v2.css` (import sau `components.css`). Lô sau thiếu lớp nào thì viết CSS cục bộ trong file của mình (như đợt 03), không sửa `ux-v2.css`/`components.css`.

## Thứ tự và phụ thuộc

| Đợt | Lô (nhánh `ui/x…`, worktree `PRJ/MiniApart-x…`, cổng vite) | Cần có trước | Cỡ Sonnet (em ước) |
|---|---|---|---|
| 0 | **x0 Khung** (`ui/x0-khung`, 5310) | `feat/ux-v2` tách từ `feat/ui-tokens@028edcd` | ~90 phút, 6 task (một coder — cố ý vượt 45': mọi file chung nằm ở đây) |
| 1 | **x1 Thu tiền** (5311) · **x2 Hôm nay** (5312) · **x3 Hồ sơ Người thuê + Phòng** (5313) · **x4 Hồ sơ Hợp đồng + Toà** (5314) | x0 đã gộp | 40–55' mỗi lô |
| 2 | **x5 Chu kỳ tháng** (5315) · **x8 Ghi chỉ số** (5318) · **x6 Sự cố** (5316) · **x7 Tìm nhanh + chuông** (5317) | đợt 1 đã gộp (x7 cần route hồ sơ của x3/x4 để link mở đúng màn) | 35–50' |
| 3 | **x9 Thợ** (5319) · **x10 Khách thuê** (5320) · **x11 Tạo hợp đồng 5 bước** (5321) | đợt 2 đã gộp; x11 cần x4 (bảng Hợp đồng đã thôi bật form tạo trong `HopDongThaoTac`) | 35–50' |
| 4 | **x12 Dọn + đo** (5322) | mọi lô đã gộp | ~45' |

Thứ tự đợt bám câu 8 đã duyệt (khung → Thu tiền → Hồ sơ 360° → Chu kỳ tháng → Sự cố → mobile); Hôm nay đi cùng đợt 1 vì không chung file với ai. Mỗi đợt 3–4 coder song song (chuẩn đã chốt 2–3; đợt 1 và 2 là 4 — controller có thể tách thành 2+2 nếu quota thiếu).

## Ma trận file → lô sở hữu (không file nào hai lô cùng sửa)

| File | Lô | Ghi chú |
|---|---|---|
| `App.tsx`, `App.test.tsx`, `App.tho.test.tsx`, `App.dangNhap.test.tsx` | x0 | Chỉ x0. Lô sau cần đổi gì ở App → báo controller |
| `roleNavigation.ts` | x0 | Thành cấu hình nav v2 (nhóm, nhãn, icon, `activeFor`, khoá số đếm) |
| `dinhTuyen.ts`(+test), `toaDangChon.tsx`(+test), `nhomNoTheoNguoi.ts`(+test) | x0 | Chép từ `ma-mau/`. Sau x0 không lô nào sửa; x1/x2/x3 import `nhomNoTheoNguoi` |
| `design/shell/NavPanel.tsx`, `TopBar.tsx`, `Breadcrumb.tsx`, mới `design/shell/TabTrang.tsx`, `design/shell/ChonToa.tsx` | x0 | |
| `design/ux-v2.css` (mới), `main.tsx`, `designTokens.test.ts`, `designComponents.test.tsx` | x0 | |
| `ManagementShared.tsx` | x0 | `useBuildings` ↔ context; `BuildingSelect` ẩn khi khung đã có toà |
| `GhiChiSo.tsx` | x0 (1 prop) → x8 | x0 chỉ thêm prop `anNutChot`; sau đó x8 sở hữu |
| `soDemDieuHuong.ts` (mới), `TrangKhongCoQuyen.tsx` (mới) | x0 | |
| `HomNay.tsx` (x0 tạo) · `QuanLyDashboard.tsx`(+test) · `BangViecVanHanh.tsx`(+test) | x2 | `ChuDashboard.tsx` **không ai sửa** (Báo cáo › Tổng quan giữ nguyên) |
| `ThuTien.tsx`(+test) · `HoaDonQuanLy.tsx`(+test) · `FinancePaymentPanel.tsx` · `InvoiceActions.tsx` · `financeFlows.test.tsx` | x1 | `CongNoBaoCao.tsx` để yên (hết được định tuyến, giữ file + test) |
| `HoSoNguoiThue360.tsx`, `HoSoPhong360.tsx` (x0 tạo) · `HoSoNguoiThue.tsx`(+test) · `DanhMucPhong.tsx`(+test) | x3 | |
| `HoSoHopDong360.tsx`, `HoSoToa360.tsx` (x0 tạo) · `HopDongQuanLy.tsx`(+test) · `DanhMucToaNha.tsx`(+test) | x4 | `HopDongThaoTac.tsx` chỉ được **dùng** (nhúng), không sửa |
| `ChuKyThang.tsx` (x0 tạo) · `DichVuVaKy.tsx`(+test) · mới `chuKyThang.ts`(+test) | x5 | Bước 1 nhúng `<GhiChiSo … anNutChot />`, không sửa GhiChiSo |
| `GhiChiSo.tsx`(+test), `meterPhoto.ts` | x8 | |
| `managementFlows.test.tsx` | chung x5/x6/x8/x12 | Mỗi lô chỉ sửa `it` của component mình; controller gộp tuần tự nên xung đột (nếu có) chỉ ở mức dòng |
| `TrangSuCo.tsx` (x0 tạo) · `SuCoQuanLy.tsx` · `QuanLyBaoGiaVaThanhToan.tsx`(+test) | x6 | `LichSuSuaChua.tsx`, `QuanLySuaChua.tsx` để yên (hết được ghép vào /su-co, giữ file + test) |
| `TimNhanh.tsx`, `ChuongThongBao.tsx`(+test) (x0 tạo) · `timNhanh.ts`(+test, mã mẫu) · `ThongBao.tsx`(+test) | x7 | |
| `ThoCongViec.tsx`(+test) | x9 | `ThoTongQuan.tsx` để yên (hết được định tuyến) |
| `HoaDon.tsx`(+test, chỉ nhánh khách) · `BaoHongKhach.tsx`(+test) · `LichSuHoaDon.tsx`(+test) · `HopDongNguoiThue.tsx`(+test) · `BieuDoTieuThu.tsx`(+test) · mới `CanTra.tsx` | x10 | |
| `TaoHopDong.tsx` (x0 tạo) · `HopDongThaoTac.tsx`(+test) | x11 | |
| `QuanLyLichHen.tsx`, `TieuThuBaoCao.tsx`, `ChiPhiBaoTriBaoCao.tsx`, `BaoCaoTongQuan.tsx`, `TuanThuVanHanh.tsx`, `QuanLyTaiSanPhong.tsx`, `ThoChiPhi.tsx`, `QuanLyTaiKhoan.tsx`, `ChuDashboard.tsx` (+test từng file), `progress.md` | x12 | Chỉ đổi ô chọn toà → context, chữ IN HOA, nợ UI; không đổi bố cục |
| `design/components.css`, `design/**` còn lại, `tokens/**`, `assets/fonts/**`, `styles.css`, `api.ts`, `managementApi.ts`, `financeApi.ts`, `workerDashboardApi.ts`, backend, compose | **không lô nào** | Cần thêm hàm gọi API → viết trong file của lô (gọi `managementRequest`/`fetch` y như api.ts) |

## "Giữ màn cũ đặt vào khung mới" hay "làm mới" (brief §15)

| Màn | Quyết định | Vì sao |
|---|---|---|
| Lịch hẹn, An toàn PCCC, Dịch vụ & đơn giá, Tài khoản, Nhật ký, Khai báo cư trú, Toà & phòng (danh sách), Phòng (QL, danh sách/sơ đồ), Thông báo (thợ/khách) | **Giữ**, đặt vào nav/tab mới (x0); lô dọn chỉ đổi ô chọn toà → context | Prototype chỉ vẽ trang giữ chỗ ghi "giữ nội dung"; màn đã qua đợt 03 và đạt QA. Vẽ lại = việc Chủ tịch chưa duyệt bằng mắt |
| Báo cáo (5 tab) | **Giữ** 5 màn, thêm hàng tab (x0) | Tổng quan Chủ vòng 2 đã duyệt riêng; tab "Doanh thu & lấp đầy" là `BaoCaoTongQuan` cũ để không mất chức năng (prototype ghi 4 tab, gộp 2 màn tổng quan vào 1 tab là mất số liệu) — **Em chọn** |
| Chu kỳ tháng bước 1 | **Làm lại** trong `GhiChiSo` (x8): công tơ chưa ghi lên đầu, phòng đã ghi gọn thành bảng, 1 nút chính; điện thoại 1 công tơ/màn | Prototype vẽ chi tiết (`12`, `23`); trang cũ 11.151px, 18 nút chính |
| Chu kỳ tháng bước 2–4 | **Làm mới mỏng** trong `ChuKyThang` (x5), mỗi bước = 1 khối giải thích + 1 nút chính gọi **API đang có** (`chotKyThanhToan`, `bulkInvoice` tạo/phát hành, link Thu tiền). Không vẽ màn riêng nào khác | Prototype chỉ có mô tả + nhãn nút; dùng lại đúng API của GhiChiSo/HoaDonQuanLy nên không thêm nghiệp vụ |
| Thông báo cư dân (QL) | **Giữ** phần soạn của `ThongBao`; hộp thư riêng chuyển vào chuông (x7) | Câu 5 đã duyệt |
| Danh sách Người thuê / Hợp đồng / Toà | **Giữ** bảng, đổi hành vi bấm hàng → hồ sơ (x3/x4) | Câu 4 + nguyên tắc "không form dưới danh sách" |

## Gộp và cổng kiểm
- Nhánh tích hợp `feat/ux-v2` (tách từ `feat/ui-tokens@028edcd`). Mỗi lô: nhánh `ui/x<N>-<tên>` tách từ `feat/ux-v2` **sau khi đợt trước đã gộp**, worktree riêng.
- Controller gộp tuần tự trong đợt theo thứ tự số lô (`git merge --no-ff`), sau mỗi lần gộp chạy `npx tsc -b && npx vitest run`; hết đợt chạy thêm `npm run build`.
- **Cổng giữa đợt** (đạt hết mới mở đợt sau): (1) tsc sạch, vitest xanh, số test ≥ số trước đợt + số test mới các lô khai; (2) build qua; (3) checklist `04-review-checklist.md` mục chung + mục của từng lô đã đánh dấu kèm bằng chứng; (4) ảnh app thật (vite → backend 5190) 1440 + 390 cho mọi màn lô đụng, controller tự mở bằng vision; (5) `qa.json` overflow 0, belowHit 0, contrast.below 0 ở các ảnh đó; (6) sau đợt 0 và đợt 4: quét 42 đường dẫn menu cũ × vai trò (jobs sinh từ bảng `MENU_CU` trong `dinhTuyen.test.ts`) — không trang nào ra "Không có quyền".
- Không push, không merge vào `main`/`feat/ui-tokens` khi Chủ tịch chưa duyệt ảnh; stack 5190 chỉ đọc.

## Không làm
- Không đổi quyền, route API, backend; không thêm field/endpoint. Thứ cần API mới: nhắc nợ (nút ẩn, chỉ "Xuất danh sách" CSV từ dữ liệu đã tải), QR + "Tôi đã chuyển khoản" + số tài khoản cho khách (ẩn — xem x10), lịch sử liên hệ trong hồ sơ người thuê (ẩn khối).
- Không đụng font/token/`@font-face`/`assets/fonts` (lô font của điều phối).
- Không xoá file/test đã hết được định tuyến (`CongNoBaoCao`, `LichSuSuaChua`, `ThoTongQuan`, `ViecCuaToi`): x12 lập danh sách để Chủ tịch quyết.
- Không vẽ lại các màn "giữ" ở bảng trên; không làm Figma.

## Rủi ro
- `App.test.tsx` (1.961 dòng) khoá menu, topbar, breadcrumb: x0 phải sửa fixture menu + thay assertion topbar; nếu sửa > 25 test thì dừng báo controller (dấu hiệu đổi hành vi ngoài ý).
- Viết lại chuỗi `hienThi*` dễ làm lệch quyền ở ca lạ (QTHT mở `/hoa-don`, QL mở `/toa-nha`, Chủ drill-down công nợ thiếu `kyId`). Chặn bằng: test đặc tả hành vi cũ viết **trước** khi thay (x0 task 1) + bảng `dinhTuyen.test.ts`.
- Màn cũ tự `history.replaceState` về đường dẫn của nó (`HoaDonQuanLy` → `/hoa-don?…`, `CongNoBaoCao`, `LichSuSuaChua` → `/su-co?…`): đúng với cách giữ đường dẫn ở trên; lô nào đổi đường dẫn của màn phải sửa luôn chỗ này.
- Chủ ở "Tất cả toà" mở màn chỉ xem từng toà: hiện ô chọn toà tại chỗ (`useMotToa`), chọn xong là đổi toà của khung — đây là hành vi mới Chủ tịch chưa thấy trong prototype; ảnh nghiệm thu x5 phải có ca này.
- Đợt 1/2 bốn coder song song: quota. Controller ước ~8–10% phiên/lô; không vừa thì tách đợt.
- Màn "Trả tiền" của khách (`22`) khác bản duyệt: không có số tài khoản/QR/nút "đã chuyển" vì thiếu API → chỉ còn hướng dẫn + nội dung chuyển khoản (x10). Báo Chủ tịch kèm ảnh.

## Danh sách file plan
- `04-00-tong-quan.md` (file này) · `04-review-checklist.md` · `ma-mau/` (README + 8 file)
- `briefs/04-x0-khung.md` · `04-x1-thu-tien.md` · `04-x2-hom-nay.md` · `04-x3-ho-so-nguoi-thue-phong.md` · `04-x4-ho-so-hop-dong-toa.md` · `04-x5-chu-ky-thang.md` · `04-x6-su-co.md` · `04-x7-tim-nhanh-chuong.md` · `04-x8-ghi-chi-so.md` · `04-x9-tho.md` · `04-x10-khach-thue.md` · `04-x11-tao-hop-dong.md` · `04-x12-don.md`
