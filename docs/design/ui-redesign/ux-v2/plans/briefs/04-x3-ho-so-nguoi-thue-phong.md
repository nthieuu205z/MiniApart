# Lô x3 — Hồ sơ 360°: Người thuê + Phòng

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x3-ho-so-nguoi-phong` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x3` · 5313 |
| Cần có | x0 đã gộp |
| Ước | 50', 4 task |
| Đọc thêm | `_common-04.md` · `ux-v2/03` §C (bảng hồ sơ, bố cục chung) · ảnh `06` (người thuê), `07` (phòng) · `prototype/app.js` hàm `nguoiThue360`, `phong360` · `ma-mau/.../nhomNoTheoNguoi.ts` |

## File sở hữu
`HoSoNguoiThue360.tsx`, `HoSoPhong360.tsx` (vỏ x0), `HoSoNguoiThue.tsx`(+test), `DanhMucPhong.tsx`(+test), mới `HoSo360.test.tsx`, `HoSoNguoiPhong.css` nếu cần. Lớp hồ sơ (`.prof`, `.cols`, `.side`, `.kv`, `.tl`, `.vsteps`, `.sumrow`) đã có trong `design/ux-v2.css` từ x0 — dùng lại, không chép.

## Bố cục chung (theo `03` §C)
`<Breadcrumb>` 2 tầng → `.prof` (avatar/ô số phòng · h1 · `.meta` · `.tags`) với `.ph-acts`: **1 nút chính** + tối đa 2 phụ + nút "…" (menu, `aria-haspopup="menu"`, Esc đóng, mũi tên di chuyển) → thân `.cols` 2 cột (trái: khối nghiệp vụ, mỗi hàng là `<a href>` tới hồ sơ đích; phải: Hoạt động + tra cứu). ≤ 767px: 1 cột, nút chính dính đáy (`.sticky-act`).

## Task

### 1. Hồ sơ người thuê `/nguoi-thue/:id` (~20')
- Dữ liệu: người (`managementRequest('/api/nguoi-thue')` lọc id — như `HoSoNguoiThue` đang tải), hợp đồng (`fetchHopDongQuanLy` toà của người; Chủ "Tất cả toà" → từng toà), nợ (Chủ `fetchCongNoBaoCao` → `tuCongNo` lọc `nguoiThueId`; QL `fetchHoaDonQuanLy(token, toa, '')` → `tuHoaDonQuanLy` lọc theo hợp đồng của người), sự cố của phòng (`/api/yeu-cau-sua-chua` lọc phòng), điện 4 kỳ (`fetchChiSoDichVu`/nguồn đang có — nếu không có GET cho quản lý theo phòng thì **ẩn khối**, ghi vào báo cáo).
- Đầu: tên, tag Đang thuê/Chưa có hợp đồng, tag Nợ x ₫/Không nợ, tag n sự cố. Nút: phụ "Gọi" (`tel:`), **chính "Ghi nhận thu tiền"** (link `/thu-tien?nguoiThueId={id}` — x1 mở ngăn khi có tham số này), "…" = Sửa hồ sơ · Khai báo cư trú (`/cu-tru`) · Ảnh giấy tờ.
- Tab (query `?tab=`, `<a>` + `aria-current`, không `role=tab`): Tổng quan · Hoá đơn (n) · Hợp đồng (n) · Sự cố (n) · Giấy tờ & cư trú. Tổng quan = Tiền + Hợp đồng + Sự cố + Hoạt động (trái), Liên hệ & giấy tờ + Điện (phải).
- Hoạt động: dựng từ dữ liệu đã tải (sự cố mới nhất, thanh toán gần nhất nếu có, hoá đơn quá hạn, bắt đầu hợp đồng), dòng chú "Ghi chú cuộc gọi/nhắn tin: cần API mới".
- "Sửa hồ sơ": mở ngăn chứa **form cũ** của `HoSoNguoiThue` (tách form + ảnh giấy tờ thành component export trong cùng file, giữ nguyên validate/payload/upload). Lưu xong → tải lại hồ sơ.

### 2. Danh sách người thuê `/nguoi-thue` (~8')
- Giữ bảng + tìm. Bấm hàng (hoặc tên — `<a href="/nguoi-thue/{id}">`) → hồ sơ. **Bỏ form mở bên dưới danh sách** (form sửa giờ ở hồ sơ). Nút "Thêm người thuê" mở cùng ngăn form (tạo mới). Không còn `isFormOpen` cuộn xuống y = 1.140px.

### 3. Hồ sơ phòng `/phong/:id` (~15')
- Dữ liệu: `fetchPhong(token, toa)` tìm id (toà từ query `toaNhaId` nếu có, không thì quét toà của context), hợp đồng của phòng, hoá đơn của phòng (`fetchHoaDonQuanLy(token, toa, '')` lọc `soPhong`, 4 kỳ gần nhất), sự cố, chỉ số kỳ này (`fetchChiSoDichVu` nếu có cho kỳ đang mở).
- Breadcrumb: `{Tên toà}` (`/toa-nha/{id}`) › Phòng {số}. Nút: phòng trống → **chính "Tạo hợp đồng"** (`/hop-dong/moi?phongId={id}&toaNhaId=`); đang thuê → phụ "Mở hợp đồng" (không có nút chính); phụ "Báo sự cố" (`/su-co?baoMoi=1&phongId=`).
- Chủ: vào được `/phong/:id` (định tuyến đã cho); QL: như cũ.

### 4. Danh sách phòng `/phong` (QL) (~5')
- `DanhMucPhong`: ô chọn toà → `useMotToa()`; ô phòng trên sơ đồ/hàng bảng là `<a href="/phong/{id}?toaNhaId=">`. Bỏ form/chi tiết mở dưới danh sách nếu có (chi tiết giờ ở hồ sơ); thao tác sửa phòng giữ nguyên chỗ cũ nếu là dialog.

## Test tối thiểu
Hồ sơ người: tiêu đề + tag nợ đúng tổng; tab đổi query; nút chính duy nhất; "…" mở menu bằng bàn phím; Sửa hồ sơ mở ngăn có form, lưu gọi đúng `PUT` như test cũ. Danh sách: bấm hàng gọi `dieuHuong('/nguoi-thue/1')`, không còn form dưới bảng. Hồ sơ phòng: trống → nút chính "Tạo hợp đồng" đúng href; đang thuê → không nút chính. QL không gọi `/api/bao-cao/cong-no`.

## Ảnh
Chủ `/nguoi-thue/1` 1440 (so `06`) + 390; QL `/nguoi-thue/1`; Chủ `/nguoi-thue`; QL `/phong/{id phòng 101}` + phòng trống 401 (so `07`) + 390; QL `/phong`.

## Không làm
Không thêm API ghi chú liên hệ. Không đổi form người thuê (trường, validate). Không làm hồ sơ hợp đồng/toà (x4).
