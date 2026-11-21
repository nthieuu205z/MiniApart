# Plan 02 — Dashboard Chủ nhà (03), Nhắc việc/Quản lý (04), sidebar gom nhóm, bottom-nav Thợ "Báo giá"

> Thi công bằng `superpowers:executing-plans`. 02-1 (khung điều hướng) đi trước vì đổi thứ tự menu mà `App.test.tsx` khoá; 02-2 và 02-3 song song sau đó.

## Cần có trước
- Plan 00 đã merge (`components.css`, `Icon`, `Card/KpiCard`, `NavPanel` có `icon/count/shortLabel/depth`, `app-shot.mjs`).
- Không cần plan 01 (khác file), trừ khi 01-3 đã thêm `shortLabel: 'Báo giá'` — khi đó 02-1 chỉ việc giữ.
- Ảnh đích: `screens/png/03-dashboard-chu.png`, `04-nhac-viec.png`; cấu trúc nhóm: `assets/shell.js` dòng 8–31.

## Số đo thật — lần kiểm 21/11/2026
- `npm test` 38 file / 252 test xanh; build qua.
- Component + test hiện có:

| Màn | File (dòng) | Test | API / kiểu dữ liệu |
|---|---|---|---|
| Khung điều hướng | `roleNavigation.ts` (122: đường dẫn + nhãn theo vai trò), `App.tsx` (1.335: `taoNhomDieuHuong` dòng ~1258, `NHOM_DIEU_HUONG_THEO_VAI_TRO` dòng ~1314–1334, `kiemTraManHinhHep` = `innerWidth < 768` dòng ~1243), `design/shell/NavPanel.tsx` (356) | `App.test.tsx` (43; `readMenuLabels` = `textContent` của mọi `nav a`, so **đúng thứ tự** với `menuLabels` dòng 31–71; "FR-AUT-04" kiểm có chữ `Hàng ngày`, `Tiền`, `Toà nhà`), `App.tho.test.tsx` (2; có chữ `Bàn làm việc thợ`) | — |
| 03 Chủ | `ChuDashboard.tsx` (1.095) nhúng `BangViecVanHanh.tsx` (133) | `ChuDashboard.test.tsx` (2), `BangViecVanHanh.test.tsx` (1) | `fetchDashboardChu(token, toaNhaId?, tuNgay?, denNgay?)` → `kpi{thucThu, doanhThuPhatHanh, congNoHienTai, soHoaDonQuaHan, tyLeLapDay, tongSoPhong, soPhongDangThue, soPhongTrong, chiPhiBaoTri, soSuCoDangMo…}`, `taiChinhTheoThang[]`, `soSanhToaNha[]{tenToaNha, thucThu, congNo…}`, `tieuThuDienNuoc{dien[],nuoc[]}` (theo kỳ, **không theo toà**), `tuoiNo`, `coCauPhong`, `dienNuocDungChung.doiSoat`; `fetchCongNoBaoCao(token, null)` → `congNo: ThongTinKhoanNoBaoCao[]` (từng hoá đơn, có `nguoiThueId, hoTenNguoiThue, soPhong, tenToaNha, conLai, soNgayQuaHan`); `fetchTieuThuBaoCao(token, {toaNhaId:null…})` → dòng có `toaNhaId, nam, thang, laDien, mucTieuThu` |
| 04 Quản lý | `QuanLyDashboard.tsx` (865) nhúng `BangViecVanHanh` | `QuanLyDashboard.test.tsx` (2: KPI + hộp thoại "Xử lý cảnh báo tiêu thụ"; hộp thoại "Ghi chỉ số điểm đo chung") | `fetchDashboardQuanLy` → `kpi{khoanConPhaiThu, soHoaDonQuaHan, tienQuaHan, soCongToChuaGhi…}`, `canhBaoDienNuoc[]`, `congToChuaGhi{tenKyHienTai, tongSoCongTo, soCongToDaGhi, danhSachChuaGhi[]}`, `lichHenSapToi[]`, `coCauPhong`, `tuoiNo`; `fetchBangViecVanHanh(token, toaNhaId)` → `nhomViec[]{ma, tieuDe, soLuong, trangThai, tenTrangThai, khanCap, lienKet}` với `ma` ∈ `NO_QUA_HAN, HOP_DONG_SAP_HET_HAN, SU_CO_TON_DONG, THIEU_CHI_SO` (đọc `BangViecVanHanhService.java`); `capNhatTrangThaiLichHen`; `fetchKyThanhToan` (`ngayKetThuc` = ngày chốt) |

