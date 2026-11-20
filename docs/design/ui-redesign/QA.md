# QA — số đo thật

Đo ngày 21/11/2026 bằng Edge headless qua CDP (`tools/cdp-run.mjs batch`), probe `tools/qa-probe.js` và `tools/focus-motion-probe.js`; tương phản cặp token bằng `tools/contrast.py`. File này sinh bằng `tools/build-qa-md.py` từ kết quả đo, không chép tay. Desktop đo ở 1440×900, mobile 390×844 (giả lập thiết bị di động, DPR 1).

Ngưỡng: vùng chạm ≥ 44px khi bề rộng < 600px, ≥ 36px desktop (liên kết nằm trong đoạn văn được miễn theo WCAG 2.5.8); cỡ chữ ≥ 13px mobile / ≥ 12px desktop (chữ trong SVG biểu đồ tính theo hệ số scale thật; chữ `::after` của badge cũng đo); tương phản chữ ≥ 4,5:1 (chữ lớn ≥ 3:1), viền điều khiển/đồ hoạ ≥ 3:1.

## 1. Tổng hợp mỗi màn

| Màn | Khung | Cuộn ngang | Control | Dưới vùng chạm | Chữ dưới sàn | Thiếu tên truy cập | Ảnh thiếu alt | Font thật | Lỗi console |
|---|---|---|---|---|---|---|---|---|---|
| 01-dang-nhap | 1440×900 (cao 900) | 0 px | 6 | 0 | 0 | 0 | 0 | Archivo | 0 |
| 02-tim-phong | 1440×900 (cao 1684) | 0 px | 23 | 0 | 0 | 0 | 0 | Archivo | 0 |
| 03-dashboard-chu | 1440×900 (cao 1133) | 0 px | 31 | 0 | 0 | 0 | 0 | Archivo | 0 |
| 04-nhac-viec | 1440×900 (cao 900) | 0 px | 23 | 0 | 0 | 0 | 0 | Archivo | 0 |
| 05-hop-dong | 1440×900 (cao 1051) | 0 px | 72 | 0 | 0 | 0 | 0 | Archivo | 0 |
| 06-ghi-chi-so-mobile | 390×844 (cao 847) | 0 px | 24 | 0 | 0 | 0 | 0 | Archivo | 0 |
| 07-tho-cong-viec-mobile | 390×844 (cao 991) | 0 px | 14 | 0 | 0 | 0 | 0 | Archivo | 0 |
| 08-hoa-don-khach-mobile | 390×844 (cao 1428) | 0 px | 9 | 0 | 0 | 0 | 0 | Archivo | 0 |
| 09-tai-khoan-qtht | 1440×900 (cao 900) | 0 px | 40 | 0 | 0 | 0 | 0 | Archivo | 0 |
| 00-design-system | 1440×900 (cao 8163) | 0 px | 154 | 0 | 0 | 0 | 0 | Archivo | 0 |

## 2. Tương phản

### 2a. Đo trên DOM thật (màu chữ tính toán so với nền đặc gần nhất)

| Màn | Số node chữ đã đo | Tỷ lệ thấp nhất | Dưới ngưỡng |
|---|---|---|---|
| 01-dang-nhap | 14 | 5,47:1 | 0 |
| 02-tim-phong | 84 | 4,9:1 | 0 |
| 03-dashboard-chu | 125 | 5,02:1 | 0 |
| 04-nhac-viec | 92 | 5,28:1 | 0 |
| 05-hop-dong | 157 | 4,98:1 | 0 |
| 06-ghi-chi-so-mobile | 37 | 5,14:1 | 0 |
| 07-tho-cong-viec-mobile | 38 | 5,14:1 | 0 |
| 08-hoa-don-khach-mobile | 53 | 5,03:1 | 0 |
| 09-tai-khoan-qtht | 99 | 4,98:1 | 0 |
| 00-design-system | 467 | 4,78:1 | 0 |

