# Checklist review — đợt thi công UX v2

Người review (controller) đánh dấu từng ô **kèm bằng chứng** (lệnh + dòng output, đường dẫn ảnh, tên test, `file:dòng`). Ô không có bằng chứng = chưa đạt. Một ô "Chặn" chưa đạt → trả lô, không gộp.

## A. Chung cho mọi lô

### A1. Phạm vi (Chặn)
- [ ] `git diff --stat feat/ux-v2...ui/x<N>` chỉ chứa file lô sở hữu theo ma trận `04-00-tong-quan.md` (+ `ux-v2/shots/x<N>/`).
- [ ] Không đụng: `tokens/**`, `assets/fonts/**`, `@font-face`, `--ma-font-*`/`--ma-text-*` định nghĩa, `design/components.css`, `design/ux-v2.css` (trừ x0), `api.ts`, `managementApi.ts`, `financeApi.ts`, `workerDashboardApi.ts`, `styles.css`, backend, compose. Lệnh: `git diff --name-only feat/ux-v2...ui/x<N> | grep -E "tokens/|fonts/|components.css|ux-v2.css|Api.ts|api.ts|styles.css|backend/|compose"` → rỗng.
- [ ] `package.json`/`package-lock.json` không đổi (không thêm dependency).
- [ ] Không xoá file màn/test nào (`git diff --diff-filter=D --name-only` rỗng).

### A2. Quyền và định tuyến (Chặn)
- [ ] `dinhTuyen.ts`, `roleNavigation.ts`, `App.tsx` không đổi (trừ x0).
- [ ] Không có `history.pushState` mới trong màn (chỉ `props.dieuHuong`); `replaceState` chỉ để giữ bộ lọc trên URL của chính màn. Lệnh: `git diff feat/ux-v2...ui/x<N> | grep "^+.*pushState"` → rỗng (trừ x0).
- [ ] Quản lý không gọi `/api/bao-cao/cong-no` hay `/api/dashboard/chu` ở bất kỳ màn nào lô đụng (test assert URL fetch).
- [ ] Link nội bộ là `<a href>` thật (mở tab mới được), không chỉ `onClick`.

### A3. Hành vi nghiệp vụ không đổi (Chặn)
- [ ] Mọi POST/PUT/PATCH/DELETE: cùng URL, method, body như trước (test cũ còn xanh, hoặc test mới so body).
- [ ] Bước xác nhận (`ConfirmDialog`, checkbox xác nhận, lý do huỷ bắt buộc) còn nguyên.
- [ ] Điều kiện khoá nút (`blocked` + `blockedReason`) còn nguyên hoặc chặt hơn, không lỏng hơn.
- [ ] Bảng "test cũ đã sửa" trong báo cáo: mỗi dòng có lý do là **bố cục/điều hướng**, không phải đổi hành vi. > 25 test sửa ở một lô → hỏi lại.

### A4. Kiểm máy (Chặn) — controller chạy lại, không tin số trong báo cáo
- [ ] `npx tsc -b` sạch.
- [ ] `npx vitest run` xanh; số test ≥ số trước lô + số test mới lô khai.
- [ ] `npm run build` qua.
- [ ] Mỗi logic mới không tầm thường (hàm tính bước, gộp, lọc, ánh xạ trạng thái) có test riêng.
- [ ] Thử đột biến nhanh 2–3 chỗ (gỡ một điều kiện lọc/khoá) → test đỏ. Không đỏ → thiếu test.

### A5. Thiết kế (đối chiếu prototype đã duyệt)
- [ ] Ảnh app thật 1440 + 390 cho mọi màn lô đụng, mở bằng vision, so ảnh prototype cùng mã; khác biệt có lý do trong báo cáo (thiếu API, giữ màn cũ…).
- [ ] Đúng **1 nút chính** trong vùng nhìn thấy mỗi trang/bước/ngăn (trang được phép 0 khi prototype không có: Hôm nay Chủ, Sự cố đầu trang, hợp đồng hiệu lực bình thường, phòng đang thuê).
- [ ] Một `h1` mỗi trang; breadcrumb chỉ ở hồ sơ/tạo hợp đồng (2 tầng).
- [ ] Không có ô chọn toà riêng trong màn khi khung đã có (trừ ô "chọn toà tại chỗ" khi Chủ ở "Tất cả toà" mà màn cần 1 toà).
- [ ] Không còn form/chi tiết mở bên dưới danh sách; chi tiết = hồ sơ hoặc ngăn.
- [ ] Chữ tiếng Việt có dấu; không IN HOA cả câu; nhãn khớp prototype (Cần thu, Đã thu, Chu kỳ tháng, Hôm nay…).
- [ ] Số bước tới khi xong việc chính của màn ≤ cột "sau" trong bảng trước/sau của `ux-v2/README.md`/`01` (đếm bằng tay trên app thật, ghi vào báo cáo).
- [ ] Không thêm KPI/số liệu không có nguồn API thật; số trên ảnh khớp dữ liệu 5190 (ví dụ Thu tiền Chủ: 15 người, 60 kỳ, 173.450.000 ₫).