- Nhóm menu hiện tại trong `App.tsx` **khác** design: CHU đang là `Tổng quan / Tiền / Vận hành`, design (`shell.js`) là *(không nhãn: Tổng quan)* / **Vận hành** / **Tiền** / **Theo dõi**; QUAN_LY đang `Hàng ngày / Tiền / Toà nhà`, design `Hằng ngày / Tiền / Toà nhà` với mục chia khác.
- `ChuDashboard`, `QuanLyDashboard`, `BaoCaoTongQuan` hiện **không có SVG** (0 thẻ `<svg>/<path>`) — biểu đồ phải dựng mới.

## Trước khi thi công, kiểm lại với code thật
- Nhãn nhóm "Hàng ngày" (code + test) vs "Hằng ngày" (design). → Giữ **"Hàng ngày"** (Chủ tịch chốt giữ nhãn hiện có; test FR-AUT-04 kiểm chữ này).
- `ChuDashboard.test.tsx` dòng 120–141 khoá chữ `Doanh thu phát hành`, `Dòng tiền thực thu`, `Công nợ hiện tại`, `Phòng trống / Sửa`, `TIÊU THỤ ĐIỆN`, `TIÊU THỤ NƯỚC`, `Đối soát công tơ tổng`, `Khớp đối soát`; dòng 144–232 khoá nút "Tháng này" → URL có `tuNgay=` và thẻ phòng dẫn `/toa-nha`.
- `QuanLyDashboard.test.tsx` dòng 128–140 khoá `Cần thu hồi nợ`, `53.990.000`, `20 quá hạn`, `Công tơ chưa ghi`, `7 điểm đo`, `Cảnh báo bất thường điện nước`, `Mới phát hiện`.
- Kiểm vai trò CHU có được gọi `/api/hop-dong?toaNhaId=` cho từng toà (dùng ở khối "Hợp đồng sắp hết") — `HopDongQuanLy` đang gọi bằng token CHU nên dự kiến được.

## Rủi ro
- Đổi thứ tự menu làm đỏ `App.test.tsx` (it.each theo vai trò) — **dự kiến, có chủ đích**: chỉ đổi thứ tự mảng `menuLabels` của CHU và QUAN_LY, **tập nhãn giữ nguyên** (17 và 13 nhãn).
- Dashboard Chủ gọi thêm 2 + N request (công nợ, tiêu thụ, hợp đồng theo N toà). CHU demo có 3 toà → 6 request khi mở màn. Chấp nhận cho demo; ghi phụ thuộc backend B6 để gộp.
- Dashboard bỏ chữ IN HOA và một số khối cũ → test cũ phải đổi chữ; mọi số liệu cũ phải còn chỗ hiện (không mất thông tin).

## Không làm
- Không biến thể tông màu (Chủ tịch chốt câu 10: không làm). Không thêm nút chính cho dashboard Chủ (câu 7).
- Không sửa `roleNavigation.ts` (đường dẫn + nhãn giữ nguyên). Không đổi route.
- Không thêm thư viện biểu đồ: dùng `design/charts/bieuDo.ts` (mã mẫu đã chạy) + SVG.
- Không làm câu diễn giải "Phòng trống: 401 (đã có hợp đồng chờ ký từ 27/11) và 402 (3 lịch hẹn xem)" ở 04 — cần ghép 3 nguồn; chỉ hiện số theo trạng thái phòng.
- Không làm dòng "Kiểm tra PCCC" và mô tả từng dòng việc ở 04, dòng "Công tơ chưa ghi" cho Chủ ở 03 → phụ thuộc backend.

