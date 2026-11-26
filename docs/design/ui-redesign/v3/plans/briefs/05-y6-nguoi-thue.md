# Brief y6 — Người thuê (điện thoại, mật độ thoáng): Tiền nhà · Trả tiền · Báo hỏng · Phòng tôi · Lịch sử

Nhánh `ui/y6-nguoi-thue` · worktree `~/Documents/PRJ/MiniApart-y6` · cổng vite `5360` · ≤ 55′ · đợt 1 (sau y0).

## 1. Mục tiêu
Người thuê mở app là thấy ngay: **"Tôi phải trả bao nhiêu, trả thế nào."** Mỗi màn có đúng một việc chính, đặt ở nút dính đáy. Chữ thân ≥ 16, vùng chạm ≥ 44. Lô y0 đã đặt mật độ `thoang` cho vai `NGUOI_THUE`; lô này không tự đặt cỡ chữ.

## 2. File được sửa
`frontend/src/CanTra.tsx` + `CanTra.css` (`/hoa-don-cua-toi`), `HoaDon.tsx` (chi tiết hoá đơn; cũng là màn chi tiết của Chủ/QL qua `?toaNhaId&kyId&hoaDonId`), `LichSuHoaDon.tsx` (`/lich-su`), `BaoHongKhach.tsx` (`/bao-hong`), `HopDongNguoiThue.tsx` (`/hop-dong` của người thuê), `BieuDoTieuThu.tsx` (`/tieu-thu`), test cùng tên; `docs/design/ui-redesign/v3/shots/y6/`.
**Không sửa:** `FinancePaymentPanel.tsx` (y1), `InvoiceActions.tsx` (y5), `ManagementShared.tsx`, `design/**`, `App.tsx`, `roleNavigation.ts`. Nav 4 mục (Tiền nhà · Báo hỏng · Phòng tôi · Lịch sử) do y0 đã làm.

## 3. Hợp đồng
- Dùng từ y0: `ChanDinh`, `KhoiSo`, `NhanMinhHoa`, `Button`, `EmptyState`, `Field`. Hàm `nhanThang`, `dinhDangSdt`.
- Dùng từ y1: `FinancePaymentPanel` (default export và props giữ nguyên). `HoaDon.tsx` đang render nó cho Chủ/QL; chỉ được gọi, không được sửa.
- **Cung cấp cho y7:** `CanTra.tsx` export `Tieu`, giữ chữ ký `({ mobile, children, className, id, style })`. `ThoCongViec.tsx` đang import nó. Được đổi kiểu bên trong, không được đổi props.
- `HoaDon.tsx` phục vụ cả Chủ/QL (`cheDoCongNo`, chi tiết quản lý). Phần của Chủ/QL chỉ đổi chữ ("Kỳ" → "Tháng" ở dòng `Kỳ {ky}`) và token, không đổi luồng.

## 4. Hành vi (trích `app2.js` `M['kh/*']`; ảnh `21–25-kh-*-390`)

### T1 · Tiền nhà (`CanTra.tsx`, ảnh 21)
- Đầu màn đặt `h1` "Phòng 101", phụ là tên toà, chuông thông báo ở đầu (khung đã có).
- Khối lớn:
  - "Bạn cần trả";
  - số lớn đỏ "7.580.000 ₫";
  - "4 tháng chưa trả đủ. Tháng cũ nhất quá hạn từ **dd/mm/yyyy**.";
  - **nút chính** (giãn hết ngang) "Trả 7.580.000 ₫" → `?tra=tat-ca`, giữ đúng giá trị query hiện tại;
  - nút chữ "Chỉ trả tháng 7 trước · 1.895.000 ₫" → `?tra=<hoaDonId>`.
