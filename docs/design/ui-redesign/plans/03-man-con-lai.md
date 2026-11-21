# Plan 03 — Các màn còn lại theo `screen-inventory.md` (01, 02, 09 + mọi mục khác)

> Thi công bằng `superpowers:executing-plans` / `superpowers:dispatching-parallel-agents`. Chia **7 lô**; lô 03-0 đi trước, lô A–F **song song, mỗi lô một worktree + nhánh** (`ui/03-a-form-cong-khai`, `ui/03-b-bang-quan-tri`…), tách từ `feat/ui-tokens` sau khi plan 00 (bắt buộc) và 02-1 (khung điều hướng) đã merge. Lô 03-Z (bật reset toàn cục) làm **cuối cùng**, sau khi mọi lô đã merge.

## Cần có trước
- Plan 00 merge (component chung, `DataTable`, `Card`, `Field`, `EmptyState` loading/error, `Icon`, `app-shot.mjs`).
- Plan 02 task 02-1 merge (sidebar/bottom-nav mới) — để ảnh nghiệm thu có khung đúng.
- Plan 01 và 02-2/02-3 **không** bắt buộc (khác file), trừ lô D cần `design/charts/*` (chép từ `plans/ma-mau` nếu 02-2 chưa merge — cùng nội dung).

## Số đo thật — lần kiểm 21/11/2026
- `npm test` 38 file / 252 test xanh; build qua (JS 790,40 kB, CSS 19,02 kB). `git log -1` = `a38cc81`.
- `screen-inventory.md`: 44 mục (2 công khai + QTHT 3 + CHU 17 + QUAN_LY 13 + THO 4 + NGUOI_THUE 5) → ~32 màn khác nhau sau khi bỏ trùng; 5 mẫu bố cục `dashboard | table | form | detail | mobile-task` + `công khai`.
- Plan 01 + 02 đã phủ: 03, 04, 05, 06, 07, 08 (gồm `HopDongQuanLy`, `GhiChiSo`, `ThoCongViec`, `HoaDon`, `ChuDashboard`, `QuanLyDashboard`, `BangViecVanHanh`). Plan này phủ **phần còn lại**, liệt kê đủ ở bảng lô.
- Đòn bẩy dùng chung: `ManagementShared.tsx` (73 dòng: `fieldStyle`, `gridStyle`, `panelStyle`, `rowStyle`, `Field`, `Feedback`, `BuildingSelect`, `SaveButton`) được 7 file dùng — `DichVuVaKy`, `GhiChiSo`, `HopDongThaoTac`, `HoSoNguoiThue`, `QuanLySuaChua`, `TaiKhoanTruyCap`, `TuanThuVanHanh`. Đổi ruột một lần → 7 màn đổi diện mạo form.
- Số đo hiện trạng bằng `tools/app-shot.mjs` (21/11/2026, không đăng nhập): `/kham-pha` 1440 có các chip tiện ích cao **28px** (< 36px) trong `belowHit`; `/dang-nhap` 390 có nút "← Khám phá phòng trống" cao **25px** (< 44px) và chữ 12px/12,5px dưới sàn 13px của mobile.

## Trước khi thi công, kiểm lại với code thật (mỗi lô tự chạy)
```bash
cd C:/Users/nthieuu05/Documents/PRJ/MiniApart-ui/frontend/src
wc -l <file của lô>.tsx; ls <file>.test.tsx; grep -n "data-testid\|data-[a-z-]*-row" <file>.tsx
grep -n "toContain('[^']*')" <file>.test.tsx      # chữ mà test khoá — đổi chữ phải sửa test có lý do
```
- `TuanThuVanHanh.tsx` (52 dòng) định nghĩa `AnToanVanHanh`, `CuTruVanHanh`, `NhatKyVanHanh` — dữ liệu qua `managementRequest` (`managementApi.ts`, 32 dòng; kiểu dữ liệu nằm trong `managementApi.ts`, không có trong `api.ts`).
- `QuanLySuaChua.tsx` (39) là vỏ: khách thuê (`tenant`) = form báo hỏng; quản lý = form + `QuanLyBaoGiaVaThanhToan` (573) + `LichSuSuaChua` (272) ở `/su-co`.
- Đăng nhập nằm trong `App.tsx` dòng ~700–810 (`autoComplete="username"`, `"current-password"`, nút `type="submit"`), thông báo lỗi = `reason.message` từ server (dòng ~465).

