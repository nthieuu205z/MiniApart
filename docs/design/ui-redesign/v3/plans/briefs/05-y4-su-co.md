# Brief y4 — Sự cố (3 nhóm, duyệt báo giá) & Báo cáo một trang

Nhánh `ui/y4-su-co` · worktree `~/Documents/PRJ/MiniApart-y4` · cổng vite `5340` · ≤ 55′ · đợt 1 (sau y0).

## 1. Mục tiêu
- **Sự cố** chia 3 nhóm việc: Cần quyết · Thợ đang làm · Đã xong tháng này. Chọn một sự cố là thấy ngay nó đang ở bước nào trong 8 bước, và nút chính là đúng việc phải làm (Giao thợ / Duyệt X ₫ / Nghiệm thu).
- **Báo cáo** chỉ một trang, trả lời: đã thu bao nhiêu trên số đã gửi hoá đơn, còn nợ bao lâu, toà nào kém.

## 2. File được sửa
`frontend/src/SuCoQuanLy.tsx`, `SuCo.css`, `TrangSuCo.tsx` (`/su-co`), `QuanLyBaoGiaVaThanhToan.tsx`, `BaoCaoTongQuan.tsx` (`/bao-cao`), `TieuThuBaoCao.tsx` (`/bao-cao/tieu-thu`), `ChiPhiBaoTriBaoCao.tsx` (`/bao-cao/chi-phi-bao-tri`), `ChuDashboard.tsx` (`/tong-quan`), `baoCaoChung.tsx`, `useToaKhung.ts`, `ExcelExportButton.tsx`, `dashboardTongHop.ts`, test cùng tên + `ToaKhungManLoc.test.tsx`; `docs/design/ui-redesign/v3/shots/y4/`.
**Không sửa:** `QuanLySuaChua.tsx` (y9; file này import `SuCoQuanLy`, nên **giữ nguyên default export và props** của `SuCoQuanLy`), `design/**`, `App.tsx`.

## 3. Hợp đồng dùng
- y0: `DauTrang`, `KhoiSo`, `ThanhBuoc` (8 bước), `DataTable` (`tongHang`), `NhanMinhHoa`, `ChanDinh`, `Button` (`danger`), `EmptyState`, `Toast`.
- `TrangSuCo` nhận `TrangProps`. `SuCoQuanLy` export giữ nguyên, vì `QuanLySuaChua.tsx` (y9) đang import.

## 4. Hành vi (trích `app.js` `M['chu/su-co']`, `M['chu/bao-cao']`; ảnh `08,09,10,19`)

### T1 · Danh sách sự cố 3 nhóm (`SuCoQuanLy.tsx`, ảnh `08-chu-su-co-1440`, `19-ql-su-co-1440`)
- `DauTrang`:
  - `tieuDe="Sự cố"`;
  - `phu` "<toà> · N việc cần quyết · M thợ đang làm";
  - QL có thêm nút thường "Ghi sự cố mới" (giữ luồng `?baoMoi=1` đang có). Chủ thì không có.
- Desktop dùng lưới 5/7: bên trái là danh sách, bên phải là chi tiết sự cố đang chọn (`?id=`; giữ cả `yeuCauId` cũ).
- Danh sách chia nhóm, mỗi nhóm có đầu nhóm nền `--ma-paper-1` gồm tên nhóm và số đếm:
  - **Cần quyết**: `MOI_TIEP_NHAN`, `DA_TIEP_NHAN`, và mọi sự cố có báo giá chờ duyệt;
  - **Thợ đang làm**: `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_XAC_NHAN` không có báo giá chờ;
  - **Đã xong tháng này**: `DA_DONG` có ngày đóng trong tháng hiện tại.

  Mỗi dòng: "<hạng mục> · phòng 302", phụ "<toà> · <trạng thái chữ thường>" hoặc "báo giá 450.000 ₫ chờ duyệt". Nhãn bên phải: "Khẩn" (đỏ) hoặc "Chờ duyệt" (vàng).
