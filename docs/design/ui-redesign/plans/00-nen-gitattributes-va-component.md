# Plan 00 — Nền: `.gitattributes` + bộ component dùng chung

> Thi công bằng `superpowers:executing-plans`, mỗi task một commit nhỏ. Plan 01/02/03 đều dựa vào plan này: **merge 00 vào `feat/ui-tokens` trước rồi mới tách worktree cho các plan sau.**

## Cần có trước
- Worktree `C:/Users/nthieuu05/Documents/PRJ/MiniApart-ui`, nhánh `feat/ui-tokens`, `node_modules` đã cài (`npm ci`).
- Design nguồn: `docs/design/ui-redesign/assets/components.css` (459 dòng, 199 class), `assets/tokens.css` (185 biến), `assets/icons.svg` (~70 icon), `assets/shell.js` (cấu trúc sidebar/bottom-nav).
- Mã mẫu đã chạy thật, nằm ở `plans/ma-mau/` (xem mục "Mã mẫu" cuối file).

## Số đo thật — lần kiểm 21/11/2026
- `git log --oneline -5`: `a38cc81 Merge branch 'feat/ui-redesign' into feat/ui-tokens` · `f39bad2 feat(ui): áp overlay token…` · `c9bb13b` · `6efdc36` · `c0137b7`.
- `git status --short`: chỉ `?? docs/design/ui-redesign/plans/` (các file plan này).
- `cd frontend && npm test`: **Test Files 38 passed (38), Tests 252 passed (252)**, 6,3 s.
- `npm run build`: qua, 6,8 s; `index-*.js` **790,40 kB** (gzip 190,26 kB), CSS 19,02 kB; Vite cảnh báo chunk > 500 kB (có từ trước, không thuộc đợt này).
- `git config core.autocrlf` = `true`. `git ls-files --eol`: **913 file `w/crlf`**, 2 file `w/lf` (`frontend/src/styles.css`, `frontend/src/tokens/overlay-ui-redesign.css`), 3 `w/none`, 188 `w/-text`. Trong index mọi file đều `i/lf`.
- **Vì sao hôm nay worktree xanh mà vẫn phải sửa:** `styles.css` đang tình cờ là LF ở working tree. Clone mới (`git clone --shared -b feat/ui-tokens` vào scratch) với `autocrlf=true` checkout ra CRLF → `src/stylesCleanup.test.ts` đỏ (đã tái hiện). Thêm `.gitattributes` dưới đây + `git add --renormalize .` + checkout lại → `1 w/crlf` (chỉ `backend/gradlew.bat`), 915 `w/lf`, 3 `w/none`, 188 `w/-text`; **toàn bộ 38 file / 252 test xanh**.

## Trước khi thi công, kiểm lại với code thật
- `frontend/src/main.tsx` import đúng 2 dòng CSS: `./tokens/index.css`, `./styles.css`. Thêm CSS mới phải đặt **sau** `tokens/index.css`.
- `frontend/src/design/` hiện có (2.181 dòng gồm cả `.prompt.md`): `core/Button.tsx` (107 dòng, variant `primary|secondary|text|onInverse|onInverseGhost`, size `md|sm`), `core/StatusTag.tsx` (39, tone `draft|neutral|strong|urgent|waiting|done|closed`), `core/Glyph.tsx` + `GlyphName.ts` (23 glyph nghiệp vụ từ `assets/icons/glyphs.json`), `forms/FilterChip.tsx` (44), `forms/MeterInput.tsx` (68), `feedback/EmptyState.tsx` (51, `kind` có sẵn), `feedback/ConfirmDialog.tsx` (140) + `useDialogTrap.ts`, `feedback/Toast.tsx`, `feedback/SyncBanner.tsx`, `layout/Screen.tsx` (140: `ScreenSurface`, `ScreenHeader`, `TableFrame`, `TableHeadCell`, `TableCell`, `FormPanel`, `FormField`, `MetaGrid`, `MetaItem`…), `shell/NavPanel.tsx` (356, nhận `groups: NavGroup[]`, `mobile` → bottom bar `slice(0, 4)` + nút "Thêm"), `shell/TopBar.tsx` (112), `shell/Breadcrumb.tsx`, `shell/StatStrip.tsx`.
- Test khoá hành vi component cũ: `designComponents.test.tsx` (9 test; assert inline `dt/dd` color của `MetaItem`, `minHeight: 44px` của nút trong `ConfirmDialog`), `designTokens.test.ts` (1), `glyphAssets.test.ts` (1; **khoá đúng 23 glyph**), `stylesCleanup.test.ts` (6; cấm hex trong `styles.css`, cấm lại các class đã gỡ).
- Class của `components.css` trùng với className đang dùng trong code: chỉ `field` (15 chỗ trong `DanhMucPhong.tsx`) và `sr-only`. `.field` của design chỉ là `display:grid; gap:6px` — kiểm ảnh `/phong` sau task 0b-1.
- Toàn bộ 76 biến `var(--ma-…)` mà `components.css` dùng đều đã có trong `tokens/overlay-ui-redesign.css` (đã đối chiếu).

