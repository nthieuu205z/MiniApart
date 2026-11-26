# Brief y0 — Lô nền V3 (token · font Plex · nút mực · 3 mật độ · khung · component chung)

Nhánh `ui/y0-nen` · worktree `~/Documents/PRJ/MiniApart-y0` · cổng vite `5300` · làm **trước mọi lô**, một coder, hai phần liền nhau: **A** (≤ 55′) rồi **B** (≤ 55′). Các lô y1…y8 chạy sau khi y0 đã gộp vào `feat/v3`, nên interface ở §4 là **hợp đồng**: viết đúng tên, đúng props.

## 1. Mục tiêu
Sau lô này, mọi màn cũ tự đổi sang diện mạo V3 mà chưa cần sửa từng màn: font IBM Plex Sans, nền trắng/xám lạnh, chữ mực, nút chính nền mực, bỏ hết teal/kem. App tự đặt mật độ theo vai trò và khung màn. Nav đổi nhãn theo V3. Các lô sau có sẵn component chung để dựng màn.

## 2. File được sửa
`frontend/src/`: `App.tsx`, `main.tsx`, `dinhTuyen.ts`, `roleNavigation.ts`, `soDemDieuHuong.ts`, `toaDangChon.tsx`, `ManagementShared.tsx`, `bangQuanTriChung.tsx`, `nhomNoTheoNguoi.ts`, `styles.css`, `tokens/**`, `design/**`, `assets/fonts/**`. **Mới:** `tienTheoNguoi.ts`, `matDo.ts`, `ManDangNhap.tsx` + test của chúng.
Test: `designTokens.test.ts`, `stylesCleanup.test.ts`, `designComponents.test.tsx`, `glyphAssets.test.ts`, `dinhTuyen.test.ts`, `App*.test.tsx`. Vì đợt 0 chỉ có một lô, y0 được sửa **bất kỳ test nào** vỡ do đổi token hay component chung, miễn là ghi lý do từng test.
Công cụ: `docs/design/ui-redesign/tools/{qa-probe.js,run-repo-guard.sh,contrast.py,dom2svg.js,cdp-run.mjs}`.
Không sửa màn nghiệp vụ (`HomNay.tsx`, `ThuTien.tsx`…) ngoài các chỗ test buộc phải sửa, và ngoài phép thay giá trị cơ học hex → `var(--ma-…)` khi guard đòi.

## 3. Phần A — token, font, guard, nút (≤ 55′)

**A1. Chép mã mẫu đã chạy thử** (từ `docs/design/ui-redesign/v3/plans/ma-mau/frontend/src/`, chép đè vào `frontend/src/`):
- `tokens/overlay-ui-redesign.css`: token V3 với đủ 174 biến `--ma-*` + 8 biến đang được dùng mà trước đây chưa định nghĩa (`--ma-amber-border`, `--ma-bg-surface`, `--ma-done-border`, `--ma-green-border`, `--ma-red-border`, `--ma-status-neutral-light`, `--ma-urgent-border`, `--ma-waiting-border-subtle`); `@font-face` Plex; khối `[data-density="chu-m"]` và `[data-density="thoang"]`.
- `tokens/typography.css`, `tokens/fonts.css`: font chuyển sang Plex, `@font-face` dồn vào overlay.
- `designTokens.test.ts`: guard theo V3, xem A3.
- `tienTheoNguoi.ts` + `tienTheoNguoi.test.ts`, `matDo.ts` + `matDo.test.ts`.

Kiểm `tokens/index.css` có `@import './overlay-ui-redesign.css'` nằm **cuối** file. Nếu chưa có thì thêm vào.

**A2. Font:** xoá `src/assets/fonts/inter-*.woff2` và `LICENSE-Inter-OFL.txt`. Chép 9 file `ibm-plex-sans-{latin,latin-ext,vietnamese}-{400,500,600}-normal.woff2`, `LICENSE-IBM-Plex-Sans-OFL.txt`, `SHA256SUMS` từ `docs/design/ui-redesign/v3/prototype/fonts/` vào đó. Kiểm bằng `(cd src/assets/fonts && shasum -a 256 -c SHA256SUMS)`: cả 9 file phải `OK`.