- Giữ chip `?loc=` đang có, ánh xạ sang 3 nhóm: `mo` = Cần quyết + Thợ đang làm, `xong` = Đã xong. Giá trị cũ vẫn phải chạy.
- Nhãn trạng thái V3 (`TT_SC`):

  | Mã | Nhãn |
  |---|---|
  | `MOI_TIEP_NHAN` | "Mới báo" |
  | `DA_TIEP_NHAN` | "Đã nhận, chưa giao thợ" |
  | `DA_PHAN_CONG` | "Đã giao thợ" |
  | `DANG_XU_LY` | "Đang sửa" |
  | `CHO_XAC_NHAN` | "Chờ nghiệm thu" |
  | `DA_DONG` | "Đã xong" |

- < 768 (ảnh `09-chu-su-co-4-390`): có `?id=` thì chỉ hiện chi tiết, kèm nút chữ "← Tất cả sự cố"; không có thì chỉ hiện danh sách.

### T2 · Chi tiết + 8 bước + hành động (ảnh `09-chu-su-co-4-1440`)
- Đầu thẻ:
  - h2 "<hạng mục> · phòng 302";
  - phụ "<toà> · tầng 3 · báo ngày dd/mm/yyyy · <mã>";
  - nhãn Khẩn + nhãn trạng thái.
- Mô tả.
- `ThanhBuoc nhan="Tiến độ"`, 8 bước: Báo hỏng · Tiếp nhận · Giao thợ · Báo giá · Duyệt · Sửa · Nghiệm thu · Trả tiền thợ.
  - Bước hiện tại tính theo trạng thái: `MOI` → 1, `DA_TIEP_NHAN` → 2, `DA_PHAN_CONG` → 3, `DANG_XU_LY` → 6, `CHO_XAC_NHAN` → 7, `DA_DONG` → 8. Có báo giá chờ duyệt thì là 5.
  - < 768: "Bước 5/8: **Duyệt**".
- Có báo giá chờ duyệt:
  - bảng "Báo giá của thợ <tên>" gồm Hạng mục · SL · Đơn giá · Thành tiền, hàng tổng "Tổng báo giá";
  - chọn "Ai chịu chi phí" (giữ trường đang có nếu có; không có thì **không** thêm);
  - nút `danger` "Từ chối…" (hỏi lại, lý do bắt buộc) + **nút chính** "Duyệt 450.000 ₫";
  - gọi API duyệt / từ chối có sẵn (`/api/yeu-cau-sua-chua/:id/bao-gia/:id/duyet|tu-choi`), **chỉ trong test mock**.
- `MOI_TIEP_NHAN`/`DA_TIEP_NHAN`: select "Giao cho thợ" (tên · SĐT), trợ giúp "Thợ nhận tin ngay trên điện thoại.", **nút chính** "Giao thợ". Bước tiếp nhận / phân công gọi API có sẵn, giữ thứ tự gọi như code hiện tại.
- `CHO_XAC_NHAN`: **nút chính** "Nghiệm thu" (API `hoan-thanh` có sẵn), giữ hỏi lại nếu đang có.
- Các trạng thái khác: không có nút chính.
- Key-value bên dưới:
  - "Người thuê liên hệ" (`tel:`);
  - "Thợ" (tên · `tel:`) hoặc "Chưa giao";
  - "Chi phí": số tiền, "X ₫ (chờ duyệt)" hoặc "Chưa có báo giá".
- Nút đặt cuối thẻ, căn phải; trên điện thoại đặt trong `ChanDinh`.
- **Báo giá demo đang trống** (40 bản ghi đầu không có báo giá). Màn chạy theo dữ liệu thật: không có báo giá thì nhóm Cần quyết không có dòng "Chờ duyệt". Ảnh nghiệm thu chụp đúng như vậy. Trạng thái có báo giá chứng minh bằng test mock, **không** dựng báo giá giả trên app thật.
- `QuanLyBaoGiaVaThanhToan.tsx`: đổi chữ và kiểu sang token V3, nút Từ chối dùng `danger`, không đổi API.

### T3 · Báo cáo một trang (`BaoCaoTongQuan.tsx`, ảnh `10-chu-bao-cao-1440/390`)
- `DauTrang`:
  - `phu` "<toà> · từ tháng 7 đến hết dd/mm/yyyy · tính trên hoá đơn đã gửi";
  - `hanhDong`: chip khoảng thời gian (Tháng này · 5 tháng · Cả năm; giữ cơ chế lọc thời gian đang có của `useToaKhung`/`baoCaoChung`, chỉ đổi kiểu) + nút thường "Xuất Excel" (`ExcelExportButton` đang có).
  - **Không có nút chính**: đây là màn chỉ đọc.
