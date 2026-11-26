# Brief y2 — Hồ sơ: Người thuê (danh sách + hồ sơ) · Phòng · Toà · Hợp đồng

Nhánh `ui/y2-ho-so` · worktree `~/Documents/PRJ/MiniApart-y2` · cổng vite `5320` · ≤ 60′ · đợt 1 (sau y0).

## 1. Mục tiêu
Mở bất kỳ hồ sơ nào cũng phải thấy ngay **việc kế tiếp** và **một nút chính đúng trạng thái**. Lô này sửa luôn hai màn mà QA V3 tự chấm chưa đạt phép thử 3 giây: **danh sách Người thuê** và **Hồ sơ toà**.

## 2. File được sửa
`frontend/src/HoSoNguoiThue.tsx` (route `/nguoi-thue`), `HoSoNguoiThue360.tsx` (`/nguoi-thue/:id`), `HoSoPhong360.tsx` (`/phong/:id`), `HoSoToa360.tsx` (`/toa-nha/:id`), `HoSoHopDong360.tsx` (`/hop-dong/:id`), `HoSoNguoiPhong.css`, `HoSoHopDongToa.css`, test cùng tên + `HoSo360.test.tsx`; `docs/design/ui-redesign/v3/shots/y2/`.
**Không sửa:** `HopDongThaoTac.tsx`, `QuanLyTaiSanPhong.tsx` (của y3), `bangQuanTriChung.tsx`, `ManagementShared.tsx`, `nhomNoTheoNguoi.ts`, `tienTheoNguoi.ts`, `design/**` (của y0).

## 3. Hợp đồng dùng (không sửa)
- y0: `DauTrang`, `KhoiSo`, `DongViec`, `DongNguoiNo`, `NganNhacNo`, `ThanhBuoc` (`doc` cho vòng đời), `DataTable` (`tongHang`, `chips`), `NhanMinhHoa`, `ChanDinh`, `Button` (`variant="danger"` cho việc phá huỷ). Hàm: `nhanThang`, `tinNhacNo`, `linkZalo`, `chuanSdt`, `dinhDangSdt`, `nhomNo`, `tuCongNo`, `tuHoaDonQuanLy`.
- y3: `HopDongThaoTac.tsx` export `GiaHan`, `Ky`, `ThanhLy`, `PhuLuc`, `NguoiOCung`, props giữ nguyên như ở commit gốc. `HoSoHopDong360` chỉ được **gọi** các export này, không được sửa.
- y3: `QuanLyTaiSanPhong.tsx` default export, props giữ nguyên. `HoSoPhong360` chỉ được gọi.
- Ghi thu: nút "Ghi thu X ₫" **dẫn sang** `/thu-tien?nguoiThueId=<id>`. Màn Tiền (y1) mở ngăn ghi thu theo query này, như ux-v2 đã làm. Lô này không dựng lại ngăn ghi thu.

## 4. Hành vi (trích `v3/prototype/app.js` `M['chu/nguoi']`, `M['chu/nguoi/:id']`, `M['chu/toa/:id']`, `M['chu/phong/:id']`, `M['chu/hop-dong/:id']`; ảnh `03,04,05,07,12`)

### T1 · Danh sách Người thuê: sửa "3 giây" (`HoSoNguoiThue.tsx`, ảnh `12-chu-nguoi-1440`)
- `DauTrang`:
  - `tieuDe="Người thuê"`;
  - `phu` là **một dòng việc kế tiếp lấy từ dữ liệu thật**: "<toà> · 63 người đang thuê · **12 người còn nợ 78.670.000 ₫** · **3 hợp đồng hết hạn trong 30 ngày**". Hai cụm in đậm là nút chữ, bấm vào thì đặt chip lọc tương ứng. Cụm nào bằng 0 thì bỏ.
  - `hanhDong` = nút **thường** "Thêm người thuê" → `/hop-dong/moi`. Màn này **không có nút chính**, vì hành động lặp lại theo từng dòng.
