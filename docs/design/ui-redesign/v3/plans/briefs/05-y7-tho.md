# Brief y7 — Thợ (điện thoại, mật độ thoáng): Việc · Chi tiết việc · Báo giá · Báo sửa xong · Tiền công

Nhánh `ui/y7-tho` · worktree `~/Documents/PRJ/MiniApart-y7` · cổng vite `5370` · ≤ 55′ · đợt 1 (sau y0).

## 1. Mục tiêu
Thợ mở app là thấy ngay **việc phải làm trước** và đúng một nút cho bước kế tiếp: Bắt đầu khảo sát → Gửi báo giá → Báo đã sửa xong. Mỗi màn chỉ một việc chính, đặt ở nút dính đáy. Chữ thân ≥ 16, vùng chạm ≥ 44.

## 2. File được sửa
`frontend/src/ThoCongViec.tsx` (`/viec-cua-toi`, 1.291 dòng lúc lập plan, 33 hex cứng), `ThoChiPhi.tsx` (`/tho/chi-phi`, 815 dòng, 40 hex cứng), cùng hai test `ThoCongViec.test.tsx` và `ThoChiPhi.test.tsx`. Trong `App.tho.test.tsx` chỉ được sửa các `it` về màn Thợ. Ảnh lưu ở `docs/design/ui-redesign/v3/shots/y7/`.

**Không sửa:**
- `CanTra.tsx` (thuộc y6; ở đây chỉ dùng `Tieu`);
- `ViecCuaToi.tsx`, `ThoTongQuan.tsx` (không còn route, thuộc y9);
- `workerDashboardApi.ts`, `design/**`, `App.tsx`.

## 3. Hợp đồng
- Dùng từ y6: `CanTra.tsx` export `Tieu({ mobile, children, className, id, style })`, giữ nguyên.
- Dùng từ y0: `ChanDinh`, `NhanMinhHoa`, `Button`, `StatusTag`, `ThanhBuoc` (`doc` cho "Đã làm gì"), `Field`/`Input`.
- API có sẵn, chỉ gọi, không đổi:
  - `fetchThoCongViec` / `fetchThoChiTietCongViec`;
  - `capNhatKhaoSat`;
  - `taoBaoGia`;
  - `guiDuyetBaoGia`;
  - `baoXongViecTho(token, id, ketQuaSuaChua)`;
  - `fetchThoChungTu`.

## 4. Hành vi (trích `app2.js` `M['tho/*']`, `VIEC_TT`; ảnh `26–29-tho-*-390`)

### T1 · Việc (ảnh 26)
- Đầu màn: h1 "Việc của tôi", phụ là tên thợ, chuông ở đầu.
- Tab "Đang làm N" · "Đã xong M". Giữ cơ chế lọc hiện có và query nếu có.
- Tab Đang làm:
  - **Khối "Làm trước"**, là việc đứng đầu theo thứ tự ưu tiên đang có (khẩn trước, rồi cũ trước). Khối gồm:
    - nhãn trạng thái (Mới giao / Đang làm / Chờ nghiệm thu);
    - h2 "<hạng mục> · phòng 302";
    - "<toà>, tầng 3";
    - mô tả;
    - nút thường "Gọi khách" (`tel:`);
    - **nút chính** theo trạng thái: `DA_PHAN_CONG` → "Bắt đầu khảo sát", `DANG_XU_LY` chưa có báo giá → "Gửi báo giá", `DANG_XU_LY` báo giá đã duyệt → "Báo đã sửa xong", `CHO_XAC_NHAN` → không có nút chính.
  - **"Việc khác (N việc)"**: mỗi việc một dòng "<hạng mục> · phòng X", phụ "<toà> · <trạng thái thường>", có mũi tên. Bấm → chi tiết.
- Tab Đã xong: danh sách các việc đã xong.
- Rỗng: "Chưa có việc nào được giao. Khi quản lý giao việc, bạn sẽ nhận thông báo."

### T2 · Chi tiết việc (ảnh 27)
- Đầu màn:
  - nút "← Quay lại";
  - h1 "<hạng mục> · phòng 302";
  - phụ là mã việc.
- Các khối:
  - nhãn trạng thái + "Khẩn", mô tả, "<toà> · tầng 3" + địa chỉ;
  - liên hệ: "Người thuê" (tên + nút Gọi), "Quản lý toà" (tên + nút Gọi); không có SĐT thì không hiện nút;
  - nút thường "Chụp ảnh hiện trạng", chỉ khi đang có luồng ảnh, không có thì ẩn;
  - "Đã làm gì": `ThanhBuoc doc`, lấy từ lịch sử việc đang có.