**A3. `colors.css` và guard.** Đổi 4 giá trị v2:

| Biến | Cũ | Mới |
|---|---|---|
| `--ma-paper-1` | `#F9F7F6` | `#F7F8FA` |
| `--ma-ink-screen-title` | `#0F766E` | `#14181D` |
| `--ma-brand-accent` | `#0D9488` | `#14181D` |
| `--ma-brand-accent-hover` | `#0F766E` | `#2A313A` |

Overlay đã đè các biến khác. Hex teal trong `design/components.css`: `#8FD3C8` → `#A9C7FF` (link trên toast nền mực), `#115E59` → `#2A313A`, `#E6F2F0` → `#ECEEF1`. Hex ấm v2 còn lại (`#fdf1dc`, `#efece7`, `#57534e`…) thay bằng `var(--ma-…)` có sẵn, rồi xoá khỏi tập `allowed` của guard.

Ghi vào báo cáo từng thay đổi của guard kèm lý do:
- `--ma-paper-1` đổi giá trị khoá;
- `--ma-font-ui` khoá `IBM Plex Sans`;
- tập hex cho phép bỏ 3 hex teal, thêm 3 hex V3;
- thêm test mới "không file CSS nào còn Inter/teal/kem v2", quét mọi `src/**/*.css`;
- 4 guard cấm mono / IN HOA / `letterSpacing` dương **giữ nguyên**.

Không xoá guard nào. `stylesCleanup.test.ts` không khoá màu nên giữ nguyên, trừ khi `styles.css` đổi.

**A4. Nút** (`design/core/Button.tsx` + `.btn*` trong `design/components.css`, theo `.nut`/`.nut.chinh`/`.nut.nguy`/`.nut.chu` của `v3/prototype/v3.css`):
- Bỏ inline `minHeight: 44` → dùng `minHeight: 'var(--ma-control-h)'` cho `md` và `var(--ma-control-h-sm)` cho `sm`. Khi đó desktop cao 36, `chu-m` 44, `thoang` 52.
- `primary`: nền `--ma-brand-primary`, chữ trắng, hover `--ma-brand-primary-hover`.
- `secondary`: nền trắng, viền `--ma-line-200`, chữ mực.
- `text`: không viền, chữ `--ma-text-link`.
- Thêm `variant="danger"` cho việc phá huỷ: nền trắng, viền và chữ `--ma-urgent`. **Không bao giờ** nền đỏ.
- Bo 6px, không bóng, weight 500, chữ thường.

Test khoá 44/48px (`designComponents`, `ViecCuaToi`, `ThoCongViec`, `HomNay`, `GhiChiSo`, `TrangSuCo`, `HoSo360`, `HopDongQuanLy`, `HoSoToa360`, `CanTra`, `DanhMucToaNha`, `ChuKyThang`, `ChiPhiBaoTriBaoCao`, `HoSoHopDong360`, `TaoHopDong`, `App.test` `var(--ma-hit-mobile)`):
- Nếu test kiểm *chuỗi* `var(--ma-hit-*)` thì giữ chuỗi đó.
- Nếu test kiểm số px thì đổi sang kiểm `var(--ma-control-h)`, hoặc đặt `data-density` trong test.

Mỗi test sửa ghi một dòng lý do. Quá ~30 test thì dừng, báo controller.

**A5. Các component lõi còn lại** theo `v3.css`:
- `StatusTag`: chấm tròn + chữ, không viền, không nền đậm.
- `Card`: bo 8, viền `--ma-line-200`, không bóng, tiêu đề khối `--ma-text-block-title`.
- `DataTable`: hàng cao `--ma-row-h`, kẻ `--ma-line-100`, hover `--ma-paper-1`, số canh phải `font-variant-numeric: tabular-nums`. Thêm prop `tongHang` (§4).
- `Field`/`Input`/`Select`: cao `--ma-control-h`, viền `--ma-line-600`, lỗi đặt dưới ô.
- `FilterChip`: viền, chip đang chọn có viền mực và nền `--ma-paper-3`.
- `EmptyState`, `Toast` (nền mực, link `#A9C7FF`, 6 giây, có Hoàn tác), `ConfirmDialog`, `SyncBanner`.