- Chip (`DataTable chips`): Tất cả · Còn nợ · Sắp hết hạn (≤ 30 ngày).
- Thứ tự mặc định: còn nợ (nợ nhiều trước) → sắp hết hạn (ít ngày trước) → còn lại theo phòng.
- Cột:
  - Người thuê (avatar chữ đầu, ẩn khi < 768);
  - Phòng (phụ: toà khi đang ở Tất cả toà);
  - Điện thoại `dinhDangSdt`;
  - Thuê đến (phụ vàng "còn N ngày" khi ≤ 30);
  - Còn nợ: đỏ đậm, hoặc chữ phụ "Không nợ";
  - **Hành động theo trạng thái**, một nút thường: nợ → "Ghi thu" (`/thu-tien?nguoiThueId=`), sắp hết hạn → "Gia hạn" (`/hop-dong/:id`), không có gì → không nút.
- Bấm dòng → `/nguoi-thue/:id`.
- < 768: Người thuê · Phòng · Còn nợ.
- Nguồn dữ liệu:
  - người: `managementRequest<Tenant[]>(token, '/api/nguoi-thue')` như hiện tại;
  - nợ: Chủ dùng `tuCongNo(/api/bao-cao/cong-no)`, QL dùng `tuHoaDonQuanLy(/api/hoa-don)`;
  - hợp đồng: `fetchHopDongQuanLy`.

  Nguồn nào lỗi thì chỉ cột của nguồn đó hiện "—" kèm dòng báo trong thẻ. Danh sách vẫn hiện.
- Giữ nguyên form thêm/sửa đang có (dialog). Chỉ đổi kiểu sang token V3.

### T2 · Hồ sơ người thuê (`HoSoNguoiThue360.tsx`, ảnh `03-chu-nguoi-1-1440/390`)
- `DauTrang`:
  - `vet` Người thuê › <tên>;
  - `phu` "Phòng 101 · <toà> · thuê từ dd/mm/yyyy";
  - `hanhDong`: nút thường "0999 100 001" (`tel:`), nút thường "Nhắc qua Zalo" (mở `NganNhacNo`; ẩn khi < 768, ẩn khi không nợ), **nút chính** "Ghi thu X ₫" → `/thu-tien?nguoiThueId=` (**chỉ khi còn nợ**, không nợ thì màn không có nút chính).
- `KhoiSo`:
  - "Còn nợ" (đỏ khi > 0), phụ "4 tháng chưa trả đủ, cũ nhất hạn dd/mm/yyyy" hoặc "Đã trả đủ mọi hoá đơn" (`0 ₫` màu thường);
  - "Tiền phòng" ₫/tháng;
  - "Cọc đang giữ";
  - "Hợp đồng" "còn N ngày", phụ "đến dd/mm/yyyy".
- Lưới 8/4. Bên 8:
  - "Hoá đơn chưa trả đủ": bảng Tháng (`nhanThang`) · Hạn trả · Phải trả · Đã trả · Còn nợ · Trễ (đỏ "113 ngày"), hàng tổng "Cộng", link "Mọi hoá đơn →" `/thu-tien?xem=`. Không nợ thì hiện "Không còn hoá đơn nào chưa trả."
  - Khối "Điện nước 4 tháng" **ẩn** với Chủ và QL, vì không có API điện nước theo phòng cho hai vai này. Không vẽ số minh hoạ.
- Bên 4:
  - "Liên hệ & giấy tờ": Điện thoại · Email · Ngày sinh · Quê quán · Số CCCD;
  - "Hợp đồng": Thời hạn · Báo trước khi trả phòng · Trạng thái, link "Mở →";
  - "Sự cố đã báo": hạng mục, ngày, trạng thái; rỗng thì "Phòng này chưa báo hỏng lần nào.";
  - "Ghi chú liên hệ": "Chưa lưu được ghi chú. Sau mỗi lần gọi hay nhắc, ghi một dòng để người sau biết đã hẹn gì." kèm `NhanMinhHoa` "cần backend". **Không** có ô nhập giả.
- Giữ các tab hoặc ngăn sửa hồ sơ đang có (`?tab=`), chỉ đổi kiểu.