---

## Task 02-1 — Sidebar gom nhóm theo design + bottom-nav Thợ "Báo giá"  · cỡ S · làm trước
**File:** `App.tsx` (chỉ `NHOM_DIEU_HUONG_THEO_VAI_TRO` + `taoNhomDieuHuong` để gắn `icon/shortLabel/depth`), `App.test.tsx` (`menuLabels` CHU, QUAN_LY), `designComponents.test.tsx` (nếu cần).
**Làm:** sao đúng `assets/shell.js`:
```
QTHT:      Quản trị [/tai-khoan, /toa-nha] · Theo dõi [/nhat-ky-thao-tac]
CHU:       (không nhãn) [/tong-quan]
           Vận hành [/toa-nha, /nguoi-thue, /hop-dong, /cu-tru, /lich-hen, /su-co, /an-toan]
           Tiền     [/dich-vu, /ghi-chi-so, /hoa-don, /thu-tien, /cong-no]
           Theo dõi [/bao-cao, /bao-cao/tieu-thu (depth 1), /bao-cao/chi-phi-bao-tri (depth 1), /nhat-ky-thao-tac]
QUAN_LY:   Hàng ngày [/nhac-viec, /ghi-chi-so, /lich-hen, /su-co]
           Tiền      [/hoa-don, /thu-tien, /dich-vu]
           Toà nhà   [/phong, /hop-dong, /nguoi-thue, /cu-tru, /an-toan, /thong-bao]
THO:       Bàn làm việc [/tho/tong-quan, /viec-cua-toi, /tho/chi-phi (shortLabel "Báo giá"), /thong-bao]
NGUOI_THUE:Cá nhân [/hoa-don-cua-toi (shortLabel "Hoá đơn"), /lich-su, /tieu-thu, /hop-dong, /bao-hong]
```
- Mục con của "Báo cáo" **luôn hiện** (thụt lề, `depth: 1`), không thu gọn — giữ đủ 17 liên kết cho CHU.
- Icon theo `shell.js` (`dashboard, building, users, contract, home, calendar, wrench, shield, layers, meter, receipt, wallet, debt, chart, history, door, megaphone, key, bell, bolt`) qua `Icon` của plan 00.
- Nhãn trong `<a>` vẫn là `nhan` của `roleNavigation.ts`; `shortLabel` chỉ dùng ở bottom-nav.
**Anh sẽ thấy:** 1440 CHU: sidebar 256px nền trắng, nhóm Vận hành/Tiền/Theo dõi, mục đang mở nền teal nhạt; 1024: sidebar thu gọn còn icon; 390 THO: 4 tab, tab 3 ghi "Báo giá", tiêu đề trang vẫn "Báo giá & thanh toán".
**Không được xảy ra:** mất/đổi chữ nhãn nào trong `roleNavigation.ts`; route `/bao-cao/tieu-thu` bị coi là "Không có quyền"; bottom-nav thợ có nút "Thêm".
**Test:** `App.test.tsx` đổi đúng 2 mảng `menuLabels` (thứ tự mới, cùng tập nhãn) — ghi lý do trong commit: "đổi thứ tự theo nhóm sidebar đã duyệt". Thêm 1 test vào `App.tho.test.tsx`: ở 390px (`window.innerWidth = 390`) bottom-nav hiện "Báo giá", `aria-label` của liên kết đó là "Báo giá & thanh toán".
**Lệnh:** `npx vitest run src/App.test.tsx src/App.tho.test.tsx` → 43 + 3 passed; kiểm tập nhãn không đổi: `git diff -U0 src/App.test.tsx` chỉ đổi 2 dòng `menuLabels`.

