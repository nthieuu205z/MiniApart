# Brief — Thiết kế lại giao diện MiniApart (bộ design TỔNG QUAN để Chủ tịch duyệt)

Người giao: Chủ tịch (qua trợ lý chính). Người làm: sub-agent `claude-opus` (Opus 5.5, high).
Kết quả nộp vào: `docs/design/ui-redesign/` (thư mục thiết kế riêng, NẰM NGOÀI code sản phẩm).
**Cấm sửa bất cứ file nào ngoài `docs/design/ui-redesign/`** (không đụng `frontend/src`, `backend`, compose, test). Chỉ đọc code. Không commit, không đổi branch (đang ở `feat/ui-redesign`).

## 1. Mục tiêu
Anh Chủ tịch thấy giao diện hiện tại "tệ quá". Cần một **bộ design tổng quan** (hệ thiết kế + các màn khung chủ chốt) để anh duyệt bằng mắt TRƯỚC khi thiết kế/làm hết các màn còn lại. Đây chưa phải thi công vào app.

## 2. Đầu vào đã có (đọc hết)
- Ảnh hiện trạng 12 màn (dữ liệu thật, 1440px): `docs/design/../ui-audit-2026-11-20/*.png` = `docs/ui-audit-2026-11-20/`.
- Mẫu tham chiếu Chủ tịch chỉ định (Figma Community "Full Dashboard with Widgets, Sidebar, Charts, Graphs" — Giliard Gomes, CC BY 4.0): ảnh cover `docs/design/ui-redesign/reference/figma-ref-dashboard-cover.png`. Đặc trưng đã đọc: nền ngoài kem rất nhạt, **sidebar + lưới thẻ trắng bo góc lớn (~24px) tách bằng khoảng trắng, không viền nặng**; thẻ KPI chữ số rất lớn + một dòng mô tả + link "xem báo cáo →"; gauge bán nguyệt; biểu đồ vùng gradient nhạt; danh sách có avatar, hàng được chọn nền tint + icon hành động; thẻ nhỏ "Top month/year/buyer"; thanh ngang gradient; chip có icon; accent ấm (cam/vàng) chỉ dùng tiết chế; chữ sans hiện đại, tiêu đề thẻ ~20px semi-bold, nhiều khoảng thở. **Lấy cấu trúc, nhịp, bo góc, độ thoáng, kiểu widget; KHÔNG chép nguyên pixel/nội dung/tên "OrangeFarm"**. Màu: đề xuất giữ họ teal của MiniApart làm thương hiệu (xem §5) nhưng được phép đề xuất tông khác nếu có lý do rõ.
- Code thật: danh sách màn theo vai trò ở `frontend/src/roleNavigation.ts`; component hiện có `frontend/src/design/**` (+ `*.prompt.md`); token `frontend/src/tokens/*.css`; test token `frontend/src/designTokens.test.ts`, `designComponents.test.tsx`, `stylesCleanup.test.ts`.
- Dữ liệu demo thật: stack đang chạy `http://localhost:5190` (tài khoản ở §6). Dùng TIẾNG VIỆT THẬT + số liệu thật lấy từ đó (GET API bằng token đăng nhập, chỉ đọc) — không dùng lorem/"John Doe".
- `design-system/miniapart/MASTER.md` (untracked, sinh tự động ngày 16/11: Cinzel + Josefin Sans, teal #0F766E) là kết quả CŨ của một công cụ, chất lượng không đạt (font serif display không hợp số liệu). Coi là tham khảo, không bắt buộc theo; đừng sửa/xoá nó.

## 3. Quy trình bắt buộc
1. Nạp skill: `ui-ux-pro-max` (chạy `scripts/search.py --design-system` với query kiểu "property management dashboard apartment rental", dials gợi ý variance 4–5, motion 3–4, density 6–7; kết quả chỉ là gợi ý — vet palette/font, nói rõ phần nào bỏ vì sao), `design-taste-frontend`, `no-ai-design-slop`, `audit-ai-design-slop`, `emil-design-eng`, `popular-web-designs` (đọc 1–2 hệ thật như Linear/Vercel/Stripe để lấy kỷ luật token, KHÔNG để lộ là chép). Nếu một skill không có thì ghi lại và đi tiếp.
2. Phân tích hiện trạng: xem 12 ảnh + đọc code → bảng "vấn đề → nguyên nhân (token/component nào) → cách sửa". Đã quan sát sẵn: chữ mono trộn chữ thường ở nhãn/số/trạng thái; icon menu sai nghĩa và trùng nhau; Hợp đồng là các thẻ viền dày cao ~100px không bảng/lọc/sắp xếp; hàng KPI chủ nhà lẻ (5+1); khối viền lồng viền cùng độ nổi; màn Thợ gần như rỗng và dùng sidebar desktop; màn Ghi chỉ số có nhãn "Phòng 101" quá to, viền đen đè ô nhập, nhãn thừa lặp.
3. Chốt hướng thiết kế MỘT hướng chính (không nộp 3 phương án; anh đã chọn mẫu tham chiếu). Có thể kèm 1 biến thể tông màu nhỏ chỉ ở dashboard.
4. Dựng hệ thiết kế + màn khung (§4). Tự xem ảnh chụp và sửa trước khi nộp; tự chấm bảng slop (§7).

## 4. Sản phẩm phải nộp (đều trong `docs/design/ui-redesign/`)
| File | Nội dung |
|---|---|
| `README.md` | Mục lục + tóm tắt 1 trang: hướng chọn, 5 quyết định lớn, cách mở các trang xem thử, danh sách "câu hỏi cần Chủ tịch chốt" (đánh số, mỗi câu có đề xuất). |
| `01-phan-tich.md` | Phân tích hiện trạng (bảng vấn đề→nguyên nhân→sửa), phân tích mẫu Figma (lấy gì / bỏ gì), phép ánh xạ vào MiniApart. |
| `02-he-thong-thiet-ke.md` | Token: màu (nền, thẻ, mực, viền, brand, 4 trạng thái success/warn/danger/info, dữ liệu biểu đồ) có **mức tương phản đo thật ≥4.5:1** cho chữ; type scale (font OFL, tiếng Việt đủ dấu, **đóng gói woff2 cục bộ, không CDN**, kèm giấy phép + sha256); spacing 4/8; radius; elevation; focus ring; motion (thời lượng, easing; có `prefers-reduced-motion`); lưới desktop 12 cột / mobile 4 cột; breakpoints. Mỗi token ghi **tên CSS variable đề xuất, ánh xạ sang token `--ma-*` đang có** để sau này thay một file overlay. |
| `design-system.html` | Trang xem thử bấm được: toàn bộ token + component (Button 4 biến thể, Input/Select/MeterInput số to cho điện thoại, Checkbox/Switch, StatusTag, Chip, Card, KPI card, Gauge, biểu đồ vùng/cột/thanh ngang, Table có sort+lọc+phân trang+hàng chọn, List-row có avatar/hành động, Sidebar (đủ, thu gọn, mobile bottom-nav ≤5), TopBar + search, Breadcrumb, Tabs, Modal/ConfirmDialog, Toast, EmptyState/Skeleton/Error/Permission-denied, Banner). Mỗi component đủ trạng thái: default/hover/focus/active/disabled/loading/error. |
| `screens/*.html` + `screens/png/*.png` | Màn khung (desktop 1440×900; mobile 390×844 khi ghi rõ). Tối thiểu: **(1)** Đăng nhập; **(2)** Trang công khai tìm phòng (hero + lưới phòng + bộ lọc); **(3)** Dashboard Chủ nhà (bám bố cục mẫu: KPI lớn, gauge, biểu đồ doanh thu/công nợ, danh sách hoá đơn quá hạn, thẻ nhỏ top…, thanh ngang tiêu thụ theo toà); **(4)** Quản lý — Nhắc việc; **(5)** Danh sách Hợp đồng dạng BẢNG (lọc, sort, trạng thái, hành động) — thay cho thẻ viền dày; **(6)** Ghi chỉ số — MOBILE (ô số to, bàn phím số, tự nhảy phòng kế, hiện mức tiêu thụ tức thì, cảnh báo bất thường); **(7)** Thợ — Công việc — MOBILE (+ Tổng quan, Báo giá & thanh toán nếu kịp); **(8)** Khách thuê — Hoá đơn của tôi — MOBILE (chi tiết khoản + QR); **(9)** QTHT — Tài khoản. Mỗi màn 1 file HTML dùng chung `assets/tokens.css` + `assets/components.css` (không CSS lặp). |
| `screen-inventory.md` | Bảng TẤT CẢ màn theo 5 vai trò (lấy từ `roleNavigation.ts` + file `frontend/src/*.tsx`): mỗi màn → mẫu bố cục (dashboard / table / form / detail / mobile-task) và màn khung nào ở trên là đại diện. Để sau khi duyệt, Chủ tịch biết các màn còn lại sẽ trông thế nào. |
| `assets/` | `tokens.css`, `components.css`, `fonts/*.woff2` + `fonts/LICENSE-*.txt` + `fonts/SHA256SUMS.txt`, icon SVG (một bộ nhất quán, stroke đồng nhất; **không emoji làm icon**; icon-only button phải có aria-label). |
| `figma/` | **Mỗi màn khung xuất thêm 1 file `.svg` thuần (text là `<text>`, không rasterize)** để kéo thả vào Figma ra layer sửa được; `figma/IMPORT.md` ghi bước import (kéo SVG vào canvas; font cài trước; token → Figma Variables) và liệt kê chỗ nào SVG mất độ trung thực (đổ bóng, blur…). Cố gắng đủ trung thực; nếu một màn quá phức tạp cho SVG thì nói rõ. |
| `QA.md` | Kết quả kiểm: bảng tương phản đo thật, kiểm cỡ chạm ≥44px mobile, kiểm không cuộn ngang ở 390, kiểm tab/focus, kiểm reduced-motion, bảng slop tự chấm, **kết quả chạy guard của repo** (§5). Cái nào chưa kiểm ghi "chưa kiểm". |

## 5. Ràng buộc
- **Stack thật**: React 19 + Vite + TypeScript, CSS thuần theo token `--ma-*`; KHÔNG Tailwind, KHÔNG lib UI/chart ngoài (repo chỉ có react/react-dom). Mọi thứ thiết kế phải làm được bằng CSS + SVG tự dựng. Hiện có font Archivo (woff2 trong `frontend/src/assets/fonts`); được đổi sang Inter hoặc Geist (OFL, có Vietnamese) nếu có lý do — thử hiển thị đủ dấu "ằẳẵặ ơờởỡợ ưừửữự đ".
- **Nhận diện**: logo chữ M/teal hiện có; đề xuất giữ tông teal (#0F766E–#0D9488) làm brand nhưng bỏ font Cinzel; accent ấm tiết chế theo mẫu (amber) cho điểm nhấn dữ liệu. Được đề xuất khác nếu nêu lý do.
- **Thiết bị**: desktop cho Chủ/Quản lý/QTHT; **mobile-first cho Thợ, Khách thuê và màn Ghi chỉ số** (dùng giữa hành lang, thiếu sáng, yếu sóng).
- **Guard của repo** (chạy trên bản chép ở thư mục tạm, KHÔNG sửa repo): thử token đề xuất với `designTokens.test.ts`, kiểm cỡ control theo thang repo cho phép, kiểm tương phản skin; chỉnh giá trị cho qua TRƯỚC khi chụp ảnh. Bước `npx vitest` chạy trong bản chép (`$TMPDIR`), không trong `frontend/`.
- **Erase slop** (tự kiểm, ghi vào QA.md): cấm font serif fallback ở số/tiêu đề; cấm hộp viền lồng hộp cùng độ nổi; cấm hàng nhiều nút ngang hàng không có nút chính; cấm thẻ số liệu trống; cấm khung chi tiết là danh sách key/value trơn; cấm gradient tím/xanh mặc định, glassmorphism thừa, emoji làm icon, bóng đổ lòe loẹt. Mỗi màn chỉ MỘT hành động chính.
- A11y: tương phản chữ ≥4.5:1 (lớn ≥3:1), focus ring thấy rõ, không dùng màu đơn độc để báo trạng thái (thêm icon/chữ), nhãn form luôn hiện (không chỉ placeholder), lỗi gần ô nhập.
- Tiền VND định dạng `1.888.000 ₫` (chấm ngàn), ngày `dd/MM/yyyy`; số liệu tiền dùng chữ số tabular.
- Dữ liệu chủ yếu giả lập (demo): không đưa số giấy tờ/số tài khoản thật vào file thiết kế.

## 6. Cách lấy dữ liệu thật (chỉ đọc)
`POST http://localhost:5190/api/auth/login` body `{"soDienThoai":"<sđt>","matKhau":"DemoOnly2026!"}` → `token` (Bearer). Tài khoản: chủ `0999000011`, quản lý `0999000020`, thợ `0999000031`, khách thuê `0999100001`, QTHT `0999000001`. Tìm endpoint trong `frontend/src/api.ts`, `managementApi.ts`, `financeApi.ts`, `workerDashboardApi.ts`. Chỉ GET. Không POST/PUT/DELETE nào ngoài đăng nhập.
Chụp ảnh: Edge headless có sẵn (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe --headless=new --screenshot=<png> --window-size=1440,900 file:///...`), hoặc Playwright nếu đã có. Mở `http://localhost:5190` được để so với bản hiện tại.

## 7. Nghiệm thu (Chủ tịch sẽ nhìn)
- Mở `design-system.html` + 9 màn: nhìn là thấy cùng một hệ, hiện đại, thoáng, KHÔNG còn cảm giác bảng điều khiển kỹ thuật/AI slop; chữ Việt đủ dấu, số tiền thẳng cột.
- Dashboard Chủ nhà nhận ra tinh thần mẫu Figma (thẻ lớn bo góc, KPI số to, gauge, biểu đồ vùng, danh sách có avatar) nhưng là sản phẩm MiniApart (tiếng Việt, số thật, teal).
- Hợp đồng là bảng dùng được; Ghi chỉ số/Thợ/Khách thuê dùng được một tay trên điện thoại.
- `README.md` có danh sách câu hỏi đánh số cho Chủ tịch.

## 8. Báo cáo trả về (ngắn)
Liệt kê file đã tạo (đường dẫn tuyệt đối), con số QA đã đo (tương phản, guard repo), điều CHƯA kiểm, quyết định tự đặt cần Chủ tịch bác, và rủi ro. Không dán lại nội dung file.
