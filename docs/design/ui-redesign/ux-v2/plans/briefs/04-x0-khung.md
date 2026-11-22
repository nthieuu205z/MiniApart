# Lô x0 — Khung: định tuyến, toà dùng chung, sidebar, thanh trên, tab trang, Không có quyền

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x0-khung` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x0` · 5310 |
| Tách từ | `feat/ux-v2` (= `feat/ui-tokens@028edcd`) |
| Ước | ~90 phút, 6 task, 1 coder. Mọi lô sau phụ thuộc lô này |
| Đọc thêm | `_common-04.md` · `ux-v2/02` §1–3 · ảnh `02`, `03`, `15`, `16`, `26` · `prototype/app.js` hàm `sidebar`, `topbar`, `ph`, `crumb`, `khongCoQuyen`, `trangThai` · `prototype/ux.css` · `plans/ma-mau/README.md` |

## Mục tiêu
App chạy bằng **một bảng định tuyến**, khung mới (sidebar nhóm theo việc, ô chọn toà đầu sidebar, thanh trên chỉ có Tìm nhanh + chuông, breadcrumb chỉ khi ≥ 2 tầng, tab trang cho các nhóm gộp), trang Không có quyền gọn trong khung. Màn bên trong **giữ nguyên** (chỉ đặt vào khung); file trang mới là vỏ mỏng ghép màn cũ để lô sau thay ruột.

## File sở hữu
`App.tsx`, `App.test.tsx`, `App.tho.test.tsx`, `App.dangNhap.test.tsx`, `roleNavigation.ts`, `main.tsx`, `ManagementShared.tsx`, `design/shell/{NavPanel,TopBar,Breadcrumb}.tsx`, `designComponents.test.tsx`, `designTokens.test.ts` (chỉ nếu thêm file CSS làm test đếm file đỏ), `GhiChiSo.tsx` (chỉ thêm 1 prop, task 5).
Tạo mới: `dinhTuyen.ts`(+test), `toaDangChon.tsx`(+test), `nhomNoTheoNguoi.ts`(+test) (chép nguyên từ `ma-mau/`; cái cuối để x1/x2/x3 cùng import, không ai phải chép), `design/ux-v2.css`, `design/shell/TabTrang.tsx`, `design/shell/ChonToa.tsx`, `soDemDieuHuong.ts`(+test), `TrangKhongCoQuyen.tsx`, và 10 vỏ trang: `HomNay.tsx`, `ChuKyThang.tsx`, `HoSoNguoiThue360.tsx`, `HoSoPhong360.tsx`, `HoSoHopDong360.tsx`, `HoSoToa360.tsx`, `TaoHopDong.tsx`, `TrangSuCo.tsx`, `TimNhanh.tsx`, `ChuongThongBao.tsx`.

## Giao diện x0 phải giao cho lô sau (không đổi chữ ký sau khi gộp)
```ts
// dinhTuyen.ts (mã mẫu)
type VaiTro = 'QTHT' | 'CHU' | 'QUAN_LY' | 'THO' | 'NGUOI_THUE'
type TrangProps = { token: string; vaiTro: VaiTro; mobile: boolean; thamSo: Record<string, string>; dieuHuong: (href: string) => void }
timTuyen(vaiTro, duongDan, search): { loai: 'trang'; khoa; thamSo } | { loai: 'chuyen'; toi } | { loai: 'khong-co-quyen'; vaiTroSoHuu }
NHOM_TAB, nhomTabCua(vaiTro, duongDan), tabDangChon(nhom, duongDan, search), TRANG_DAU

// toaDangChon.tsx (mã mẫu)
<ToaDangChonProvider token vaiTro search={location.search}>…</ToaDangChonProvider>
useToaDangChon(): { toaNhaId: number | null /* null = Tất cả toà, chỉ Chủ */; danhSach; coDinh /* QL 1 toà */; dangTai; loi; chon(id | null) }
useMotToa(): { toaNhaId; canChonTaiCho /* Chủ đang Tất cả toà → màn tự hiện ô chọn */; danhSach; chon }
tenToaDangChon({ toaNhaId, danhSach }): string   // "Tất cả 3 toà" | tên toà
KHOA_LUU_TOA = 'ma.toaNhaId'

// nhomNoTheoNguoi.ts (mã mẫu): tuCongNo, tuHoaDonQuanLy, nhomNo, demBoLoc, locNo, hangTong, soNgayTre
// GhiChiSo: prop anNutChot?: boolean
// Khung: <TimNhanh {...trangProps} mo datMo />, TopBar chuong={<ChuongThongBao {...trangProps} />}
```
Vỏ trang mới đều là `export default function Ten(props: TrangProps)`.

