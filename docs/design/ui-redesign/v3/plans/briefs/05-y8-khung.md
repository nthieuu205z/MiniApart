# Brief y8 — Khung & Quản trị: Đăng nhập · Tìm nhanh · Thông báo · Không có quyền · Tài khoản

Nhánh `ui/y8-khung` · worktree `~/Documents/PRJ/MiniApart-y8` · cổng vite `5380` · ≤ 50′ · đợt 1 (sau y0).

## 1. Mục tiêu
Các màn "cửa vào" và màn quản trị dùng chung một giọng V3. Đăng nhập đơn giản, một nút. Tìm nhanh ra ngay phòng / người / hoá đơn. Thông báo chỉ là danh sách việc, không trang trí. Màn "không có quyền" nói rõ màn này của ai và nên làm gì tiếp. Màn Tài khoản là một bảng gọn.

## 2. File được sửa
`frontend/src/ManDangNhap.tsx` (y0 đã tách từ App, đợt này y8 sở hữu), `TimNhanh.tsx`, `chiMucTimNhanh.ts`, `ChuongThongBao.tsx` + `ChuongThongBao.css`, `ThongBao.tsx` (`/thong-bao`: thông báo cá nhân + "Báo cho cư dân" của QL), `TrangKhongCoQuyen.tsx`, `QuanLyTaiKhoan.tsx` (`/tai-khoan`), `TaiKhoanTruyCap.tsx` (trợ giúp tài khoản), `KhamPhaPhong.tsx` + `roomAmenities.ts` (xem phòng trống khi chưa đăng nhập), cùng test các file này. Trong `App.dangNhap.test.tsx` chỉ sửa `it` về đăng nhập; trong `managementFlows.test.tsx` chỉ sửa `it` về `TaiKhoanTruyCap`. Ảnh lưu ở `docs/design/ui-redesign/v3/shots/y8/`.

**Không sửa:** `App.tsx`, `design/shell/**` (TopBar/NavPanel/ChonToa thuộc y0), `roleNavigation.ts`, `authSession.ts`, `api.ts`.

## 3. Hợp đồng
- `ManDangNhap.tsx`: giữ nguyên tên và props mà y0 đã đặt khi tách. App truyền vào, y8 không được đổi chữ ký. Cần thêm prop thì dừng lại báo controller.
- `TimNhanh` và `ChuongThongBao` giữ props mà `App.tsx` đang truyền: `TimNhanh {...trangProps} mo datMo`, `ChuongThongBao {...trangProps}`.
- `TrangKhongCoQuyen({ vaiTro, vaiTroSoHuu, duongDan, dieuHuong })` giữ nguyên.
- Dùng từ y0: `DauTrang`, `DataTable` (`chips`), `EmptyState`, `Toast`, `ConfirmDialog`, `Button` (`danger`), `Field`/`Input`, `NhanMinhHoa`, `ChanDinh`.

## 4. Hành vi (trích `app2.js` `M['khung/*']`, `M['qt/tai-khoan']`; ảnh `30,32,33,36,37,38`)

### T1 · Đăng nhập (`ManDangNhap.tsx`, ảnh `30-khung-dang-nhap-1440/390`)
- Một thẻ form, giữa màn. Rộng tối đa 400. Gồm:
  - logo + "MiniApart";
  - h1 "Đăng nhập";
  - "Số điện thoại" (`inputmode="tel"`, `autocomplete="username"`);
  - "Mật khẩu" (`type=password`, `autocomplete="current-password"`), trợ giúp "Quên mật khẩu? <link>". Link mở trợ giúp tài khoản đang có (`TaiKhoanTruyCap`). **Không** hứa "đặt lại qua tin nhắn" nếu luồng đó chưa có; nếu chưa có thì ghi "Quên mật khẩu? Hỏi quản lý toà để cấp lại.";
  - **nút chính** "Đăng nhập", giãn hết ngang. Khi đang gửi thì `blocked`, nhãn "Đang đăng nhập…";
  - lỗi đặt ngay dưới ô.