## Task 02-2 — Tổng quan Chủ nhà (màn 03)  · cỡ L · song song với 02-3 (sau 02-1)
**File:**
- `frontend/src/design/charts/bieuDo.ts` + `.test.ts` — **chép nguyên `plans/ma-mau/…/design/charts/`** (9 test, 8/8 đột biến bị bắt): `mocTruc` (mốc trục 1/2/5×10ⁿ), `duongVaVung` (path đường + vùng, `null` cắt đoạn, kẹp trần), `cungGauge` (gauge 180°).
- `frontend/src/design/charts/BieuDoVung.tsx`, `Gauge.tsx`, `ThanhXepHang.tsx` (mới, mỗi file ≤ 50 dòng, chỉ vẽ SVG từ các hàm trên, có `<title>` + bảng số ẩn `sr-only` cho đọc màn hình).
- `frontend/src/dashboardTongHop.ts` + `.test.ts` — **chép nguyên `plans/ma-mau/frontend/src/`** (7 test): `nhomNoQuaHanTheoNguoiThue` (gộp hoá đơn quá hạn theo người thuê, sắp theo tiền/ngày), `tieuThuTheoToaKyGanNhat`.
- `ChuDashboard.tsx` viết lại phần render (giữ state chọn toà/khoảng thời gian, `data-testid="owner-dashboard-screen"`), `ChuDashboard.test.tsx` (sửa test 1).
**Bố cục theo `03-dashboard-chu.png` (lưới 12 cột):**
- TopBar: "Tổng quan" + "N toà · M phòng · từ … đến … · cập nhật HH:mm"; segmented "6 tháng gần nhất / Tháng này / 12 tháng" (giữ logic tính `tuNgay/denNgay` hiện có). Không nút chính.
- Hàng KPI 3 thẻ: **Thực thu** (`kpi.thucThu`, "Đã thu x% trên `doanhThuPhatHanh` ₫ phát hành trong kỳ", link "Báo cáo doanh thu" → `/bao-cao`); **Công nợ** (`kpi.congNoHienTai`, "`soHoaDonQuaHan` hoá đơn quá hạn…" từ `tuoiNo`, link "Xem công nợ" → `/cong-no`); **Tỷ lệ lấp đầy** (gauge `kpi.tyLeLapDay`, "`soPhongDangThue`/`tongSoPhong` phòng đang thuê · `soPhongTrong` phòng trống", bấm → `/toa-nha` như test hiện có).
- "Nợ quá hạn nhiều nhất": `nhomNoQuaHanTheoNguoiThue(congNo, theo, 5)` + segmented Theo số tiền / Theo số ngày; mỗi dòng avatar + tên + "toà · phòng · N hoá đơn" + số tiền + "trễ N ngày" (đỏ); link "Tất cả X hoá đơn quá hạn" → `/cong-no`.
- "Doanh thu theo tháng": `BieuDoVung` 2 series `thucThu`/`doanhThuPhatHanh` từ `taiChinhTheoThang`.
- 3 thẻ nhỏ: Toà thu nhiều nhất (max `soSanhToaNha.thucThu`), Hợp đồng sắp hết (gần nhất trong `/api/hop-dong?toaNhaId=` mỗi toà có `sapHetHan`, "Phòng · toà · còn N ngày"), Sự cố đang mở (`kpi.soSuCoDangMo`, "Chi phí kỳ này `kpi.chiPhiBaoTri`").
- "Tiêu thụ điện theo toà": `ThanhXepHang` từ `tieuThuTheoToaKyGanNhat(fetchTieuThuBaoCao({toaNhaId:null}).…)`, chân "Tổng … kWh · nước … m³" (nước từ `kpi`/`tieuThuDienNuoc.nuoc` kỳ cuối).
- "Công nợ theo toà": `ThanhXepHang` từ `soSanhToaNha.congNo`.
- "Cần chú ý": Sự cố đang mở · Hoá đơn quá hạn · Hợp đồng sắp hết hạn · **Đối soát công tơ tổng** (hiện khi `dienNuocDungChung.doiSoat.vuotNguong`, chữ "Khớp đối soát"/"Lệch …" lấy từ `doiSoat.trangThai`) — mỗi dòng là liên kết.
- `BangViecVanHanh` không còn nhúng ở 03 (đã thuộc 04); giữ component.
**Anh sẽ thấy (1440, CHU 0999000011):** giống `03-dashboard-chu.png` với số thật (vd. Thực thu 376.130.000 ₫, Công nợ 173.450.000 ₫, 75%); 1024: lưới 2 cột; 390: 1 cột, không cuộn ngang.
**Không được xảy ra:** chữ IN HOA/mono; nút chính; mất thông tin đối soát công tơ tổng; biểu đồ vẽ NaN khi kỳ không có số (`duongVaVung` đã kẹp).
**Test:** sửa test 1 của `ChuDashboard.test.tsx`: thay các chữ cũ (`Doanh thu phát hành`, `Dòng tiền thực thu`, `Phòng trống / Sửa`, `TIÊU THỤ ĐIỆN/NƯỚC`) bằng `Thực thu`, `Công nợ`, `Tỷ lệ lấp đầy`, `Nợ quá hạn nhiều nhất`, `Tiêu thụ điện theo toà`; **giữ** các số `376.130.000`, `173.450.000`, `75%` và chữ `Đối soát công tơ tổng`, `Khớp đối soát`; mock thêm `/api/bao-cao/cong-no` và `/api/bao-cao/tieu-thu`. Test 2 (Tháng này + `/toa-nha`) giữ nguyên. Thêm `bieuDo.test.ts` (9) + `dashboardTongHop.test.ts` (7).
**Lệnh:** `npx vitest run src/ChuDashboard.test.tsx src/design/charts src/dashboardTongHop.test.ts` → 2 + 9 + 7 passed.

