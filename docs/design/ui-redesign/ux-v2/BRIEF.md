# Brief — THIẾT KẾ LẠI UX (cấu trúc, luồng, bố cục) MiniApart — bản xem trước

Bạn là designer-planner (Opus). Chủ tịch đã duyệt hệ thiết kế (màu teal, font Archivo, component, bảng Hợp đồng, Tổng quan Chủ vòng 2) và nay nói: "sắp xếp UX tệ lắm, làm lại, cần chuyên nghiệp hơn". Việc này là CẤU TRÚC + LUỒNG + BỐ CỤC, không phải đổi màu/font. Giao BẢN XEM TRƯỚC (HTML bấm thử được + ảnh), CHƯA đụng code app.

## Đọc trước
1. `docs/design/ui-redesign/ux-v2/AUDIT.md` — kiểm toán UX (12 vấn đề, công việc thật theo vai trò, số bước hiện tại). Xác minh lại bằng ảnh thật `docs/design/ui-redesign/evidence/dot-03/*.png` và app chạy ở http://localhost:5190 (chỉ GET; đăng nhập 5 vai trò: SĐT + mật khẩu demo ở dòng "Tài khoản" đầu `docker-compose.demo.yml`; chủ 0999000011, quản lý 0999000020, thợ 0999000031, khách thuê 0999100001, QTHT 0999000001). Có thể dùng `docs/design/ui-redesign/tools/app-shot.mjs` (mỗi lần 1 role).
2. Hệ thiết kế để dùng lại: `docs/design/ui-redesign/assets/{tokens.css,components.css,icons.svg,shell.js,fonts}`, `design-system.html`, 9 màn khung `screens/*.html`, `02-he-thiet-ke…md`, `screen-inventory.md` (44 mục), `frontend/src/roleNavigation.ts` (đường dẫn + quyền thật — KHÔNG đổi quyền/đường dẫn API, chỉ đổi cách tổ chức giao diện).
3. Tham chiếu phong cách (Chủ tịch chọn theo đề xuất, em tự đặt vì form hết hạn — ghi là "Em chọn"): công cụ quản trị gọn, dày thông tin, ít màu, kiểu Linear / Stripe Dashboard. Lấy cấu trúc + nhịp, không chép pixel.

## Việc phải làm
**A. Phân tích việc (jobs-to-be-done) → cấu trúc.** Cho mỗi vai trò (CHU, QUAN_LY, THO, NGUOI_THUE, QTHT): top 5 việc, đếm số bước/màn hiện tại (đo từ app thật) và số bước đề xuất. Bảng trước/sau.
**B. Kiến trúc thông tin mới.** Đề xuất nav theo CÔNG VIỆC (ví dụ nhóm theo "Hôm nay", "Thu tiền", "Phòng & người thuê", "Vận hành", "Báo cáo") thay cho 17 mục phẳng; gộp những màn là cùng một việc (Hoá đơn + Thu tiền + Công nợ) thành một không gian có tab/bước; bối cảnh toà dùng chung chọn MỘT lần ở khung (và nhớ), tìm kiếm nhanh toàn cục (Ctrl/Cmd+K: tìm người thuê/phòng/hợp đồng/hoá đơn), thông báo có số, bỏ thanh "Không gian quản lý" + breadcrumb lặp (breadcrumb chỉ khi sâu ≥ 2 tầng). Chỉ rõ mục nào gộp/đổi tên (kèm ánh xạ 44 mục cũ → vị trí mới, KHÔNG làm mất chức năng nào; giữ route cũ làm đường dẫn tương thích/redirect).
**C. Hồ sơ 360°.** Thiết kế trang chi tiết đối tượng nối mọi thứ liên quan: Người thuê (hợp đồng, hoá đơn/nợ, sự cố, lịch sử liên hệ), Phòng, Hợp đồng, Toà nhà — bố cục tiêu đề + hành động chính + tab hoặc các khối liên kết; từ danh sách bấm vào hàng là vào đúng hồ sơ (không mở form bên dưới danh sách).
**D. Luồng nhiều bước thành luồng có chỉ báo:** (1) chu kỳ tháng của Quản lý: Ghi chỉ số → Chốt kỳ → Phát hành → Thu tiền (thanh bước + trạng thái mỗi bước + hành động chính của bước), (2) tạo hợp đồng, (3) xử lý sự cố từ tiếp nhận tới thanh toán thợ, (4) khách thuê: xem và trả hoá đơn. Mỗi luồng: sơ đồ + màn khung.
**E. Bố cục lại các màn đại diện** (1440 desktop, 390 mobile cho thợ/khách thuê/ghi chỉ số) — ít nhất:
 - Chủ: "Hôm nay" (danh sách hành động: nợ quá hạn theo người, hợp đồng sắp hết, sự cố chờ duyệt chi phí, phòng trống lâu) + số liệu gọn phía trên; Tiền (Hoá đơn/Thu tiền/Công nợ gộp: nhóm theo người/phòng với hàng tổng, một bộ lọc duy nhất, hành động hàng loạt có ngữ cảnh khi chọn dòng);
 - Hồ sơ Người thuê 360°; Sự cố (một danh sách + bảng điều khiển chi tiết dạng ngăn bên phải, không 2 bảng chồng);
 - Quản lý: chu kỳ tháng + Nhắc việc;
 - Thợ và Khách thuê (mobile): màn chủ đạo "việc cần làm / cần trả";
 - Khung ứng dụng (sidebar mới, thanh trên mới, chọn toà, tìm kiếm Ctrl+K, thông báo), màn "Không có quyền", trạng thái rỗng/lỗi.