## Task

### 1. Khoá hành vi cũ bằng test trước khi đụng App (~15')
- Trong `App.test.tsx` thêm `describe('định tuyến cũ — không đổi quyền')`: với mỗi vai trò, mỗi đường dẫn trong `MENU_CU` (copy từ `ma-mau/.../dinhTuyen.test.ts`), render App với `history.pushState` tới đường dẫn đó + `fetch` mock trả mảng rỗng, assert **không** có chữ "Không có quyền". Thêm 6 ca ngoài menu: QL `/bao-cao`, `/cong-no`, `/tai-khoan` → có "Không có quyền"; Khách `/thu-tien` → có; QTHT `/hoa-don` → không; Thợ `/thu-tien` → về màn Việc.
- Chạy trên App **cũ**: phải xanh. Commit riêng. Đây là lưới an toàn cho task 2.

### 2. Thay chuỗi `hienThi*` bằng `timTuyen` (~25')
- Chép `ma-mau/frontend/src/dinhTuyen.ts` + test nguyên văn.
- Trong `App.tsx`: một hàm `function ManTheoKhoa({ khoa, ...TrangProps })` là một `switch (khoa)` trả đúng component cũ với **đúng props cũ** (lấy từ các nhánh ternary hiện tại; giữ nguyên `mobile`, `toaNhaId`, `kyId`, `hoaDonId`… đang đọc từ query). Khoá mới trả vỏ trang: `hom-nay`→`HomNay`, `chu-ky`→`ChuKyThang`, `ho-so-*`→`HoSo*360`, `tao-hop-dong`→`TaoHopDong`, `su-co`→`TrangSuCo`.
- `KetQuaTuyen.loai === 'chuyen'` → `history.replaceState` rồi đọc lại (giữ query). `'khong-co-quyen'` → `<TrangKhongCoQuyen vaiTroSoHuu=… />`.
- Xoá `xacDinhTrangTheoVaiTro`, các cờ `hienThi*`, ternary lồng. Giữ: logic đăng nhập/đăng xuất, `/dang-nhap`, `/kham-pha` công khai, lắng nghe `popstate`, cách các màn cũ tự `replaceState`.
- Một hàm `dieuHuong(href)` (pushState + set state) truyền xuống mọi trang; chặn click `<a href>` nội bộ (cùng origin, không `target`, không phím bổ trợ) ở khung để `<a>` thật chạy SPA.
- Vỏ trang ban đầu: `HomNay` = `QuanLyDashboard` (QL) / `ChuDashboard` (Chủ); `ChuKyThang` = `GhiChiSo` (giữ nút chốt cũ cho tới x5); `TrangSuCo` = `SuCoQuanLy`; `HoSoNguoiThue360` = `HoSoNguoiThue` mở sẵn người `thamSo.id`; `HoSoPhong360`/`HoSoHopDong360`/`HoSoToa360` = `EmptyState` "Hồ sơ đang làm" + nút về danh sách (chưa có link nào trỏ tới cho tới x3/x4); `TaoHopDong` = `HopDongQuanLy` (form cũ); `TimNhanh`/`ChuongThongBao` = vỏ trả `null` nhưng **chữ ký cố định** để x7 thay ruột không cần sửa App: khung luôn mount `<TimNhanh {...trangProps} mo={dangMoTim} datMo={setDangMoTim} />` (x7 tự gắn Ctrl/⌘+K trong component này) và TopBar nhận `chuong={<ChuongThongBao {...trangProps} />}`; nút ô tìm của TopBar gọi `setDangMoTim(true)`.
- Test task 1 phải còn xanh **không sửa**. `dinhTuyen.test.ts` xanh.