### T3 · Hồ sơ toà: sửa "3 giây" (`HoSoToa360.tsx`, ảnh `04-chu-toa-3-1440/390`)
- `DauTrang`:
  - `vet` Toà & phòng › <tên> (QL không có vết, tiêu đề là "Phòng");
  - `phu` "<địa chỉ> · 6 tầng · 36 phòng";
  - `hanhDong` có nút thường "Giá dịch vụ" → `/dich-vu?toaNhaId=`.
- **Dòng "Việc kế tiếp"** đặt ngay dưới DauTrang (một `DongViec` lớn, có viền trái màu theo mức), lấy việc ưu tiên cao nhất:
  1. sự cố khẩn chưa giao thợ: "Điện phòng 302 khẩn, chưa giao thợ" → **nút chính** "Giao thợ" `/su-co?id=`;
  2. nợ quá hạn: "12 người nợ 78.670.000 ₫, cũ nhất trễ 113 ngày" → **nút chính** "Thu nợ" `/thu-tien?toaNhaId=`;
  3. hợp đồng chờ ký hoặc ≤ 30 ngày: "Hợp đồng phòng 205 hết hạn sau 12 ngày" → **nút chính** "Gia hạn" `/hop-dong/:id`;
  4. tháng này chưa gửi hoá đơn: "Tháng 11 còn ở bước Ghi chỉ số" → **nút chính** "Xem tiến độ" `/chu-ky?toaNhaId=`.

  Không còn việc nào thì hiện "Không có việc gấp ở toà này." và **không có nút chính**. Nút chính của dòng này là nút chính duy nhất trên màn.
- `KhoiSo`: Đang thuê "27 / 36 phòng" · Còn nợ (đỏ) · Tháng trước đã thu % (cộng từ hoá đơn) · Sự cố đang mở.
- Lưới 8/4:
  - **"Sơ đồ phòng"**: mỗi tầng một hàng "Tầng 6", ô phòng gồm số phòng (600) + dòng phụ ("Trống" / "Đang sửa" / "nợ 7,6 triệu" / tên ngắn của người thuê). Kiểu ô: nợ thì nền `--ma-urgent-bg`, trống thì viền đứt, đang sửa thì gạch chéo. Có chú thích. Bấm ô → `/phong/:id`.
  - **"Giá dịch vụ đang áp dụng"**: Dịch vụ · Đơn giá "/ kWh", "/ tháng" hoặc "Miễn phí".
  - **"Cần chú ý"**: tối đa 3 người nợ nhiều nhất, hợp đồng sắp hết hạn hoặc chờ ký, sự cố khẩn.
  - **"An toàn PCCC"**: 3 thiết bị và hạn, quá hạn thì đỏ. Đầu khối ghi "N việc đến hạn".
- < 768: sơ đồ phòng dạng lưới 4 cột, Cần chú ý đặt lên trên Sơ đồ.

### T4 · Hồ sơ phòng (`HoSoPhong360.tsx`, ảnh `05-chu-phong-1-1440/390`)
- `DauTrang`:
  - `vet` <toà> › Phòng 101;
  - `phu` "<toà> · tầng 1 · 25 m² · <loại>";
  - **nút chính theo trạng thái**: phòng trống → "Tạo hợp đồng" `/hop-dong/moi` (chỉ kèm `?phongId=` nếu `TaoHopDong.tsx` ở `feat/v3` đã đọc tham số này; không tự thêm); có nợ → "Ghi thu X ₫" `/thu-tien?nguoiThueId=`; còn lại không có nút chính.
- `KhoiSo`: Người thuê (link) · Giá thuê · Còn nợ · Hợp đồng đến.
- 8/4:
  - "Hoá đơn": Tháng · Hạn · Phải trả · Còn nợ · trạng thái; rỗng "Phòng chưa có hoá đơn nào.";
  - "Công tơ tháng N": điện "đầu → cuối · dùng kWh", nước tương tự; chỉ hiện khi API chỉ số có dữ liệu cho phòng;
  - "Sự cố của phòng";
  - tài sản phòng (`QuanLyTaiSanPhong`) giữ nguyên.

