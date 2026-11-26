# Brief y9 — Dọn & đo: màn "giữ" ăn token · quét chữ/hex sót · đo 1440/1024/390 · cập nhật progress

Nhánh `ui/y9-don` · worktree `~/Documents/PRJ/MiniApart-y9` · cổng vite `5390` · ≤ 60′ · **đợt 2**: tạo worktree từ `feat/v3` **sau khi** controller đã gộp đủ y0…y8.

## 1. Mục tiêu
Sau khi các lô đợt 1 đã gộp, toàn app phải đồng nhất V3:
- không còn Inter, teal hay kem;
- không còn chữ cũ (Kỳ, Chốt kỳ, Phát hành, Thực thu, Lấp đầy, Chủ sở hữu, Công nợ);
- không còn hex cứng ngoài tập đã cho phép;
- mỗi màn có đúng 1 `h1` ở vị trí nhất quán;
- số đo QA đạt ở 1440, 1024 và 390.

Lô này cũng làm "giữ màn cũ, chỉ ăn token/khung" cho các màn V3 chưa vẽ.

## 2. File được sửa
- **Màn giữ:**
  - `DichVuVaKy.tsx` (`/dich-vu`, Giá dịch vụ & cài đặt);
  - `QuanLyLichHen.tsx` (`/lich-hen`, Lịch xem phòng);
  - `TuanThuVanHanh.tsx` (gồm `AnToanVanHanh` `/an-toan`, `CuTruVanHanh` `/cu-tru`, `NhatKyVanHanh` `/nhat-ky-thao-tac`);
  - kèm test của các file này và `managementFlows.test.tsx`.
- **Không còn route** (chỉ còn import trong App; **không xoá file**, chỉ đổi token cho guard sạch):
  - `QuanLyDashboard.tsx`, `BangViecVanHanh.tsx`, `CongNoBaoCao.tsx`, `LichSuSuaChua.tsx`, `QuanLySuaChua.tsx`, `ViecCuaToi.tsx`, `ThoTongQuan.tsx`;
  - kèm test của các file này.
- **Dọn sót:** được sửa **bất kỳ file nào trong `frontend/src`**, nhưng chỉ để làm 3 việc:
  - (a) đổi chữ theo bảng tiếng nói;
  - (b) thay hex cứng bằng `var(--ma-…)`;
  - (c) bỏ `textTransform: uppercase`, `letterSpacing` dương, weight 700.

  Mỗi file ghi một dòng vào báo cáo theo dạng "file — đổi gì — vì sao". Không đổi bố cục hay logic của màn lô khác. Thấy lỗi bố cục thì ghi vào "Cần lô khác".
- `docs/design/ui-redesign/progress.md`, `docs/design/ui-redesign/v3/shots/y9/`.
- **Không sửa:** `App.tsx`, `dinhTuyen.ts`, `roleNavigation.ts`, `design/**`, `tokens/**`. Lỗi nằm ở đó thì ghi lại cho controller.

## 3. Hợp đồng dùng
Lô này dùng component y0: `DauTrang`, `DataTable` (`tongHang`, `chips`), `EmptyState`, `Button` (`danger`), `ConfirmDialog`, `Field`. Màn giữ được đổi sang `DauTrang` + `DataTable` nếu chỉ thay vỏ. Logic và API giữ nguyên.

Lý do giữ màn cũ:

| Màn | Lý do |
|---|---|
| Giá dịch vụ | Dùng vài lần mỗi năm |
| Lịch xem phòng | Hôm nay QL đã trả lời "hôm nay ai đến" (y1) |
| PCCC | Việc theo quý, Hôm nay đã có dòng nhắc |
| Nhật ký | Màn tra cứu |

V3 chưa vẽ các màn này, nên không đoán bố cục mới.

## 4. Việc

### T1 · Màn giữ ăn token và khung
Với từng màn trong danh sách giữ:
1. Đổi đầu trang sang `DauTrang` với đúng một `h1`:
   - "Giá dịch vụ & cài đặt", phụ "<toà> · áp dụng cho hoá đơn từ tháng sau";
   - "Lịch xem phòng";
   - "An toàn PCCC";
   - "Người ở cùng & tạm trú" (cho `/cu-tru`; giữ nhãn hiện có nếu đã rõ);
   - "Nhật ký".
2. Bảng chuyển sang `DataTable`, nếu đang là bảng tự viết và việc thay không đổi hành vi. Không chắc thì giữ bảng, chỉ đổi token.
3. Chữ đổi theo bảng tiếng nói. Ví dụ "Kỳ thanh toán" → "Tháng tính tiền", "Chốt kỳ sau N ngày" → "Khoá chỉ số sau N ngày".
4. Nút: ≤ 1 nút chính mỗi màn, việc phá huỷ dùng `danger`.