- Nút chữ đỏ "Tôi không nhận được việc này" chỉ hiện khi code hiện tại có luồng trả việc. Không có thì **ẩn**, không làm nút chết.
- **Nút chính** trong `ChanDinh` theo trạng thái, giống T1:
  - "Bắt đầu khảo sát" → gọi `capNhatKhaoSat` theo luồng đang có;
  - "Gửi báo giá" → mở màn báo giá.

### T3 · Báo giá (ảnh 28)
- Đầu màn:
  - nút "← Quay lại";
  - h1 "Báo giá";
  - phụ "<hạng mục> · phòng 302 · <toà>".
- Mỗi dòng báo giá là một khối gồm:
  - "Dòng 1: vật tư hoặc công";
  - "Số lượng" (ô số);
  - "Đơn giá (₫)" (ô số, canh phải);
  - "Thành tiền", tự tính.
- Nút thường "Thêm dòng".
- "Ghi chú cho quản lý (không bắt buộc)".
- Khối "Tổng báo giá" với số lớn.
- **Nút chính** "Gửi báo giá 450.000 ₫" (số theo tổng) trong `ChanDinh`. Thao tác này gọi `taoBaoGia` rồi `guiDuyetBaoGia`, theo đúng luồng đang có.
- Không có dòng nào, hoặc dòng có đơn giá 0, thì nút chính `blocked`, kèm lý do "Thêm ít nhất một dòng có đơn giá."
- Dữ liệu demo không có báo giá nên màn mở ra trống. **Không** điền sẵn dòng ví dụ (V3 có nhãn "minh hoạ" cho phần này; app thật thì không).

### T4 · Báo đã sửa xong (làm mới tối thiểu, V3 chưa vẽ)
- Áp dụng khi việc đang `DANG_XU_LY` và báo giá đã duyệt, hoặc khi luồng hiện tại cho phép báo xong.
- Chi tiết việc có **nút chính** "Báo đã sửa xong" trong `ChanDinh`. Bấm vào mở khối nhập "Đã làm gì" (textarea, **bắt buộc**, placeholder "Ví dụ: thay công tắc nhà tắm, đã thử điện") và nút "Gửi báo xong", gọi `baoXongViecTho(token, id, ketQuaSuaChua)`.
- Thành công: toast "Đã báo xong. Chờ quản lý nghiệm thu.", trạng thái chuyển sang "Chờ nghiệm thu".
- Lỗi: báo ngay trong khối, giữ nguyên chữ đã nhập.
- Lý do làm: đây là bước cuối vòng việc của Thợ, API đã có, chỉ thiếu một nút rõ ràng.

### T5 · Tiền công (`ThoChiPhi.tsx`, ảnh 29)
- Đầu màn: h1 "Tiền công", phụ là tên thợ.
- Khối lớn:
  - "Còn được nhận";
  - số lớn, cộng từ dữ liệu thật đang có;
  - câu giải thích: khi bằng 0 thì "Chưa có việc nào nghiệm thu xong mà chưa trả tiền."
- Khối "Đã xong": "<hạng mục> · phòng X", phụ "<toà>", bên phải số tiền **thật** của việc. Prototype ghi 250.000 ₫ cho mọi dòng; app **không** được dùng số cố định. Việc nào không có số thì ghi "—".
- 40 hex cứng đổi sang `var(--ma-…)`. Giữ chứng từ thanh toán (`fetchThoChungTu`) và các chức năng hiện có.
- **Không có nút chính**: màn chỉ đọc.

## 5. Test
- `ThoCongViec.test.tsx`:
  - mỗi trạng thái có đúng ≤ 1 `.btn-primary` với nhãn đúng;
  - "Báo đã sửa xong" bắt buộc nhập "Đã làm gì" và gọi `/bao-xong` với `ketQuaSuaChua`;
  - báo giá không có dòng hợp lệ thì nút gửi `aria-disabled`;
  - gửi báo giá thì gọi `bao-gia` rồi `gui-duyet`;
  - `Tieu` vẫn import được từ `CanTra`.
- `ThoChiPhi.test.tsx`: không có số cố định 250.000; không có `.btn-primary`.
- Test cũ khoá `minHeight` 44/48 thì đổi theo token y0 (`--ma-control-h`), ghi lý do.

## 6. Ảnh (`shots/y7/jobs.json`, vai `THO`, 390×844, `full: true`)
| Mã | Đường dẫn | So |
|---|---|---|
| 26 | `/viec-cua-toi` | `26-tho-viec-390` |
| 27 | `/viec-cua-toi?yeuCauId=<việc DA_PHAN_CONG>` | `27-tho-viec-13-390` |
| 28 | màn báo giá của một việc `DANG_XU_LY` (chỉ mở, **không gửi**) | `28-tho-bao-gia-24-390` |
| 29 | `/tho/chi-phi` | `29-tho-tien-cong-390` |

