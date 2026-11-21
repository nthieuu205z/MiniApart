
# Brief coder — Plan 00 (nền component UI MiniApart)

Bạn là coder (Sonnet). Làm ĐÚNG các task được giao trong plan, không thêm việc. Plan nguồn: `C:/Users/nthieuu05/Documents/PRJ/MiniApart-ui/docs/design/ui-redesign/plans/00-nen-gitattributes-va-component.md` — ĐỌC TRỌN file đó trước (mỗi task có: File, Anh sẽ thấy, Không được xảy ra, Test, Kiểm). Design nguồn: `docs/design/ui-redesign/assets/components.css`, `icons.svg`, `shell.js`, `design-system.html`, `screens/*.html`. Mã mẫu đã chạy: `docs/design/ui-redesign/plans/ma-mau/` (chép nguyên khi plan bảo chép).

Môi trường: Windows, shell git-bash. Đường dẫn native dùng dạng `C:/...`. Frontend: `cd <worktree>/frontend`; `npm test`, `npm run build`, `npx tsc -b`. Task 0-1 (.gitattributes) ĐÃ XONG (commit a494d62), baseline: 38 file / 252 test xanh, build qua.

Luật:
- Mỗi task một commit nhỏ, message tiếng Việt kiểu `feat(ui): ...`. Chỉ `git add` đúng file của task. KHÔNG push, KHÔNG merge, KHÔNG đổi nhánh, KHÔNG sửa backend/compose/token/file ngoài danh sách File của task.
- Không thêm thư viện. Không viết hex màu trong CSS/TS mới ngoài chỗ chép từ design (dùng biến `var(--ma-*)`); `stylesCleanup.test.ts` và `designTokens.test.ts` là guard.
- Giữ props + tên export của component cũ; test cũ không được xoá (chỉ thêm).
- Mọi test phải xanh sau mỗi task (`npm test` toàn bộ). Build qua. Nếu một test cũ đỏ vì thay đổi hợp lệ, DỪNG và báo, đừng sửa bừa.
- Không POST/PUT/DELETE vào backend demo; stack demo ở http://localhost:5190 (chỉ GET) — dùng khi chụp ảnh.
- Sau 3 lần sửa không xong một lỗi: dừng và báo.
- Cuối cùng trả báo cáo: từng task → commit sha, số test trước/sau, lệnh kiểm đã chạy + kết quả thật, chỗ nào lệch plan và vì sao, chỗ chưa kiểm. Không bịa kết quả.

## Phần của bạn (coder A)
Worktree: `C:/Users/nthieuu05/Documents/PRJ/MiniApart-ui` (nhánh `feat/ui-tokens`, node_modules đã cài). Làm tuần tự: **0b-1 → 0b-2 → 0b-4 → 0b-5** (đều đụng `designComponents.test.tsx` nên không song song). Coder B làm 0b-3 và 0-6 ở worktree khác — KHÔNG đụng `frontend/src/design/table/` và `docs/design/ui-redesign/tools/`.
Chụp ảnh `/phong` trước/sau ở 0b-1: tool `app-shot.mjs` do coder B làm nên chưa có; thay vào đó dùng `browser_exec`/playwright tuỳ có, hoặc ghi "chưa chụp" nếu không làm được — đừng chặn task vì việc này; thay bằng kiểm `grep` rằng reset toàn cục không lọt vào `components.css` và test xanh.