## Rủi ro
- `components.css` dòng 7–22 là **reset toàn cục** (`h1…p { margin:0 }`, `ul { list-style:none }`, `a { text-decoration:none }`, `body` nền + font). Bật ngay sẽ đổi diện mạo cả 44 màn chưa làm → **tách ra, chỉ bật ở task cuối plan 03**.
- Renormalize đụng ~913 file trong một commit → mọi nhánh đang mở sẽ xung đột "toàn file". Làm **trước** khi tách worktree cho 01/02/03; báo các nhánh khác rebase với `-X renormalize`.
- `NavPanel` đang được `App.test.tsx` đọc qua `nav a` (`readMenuLabels`) — đổi cấu trúc DOM của nav phải giữ `<a>` trong `<nav>`.

## Không làm
- Không sửa `backend/`, compose, dữ liệu demo. Không đổi token (đã xong ở `f39bad2`).
- Không viết lại component cũ đang ổn (`ConfirmDialog`, `Toast`, `MeterInput`, `MetaItem`…); chỉ đổi ruột chỗ design khác hẳn (Button, StatusTag, FilterChip).
- Không thêm thư viện (bảng, biểu đồ, icon) — bảng và biểu đồ tự dựng bằng logic thuần + SVG.
- Không code splitting để hết cảnh báo 790 kB (ngoài phạm vi UI).

---

## Task 0-1 — `.gitattributes` + renormalize  · cỡ S · làm ngay, không song song với gì
**File:** `.gitattributes` (gốc repo, mới) — chép nguyên `plans/ma-mau/.gitattributes`.
```gitattributes
# Mặc định: văn bản lưu LF trong repo và LF khi checkout, bất kể core.autocrlf.
* text=auto eol=lf
# Script Windows cần CRLF mới chạy đúng.
*.bat text eol=crlf
*.cmd text eol=crlf
# Nhị phân: không bao giờ đổi xuống dòng.
*.png binary
… (jpg jpeg webp gif ico woff woff2 ttf otf pdf docx xlsx pptx zip jar)
```
**Các bước:**
```bash
cd C:/Users/nthieuu05/Documents/PRJ/MiniApart-ui
cp docs/design/ui-redesign/plans/ma-mau/.gitattributes .gitattributes
git add .gitattributes && git add --renormalize . && git commit -m "chore: .gitattributes (LF) + renormalize"
git rm -r -q --cached . && git reset -q --hard      # checkout lại theo luật mới
git ls-files --eol | awk '{print $2}' | sort | uniq -c
cd frontend && npm test && npm run build
```
**Anh sẽ thấy:** `git ls-files --eol` còn đúng `1 w/crlf` (`backend/gradlew.bat`), phần văn bản còn lại `w/lf`; `npm test` = 38 file / 252 test xanh; build qua.
**Không được xảy ra:** file nhị phân (png/woff2/docx…) xuất hiện trong `git diff --stat` của commit renormalize (nếu có → thiếu dòng `binary`); `gradlew.bat` thành LF.
**Test chứng minh:** chính `stylesCleanup.test.ts` (6 test) — kiểm thêm trên clone mới:
```bash
S=$LOCALAPPDATA/hermes/profiles/bot-nthieuu/cache/scratch/eol-check; rm -rf "$S"
git clone -q --shared -b feat/ui-tokens C:/Users/nthieuu05/Documents/PRJ/MiniApart-ui "$S"
git -C "$S" ls-files --eol frontend/src/styles.css   # mong đợi: i/lf w/lf
```