Xoá mọi `textTransform: uppercase` / `letterSpacing` dương còn trong `design/**`.

**Commit A:** `ui(y0): token V3, font IBM Plex Sans, nút mực, guard theo V3`. Chạy đủ 3 lệnh kiểm trước khi commit. Ghi số test.

## 4. Phần B — khung, mật độ, component chung (≤ 55′)

**B1. Mật độ.** Trong `App.tsx`, thêm `data-density={matDoTheoVaiTro(vaiTro, laManHinhHep)}` vào `<main className="ma-app-shell">`. Màn khách (đăng nhập, khám phá phòng) dùng `chu-m` khi hẹp, còn lại `lam-viec`. Cách tính đã có trong `matDo.ts` (Người thuê/Thợ luôn `thoang`; < 768 thì `chu-m`; còn lại `lam-viec`). Thêm test App: đăng nhập vai THO → `[data-density="thoang"]` có trong DOM.

**B2. Nav** (`roleNavigation.ts`, theo `NAV` của `prototype/app.js`). Chỉ đổi nhãn, thứ tự, nhóm. **Không** đổi `duongDan`, `activeFor`, quyền.

| Vai trò | Mục chính (không có nhãn nhóm) | Chân sidebar | Đáy điện thoại |
|---|---|---|---|
| CHU | Hôm nay · Tiền (`/thu-tien`, activeFor `/thu-tien`,`/hoa-don`) · Toà & phòng · Người thuê · Hợp đồng · Sự cố (đếm) · Báo cáo | Giá dịch vụ & cài đặt (`/dich-vu`) · Lịch xem phòng · An toàn PCCC · Nhật ký | **Bật** `bottomNav`: Hôm nay · Tiền · Toà · Sự cố · Thêm (mở ngăn nav đang có) |
| QUAN_LY | Hôm nay · `Tháng ${tháng hiện tại}` (`/chu-ky`, đếm, nóng) · Thu tiền · Phòng · Người thuê · Hợp đồng · Lịch xem phòng (`/lich-hen`, đếm) · Sự cố (đếm) | An toàn PCCC · Báo cho cư dân (`/thong-bao`) · Giá dịch vụ | như hiện tại |
| QTHT | Tài khoản · Toà nhà · Nhật ký | — | — |
| THO | Việc · Tiền công (chuông thông báo nằm ở đầu trang, không trong nav) | — | Việc · Tiền công |
| NGUOI_THUE | Tiền nhà (`/hoa-don-cua-toi`) · Báo hỏng · Phòng tôi (`/hop-dong`) · Lịch sử (`/lich-su`, activeFor thêm `/tieu-thu`) | — | 4 mục trên |

Mọi route cũ vẫn mở được: `dinhTuyen.test.ts` phải giữ nguyên các ca "mở được" và chỉ đổi những ca kiểm nhãn. Tìm nhanh (⌘K) vẫn ra mọi màn, kể cả màn không còn trong nav.

**B3. Khung** (`design/shell/*`, theo `khung()` + `.ben`/`.dau` của `v3.css`):
- Sidebar trắng rộng 224, mục đang chọn có nền `--ma-paper-3` và chữ 600, không vạch teal.
- TopBar cao 56 gồm: chọn toà, ô tìm "Tìm phòng, người, hoá đơn… ⌘K", chuông, tên + vai trò.
- `TabTrang`: chỉ đổi kiểu (gạch chân mực 2px, không nền), giữ vị trí.
- `Breadcrumb`: chữ 13 `--ma-text-secondary`.

Mỗi màn có **đúng một `h1`**: hiện tại màn nào tự render h1 thì giữ nguyên; khung không thêm h1.