Tổng 1166 node chữ, thấp nhất 4,78:1 (chữ link teal trên brand tint). Bỏ qua: chữ nằm trên ảnh/gradient, nút đang tắt/đang tải, chữ trong icon. **Chưa kiểm** chữ phủ trên ảnh phòng (01, 02) — các nhãn đó đặt trong thẻ nền đặc nên rủi ro thấp.

### 2b. Cặp token (`tools/contrast.py`)

| Cặp | Chữ/hình | Nền | Tỷ lệ đo | Ngưỡng | Kết quả |
|---|---|---|---|---|---|
| ink trên card | `#1C1B19` | `#FFFFFF` | 17.21:1 | 4.5:1 | Đạt |
| ink trên nền trang | `#1C1B19` | `#F4F2EE` | 15.39:1 | 4.5:1 | Đạt |
| ink-2 trên card | `#57534E` | `#FFFFFF` | 7.63:1 | 4.5:1 | Đạt |
| ink-2 trên nền trang | `#57534E` | `#F4F2EE` | 6.82:1 | 4.5:1 | Đạt |
| ink-3 (meta, placeholder) trên card | `#6B655F` | `#FFFFFF` | 5.75:1 | 4.5:1 | Đạt |
| ink-3 trên nền trang | `#6B655F` | `#F4F2EE` | 5.14:1 | 4.5:1 | Đạt |
| ink-3 trên sunken | `#6B655F` | `#F7F5F2` | 5.28:1 | 4.5:1 | Đạt |
| chữ trắng trên brand (nút chính) | `#FFFFFF` | `#0F766E` | 5.47:1 | 4.5:1 | Đạt |
| chữ trắng trên brand-hover | `#FFFFFF` | `#115E59` | 7.58:1 | 4.5:1 | Đạt |
| brand-text (link) trên card | `#0F766E` | `#FFFFFF` | 5.47:1 | 4.5:1 | Đạt |
| brand-text trên nền trang | `#0F766E` | `#F4F2EE` | 4.90:1 | 4.5:1 | Đạt |
| brand-text trên brand-tint | `#0F766E` | `#E6F2F0` | 4.78:1 | 4.5:1 | Đạt |
| brand-ink trên brand-tint (nav chọn) | `#115E59` | `#E6F2F0` | 6.62:1 | 4.5:1 | Đạt |
| success-text trên success-tint | `#166534` | `#E7F5EC` | 6.34:1 | 4.5:1 | Đạt |
| warning-text trên warning-tint | `#92400E` | `#FDF1DC` | 6.34:1 | 4.5:1 | Đạt |
| danger-text trên danger-tint | `#B42318` | `#FDECEA` | 5.75:1 | 4.5:1 | Đạt |
| info-text trên info-tint | `#1E4FC2` | `#EAF0FC` | 6.22:1 | 4.5:1 | Đạt |
| neutral-text trên neutral-tint | `#57534E` | `#EFECE7` | 6.47:1 | 4.5:1 | Đạt |
| danger-text trên card (lỗi form) | `#B42318` | `#FFFFFF` | 6.57:1 | 4.5:1 | Đạt |
| amber-text trên card | `#92400E` | `#FFFFFF` | 7.09:1 | 4.5:1 | Đạt |
| amber-text trên amber-tint | `#92400E` | `#FDF1DC` | 6.34:1 | 4.5:1 | Đạt |
| chữ trắng trên danger (nút xoá) | `#FFFFFF` | `#B42318` | 6.57:1 | 4.5:1 | Đạt |
| viền ô nhập trên card (UI 3:1) | `#8E8880` | `#FFFFFF` | 3.51:1 | 3.0:1 | Đạt |
| viền ô nhập trên sunken | `#8E8880` | `#F7F5F2` | 3.23:1 | 3.0:1 | Đạt |
| focus ring trên card | `#0F766E` | `#FFFFFF` | 5.47:1 | 3.0:1 | Đạt |
| focus ring trên nền trang | `#0F766E` | `#F4F2EE` | 4.90:1 | 3.0:1 | Đạt |
| đồ hoạ teal chart trên card | `#0D9488` | `#FFFFFF` | 3.74:1 | 3.0:1 | Đạt |
| đồ hoạ amber chart trên card | `#D97706` | `#FFFFFF` | 3.19:1 | 3.0:1 | Đạt |
| đồ hoạ stone chart trên card | `#8E8880` | `#FFFFFF` | 3.51:1 | 3.0:1 | Đạt |
| đồ hoạ stone chart trên sunken | `#8E8880` | `#F7F5F2` | 3.23:1 | 3.0:1 | Đạt |
| chữ trắng trên toast (inverse) | `#FFFFFF` | `#1C1B19` | 17.21:1 | 4.5:1 | Đạt |
| nút hành động toast trên inverse | `#8FD3C8` | `#1C1B19` | 10.10:1 | 4.5:1 | Đạt |
| chữ trắng trên badge đỏ | `#FFFFFF` | `#B42318` | 6.57:1 | 4.5:1 | Đạt |
| ink-2 trên neutral tint (chip, tag) | `#57534E` | `#EFECE7` | 6.47:1 | 4.5:1 | Đạt |
| switch tắt (track) trên card | `#8E8880` | `#FFFFFF` | 3.51:1 | 3.0:1 | Đạt |