- Khối "Gồm các tháng": mỗi tháng một dòng "Tháng 7/2026", phụ đỏ "trễ 113 ngày", bên phải số còn nợ.
- Khối "Tháng <mới nhất> tính thế nào": các dòng khoản (Tiền phòng, Điện "đầu → cuối · sl × đơn giá", Nước…) và "Cộng tháng N". Dữ liệu lấy từ hoá đơn mới nhất đang tải.
- **Không nợ** (làm mới tối thiểu):
  - số lớn "0 ₫" màu chữ thường;
  - câu "Bạn đã trả đủ mọi hoá đơn.";
  - nút thường "Xem lịch sử" → `/lich-su`;
  - **không có nút chính**.
- Đổi mọi chữ "kỳ" thành "tháng" (ví dụ "Chỉ trả kỳ…" → "Chỉ trả tháng 7 trước…").

### T2 · Trả tiền (`CanTra.tsx` khi có `?tra=`, ảnh 22)
- Đầu màn: nút "← Quay lại" về `/hoa-don-cua-toi`, h1 "Trả tiền", phụ "4 tháng còn nợ" hoặc "Tháng 7/2026".
- Ảnh V3 có QR, số tài khoản, chủ tài khoản. Người thuê **bị 403** ở `/api/toa-nha/:id/ben-a`, nên:
  - **ẩn** QR và số tài khoản (không vẽ QR giả);
  - giữ khối "Số tiền" (số lớn);
  - giữ "Nội dung chuyển khoản" theo quy tắc đang có trong code, nút "Chép" (`data-chep-noi-dung` giữ nguyên);
  - thêm một khối có `NhanMinhHoa` "cần backend": "Chưa hiện được số tài khoản trong app. Hỏi quản lý số tài khoản của toà." kèm nút thường "Gọi quản lý · 0999 000 020" (`tel:`). SĐT quản lý lấy từ hợp đồng hoặc toà mà người thuê đọc được; không có thì bỏ nút.
- Bỏ dòng "Mã QR chưa có (chờ API)." vì khối trên đã nói thay. Phải sửa test `data-qr-chua-co` và ghi lý do.
- Nút "Tôi đã chuyển khoản" của V3 **ẩn**, vì chưa có API báo quản lý. Thay bằng câu "Chuyển xong, gọi hoặc nhắn quản lý để xác nhận. Khoản nợ sẽ tự trừ khi quản lý ghi thu."
- Màn này **không có nút chính**: việc chính (chuyển khoản) làm ở app ngân hàng. Nút Chép là nút thường giãn hết ngang.

### T3 · Báo hỏng (`BaoHongKhach.tsx`, ảnh 23)
- Đầu màn: h1 "Báo hỏng", phụ "Phòng 101".
- Khối:
  - "Hỏng cái gì?": lưới 3×2 ô chọn có icon (Điện · Nước · Điều hoà · Khoá cửa · Internet · Khác). Ô ≥ 52px, ô đang chọn viền mực. Ánh xạ sang hạng mục mà API đang nhận; không có hạng mục tương ứng thì dùng "Khác" kèm mô tả;
  - "Mô tả ngắn" (textarea, placeholder "Ví dụ: đèn nhà tắm chập chờn từ tối qua");
  - nút thường "Chụp ảnh chỗ hỏng", chỉ khi luồng ảnh đang có, nếu không thì ẩn;
  - ô "Khẩn cấp (mất điện, rò nước, không an toàn)", vùng chạm 52px.
- Khối "Đã báo": danh sách sự cố đã gửi, gồm trạng thái và thợ. Rỗng: "Bạn chưa báo hỏng lần nào. Khi gửi, bạn sẽ thấy thợ nào nhận và bao giờ đến."
- **Nút chính** "Gửi báo hỏng" trong `ChanDinh`. Giữ API và payload cũ. Gửi xong thì toast "Đã gửi. Quản lý sẽ gọi lại trong hôm nay."; câu sau chỉ dùng nếu đúng quy trình, nếu không thì chỉ "Đã gửi báo hỏng."

### T4 · Phòng tôi (`HopDongNguoiThue.tsx`, ảnh 24)
- Đầu màn: h1 "Phòng tôi", phụ "Phòng 101 · <toà>".
- Khối lớn:
  - "Hợp đồng thuê đến" + số lớn "dd/mm/yyyy";
  - "Còn N ngày. Muốn trả phòng, báo trước **30 ngày**.";
  - Bắt đầu thuê · Tiền phòng "/ tháng" · Tiền cọc đã đóng.