### A6. Trạng thái và truy cập
- [ ] Đang tải / rỗng (có câu + hành động kế tiếp) / rỗng do lọc / lỗi ("Thử lại" + "Dữ liệu chưa bị thay đổi.") — có test hoặc ảnh cho rỗng + lỗi.
- [ ] `qa.json`: overflow 0, belowHit 0, contrast.below 0; `text-floor.mjs`: không chữ < 13px.
- [ ] Bàn phím: Tab tới mọi điều khiển, focus thấy rõ; ngăn/popover/menu "…": Esc đóng, focus bị giữ bên trong khi mở và trả về nút mở khi đóng.
- [ ] Bảng là `<table>` có `<th scope>`; nút chỉ có icon có `aria-label`; trạng thái không chỉ bằng màu (có chữ).
- [ ] ≤ 767px: vùng bấm ≥ 44px, không cuộn ngang, nút chính không bị bàn phím ảo che (dính đáy khi là form).

### A7. Code
- [ ] Dùng component/hàm có sẵn (`Button`, `EmptyState`, `ConfirmDialog`, `useDialogTrap`, `Glyph`, `dinhDangTien`, `managementRequest`, `useToaDangChon`, `nhomNoTheoNguoi`…) thay vì viết lại.
- [ ] Không thêm abstraction/option/config không ai dùng; không `any`; không `eslint-disable`.
- [ ] Shortcut có giới hạn đã ghi `// shortcut: <giới hạn>, <khi nào nâng cấp>`.
- [ ] Tên mới, comment tiếng Việt; comment chỉ nói "vì sao".
- [ ] Không còn `console.log`, code chết, file tạm.

## B. Riêng từng lô (bổ sung A)

### x0 Khung
- [ ] Test "định tuyến cũ" viết **trước** (commit riêng), xanh trên App cũ và App mới không sửa.
- [ ] `grep -c hienThi frontend/src/App.tsx` = 0; số dòng App.tsx trước/sau.
- [ ] 42/42 đường dẫn menu cũ × vai trò: không "Không có quyền" (log/ảnh). 4 đường dẫn cũ tự chuyển giữ query (`/cong-no?toaNhaId=1` → `/thu-tien?toaNhaId=1`).
- [ ] Chủ `/phong` → trang Không có quyền gọn (h1 + 1 câu + "Về Hôm nay" + "Mở Toà & phòng"); QL `/bao-cao` tương tự.
- [ ] Toà: đổi ở sidebar → sang trang khác giữ; tải lại giữ (`localStorage ma.toaNhaId`); QL ô tĩnh; 5 màn `useBuildings` theo toà khung.
- [ ] Nav đúng bảng `02` §2 từng vai trò; `aria-current="page"` đúng mục cho đường dẫn con (`/hoa-don` sáng Thu tiền; `/nguoi-thue/1` sáng Người thuê).
- [ ] TopBar: không còn "Không gian quản lý · ngày"; Thợ/Khách còn nút đăng xuất.
- [ ] ☰ trên 390 mở ngăn sidebar; Esc/nền đóng; focus trả.
- [ ] `ux-v2.css` không chứa `font-family`, `@font-face`, `--font-`; `stylesCleanup`/`designTokens` test xanh.
- [ ] Vỏ trang mới đúng chữ ký `TrangProps`; `TimNhanh`/`ChuongThongBao` mount đúng chỗ x7 cần.

### x1 Thu tiền
- [ ] Chủ: 15 nhóm, hàng tổng 60 kỳ · 78.670.000 · 173.450.000 ₫ (ảnh 5190); chip 15/15/9.
- [ ] Hàng tổng tính trên danh sách đã lọc, không theo trang.
- [ ] QL: không 403 (không gọi công nợ), số toà 3 = 5 người · 20 kỳ · 50.398.000 ₫.
- [ ] Ngăn ghi nhận thu dùng `FinancePaymentPanel` với props cũ; `/thu-tien?nguoiThueId=` và `?hoaDonId=` mở ngăn đúng.
- [ ] "Gửi nhắc nợ" `aria-disabled` + lý do đọc được; "Xuất danh sách" ra CSV đúng cột.
- [ ] Tab Tiền cọc còn đủ chức năng cũ.

### x2 Hôm nay
- [ ] Một khối lỗi không làm trắng trang (`allSettled`).
- [ ] Mốc "sắp hết hạn" 30 ngày test bằng giờ cố định.
- [ ] QL: nút chính duy nhất "Ghi chỉ số" → `/chu-ky`; `/nhac-viec` tự chuyển.

