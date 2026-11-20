# 02 — Hệ thiết kế MiniApart (bản tổng quan)

Nguồn sự thật: `assets/tokens.css` (token) + `assets/components.css` (component). Trang xem thử bấm được: `design-system.html`. File này giải thích **vì sao** và **ánh xạ tên** để sau khi Chủ tịch duyệt chỉ cần thêm MỘT file overlay vào `frontend/src/tokens/`.

## 0. Nguyên tắc (một hướng duy nhất)

1. **Nền kem ấm, thẻ trắng không viền, không bóng.** Tách lớp bằng khoảng trắng và nền, không bằng viền lồng viền. Chỉ thứ nổi lên (menu, toast, modal) mới có bóng.
2. **Số là nhân vật chính.** KPI 44px đậm 600, mọi con số `tabular-nums` để thẳng cột; tiền `1.888.000 ₫`, ngày `dd/MM/yyyy`.
3. **Teal = thương hiệu + dữ liệu chính. Amber = chỉ để nhấn dữ liệu cần chú ý.** Đỏ/xanh lá/xanh dương chỉ dùng cho trạng thái, luôn kèm icon + chữ.
4. **Một font, không mono, không IN HOA giãn cách.** Archivo đủ dấu tiếng Việt, đóng gói cục bộ.
5. **Mỗi màn một hành động chính** (nút teal duy nhất). Các hành động khác là nút phụ/ghost/menu.
6. **Mobile-first cho Thợ, Khách thuê, Ghi chỉ số:** vùng chạm ≥ 44px (nút chính 48px), bottom-nav ≤ 5 mục, dùng một tay.

## 1. Màu