## Rủi ro
- `KhamPhaPhong.tsx` 1.621 dòng, `ThoChiPhi.tsx` 1.144, `DanhMucPhong.tsx` 1.007, `QuanLyTaiSanPhong.tsx` 975 — chỉ thay JSX/style, giữ state + gọi API; nếu một task phình > 400 dòng diff thì tách nhỏ.
- Màn **chưa có test** riêng: `HoSoNguoiThue` (368), `HoaDonQuanLy` (434; chỉ `App.test.tsx` FR-INV-02 khoá `data-invoice-row` + href), `ThuTien` (126), `DichVuVaKy` (102), `QuanLyBaoGiaVaThanhToan` (573), `LichSuHoaDon` (182), `BieuDoTieuThu` (290). Lô đụng tới phải **viết test render tối thiểu trước khi đổi** (chụp hành vi cũ), rồi mới đổi giao diện.
- Lô 03-Z bật reset toàn cục: mọi `<ul>` mất bullet, `<a>` mất gạch chân, `h1–p` mất margin. Màn nào còn dựa vào mặc định trình duyệt sẽ lệch → chỉ bật khi mọi lô xong + chụp lại toàn bộ.

## Không làm
- Không thêm field/API; thiếu dữ liệu → bảng "Phụ thuộc backend" cuối file.
- Không làm "Ghi nhớ trên thiết bị này" ở 01 (`authSession.ts` luôn lưu `localStorage`); không tự đếm "Còn N lần thử" — hiện nguyên thông báo server.
- Không làm `ViecCuaToi.tsx` (không được render ở `App.tsx`).
- Không thêm biến thể màu; không đổi route/nhãn menu.

---

## Lô 03-0 — Đổi ruột `ManagementShared` + `TableFrame`  · cỡ S · làm trước lô A–F
**File:** `ManagementShared.tsx`, `design/layout/Screen.tsx` (`TableFrame`, `TableHeadCell`, `TableCell`, `FormPanel`, `FormField`), `designComponents.test.tsx`.
- `fieldStyle` → giữ export (7 file dùng) nhưng giá trị theo `.input` của design (cao 40/48, bo, viền); `Field` → dùng `Field` của plan 00 (nhãn luôn hiện); `panelStyle` → thẻ trắng bo 24 không viền; `Feedback` → `.alert` có icon; `SaveButton` → `Button variant="primary"`.
- `TableFrame/TableHeadCell/TableCell` → class `.table` (đường kẻ ngang mảnh, header chữ thường 13px) — màn cũ dùng chúng đổi theo ngay.
- **Không đổi** `MetaItem` (test khoá inline `dt/dd`).
**Anh sẽ thấy:** `/dich-vu`, `/cu-tru`, `/an-toan`, `/nhat-ky-thao-tac`, `/su-co`, `/nguoi-thue` có ô nhập/khung mới, chưa đổi bố cục.
**Test:** `npm test` xanh hết (không test nào phải sửa — nếu có thì dừng và ghi lý do). Ảnh trước/sau 6 màn trên ở 1440.

## Bảng lô (A–F song song)

