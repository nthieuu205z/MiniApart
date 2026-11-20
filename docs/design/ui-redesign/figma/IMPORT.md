# Đưa bộ design vào Figma

File Figma đích (do trợ lý chính tạo): xem `../FIGMA.md`. Mỗi màn khung có một file SVG thuần trong thư mục này; chữ là `<text>` (sửa được), hình là `<rect>/<line>/<path>`, ảnh phòng được nhúng sẵn (JPEG base64) — không có `<foreignObject>`, không rasterize.

| File | Khung | Chữ `<text>` | Ảnh nhúng | Ghi chú |
|---|---|---|---|---|
| `00-design-system.svg` | 1440 × 8163 | 500 | 0 | Toàn bộ trang hệ thiết kế (token + component + trạng thái) |
| `01-dang-nhap.svg` | 1440 × 900 | 19 | 1 | |
| `02-tim-phong.svg` | 1440 × 1684 | 94 | 9 | Nặng nhất (~1,4 MB vì 9 ảnh nhúng) |
| `03-dashboard-chu.svg` | 1440 × 1133 | 128 | 0 | |
| `04-nhac-viec.svg` | 1440 × 900 | 95 | 0 | |
| `05-hop-dong.svg` | 1440 × 1051 | 154 | 0 | |
| `06-ghi-chi-so-mobile.svg` | 390 × 847 | 38 | 0 | Bàn phím số (fixed) đặt ở đáy khung |
| `07-tho-cong-viec-mobile.svg` | 390 × 991 | 39 | 0 | Bottom-nav đặt ở đáy khung |
| `08-hoa-don-khach-mobile.svg` | 390 × 1428 | 55 | 0 | Bottom-nav đặt ở đáy khung |
| `09-tai-khoan-qtht.svg` | 1440 × 900 | 97 | 0 | Menu thao tác đang mở |

Độ trung thực đã đo: render lại từng SVG bằng Edge rồi so pixel với ảnh chụp HTML — phần pixel lệch > 40/255 là **0,42 % – 2,05 %** mỗi màn (chủ yếu do khử răng cưa chữ và bóng đổ bị bỏ). Bảng số đầy đủ trong `../QA.md` §5.

## Bước import

1. **Cài font trước** (nếu không Figma thay bằng font khác và chữ lệch dòng): cài Archivo 400/500/600/700 trên máy (bản Google Fonts / Omnibus-Type có đủ dấu tiếng Việt; file woff2 trong `../assets/fonts/` là bản cắt subset cho web, không cài được vào hệ điều hành). Với Figma trên trình duyệt cần bật Figma font helper.
2. Mở file Figma đích, tạo một Page tên `Tổng quan v1`.
3. Kéo-thả các file `.svg` vào canvas (hoặc *File → Place image…* rồi chọn SVG). Mỗi file thành một Frame; đặt tên Frame theo tên file.
4. Kiểm nhanh: bấm vào một dòng chữ → phải là text layer sửa được, font Archivo. Nếu thấy font "missing", cài font rồi *Replace fonts*.
5. Tên layer: hình nền có `data-name` (ví dụ `Thanh bên`, `Mã QR minh hoạ…`); Figma có thể bỏ thuộc tính này — tên chữ vẫn là nội dung chữ.

## Token → Figma Variables

Không có API/đăng nhập Figma trong phiên này nên chưa tạo Variables; làm tay (hoặc plugin nhập JSON) theo bảng:

| Collection | Biến | Lấy từ |
|---|---|---|
| `color/bg` | page, card, sunken, row-selected, nav-active, inverse | `--ma-bg-*` |
| `color/text` | primary, secondary, muted, link, on-inverse | `--ma-text-*` |
| `color/border` | default, subtle, strong | `--ma-border-*` |
| `color/brand` | primary, primary-hover, accent-light | `--ma-brand-*` |
| `color/accent` | warm, warm-text, warm-tint | `--ma-accent-warm*` |
| `color/status` | success/warning/danger/info/neutral × text, bg | `--ma-done-*`, `--ma-waiting*`, `--ma-urgent*`, `--ma-status-info*`, `--ma-status-neutral*` |
| `color/chart` | 1, 1-fill, 2, 2-fill, 3, track, grid | `--ma-chart-*` |
| `number/space` | 1…9 = 4…48 | `--ma-space-*` |
| `number/radius` | xs 6, sm 8, base 12, md 16, lg 20, xl 24, pill 9999 | `--ma-radius-*` |
| `number/control` | h 40, h-sm 36, h-touch 48, h-meter 72 | `--ma-control-h*` |
| Text styles | Hero 44/600, Screen title 28/600, Block title 20/600, Task 16/500, Body 15/400, Body-sm 14/400, Caption 13/400, Meter 40/600 | `--ma-text-*` |
| Effect styles | Shadow md `0 8 24 #1C1B19 10%`, Shadow lg `0 24 48 #1C1B19 16%` | `--ma-shadow-md/-lg` |