## Task 0b-1 — Nạp `components.css` (trừ reset) + `Icon`  · cỡ S · sau 0-1
**File:**
- `frontend/src/design/components.css` (mới): chép `assets/components.css` **bỏ dòng 7–22** (reset toàn cục). Giữ `.sr-only`, `:focus-visible`, `.ic*`, các class chữ trở xuống.
- `frontend/src/design/base.css` (mới): đúng dòng 7–22. **Chưa import** (bật ở plan 03, task cuối).
- `frontend/src/main.tsx`: thêm `import './design/components.css'` giữa 2 import hiện có.
- `frontend/src/assets/icons/ui-icons.svg` (mới): chép `assets/icons.svg`.
- `frontend/src/design/core/Icon.tsx` (mới, ~15 dòng): `import sprite from '../../assets/icons/ui-icons.svg'` → `<svg className={size==='sm'?'ic-sm':'ic'} aria-hidden="true"><use href={`${sprite}#i-${name}`} /></svg>`; `IconName` là union các id trong sprite. **Giữ nguyên `Glyph`** (23 glyph nghiệp vụ, có test khoá).
- `frontend/src/designTokens.test.ts`: thêm 1 test đọc `design/components.css?raw` — không chứa mã hex (`/#[0-9a-fA-F]{3,8}\b/`), không chứa `body {`/`h1, h2`.

**Anh sẽ thấy:** app trông y như trước ở mọi màn (chưa component nào dùng class mới); CSS build tăng (ước tính +10–15 kB chưa nén; ghi số thật vào commit).
**Không được xảy ra:** đổi lề/gạch chân của trang cũ (nghĩa là reset lọt vào); `/phong` (`DanhMucPhong`, 15 ô `.field`) vỡ bố cục.
**Kiểm:** `npm test` → 253/253; `npm run build` qua; chụp `/phong` 1440 trước/sau bằng `tools/app-shot.mjs`, hai ảnh khác nhau ≤ vài px.

## Task 0b-2 — Đổi ruột Button / StatusTag / FilterChip sang class design  · cỡ M · sau 0b-1
**File:** `design/core/Button.tsx`, `design/core/StatusTag.tsx`, `design/forms/FilterChip.tsx`, `designComponents.test.tsx`.
- Giữ nguyên props + tên export (có 9 file màn đang dùng Button…). Map: `primary→btn btn-primary`, `secondary→btn btn-secondary`, `text→btn btn-ghost`, `onInverse*` giữ inline như cũ (chỉ dùng trên nền tối); size `sm→btn-sm`.
- StatusTag: tone → class `tag` + biến thể theo `components.css` mục "Thẻ trạng thái", **luôn có icon + chữ** (design yêu cầu không dùng màu đơn độc) — icon mặc định theo tone, có thể truyền `icon`.
- FilterChip: thành `<button className="chip" aria-pressed={active}>{children}<span className="count">{count}</span></button>`; thêm prop `count?: number`. Giữ `onRemove` cho chỗ cũ.

**Anh sẽ thấy:** nút chính teal `#0F766E` cao 40px desktop/48px mobile, chip lọc bật/tắt có số đếm, tag trạng thái có icon — ở các màn đang dùng 3 component này.
**Không được xảy ra:** test cũ nào phải xoá; nút mất `type`/`disabled`/`aria-*` truyền vào.
**Test:** thêm 3 test vào `designComponents.test.tsx`: Button `variant="primary"` có class `btn-primary`; StatusTag `tone="urgent"` có `<svg>` + chữ; FilterChip `active` có `aria-pressed="true"` và hiện `count`. Kiểm: `npx vitest run src/designComponents.test.tsx` → 12 passed; `npm test` → 256/256.