- Dưới thẻ: "Người thuê chưa có tài khoản: hỏi quản lý toà để nhận tin nhắn kích hoạt." và nút chữ "Xem phòng còn trống" (mở `KhamPhaPhong`, như hiện tại).
- Bỏ ảnh minh hoạ lớn bên cạnh form v2. Nền `--ma-paper-2`.
- `App.dangNhap.test.tsx` phải qua. Nếu test khoá chữ hay ảnh cũ thì sửa và ghi lý do.

### T2 · Tìm nhanh (`TimNhanh.tsx`, ảnh `32-chu-hom-nay-tim-1440`)
- Mở bằng ⌘K / Ctrl+K / ô tìm ở TopBar (cơ chế đang có).
- Hộp nổi rộng 640, ô nhập "Tìm phòng, người, hoá đơn…". Kết quả chia nhóm Phòng · Người thuê · Hoá đơn · Màn, mỗi dòng có tiêu đề và phụ, phím ↑↓ Enter, Esc để đóng.
- Màn đã bỏ khỏi nav vẫn tìm thấy (Lịch xem phòng, PCCC, Nhật ký, Tiêu thụ…). Cập nhật nhãn trong `chiMucTimNhanh.ts` theo bảng tiếng nói, giữ nguyên đường dẫn.
- Rỗng: "Không thấy "<từ khoá>". Thử số phòng hoặc số điện thoại."

### T3 · Thông báo (`ChuongThongBao.tsx`, `ThongBao.tsx`, ảnh `33-ql-hom-nay-tb-1440`)
- Chuông: chấm đỏ khi có thông báo chưa đọc, số đếm ≥ 13px, `aria-label` có số. Ngăn thả ra là danh sách gồm tiêu đề, phụ (thời gian tương đối) và link tới màn liên quan, kèm "Đánh dấu đã đọc" (nút chữ, nếu đang có).
- `/thong-bao`: cá nhân và "Báo cho cư dân" (QL) giữ nguyên luồng, chỉ ăn token và chữ. Với QL, nút "Gửi thông báo" là nút chính duy nhất.

### T4 · Không có quyền (`TrangKhongCoQuyen.tsx`, ảnh 37)
- Giữa màn: icon khoá (`--ma-text-secondary`), h1 "Trang này dành cho <tên vai trò sở hữu>" (Quản trị hệ thống / Chủ nhà / Quản lý toà / Thợ / Người thuê), câu "Tài khoản <vai trò hiện tại> không mở được trang này."
- Tiếp theo là gợi ý theo vai trò sở hữu, ví dụ: "Cần thêm hay khoá tài khoản, nhắn Quản trị hệ thống." **Không** in SĐT của QTHT, vì không có API cho Chủ đọc số này.
- **Nút chính** "Về <trang đầu của vai trò>", lấy từ `TRANG_DAU`.

### T5 · Tài khoản (`QuanLyTaiKhoan.tsx`, ảnh 38)
- `DauTrang`:
  - `phu`: "N tài khoản · a chủ nhà · b quản lý · c thợ · d người thuê", đếm từ dữ liệu thật;
  - **nút chính** "Thêm tài khoản", mở form đang có.
- Chip "Nhân sự N" · "Người thuê N". Ô tìm "Tìm tên hoặc số điện thoại".
- Bảng: Họ tên · Điện thoại (`dinhDangSdt`) · Vai trò (Chủ sở hữu → **Chủ nhà**, Quản lý toà nhà → **Quản lý toà**, Thợ sửa chữa → **Thợ**) · Số toà · Tình trạng (chấm `ok` "Hoạt động" / chấm thường "Đã khoá") · nút thường "Sửa".
- "Khoá tài khoản" dùng `variant="danger"` và hỏi lại bằng `ConfirmDialog`. **Không bao giờ** là nút chính.
- `TaiKhoanTruyCap.tsx`: ăn token, sửa chữ, giữ luồng.

### T6 · Trạng thái chung (ảnh 36)
Trong các màn của lô này, áp đúng 4 trạng thái bằng component y0:
- đang tải: khung xương;
- rỗng: một câu và một việc;
- lỗi trong khối: "Tải lại";
- mất mạng: `SyncBanner`, nút ghi `blocked`.

Ô nhập sai báo lỗi ngay dưới ô. Báo xong dùng `Toast`.

