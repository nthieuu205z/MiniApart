# Lô x5 — Chu kỳ tháng (4 bước, một nút chính mỗi bước)

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x5-chu-ky` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x5` · 5315 |
| Cần có | đợt 1 đã gộp (x1 để link Thu tiền có tab đúng). Song song x8 (x8 sửa ruột `GhiChiSo`; x5 chỉ nhúng) |
| Ước | 45', 3 task |
| Đọc thêm | `_common-04.md` · `ux-v2/03` §D1 · ảnh `12` (1440), `23` (390, là việc của x8) · `prototype/app.js` hàm `cycleSteps`, `chuKy` |

## File sở hữu
`ChuKyThang.tsx` (vỏ x0), `DichVuVaKy.tsx`(+test), mới `chuKyThang.ts`(+test), mới `ChuKyThang.test.tsx`.
**Chỉ nhúng, không sửa**: `GhiChiSo.tsx` (`<GhiChiSo token mobile vaiTro anNutChot />`), `HoaDonQuanLy.tsx`.

## API giữ nguyên (đã có hàm)
`fetchKyThanhToan(token, toa)` · `fetchPhongChuaGhiChiSo(token, toa, ky)` · `chotKyThanhToan(token, toa, ky)` · `bulkInvoice(token, toa, ky, 'tao-hang-loat' | 'phat-hanh-hang-loat')` · `fetchHoaDonQuanLy(token, toa, '')`.

## Task

### 1. `chuKyThang.ts` — tính bước từ dữ liệu (~10')
Hàm thuần `tinhBuoc({ ky, soCongToThieu, hoaDon })` → `{ buocHienTai: 1|2|3|4, buoc: [{ ten, tomTat, trangThai: 'xong'|'dang'|'chua' }] }`:
- 1 Ghi chỉ số: xong khi `soCongToThieu === 0` hoặc kỳ đã chốt. Tóm tắt "n/m công tơ · còn k".
- 2 Chốt kỳ: xong khi trạng thái kỳ là đã chốt (đọc đúng giá trị enum trong `ThongTinKyThanhToan` — grep, không đoán). Tóm tắt "mở từ {ngày chốt}".
- 3 Phát hành: xong khi mọi hoá đơn của kỳ khác `NHAP`. Tóm tắt "x nháp · y đã phát hành".
- 4 Thu tiền: "còn n hoá đơn chưa thu đủ" (luôn là bước theo dõi, không bao giờ "xong" trong kỳ).
Test bảng: 6 ca (kỳ mở thiếu công tơ; đủ công tơ chưa chốt; đã chốt chưa tạo hoá đơn; có nháp; đã phát hành hết; kỳ không tồn tại → rỗng).

### 2. Trang `/chu-ky` (~25')
- Toà: `useMotToa()` (Chủ "Tất cả toà" → ô chọn toà tại chỗ). Kỳ: kỳ đang mở mới nhất; ô chọn kỳ phụ cho kỳ trước.
- `.ph`: h1 "Chu kỳ tháng {MM/YYYY}", dòng phụ "{toà} · kỳ {từ – đến} · chốt sổ sau n ngày".
- `<nav class="steps" aria-label="Các bước chu kỳ tháng">` 4 bước, bước hiện tại `aria-current="step"`, bấm bước đã xong/hiện tại đổi `?b=`.
- Thân theo bước, **mỗi bước đúng một nút chính**:
  - b=1: `<GhiChiSo … anNutChot />` (x8 làm ruột). Banner cảnh báo "Còn k công tơ chưa ghi" ở trên do `ChuKyThang` render từ `fetchPhongChuaGhiChiSo` (nút chính "Ghi k công tơ" cuộn tới công tơ đầu tiên chưa ghi — `document.getElementById` theo id x8 đặt, thống nhất id `cong-to-{phongId}-{dichVuId}` trong báo cáo).
  - b=2: khối giải thích "Khoá chỉ số, không sửa được nữa" + **"Chốt kỳ"** → `ConfirmDialog` (có sẵn) → `chotKyThanhToan`. Nút bị khoá kèm lý do khi còn công tơ thiếu (`Button blocked blockedReason`). Thông báo kết quả y như `GhiChiSo` cũ hiển thị.
  - b=3: số hoá đơn nháp / đã phát hành; chưa có nháp → **"Tạo nháp n hoá đơn"** (`tao-hang-loat`); có nháp → **"Phát hành n hoá đơn"** (`phat-hanh-hang-loat`, `ConfirmDialog`); link phụ "Kiểm từng hoá đơn" → `/hoa-don?toaNhaId=&kyId=`.
  - b=4: tóm tắt kỳ (đã phát hành, đã thu đủ, còn phải thu) + **"Mở Thu tiền"** → `/thu-tien`.
- Cột phải: "Sau bước này" (`.vsteps` các bước còn lại + 1 câu mỗi bước) · "Kỳ trước (đã chốt)" 3 dòng `.sumrow` + link Thu tiền.
- Mặc định mở bước `buocHienTai`.

### 3. Dịch vụ & đơn giá `/dich-vu` (~10')
- `DichVuVaKy`: bỏ phần quản lý **kỳ** khỏi màn (nay ở Chu kỳ tháng) — chỉ ẩn khối kỳ, không xoá hàm; thêm 1 dòng link "Kỳ thanh toán và chốt sổ nằm ở Chu kỳ tháng →". Giữ nguyên dịch vụ, đơn giá. **Nếu** khối kỳ có thao tác không có ở Chu kỳ tháng (vd tạo kỳ mới) → giữ lại thao tác đó ở `DichVuVaKy`, ghi vào báo cáo.

## Test tối thiểu
`chuKyThang.test.ts` 6 ca. `ChuKyThang.test.tsx`: mở đúng bước theo dữ liệu; b=2 nút khoá khi thiếu công tơ, bấm khi đủ → dialog → gọi `POST …/chot` đúng URL; b=3 tạo nháp rồi phát hành gọi đúng `bulkInvoice` action; mỗi bước chỉ 1 `.btn-primary`. `DichVuVaKy` test cũ xanh.

## Ảnh
QL `/chu-ky` 1440 (so `12`) + `?b=2`, `?b=3`, `?b=4`; Chủ `/chu-ky` khi "Tất cả toà" (ô chọn toà tại chỗ) và khi chọn toà 3; 390 bước 1 (ảnh nghiệm thu chung với x8); `/ghi-chi-so` (phải tự chuyển về `/chu-ky`); `/dich-vu`.
**Không bấm Chốt kỳ / Phát hành trên 5190** (chỉ chụp trước khi bấm).

## Không làm
Không sửa `GhiChiSo` (x8). Không viết API chốt/phát hành mới. Không làm màn ghi chỉ số điện thoại (x8).
