
# Brief coder — Plan 01/02 (áp thiết kế UI MiniApart vào màn thật)

Bạn là coder (Sonnet). Làm ĐÚNG task được giao trong plan của bạn, không làm thêm. Trước khi code: đọc TRỌN plan của bạn + `docs/design/ui-redesign/plans/00-nen-gitattributes-va-component.md` (mục Tiêu chí nghiệm thu chung) + ảnh đích trong `docs/design/ui-redesign/screens/png/` + HTML tương ứng trong `screens/` + `assets/components.css`. Plan 00 (component nền) ĐÃ merge vào nhánh gốc của bạn: `design/components.css`, `design/core/{Button,StatusTag,Icon}`, `design/forms/{FilterChip,Field}`, `design/layout/Card`, `design/feedback/EmptyState`, `design/shell/{NavPanel,TopBar}`, `design/table/{bangDuLieu.ts,DataTable.tsx}`. Dùng lại, đừng viết song song. Baseline: 40 file / 274 test xanh, `npx tsc -b` sạch, build qua.

Môi trường: Windows, git-bash; tool native dùng đường dẫn `C:/...`. Mỗi coder một worktree riêng (đã tạo, trên nhánh riêng); các coder khác chạy SONG SONG ở worktree khác, KHÔNG đụng file ngoài danh sách File của task bạn (đặc biệt `App.tsx`, `App.test.tsx`, `design/**` chỉ sửa nếu task ghi rõ). Cần thêm gì ở `design/**` (vd 1 class CSS thiếu): thêm vào CHÍNH file/màn của bạn hoặc báo cáo lại, đừng sửa component chung.
Bước đầu: `cd <worktree>/frontend && npm ci --no-audit --no-fund`.

Luật:
- Mỗi task một commit nhỏ, message tiếng Việt `feat(ui): ...`. `git add` đúng file. KHÔNG push, KHÔNG merge, KHÔNG đổi nhánh, KHÔNG sửa backend/compose/token.
- Giữ props/state/handler/`data-*`/`data-testid` mà test cũ dùng; chỉ đổi JSX/CSS theo plan. Test cũ chỉ được sửa đúng chỗ plan cho phép (đổi chữ theo thiết kế); mọi thay đổi test cũ phải nêu trong báo cáo kèm lý do. Không xoá test.
- Không thêm thư viện. Không hex màu trong CSS/TS mới (dùng `var(--ma-*)`); guard `designTokens.test.ts`, `stylesCleanup.test.ts`.
- Sau mỗi task: `npx tsc -b`, `npm test` (toàn bộ), `npm run build` — đều phải xanh.
- Chụp ảnh nghiệm thu từ APP THẬT: stack demo http://localhost:5190 có dữ liệu (backend thật; CHỈ đọc). Cách: trong worktree của bạn tạo `frontend/.env.local` với `VITE_BACKEND_URL=http://localhost:5190` (file đã gitignore), chạy `npx vite --port <CỔNG CỦA BẠN>` nền, rồi
  `MA_DEMO_PASSWORD=<xem dòng "Tài khoản (mật khẩu …)" đầu docker-compose.demo.yml> MA_APP_URL=http://localhost:<cổng> node docs/design/ui-redesign/tools/app-shot.mjs <jobs.json> <thư mục ra>`.
  LƯU Ý tool: mỗi lần chạy chỉ 1 job có `role` (job thứ hai bị kẹt ở trang đăng nhập) → chạy mỗi job một lần trong vòng lặp. Thư mục ảnh: `C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/cache/scratch/evidence/<tên task>/` (KHÔNG commit ảnh, KHÔNG ghi mật khẩu vào file/commit). Sau khi chụp, TỰ MỞ ảnh bằng công cụ xem ảnh, so với ảnh đích, sửa lỗi nhìn thấy (chữ cắt, chồng lấn, lệch, icon sai nghĩa, nút thừa) rồi chụp lại — lặp tới khi đạt. Đọc `qa.json`: horizontalOverflow=0, belowHit rỗng (mobile ≥44px, desktop ≥36px), contrast.below rỗng. Chỗ nào còn vi phạm do thành phần dùng chung ngoài task: ghi tên phần tử + lý do vào báo cáo.