## 5. Test
- `App.dangNhap.test.tsx` vẫn qua: đăng nhập thành công thì về `TRANG_DAU`; lỗi thì hiện dưới ô.
- `TimNhanh.test.tsx`: tìm ra màn không còn trong nav, ví dụ "Lịch xem phòng" → `/lich-hen`; Esc đóng; Enter mở.
- `ChuongThongBao.test.tsx`: số đếm nằm trong `aria-label`.
- `QuanLyTaiKhoan.test.tsx`: nhãn vai trò theo bảng tiếng nói; "Khoá" không phải `.btn-primary`; ≤ 1 `.btn-primary`.
- Test cho `TrangKhongCoQuyen` (thêm vào `App.test.tsx` phần của y8, hoặc tạo file test riêng `TrangKhongCoQuyen.test.tsx`): h1 nêu đúng vai trò sở hữu; nút "Về Hôm nay" khi vai trò là CHU.

## 6. Ảnh (`shots/y8/jobs.json`)
| Mã | Đường dẫn · vai · khung | So |
|---|---|---|
| 30 | `/dang-nhap` (không vai) 1440, 390 | `30-khung-dang-nhap-*` (**không bấm đăng nhập bằng tay**; job có `role` thì `app-shot.mjs` tự đăng nhập) |
| 32 | `/hom-nay` CHU 1440, mở tìm nhanh bằng phím (ghi cách mở vào báo cáo; nếu `app-shot.mjs` không mở được thì chỉ chụp ô tìm) | `32-chu-hom-nay-tim-1440` |
| 33 | `/hom-nay` QUAN_LY 1440 (ngăn thông báo) | `33-ql-hom-nay-tb-1440` |
| 37 | `/tai-khoan` CHU 1440 + 390 | `37-khung-khong-quyen-1440` |
| 38 | `/tai-khoan` QTHT 1440 + 390 | `38-qt-tai-khoan-1440` |
| – | `/thong-bao` QUAN_LY 1440 | chỉ token |
<!-- CHUNG -->
## Chung cho mọi lô V3 (đọc hết, không cần mở file khác)

**Bối cảnh.** Chủ tịch đã duyệt thiết kế V3 "Sổ cái" (`docs/design/ui-redesign/v3/`). V3 thay ux-v2 ở 5 điểm: font IBM Plex Sans; nút chính màu mực `#14181D` (bỏ teal, bỏ nền kem); tiền gom theo người; trang đầu trả lời câu hỏi của người dùng; 3 mật độ. Lô nền y0 đã gộp vào `feat/v3` các phần sau: token, font, mật độ, component chung, `tienTheoNguoi.ts`. Lô này chỉ dùng lại, **không** sửa các phần đó.

**Ràng buộc (vi phạm thì trả lô):**
- Không push, không merge, không đổi nhánh khác ngoài nhánh lô. Mỗi task một commit, message `ui(y8): …`.
- Không đổi quyền, route, API backend. Route cũ phải còn mở được. Không sửa `api.ts`, `managementApi.ts`, `financeApi.ts`, `workerDashboardApi.ts`, `backend/**`, `package*.json`. Không thêm dependency.
- App demo `http://localhost:5190` (cũng là backend cho vite dev): **chỉ GET**. Lệnh ghi duy nhất được phép là đăng nhập (`POST /api/auth/login`, do `app-shot.mjs` làm). Luồng ghi (ghi thu, khoá chỉ số, gửi hoá đơn, duyệt…) chỉ được chứng minh bằng test mock `fetch`, không bấm trên app thật.
- **Không in mật khẩu hay token ra output**: không `cat`/`sed`/`grep` dòng 8 của `docker-compose.demo.yml`, không `echo $MA_DEMO_PASSWORD`, không log header `Authorization`.
- Chỉ sửa file trong mục "File được sửa" của brief này. Cần sửa file khác thì dừng lại, ghi vào báo cáo (mục "Cần lô khác").
- Tên file mới không được trùng tên file có sẵn khi bỏ phân biệt hoa/thường, vì repo còn chạy trên Windows.
- Test cũ chỉ sửa khi UI đổi hợp lệ, và ghi lý do cho **từng** test. Không xoá test, không `skip`. Nếu phải sửa quá ~30 test thì dừng, báo controller.
- `App*.test.tsx` thuộc lô nền. Lô này chỉ được sửa những `it(...)` kiểm màn của lô mình, và ghi tên từng `it` vào báo cáo.