Tổng 35 cặp, trượt 0.

## 3. Cỡ chạm và không cuộn ngang ở 390

Màn desktop xem ở 390×844 (bố cục dồn 1 cột, sidebar → ẩn, topbar xuống dòng):

| Màn | Khung | Cuộn ngang | Dưới 44px | Chữ < 13px |
|---|---|---|---|---|
| 01-dang-nhap.html | 390×844 | 0 px | 0 | 0 |
| 02-tim-phong.html | 390×844 | 0 px | 0 | 0 |
| 03-dashboard-chu.html | 390×844 | 0 px | 0 | 0 |
| 04-nhac-viec.html | 390×844 | 0 px | 0 | 0 |
| 05-hop-dong.html | 390×844 | 0 px | 0 | 0 |
| 09-tai-khoan-qtht.html | 390×844 | 0 px | 0 | 0 |

Các màn mobile 06/07/08 đo ở 390 trong bảng §1. `design-system.html` ở 390: 0 px cuộn ngang, 0 control < 44px, 0 chữ < 13px. Biểu đồ trên điện thoại cuộn ngang **bên trong thẻ** (vùng `role="region"` có `tabindex="0"` để cuộn bằng bàn phím), trang không cuộn ngang.

## 4. Bàn phím / focus và reduced-motion

Probe focus lần lượt từng phần tử bấm được bằng `focus({focusVisible:true})` và kiểm có outline ≥ 2px (hoặc vòng box-shadow ≥ 2px). Probe chuyển động liệt kê animation đang chạy và transition > 120ms.

| Màn | Chế độ | Phần tử focus được | Thiếu vòng focus | Animation đang chạy | Transition > 120ms |
|---|---|---|---|---|---|
| 01-dang-nhap.html | thường | 6 | 0 | — | 4 |
| 01-dang-nhap.html | reduced-motion | 6 | 0 | — | 0 |
| 02-tim-phong.html | thường | 23 | 0 | — | 4 |
| 02-tim-phong.html | reduced-motion | 23 | 0 | — | 0 |
| 03-dashboard-chu.html | thường | 31 | 0 | — | 6 |
| 03-dashboard-chu.html | reduced-motion | 31 | 0 | — | 0 |
| 04-nhac-viec.html | thường | 23 | 0 | — | 7 |
| 04-nhac-viec.html | reduced-motion | 23 | 0 | — | 0 |
| 05-hop-dong.html | thường | 70 | 0 | — | 10 |
| 05-hop-dong.html | reduced-motion | 70 | 0 | — | 0 |
| 06-ghi-chi-so-mobile.html | thường | 24 | 0 | — | 4 |
| 06-ghi-chi-so-mobile.html | reduced-motion | 24 | 0 | — | 0 |
| 07-tho-cong-viec-mobile.html | thường | 14 | 0 | — | 3 |
| 07-tho-cong-viec-mobile.html | reduced-motion | 14 | 0 | — | 0 |
| 08-hoa-don-khach-mobile.html | thường | 9 | 0 | — | 3 |
| 08-hoa-don-khach-mobile.html | reduced-motion | 9 | 0 | — | 0 |
| 09-tai-khoan-qtht.html | thường | 39 | 0 | — | 8 |
| 09-tai-khoan-qtht.html | reduced-motion | 39 | 0 | — | 0 |
| design-system.html | thường | 147 | 0 | div.modal ma-dialog-in 0.22s | 17 |
| design-system.html | reduced-motion | 147 | 0 | div.modal ma-fade-in 0.12s | 0 |