### x3 Hồ sơ người thuê + phòng
- [ ] Bấm hàng danh sách → hồ sơ; không còn form dưới bảng; sửa hồ sơ trong ngăn, payload như cũ.
- [ ] Tab hồ sơ trên query, Back hoạt động.
- [ ] Phòng trống: chính "Tạo hợp đồng" (`/hop-dong/moi?phongId=&toaNhaId=`); đang thuê: không nút chính.
- [ ] Khối không có nguồn API (lịch sử liên hệ, điện nếu thiếu) ẩn + ghi chú, không vẽ giả.

### x4 Hồ sơ hợp đồng + toà
- [ ] 3 ca nút chính hợp đồng đúng `03` §C; "…" đủ 5 mục; `HopDongThaoTac.tsx` không đổi.
- [ ] Sơ đồ phòng: ô là link, có chữ trạng thái; QTHT không thấy nút ngoài quyền.

### x5 Chu kỳ tháng
- [ ] `tinhBuoc` 6 ca; mỗi bước 1 nút chính; Chốt kỳ khoá khi thiếu công tơ + có lý do; dialog xác nhận trước chốt/phát hành.
- [ ] `GhiChiSo` chỉ được nhúng với `anNutChot` (không sửa).
- [ ] Không bấm chốt/phát hành trên 5190 (hỏi coder, xem log jobs).

### x6 Sự cố
- [ ] Không còn bảng `LichSuSuaChua` thứ hai trên `/su-co`; Đã đóng xem được chi phí + lịch sử trong ngăn.
- [ ] Bảng 5 ca trạng thái → nhãn nút chính + URL lệnh.
- [ ] "Nhắc thợ" không có (thiếu API) — ghi trong báo cáo.

### x7 Tìm nhanh + chuông
- [ ] Ctrl/⌘+K, `/`, nút ô tìm đều mở; combobox/listbox ARIA đúng; Esc trả focus.
- [ ] Không tải dữ liệu trước lần mở đầu; "quang huy" ra 2 người; link hoá đơn có `kyId`.
- [ ] Chuông: số chưa đọc, 5 tin, đánh dấu đã đọc gọi API cũ.

### x8 Ghi chỉ số
- [ ] Công tơ thiếu lên đầu; đã ghi gọn thành bảng; 1 nút chính; chiều cao trang bước 1 trước/sau.
- [ ] 390: một công tơ/màn, "Lưu, sang …" lưu 1 lần rồi chuyển; lỗi giữ số đã nhập.
- [ ] Validate chỉ số + cảnh báo bất thường như cũ.

### x9 Thợ
- [ ] `buocViecTho` 5 ca; chỉ thẻ đầu `btn-primary`; nút kế tiếp gọi handler cũ; `yeuCauId` còn chạy.

### x10 Khách thuê
- [ ] Cần trả = Σ `conLai` mọi kỳ (7.580.000 ₫ với khách demo); không còn chỉ hiện kỳ mới nhất.
- [ ] Không số tài khoản giả, không QR giả, không nút "Tôi đã chuyển khoản"; kết quả kiểm `ben-a` cho khách ghi trong báo cáo.
- [ ] Nhánh quản lý của `HoaDon` không đổi (test cũ xanh nguyên).

### x11 Tạo hợp đồng
- [ ] Commit tách hook: test cũ `HopDongThaoTac` xanh không sửa.
- [ ] Body POST qua wizard = body form cũ; không thêm trường; "Tiếp" bị chặn khi bước lỗi; `?phongId=` điền sẵn.

### x12 Dọn + đo
- [ ] `git grep -l "fetchToaNha\b" frontend/src/*.tsx` chỉ còn file có lý do ghi trong báo cáo.
- [ ] Bảng đo toàn bộ (mọi trang × 1440/1024/390) + bảng trước/sau 6 việc chính.
- [ ] Danh sách file mồ côi (không xoá); `progress.md` cập nhật.

## C. Cổng giữa đợt (controller)
- [ ] Gộp tuần tự theo số lô vào `feat/ux-v2`, sau mỗi lần gộp: `tsc -b` + `vitest run`; hết đợt: `npm run build`.
- [ ] Ảnh tổng hợp đợt (mọi màn đổi trong đợt, 1440 + 390) controller tự chụp từ `feat/ux-v2`, tự xem bằng vision.
- [ ] Sau đợt 0 và đợt 4: quét 42 đường dẫn cũ.
- [ ] Gửi Chủ tịch: ảnh + bảng khác biệt so prototype (đặc biệt: Trả tiền thiếu QR/nút "đã chuyển"; Báo cáo 5 tab thay 4; chọn toà tại chỗ khi "Tất cả toà"). Không push / merge `main` khi chưa duyệt.