| Lô | Mẫu | Màn (đường dẫn → component, dòng, test hiện có) | API chính | Cỡ |
|---|---|---|---|---|
| **A** form + công khai | form, công khai | **01** `/dang-nhap` → `App.tsx` ~700–810 + `TaiKhoanTruyCap.tsx` (33; App.test); **02** `/kham-pha` → `KhamPhaPhong.tsx` (1.621; 9 test); `/bao-hong` (khách) → `QuanLySuaChua tenant` (39) | `/api/auth/login`; `fetchPublicPhong`, `fetchPublicToaNha`, `guiDatLichHen`; `fetchHopDongCuaNguoiThue`, `managementRequest` | L |
| **B** bảng quản trị & danh mục | table → detail | **09** `/tai-khoan` → `QuanLyTaiKhoan.tsx` (360; 11 test); `/toa-nha` → `DanhMucToaNha.tsx` (464; 6); `/nhat-ky-thao-tac`, `/cu-tru`, `/an-toan` → `TuanThuVanHanh.tsx` (52); `/nguoi-thue` → `HoSoNguoiThue.tsx` (368; **0**); `/phong` → `DanhMucPhong.tsx` (1.007; 9) + `QuanLyTaiSanPhong.tsx` (975; 6) | `fetchNguoiDungQuanLy`, `fetchVaiTro`, `taoNguoiDungQuanLy`, `capNhatNguoiDungQuanLy`, `khoaNguoiDungQuanLy`, `fetchToaNha`; `managementRequest`; `fetchPhong`, `taoPhong`, `taoPhongHangLoat`, `fetchTaiSanPhong`… | L |
| **C** bảng tiền | table + form | `/hoa-don` → `HoaDonQuanLy.tsx` (434; **0**, App.test FR-INV-02) + `InvoiceActions.tsx` (58); `/thu-tien` → `ThuTien.tsx` (126; **0**) + `FinancePaymentPanel.tsx` (113); `/cong-no` → `CongNoBaoCao.tsx` (190; 4); `/dich-vu` → `DichVuVaKy.tsx` (102; **0**) | `fetchHoaDonQuanLy`, `bulkInvoice`; `financeRequest`, `collectDeposit`; `fetchCongNoBaoCao`; `managementRequest('…/dich-vu')`, `fetchKyThanhToan` | M |
| **D** báo cáo | dashboard + table | `/bao-cao` → `BaoCaoTongQuan.tsx` (294; 6); `/bao-cao/tieu-thu` → `TieuThuBaoCao.tsx` (377; 4); `/bao-cao/chi-phi-bao-tri` → `ChiPhiBaoTriBaoCao.tsx` (405; 6) | `fetchBaoCaoTongQuan`, `fetchTieuThuBaoCao`, `fetchChiPhiBaoTriBaoCao`; Excel `/api/bao-cao/*/xuat-excel` (`ExcelExportButton.tsx`) | M |
| **E** sự cố, lịch hẹn, thông báo | table → detail, list | `/su-co` → `QuanLySuaChua` + `LichSuSuaChua.tsx` (272; 4) + `QuanLyBaoGiaVaThanhToan.tsx` (573; **0**); `/lich-hen` → `QuanLyLichHen.tsx` (473; 2); `/thong-bao` → `ThongBao.tsx` (467; 9) | `fetchLichSuSuaChua`, `fetchChiTietSuaChua`, `fetchBaoGiaYeuCau`, `duyetBaoGia`, `tuChoiBaoGia`, `ghiNhanThanhToanTho`; `fetchPublicLichHen`, `capNhatTrangThaiLichHen`; `fetchThongBao`, `guiThongBaoChung…` | M |
| **F** điện thoại còn lại | mobile-task, detail | `/tho/tong-quan` → `ThoTongQuan.tsx` (522; 3); `/tho/chi-phi` → `ThoChiPhi.tsx` (1.144; 2); `/lich-su` → `LichSuHoaDon.tsx` (182; **0**); `/tieu-thu` → `BieuDoTieuThu.tsx` (290; **0**); `/hop-dong` (khách) → `HopDongNguoiThue.tsx` (349; 2) | `fetchThoTongQuan`, `fetchThoChungTu`; `fetchLichSuHoaDonCuaNguoiThue`; `fetchTieuThuCuaNguoiThue`; `fetchHopDongCuaNguoiThue`, `fetchHoSoHopDong` | M |

Mỗi lô chia task **mỗi màn một task** theo khuôn dưới; ghi rõ ở đây các điểm riêng.

### Lô A — form + công khai
- **A1 Đăng nhập (01)** · S. Bố cục 2 cột 1440 (form trái, ảnh toà nhà phải có chú thích "An Nhiên Residence · Hà Nội", ảnh lấy từ `frontend/src/assets/rooms/`), 1 cột ở 390. Nhãn luôn hiện, "Quên mật khẩu?" cạnh nhãn mật khẩu → luồng "Kích hoạt tài khoản / Quên mật khẩu" hiện có; lỗi đỏ ngay dưới ô = `reason.message`. Nút "← Khám phá phòng trống" ≥ 44px ở mobile (đang 25px).
  *Không được:* đổi `autoComplete`/`type="submit"` (tool chụp ảnh và test dựa vào). *Test:* App.test các ca đăng nhập giữ xanh; thêm 1 test: lỗi server hiện dưới ô mật khẩu với `aria-describedby`.
