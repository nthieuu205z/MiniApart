
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

## Phần của bạn: Task 02-3 của plan 02 — Nhắc việc / Quản lý (màn 04)
Worktree: `C:/Users/nthieuu05/Documents/PRJ/MiniApart-w6-quanly` (nhánh `ui/w6-quanly`). Cổng vite của bạn: 5296.

File: `QuanLyDashboard.tsx`, `BangViecVanHanh.tsx`, `QuanLyDashboard.test.tsx`, `BangViecVanHanh.test.tsx`. Hai hộp thoại cũ ("Xử lý cảnh báo tiêu thụ", "Ghi chỉ số điểm đo chung") phải mở được. Một nút chính duy nhất. Không đụng `App.tsx`.
Ảnh: role QUAN_LY `/nhac-viec?toaNhaId=3` 1440, 1024, 390 (so `04-nhac-viec.png`).
