# Brief y3 — Danh mục & Hợp đồng: Toà & phòng · Phòng (QL) · bảng Hợp đồng · Tạo hợp đồng

Nhánh `ui/y3-hop-dong` · worktree `~/Documents/PRJ/MiniApart-y3` · cổng vite `5330` · ≤ 55′ · đợt 1 (sau y0).

## 1. Mục tiêu
- Danh sách toà và phòng cho thấy ngay "đang thuê bao nhiêu, ai nợ".
- Bảng hợp đồng mở sẵn ở nhóm **Cần xử lý**.
- Tạo hợp đồng trên **một trang**, điền từ trên xuống. Cột phải luôn hiện "Thu khi ký" và "Còn thiếu".

## 2. File được sửa
`frontend/src/DanhMucToaNha.tsx` (`/toa-nha`), `DanhMucPhong.tsx` (`/phong`, QL), `HopDongQuanLy.tsx` (`/hop-dong`), `TaoHopDong.tsx` + `TaoHopDong.css` (`/hop-dong/moi`), `HopDongThaoTac.tsx`, `QuanLyTaiSanPhong.tsx`, test cùng tên + `HopDongThaoTacCon.test.tsx`; `docs/design/ui-redesign/v3/shots/y3/`.
**Không sửa:** `HoSo*360.tsx` (y2), `bangQuanTriChung.tsx`, `ManagementShared.tsx`, `design/**` (y0). Riêng `stylesCleanup.test.ts` đang khoá `DanhMucPhong` dùng `<DataTable` và không có `styleNhanTruong`/`styleThongBao`: phải giữ đúng như vậy.

## 3. Hợp đồng
- Dùng của y0: `DauTrang`, `KhoiSo`, `DataTable` (`tongHang`, `chips`), `ThanhBuoc`, `NhanMinhHoa`, `ChanDinh`, `Button` (`danger`), `Field`/`Input`/`Select`.
- **Cung cấp cho y2 (giữ nguyên trong đợt này):**
  - `HopDongThaoTac.tsx` export `GiaHan`, `Ky`, `ThanhLy`, `PhuLuc`, `NguoiOCung`: tên, props và hành vi gọi API giữ nguyên, chỉ được đổi kiểu bên trong;
  - `QuanLyTaiSanPhong.tsx` default export, props giữ nguyên.

  Đổi chữ ký thì y2 sẽ vỡ khi gộp. Nếu buộc phải đổi, dừng lại và báo controller.

## 4. Hành vi (trích `app.js` `M['chu/toa']`, `M['chu/hop-dong']`; `app2.js` `M['ql/hop-dong/moi']`; ảnh `06,11,20`)

### T1 · Toà & phòng (`DanhMucToaNha.tsx`, ảnh `11-chu-toa-1440`)
- `DauTrang`: tiêu đề "Toà & phòng" (QTHT: "Toà nhà"), `phu` "3 toà · 84 phòng".
- Mỗi toà là một thẻ ngang, bấm được → `/toa-nha/:id`. Thẻ gồm:
  - tên (tiêu đề khối) + "địa chỉ · N tầng";
  - sơ đồ nhỏ: mỗi phòng một chấm, chia theo tầng; đang thuê = mực, nợ = đỏ, trống = viền đứt;
  - "Đang thuê" "27/36 phòng" (ẩn khi < 768);
  - "Còn nợ" (đỏ);
  - mũi tên.
- Nợ của Chủ lấy từ `/api/bao-cao/cong-no`. QL và QTHT không gọi endpoint này mà **ẩn** cột Còn nợ, vì nợ của các vai này không gom được theo toà ở đây.
- Giữ nguyên các thao tác thêm/sửa toà đang có (QTHT), đổi kiểu sang token. Không có nút chính, trừ khi màn đang có "Thêm toà" cho QTHT; khi đó nút này là nút chính duy nhất.