## Task 02-3 — Nhắc việc / Quản lý (màn 04)  · cỡ M · song song với 02-2
**File:** `QuanLyDashboard.tsx` (render), `BangViecVanHanh.tsx` (đổi ruột thành danh sách việc theo design), `QuanLyDashboard.test.tsx`, `BangViecVanHanh.test.tsx`.
**Bố cục theo `04-nhac-viec.png`:**
- TopBar: "Nhắc việc" + "toà · kỳ MM/YYYY đang mở, chốt số ngày `ngayKetThuc` (còn N ngày)"; chọn toà; **một** nút chính "Ghi `soCongToChuaGhi` công tơ còn thiếu" → `/ghi-chi-so?toaNhaId=` (ẩn khi = 0).
- "Việc của toà hôm nay": mỗi `nhomViec` một dòng: icon theo `ma`, `tieuDe`, `StatusTag` (`khanCap` → Khẩn, `trangThai=DA_XONG` → Đã xong, còn lại Cần xử lý), số đếm `soLuong`, liên kết hành động (`lienKet`; nhãn theo `ma`: NO_QUA_HAN "Mở danh sách", HOP_DONG_SAP_HET_HAN "Gia hạn", THIEU_CHI_SO "Ghi chỉ số", SU_CO_TON_DONG "Mở sự cố"). Đầu thẻ "N việc cần xử lý · M đã xong".
- Cột phải: **Còn phải thu** (`kpi.khoanConPhaiThu`, dòng mô tả từ `tuoiNo`); **Công tơ kỳ …** (`soCongToDaGhi/tongSoCongTo`, chip các `danhSachChuaGhi` "401 · Điện", nút phụ "Ghi chỉ số điểm đo chung" mở hộp thoại cũ); **Lịch hẹn xem phòng** (`lichHenSapToi`, nút "Xác nhận" khi chờ xác nhận → `capNhatTrangThaiLichHen` như `QuanLyLichHen`); **Phòng** (`coCauPhong`: đang thuê / trống / ngưng).
- **Cảnh báo bất thường điện nước** (`canhBaoDienNuoc`) giữ thành một thẻ dưới "Việc của toà hôm nay", nút "Xử lý" mở hộp thoại cũ "Xử lý cảnh báo tiêu thụ".
**Anh sẽ thấy (1440, QUAN_LY 0999000020, An Nhiên):** giống `04-nhac-viec.png` trừ dòng "Kiểm tra PCCC" và dòng mô tả dưới mỗi việc (chưa có dữ liệu); hai hộp thoại cũ vẫn mở được.
**Không được xảy ra:** mất hộp thoại xử lý cảnh báo / ghi điểm đo chung; hai nút chính.
**Test:** `QuanLyDashboard.test.tsx` test 1: đổi `Cần thu hồi nợ` → `Còn phải thu`, `Công tơ chưa ghi`/`7 điểm đo` → `Công tơ kỳ` + `x/y`; giữ `53.990.000`, `Cảnh báo bất thường điện nước`, `Mới phát hiện`, luồng hộp thoại. Test 2 giữ nguyên. `BangViecVanHanh.test.tsx`: thêm kiểm 1 dòng `khanCap` có chữ "Khẩn" + liên kết đúng `lienKet`.
**Lệnh:** `npx vitest run src/QuanLyDashboard.test.tsx src/BangViecVanHanh.test.tsx` → passed; `npm test` toàn bộ xanh.