## Task 0b-3 — Bảng dùng chung: `useBangDuLieu` + `DataTable` + bulkbar + phân trang  · cỡ M · song song được với 0b-4, 0b-5
**File:**
- `frontend/src/design/table/bangDuLieu.ts` + `.test.ts` — **chép nguyên `plans/ma-mau/frontend/src/design/table/*`** (đã chạy: 9 test xanh, `tsc -b` sạch; 6/6 đột biến bị test bắt). Logic thuần: tìm không dấu (`"dinh"` ra `"Đinh"`), lọc chip, sắp số tự nhiên (`101 < 1001`), ô rỗng luôn cuối, phân trang có kẹp trang, `demTheoChip`, `doiSapXep` (giá trị cho `aria-sort`).
- `frontend/src/design/table/DataTable.tsx` (mới, ~120 dòng): nhận `rows`, `columns: {key, label, align?, sortable?, render}`, `chips`, `timTheo`, `getRowId`, `bulkActions?`. Render đúng markup `components.css` mục "Bảng": `.toolbar` (ô tìm + chip có số), `<table class="table">` với `<th aria-sort>` là `<button>`, checkbox chọn hàng + "Chọn tất cả" (trang hiện tại), `.bulkbar` (hiện khi chọn ≥1: "Đã chọn N …" + hành động), `.pager` ("1–11 trong 11 …"). Mobile (<768): mỗi hàng thành thẻ (theo `components.css` mục "Đáp ứng").
- Không thay `TableFrame/TableHeadCell/TableCell` cũ (màn chưa làm vẫn dùng).

**Anh sẽ thấy:** (qua màn 05 ở plan 01) gõ "dinh" lọc ra "Đinh Nhật Quang"; bấm "Giá thuê" lần 1 tăng, lần 2 giảm; chọn 1 hàng hiện bulkbar.
**Không được xảy ra:** sắp xếp làm đổi mảng gốc (state React); trang trống khi lọc làm giảm số trang (đã kẹp).
**Test:** `bangDuLieu.test.ts` (9) + `DataTable.test.tsx` mới 4 test: render đủ cột; chip hiện số đếm; bấm header đổi `aria-sort`; chọn hàng hiện bulkbar. Kiểm: `npx vitest run src/design/table` → 13 passed.

## Task 0b-4 — Thẻ, Field, Skeleton/Empty/Error  · cỡ S · song song
**File:**
- `design/layout/Card.tsx` (mới, ~25 dòng): `Card` (`.card`, tuỳ chọn `title`, `action`), `KpiCard` (`.kpi` số to + đơn vị `.unit` + mô tả + liên kết).
- `design/forms/Field.tsx` (mới, ~30 dòng): `Field` = `<label class="field">` + `.label` luôn hiện + con + `.field-error` dưới ô (`aria-describedby`, `aria-invalid`); `Input`/`Select` chỉ gắn class `input`/`select`.
- `design/feedback/EmptyState.tsx`: **dùng lại**, thêm `kind="loading"` render skeleton (`.skeleton` của design) và `kind="error"` (đã có `errorCode`) — đổi ruột sang class `.empty`, giữ props.
**Anh sẽ thấy:** khung trắng bo 24 không viền trên nền kem; lỗi form hiện ngay dưới ô.
**Không được xảy ra:** thẻ lồng thẻ có viền (design cấm hộp lồng hộp).
**Test:** thêm 3 test `designComponents.test.tsx` (Field nối `aria-describedby` tới lỗi; EmptyState `loading` có `aria-busy="true"`; Card có `h2` khi có `title`).

## Task 0b-5 — Khung: Sidebar nhóm, BottomNav ≤ 5, TopBar  · cỡ M · song song (nhưng plan 02 task 02-1 dựa vào đây)
**File:** `design/shell/NavPanel.tsx`, `design/shell/TopBar.tsx`, `designComponents.test.tsx`.
- `NavItem` thêm `icon?: IconName`, `count?: number`, `shortLabel?: string`, `depth?: 0|1` (mục con thụt lề). Sidebar render theo `components.css` "Khung ứng dụng": `.sidebar > .sb-brand + nav > .sb-label + a.nav-item[aria-current]`, `.sb-user` + nút đăng xuất. Thu gọn 1024–1279px theo design.
- Bottom-nav: **≤ 5 mục thì hiện hết, không có "Thêm"**; > 5 mục giữ `slice(0, 4)` + "Thêm" như hiện tại. Nhãn bottom-nav dùng `shortLabel ?? label`; `aria-label` của `<a>` là nhãn đầy đủ.
- TopBar: giữ props, đổi ruột sang `.topbar` (tiêu đề + 1 nút chính + tìm nhanh).
**Anh sẽ thấy:** vai trò Người thuê trên điện thoại có đủ 5 tab, không còn nút "Thêm"; tab đang mở có `aria-current="page"`.
**Không được xảy ra:** `nav a` mất chữ (App.test đọc `textContent` để so nhãn menu); vùng chạm bottom-nav < 44px.
**Test:** thêm 2 test: 5 mục → không có `[data-testid="mobile-nav-more"]`; 6 mục → có. `npm test` xanh hết (App.test 43 test không đổi ở task này).