- **A2 Tìm phòng (02)** · L. Thanh điều hướng mảnh, hero ảnh thật + bộ lọc (Khu vực = chọn **toà** vì không có trường thành phố, Giá tối đa, Loại phòng `loaiPhong`), dòng đếm "N phòng trống", chip lọc nhanh ≥ 36px (đang 28px), lưới thẻ phòng (giá to + "/tháng", "toà · Phòng", "loại · diện tích · `diaChiToaNha`", tiện ích, nút "Đặt lịch xem" giữ luồng `guiDatLichHen`).
  *Test:* 9 test `KhamPhaPhong.test.tsx` giữ xanh; đổi chữ nào thì sửa test kèm lý do.
- **A3 Báo hỏng (khách, 390)** · S. Form 1 cột (mẫu form + thẻ việc 07): chọn hạng mục, mô tả, ảnh (input camera), nút chính 48px.

### Lô B — bảng quản trị & danh mục
- **B1 Tài khoản (09)** · M. `DataTable`: chip vai trò có số (Tất cả / Người thuê / Quản lý / Chủ sở hữu / Thợ / Quản trị — đếm từ `vaiTro`), lọc trạng thái (Hoạt động / Đã khoá), cột Người dùng (avatar + tên + SĐT nhóm 4-3-3, "· bạn" cho chính mình) · Vai trò · Toà được giao (`toaNhaIds` → tên qua `fetchToaNha`; người thuê hiện "Người thuê" — xem B12) · Trạng thái · Thao tác ("Sửa" + menu "Đổi toà được giao", "Khoá tài khoản…" với `ConfirmDialog`). Một nút chính "Tạo tài khoản". Dòng tóm tắt "N tài khoản đang hoạt động · tài khoản đã phát sinh dữ liệu chỉ khoá, không xoá".
  *Không được:* nút xoá tài khoản. *Test:* 11 test `QuanLyTaiKhoan.test.tsx` giữ xanh + 1 test chip "Thợ" đếm đúng.
- **B2 Toà nhà** · M — table → detail (mẫu 05). **B3 Nhật ký thao tác / Cư trú / An toàn** · S — `DataTable` + lọc ngày/người (mẫu 09). **B4 Người thuê** · M — viết test render trước (đang 0), rồi table → detail. **B5 Phòng + tài sản phòng** · L — bảng (desktop) / lưới ô phòng (mobile) → detail; giữ luồng tạo phòng hàng loạt + biên bản bàn giao.

### Lô C — bảng tiền
- **C1 Hoá đơn (quản lý)** · M — viết test render trước; `DataTable` chip trạng thái, giữ `data-invoice-row` + href `/hoa-don?toaNhaId=&kyId=&hoaDonId=` (App.test FR-INV-02), bulkbar dùng `bulkInvoice` có sẵn. **C2 Thu tiền** · M — table + form ghi nhận (`FinancePaymentPanel`), test render trước. **C3 Công nợ** · S — sort mặc định theo số ngày trễ, chữ đỏ cho quá hạn. **C4 Dịch vụ và kỳ** · S — table + form đơn giá, test render trước.

### Lô D — báo cáo
- **D1 Báo cáo tổng quan / D2 Tiêu thụ / D3 Chi phí bảo trì** · M mỗi cái. Biểu đồ bằng `design/charts` (vùng, thanh ngang xếp hạng), bảng số bên dưới bằng `DataTable`; nút "Xuất Excel" (`ExcelExportButton`) là nút phụ, không phải nút chính. Đối soát công tơ tổng hiện đầy đủ ở D2 (dashboard 03 chỉ còn một dòng "Cần chú ý").

### Lô E — sự cố, lịch hẹn, thông báo
- **E1 Sự cố** · L — viết test render cho `QuanLyBaoGiaVaThanhToan` trước; danh sách → detail (duyệt/từ chối báo giá, ghi nhận thanh toán thợ). **E2 Lịch hẹn** · S — danh sách theo ngày (khối lịch hẹn của 04). **E3 Thông báo** · M — danh sách + soạn thông báo chung (giữ xem trước + ảnh).

