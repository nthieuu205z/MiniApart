# Lô x4 — Hồ sơ 360°: Hợp đồng + Toà nhà

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x4-ho-so-hop-dong-toa` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x4` · 5314 |
| Cần có | x0 đã gộp (song song x3, không chung file) |
| Ước | 50', 4 task |
| Đọc thêm | `_common-04.md` · `ux-v2/03` §C · ảnh `08` (hợp đồng), `09` (toà) · `prototype/app.js` hàm `hopDong360`, `toa360` · `HopDongThaoTac.tsx` dòng 100–230, 424–448 (các thao tác hợp đồng) |

## File sở hữu
`HoSoHopDong360.tsx`, `HoSoToa360.tsx` (vỏ x0), `HopDongQuanLy.tsx`(+test), `DanhMucToaNha.tsx`(+test), mới `HoSoHopDong360.test.tsx`, `HoSoToa360.test.tsx`, `HoSoHopDongToa.css` nếu cần. Lớp hồ sơ (`.prof`, `.cols`, `.rooms`, `.vsteps`, `.strip`) đã có trong `design/ux-v2.css` từ x0.
`HopDongThaoTac.tsx` (2.743 dòng) **chỉ được import và nhúng**, không sửa (x11 sở hữu).

## Task

### 1. Hồ sơ hợp đồng `/hop-dong/:id` (~20')
- Dữ liệu: `fetchHoSoHopDong`/`/api/hop-dong/{id}` (grep hàm đang dùng trong `HopDongThaoTac`), phụ lục `fetchPhuLucHopDong`, giá dịch vụ, nợ theo hợp đồng (Chủ công nợ lọc `hopDongId`; QL hoá đơn toà lọc phòng + người).
- Đầu: "Hợp đồng #{id} · Phòng {số}", meta toà · người · thời hạn, tag trạng thái + "Hết hạn sau n ngày" (≤ 30) + "Nợ x ₫". Nút theo trạng thái (`03` §C, **Em chọn** đã duyệt): sắp hết hạn & hiệu lực → **chính "Gia hạn"**; chờ ký → **chính "Ký hợp đồng"**; hiệu lực bình thường → **không** nút chính. Phụ "Tải PDF" (hàm tải đang có). "…" = Thanh lý · Phụ lục · Khoản phát sinh · Người ở cùng · Giao dịch cọc.
- Mỗi thao tác (Gia hạn, Ký, mục trong "…") mở **ngăn** nhúng đúng phần UI/handler đang có trong `HopDongThaoTac` (component con đã export; nếu phần đó không export được mà không sửa file → mở `HopDongThaoTac` ở chế độ chi tiết hợp đồng trong ngăn với `hopDongId` đã chọn, như `HopDongQuanLy` đang làm). Sau thao tác → tải lại hồ sơ.
- Thân: trái Điều khoản (giá, cọc, báo trước, thanh tiến độ thời hạn) · Dịch vụ áp dụng · Hoá đơn theo hợp đồng; phải Liên kết (người thuê `/nguoi-thue/{id}`, phòng `/phong/{id}?toaNhaId=`) · Mốc (`.vsteps`).

### 2. Danh sách hợp đồng `/hop-dong` (~10')
- Giữ bảng đã duyệt + bộ lọc URL (`layBoLocHopDongQuanLyTuUrl`). Bấm hàng → `/hop-dong/{id}`. Nút "Tạo hợp đồng" → `/hop-dong/moi` (x0 đang cho vỏ `TaoHopDong` = form cũ; x11 thay). **Bỏ** chi tiết/forms mở dưới bảng. Ô chọn toà → `useMotToa()`.

### 3. Hồ sơ toà `/toa-nha/:id` (~15')
- Dữ liệu: `fetchToaNha` (tìm id), `fetchPhong(token, id)`, nợ (Chủ công nợ lọc toà; QL hoá đơn toà), hợp đồng (`fetchHopDongQuanLy`), sự cố.
- Đầu: tên, địa chỉ, số tầng · số phòng · ngày chốt sổ. Nút: phụ "Sửa thông tin toà" (mở ngăn chứa form toà đang có trong `DanhMucToaNha`), **chính "Khai báo phòng"** (form khai báo phòng đang có — grep trong `DanhMucToaNha`/`DanhMucPhong`; nếu nằm trong `DanhMucPhong` (x3) thì link `/phong?toaNhaId=&moi=1` và ghi vào báo cáo; QTHT: chỉ những nút QTHT vốn có).
- `.strip` (đang thuê, còn phải thu, sự cố mở, hợp đồng cần xử lý) · Sơ đồ phòng theo tầng (`.rooms`, mỗi ô `<a href="/phong/{id}?toaNhaId=">`, màu theo trạng thái + chữ trạng thái — không chỉ màu) · "Cần chú ý ở toà này" (3 người nợ nhiều nhất, hợp đồng sắp hết/chờ ký).

### 4. Danh sách toà `/toa-nha` (~5')
- `DanhMucToaNha`: thẻ/hàng toà là `<a href="/toa-nha/{id}">`. Form tạo/sửa chuyển vào ngăn (giữ nguyên trường/payload). QTHT, Chủ, QL giữ đúng quyền thao tác hiện có (đọc `vaiTro` như cũ).

## Test tối thiểu
Hợp đồng: 3 ca nút chính (sắp hết → Gia hạn; chờ ký → Ký; bình thường → không có `.btn-primary`); "…" có 5 mục; liên kết đúng href. Toà: sơ đồ đủ số phòng, ô có `aria-label` gồm số phòng + trạng thái; "Cần chú ý" xếp nợ giảm dần. Danh sách: bấm hàng điều hướng, không còn form dưới bảng. QTHT mở `/toa-nha/3` không thấy nút của Chủ/QL.

## Ảnh
Chủ `/hop-dong/{id sắp hết}` (so `08`), `/hop-dong/{id chờ ký}`, `/hop-dong/{id bình thường}` 1440 + 1 ảnh 390; Chủ `/toa-nha/3` 1440 (so `09`) + 390; QTHT `/toa-nha/3`; Chủ `/hop-dong`, `/toa-nha`.

## Không làm
Không sửa `HopDongThaoTac.tsx`. Không thêm trạng thái hợp đồng. Không làm wizard tạo hợp đồng (x11).