## Task 0-6 — Công cụ chụp ảnh nghiệm thu từ app thật  · cỡ S · song song
**File:** `docs/design/ui-redesign/tools/app-shot.mjs` — chép `plans/ma-mau/docs/design/ui-redesign/tools/app-shot.mjs`.
- Đã chạy thật 21/11/2026 với job công khai: ra `02-kham-pha-1440.png`, `01-dang-nhap-390.png` + `qa.json` (đo bằng `tools/qa-probe.js`: cuộn ngang, vùng chạm 44/36, tương phản, font). Số đo hiện trạng: `/kham-pha` 1440 có các chip tiện ích cao **28px** (< 36) → nợ vùng chạm cần sửa ở plan 03.
- Job có `role` đăng nhập bằng form thật — **lệnh ghi duy nhất là `POST /api/auth/login`**, không bấm nút nghiệp vụ. Mật khẩu lấy từ biến môi trường `MA_DEMO_PASSWORD` (giá trị nằm trong `docker-compose.demo.yml`), không ghi vào file.
**Lệnh dùng ở mọi plan:**
```bash
cd C:/Users/nthieuu05/Documents/PRJ/MiniApart-ui
export MA_DEMO_PASSWORD=...   # tự đọc trong docker-compose.demo.yml
node docs/design/ui-redesign/tools/app-shot.mjs jobs.json evidence/ui-redesign/<man>
```
SĐT demo đã đối chiếu DB: QTHT `0999000001`, CHU `0999000011`, QUAN_LY `0999000020` (An Nhiên Residence, toà id 3), THO `0999000031`, NGUOI_THUE `0999100001` (phòng 101 An Nhiên).

## Tiêu chí nghiệm thu chung (dùng cho mọi màn ở plan 01–03)
Mỗi màn chụp từ app thật ở **1440 / 1024 / 390**, đặt cạnh `docs/design/ui-redesign/screens/png/<số>.png`, và `qa.json` phải có:
- `horizontalOverflow: 0` ở cả 3 bề rộng;
- `belowHit: []` (mobile ≥ 44px, desktop ≥ 36px) — ngoại lệ phải ghi tên phần tử + lý do;
- `contrast.below: []` (≥ 4,5:1 chữ thường, ≥ 3:1 chữ lớn);
- `fontsLoaded` có Archivo; không còn `IBM Plex Mono` trong `fontFamiliesUsed` ở màn đã làm.

## Mã mẫu (đã chạy, chép khi thi công)
| File trong `plans/ma-mau/` | Dùng ở | Kết quả chạy 21/11/2026 |
|---|---|---|
| `.gitattributes` | task 0-1 | renormalize → 252/252 xanh trên clone mới |
| `frontend/src/design/table/bangDuLieu.ts` + `.test.ts` | task 0b-3 | 9 test xanh, `tsc -b` sạch, 6/6 đột biến bị bắt |
| `frontend/src/design/charts/bieuDo.ts` + `.test.ts` | plan 02 | 9 test xanh, 8/8 đột biến bị bắt |
| `frontend/src/dashboardTongHop.ts` + `.test.ts` | plan 02 | 7 test xanh, 6/6 đột biến bị bắt; `tsc -b` sạch nên kiểu khớp `api.ts` |
| `docs/design/ui-redesign/tools/app-shot.mjs` | mọi plan | chụp + `qa.json` thật từ 5190 |

## Thứ tự & song song
`0-1` → `0b-1` → (`0b-2` ‖ `0b-3` ‖ `0b-4` ‖ `0b-5` ‖ `0-6`). Tổng cỡ ≈ 2 S + 3 M + 2 S. Xong → `npm test` (dự kiến ≈ 270 test) + `npm run build` + merge vào `feat/ui-tokens`.