### Lô F — điện thoại còn lại (390)
- **F1 Tổng quan thợ** · S — 3 số + việc gấp (đầu màn 07). **F2 Báo giá & thanh toán (thợ)** · M — tiêu đề đủ "Báo giá & thanh toán", ô số tiền to (mẫu 06). **F3 Lịch sử hoá đơn** · S — test render trước; danh sách kỳ (khối "Kỳ trước" của 08). **F4 Tiêu thụ (khách)** · S — test render trước; biểu đồ cột `design/charts`. **F5 Hợp đồng (khách)** · S — detail mobile.

## Khuôn mỗi task (áp cho mọi màn ở trên)
1. **Trước:** nếu màn chưa có test → viết test render tối thiểu (mock fetch như test cùng loại) khoá: `data-testid` màn, số dòng dữ liệu, 1–2 con số chính. Chạy xanh trên code cũ.
2. **Đổi:** chỉ JSX + style sang component plan 00 (`DataTable`, `Card`, `Field`, `StatusTag`, `Button`, `EmptyState`), giữ state, handler, gọi API, `data-*`.
3. **Kiểm:** `npx vitest run src/<File>.test.tsx` xanh; `npm test` xanh (≥ số test trước lô); `npm run build` qua.
4. **Ảnh:** `app-shot.mjs` ở 1440 / 1024 / 390 với vai trò đúng (bảng SĐT ở plan 00) → so với màn khung đại diện trong `screen-inventory.md`; `qa.json` đạt tiêu chí chung (không cuộn ngang, vùng chạm 44/36, tương phản 4,5:1).
5. **Anh sẽ thấy / không được xảy ra** (chung): đúng một nút chính mỗi màn; trạng thái luôn có icon + chữ; không chữ mono, không IN HOA giãn cách; trạng thái rỗng/đang tải/lỗi dùng `EmptyState`; **không** mất cột/số liệu nào màn cũ đang hiện.

## Lô 03-Z — Bật reset toàn cục + dọn `styles.css`  · cỡ S · cuối cùng
**File:** `main.tsx` (import `./design/base.css` trước `components.css`), `styles.css` (gỡ selector không còn dùng), `stylesCleanup.test.ts` (thêm nhóm đã gỡ), `designTokens.test.ts`.
- Guard mới: không file `.tsx` nào (trừ test) còn chuỗi `IBM Plex Mono`/`--ma-font-mono`/`textTransform: 'uppercase'` kèm `letterSpacing`.
**Kiểm:** `npm test` xanh; chụp lại **toàn bộ 44 mục** ở 1440 + 390 (job sinh từ `roleNavigation.ts`), `qa.json` mọi màn `horizontalOverflow: 0`.
**Không được xảy ra:** màn nào lệch so với ảnh trước bước này ngoài margin/bullet đã dự kiến.

## Phụ thuộc backend
| # | Màn | Thiếu gì | Đề xuất |
|---|---|---|---|
| B10 | 02 | Lọc "Khu vực" theo thành phố: `PublicToaNha` chỉ có `diaChi` (chuỗi) | Thêm `thanhPho` vào `PublicToaNha` (và bộ lọc `?thanhPho=` ở `/api/public/phong`) |
| B11 | 09 | "Gửi lại mã kích hoạt" cho tài khoản bất kỳ: chỉ có `/api/hop-dong/{id}/nguoi-o-cung/{id}/kich-hoat-tai-khoan` | `POST /api/nguoi-dung/{id}/gui-lai-ma-kich-hoat` (QTHT) |
| B12 | 09 | Cột "Toà được giao" của người thuê ("Phòng 101 · An Nhiên"): `ThongTinQuanLyNguoiDung` chỉ có `nguoiThueId` | Thêm `phongHienTai {soPhong, tenToaNha}` (nullable) |
| B13 | 01 | "Còn N lần thử trước khi tạm khoá 15 phút": không rõ backend có trả | Nếu có cơ chế khoá, đưa số lần còn lại vào thông báo lỗi 401 |