Ngưỡng: chữ ≥ 16, vùng chạm ≥ 44. Ngưỡng do `qa-probe.js` tự áp với `thoang`.
<!-- CHUNG -->
## Chung cho mọi lô V3 (đọc hết, không cần mở file khác)

**Bối cảnh.** Chủ tịch đã duyệt thiết kế V3 "Sổ cái" (`docs/design/ui-redesign/v3/`). V3 thay ux-v2 ở 5 điểm: font IBM Plex Sans; nút chính màu mực `#14181D` (bỏ teal, bỏ nền kem); tiền gom theo người; trang đầu trả lời câu hỏi của người dùng; 3 mật độ. Lô nền y0 đã gộp vào `feat/v3` các phần sau: token, font, mật độ, component chung, `tienTheoNguoi.ts`. Lô này chỉ dùng lại, **không** sửa các phần đó.

**Ràng buộc (vi phạm thì trả lô):**
- Không push, không merge, không đổi nhánh khác ngoài nhánh lô. Mỗi task một commit, message `ui(y7): …`.
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
cd ~/Documents/PRJ/MiniApart-ui && git worktree add ~/Documents/PRJ/MiniApart-y7 -b ui/y7-tho feat/v3
cd ~/Documents/PRJ/MiniApart-y7/frontend && npm ci && npx tsc -b && npx vitest run   # ghi lại số test mốc
```
Ghi file ctx cho lô ở `${TMPDIR:-/tmp}/v3-y7-ctx.md`, gồm: mốc test, task đang làm, commit đã có, việc còn lại. Cập nhật sau mỗi task để phiên sau làm tiếp được. Không commit file này.

**Lệnh kiểm (chạy trước mỗi commit và cuối lô, trong `~/Documents/PRJ/MiniApart-y7/frontend`):**
```bash
npx tsc -b && npx vitest run && npm run build      # vitest có sẵn guard designTokens.test.ts (Inter/teal/mono/IN HOA/hex)
git diff --stat feat/v3...HEAD                                  # chỉ được có file trong "File được sửa" + shots/y7
```

**Chụp ảnh nghiệm thu (dữ liệu thật, chỉ GET):**
```bash
cd ~/Documents/PRJ/MiniApart-y7/frontend && (VITE_BACKEND_URL=http://localhost:5190 npx vite --port 5370 --strictPort > ${TMPDIR:-/tmp}/vite-y7.log 2>&1 &)
cd ~/Documents/PRJ/MiniApart-y7
export TASTE_CDP=~/.hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs MA_APP_URL=http://localhost:5370
export MA_DEMO_PASSWORD="$(python3 -c "import re,pathlib;l=pathlib.Path('~/Documents/PRJ/MiniApart-ui/docker-compose.demo.yml').expanduser().read_text(encoding='utf-8').splitlines()[7];print(re.search(r'mật khẩu (\S+?)\)',l).group(1))")"   # không echo
node docs/design/ui-redesign/tools/app-shot.mjs docs/design/ui-redesign/v3/shots/y7/jobs.json docs/design/ui-redesign/v3/shots/y7
```
`jobs.json` có dạng `[{ "name": "<mã>-<khung>", "path": "/…", "role": "CHU"|"QUAN_LY"|"THO"|"NGUOI_THUE"|"QTHT", "w": 1440|390, "h": 900|844, "full": true }]`. Đặt ảnh cạnh ảnh V3 cùng mã trong `docs/design/ui-redesign/v3/screens/png/` để so. Xong thì tắt vite (`pkill -f "vite --port 5370"`).

**Tiêu chí nghiệm thu đo được (lấy từ `qa.json` do `app-shot.mjs` ghi ra):** `horizontalOverflow` 0 · `belowHit` 0 (ngưỡng ≥36 desktop, ≥44 ở 390 và ở mọi màn Người thuê/Thợ) · `contrast.below` 0 (≥4.5) · `textBelowFloor` 0 (≥13; Người thuê/Thợ ≥16) · `h1.count` = 1 (ghi `h1.left`/`h1.top`) · `noAccessibleName` 0. Với từng ảnh, ghi rõ **khác prototype ở đâu** và **cái gì đổi giữa 1440 và 390**.

**Báo cáo cuối lô:** `docs/design/ui-redesign/v3/shots/y7/BAO-CAO.md`, gồm:
1. Việc theo task, kèm hash commit.
2. Lệnh kiểm đã chạy thật và số test (mốc → sau).
3. Bảng ảnh: mã · khung · khác prototype ở đâu.
4. Test cũ đã sửa, lý do từng test.
5. Không làm / chưa kiểm / cần lô khác / phụ thuộc backend.

Báo cáo viết ngắn, tiếng Việt.
<!-- /CHUNG -->