Vòng focus đo được ở mọi màn: `solid 2px rgb(15, 118, 110)` (teal, 5,47:1 trên thẻ). Khi bật reduced-motion: 0 transition > 120ms, modal chỉ còn `ma-fade-in` (đổi độ mờ, không transform). Ở chế độ thường, transition hover 160ms là chủ ý.

**Chưa kiểm:** thứ tự Tab thực tế bằng phím (mới kiểm từng phần tử nhận focus và có vòng); bẫy focus trong modal (bản HTML tĩnh không có JS mở/đóng modal — component `ConfirmDialog` của repo đã có test riêng); trình đọc màn hình thật (NVDA/VoiceOver).

## 5. SVG cho Figma

Render lại từng SVG bằng Edge, so pixel với PNG chụp từ HTML (ngưỡng lệch > 40/255 mỗi kênh xám):

| File | Kích thước | `<text>` | Ảnh nhúng | foreignObject | Pixel lệch |
|---|---|---|---|---|---|
| figma/01-dang-nhap.svg | 173 KB | 19 | 1 | 0 | 0,52 % |
| figma/02-tim-phong.svg | 1436 KB | 94 | 9 | 0 | 0,42 % |
| figma/03-dashboard-chu.svg | 36 KB | 128 | 0 | 0 | 0,69 % |
| figma/04-nhac-viec.svg | 31 KB | 95 | 0 | 0 | 0,7 % |
| figma/05-hop-dong.svg | 52 KB | 154 | 0 | 0 | 0,88 % |
| figma/06-ghi-chi-so-mobile.svg | 13 KB | 38 | 0 | 0 | 1,29 % |
| figma/07-tho-cong-viec-mobile.svg | 15 KB | 39 | 0 | 0 | 1,15 % |
| figma/08-hoa-don-khach-mobile.svg | 18 KB | 55 | 0 | 0 | 2,05 % |
| figma/09-tai-khoan-qtht.svg | 32 KB | 97 | 0 | 0 | 0,68 % |
| figma/00-design-system.svg | 155 KB | 500 | 0 | 0 | 0,89 % |

Các file đều parse được bằng XML parser. Phần lệch chủ yếu là khử răng cưa chữ và bóng đổ bị bỏ (danh sách đầy đủ ở `figma/IMPORT.md`). **Chưa kiểm** import thật vào Figma (không có đăng nhập Figma trong phiên này).

## 6. Guard của repo (chạy trên bản chép, không sửa `frontend/`)

`bash docs/design/ui-redesign/tools/run-repo-guard.sh` — chép `frontend/` (kể cả node_modules) sang `$TMPDIR/ma-guard`, thêm `overlay-ui-redesign.css` (= `assets/tokens.css`) + 8 woff2 mới vào `src/tokens/`, `@import` cuối `index.css`, nối overlay vào cuối `typography.css` (vì `designTokens.test.ts` chỉ nạp `colors.css` + `typography.css` dạng raw), rồi chạy:

