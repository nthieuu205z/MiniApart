# Brief y5 — Tháng (Quản lý): 4 bước đủ cả bước 2–4 · Ghi chỉ số dạng bảng · Hoá đơn hàng loạt

Nhánh `ui/y5-thang` · worktree `~/Documents/PRJ/MiniApart-y5` · cổng vite `5350` · ≤ 60′ · đợt 1 (sau y0).

## 1. Mục tiêu
Màn "Tháng 11/2026" cho QL thấy một đường 4 bước: **Ghi chỉ số → Khoá chỉ số → Gửi hoá đơn → Thu tiền**. Mỗi bước có đúng một nút chính ghi rõ việc ("Lưu chỉ số", "Khoá chỉ số tháng 11", "Gửi 11 hoá đơn · 38.420.000 ₫", "Ghi thu tiền"). Cả bước 2–4 đều phải dựng xong, không còn chỉ là khung.

## 2. File được sửa
`frontend/src/ChuKyThang.tsx` (`/chu-ky`), `tinhBuocChuKy.ts`, `GhiChiSo.tsx`, `GhiChiSo.css`, `meterPhoto.ts`, `HoaDonQuanLy.tsx` (`/hoa-don` của Chủ và QL), `InvoiceActions.tsx`, cùng các test: `ChuKyThang.test.tsx`, `tinhBuocChuKy.test.ts`, `GhiChiSo.test.tsx`, `meterPhoto.test.ts`, `HoaDonQuanLy.test.tsx`. Trong `managementFlows.test.tsx` chỉ được sửa các `it` về `GhiChiSo`. Ảnh lưu ở `docs/design/ui-redesign/v3/shots/y5/`.
**Không sửa:** `FinancePaymentPanel.tsx` (y1; ở đây chỉ dùng `message`), `HoaDon.tsx` (y6), `design/**`, `App.tsx`, `api*.ts`.

## 3. Hợp đồng dùng
- Từ y0: `DauTrang`, `ThanhBuoc` (`{ buoc: { ten, moTa?, trangThai: 'xong'|'nay'|'cho', href? }[], nhan }`), `KhoiSo`, `DataTable` (`tongHang`), `HangTong`, `DongNguoiNo`, `NganNhacNo`, `NhanMinhHoa`, `ChanDinh`, `ConfirmDialog`, `Button`. Hàm `nhanThang`, `linkZalo`.
- Từ y1: `FinancePaymentPanel.tsx` export `message` (giữ nguyên). Bước 4 không dựng lại ngăn ghi thu. Nút "Ghi thu" chỉ **dẫn sang** `/thu-tien?nguoiThueId=<id>`, nơi y1 mở ngăn ghi thu một lần.
- API đã có, chỉ gọi lại, không đổi:
  - `chotKyThanhToan(token, toaNhaId, kyId)`;
  - `bulkInvoice(token, toaNhaId, kyId, 'tao-hang-loat' | 'phat-hanh-hang-loat')`;
  - `/ky-thanh-toan/:ky/thieu-chi-so`;
  - `/ky-thanh-toan/:ky/chi-so`.

## 4. Hành vi (trích `app2.js` `M['ql/thang/:id']`; ảnh `14,15,16,17-ql-thang-{1..4}-1440`)

### T1 · Khung màn tháng (`ChuKyThang.tsx`)
- `DauTrang`:
  - `tieuDe` = "Tháng 11/2026", tức `Tháng ${nhanThang}` của kỳ đang xem. Không viết "Chu kỳ tháng" hay "Kỳ".
  - `phu` = "<toà> · kỳ dd/mm/yyyy – dd/mm/yyyy".
  - `hanhDong` gồm select "Tháng", với các lựa chọn "11/2026 (đang làm)", "10/2026 (đã khoá)"…, cộng **nút chính của bước đang xem**.
- Thay `nav.steps` bằng `ThanhBuoc nhan="Các bước tháng 11"`. Bước có thể bấm thì có `href` `/chu-ky?b=n`. Giữ cách đọc `?b=` đang có.
- `tinhBuocChuKy.ts`:
  - đổi tên bước thành `['Ghi chỉ số', 'Khoá chỉ số', 'Gửi hoá đơn', 'Thu tiền']`;
  - tóm tắt theo V3: "đã ghi 20/24 công tơ", "chưa khoá", "11 hoá đơn nháp", "đã thu 3/11";
  - giữ nguyên logic tính bước hiện tại.
