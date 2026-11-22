# Quy ước chung cho mọi lô UX v2 (đọc trước brief của lô)

## Bạn là ai, làm ở đâu
- Coder Sonnet, một lô. Worktree, nhánh, cổng vite ghi ở đầu brief lô. Mọi lệnh native (git, node, npx) dùng đường dẫn `C:/…`; shell là git-bash.
- Nhánh lô tách từ `feat/ux-v2` mới nhất (controller đã tạo). **Không** merge, push, rebase nhánh khác; **commit trong nhánh lô được** (mỗi task một commit, message tiếng Việt `x<N>: <việc>`).
- Backend demo `http://localhost:5190` **chỉ GET**. Không bấm nút ghi dữ liệu (thu tiền, chốt kỳ, phát hành, phân công, lưu, xoá) trên app thật; luồng ghi chứng minh bằng test có mock `fetch`.
- Dev server: `cd frontend && VITE_BACKEND_URL=http://localhost:5190 npx vite --port <cổng> --strictPort` (proxy `/api` chỉ bật khi có `VITE_BACKEND_URL`, xem `vite.config.ts`).

## Đọc trước khi code
1. Mục "File sở hữu" trong brief lô của bạn là danh sách **duy nhất** được sửa/tạo (cộng `ux-v2/shots/x<N>/`). Không cần đọc plan tổng hay brief lô khác.
2. Phần ux-v2 brief lô trỏ tới (`02`, `03`, ảnh `ux-v2/screens/png/<mã>-*.png`, đoạn `prototype/app.js` có tên hàm ghi trong brief).
3. Code thật của các file lô bạn sở hữu + test của chúng.

## Luật cứng
- **Không đổi quyền.** Không sửa `dinhTuyen.ts`, `roleNavigation.ts`, `App.tsx` (trừ x0). Lô cần route/nhãn mới → dừng, báo controller.
- **Không đụng font/token**: `tokens/**`, `assets/fonts/**`, `@font-face`, `--ma-font-*`, `--ma-text-*` định nghĩa. Được *dùng* biến có sẵn.
- **Không sửa** `design/components.css`, `design/ux-v2.css`, `design/**` (trừ x0), `api.ts`, `managementApi.ts`, `financeApi.ts`, `workerDashboardApi.ts`, `styles.css`, backend, compose. Thiếu lớp CSS → CSS cục bộ trong file của lô (`<style>` không; dùng file `TenMan.css` cạnh component và import ở đầu component, hoặc class sẵn có). Thiếu hàm API → viết hàm nhỏ trong file của lô, gọi `fetch` kèm `authorizationHeaders(token)` và `toApiError` y như `api.ts`.
- **Không thêm dependency.** Không router lib, không lib icon. Icon dùng `Glyph` có sẵn.
- **Không đổi hành vi nghiệp vụ**: payload POST/PUT/PATCH, thứ tự xác nhận, điều kiện bật nút phải y như cũ. Chỉ đổi bố cục/điều hướng. Nếu test cũ khoá hành vi mà bạn buộc phải sửa test → ghi lý do vào báo cáo, từng test một.
- **Không xoá file** màn cũ hay test của chúng.
- Tiếng Việt có dấu trong UI, tên file mới, tên biến mới, comment. Không viết HOA cả câu; nhãn nhỏ dùng chữ thường như prototype.
- Màn cấp trang mới dùng `TrangProps` (từ `dinhTuyen.ts`), lấy toà bằng `useToaDangChon()` / `useMotToa()` (từ `toaDangChon.tsx`). **Không tự gọi `fetchToaNha` để dựng ô chọn toà**; không tự `pushState` — gọi `props.dieuHuong(href)`.
- Màn nào cũng có 4 trạng thái: đang tải (`.skel` / `.skel-line`), rỗng có câu + hành động kế tiếp (`EmptyState` ở `design/feedback`), lỗi tải có "Thử lại" và câu "Dữ liệu chưa bị thay đổi." (`EmptyState kind="error"` hoặc `.banner banner-danger`), có dữ liệu. Không có `LoadingState`/`ErrorState` — đừng tạo.
- Mỗi trang đúng **1 nút chính** (`Button variant="primary"`) trong vùng nhìn thấy; nút khác `secondary`/`ghost`.
- Chữ nhỏ nhất 13px ở mọi khung (`text-floor.mjs`). Vùng bấm ≥ 44px ở ≤ 767px. Focus thấy được. Bảng là `<table>` thật có `<th scope>`; hàng bấm được có `<a href>` hoặc `button` (Enter mở), không chỉ `onClick` trên `<tr>`.
- Số tiền/ngày/số: `dinhDangTien`, `dinhDangNgayIso`, `dinhDangSo` ở `design/core/format.ts`. Không viết hàm định dạng mới.

## Kiểm trước khi báo xong (dán output thật vào báo cáo)
```
cd frontend
npx tsc -b
npx vitest run                      # ghi "Test Files a passed, Tests b passed"
npx vitest run <file test của lô>   # tên các test mới
npm run build
git diff --stat feat/ux-v2...HEAD   # chỉ file lô sở hữu
```
- Ảnh app thật: viết `ux-v2/shots/x<N>/jobs.json` (`[{"name":"04-chu-thu-tien-1440","path":"/thu-tien","role":"CHU","w":1440,"h":900,"full":true}]`) rồi `MA_APP_URL=http://localhost:<cổng> node docs/design/ui-redesign/tools/app-shot.mjs <jobs> <outDir>`; `MA_DEMO_PASSWORD` controller đặt sẵn trong môi trường (không in ra log, không ghi vào file). Bắt buộc 1440 + 390 cho mọi màn lô đụng, kèm `qa.json` (overflow 0, belowHit 0, contrast.below 0). Tự mở từng ảnh bằng vision, so với ảnh prototype cùng mã, ghi 1 dòng khác biệt / ảnh.
- Lưu ảnh + qa vào `docs/design/ui-redesign/ux-v2/shots/x<N>/` (commit trong nhánh lô).

## Báo cáo (≤ 40 dòng, file `ux-v2/shots/x<N>/BAO-CAO.md` + dán vào chat)
1. Việc đã làm theo task (1 dòng/task, kèm commit hash).
2. Output lệnh kiểm (dán nguyên dòng tổng).
3. Bảng ảnh: mã · đường dẫn · khung · khác prototype ở đâu.
4. Test cũ đã sửa: tên test · lý do.
5. Thứ cố ý không làm + thứ chưa kiểm.

## Khi nào dừng hỏi controller
- Cần sửa file ngoài ma trận. Cần API/field chưa có. Test cũ đỏ mà lý do là đổi hành vi nghiệp vụ. Quá 2× thời gian ước. Prototype và code thật mâu thuẫn mà brief không nói.