### T2 · Phòng của QL (`DanhMucPhong.tsx`)
- Giữ `DataTable`. Chip theo trạng thái: Tất cả · Đang thuê · Trống · Đang sửa · Đang nợ (nếu đã có nguồn nợ trong màn; nếu không có thì bỏ chip này).
- Cột Còn nợ: đỏ khi > 0.
- Hành động theo dòng là nút thường: trống → "Tạo hợp đồng"; nợ → "Ghi thu" (`/thu-tien?nguoiThueId=`).
- Đổi chữ theo bảng tiếng nói.

### T3 · Bảng hợp đồng (`HopDongQuanLy.tsx`, ảnh `06-chu-hop-dong-1440/390`)
- `DauTrang`:
  - `phu` "<toà> · 27 đang hiệu lực · giữ cọc 98.000.000 ₫";
  - **nút chính** "Tạo hợp đồng" → `/hop-dong/moi`.
- Tab trong thẻ, ghi vào `?loc=`:
  - **Cần xử lý** (mặc định) = sắp hết hạn và đang hiệu lực, cộng chờ ký;
  - Đang hiệu lực;
  - Đã thanh lý.

  Mỗi tab kèm số đếm. **Giữ** các query cũ `toaNhaId`, `sapHetHan=true` (khi có thì mở Cần xử lý), `hopDongId` (mở đúng hồ sơ như hiện tại).
- Cột:
  - Phòng (phụ: toà);
  - Người thuê;
  - Thời hạn "dd/mm/yyyy – dd/mm/yyyy";
  - Giá thuê;
  - Cọc;
  - Tình trạng: chấm `canh` "Chờ ký" / "Hết hạn sau N ngày", hoặc theo trạng thái;
  - nút thường theo dòng: "Ghi nhận đã ký" (chờ ký) / "Gia hạn" (sắp hết), cả hai dẫn tới `/hop-dong/:id`.

  Xếp theo số ngày còn lại tăng dần. < 768: Phòng · Người thuê · Tình trạng.

### T4 · Tạo hợp đồng một trang (`TaoHopDong.tsx`, ảnh `20-ql-hop-dong-moi-1440`)
- `DauTrang`:
  - `vet` Hợp đồng › Tạo hợp đồng;
  - `phu` "<toà> · một trang, điền từ trên xuống";
  - `hanhDong`: nút thường "Huỷ" (→ `/hop-dong`) + **nút chính** "Tạo hợp đồng". Nút chính ở trạng thái `blocked` khi còn thiếu, `blockedReason` liệt kê đúng những gì thiếu.
- Bố cục 8/4. Cột phải `position: sticky; top: 16px`.
- **1. Phòng và người thuê:**
  - Phòng (select, chỉ phòng trống, mỗi mục dạng "101 · 25 m² · 4.500.000 ₫/tháng"); trợ giúp "Chỉ hiện N phòng đang trống.";
  - Người thuê (gõ tên hoặc số điện thoại); trợ giúp "Chưa có trong danh sách? Gõ số điện thoại rồi chọn "Thêm người mới".";
  - Số CCCD (12 số);
  - Số người ở; trợ giúp "Phòng này ở tối đa N người." (chỉ khi dữ liệu có).
- **2. Thời hạn và tiền:**
  - Ngày bắt đầu;
  - Thuê bao lâu (6/12/24 tháng);
  - Ngày kết thúc (tự tính, disabled, "Tự tính.");
  - Giá thuê mỗi tháng (mặc định giá niêm yết, "Giá niêm yết của phòng.");
  - Tiền cọc (mặc định 2 tháng, "Mặc định 2 tháng tiền phòng.");
  - Báo trước khi trả phòng (30/45 ngày).