**B4. Tách `ManDangNhap.tsx`.** Chuyển nguyên khối form đăng nhập (từ `return (<main style={styleKhungKhach}>…` của nhánh `!nguoiDung` cùng các `styleDangNhap*`) ra file mới. Props nhận đủ những gì khối đó đang dùng: `form`, `setForm`, `onSubmit`, `dangDangNhap`, `authError`, `laManHinhHep`, `onKhamPha`, `onTroGiup`…). Đây là di chuyển thuần: `App.dangNhap.test.tsx` phải qua **mà không sửa test**. Ở đợt 1, y8 sẽ làm lại giao diện file này.

**B5. Component chung mới** (đặt trong `design/**`, class `ma-*` trong `design/components.css`, mỗi cái có test trong `designComponents.test.tsx`). **Đây là hợp đồng cho y1…y8, viết đúng tên:**

```ts
// design/layout/DauTrang.tsx — đầu trang: đúng một <h1>
export function DauTrang(p: { tieuDe: React.ReactNode; phu?: React.ReactNode; hanhDong?: React.ReactNode; vet?: { nhan: string; href: string }[] }): React.ReactElement
//  phu: một dòng bối cảnh / "việc kế tiếp" (chữ phụ, có thể chứa <b>, link). hanhDong: nút (≤ 1 primary). vet: breadcrumb.
//  390: hanhDong xuống dòng dưới tiêu đề. Không tự thêm nút.

// design/layout/KhoiSo.tsx — dải số đầu trang (.the.dai của prototype)
export type OSo = { nhan: string; giaTri: React.ReactNode; donVi?: string; phu?: React.ReactNode; tone?: 'no' | 'thuong'; anKhiHep?: boolean; href?: string }
export function KhoiSo(p: { so: OSo[] }): React.ReactElement
//  Ô đầu là số lớn (--ma-text-figure-lg), các ô sau vừa. tone 'no' → --ma-urgent. anKhiHep → ẩn khi < 768. Số 0 không bao giờ đỏ.

// design/building/DongViec.tsx — một dòng "Cần quyết hôm nay"/"Việc cần làm"
export function DongViec(p: { muc?: 'no' | 'canh' | 'thuong'; tieuDe: React.ReactNode; moTa?: React.ReactNode; nutNhan?: string; href?: string; onBam?: () => void }): React.ReactElement
//  Chấm màu theo muc + tiêu đề 500 + mô tả phụ; nút THƯỜNG bên phải (nutNhan + href|onBam). Không nutNhan → không nút.

// design/money/DongNguoiNo.tsx — một người nợ (gom mọi tháng)
import type { NhomNo } from '../../nhomNoTheoNguoi'
export type DongNguoiNoProps = {
  nhom: NhomNo; sdt?: string | null; hienToa?: boolean
  rut?: boolean            // dạng gọn (Hôm nay, 390): tên · "phòng 101 · 4 tháng" · số còn nợ đỏ · nút Gọi
  mo?: boolean; onMo?: () => void   // mở hàng con từng tháng: "Tháng 7/2026 · hạn 05/08/2026 · trễ 113 ngày · còn 1.895.000 ₫"
  hrefHoSo?: string        // tên là link sang hồ sơ người thuê
  onNhac?: () => void      // không truyền → không có nút "Nhắc"
  onGhiThu?: () => void    // không truyền → không có nút "Ghi thu" (vai trò không ghi được)
}
export function DongNguoiNo(p: DongNguoiNoProps): React.ReactElement
//  Gọi = <a href="tel:…"> chỉ khi chuanSdt(sdt) hợp lệ. Mọi nút là nút thường. Dạng đầy đủ: "từ tháng 7/2026", "Đã trả", "Còn nợ".

// design/money/NganNhacNo.tsx — ngăn nhắc nợ (client, không API)
export function NganNhacNo(p: { nhom: NhomNo; sdt?: string | null; hanTra: string /* dd/mm/yyyy */; onDong: () => void }): React.ReactElement
//  Hiện tin tinNhacNo(nhom, hanTra) trong textarea sửa được; "Chép tin" (navigator.clipboard, báo "Đã chép"); "Mở Zalo" = <a href={linkZalo(sdt)} target="_blank" rel="noopener"> chỉ khi có link.
//  Ghi rõ dưới nút: "App chưa tự gửi tin. Mở Zalo rồi dán tin." (trung thực: nhắc qua hệ thống cần backend). role=dialog, useDialogTrap, Esc đóng.

// design/core/ThanhBuoc.tsx — thanh bước (Tháng 4 bước, vòng đời hợp đồng, 8 bước sự cố)
export type Buoc = { ten: string; moTa?: string; trangThai: 'xong' | 'nay' | 'cho'; href?: string }
export function ThanhBuoc(p: { buoc: Buoc[]; nhan: string /* aria-label */; doc?: boolean /* dọc (timeline) */ }): React.ReactElement
//  <ol>; bước 'nay' có aria-current="step" + chữ 600; 'xong' có dấu ✓. < 768 (ngang): chỉ "Bước 2/4: Khoá chỉ số".

// design/table/DataTable.tsx — thêm prop
//   tongHang?: React.ReactNode[]   // các ô của hàng tổng → <tfoot><tr className="ma-tong"> chữ 600, kẻ trên 2px mực
// design/table/HangTong.tsx — cho bảng tự viết
export function HangTong(p: { o: React.ReactNode[]; canhPhai?: number[] }): React.ReactElement

// design/feedback/NhanMinhHoa.tsx — nhãn trung thực cho phần thiếu backend
export function NhanMinhHoa(p: { children?: React.ReactNode /* mặc định 'minh hoạ' */ }): React.ReactElement   // chữ 13, nền --ma-waiting-bg, không viết hoa

// design/layout/ChanDinh.tsx — chỗ đặt nút chính
export function ChanDinh(p: { children: React.ReactNode }): React.ReactElement
//  < 768 hoặc [data-density="thoang"]: dính đáy (sticky bottom 0, nền trắng, viền trên, padding-bottom env(safe-area-inset-bottom)), nút giãn hết ngang.
//  Desktop: hàng nút căn phải cuối khối.
```