**Quy tắc thiết kế V3 (03-he-thiet-ke.md):**
- Mật độ do App tự đặt `data-density` ở `.ma-app-shell`: Chủ/QL/QTHT trên máy tính dùng `lam-viec` (thân 15/22, nút 36, hàng 48); màn < 768 dùng `chu-m` (thân 16/24, nút 44, hàng 60); Người thuê và Thợ dùng `thoang` (thân 17/26, nút 52, hàng 64, chữ nhỏ nhất 16). Màn **không** tự đặt cỡ chữ hay chiều cao px. Chỉ dùng token `--ma-text-*`, `--ma-control-h`, `--ma-row-h`, `--ma-space-*`.
- Màu: không viết hex trong `.tsx`/`.css` của màn, chỉ dùng `var(--ma-…)`. Đỏ `--ma-urgent` chỉ dành cho tiền nợ / quá hạn / khẩn. Vàng `--ma-waiting` dùng cho việc chờ. Xanh `--ma-text-link` dùng cho đường dẫn.
- Nút: **tối đa 1 nút chính** (`<Button variant="primary">`, nền mực) mỗi màn. Màn chỉ đọc không có nút chính. Việc phá huỷ (thanh lý, từ chối, khoá tài khoản) không bao giờ là nút chính, dùng `variant="secondary"` và nhãn kết thúc bằng "…" để mở hỏi lại. Hành động lặp lại theo dòng dùng nút thường. Trên điện thoại, nút chính đặt trong `<ChanDinh>` (dính đáy).
- Chữ: Plex 400/500/600. Không 700, không IN HOA, không nghiêng, không `letterSpacing` dương, không font mono. Nhãn nút là động từ + đối tượng ("Ghi thu 7.580.000 ₫", "Giao thợ"), không bao giờ là "OK".
- Bảng tiếng nói: Kỳ → **Tháng** ("Tháng 11/2026"); Chốt kỳ → **Khoá chỉ số**; Phát hành hoá đơn → **Gửi hoá đơn**; Thực thu → **Đã thu**; Công nợ → **Còn nợ**; Phân công → **Giao thợ**; Lấp đầy x% → "**27/36 phòng đang thuê**"; Chủ sở hữu → **Chủ nhà**; Yêu cầu sửa chữa → **Sự cố**; Lịch hẹn → **Lịch xem phòng**.
- Số tiền: `dinhDangTien` (`design/core/format.ts`), dạng `7.580.000 ₫`. Ngày: `dd/mm/yyyy`. SĐT: `dinhDangSdt` → `0999 100 001`. Tháng của hoá đơn: `nhanThang(h)` → `7/2026`.
- Thiếu backend: dùng `<NhanMinhHoa>` ("minh hoạ" / "cần backend") ngay cạnh phần đó, hoặc ẩn đi. Không để nút chết, không dựng số giả như thật.
- Trạng thái bắt buộc cho mỗi khối có tải dữ liệu: **đang tải** (khung xương giữ chỗ, không nhảy bố cục) · **rỗng** (một câu + một việc làm tiếp) · **lỗi** (báo ngay trong khối + "Tải lại", không xoá số cũ nếu có) · **mất mạng** (`SyncBanner` của khung đã lo; nút ghi `blocked` + lý do).
- Vai trò không gọi được một API (QL bị 403 ở `/api/bao-cao/cong-no`, `/api/dashboard/chu`; Người thuê bị 403 ở `/api/toa-nha/:id/ben-a`): **ẩn** control đó cho vai trò ấy, không hiện lỗi 403.

**Component chung y0 đã có (import từ `design/…`, không sửa):** `Button` (`variant` primary|secondary|text, `size`, `blocked` + `blockedReason`), `StatusTag` (tone), `DataTable` (`tongHang`, `rowProps`, `chips`), `Card`, `Field`/`Input`/`Select`, `EmptyState`, `Toast`, `ConfirmDialog`, `SyncBanner`, `Breadcrumb`, **mới:** `DauTrang`, `KhoiSo`, `DongViec`, `DongNguoiNo`, `ThanhBuoc`, `HangTong`, `NhanMinhHoa`, `ChanDinh`. Interface xem phần "Hợp đồng dùng" của brief này. Logic: `tienTheoNguoi.ts` (`nhanThang`, `docSoTien`, `phanBoThu`, `ghiThuLanLuot`, `tinNhacNo`, `linkZalo`, `chuanSdt`, `dinhDangSdt`), `nhomNoTheoNguoi.ts` (`tuCongNo`, `tuHoaDonQuanLy`, `nhomNo`, `locNo`, `hangTong`), `TrangProps = { token, vaiTro, mobile, thamSo, dieuHuong }`.