- `KhoiSo`:
  - "Đã thu" (phụ "x% của Y ₫ đã gửi hoá đơn");
  - "Còn nợ" (đỏ, phụ theo tuổi nợ thật);
  - "Phòng đang thuê" % (phụ "27/36 phòng");
  - "Chi sửa chữa" (phụ "N việc đã xong", ẩn khi < 768).

  Đã thu, Còn nợ, Đã gửi đều **cộng từ hoá đơn**, không dùng `thucThu`. Thêm `console.assert` hoặc test bảo đảm Đã gửi = Đã thu + Còn nợ.
- Lưới 7/5:
  - "Gửi hoá đơn và đã thu theo tháng": cột đôi theo tháng (đã gửi: nền nhạt; đã thu: mực), dưới mỗi cột ghi "Tháng 7" và "61 / 64 tr". Tháng hiện tại thấp thì thêm câu giải thích "Tháng 11 thấp vì hoá đơn tháng 11 chưa gửi (mới có N hoá đơn)."; chỉ thêm khi đúng là như vậy.
  - "Nợ theo thời gian quá hạn": Chưa đến hạn · 1–7 ngày · 8–30 ngày · trên 30 ngày (đỏ). Kèm "N hoá đơn của M người. Mở danh sách nợ" → `/thu-tien`.
- "Theo toà" (`DataTable`, `tongHang` khi có > 1 toà): Toà · Đã gửi hoá đơn · Đã thu · Tỷ lệ thu · Còn nợ · Đang thuê · Chi sửa chữa. Bấm dòng → `/toa-nha/:id`.
- `TieuThuBaoCao`, `ChiPhiBaoTriBaoCao`, `ChuDashboard` (`/tong-quan`): giữ nội dung, chỉ ăn token + bảng tiếng nói ("Lấp đầy" → "x/y phòng đang thuê", "Thực thu" → "Đã thu"). Biểu đồ dùng màu V3: mực, `--ma-ink-400`, đỏ cho nợ.

## 5. Test
- `TrangSuCo.test.tsx`:
  - 3 nhóm đúng trạng thái;
  - bước hiện tại đúng cho cả 6 trạng thái + ca có báo giá;
  - mỗi trạng thái có đúng ≤ 1 `.btn-primary` với nhãn đúng ("Giao thợ" / "Duyệt 450.000 ₫" / "Nghiệm thu");
  - "Từ chối…" không phải `.btn-primary`;
  - `?yeuCauId=` cũ vẫn mở đúng.
- `BaoCaoTongQuan.test.tsx`:
  - Đã gửi = Đã thu + Còn nợ với mock có `thucThu: 0`;
  - không có `.btn-primary`.
- `ToaKhungManLoc.test.tsx`: lọc theo toà vẫn đúng.

## 6. Ảnh (`shots/y4/jobs.json`)
| Mã | Đường dẫn · vai · khung | So |
|---|---|---|
| 08 | `/su-co` CHU 1440 | `08-chu-su-co-1440` |
| 09 | `/su-co?id=<sự cố khẩn mới báo>` CHU 1440, 390 | `09-chu-su-co-4-*` (V3 vẽ ca có báo giá; app thật không có báo giá, ghi rõ) |
| 19 | `/su-co` QUAN_LY 1440 + 390 | `19-ql-su-co-1440` |
| 10 | `/bao-cao` CHU 1440, 390 | `10-chu-bao-cao-*` |
| – | `/tong-quan`, `/bao-cao/tieu-thu`, `/bao-cao/chi-phi-bao-tri` CHU 1440 | chỉ kiểm token / chữ |
<!-- CHUNG -->
## Chung cho mọi lô V3 (đọc hết, không cần mở file khác)