- **Bản vẽ bước sau:** dữ liệu thật hôm nay mới ở bước 1. Khi xem `?b=` lớn hơn bước hiện tại, đặt băng `NhanMinhHoa` trong trang: "Bước này mở được sau khi các bước trước xong. Dữ liệu thật đang ở bước <n>." Nút chính khi đó ở trạng thái `blocked`, với `blockedReason` nêu đúng điều còn thiếu. **Không** dựng số giả. Bảng chỉ hiện dữ liệu thật đang có, ví dụ 0 hoá đơn nháp, kèm câu rỗng.
- Cột phải:
  - giữ khối "Sau bước này", đổi chữ;
  - khối tháng trước gọi là "Tháng 10/2026 (đã khoá)", gồm Hoá đơn đã gửi · Đã trả đủ · Còn phải thu, link "Thu tiền".

### T2 · Bước 1: Ghi chỉ số dạng bảng (`GhiChiSo.tsx`, ảnh 14)
- Khối "Ghi chỉ số tháng 11", đầu khối ghi "đã ghi 20/24 công tơ · phòng thiếu xếp lên đầu".
- Desktop ≥ 1024 dùng **bảng**:
  - cột: Phòng · Người thuê (phòng trống / đang sửa thì ghi chữ phụ) · Điện cũ · **Điện mới** (ô nhập số, `inputmode="numeric"`, placeholder "chưa ghi", viền đỏ nếu thiếu) · Dùng kWh · Nước cũ · **Nước mới** · Dùng m³ · trạng thái;
  - trạng thái là một trong: chấm `ok` "Đã ghi", nhãn đỏ "Thiếu 2 công tơ", hoặc nhãn vàng "điện tăng 62%". Nhãn vàng chỉ hiện khi dữ liệu có trung bình 3 tháng; không có thì bỏ.
- Hàng tổng: "Cộng N phòng đã ghi", Σ kWh, Σ m³.
- Chân khối: "<kbd>Tab</kbd> sang ô kế · <kbd>Enter</kbd> xuống phòng dưới". Phải làm cho Enter thật sự xuống phòng dưới.
- **Giữ** id `cong-to-{phongId}-{dichVuId}` vì ChuKyThang cuộn tới ô thiếu theo id này. Giữ luồng lưu, kiểm "chỉ số mới < cũ", ảnh công tơ (`meterPhoto`) và mọi API đang có.
- < 1024: giữ dạng thẻ từng phòng đang có. Ô nhập cao `--ma-control-h-meter`.
- Nút chính "Lưu chỉ số", đặt trong `ChanDinh` khi ở điện thoại. Prop `anNutChot` giữ nguyên.
- Số liệu: dùng đúng số API chỉ số trả về (lúc lập plan API trả 9 phòng có chỉ số), số thiếu lấy từ `thieu-chi-so`. Không trộn với `congToChuaGhi` của dashboard (20/24). Đặt chú thích "theo bảng chỉ số" để Hôm nay (y1) và màn này ra cùng một số.

### T3 · Bước 2: Khoá chỉ số (ảnh 15)
- Lưới 8/4. Khối "Kiểm lại trước khi khoá" liệt kê các điều kiện **tính được từ dữ liệu thật**:
  - "Đã ghi đủ N/N công tơ" (✓ hoặc ✗ kèm danh sách phòng);
  - "Không có chỉ số nào nhỏ hơn tháng trước", chỉ khi dữ liệu chỉ số có số cũ và mới.

  Điều kiện nào không tính được thì **bỏ hẳn**, không ghi ✓.
- Khối "Tổng dùng tháng 11": Điện / Nước, cột Tháng 11 · Tháng 10 · Chênh. Chỉ hiện khi có dữ liệu của cả hai tháng.
- Cột phải, khối "Khoá xong thì sao": "Chỉ số tháng 11 **không sửa được nữa**. Sai thì phải lập hoá đơn điều chỉnh." và "Sau khi khoá, hệ thống tính sẵn hoá đơn nháp để anh/chị xem lại ở bước 3."
- Nút chính "Khoá chỉ số tháng 11", có icon khoá. Bấm thì mở `ConfirmDialog`:
  - title "Khoá chỉ số tháng 11?";
  - consequence "Sau khi khoá không sửa được chỉ số của 12 phòng.";
  - nút xác nhận "Khoá chỉ số", nút huỷ "Chưa, xem lại".

  Xác nhận thì gọi `chotKyThanhToan`. Còn thiếu công tơ thì nút ở trạng thái `blocked`, lý do "Còn K công tơ chưa ghi chỉ số."

### T4 · Bước 3: Gửi hoá đơn (ảnh 16)
- Khối "Hoá đơn nháp tháng 11":
  - cột: ô chọn (hoá đơn đã gửi thì disabled) · Phòng · Người thuê · Tổng (600) · ghi chú;
  - ghi chú: "Đã gửi, đã trả" (ok), hoặc nhãn vàng "HĐ hết hạn dd/mm" khi hợp đồng sắp hết hạn.