Logic dùng chung (đã có test, chép từ mã mẫu): `tienTheoNguoi.ts`:
- `nhanThang(h)`;
- `docSoTien(s)`;
- `phanBoThu(hoaDon, soTien)`: trả `{ phanBo, loi }`, tháng cũ trước, thu dư thì báo lỗi;
- `ghiThuLanLuot(phanBo, ghi)`: ghi lần lượt, dừng ở lỗi đầu tiên, trả `{ daGhi, loi }`;
- `tinNhacNo(nhom, hanTra)`, `linkZalo`, `chuanSdt`, `dinhDangSdt`.

**B6. Công cụ đo:**
- `qa-probe.js`:
  - `minText = 13` ở mọi khung;
  - nếu có `[data-density="thoang"]` thì `minText = 16`, `minHit = 44`;
  - thêm trường `h1: { count, left, top }` (lấy từ `document.querySelectorAll('h1')` và `getBoundingClientRect` của h1 đầu tiên).
- `run-repo-guard.sh`: đổi 2 nguồn chép từ `assets/tokens.css` và `assets/fonts/` sang `v3/plans/ma-mau/frontend/src/tokens/overlay-ui-redesign.css` và `v3/prototype/fonts/`.
- `contrast.py`: đổi các cặp teal sang cặp V3 (mực/trắng, phụ/nền, link/trắng, đỏ/đỏ nhạt…).
- `dom2svg.js`, `cdp-run.mjs`: "Inter" → "IBM Plex Sans".

**Commit B:** `ui(y0): khung V3, mật độ theo vai trò, component chung, tách ManDangNhap`.