**Bối cảnh.** Chủ tịch đã duyệt thiết kế V3 "Sổ cái" (`docs/design/ui-redesign/v3/`). V3 thay ux-v2 ở 5 điểm: font IBM Plex Sans; nút chính màu mực `#14181D` (bỏ teal, bỏ nền kem); tiền gom theo người; trang đầu trả lời câu hỏi của người dùng; 3 mật độ. Lô nền y0 đã gộp vào `feat/v3` các phần sau: token, font, mật độ, component chung, `tienTheoNguoi.ts`. Lô này chỉ dùng lại, **không** sửa các phần đó.

**Ràng buộc (vi phạm thì trả lô):**
- Không push, không merge, không đổi nhánh khác ngoài nhánh lô. Mỗi task một commit, message `ui(y4): …`.
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
cd ~/Documents/PRJ/MiniApart-ui && git worktree add ~/Documents/PRJ/MiniApart-y4 -b ui/y4-su-co feat/v3
cd ~/Documents/PRJ/MiniApart-y4/frontend && npm ci && npx tsc -b && npx vitest run   # ghi lại số test mốc
```
Ghi file ctx cho lô ở `${TMPDIR:-/tmp}/v3-y4-ctx.md`, gồm: mốc test, task đang làm, commit đã có, việc còn lại. Cập nhật sau mỗi task để phiên sau làm tiếp được. Không commit file này.

**Lệnh kiểm (chạy trước mỗi commit và cuối lô, trong `~/Documents/PRJ/MiniApart-y4/frontend`):**
```bash
npx tsc -b && npx vitest run && npm run build      # vitest có sẵn guard designTokens.test.ts (Inter/teal/mono/IN HOA/hex)
git diff --stat feat/v3...HEAD                                  # chỉ được có file trong "File được sửa" + shots/y4
```

**Chụp ảnh nghiệm thu (dữ liệu thật, chỉ GET):**
```bash
cd ~/Documents/PRJ/MiniApart-y4/frontend && (VITE_BACKEND_URL=http://localhost:5190 npx vite --port 5340 --strictPort > ${TMPDIR:-/tmp}/vite-y4.log 2>&1 &)
cd ~/Documents/PRJ/MiniApart-y4
export TASTE_CDP=~/.hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs MA_APP_URL=http://localhost:5340
export MA_DEMO_PASSWORD="$(python3 -c "import re,pathlib;l=pathlib.Path('~/Documents/PRJ/MiniApart-ui/docker-compose.demo.yml').expanduser().read_text(encoding='utf-8').splitlines()[7];print(re.search(r'mật khẩu (\S+?)\)',l).group(1))")"   # không echo
node docs/design/ui-redesign/tools/app-shot.mjs docs/design/ui-redesign/v3/shots/y4/jobs.json docs/design/ui-redesign/v3/shots/y4
```
`jobs.json` có dạng `[{ "name": "<mã>-<khung>", "path": "/…", "role": "CHU"|"QUAN_LY"|"THO"|"NGUOI_THUE"|"QTHT", "w": 1440|390, "h": 900|844, "full": true }]`. Đặt ảnh cạnh ảnh V3 cùng mã trong `docs/design/ui-redesign/v3/screens/png/` để so. Xong thì tắt vite (`pkill -f "vite --port 5340"`).

**Tiêu chí nghiệm thu đo được (lấy từ `qa.json` do `app-shot.mjs` ghi ra):** `horizontalOverflow` 0 · `belowHit` 0 (ngưỡng ≥36 desktop, ≥44 ở 390 và ở mọi màn Người thuê/Thợ) · `contrast.below` 0 (≥4.5) · `textBelowFloor` 0 (≥13; Người thuê/Thợ ≥16) · `h1.count` = 1 (ghi `h1.left`/`h1.top`) · `noAccessibleName` 0. Với từng ảnh, ghi rõ **khác prototype ở đâu** và **cái gì đổi giữa 1440 và 390**.

**Báo cáo cuối lô:** `docs/design/ui-redesign/v3/shots/y4/BAO-CAO.md`, gồm:
1. Việc theo task, kèm hash commit.
2. Lệnh kiểm đã chạy thật và số test (mốc → sau).
3. Bảng ảnh: mã · khung · khác prototype ở đâu.
4. Test cũ đã sửa, lý do từng test.
5. Không làm / chưa kiểm / cần lô khác / phụ thuộc backend.

Báo cáo viết ngắn, tiếng Việt.
<!-- /CHUNG -->