### 3. Toà dùng chung (~10')
- Chép `toaDangChon.tsx` + test. Bọc phần sau đăng nhập trong `<ToaDangChonProvider token vaiTro search={location.search}>`.
- `ManagementShared.tsx` › `useBuildings()`: lấy `danhSach`/`toaNhaId` từ `useToaDangChon()`; setter ghi vào context. `BuildingSelect`: khi context `coDinh` hoặc khung đang hiện ô chọn toà → render `null`; khi Chủ đang "Tất cả toà" mà màn cần một toà → render ô chọn tại chỗ (dùng `useMotToa`). 5 màn dùng `useBuildings` (`DichVuVaKy`, `HopDongThaoTac`, `QuanLySuaChua`, `SuCoQuanLy`, `TuanThuVanHanh`) theo luôn, không sửa màn.
- Ghi nhận: key lưu là `ma.toaNhaId` (ux-v2/02 ghi `ma.toa`; **Em chọn** tên nói rõ giá trị là id).
- Test mới trong `toaDangChon.test.tsx`: một component thử gọi `useBuildings()` nằm trong Provider; đổi toà qua context → component nhận `toaNhaId` mới; QL (1 toà) → `BuildingSelect` không render.

### 4. Sidebar, thanh trên, breadcrumb, tab trang, CSS (~20')
- `design/ux-v2.css`: chép từ `prototype/ux.css` **chỉ** các khối khung và mẫu dùng chung chưa có trong `components.css`: `.sidebar/.sb-*`, `.ux-top`, `.ux-search`, `.has-n`, `.ph`, `.crumb`, `.strip`, `.sec/.sec-h`, `.irow`, `.tile`, `.cols/.side`, `.gtable .grp/.kid/.tot`, `.drawer`, `.steps`, `.vsteps/.vstep`, `.split`, `.rooms/.room`, `.wiz/.wiz-f`, `.form-grid`, `.sumrow`, `.kv`, `.state`, `.blk-h`, `.bignum`, `.money`, `.xbtn`, `.prof`, `.cmdk`, `.pop`, `.tl`, `.dots`, và khối mobile `.m-*`, `.payhero`, `.mstep`, `.qr`, `.sticky-act`, `.meter-wrap` nếu chưa có (đếm 22/11: các lớp này có trong `ux.css`, chưa có trong `components.css`; `.bulkbar`, `.m-only`, `.hbars`, `.search-kbd` **đã có** trong `components.css` → không chép). Bottom-nav dùng `NavPanel variant="bar"` sẵn có (đã tự giới hạn số mục), không chép CSS mới. Bỏ mọi khai báo `font-family`, `@font-face`, biến `--font-*` và màu hex trùng token (thay bằng `var(--ma-…)` đang có). Import trong `main.tsx` sau `components.css`. `stylesCleanup.test.ts`/`designTokens.test.ts` phải xanh (sửa danh sách file được phép nếu test đếm file CSS — chỉ thêm `ux-v2.css`).
- `roleNavigation.ts` → cấu hình nav v2 đúng bảng `ux-v2/02` §2: nhóm, nhãn, icon (`Glyph` có sẵn; thiếu icon thì dùng icon gần nhất, ghi vào báo cáo), `activeFor` (mục Thu tiền sáng ở `/thu-tien`, `/hoa-don`; Người thuê ở `/nguoi-thue*`, `/cu-tru`; Báo cáo ở 5 đường dẫn báo cáo; Chu kỳ tháng ở `/chu-ky`; Toà & phòng ở `/toa-nha*`, `/phong/*`; Hợp đồng ở `/hop-dong*`), chân sidebar "Dịch vụ & đơn giá" (`/dich-vu`). Thợ/khách: bottom-nav 3 mục (Việc `/viec-cua-toi` · Tiền công `/tho/chi-phi` · Thông báo `/thong-bao`; Cần trả `/hoa-don-cua-toi` · Báo hỏng `/bao-hong` · Phòng của tôi `/hop-dong`). QTHT giữ 3 mục.
- `NavPanel`: thêm nhãn nhóm, ô toà ở đầu (`ChonToa`: Chủ = nút mở danh sách "Tất cả 3 toà" + 3 toà, `aria-haspopup="listbox"`, Esc đóng, phím mũi tên; QL = ô tĩnh "An Nhiên Residence · được phân công"), số đếm (`count` đã có). ≤ 767px: ẩn, nút ☰ ở thanh trên mở dạng ngăn (`role="dialog"`, khoá cuộn, Esc + click nền đóng, trả focus về ☰) — ảnh `26`.
- `soDemDieuHuong.ts`: hook đếm số trên nav từ API đang có (Sự cố cần phân công từ `/api/yeu-cau-sua-chua` trạng thái `MOI_TIEP_NHAN`; Lịch hẹn chờ từ `/api/lich-hen` `CHO_XAC_NHAN`; Chu kỳ tháng của QL = `soCongToChuaGhi` từ `/api/dashboard/quan-ly`). Lỗi → không hiện số (không chặn khung). Test với mock fetch.
- `TopBar`: bỏ "Không gian quản lý · ngày" và breadcrumb lặp tiêu đề. Còn: ☰ (≤ 767px, chỉ QTHT/Chủ/QL), ô Tìm nhanh (chỉ Chủ/QL; nút có `aria-label="Tìm nhanh: người thuê, phòng, hợp đồng, hoá đơn (Ctrl K)"`, mở `TimNhanh` — vỏ trả `null` tới x7), chuông (`ChuongThongBao` vỏ; tạm giữ link `/thong-bao`). Đăng xuất: desktop + ngăn ☰ ở khối người dùng chân sidebar (đã có `nav-logout`); Thợ/Khách (bottom-nav, không có ngăn) giữ icon Đăng xuất `topbar-logout` như hiện nay (ảnh `21` có icon người ở góc phải).
- `TabTrang.tsx`: đọc `nhomTabCua` + `tabDangChon`, render `.tabs` bằng `<a href>` (`aria-current="page"` cho tab đang chọn; **không** dùng `role="tab"` vì là điều hướng trang). Khung chèn `TabTrang` ngay trên nội dung khi đường dẫn thuộc nhóm.
- Breadcrumb: khung **thôi** render breadcrumb. Trang hồ sơ / tạo hợp đồng tự render `<Breadcrumb>` (2 tầng: danh sách › tên) trong đầu trang của nó, vì chỉ trang đó biết tên đối tượng.