## 5. Nghiệm thu (đo được)
- `npx tsc -b && npx vitest run && npm run build` đều qua. Số test ≥ 617 + test mới. Mã mẫu đã chạy thử trong clone: 641/641.
- Không còn `Inter`, teal, kem v2 trong `src/**/*.css`. Kiểm bằng guard mới và `grep -rniE "\"Inter\"|'Inter'|#0f766e|#0d9488|#115e59|#e6f2f0|#f9f7f6" src` trả rỗng.
- Ảnh app thật, 1 ảnh mỗi vai ở 1440 và 390: `/hom-nay` (CHU, QUAN_LY), `/viec-cua-toi` (THO, 390), `/hoa-don-cua-toi` (NGUOI_THUE, 390), `/tai-khoan` (QTHT), `/dang-nhap`. Với `qa.json`: `fontsLoaded` có `IBM Plex Sans 400/500/600`, `fontFamiliesUsed` không còn Inter; `horizontalOverflow` 0; `h1.count` = 1. Ghi h1 left/top của 6 ảnh.
- Tương phản cặp token chính đã đo trong lúc lập plan (công thức WCAG), tất cả ≥ 4.5 với chữ và ≥ 3 với viền/đồ hoạ:

  | Cặp | Tỉ lệ |
  |---|---|
  | mực / trắng | 17,82 |
  | phụ `#47505A` / trắng | 8,19 |
  | phụ / nền `#F4F5F7` | 7,51 |
  | mờ `#5C6670` / nền | 5,36 |
  | link `#1B56B0` / trắng | 6,99 |
  | đỏ `#B3261E` / đỏ nhạt | 5,72 |
  | vàng chữ `#8A4B00` / vàng nhạt | 6,17 |
  | xanh ok / ok nhạt | 5,62 |
  | trắng / hover mực | 13,13 |
  | link toast `#A9C7FF` / mực | 10,44 |
  | viền ô `#868F99` / nền | 3,01 |

  Đo lại bằng `contrast.py` sau khi cập nhật.

Nếu thêm biến hay đổi màu thì phải đo lại cặp đó.
<!-- CHUNG -->
## Chung cho mọi lô V3 (đọc hết, không cần mở file khác)

**Bối cảnh.** Chủ tịch đã duyệt thiết kế V3 "Sổ cái" (`docs/design/ui-redesign/v3/`). V3 thay ux-v2 ở 5 điểm: font IBM Plex Sans; nút chính màu mực `#14181D` (bỏ teal, bỏ nền kem); tiền gom theo người; trang đầu trả lời câu hỏi của người dùng; 3 mật độ. Lô này (y0) chạy trước mọi lô và tạo ra các phần đó. Nhánh gốc là `feat/v3` tại commit `09cbddb` (617 test).

**Ràng buộc (vi phạm thì trả lô):**
- Không push, không merge, không đổi nhánh khác ngoài nhánh lô. Mỗi task một commit, message `ui(y0): …`.
- Không đổi quyền, route, API backend. Route cũ phải còn mở được. Không sửa `api.ts`, `managementApi.ts`, `financeApi.ts`, `workerDashboardApi.ts`, `backend/**`, `package*.json`. Không thêm dependency.
- App demo `http://localhost:5190` (cũng là backend cho vite dev): **chỉ GET**. Lệnh ghi duy nhất được phép là đăng nhập (`POST /api/auth/login`, do `app-shot.mjs` làm). Luồng ghi (ghi thu, khoá chỉ số, gửi hoá đơn, duyệt…) chỉ được chứng minh bằng test mock `fetch`, không bấm trên app thật.
- **Không in mật khẩu hay token ra output**: không `cat`/`sed`/`grep` dòng 8 của `docker-compose.demo.yml`, không `echo $MA_DEMO_PASSWORD`, không log header `Authorization`.
- Chỉ sửa file trong mục "File được sửa" của brief này. Cần sửa file khác thì dừng lại, ghi vào báo cáo (mục "Cần lô khác").
- Tên file mới không được trùng tên file có sẵn khi bỏ phân biệt hoa/thường, vì repo còn chạy trên Windows.
- Test cũ chỉ sửa khi UI đổi hợp lệ, và ghi lý do cho **từng** test. Không xoá test, không `skip`. Nếu phải sửa quá ~30 test thì dừng, báo controller.
- `App*.test.tsx` thuộc lô nền. Lô này chỉ được sửa những `it(...)` kiểm màn của lô mình, và ghi tên từng `it` vào báo cáo.