Tỷ lệ tương phản đo bằng `tools/contrast.py` (công thức WCAG 2.x, có tự kiểm 21:1 và #777/trắng = 4,48:1) và đo lại trên DOM thật bằng `tools/qa-probe.js` (xem `QA.md`).

| Vai trò | Token `--ma-*` | Giá trị | Đo được |
|---|---|---|---|
| Nền trang | `--ma-bg-page` | `#F4F2EE` | — |
| Thẻ / sidebar | `--ma-bg-card`, `--ma-bg-nav` | `#FFFFFF` | — |
| Giếng trong thẻ (sunken) | `--ma-bg-sunken` = `--ma-paper-2` | `#F7F5F2` | — |
| Hover hàng | `--ma-paper-1` (test repo khoá) | `#F9F7F6` | — |
| Neutral tint (chip, nav hover) | `--ma-paper-3` | `#EFECE7` | — |
| Hàng được chọn | `--ma-bg-row-selected` **MỚI** | `#EEF6F4` | — |
| Mực chính | `--ma-text-primary` | `#1C1B19` | 17,21:1 trên thẻ · 15,39:1 trên nền |
| Mực phụ | `--ma-text-secondary` | `#57534E` | 7,63:1 · 6,82:1 |
| Mực mờ (meta, placeholder) | `--ma-text-muted` | `#6B655F` | 5,75:1 · 5,14:1 · 5,28:1 trên sunken |
| Viền ô nhập, switch tắt | `--ma-border-strong` | `#8E8880` | 3,51:1 (UI ≥ 3:1) |
| Kẻ hàng | `--ma-border-default` | `#E7E3DD` | trang trí, không mang nghĩa |
| Brand / nút chính | `--ma-brand-primary` | `#0F766E` | chữ trắng 5,47:1 |
| Brand hover | `--ma-brand-primary-hover` | `#115E59` | chữ trắng 7,58:1 |
| Link | `--ma-text-link` **MỚI** | `#0F766E` | 5,47:1 · 4,90:1 trên nền |
| Brand tint (nav chọn) | `--ma-brand-accent-light` | `#E6F2F0` | chữ `#115E59` 6,62:1 |
| Amber dữ liệu | `--ma-accent-warm` **MỚI** | `#D97706` | đồ hoạ 3,19:1 — KHÔNG dùng làm chữ |
| Amber chữ | `--ma-accent-warm-text` **MỚI** | `#92400E` | 7,09:1 · 6,34:1 trên tint |
| Amber tint | `--ma-accent-warm-tint` **MỚI** | `#FDF1DC` | — |
| Success | `--ma-done-text` / `--ma-done-bg` | `#166534` / `#E7F5EC` | 6,34:1 |
| Warning | `--ma-waiting` / `--ma-waiting-bg` | `#92400E` / `#FDF1DC` | 6,34:1 |
| Danger | `--ma-urgent` / `--ma-urgent-bg` | `#B42318` / `#FDECEA` | 5,75:1 · trên trắng 6,57:1 |
| Info | `--ma-status-info` / `-light` | `#1E4FC2` / `#EAF0FC` | 6,22:1 |
| Neutral | `--ma-status-neutral` / `-light` **MỚI** | `#57534E` / `#EFECE7` | 6,47:1 |
| Biểu đồ 1 (chính) | `--ma-chart-1` **MỚI** | `#0D9488` | 3,74:1 |
| Biểu đồ 2 (chú ý) | `--ma-chart-2` **MỚI** | `#D97706` | 3,19:1 |
| Biểu đồ 3 (so sánh) | `--ma-chart-3` **MỚI** | `#8E8880` | 3,51:1 |
| Track / lưới biểu đồ | `--ma-chart-track`, `--ma-chart-grid` **MỚI** | `#EFECE7`, `#ECE8E2` | trang trí |
| Toast (inverse) | `--ma-bg-inverse` | `#1C1B19` | chữ trắng 17,21:1 · nút `#8FD3C8` 10,10:1 |

Đã bỏ khỏi bảng giá trị (giữ tên cho component cũ, đặt giá trị phẳng): kính mờ (`--ma-bg-glass*`, `--ma-backdrop-blur*` = 0), gradient trang trí (`--ma-gradient-*` = màu đặc), navy `#0F172A` làm nút chính.

## 2. Chữ

- Font: **Archivo** (OFL 1.1) — `assets/fonts/archivo-{latin,vietnamese}-{400,500,600,700}.woff2` (@fontsource/archivo 5.2.5), giấy phép `assets/fonts/LICENSE-Archivo-OFL.txt`, băm `assets/fonts/SHA256SUMS.txt`. Không CDN.
- **Phát hiện quan trọng:** bộ `archivo-*.woff2` đang có trong repo **thiếu glyph tiếng Việt** (đo bằng canvas: `ăằắẳẵặậệộơờớởỡợưừứửữựđĐỢỰ₫` rơi về font hệ thống). Đây là một nguyên nhân chữ Việt trông lệch nét ở app hiện tại. Bộ mới tách subset `vietnamese` theo `unicode-range`.
- `--ma-font-mono` trỏ về Archivo: bỏ chữ mono khỏi nhãn/số/trạng thái; số dùng `font-variant-numeric: tabular-nums` (đặt ở `body`).

| Cấp | Token | Giá trị | Dùng cho |
|---|---|---|---|
| Số KPI | `--ma-text-hero` | 600 44/1.05, tracking −0.02em | Thực thu, Công nợ, Còn phải trả |
| Ô chỉ số | `--ma-text-meter` **MỚI** | 600 40/1.1 | MeterInput trên điện thoại |
| Số lớn | `--ma-text-figure-lg` | 600 32/1.1 | Thẻ nhỏ, gauge |
| Tiêu đề màn | `--ma-text-screen-title` | 600 28/1.2 | h1 |
| Số vừa | `--ma-text-figure` | 600 24/1.15 | |
| Tiêu đề thẻ | `--ma-text-block-title` | 600 20/1.3 | h2 trong card |
| Tên việc | `--ma-text-task-name` | 500 16/1.4 | dòng việc, tên phòng |
| Thân | `--ma-text-body` | 400 15/1.55 | |
| Thân nhỏ | `--ma-text-body-sm` | 400 14/1.5 | bảng, danh sách |
| Chú thích / nhãn hệ thống / badge | `--ma-text-caption`, `--ma-text-syslabel`, `--ma-text-badge` | 13px | meta, tag |
| Sàn cỡ chữ | `--ma-text-min-desktop` / `-mobile` | 12px / 13px | QA đo theo sàn này |

## 3. Khoảng cách, bo góc, độ nổi, focus

- **Spacing bậc 4/8:** `--ma-space-1…9` = 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48. Khe lưới `--ma-bento-gap` 16, đệm thẻ `--ma-bento-padding` 24. Tên cũ `--space-*` giữ, trỏ cùng giá trị.
- **Bo góc:** thẻ `--ma-radius-xl` 24 (theo mẫu) · khối trong thẻ `--ma-radius-md` 16 · nút/ô nhập `--ma-radius` 12 · tag/chip `--ma-radius-pill`.
- **Độ nổi:** `--ma-shadow`, `-xs`, `-sm`, `-bento`, `-hover` = `none` (thẻ nằm yên). `--ma-shadow-md` `0 8px 24px rgba(28,27,25,.10)` cho menu/toast/popover; `--ma-shadow-lg` `0 24px 48px rgba(28,27,25,.16)` cho modal.
- **Focus:** `--ma-focus-outline` **MỚI** `2px solid #0F766E` + `outline-offset: 2px` cho mọi phần tử bấm được (`:focus-visible`). Ô nhập/select: outline 2px sát viền + quầng `--ma-focus-halo`. Tương phản vòng focus 5,47:1 trên thẻ, 4,90:1 trên nền.
- **Cỡ điều khiển (MỚI, theo thang repo 36/44):** `--ma-control-h` 40 (desktop) · `--ma-control-h-sm` 36 (trong bảng, chip) · `--ma-control-h-touch` 48 (mobile) · `--ma-control-h-meter` 72. Sàn vùng chạm `--ma-hit-desktop` 36, `--ma-hit-mobile` 44.

## 4. Chuyển động

| Token | Thường | `prefers-reduced-motion` |
|---|---|---|
| `--ma-dur-press` (nhấn nút, scale .97) | 120ms | 0ms |
| `--ma-dur-fast` (hover, đổi màu) | 160ms | 120ms |
| `--ma-dur-normal` (switch, mở rộng) | 220ms | 120ms |
| `--ma-dur-dialog-in` / `-out` | 220 / 160ms | 120 / 0ms |
| `--ma-dur-toast-in` | 220ms | 120ms |
| `--ma-dur-row-flash` (hàng vừa lưu) | 600ms | 0ms |
| `--ma-dur-page` | 0ms (không diễn hoạt khi đổi trang) | 0ms |

Easing: `--ma-ease-out` = `cubic-bezier(.23,1,.32,1)` cho vào; `--ma-ease` cho đổi màu. Khi reduced-motion: modal đổi sang keyframe chỉ đổi độ mờ (`ma-fade-in`), không còn transform. Đã đo: 0 transition > 120ms khi bật reduced-motion (xem `QA.md`).

## 5. Lưới và breakpoint

- **Desktop 1440:** lề 16 · sidebar 256 (`--ma-nav-width`) · khe 16 · vùng nội dung 1136 = 12 cột × 80 + 11 × 16.
- **1024–1279:** sidebar thu gọn 72px (`--ma-nav-width-collapsed` **MỚI**), chỉ icon + chấm số.
- **< 768:** bỏ sidebar, dùng bottom-nav 64px (`--ma-bottom-nav-height` **MỚI**), tối đa 5 mục; lưới 4 cột, lề 16, khe 12.
- **Breakpoint dùng trong CSS:** 390 (khung thiết kế mobile) · 600 (sàn chạm 44) · 768 · 1024 · 1280 · 1440. Token cũ `--ma-bp-*` giữ nguyên.

## 6. Icon

Một bộ tự vẽ (`assets/icons.js`, bản sprite tĩnh `assets/icons.svg`): lưới 24, nét `--ma-icon-stroke` 1,75, đầu/khớp tròn, `currentColor`. Mỗi mục menu một icon riêng đúng nghĩa (sửa lỗi icon trùng/sai nghĩa ở app hiện tại). Không emoji. Icon trang trí `aria-hidden="true"`; nút chỉ có icon luôn có `aria-label`.

## 7. Component → lớp CSS

| Component | Lớp | Trạng thái có trong `design-system.html` |
|---|---|---|
| Button 4 biến thể | `.btn-primary/-secondary/-ghost/-danger`, cỡ `.btn-sm` 36 / mặc định 40 / `.btn-touch` 48 | default, hover, focus, active, disabled (`aria-disabled` để vẫn focus được), loading, error |
| Icon button | `.icon-btn` (`.boxed`, `.touch`, `.sm`) | có `aria-label` |
| Input / Select / tìm kiếm | `.input`, `.select`, `.input-wrap` | default, hover, focus, disabled + help, error (`aria-invalid` + `.error-text` ngay dưới) |
| MeterInput + bàn phím số | `.meter-input`, `.unit-tag`, `.keypad .key` | bình thường, bất thường (tiêu thụ ≥ 1,5 × TB 3 kỳ) |
| Checkbox / Switch | `.check`, `.switch` | chưa chọn, chọn, một phần, tắt |
| StatusTag | `.tag-success/-warning/-danger/-info/-neutral/-brand` | luôn icon + chữ |
| Chip lọc | `.chip[aria-pressed]` | chọn, hover, focus, tắt, chip amber chỉ báo |
| Card / KPI / thẻ nhỏ | `.card`, `.kpi-value`, `.mini-*` | + skeleton đang tải |
| Gauge | `.gauge` (SVG cung 180°) | `role="img"` + nhãn |
| Biểu đồ vùng / cột / thanh ngang | `svg.chart`, `.hbars` | SVG tự dựng, không thư viện; mobile cuộn ngang trong thẻ |
| Table | `.table`, `.th-sort[aria-sort]`, `.table-toolbar`, `.pager`, `.bulkbar` | sort, lọc, phân trang, hover, hàng chọn |
| List-row | `.list-row` + `.avatar` + `.acts` | hover, chọn, hành động hiện khi hover |
| Sidebar | `.sidebar` (`.is-collapsed`), dựng bởi `assets/shell.js` theo `roleNavigation.ts` | đủ, thu gọn |
| Bottom-nav | `.bottom-nav` | ≤ 5 mục, số đếm |
| TopBar / Breadcrumb / Tabs / Segmented | `.topbar`, `.crumbs`, `.tabs`, `.seg` | |
| Modal / ConfirmDialog | `.scrim .modal[role=alertdialog]` | |
| Toast | `.toast` (`.error`) | có nút Hoàn tác/Thử lại |
| Banner | `.banner-info/-warning/-danger/-success` | |
| Empty / Skeleton / Error / Permission-denied | `.empty`, `.skel` | |

## 8. Cách áp vào app sau khi duyệt (chưa làm)

1. Chép `assets/tokens.css` thành `frontend/src/tokens/overlay-ui-redesign.css`, sửa đường dẫn font, chép 8 file woff2 mới (thay bộ woff2 thiếu glyph Việt).
2. Thêm `@import './overlay-ui-redesign.css';` cuối `frontend/src/tokens/index.css`.
3. Đã thử đúng các bước này trên bản chép (`tools/run-repo-guard.sh`): 38/38 file test, 252/252 test qua; `tsc -b && vite build` qua. Xem `QA.md` §6.
4. Token chỉ đổi màu/cỡ; bố cục mới (bảng hợp đồng, bottom-nav, dashboard) cần sửa component — làm sau, theo `screen-inventory.md`.

## 9. Bảng ánh xạ đầy đủ (sinh tự động)

Sinh bằng script so `frontend/src/tokens/*.css` (working copy, gồm cả thay đổi chưa commit từ 16/11) với `assets/tokens.css`. Overlay phủ **toàn bộ** token cũ; token **MỚI** được đánh dấu trong `tokens.css`.

| Token | File cũ | Giá trị cũ | Giá trị overlay | Ghi chú |
|---|---|---|---|---|
| `--ma-paper-0` | colors.css | `#FFFFFF` | `#FFFFFF` | giữ nguyên |
| `--ma-paper-1` | colors.css | `#F9F7F6` | `#F9F7F6` | giữ nguyên |
| `--ma-paper-2` | colors.css | `#F8FAFC` | `#F7F5F2` | đổi |
| `--ma-paper-3` | colors.css | `#F1F5F9` | `#EFECE7` | đổi |
| `--ma-bg-page` | colors.css | `#F8FAFC` | `#F4F2EE` | đổi |
| `--ma-bg-card` | colors.css | `#FFFFFF` | `#FFFFFF` | giữ nguyên |
| `--ma-bg-card-hover` | colors.css | `#FFFFFF` | `#FFFFFF` | giữ nguyên |
| `--ma-bg-nav` | colors.css | `#FFFFFF` | `#FFFFFF` | giữ nguyên |
| `--ma-bg-sunken` | colors.css | `#F1F5F9` | `#F7F5F2` | đổi |
| `--ma-bg-nav-active` | colors.css | `#F0FDFA` | `#E6F2F0` | đổi |
| `--ma-bg-inverse` | colors.css | `#0F172A` | `#1C1B19` | đổi |
| `--ma-bg-row-selected` | — | — | `#EEF6F4` | MỚI |
| `--ma-bg-glass` | colors.css | `rgba(255, 255, 255, 0.88)` | `#FFFFFF` | đổi |
| `--ma-bg-glass-subtle` | colors.css | `rgba(248, 250, 252, 0.82)` | `#F7F5F2` | đổi |
| `--ma-bg-glass-overlay` | colors.css | `rgba(15, 23, 42, 0.45)` | `rgba(28, 27, 25, 0.45)` | đổi |
| `--ma-backdrop-blur` | colors.css | `12px` | `0px` | đổi |
| `--ma-backdrop-blur-sm` | colors.css | `8px` | `0px` | đổi |
| `--ma-gradient-subtle` | colors.css | `linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(37, 99, 235, 0.03) 100%)` | `#F4F2EE` | đổi |
| `--ma-gradient-brand` | colors.css | `linear-gradient(135deg, #0F766E 0%, #0D9488 100%)` | `#0F766E` | đổi |
| `--ma-brand-primary` | colors.css | `#0F172A` | `#0F766E` | đổi |
| `--ma-brand-primary-hover` | colors.css | `#1E293B` | `#115E59` | đổi |
| `--ma-brand-accent` | colors.css | `#0D9488` | `#0F766E` | đổi |
| `--ma-brand-accent-hover` | colors.css | `#0F766E` | `#115E59` | đổi |
| `--ma-brand-accent-light` | colors.css | `#F0FDFA` | `#E6F2F0` | đổi |
| `--ma-brand-accent-surface` | colors.css | `rgba(13, 148, 136, 0.08)` | `#E6F2F0` | đổi |
| `--ma-brand-blue` | colors.css | `#2563EB` | `#1E4FC2` | đổi |
| `--ma-brand-blue-hover` | colors.css | `#1D4ED8` | `#1A43A6` | đổi |
| `--ma-brand-blue-light` | colors.css | `#EFF6FF` | `#EAF0FC` | đổi |
| `--ma-accent-warm` | — | — | `#D97706` | MỚI |
| `--ma-accent-warm-text` | — | — | `#92400E` | MỚI |
| `--ma-accent-warm-tint` | — | — | `#FDF1DC` | MỚI |
| `--ma-ink-900` | colors.css | `#0F172A` | `#1C1B19` | đổi |
| `--ma-ink-600` | colors.css | `#475569` | `#57534E` | đổi |
| `--ma-ink-500` | colors.css | `#64748B` | `#6B655F` | đổi |
| `--ma-ink-400` | colors.css | `#94A3B8` | `#8E8880` | đổi |
| `--ma-ink-300` | colors.css | `#CBD5E1` | `#D6D2CB` | đổi |
| `--ma-ink-screen-title` | colors.css | `#0F766E` | `#1C1B19` | đổi |
| `--ma-text-primary` | colors.css | `#0F172A` | `#1C1B19` | đổi |
| `--ma-text-secondary` | colors.css | `#475569` | `#57534E` | đổi |
| `--ma-text-muted` | colors.css | `#64748B` | `#6B655F` | đổi |
| `--ma-text-disabled` | colors.css | `#94A3B8` | `#8E8880` | đổi |
| `--ma-text-on-inverse` | colors.css | `#FFFFFF` | `#FFFFFF` | giữ nguyên |
| `--ma-text-secondary-on-inverse` | colors.css | `#94A3B8` | `#D6D2CB` | đổi |
| `--ma-text-link` | — | — | `#0F766E` | MỚI |
| `--ma-line-100` | colors.css | `#F1F5F9` | `#F1EEE9` | đổi |
| `--ma-line-200` | colors.css | `#E2E8F0` | `#E7E3DD` | đổi |
| `--ma-line-300` | colors.css | `#CBD5E1` | `#D6D2CB` | đổi |
| `--ma-line-600` | colors.css | `#94A3B8` | `#8E8880` | đổi |
| `--ma-border-default` | colors.css | `#E2E8F0` | `#E7E3DD` | đổi |
| `--ma-border-subtle` | colors.css | `#F1F5F9` | `#F1EEE9` | đổi |
| `--ma-border-dashed` | colors.css | `#CBD5E1` | `#D6D2CB` | đổi |
| `--ma-border-strong` | colors.css | `#94A3B8` | `#8E8880` | đổi |
| `--ma-border-inverse` | colors.css | `#334155` | `#3A3834` | đổi |
| `--ma-red-600` | colors.css | `#DC2626` | `#B42318` | đổi |
| `--ma-red-100` | colors.css | `#FEF2F2` | `#FDECEA` | đổi |
| `--ma-red-border` | colors.css | `#FECACA` | `#F6C9C4` | đổi |
| `--ma-amber-600` | colors.css | `#D97706` | `#92400E` | đổi |
| `--ma-amber-500` | colors.css | `#F59E0B` | `#D97706` | đổi |
| `--ma-amber-100` | colors.css | `#FFFBEB` | `#FDF1DC` | đổi |
| `--ma-amber-border` | colors.css | `#FDE68A` | `#F5D9A8` | đổi |
| `--ma-green-700` | colors.css | `#047857` | `#166534` | đổi |
| `--ma-green-600` | colors.css | `#059669` | `#15803D` | đổi |
| `--ma-green-100` | colors.css | `#ECFDF5` | `#E7F5EC` | đổi |
| `--ma-green-border` | colors.css | `#A7F3D0` | `#BFE3CB` | đổi |
| `--ma-urgent` | colors.css | `var(--ma-red-600)` | `var(--ma-red-600)` | giữ nguyên |
| `--ma-urgent-bg` | colors.css | `var(--ma-red-100)` | `var(--ma-red-100)` | giữ nguyên |
| `--ma-urgent-border` | colors.css | `var(--ma-red-border)` | `var(--ma-red-border)` | giữ nguyên |
| `--ma-waiting` | colors.css | `var(--ma-amber-600)` | `var(--ma-amber-600)` | giữ nguyên |
| `--ma-waiting-border` | colors.css | `var(--ma-amber-500)` | `var(--ma-amber-500)` | giữ nguyên |
| `--ma-waiting-bg` | colors.css | `var(--ma-amber-100)` | `var(--ma-amber-100)` | giữ nguyên |
| `--ma-waiting-border-subtle` | colors.css | `var(--ma-amber-border)` | `var(--ma-amber-border)` | giữ nguyên |
| `--ma-done` | colors.css | `var(--ma-green-600)` | `var(--ma-green-600)` | giữ nguyên |
| `--ma-done-bg` | colors.css | `var(--ma-green-100)` | `var(--ma-green-100)` | giữ nguyên |
| `--ma-done-text` | colors.css | `var(--ma-green-700)` | `var(--ma-green-700)` | giữ nguyên |
| `--ma-done-border` | colors.css | `var(--ma-green-border)` | `var(--ma-green-border)` | giữ nguyên |
| `--ma-vacant` | colors.css | `var(--ma-brand-accent)` | `var(--ma-brand-accent)` | giữ nguyên |
| `--ma-status-urgent` | colors.css | `var(--ma-urgent)` | `var(--ma-urgent)` | giữ nguyên |
| `--ma-status-urgent-light` | colors.css | `var(--ma-urgent-bg)` | `var(--ma-urgent-bg)` | giữ nguyên |
| `--ma-status-urgent-border` | colors.css | `var(--ma-urgent-border)` | `var(--ma-urgent-border)` | giữ nguyên |
| `--ma-status-done` | colors.css | `var(--ma-done)` | `var(--ma-done-text)` | đổi |
| `--ma-status-done-light` | colors.css | `var(--ma-done-bg)` | `var(--ma-done-bg)` | giữ nguyên |
| `--ma-status-done-border` | colors.css | `var(--ma-done-border)` | `var(--ma-done-border)` | giữ nguyên |
| `--ma-status-error` | colors.css | `var(--ma-urgent)` | `var(--ma-urgent)` | giữ nguyên |
| `--ma-status-warning` | colors.css | `var(--ma-waiting)` | `var(--ma-waiting)` | giữ nguyên |
| `--ma-status-warning-light` | colors.css | `var(--ma-waiting-bg)` | `var(--ma-waiting-bg)` | giữ nguyên |
| `--ma-status-warning-border` | colors.css | `var(--ma-waiting-border-subtle)` | `var(--ma-waiting-border-subtle)` | giữ nguyên |
| `--ma-status-info` | colors.css | `var(--ma-brand-accent)` | `#1E4FC2` | đổi |
| `--ma-status-info-light` | colors.css | `var(--ma-brand-accent-light)` | `#EAF0FC` | đổi |
| `--ma-status-info-border` | colors.css | `#99F6E4` | `#C9D7F5` | đổi |
| `--ma-status-neutral` | — | — | `#57534E` | MỚI |
| `--ma-status-neutral-light` | — | — | `#EFECE7` | MỚI |
| `--ma-primary-default` | colors.css | `var(--ma-brand-primary)` | `var(--ma-brand-primary)` | giữ nguyên |
| `--ma-chart-1` | — | — | `#0D9488` | MỚI |
| `--ma-chart-1-fill` | — | — | `rgba(13, 148, 136, 0.14)` | MỚI |
| `--ma-chart-2` | — | — | `#D97706` | MỚI |
| `--ma-chart-2-fill` | — | — | `rgba(217, 119, 6, 0.14)` | MỚI |
| `--ma-chart-3` | — | — | `#8E8880` | MỚI |
| `--ma-chart-track` | — | — | `#EFECE7` | MỚI |
| `--ma-chart-grid` | — | — | `#ECE8E2` | MỚI |
| `--ma-focus-ring` | colors.css | `var(--ma-brand-accent)` | `#0F766E` | đổi |
| `--ma-focus-halo` | colors.css | `rgba(13, 148, 136, 0.2)` | `rgba(15, 118, 110, 0.18)` | đổi |
| `--ma-focus-outline` | — | — | `2px solid #0F766E` | MỚI |
| `--ma-font-ui` | typography.css | `"Archivo", system-ui, -apple-system, "Segoe UI", sans-serif` | `"Archivo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | đổi |
| `--ma-font-mono` | typography.css | `"IBM Plex Mono", ui-monospace, "SFMono-Regular", monospace` | `"Archivo", system-ui, -apple-system, "Segoe UI", sans-serif` | đổi |
| `--ma-text-hero` | typography.css | `800 clamp(28px, 4vw, 36px)/1.15 var(--ma-font-ui)` | `600 44px/1.05 var(--ma-font-ui)` | đổi |
| `--ma-text-screen-title` | typography.css | `700 24px/1.15 var(--ma-font-ui)` | `600 28px/1.2 var(--ma-font-ui)` | đổi |
| `--ma-text-block-title` | typography.css | `700 17px/1.25 var(--ma-font-ui)` | `600 20px/1.3 var(--ma-font-ui)` | đổi |
| `--ma-text-task-name` | typography.css | `600 15.5px/1.35 var(--ma-font-ui)` | `500 16px/1.4 var(--ma-font-ui)` | đổi |
| `--ma-text-body` | typography.css | `400 14.5px/1.5 var(--ma-font-ui)` | `400 15px/1.55 var(--ma-font-ui)` | đổi |
| `--ma-text-body-sm` | typography.css | `400 13px/1.5 var(--ma-font-ui)` | `400 14px/1.5 var(--ma-font-ui)` | đổi |
| `--ma-text-caption` | typography.css | `400 12.5px/1.5 var(--ma-font-ui)` | `400 13px/1.45 var(--ma-font-ui)` | đổi |
| `--ma-text-figure` | typography.css | `600 19px/1.1 var(--ma-font-mono)` | `600 24px/1.15 var(--ma-font-ui)` | đổi |
| `--ma-text-figure-sm` | typography.css | `600 16px/1.15 var(--ma-font-mono)` | `600 16px/1.3 var(--ma-font-ui)` | đổi |
| `--ma-text-figure-lg` | typography.css | `700 clamp(24px, 3.5vw, 32px)/1.08 var(--ma-font-mono)` | `600 32px/1.1 var(--ma-font-ui)` | đổi |
| `--ma-text-room-no` | typography.css | `600 15px/1.1 var(--ma-font-mono)` | `600 16px/1.2 var(--ma-font-ui)` | đổi |
| `--ma-text-syslabel` | typography.css | `700 10.5px/1.3 var(--ma-font-mono)` | `500 13px/1.4 var(--ma-font-ui)` | đổi |
| `--ma-text-badge` | typography.css | `600 11.5px/1.2 var(--ma-font-mono)` | `500 13px/1.2 var(--ma-font-ui)` | đổi |
| `--ma-text-meter` | — | — | `600 40px/1.1 var(--ma-font-ui)` | MỚI |
| `--ma-tracking-title` | typography.css | `-0.03em` | `-0.015em` | đổi |
| `--ma-tracking-block` | typography.css | `-0.02em` | `-0.01em` | đổi |
| `--ma-tracking-figure` | typography.css | `-0.02em` | `-0.02em` | giữ nguyên |
| `--ma-tracking-syslabel` | typography.css | `0.11em` | `0` | đổi |
| `--ma-tracking-navgroup` | typography.css | `0.14em` | `0` | đổi |
| `--ma-text-min-desktop` | typography.css | `11px` | `12px` | đổi |
| `--ma-text-min-mobile` | typography.css | `13px` | `13px` | giữ nguyên |
| `--ma-space-1` | spacing.css | `4px` | `4px` | giữ nguyên |
| `--ma-space-2` | spacing.css | `6px` | `8px` | đổi |
| `--ma-space-3` | spacing.css | `9px` | `12px` | đổi |
| `--ma-space-4` | spacing.css | `12px` | `16px` | đổi |
| `--ma-space-5` | spacing.css | `14px` | `20px` | đổi |
| `--ma-space-6` | spacing.css | `18px` | `24px` | đổi |
| `--ma-space-7` | spacing.css | `24px` | `32px` | đổi |
| `--ma-space-8` | spacing.css | `30px` | `40px` | đổi |
| `--ma-space-9` | spacing.css | `48px` | `48px` | giữ nguyên |
| `--space-xs` | spacing.css | `4px` | `4px` | giữ nguyên |
| `--space-sm` | spacing.css | `8px` | `8px` | giữ nguyên |
| `--space-md` | spacing.css | `16px` | `16px` | giữ nguyên |
| `--space-lg` | spacing.css | `24px` | `24px` | giữ nguyên |
| `--space-xl` | spacing.css | `32px` | `32px` | giữ nguyên |
| `--space-2xl` | spacing.css | `48px` | `48px` | giữ nguyên |
| `--space-3xl` | spacing.css | `64px` | `64px` | giữ nguyên |
| `--ma-bento-gap` | spacing.css | `16px` | `16px` | giữ nguyên |
| `--ma-bento-gap-lg` | spacing.css | `20px` | `24px` | đổi |
| `--ma-bento-padding` | spacing.css | `clamp(16px, 2.5vw, 24px)` | `24px` | đổi |
| `--ma-nav-width` | spacing.css | `230px` | `256px` | đổi |
| `--ma-nav-width-collapsed` | — | — | `72px` | MỚI |
| `--ma-topbar-height` | spacing.css | `60px` | `64px` | đổi |
| `--ma-breadcrumb-height` | spacing.css | `32px` | `32px` | giữ nguyên |
| `--ma-task-column-width` | spacing.css | `486px` | `486px` | giữ nguyên |
| `--ma-bottom-nav-height` | — | — | `64px` | MỚI |
| `--ma-hit-desktop` | spacing.css | `36px` | `36px` | giữ nguyên |
| `--ma-hit-mobile` | spacing.css | `44px` | `44px` | giữ nguyên |
| `--ma-control-h` | — | — | `40px` | MỚI |
| `--ma-control-h-sm` | — | — | `36px` | MỚI |
| `--ma-control-h-touch` | — | — | `48px` | MỚI |
| `--ma-control-h-meter` | — | — | `72px` | MỚI |
| `--ma-bp-desktop` | spacing.css | `1280px` | `1280px` | giữ nguyên |
| `--ma-bp-tablet` | spacing.css | `768px` | `768px` | giữ nguyên |
| `--ma-bp-mobile` | spacing.css | `360px` | `360px` | giữ nguyên |
| `--ma-radius-xs` | borders.css | `4px` | `6px` | đổi |
| `--ma-radius-sm` | borders.css | `8px` | `8px` | giữ nguyên |
| `--ma-radius` | borders.css | `12px` | `12px` | giữ nguyên |
| `--ma-radius-md` | borders.css | `14px` | `16px` | đổi |
| `--ma-radius-lg` | borders.css | `18px` | `20px` | đổi |
| `--ma-radius-xl` | borders.css | `24px` | `24px` | giữ nguyên |
| `--ma-radius-pill` | borders.css | `9999px` | `9999px` | giữ nguyên |
| `--ma-border-width` | borders.css | `1px` | `1px` | giữ nguyên |
| `--ma-border-width-strong` | borders.css | `1.5px` | `1.5px` | giữ nguyên |
| `--ma-border-width-rule` | borders.css | `2px` | `1px` | đổi |
| `--ma-icon-stroke` | borders.css | `1.8px` | `1.75px` | đổi |
| `--ma-icon-size` | borders.css | `16px` | `20px` | đổi |
| `--ma-icon-viewbox` | borders.css | `16` | `24` | đổi |
| `--ma-flag-inset` | borders.css | `inset 0 -3px 0` | `inset 0 -3px 0` | giữ nguyên |
| `--ma-nav-active-inset` | borders.css | `inset 3px 0 0` | `none` | đổi |
| `--ma-shadow-xs` | borders.css | `0 1px 2px 0 rgba(15, 23, 42, 0.04)` | `none` | đổi |
| `--ma-shadow-sm` | borders.css | `0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)` | `none` | đổi |
| `--ma-shadow` | borders.css | `0 4px 12px -2px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04)` | `none` | đổi |
| `--ma-shadow-md` | borders.css | `0 10px 20px -3px rgba(15, 23, 42, 0.08), 0 4px 8px -4px rgba(15, 23, 42, 0.04)` | `0 8px 24px rgba(28, 27, 25, 0.10)` | đổi |
| `--ma-shadow-lg` | borders.css | `0 20px 25px -5px rgba(15, 23, 42, 0.09), 0 8px 10px -6px rgba(15, 23, 42, 0.04)` | `0 24px 48px rgba(28, 27, 25, 0.16)` | đổi |
| `--ma-shadow-xl` | borders.css | `0 25px 50px -12px rgba(15, 23, 42, 0.15)` | `0 24px 48px rgba(28, 27, 25, 0.16)` | đổi |
| `--ma-shadow-hover` | borders.css | `0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 6px 12px -4px rgba(15, 23, 42, 0.05)` | `none` | đổi |
| `--ma-shadow-focus` | borders.css | `0 0 0 3px rgba(13, 148, 136, 0.25)` | `0 0 0 3px rgba(15, 118, 110, 0.18)` | đổi |
| `--ma-shadow-frame` | borders.css | `0 12px 32px rgba(15, 23, 42, 0.12)` | `none` | đổi |
| `--ma-shadow-bento` | borders.css | `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(15, 23, 42, 0.05)` | `none` | đổi |
| `--ma-shadow-bento-hover` | borders.css | `0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(13, 148, 136, 0.25)` | `none` | đổi |
| `--ma-shadow-glass` | borders.css | `0 8px 32px 0 rgba(15, 23, 42, 0.08)` | `none` | đổi |
| `--ma-dur-press` | motion.css | `100ms` | `120ms` | đổi |
| `--ma-dur-fast` | motion.css | `150ms` | `160ms` | đổi |
| `--ma-dur-normal` | motion.css | `220ms` | `220ms` | giữ nguyên |
| `--ma-dur-slow` | motion.css | `350ms` | `300ms` | đổi |
| `--ma-dur-inline-error` | motion.css | `150ms` | `160ms` | đổi |
| `--ma-dur-dialog-in` | motion.css | `220ms` | `220ms` | giữ nguyên |
| `--ma-dur-dialog-out` | motion.css | `160ms` | `160ms` | giữ nguyên |
| `--ma-dur-page` | motion.css | `180ms` | `0ms` | đổi |
| `--ma-dur-row-flash` | motion.css | `400ms` | `600ms` | đổi |
| `--ma-dur-toast-in` | motion.css | `220ms` | `220ms` | giữ nguyên |
| `--ma-toast-life` | motion.css | `4s` | `4s` | giữ nguyên |
| `--ma-toast-life-undo` | motion.css | `9s` | `9s` | giữ nguyên |
| `--ma-ease` | motion.css | `linear` | `ease` | đổi |
| `--ma-ease-spring` | motion.css | `cubic-bezier(0.16, 1, 0.3, 1)` | `cubic-bezier(0.23, 1, 0.32, 1)` | đổi |
| `--ma-ease-out` | motion.css | `cubic-bezier(0, 0, 0.2, 1)` | `cubic-bezier(0.23, 1, 0.32, 1)` | đổi |
| `--ma-ease-in-out` | motion.css | `cubic-bezier(0.4, 0, 0.2, 1)` | `cubic-bezier(0.77, 0, 0.175, 1)` | đổi |
| `--ma-transition-subtle` | motion.css | `all var(--ma-dur-fast) var(--ma-ease-out)` | `background-color var(--ma-dur-fast) var(--ma-ease), color var(--ma-dur-fast) var(--ma-ease), border-color var(--ma-dur-fast) var(--ma-ease)` | đổi |
| `--ma-transition-smooth` | motion.css | `all var(--ma-dur-normal) var(--ma-ease-spring)` | `transform var(--ma-dur-normal) var(--ma-ease-out), opacity var(--ma-dur-normal) var(--ma-ease-out)` | đổi |

Tổng: 204 token trong overlay · 22 MỚI · 122 đổi giá trị · 60 giữ nguyên · token cũ không có trong overlay: 0.