- Cột Tiền phòng / Điện / Nước / Dịch vụ: **chỉ thêm khi** `ThongTinHoaDonQuanLy` trả các trường này. Không có thì không tách số, mà để link "Xem thử một hoá đơn" → `/hoa-don?toaNhaId=&kyId=&hoaDonId=` (màn chi tiết đang có).
- Hàng tổng: "Sẽ gửi N hoá đơn", Σ.
- Đầu khối ghi "hạn trả N ngày sau khi gửi · người thuê nhận tin trên điện thoại", chỉ khi có số ngày thật.
- Chưa có nháp mà kỳ đã khoá: nút chính "Tạo hoá đơn nháp", gọi `bulkInvoice(…'tao-hang-loat')`.
- Đã có nháp: nút chính "Gửi N hoá đơn · X ₫". `ConfirmDialog`:
  - title "Gửi N hoá đơn tháng 11?";
  - consequence "Người thuê sẽ thấy hoá đơn và hoá đơn không còn sửa được.";
  - xác nhận "Gửi N hoá đơn".

  Xác nhận thì gọi `bulkInvoice(…'phat-hanh-hang-loat')`. Ô chọn chỉ dùng để xem; API gửi hàng loạt gửi mọi nháp, nên **không** được làm như thể gửi được một phần. Ghi câu phụ "Gửi tất cả hoá đơn nháp của tháng."

### T5 · Bước 4: Thu tiền (ảnh 17)
- `KhoiSo` 3 ô:
  - "Đã thu tháng 11", phụ "3/11 phòng";
  - "Chưa trả", phụ "8 phòng · hạn dd/mm/yyyy";
  - "Nợ cũ các tháng trước" (đỏ), phụ là link "12 người · mở danh sách nợ" → `/thu-tien`.
- Khối "Hoá đơn tháng 11":
  - cột: Phòng · Người thuê · Phải trả · Tình trạng ("Đã trả đủ" / "Chưa trả, còn N ngày") · nút;
  - nút: Gọi (`tel:`, khi có SĐT) và "Ghi thu" → `/thu-tien?nguoiThueId=`.
- Chân khối: nút thường "Nhắc N người chưa trả", mở lần lượt `NganNhacNo`.
- Nút chính "Ghi thu tiền" → `/thu-tien`.

### T6 · Hoá đơn hàng loạt (`HoaDonQuanLy.tsx`, `InvoiceActions.tsx`)
- Đổi chữ: Kỳ → Tháng, Phát hành → Gửi, Chốt → Khoá.
- `DataTable` có `tongHang`. Gửi hàng loạt dùng cùng `ConfirmDialog` như T4.
- Nút Huỷ hoá đơn trong `InvoiceActions` dùng `variant="danger"`.
- Giữ link "Tháng này" → `/chu-ky`.

## 5. Test
- `tinhBuocChuKy.test.ts`: tên 4 bước mới, bước hiện tại đúng như cũ.
- `ChuKyThang.test.tsx`:
  - h1 là "Tháng 11/2026";
  - mỗi bước có đúng 1 `.btn-primary` với nhãn đúng;
  - xem `?b=3` khi dữ liệu đang ở bước 1 thì có nhãn minh hoạ và nút bị `aria-disabled`;
  - bấm khoá rồi xác nhận gọi `/chot` (POST mock);
  - gửi hoá đơn gọi `phat-hanh-hang-loat` với đúng `kyId`;
  - bước 4 có link `/thu-tien?nguoiThueId=`.
- `GhiChiSo.test.tsx`:
  - desktop render bảng, phòng thiếu đứng đầu;
  - Enter chuyển focus sang ô cùng cột của phòng dưới;
  - id `cong-to-*` giữ nguyên.
- Test cũ khoá chữ "Chốt kỳ"/"Phát hành" thì đổi theo bảng tiếng nói, ghi lý do.

## 6. Ảnh (`shots/y5/jobs.json`)
| Mã | Đường dẫn · vai · khung | So |
|---|---|---|
| 14 | `/chu-ky` QUAN_LY 1440 + 390 | `14-ql-thang-1-1440` |
| 15 | `/chu-ky?b=2` QUAN_LY 1440 | `15-ql-thang-2-1440` (có nhãn minh hoạ nếu dữ liệu ở bước 1) |
| 16 | `/chu-ky?b=3` QUAN_LY 1440 | `16-ql-thang-3-1440` |
| 17 | `/chu-ky?b=4` QUAN_LY 1440 | `17-ql-thang-4-1440` |
| – | `/hoa-don` QUAN_LY 1440 + 390, `/chu-ky` CHU 1440 | đổi token và chữ |