- **3. Dịch vụ tính hàng tháng:** bảng có ô chọn · Dịch vụ · Cách tính ("theo công tơ" / "theo số người" / "cố định mỗi tháng") · Đơn giá. Đầu khối ghi "lấy theo bảng giá của toà, đổi riêng cho hợp đồng này nếu cần".
- Cột phải:
  - **Thu khi ký**: Tiền cọc · Tiền phòng tháng đầu · **Tổng thu khi ký**. Thêm câu "Điện nước tính từ chỉ số bàn giao, vào hoá đơn tháng sau.";
  - **Còn thiếu**: mỗi điều kiện chưa đủ một dòng đỏ ("Chưa chọn người thuê", "Chưa có số CCCD"…), đủ rồi thì một dòng xanh "Phòng, thời hạn, giá, dịch vụ đã đủ".
- Giữ nguyên payload gọi API tạo hợp đồng đang có. Chỉ đổi cách bố trí và bỏ các bước wizard (nếu có) thành một trang. Trường nào form đang có mà V3 không vẽ thì vẫn giữ, đặt ở khối hợp lý, ghi vào báo cáo.
- < 768: các khối xếp dọc. "Thu khi ký" đặt ngay trên `ChanDinh`, nút chính dính đáy.

### T5 · `HopDongThaoTac.tsx` + `QuanLyTaiSanPhong.tsx`
- Chỉ ăn token V3:
  - 9 hex cứng lúc lập plan → `var(--ma-…)`;
  - chữ cũ (Kỳ/Chốt/Phát hành/Chủ sở hữu) → bảng tiếng nói;
  - nút Thanh lý / Huỷ / Từ chối → `variant="danger"`.
- Mỗi hộp thoại giữ ≤ 1 nút chính.
- Không đổi luồng hay API.

## 5. Test
- `HopDongQuanLy.test.tsx`:
  - tab mặc định là Cần xử lý;
  - `?sapHetHan=true` và `?hopDongId=` cũ vẫn chạy;
  - xếp theo ngày còn lại;
  - ≤ 1 `.btn-primary`.
- `TaoHopDong.test.tsx`:
  - nút chính bị chặn và `blockedReason` liệt kê đúng điều còn thiếu;
  - đủ điều kiện thì gửi **đúng payload cũ**;
  - Tổng thu khi ký = cọc + tháng đầu;
  - ngày kết thúc tự tính.
- `HopDongThaoTacCon.test.tsx`: export giữ nguyên, Thanh lý không phải `.btn-primary`.
- `stylesCleanup.test.ts` (không sửa) vẫn qua.

## 6. Ảnh (`shots/y3/jobs.json`)
| Mã | Đường dẫn · vai · khung | So |
|---|---|---|
| 11 | `/toa-nha` CHU 1440 + 390 | `11-chu-toa-1440` |
| – | `/toa-nha` QTHT 1440 | (không có ảnh V3; kiểm ẩn cột nợ) |
| 06 | `/hop-dong` CHU 1440, 390 | `06-chu-hop-dong-*` |
| 20 | `/hop-dong/moi` QUAN_LY 1440 + 390 (chỉ mở, **không bấm Tạo**) | `20-ql-hop-dong-moi-1440` |
| – | `/phong` QUAN_LY 1440 + 390 | (giữ bảng, chỉ đổi token) |
<!-- CHUNG -->
## Chung cho mọi lô V3 (đọc hết, không cần mở file khác)

**Bối cảnh.** Chủ tịch đã duyệt thiết kế V3 "Sổ cái" (`docs/design/ui-redesign/v3/`). V3 thay ux-v2 ở 5 điểm: font IBM Plex Sans; nút chính màu mực `#14181D` (bỏ teal, bỏ nền kem); tiền gom theo người; trang đầu trả lời câu hỏi của người dùng; 3 mật độ. Lô nền y0 đã gộp vào `feat/v3` các phần sau: token, font, mật độ, component chung, `tienTheoNguoi.ts`. Lô này chỉ dùng lại, **không** sửa các phần đó.