- Tắt vite khi xong (`powershell -c "Get-Process node | Where-Object {$_.Id -eq <pid>} | Stop-Process -Force"`).
- Không POST/PUT/DELETE vào backend (app-shot chỉ POST đăng nhập). Không bấm nút nghiệp vụ trong ảnh nghiệm thu.
- Sau 3 lần sửa không xong một lỗi: dừng và báo.
- Báo cáo cuối: từng task → commit sha, số test trước/sau, lệnh + kết quả THẬT, đường dẫn ảnh nghiệm thu, danh sách test cũ đã sửa + lý do, chỗ lệch plan, chỗ chưa kiểm. Không bịa kết quả; chưa làm được thì nói thẳng.

## Phần của bạn: Task 02-1 của plan 02 (`plans/02-dashboard-chu-va-quan-ly.md`) — sidebar gom nhóm + bottom-nav Thợ "Báo giá"
Worktree: `C:/Users/nthieuu05/Documents/PRJ/MiniApart-w1-nav` (nhánh `ui/w1-nav`). Cổng vite của bạn: 5291.

File: `App.tsx` (chỉ `NHOM_DIEU_HUONG_THEO_VAI_TRO` + `taoNhomDieuHuong` + vỏ shell), `App.test.tsx` (chỉ 2 mảng `menuLabels` CHU/QUAN_LY), `App.tho.test.tsx`, và — vì Chủ tịch đã xem ảnh thật và thấy lỗi — `design/shell/NavPanel.tsx`, `design/shell/TopBar.tsx` (được phép sửa trong task này).
NGOÀI plan, bắt buộc sửa các lỗi đã thấy trên ảnh thật của khung hiện tại (1440, CHU):
1. Icon sidebar: mục nào chưa có `icon` đang rơi về ô vuông "□"/glyph sai nghĩa. Gắn icon đúng nghĩa cho MỌI mục theo `assets/shell.js` (sprite `Icon`), không còn ô vuông.
2. Nhóm không nhãn của CHU (chỉ "Tổng quan") không được hiện nhãn trùng "Tổng quan" trên mục "Tổng quan".
3. Sidebar phải khớp `00-design-system.png`/`03-dashboard-chu.png`: nền trắng bo, 256px, mục active nền teal nhạt, khối người dùng + Đăng xuất Ở DƯỚI sidebar (không phải ở TopBar); sidebar cao đủ màn hình và cuộn nội bộ nếu menu dài (CHU có 17 mục) — hiện bị cắt ở "Sự cố".
4. TopBar desktop: nút "Đăng xuất" đang bị cắt sát mép phải; theo thiết kế TopBar chỉ có tiêu đề + (tuỳ trang) một nút chính + thông báo. Chuyển Đăng xuất xuống khối người dùng của sidebar (desktop). Mobile (<768): không còn menu "Thêm" nên phải vẫn có Đăng xuất truy cập được: dạng nút nhỏ ghost/icon trong header, KHÔNG phải nút lớn 44px chiếm nửa chiều rộng như hiện nay. `App.test.tsx` có thể tìm chữ "Đăng xuất" — giữ chữ đó cho a11y.
5. Mobile bottom-nav: nhãn bị cắt ("Hoá đơn củ…"): dùng `shortLabel` (NGUOI_THUE: "Hoá đơn"; THO: "Báo giá"), `aria-label` là nhãn đầy đủ, cỡ chữ ≥ 12px.
6. Breadcrumb: trang "Tổng quan" không hiện breadcrumb trùng lặp.
Ảnh nghiệm thu (mỗi role một lần chạy): CHU 1440 `/tong-quan` + 1024 (sidebar thu gọn còn icon) + QUAN_LY 1440 `/nhac-viec?toaNhaId=3`, THO 390 `/viec-cua-toi`, NGUOI_THUE 390 `/hoa-don-cua-toi`; QTHT 1440 `/tai-khoan`. Mỗi ảnh phải: sidebar/bottom-nav đúng thiết kế, không lỗi 1–6. Ảnh khung chứa nội dung cũ của trang là bình thường (các task khác làm nội dung).