## Nghiệm thu bằng ảnh
```json
[
 {"name":"03-1440","path":"/tong-quan","role":"CHU","w":1440,"h":900,"full":true},
 {"name":"03-1024","path":"/tong-quan","role":"CHU","w":1024,"h":768,"full":true},
 {"name":"03-390","path":"/tong-quan","role":"CHU","w":390,"h":844,"full":true},
 {"name":"04-1440","path":"/nhac-viec?toaNhaId=3","role":"QUAN_LY","w":1440,"h":900,"full":true},
 {"name":"04-1024","path":"/nhac-viec?toaNhaId=3","role":"QUAN_LY","w":1024,"h":768,"full":true},
 {"name":"04-390","path":"/nhac-viec?toaNhaId=3","role":"QUAN_LY","w":390,"h":844,"full":true},
 {"name":"nav-tho-390","path":"/viec-cua-toi","role":"THO","w":390,"h":844,"full":false},
 {"name":"nav-khach-390","path":"/hoa-don-cua-toi","role":"NGUOI_THUE","w":390,"h":844,"full":false}
]
```
`node docs/design/ui-redesign/tools/app-shot.mjs evidence/ui-redesign/02/jobs-02.json evidence/ui-redesign/02` → so với `03-dashboard-chu.png`, `04-nhac-viec.png`, `00-design-system.png` (sidebar/bottom-nav); `qa.json` đạt tiêu chí chung (plan 00).

## Phụ thuộc backend
| # | Màn | Thiếu gì | Đề xuất |
|---|---|---|---|
| B6 | 03 | Dashboard Chủ không có "hợp đồng sắp hết" và "công tơ chưa ghi" (chỉ dashboard Quản lý có `congToChuaGhi`); hiện phải gọi `/api/hop-dong` từng toà, còn công tơ thì không có nguồn cho Chủ | Thêm `hopDongSapHetHan[]` (top 3) và `congToChuaGhi{tong, chuaGhi}` vào `/api/dashboard/chu` |
| B7 | 03 | Tiêu thụ theo toà: `tieuThuDienNuoc` chỉ theo kỳ; đang ghép từ `/api/bao-cao/tieu-thu` (trả từng phòng) | Thêm `tieuThuTheoToa[]` kỳ gần nhất vào `/api/dashboard/chu` |
| B8 | 04 | Dòng mô tả dưới mỗi việc ("20 hoá đơn · 50.398.000 ₫ · lâu nhất trễ 139 ngày") | Thêm `moTa` vào `ThongTinNhomViecVanHanh` |
| B9 | 04 | Việc "Kiểm tra PCCC" chưa có trong `BangViecVanHanhService` | Thêm nhóm `KIEM_TRA_AN_TOAN` lấy từ hạng mục an toàn chưa kiểm trong kỳ |