### 5. Prop `anNutChot` cho GhiChiSo (~5')
- Thêm prop tuỳ chọn `anNutChot?: boolean` (mặc định `false`): khi `true` ẩn nút/khối chốt kỳ trong `GhiChiSo`. Không đổi gì khác. 1 test.

### 6. Trang Không có quyền + sửa test khung + ảnh (~15')
- `TrangKhongCoQuyen`: trong khung, `h1` "Trang này dành cho {tên vai trò sở hữu}", 1 câu giải thích, 2 nút: chính "Về {trang đầu}" (`TRANG_DAU`), phụ "Mở {mục gần nhất}" nếu có (ví dụ Chủ mở `/phong` → "Mở Toà & phòng"). Không còn nút Đăng xuất to, không lặp câu. Ảnh `15`.
- Sửa `App.test.tsx`/`App.tho.test.tsx`: chỉ assertion về menu cũ, topbar, breadcrumb, "Lối tắt", "Xin chào", `current-route-title`. Ghi bảng test đã sửa trong báo cáo. **Nếu > 25 test phải sửa → dừng báo controller.**
- Ảnh app thật 1440 + 390: Chủ `/hom-nay`, `/thu-tien`, `/hoa-don`, `/tong-quan`, `/phong` (Không có quyền); QL `/hom-nay`, `/su-co`; Thợ `/viec-cua-toi` 390; Khách `/hoa-don-cua-toi` 390; Chủ 390 với ngăn menu mở. Quét 42 đường dẫn menu cũ × vai trò bằng jobs sinh từ `MENU_CU` (1440, không full) — 0 trang "Không có quyền".

## Không làm
Không vẽ lại màn bên trong. Không làm Tìm nhanh/chuông thật (x7). Không đổi API. Không đổi font/token. Không sửa màn nào khác ngoài danh sách file.

## Nghiệm thu riêng (ngoài checklist chung)
- [ ] Test task 1 viết trước, xanh trên App cũ và App mới không sửa (2 commit chứng minh).
- [ ] `grep -c "hienThi" frontend/src/App.tsx` = 0; App.tsx ngắn hơn trước (ghi số dòng).
- [ ] Đổi toà ở sidebar rồi sang trang khác: toà giữ nguyên; tải lại trang: vẫn giữ.
- [ ] Bàn phím: Tab tới ô toà, Enter mở, mũi tên chọn, Esc đóng; ☰ trên 390 mở/đóng ngăn, focus trả về.
- [ ] 42/42 đường dẫn cũ mở được (ảnh hoặc log jobs).