**Quy tắc thiết kế V3 (03-he-thiet-ke.md):**
- Mật độ do App tự đặt `data-density` ở `.ma-app-shell`: Chủ/QL/QTHT trên máy tính dùng `lam-viec` (thân 15/22, nút 36, hàng 48); màn < 768 dùng `chu-m` (thân 16/24, nút 44, hàng 60); Người thuê và Thợ dùng `thoang` (thân 17/26, nút 52, hàng 64, chữ nhỏ nhất 16). Màn **không** tự đặt cỡ chữ hay chiều cao px. Chỉ dùng token `--ma-text-*`, `--ma-control-h`, `--ma-row-h`, `--ma-space-*`.
- Màu: không viết hex trong `.tsx`/`.css` của màn, chỉ dùng `var(--ma-…)`. Đỏ `--ma-urgent` chỉ dành cho tiền nợ / quá hạn / khẩn. Vàng `--ma-waiting` dùng cho việc chờ. Xanh `--ma-text-link` dùng cho đường dẫn.
- Nút: **tối đa 1 nút chính** (`<Button variant="primary">`, nền mực) mỗi màn. Màn chỉ đọc không có nút chính. Việc phá huỷ (thanh lý, từ chối, khoá tài khoản) không bao giờ là nút chính, dùng `variant="secondary"` và nhãn kết thúc bằng "…" để mở hỏi lại. Hành động lặp lại theo dòng dùng nút thường. Trên điện thoại, nút chính đặt trong `<ChanDinh>` (dính đáy).
- Chữ: Plex 400/500/600. Không 700, không IN HOA, không nghiêng, không `letterSpacing` dương, không font mono. Nhãn nút là động từ + đối tượng ("Ghi thu 7.580.000 ₫", "Giao thợ"), không bao giờ là "OK".
- Bảng tiếng nói: Kỳ → **Tháng** ("Tháng 11/2026"); Chốt kỳ → **Khoá chỉ số**; Phát hành hoá đơn → **Gửi hoá đơn**; Thực thu → **Đã thu**; Công nợ → **Còn nợ**; Phân công → **Giao thợ**; Lấp đầy x% → "**27/36 phòng đang thuê**"; Chủ sở hữu → **Chủ nhà**; Yêu cầu sửa chữa → **Sự cố**; Lịch hẹn → **Lịch xem phòng**.
- Số tiền: `dinhDangTien` (`design/core/format.ts`), dạng `7.580.000 ₫`. Ngày: `dd/mm/yyyy`. SĐT: `dinhDangSdt` → `0999 100 001`. Tháng của hoá đơn: `nhanThang(h)` → `7/2026`.
- Thiếu backend: dùng `<NhanMinhHoa>` ("minh hoạ" / "cần backend") ngay cạnh phần đó, hoặc ẩn đi. Không để nút chết, không dựng số giả như thật.
- Trạng thái bắt buộc cho mỗi khối có tải dữ liệu: **đang tải** (khung xương giữ chỗ, không nhảy bố cục) · **rỗng** (một câu + một việc làm tiếp) · **lỗi** (báo ngay trong khối + "Tải lại", không xoá số cũ nếu có) · **mất mạng** (`SyncBanner` của khung đã lo; nút ghi `blocked` + lý do).
- Vai trò không gọi được một API (QL bị 403 ở `/api/bao-cao/cong-no`, `/api/dashboard/chu`; Người thuê bị 403 ở `/api/toa-nha/:id/ben-a`): **ẩn** control đó cho vai trò ấy, không hiện lỗi 403.

**Component chung y0 đã có (import từ `design/…`, không sửa):** `Button` (`variant` primary|secondary|text, `size`, `blocked` + `blockedReason`), `StatusTag` (tone), `DataTable` (`tongHang`, `rowProps`, `chips`), `Card`, `Field`/`Input`/`Select`, `EmptyState`, `Toast`, `ConfirmDialog`, `SyncBanner`, `Breadcrumb`, **mới:** `DauTrang`, `KhoiSo`, `DongViec`, `DongNguoiNo`, `ThanhBuoc`, `HangTong`, `NhanMinhHoa`, `ChanDinh`. Interface xem phần "Hợp đồng dùng" của brief này. Logic: `tienTheoNguoi.ts` (`nhanThang`, `docSoTien`, `phanBoThu`, `ghiThuLanLuot`, `tinNhacNo`, `linkZalo`, `chuanSdt`, `dinhDangSdt`), `nhomNoTheoNguoi.ts` (`tuCongNo`, `tuHoaDonQuanLy`, `nhomNo`, `locNo`, `hangTong`), `TrangProps = { token, vaiTro, mobile, thamSo, dieuHuong }`.