### T2 · Quét sót toàn app
Chạy trong `frontend/`. Kết quả phải **rỗng**, hoặc mỗi dòng còn lại có lý do ghi trong báo cáo:
```bash
grep -rnE "\bKỳ\b|\bkỳ\b|Chốt kỳ|Phát hành|Thực thu|Lấp đầy|Chủ sở hữu|Công nợ" src --include=*.tsx | grep -v "\.test\." | grep -v "^\s*//"
grep -rnE "#[0-9a-fA-F]{3,8}\b" src --include=*.tsx --include=*.css | grep -v "\.test\." | grep -v "tokens/"
grep -rnE "uppercase|fontWeight:\s*700|font-weight:\s*700|letterSpacing:\s*'0?\.[0-9]" src --include=*.tsx --include=*.css | grep -v "\.test\."
```
Lúc lập plan (trước đợt 1) các lệnh trên cho ra: 194 dòng "Kỳ/kỳ"; 15 file còn chữ cũ; hex cứng nhiều nhất ở ThoChiPhi (40), ThoCongViec (33), components.css (19), HopDongThaoTac (9), QuanLyDashboard (4), Button (3). Ghi số **trước** và **sau** lô này.

"Kỳ" chỉ được giữ ở 2 chỗ:
- tên biến hay kiểu dữ liệu trong code (`kyId`, `ThongTinKyThanhToan`);
- nội dung pháp lý của hợp đồng, nếu đúng là văn bản hợp đồng.

Ghi rõ từng chỗ giữ.

### T3 · Đo toàn app ở 3 khung
Chụp bằng `app-shot.mjs` ở **1440×900, 1024×768, 390×844** cho ít nhất 16 route dưới đây. Mỗi ảnh ghi `h1.count`, `h1.left`, `h1.top`, `horizontalOverflow`, `belowHit`, `textBelowFloor`, `contrast.below`, `fontFamiliesUsed`:

| Vai | Route |
|---|---|
| CHU | `/hom-nay`, `/thu-tien`, `/toa-nha`, `/toa-nha/3`, `/phong/1`, `/nguoi-thue`, `/nguoi-thue/1`, `/hop-dong`, `/hop-dong/9`, `/su-co`, `/bao-cao`, `/dich-vu` |
| QUAN_LY | `/hom-nay`, `/chu-ky`, `/hop-dong/moi`, `/lich-hen`, `/an-toan` |
| QTHT | `/tai-khoan`, `/nhat-ky-thao-tac` |
| THO | `/viec-cua-toi`, `/tho/chi-phi` |
| NGUOI_THUE | `/hoa-don-cua-toi`, `/bao-hong`, `/hop-dong`, `/lich-su` |

Yêu cầu:
- **h1:** mọi màn ≥ 1024 có `h1.left` bằng nhau, lệch không quá 2px; `h1.top` cũng bằng nhau. Ở 390 cũng vậy. Màn lệch thì ghi tên và số px. Lệch do khung thì ghi cho controller, vì khung thuộc y0.
- **Mỗi khung:** báo **cái gì đã đổi** so với khung lớn hơn. Ví dụ ở 1024: sidebar thu thành icon, ô "Phòng đang thuê" ẩn hay không; ở 390: bảng thành danh sách, nút chính dính đáy, nav đáy.
- **Ngưỡng:**
  - `horizontalOverflow` 0;
  - `belowHit` 0 (≥ 36 desktop, ≥ 44 ở 390 và với Người thuê / Thợ);
  - `textBelowFloor` 0 (≥ 13; Người thuê / Thợ ≥ 16);
  - `contrast.below` 0;
  - `fontFamiliesUsed` chỉ có IBM Plex Sans.
- Màn không đạt thì ghi "màn — chỉ số — lô sở hữu".

### T4 · Bảng so V3
Tạo `shots/y9/SO-V3.md`. Với mỗi mã ảnh V3 trong `v3/screens/png/` (01…38), ghi 3 thứ:
- ảnh app cùng mã (lấy từ `shots/y1…y8` hoặc chụp mới);
- **đạt** / **khác có lý do** (kèm lý do, ví dụ "không có QR: cần backend") / **chưa làm**;
- lô sở hữu.

Nếu có ImageMagick (`magick -version`) thì ghép cặp ảnh bằng `v3/tools/compare.sh`; không có thì chỉ lập bảng.

### T5 · `progress.md`
Thêm mục "V3 — thi công" vào `docs/design/ui-redesign/progress.md`, gồm:
- các lô và hash commit gộp;
- số test trước và sau;
- bảng QA tóm tắt;
- phụ thuộc backend còn mở (tham chiếu y10);
- việc chưa làm.

## 5. Test
- Test của màn giữ phải qua. Test cũ khoá chữ "Kỳ" thì đổi và ghi lý do.
- Thêm vào `managementFlows.test.tsx` một test: `/dich-vu`, `/lich-hen`, `/an-toan`, `/nhat-ky-thao-tac` mỗi màn có đúng 1 `h1` và ≤ 1 `.btn-primary`.
- Không thêm guard mới vào `designTokens.test.ts` vì file đó thuộc y0. Nếu cần guard chữ cũ thì đề xuất cho controller.