- Khối "Giá dịch vụ": các dòng dịch vụ.
- Nút thường "Tải hợp đồng (PDF)" (chỉ khi có chức năng thật, nếu không thì ẩn) và "Gọi quản lý · 0999 000 020" (`tel:`).
- **Không có nút chính**: màn chỉ đọc.

### T5 · Lịch sử (`LichSuHoaDon.tsx` + `BieuDoTieuThu.tsx`, ảnh 25)
- `/lich-su`: h1 "Lịch sử", phụ "Hoá đơn và điện nước".
  - Khối "Hoá đơn": "Tháng 10/2026", phụ "đã trả đủ" hoặc "đã trả 1.000.000 ₫, còn 895.000 ₫", bên phải tổng. Bấm vào → chi tiết.
  - Khối "Điện nước đã dùng": bảng Tháng · Điện kWh · Nước m³, lấy từ `fetchTieuThuCuaNguoiThue`.
- `/tieu-thu` vẫn mở được (route giữ). Chỉ đổi token và chữ, giữ biểu đồ.
- Chi tiết hoá đơn (`HoaDon.tsx`, người thuê): đổi chữ "Kỳ" → "Tháng", các dòng khoản theo T1. Nút chính "Trả X ₫" → `/hoa-don-cua-toi?tra=<id>` khi còn nợ.

## 5. Test
- `CanTra.test.tsx`:
  - đúng 1 `.btn-primary` "Trả 7.580.000 ₫" khi nợ, 0 khi không nợ;
  - trường hợp không nợ có câu "Bạn đã trả đủ mọi hoá đơn.";
  - màn Trả tiền không có QR và số tài khoản, có nhãn "cần backend", có nút Chép;
  - không còn chữ "kỳ".
- `BaoHongKhach.test.tsx`: chọn ô rồi gửi thì payload giữ như cũ; nút chính nằm trong `ChanDinh`.
- `HopDongNguoiThue.test.tsx`: không có `.btn-primary`.
- `HoaDon.test.tsx`: luồng Chủ/QL (`cheDoCongNo`, chi tiết) vẫn qua.
- `App.test.tsx`: chỉ sửa `it` về màn người thuê, ghi tên.

## 6. Ảnh (`shots/y6/jobs.json`, vai `NGUOI_THUE`, 390×844, `full: true`; thêm 1440 cho T1)
| Mã | Đường dẫn | So |
|---|---|---|
| 21 | `/hoa-don-cua-toi` (390 và 1440) | `21-kh-can-tra-390` |
| 22 | `/hoa-don-cua-toi?tra=tat-ca` | `22-kh-tra-tien-390` (không có QR/STK: ghi rõ) |
| 23 | `/bao-hong` | `23-kh-bao-hong-390` (**không bấm Gửi**) |
| 24 | `/hop-dong` | `24-kh-hop-dong-390` |
| 25 | `/lich-su` | `25-kh-lich-su-390` |

Ngưỡng của lô này: `textBelowFloor` 0 với sàn **16px**, `belowHit` 0 với ngưỡng **44**. Từ y0, `qa-probe.js` tự áp ngưỡng này khi gặp `[data-density="thoang"]`.
<!-- CHUNG -->
## Chung cho mọi lô V3 (đọc hết, không cần mở file khác)

**Bối cảnh.** Chủ tịch đã duyệt thiết kế V3 "Sổ cái" (`docs/design/ui-redesign/v3/`). V3 thay ux-v2 ở 5 điểm: font IBM Plex Sans; nút chính màu mực `#14181D` (bỏ teal, bỏ nền kem); tiền gom theo người; trang đầu trả lời câu hỏi của người dùng; 3 mật độ. Lô nền y0 đã gộp vào `feat/v3` các phần sau: token, font, mật độ, component chung, `tienTheoNguoi.ts`. Lô này chỉ dùng lại, **không** sửa các phần đó.