**Ràng buộc (vi phạm thì trả lô):**
- Không push, không merge, không đổi nhánh khác ngoài nhánh lô. Mỗi task một commit, message `ui(y3): …`.
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
cd ~/Documents/PRJ/MiniApart-ui && git worktree add ~/Documents/PRJ/MiniApart-y3 -b ui/y3-hop-dong feat/v3
cd ~/Documents/PRJ/MiniApart-y3/frontend && npm ci && npx tsc -b && npx vitest run   # ghi lại số test mốc
```
Ghi file ctx cho lô ở `${TMPDIR:-/tmp}/v3-y3-ctx.md`, gồm: mốc test, task đang làm, commit đã có, việc còn lại. Cập nhật sau mỗi task để phiên sau làm tiếp được. Không commit file này.

**Lệnh kiểm (chạy trước mỗi commit và cuối lô, trong `~/Documents/PRJ/MiniApart-y3/frontend`):**
```bash
npx tsc -b && npx vitest run && npm run build      # vitest có sẵn guard designTokens.test.ts (Inter/teal/mono/IN HOA/hex)
git diff --stat feat/v3...HEAD                                  # chỉ được có file trong "File được sửa" + shots/y3
```

**Chụp ảnh nghiệm thu (dữ liệu thật, chỉ GET):**
```bash
cd ~/Documents/PRJ/MiniApart-y3/frontend && (VITE_BACKEND_URL=http://localhost:5190 npx vite --port 5330 --strictPort > ${TMPDIR:-/tmp}/vite-y3.log 2>&1 &)
cd ~/Documents/PRJ/MiniApart-y3
export TASTE_CDP=~/.hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs MA_APP_URL=http://localhost:5330
export MA_DEMO_PASSWORD="$(python3 -c "import re,pathlib;l=pathlib.Path('~/Documents/PRJ/MiniApart-ui/docker-compose.demo.yml').expanduser().read_text(encoding='utf-8').splitlines()[7];print(re.search(r'mật khẩu (\S+?)\)',l).group(1))")"   # không echo
node docs/design/ui-redesign/tools/app-shot.mjs docs/design/ui-redesign/v3/shots/y3/jobs.json docs/design/ui-redesign/v3/shots/y3
```
`jobs.json` có dạng `[{ "name": "<mã>-<khung>", "path": "/…", "role": "CHU"|"QUAN_LY"|"THO"|"NGUOI_THUE"|"QTHT", "w": 1440|390, "h": 900|844, "full": true }]`. Đặt ảnh cạnh ảnh V3 cùng mã trong `docs/design/ui-redesign/v3/screens/png/` để so. Xong thì tắt vite (`pkill -f "vite --port 5330"`).

**Tiêu chí nghiệm thu đo được (lấy từ `qa.json` do `app-shot.mjs` ghi ra):** `horizontalOverflow` 0 · `belowHit` 0 (ngưỡng ≥36 desktop, ≥44 ở 390 và ở mọi màn Người thuê/Thợ) · `contrast.below` 0 (≥4.5) · `textBelowFloor` 0 (≥13; Người thuê/Thợ ≥16) · `h1.count` = 1 (ghi `h1.left`/`h1.top`) · `noAccessibleName` 0. Với từng ảnh, ghi rõ **khác prototype ở đâu** và **cái gì đổi giữa 1440 và 390**.

**Báo cáo cuối lô:** `docs/design/ui-redesign/v3/shots/y3/BAO-CAO.md`, gồm:
1. Việc theo task, kèm hash commit.
2. Lệnh kiểm đã chạy thật và số test (mốc → sau).
3. Bảng ảnh: mã · khung · khác prototype ở đâu.
4. Test cũ đã sửa, lý do từng test.
5. Không làm / chưa kiểm / cần lô khác / phụ thuộc backend.

Báo cáo viết ngắn, tiếng Việt.
<!-- /CHUNG -->