### T5 · Hồ sơ hợp đồng (`HoSoHopDong360.tsx`, ảnh `07-chu-hop-dong-9-1440/390`)
- `DauTrang`:
  - `vet` Hợp đồng › Phòng 101;
  - `phu` "<người thuê> · <toà>";
  - `hanhDong`: nút thường "Tải PDF" (chỉ khi đang có chức năng in/PDF; nếu không thì ẩn) + **nút chính theo trạng thái**: sắp hết hạn → "Gia hạn hợp đồng" (mở `GiaHan`); chờ ký → "Ghi nhận đã ký" (mở `Ky`); còn lại không có nút chính.
- Sắp hết hạn: băng vàng "Hết hạn ngày **dd/mm/yyyy**, còn N ngày. Người thuê phải báo trước 30 ngày nếu trả phòng, hạn báo đã qua." Vế cuối chỉ thêm khi đúng là đã qua.
- 8/4:
  - "Điều khoản chính" (key-value);
  - "Hoá đơn theo hợp đồng";
  - "Vòng đời hợp đồng" = `ThanhBuoc doc` 5 bước: Tạo hợp đồng · Hai bên ký · Đang hiệu lực · Gia hạn hoặc báo trả phòng · Thanh lý, hoàn cọc;
  - "Nếu thanh lý hôm nay": Cọc đang giữ · Trừ nợ hoá đơn "− X ₫" · **Hoàn lại người thuê**. Nợ > cọc thì thêm câu đỏ "Nợ lớn hơn cọc X ₫. Cần thu thêm trước khi thanh lý." Nút `variant="danger"` "Thanh lý hợp đồng…" mở `ThanhLy` (hỏi lại). **Không bao giờ** là nút chính.
- Phụ lục và người ở cùng (`PhuLuc`, `NguoiOCung`) giữ vị trí hiện tại, đổi kiểu theo token.

## 5. Test
- `HoSoNguoiThue.test.tsx`:
  - dòng đầu trang ra đúng "N người còn nợ X ₫" / "K hợp đồng hết hạn trong 30 ngày" từ mock;
  - thứ tự nợ → hết hạn → còn lại;
  - nút theo trạng thái (Ghi thu / Gia hạn / không nút);
  - không có `.btn-primary`;
  - QL không gọi `/api/bao-cao/cong-no`.
- `HoSoToa360.test.tsx`:
  - đủ 4 ca ưu tiên của "Việc kế tiếp" và ca không có việc (không `.btn-primary`);
  - mỗi màn có ≤ 1 `.btn-primary`.
- `HoSo360.test.tsx` / `HoSoHopDong360.test.tsx`:
  - nút chính theo trạng thái (nợ / không nợ; sắp hết / chờ ký / bình thường);
  - "Thanh lý hợp đồng…" không phải `.btn-primary`;
  - "Ghi chú liên hệ" có nhãn "cần backend".
- Test cũ khoá 44px thì đổi theo token y0, ghi lý do.

## 6. Ảnh (`shots/y2/jobs.json`)
| Mã | Đường dẫn · vai · khung | So |
|---|---|---|
| 12 | `/nguoi-thue` CHU 1440 + 390 | `12-chu-nguoi-1440` (ảnh V3 cũ, chưa có dòng việc kế tiếp, ghi rõ khác ở đâu) |
| 03 | `/nguoi-thue/1` CHU 1440, 390 | `03-chu-nguoi-1-*` |
| 04 | `/toa-nha/3` CHU 1440, 390 | `04-chu-toa-3-*` |
| 05 | `/phong/1` CHU 1440, 390 | `05-chu-phong-1-*` |
| 07 | `/hop-dong/9` CHU 1440, 390 | `07-chu-hop-dong-9-*` |
| – | `/nguoi-thue/1` và `/toa-nha/3` với QUAN_LY 1440 | không có ảnh V3, chỉ kiểm quyền và ẩn control |
<!-- CHUNG -->
## Chung cho mọi lô V3 (đọc hết, không cần mở file khác)

**Bối cảnh.** Chủ tịch đã duyệt thiết kế V3 "Sổ cái" (`docs/design/ui-redesign/v3/`). V3 thay ux-v2 ở 5 điểm: font IBM Plex Sans; nút chính màu mực `#14181D` (bỏ teal, bỏ nền kem); tiền gom theo người; trang đầu trả lời câu hỏi của người dùng; 3 mật độ. Lô nền y0 đã gộp vào `feat/v3` các phần sau: token, font, mật độ, component chung, `tienTheoNguoi.ts`. Lô này chỉ dùng lại, **không** sửa các phần đó.