Không bấm Lưu / Khoá / Gửi trên app thật. Mỗi ảnh ghi "dữ liệu thật đang ở bước n".
<!-- CHUNG -->
## Chung cho mọi lô V3 (đọc hết, không cần mở file khác)

**Bối cảnh.** Chủ tịch đã duyệt thiết kế V3 "Sổ cái" (`docs/design/ui-redesign/v3/`). V3 thay ux-v2 ở 5 điểm: font IBM Plex Sans; nút chính màu mực `#14181D` (bỏ teal, bỏ nền kem); tiền gom theo người; trang đầu trả lời câu hỏi của người dùng; 3 mật độ. Lô nền y0 đã gộp vào `feat/v3` các phần sau: token, font, mật độ, component chung, `tienTheoNguoi.ts`. Lô này chỉ dùng lại, **không** sửa các phần đó.

**Ràng buộc (vi phạm thì trả lô):**
- Không push, không merge, không đổi nhánh khác ngoài nhánh lô. Mỗi task một commit, message `ui(y5): …`.
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
cd ~/Documents/PRJ/MiniApart-ui && git worktree add ~/Documents/PRJ/MiniApart-y5 -b ui/y5-thang feat/v3
cd ~/Documents/PRJ/MiniApart-y5/frontend && npm ci && npx tsc -b && npx vitest run   # ghi lại số test mốc
```
Ghi file ctx cho lô ở `${TMPDIR:-/tmp}/v3-y5-ctx.md`, gồm: mốc test, task đang làm, commit đã có, việc còn lại. Cập nhật sau mỗi task để phiên sau làm tiếp được. Không commit file này.

**Lệnh kiểm (chạy trước mỗi commit và cuối lô, trong `~/Documents/PRJ/MiniApart-y5/frontend`):**
```bash
npx tsc -b && npx vitest run && npm run build      # vitest có sẵn guard designTokens.test.ts (Inter/teal/mono/IN HOA/hex)
git diff --stat feat/v3...HEAD                                  # chỉ được có file trong "File được sửa" + shots/y5
```

**Chụp ảnh nghiệm thu (dữ liệu thật, chỉ GET):**
```bash
cd ~/Documents/PRJ/MiniApart-y5/frontend && (VITE_BACKEND_URL=http://localhost:5190 npx vite --port 5350 --strictPort > ${TMPDIR:-/tmp}/vite-y5.log 2>&1 &)
cd ~/Documents/PRJ/MiniApart-y5
export TASTE_CDP=~/.hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs MA_APP_URL=http://localhost:5350
export MA_DEMO_PASSWORD="$(python3 -c "import re,pathlib;l=pathlib.Path('~/Documents/PRJ/MiniApart-ui/docker-compose.demo.yml').expanduser().read_text(encoding='utf-8').splitlines()[7];print(re.search(r'mật khẩu (\S+?)\)',l).group(1))")"   # không echo
node docs/design/ui-redesign/tools/app-shot.mjs docs/design/ui-redesign/v3/shots/y5/jobs.json docs/design/ui-redesign/v3/shots/y5
```
`jobs.json` có dạng `[{ "name": "<mã>-<khung>", "path": "/…", "role": "CHU"|"QUAN_LY"|"THO"|"NGUOI_THUE"|"QTHT", "w": 1440|390, "h": 900|844, "full": true }]`. Đặt ảnh cạnh ảnh V3 cùng mã trong `docs/design/ui-redesign/v3/screens/png/` để so. Xong thì tắt vite (`pkill -f "vite --port 5350"`).

**Tiêu chí nghiệm thu đo được (lấy từ `qa.json` do `app-shot.mjs` ghi ra):** `horizontalOverflow` 0 · `belowHit` 0 (ngưỡng ≥36 desktop, ≥44 ở 390 và ở mọi màn Người thuê/Thợ) · `contrast.below` 0 (≥4.5) · `textBelowFloor` 0 (≥13; Người thuê/Thợ ≥16) · `h1.count` = 1 (ghi `h1.left`/`h1.top`) · `noAccessibleName` 0. Với từng ảnh, ghi rõ **khác prototype ở đâu** và **cái gì đổi giữa 1440 và 390**.

**Báo cáo cuối lô:** `docs/design/ui-redesign/v3/shots/y5/BAO-CAO.md`, gồm:
1. Việc theo task, kèm hash commit.
2. Lệnh kiểm đã chạy thật và số test (mốc → sau).
3. Bảng ảnh: mã · khung · khác prototype ở đâu.
4. Test cũ đã sửa, lý do từng test.
5. Không làm / chưa kiểm / cần lô khác / phụ thuộc backend.

Báo cáo viết ngắn, tiếng Việt.
<!-- /CHUNG -->