**Bắt đầu (macOS):**
```bash
cd ~/Documents/PRJ/MiniApart-ui && git worktree add ~/Documents/PRJ/MiniApart-y8 -b ui/y8-khung feat/v3
cd ~/Documents/PRJ/MiniApart-y8/frontend && npm ci && npx tsc -b && npx vitest run   # ghi lại số test mốc
```
Ghi file ctx cho lô ở `${TMPDIR:-/tmp}/v3-y8-ctx.md`, gồm: mốc test, task đang làm, commit đã có, việc còn lại. Cập nhật sau mỗi task để phiên sau làm tiếp được. Không commit file này.

**Lệnh kiểm (chạy trước mỗi commit và cuối lô, trong `~/Documents/PRJ/MiniApart-y8/frontend`):**
```bash
npx tsc -b && npx vitest run && npm run build      # vitest có sẵn guard designTokens.test.ts (Inter/teal/mono/IN HOA/hex)
git diff --stat feat/v3...HEAD                                  # chỉ được có file trong "File được sửa" + shots/y8
```

**Chụp ảnh nghiệm thu (dữ liệu thật, chỉ GET):**
```bash
cd ~/Documents/PRJ/MiniApart-y8/frontend && (VITE_BACKEND_URL=http://localhost:5190 npx vite --port 5380 --strictPort > ${TMPDIR:-/tmp}/vite-y8.log 2>&1 &)
cd ~/Documents/PRJ/MiniApart-y8
export TASTE_CDP=~/.hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs MA_APP_URL=http://localhost:5380
export MA_DEMO_PASSWORD="$(python3 -c "import re,pathlib;l=pathlib.Path('~/Documents/PRJ/MiniApart-ui/docker-compose.demo.yml').expanduser().read_text(encoding='utf-8').splitlines()[7];print(re.search(r'mật khẩu (\S+?)\)',l).group(1))")"   # không echo
node docs/design/ui-redesign/tools/app-shot.mjs docs/design/ui-redesign/v3/shots/y8/jobs.json docs/design/ui-redesign/v3/shots/y8
```
`jobs.json` có dạng `[{ "name": "<mã>-<khung>", "path": "/…", "role": "CHU"|"QUAN_LY"|"THO"|"NGUOI_THUE"|"QTHT", "w": 1440|390, "h": 900|844, "full": true }]`. Đặt ảnh cạnh ảnh V3 cùng mã trong `docs/design/ui-redesign/v3/screens/png/` để so. Xong thì tắt vite (`pkill -f "vite --port 5380"`).

**Tiêu chí nghiệm thu đo được (lấy từ `qa.json` do `app-shot.mjs` ghi ra):** `horizontalOverflow` 0 · `belowHit` 0 (ngưỡng ≥36 desktop, ≥44 ở 390 và ở mọi màn Người thuê/Thợ) · `contrast.below` 0 (≥4.5) · `textBelowFloor` 0 (≥13; Người thuê/Thợ ≥16) · `h1.count` = 1 (ghi `h1.left`/`h1.top`) · `noAccessibleName` 0. Với từng ảnh, ghi rõ **khác prototype ở đâu** và **cái gì đổi giữa 1440 và 390**.

**Báo cáo cuối lô:** `docs/design/ui-redesign/v3/shots/y8/BAO-CAO.md`, gồm:
1. Việc theo task, kèm hash commit.
2. Lệnh kiểm đã chạy thật và số test (mốc → sau).
3. Bảng ảnh: mã · khung · khác prototype ở đâu.
4. Test cũ đã sửa, lý do từng test.
5. Không làm / chưa kiểm / cần lô khác / phụ thuộc backend.

Báo cáo viết ngắn, tiếng Việt.
<!-- /CHUNG -->