Giá trị chính xác: `../assets/tokens.css`; ánh xạ sang token app: `../02-he-thong-thiet-ke.md` §9.

## Chỗ SVG mất độ trung thực (biết trước)

| Mất gì | Ở đâu | Cách bù trong Figma |
|---|---|---|
| **Bóng đổ** (`box-shadow`) bị bỏ hoàn toàn | menu thao tác (09), toast, modal, nút trên bàn phím số — thẻ thường vốn không có bóng | Gán Effect style `Shadow md` (menu, toast) / `Shadow lg` (modal) |
| **Vòng focus / quầng focus** chỉ xuất được khi là viền thật | ô nhập đang focus ở `00-design-system` | Thêm stroke 2px `#0F766E` + quầng 5px teal 18 % |
| **Chữ không tự xuống dòng / co giãn**: mỗi dòng là một `<text>` riêng đặt toạ độ tuyệt đối | mọi màn | Gộp thành text box Auto width/Fixed khi dựng component |
| **Chữ bị cắt "…"** được cắt sẵn theo bề rộng đo trong trình duyệt | tên người dùng ở chân sidebar | Đặt text box Fixed width + Truncate |
| **Bố cục không Auto Layout**: mọi thứ là toạ độ tuyệt đối | mọi màn | Khi chuyển thành component, dựng lại Auto Layout theo spacing token |
| **Pseudo-element**: chỉ dựng lại hình nền tuyệt đối + chữ số đếm (badge); các `::before/::after` khác bỏ | badge thông báo, chấm trạng thái | Kiểm lại khi dựng component |
| **Hover/active/animation** không có trong SVG tĩnh | — | Trạng thái được vẽ sẵn thành từng mẫu ở `00-design-system.svg` |
| **Phần tử chỉ cho trình đọc màn hình** (`.sr-only`) bị bỏ có chủ ý | nhãn ẩn của ô tìm kiếm, select | Không cần trong Figma |
| **Dropdown native** (`<select>`) chỉ còn chữ đang chọn + mũi tên vẽ | mọi select | Vẽ menu mở bằng component Menu (như 09) |
| **Phần tử fixed** (bottom-nav, bàn phím số) được ghim về đáy khung cao hết trang, không còn "dính" khi cuộn | 06, 07, 08 | Dùng *Fix position when scrolling* cho layer đó trong prototype |
| **Gradient** chỉ giữ được gradient trong SVG gốc (vùng biểu đồ doanh thu) | 03 | — |

Không có màn nào quá phức tạp cho SVG; mức lệch cao nhất là `08-hoa-don-khach-mobile` (2,05 %) do mã QR minh hoạ là nhiều ô nhỏ.

## Xuất lại SVG sau khi sửa HTML

Từ thư mục `docs/design/ui-redesign`:

```bash
# jobs.json: [{"html":"screens/03-dashboard-chu.html","svg":"figma/03-dashboard-chu.svg","png":"screens/png/03-dashboard-chu.png","w":1440,"h":900,"qa":true,"full":true}, ...]
node tools/cdp-run.mjs batch jobs.json     # chụp PNG + xuất SVG + đo QA (Edge headless)
python tools/embed-images.py               # nhúng ảnh vào SVG (Figma không đọc href ra file ngoài)
```

`tools/cdp-run.mjs` dùng client CDP không phụ thuộc của skill `taste` (biến môi trường `TASTE_CDP` nếu ở chỗ khác); `tools/dom2svg.js` là bộ chuyển DOM → SVG.
