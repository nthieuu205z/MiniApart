# Đưa màn khung UX v2 vào Figma

Cách làm giống `../../figma/IMPORT.md` (skill `html-mockup-figma-svg-qa`). Mỗi màn khung là một file SVG thuần, sinh bằng `../../tools/dom2svg.js` từ bản xem trước (`tools/shoot.mjs`):
- Chữ là `<text>` sửa được.
- Hình là `<rect>`/`<path>`, icon là `<g>` có `data-name`.
- Không có `<foreignObject>` (đã đếm: 0/20 file), không có ảnh raster nhúng.
- Font Archivo khai `@font-face` trong `<defs>`, trỏ tới `../../assets/fonts/`.

Bản xem trước chưa được import vào Figma.

| File | Khung | `<text>` | Ảnh nhúng | Dung lượng | Lệch pixel so với PNG |
|---|---|---|---|---|---|
| `01-chu-hom-nay-1440.svg` | 1440 × 1397 | 133 | 0 | 42 KB | 1,12 % |
| `02-chu-tim-nhanh-1440.svg` | 1440 × 1397 | 184 | 0 | 55 KB | 1,54 % |
| `03-chu-chon-toa-1440.svg` | 1440 × 1397 | 144 | 0 | 45 KB | 1,66 % |
| `04-chu-thu-tien-1440.svg` | 1440 × 1184 | 151 | 0 | 53 KB | 0,56 % |
| `05-chu-thu-tien-chon-1440.svg` | 1440 × 1000 | 125 | 0 | 44 KB | 0,47 % |
| `06-chu-nguoi-thue-360-1440.svg` | 1440 × 1537 | 143 | 0 | 39 KB | 0,98 % |
| `07-chu-phong-360-1440.svg` | 1440 × 1089 | 89 | 0 | 28 KB | 0,88 % |
| `08-chu-hop-dong-360-1440.svg` | 1440 × 1026 | 86 | 0 | 27 KB | 0,49 % |
| `09-chu-toa-360-1440.svg` | 1440 × 909 | 92 | 0 | 27 KB | 1,14 % |
| `10-ql-hom-nay-1440.svg` | 1440 × 900 | 99 | 0 | 28 KB | 1,07 % |
| `11-ql-thong-bao-1440.svg` | 1440 × 900 | 118 | 0 | 31 KB | 1,28 % |
| `12-ql-chu-ky-1440.svg` | 1440 × 1030 | 126 | 0 | 36 KB | 0,86 % |
| `13-ql-su-co-1440.svg` | 1440 × 907 | 107 | 0 | 32 KB | 1,39 % |
| `14-ql-tao-hop-dong-1440.svg` | 1440 × 900 | 77 | 0 | 23 KB | 0,82 % |
| `15-chu-khong-co-quyen-1440.svg` | 1440 × 900 | 33 | 0 | 14 KB | 0,26 % |
| `16-chu-trang-thai-1440.svg` | 1440 × 900 | 39 | 0 | 18 KB | 0,33 % |
| `20-tho-viec-390.svg` | 390 × 1186 | 48 | 0 | 17 KB | 1,88 % |
| `21-khach-can-tra-390.svg` | 390 × 1208 | 48 | 0 | 14 KB | 1,53 % |
| `22-khach-tra-tien-390.svg` | 390 × 844 | 23 | 0 | 9 KB | 1,39 % |
| `23-ql-ghi-chi-so-390.svg` | 390 × 844 | 18 | 0 | 9 KB | 1,10 % |

**Cách đo độ lệch:**
1. `node tools/svg-render.mjs <thư mục tạm>` render lại từng SVG bằng Edge.
2. `python tools/compare.py --svg <thư mục tạm>` so pixel ở mức xám với PNG chụp từ HTML. Một pixel tính là lệch khi khác nhau > 40/255.

Kết quả là **0,26 % – 1,88 %**, nằm trong khoảng của bộ v1 (0,42 – 2,05 %). Phần lệch chủ yếu do khử răng cưa chữ và bóng đổ bị bỏ. Số liệu đầy đủ ở `tools/svg-diff.json`.

Các ảnh 24–27 (Chủ trên 390/1180, menu điện thoại) chỉ dùng để kiểm bố cục co giãn, nên không xuất SVG.

## Bước import
1. Cài font Archivo 400/500/600/700 trên máy, bản Google Fonts có đủ dấu tiếng Việt. Không dùng file woff2 subset trong `assets/fonts`.
2. Trong file Figma đích (`../../FIGMA.md`), tạo Page `UX v2 · bản xem trước`.
3. Kéo-thả các file `.svg`; mỗi file thành một Frame, đặt tên Frame theo tên file.
4. Kiểm nhanh: bấm vào một dòng chữ, nó phải là text layer Archivo. Nếu Figma báo thiếu font, chọn *Replace fonts*.
5. Gắn Variables/Text styles theo bảng token trong `../../figma/IMPORT.md` §Token → Figma Variables. UX v2 **không thêm token mới**; mọi lớp CSS mới nằm trong `prototype/ux.css` và được đánh dấu "MỚI".

## Chỗ SVG mất độ trung thực (biết trước)
| Mất gì | Ở đâu | Cách bù trong Figma |
|---|---|---|
| Bóng đổ của popover, bảng lệnh, ngăn menu | `02` (Ctrl+K), `03` (chọn toà), `11` (thông báo) | Gán Effect `Shadow lg` |
| Lớp phủ sau bảng lệnh xuất được (`cmdk-wrap`, `#1C1B19` 45 %), nhưng hiệu ứng làm mờ nền (nếu có) thì không | `02`, `03` | Thêm Background blur nếu cần |
| Chữ không tự xuống dòng, toạ độ tuyệt đối | mọi màn | Gộp thành text box khi dựng component |
| Không có Auto Layout | mọi màn | Dựng lại theo spacing token khi làm component |
| Trạng thái hover/focus | — | Xem `00-design-system.svg` của v1 |