**Ràng buộc (vi phạm thì trả lô):**
- Không push, không merge, không đổi nhánh khác ngoài nhánh lô. Mỗi task một commit, message `ui(y6): …`.
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
cd ~/Documents/PRJ/MiniApart-ui && git worktree add ~/Documents/PRJ/MiniApart-y6 -b ui/y6-nguoi-thue feat/v3
cd ~/Documents/PRJ/MiniApart-y6/frontend && npm ci && npx tsc -b && npx vitest run   # ghi lại số test mốc
```
Ghi file ctx cho lô ở `${TMPDIR:-/tmp}/v3-y6-ctx.md`, gồm: mốc test, task đang làm, commit đã có, việc còn lại. Cập nhật sau mỗi task để phiên sau làm tiếp được. Không commit file này.

**Lệnh kiểm (chạy trước mỗi commit và cuối lô, trong `~/Documents/PRJ/MiniApart-y6/frontend`):**
```bash
npx tsc -b && npx vitest run && npm run build      # vitest có sẵn guard designTokens.test.ts (Inter/teal/mono/IN HOA/hex)
git diff --stat feat/v3...HEAD                                  # chỉ được có file trong "File được sửa" + shots/y6
```

**Chụp ảnh nghiệm thu (dữ liệu thật, chỉ GET):**
```bash
cd ~/Documents/PRJ/MiniApart-y6/frontend && (VITE_BACKEND_URL=http://localhost:5190 npx vite --port 5360 --strictPort > ${TMPDIR:-/tmp}/vite-y6.log 2>&1 &)
cd ~/Documents/PRJ/MiniApart-y6
export TASTE_CDP=~/.hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs MA_APP_URL=http://localhost:5360
export MA_DEMO_PASSWORD="$(python3 -c "import re,pathlib;l=pathlib.Path('~/Documents/PRJ/MiniApart-ui/docker-compose.demo.yml').expanduser().read_text(encoding='utf-8').splitlines()[7];print(re.search(r'mật khẩu (\S+?)\)',l).group(1))")"   # không echo
node docs/design/ui-redesign/tools/app-shot.mjs docs/design/ui-redesign/v3/shots/y6/jobs.json docs/design/ui-redesign/v3/shots/y6
```
`jobs.json` có dạng `[{ "name": "<mã>-<khung>", "path": "/…", "role": "CHU"|"QUAN_LY"|"THO"|"NGUOI_THUE"|"QTHT", "w": 1440|390, "h": 900|844, "full": true }]`. Đặt ảnh cạnh ảnh V3 cùng mã trong `docs/design/ui-redesign/v3/screens/png/` để so. Xong thì tắt vite (`pkill -f "vite --port 5360"`).

**Tiêu chí nghiệm thu đo được (lấy từ `qa.json` do `app-shot.mjs` ghi ra):** `horizontalOverflow` 0 · `belowHit` 0 (ngưỡng ≥36 desktop, ≥44 ở 390 và ở mọi màn Người thuê/Thợ) · `contrast.below` 0 (≥4.5) · `textBelowFloor` 0 (≥13; Người thuê/Thợ ≥16) · `h1.count` = 1 (ghi `h1.left`/`h1.top`) · `noAccessibleName` 0. Với từng ảnh, ghi rõ **khác prototype ở đâu** và **cái gì đổi giữa 1440 và 390**.

**Báo cáo cuối lô:** `docs/design/ui-redesign/v3/shots/y6/BAO-CAO.md`, gồm:
1. Việc theo task, kèm hash commit.
2. Lệnh kiểm đã chạy thật và số test (mốc → sau).
3. Bảng ảnh: mã · khung · khác prototype ở đâu.
4. Test cũ đã sửa, lý do từng test.
5. Không làm / chưa kiểm / cần lô khác / phụ thuộc backend.

Báo cáo viết ngắn, tiếng Việt.
<!-- /CHUNG -->