**Ràng buộc (vi phạm thì trả lô):**
- Không push, không merge, không đổi nhánh khác ngoài nhánh lô. Mỗi task một commit, message `ui(y2): …`.
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
cd ~/Documents/PRJ/MiniApart-ui && git worktree add ~/Documents/PRJ/MiniApart-y2 -b ui/y2-ho-so feat/v3
cd ~/Documents/PRJ/MiniApart-y2/frontend && npm ci && npx tsc -b && npx vitest run   # ghi lại số test mốc
```
Ghi file ctx cho lô ở `${TMPDIR:-/tmp}/v3-y2-ctx.md`, gồm: mốc test, task đang làm, commit đã có, việc còn lại. Cập nhật sau mỗi task để phiên sau làm tiếp được. Không commit file này.

**Lệnh kiểm (chạy trước mỗi commit và cuối lô, trong `~/Documents/PRJ/MiniApart-y2/frontend`):**
```bash
npx tsc -b && npx vitest run && npm run build      # vitest có sẵn guard designTokens.test.ts (Inter/teal/mono/IN HOA/hex)
git diff --stat feat/v3...HEAD                                  # chỉ được có file trong "File được sửa" + shots/y2
```

**Chụp ảnh nghiệm thu (dữ liệu thật, chỉ GET):**
```bash
cd ~/Documents/PRJ/MiniApart-y2/frontend && (VITE_BACKEND_URL=http://localhost:5190 npx vite --port 5320 --strictPort > ${TMPDIR:-/tmp}/vite-y2.log 2>&1 &)
cd ~/Documents/PRJ/MiniApart-y2
export TASTE_CDP=~/.hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs MA_APP_URL=http://localhost:5320
export MA_DEMO_PASSWORD="$(python3 -c "import re,pathlib;l=pathlib.Path('~/Documents/PRJ/MiniApart-ui/docker-compose.demo.yml').expanduser().read_text(encoding='utf-8').splitlines()[7];print(re.search(r'mật khẩu (\S+?)\)',l).group(1))")"   # không echo
node docs/design/ui-redesign/tools/app-shot.mjs docs/design/ui-redesign/v3/shots/y2/jobs.json docs/design/ui-redesign/v3/shots/y2
```
`jobs.json` có dạng `[{ "name": "<mã>-<khung>", "path": "/…", "role": "CHU"|"QUAN_LY"|"THO"|"NGUOI_THUE"|"QTHT", "w": 1440|390, "h": 900|844, "full": true }]`. Đặt ảnh cạnh ảnh V3 cùng mã trong `docs/design/ui-redesign/v3/screens/png/` để so. Xong thì tắt vite (`pkill -f "vite --port 5320"`).

**Tiêu chí nghiệm thu đo được (lấy từ `qa.json` do `app-shot.mjs` ghi ra):** `horizontalOverflow` 0 · `belowHit` 0 (ngưỡng ≥36 desktop, ≥44 ở 390 và ở mọi màn Người thuê/Thợ) · `contrast.below` 0 (≥4.5) · `textBelowFloor` 0 (≥13; Người thuê/Thợ ≥16) · `h1.count` = 1 (ghi `h1.left`/`h1.top`) · `noAccessibleName` 0. Với từng ảnh, ghi rõ **khác prototype ở đâu** và **cái gì đổi giữa 1440 và 390**.

**Báo cáo cuối lô:** `docs/design/ui-redesign/v3/shots/y2/BAO-CAO.md`, gồm:
1. Việc theo task, kèm hash commit.
2. Lệnh kiểm đã chạy thật và số test (mốc → sau).
3. Bảng ảnh: mã · khung · khác prototype ở đâu.
4. Test cũ đã sửa, lý do từng test.
5. Không làm / chưa kiểm / cần lô khác / phụ thuộc backend.

Báo cáo viết ngắn, tiếng Việt.
<!-- /CHUNG -->