## 6. Ảnh
`shots/y9/jobs.json` chứa 16+ route × 3 khung như T3. Không bấm nút ghi nào.
<!-- CHUNG -->
## Chung cho mọi lô V3 (đọc hết, không cần mở file khác)

**Bối cảnh.** Chủ tịch đã duyệt thiết kế V3 "Sổ cái" (`docs/design/ui-redesign/v3/`). V3 thay ux-v2 ở 5 điểm: font IBM Plex Sans; nút chính màu mực `#14181D` (bỏ teal, bỏ nền kem); tiền gom theo người; trang đầu trả lời câu hỏi của người dùng; 3 mật độ. Lô nền y0 đã gộp vào `feat/v3` các phần sau: token, font, mật độ, component chung, `tienTheoNguoi.ts`. Lô này chỉ dùng lại, **không** sửa các phần đó.

**Ràng buộc (vi phạm thì trả lô):**
- Không push, không merge, không đổi nhánh khác ngoài nhánh lô. Mỗi task một commit, message `ui(y9): …`.
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
cd ~/Documents/PRJ/MiniApart-ui && git worktree add ~/Documents/PRJ/MiniApart-y9 -b ui/y9-don feat/v3
cd ~/Documents/PRJ/MiniApart-y9/frontend && npm ci && npx tsc -b && npx vitest run   # ghi lại số test mốc
```
Ghi file ctx cho lô ở `${TMPDIR:-/tmp}/v3-y9-ctx.md`, gồm: mốc test, task đang làm, commit đã có, việc còn lại. Cập nhật sau mỗi task để phiên sau làm tiếp được. Không commit file này.

**Lệnh kiểm (chạy trước mỗi commit và cuối lô, trong `~/Documents/PRJ/MiniApart-y9/frontend`):**
```bash
npx tsc -b && npx vitest run && npm run build      # vitest có sẵn guard designTokens.test.ts (Inter/teal/mono/IN HOA/hex)
git diff --stat feat/v3...HEAD                                  # chỉ được có file trong "File được sửa" + shots/y9
```

**Chụp ảnh nghiệm thu (dữ liệu thật, chỉ GET):**
```bash
cd ~/Documents/PRJ/MiniApart-y9/frontend && (VITE_BACKEND_URL=http://localhost:5190 npx vite --port 5390 --strictPort > ${TMPDIR:-/tmp}/vite-y9.log 2>&1 &)
cd ~/Documents/PRJ/MiniApart-y9
export TASTE_CDP=~/.hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs MA_APP_URL=http://localhost:5390
export MA_DEMO_PASSWORD="$(python3 -c "import re,pathlib;l=pathlib.Path('~/Documents/PRJ/MiniApart-ui/docker-compose.demo.yml').expanduser().read_text(encoding='utf-8').splitlines()[7];print(re.search(r'mật khẩu (\S+?)\)',l).group(1))")"   # không echo
node docs/design/ui-redesign/tools/app-shot.mjs docs/design/ui-redesign/v3/shots/y9/jobs.json docs/design/ui-redesign/v3/shots/y9
```
`jobs.json` có dạng `[{ "name": "<mã>-<khung>", "path": "/…", "role": "CHU"|"QUAN_LY"|"THO"|"NGUOI_THUE"|"QTHT", "w": 1440|390, "h": 900|844, "full": true }]`. Đặt ảnh cạnh ảnh V3 cùng mã trong `docs/design/ui-redesign/v3/screens/png/` để so. Xong thì tắt vite (`pkill -f "vite --port 5390"`).

**Tiêu chí nghiệm thu đo được (lấy từ `qa.json` do `app-shot.mjs` ghi ra):** `horizontalOverflow` 0 · `belowHit` 0 (ngưỡng ≥36 desktop, ≥44 ở 390 và ở mọi màn Người thuê/Thợ) · `contrast.below` 0 (≥4.5) · `textBelowFloor` 0 (≥13; Người thuê/Thợ ≥16) · `h1.count` = 1 (ghi `h1.left`/`h1.top`) · `noAccessibleName` 0. Với từng ảnh, ghi rõ **khác prototype ở đâu** và **cái gì đổi giữa 1440 và 390**.

**Báo cáo cuối lô:** `docs/design/ui-redesign/v3/shots/y9/BAO-CAO.md`, gồm:
1. Việc theo task, kèm hash commit.
2. Lệnh kiểm đã chạy thật và số test (mốc → sau).
3. Bảng ảnh: mã · khung · khác prototype ở đâu.
4. Test cũ đã sửa, lý do từng test.
5. Không làm / chưa kiểm / cần lô khác / phụ thuộc backend.

Báo cáo viết ngắn, tiếng Việt.
<!-- /CHUNG -->