Dùng DỮ LIỆU THẬT từ 5190 (GET) cho chữ/số trong mockup, tiếng Việt thật.
**F. Đầu ra** (tất cả trong `docs/design/ui-redesign/ux-v2/`, KHÔNG ghi ra ngoài thư mục này):
 - `README.md` ≤ 2 trang: tóm tắt hướng, 5 quyết định lớn, bảng trước/sau số bước, câu hỏi cho Chủ tịch (đánh số, mỗi câu có đề xuất; "duyệt" = lấy hết đề xuất);
 - `01-nhiem-vu.md` (A), `02-kien-truc-thong-tin.md` (B, kèm bảng ánh xạ 44 mục), `03-ho-so-va-luong.md` (C, D);
 - `prototype/index.html` HTML bấm thử được (điều hướng giữa các màn khung thật sự hoạt động, vai trò chuyển được), dùng `../assets/*`; `screens/png/*` (1440 và 390) và `compare/` ảnh cạnh nhau trước (từ `evidence/dot-03`) / sau;
 - `figma/` SVG từng màn khung + `IMPORT.md` theo cách đã làm ở `../figma/` (skill `html-mockup-figma-svg-qa`); chưa cần import Figma.
 - `QA.md`: đo bằng `tools/qa-probe.js`/`app-shot` trên prototype (không cuộn ngang, vùng chạm 44 mobile / 36 desktop, tương phản 4,5:1, chữ ≥ 13px) và guard `frontend` (`cd frontend && npx vitest run src/designTokens.test.ts`) khi có đụng token.
**G. Tự kiểm:** tự mở ảnh bằng công cụ xem ảnh, sửa lỗi nhìn thấy, lặp tới khi đạt. Chấm bảng slop (thẻ rỗng, hộp lồng hộp, nhiều nút chính ngang hàng, chữ mono, IN HOA giãn cách…) trên ảnh cuối. Ảnh nào còn đại trà/giống app cũ thì làm lại.

## Ràng buộc
- Chỉ ghi file trong `docs/design/ui-redesign/ux-v2/`. KHÔNG sửa `frontend/src`, `backend`, compose, test; KHÔNG commit; KHÔNG đổi nhánh; KHÔNG POST/PUT/DELETE vào backend demo (đăng nhập là ngoại lệ duy nhất).
- Giữ hệ thiết kế đã duyệt (token, Archivo, component); chỉ thêm token/component khi bắt buộc, đánh dấu MỚI.
- Không thêm tính năng backend vào thiết kế như thể đã có: thứ cần API mới (nhắc nợ tự động, xuất Excel hợp đồng, tìm kiếm toàn cục phía server…) ghi vào bảng "Phụ thuộc backend" kèm cách làm tạm bằng dữ liệu đã có (vd tìm kiếm phía client trên danh sách đã tải).
- Quyết định em tự đặt ghi rõ "Em chọn" để Chủ tịch bác. Cuối cùng trả: bảng đầu ra, quyết định tự đặt, câu hỏi đánh số, phụ thuộc backend, điều chưa kiểm.