```text
Test Files  1 passed (1)
      Tests  1 passed (1)
 Test Files  38 passed (38)
      Tests  252 passed (252)
✓ built in 219ms
archivo-vietnamese-400-CQ9LHvVU.woff2
archivo-vietnamese-500-KzgY4ehc.woff2
archivo-vietnamese-600-WKrb2xyM.woff2
archivo-vietnamese-700-CTdTbJUo.woff2
```

Kết quả: `designTokens.test.ts` qua (giữ `--ma-paper-1 = #F9F7F6`, `--ma-font-ui` chứa Archivo); toàn bộ 38 file / 252 test qua; `tsc -b && vite build` qua và đóng gói đủ 4 file `archivo-vietnamese-*.woff2`. Lưu ý: bản chép lấy từ working copy, gồm cả các thay đổi **chưa commit** từ 16/11 trong `frontend/src` (không do phiên này).

Thang cỡ control của repo: repo không có token cỡ control; ràng buộc 36px desktop / 44px mobile lấy theo quy ước trong brief và đã đo ở §1, §3. Repo không có "skin" riêng; tương phản đo ở §2.

## 7. Bảng slop tự chấm

| Luật (brief §5) | Kết quả | Bằng chứng |
|---|---|---|
| Không font serif fallback ở số/tiêu đề | Đạt | `fontFamiliesUsed` = Archivo ở cả 10 trang; font Archivo 400–700 đã nạp (đo `document.fonts`) |
| Không hộp viền lồng hộp cùng độ nổi | Đạt | Thẻ không viền/không bóng; khối con dùng nền sunken; chỉ kẻ hàng 1px trong bảng/danh sách |
| Không hàng nhiều nút ngang hàng thiếu nút chính | Đạt | Số `.btn-primary` mỗi màn: 01–02, 04–09 = 1; 03 = 0 (dashboard chỉ đọc, không có hàng nút — hành động là liên kết "Xem công nợ"…) |
| Không thẻ số liệu trống | Đạt | Mọi KPI/thẻ nhỏ có số thật từ API demo; trạng thái rỗng có EmptyState riêng |
| Khung chi tiết không phải danh sách key/value trơn | Đạt | 08: dòng khoản có icon + diễn giải công thức + số thẳng cột; tổng nổi bật |
| Không gradient tím/xanh mặc định | Đạt | 0 `linear-gradient` trong CSS; chỉ 1 gradient teal mờ dưới biểu đồ vùng (SVG) |
| Không glassmorphism thừa | Đạt | 0 `backdrop-filter`; `--ma-backdrop-blur*` = 0px |
| Không emoji làm icon | Đạt | Quét 10 trang: 0 ký tự emoji; icon là SVG một bộ |
| Không bóng đổ lòe loẹt | Đạt | Chỉ 2 mức bóng cho menu/toast và modal |
| Mỗi màn chỉ một hành động chính | Đạt | Xem dòng 3 |
| Không chữ mono / IN HOA giãn cách | Đạt | 0 `uppercase`, 0 `monospace` trong CSS |
| Trạng thái không chỉ bằng màu | Đạt | Mọi `.tag` có icon + chữ; badge số có `aria-label` |
| Nhãn form luôn hiện, lỗi gần ô nhập | Đạt | 01, 06, design-system: `<label>` hiện, `.error-text` ngay dưới ô + `aria-invalid`/`aria-describedby` |

## 8. Chưa kiểm

- Import thật vào Figma (chỉ kiểm SVG bằng render trình duyệt + XML parser).
- Thiết bị thật (iPhone/Android), ánh sáng yếu ngoài hành lang, mạng yếu; chỉ giả lập 390×844 DPR 1.
- Thứ tự Tab bằng phím thật, bẫy focus modal, trình đọc màn hình.
- Khung 1024–1279 (sidebar thu gọn) chỉ có CSS + mẫu trong design-system, chưa chụp màn khung ở bề rộng này.
- Chế độ tối: không làm (ngoài phạm vi).
- Áp overlay vào app chạy thật và chụp lại các màn hiện có (mới chạy test + build trên bản chép).