**Bắt đầu (macOS):**
```bash
cd ~/Documents/PRJ/MiniApart-ui && git worktree add ~/Documents/PRJ/MiniApart-y0 -b ui/y0-nen feat/v3
cd ~/Documents/PRJ/MiniApart-y0/frontend && npm ci && npx tsc -b && npx vitest run   # ghi lại số test mốc
```
Ghi file ctx cho lô ở `${TMPDIR:-/tmp}/v3-y0-ctx.md`, gồm: mốc test, task đang làm, commit đã có, việc còn lại. Cập nhật sau mỗi task để phiên sau làm tiếp được. Không commit file này.

**Lệnh kiểm (chạy trước mỗi commit và cuối lô, trong `~/Documents/PRJ/MiniApart-y0/frontend`):**
```bash
npx tsc -b && npx vitest run && npm run build      # vitest có sẵn guard designTokens.test.ts (Inter/teal/mono/IN HOA/hex)
git diff --stat feat/v3...HEAD                                  # chỉ được có file trong "File được sửa" + shots/y0
```

**Chụp ảnh nghiệm thu (dữ liệu thật, chỉ GET):**
```bash
cd ~/Documents/PRJ/MiniApart-y0/frontend && (VITE_BACKEND_URL=http://localhost:5190 npx vite --port 5300 --strictPort > ${TMPDIR:-/tmp}/vite-y0.log 2>&1 &)
cd ~/Documents/PRJ/MiniApart-y0
export TASTE_CDP=~/.hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs MA_APP_URL=http://localhost:5300
export MA_DEMO_PASSWORD="$(python3 -c "import re,pathlib;l=pathlib.Path('~/Documents/PRJ/MiniApart-ui/docker-compose.demo.yml').expanduser().read_text(encoding='utf-8').splitlines()[7];print(re.search(r'mật khẩu (\S+?)\)',l).group(1))")"   # không echo
node docs/design/ui-redesign/tools/app-shot.mjs docs/design/ui-redesign/v3/shots/y0/jobs.json docs/design/ui-redesign/v3/shots/y0
```
`jobs.json` có dạng `[{ "name": "<mã>-<khung>", "path": "/…", "role": "CHU"|"QUAN_LY"|"THO"|"NGUOI_THUE"|"QTHT", "w": 1440|390, "h": 900|844, "full": true }]`. Đặt ảnh cạnh ảnh V3 cùng mã trong `docs/design/ui-redesign/v3/screens/png/` để so. Xong thì tắt vite (`pkill -f "vite --port 5300"`).

**Tiêu chí nghiệm thu đo được (lấy từ `qa.json` do `app-shot.mjs` ghi ra):** `horizontalOverflow` 0 · `belowHit` 0 (ngưỡng ≥36 desktop, ≥44 ở 390 và ở mọi màn Người thuê/Thợ) · `contrast.below` 0 (≥4.5) · `textBelowFloor` 0 (≥13; Người thuê/Thợ ≥16) · `h1.count` = 1 (ghi `h1.left`/`h1.top`) · `noAccessibleName` 0. Với từng ảnh, ghi rõ **khác prototype ở đâu** và **cái gì đổi giữa 1440 và 390**.

**Báo cáo cuối lô:** `docs/design/ui-redesign/v3/shots/y0/BAO-CAO.md`, gồm:
1. Việc theo task, kèm hash commit.
2. Lệnh kiểm đã chạy thật và số test (mốc → sau).
3. Bảng ảnh: mã · khung · khác prototype ở đâu.
4. Test cũ đã sửa, lý do từng test.
5. Không làm / chưa kiểm / cần lô khác / phụ thuộc backend.

Báo cáo viết ngắn, tiếng Việt.
<!-- /CHUNG -->
