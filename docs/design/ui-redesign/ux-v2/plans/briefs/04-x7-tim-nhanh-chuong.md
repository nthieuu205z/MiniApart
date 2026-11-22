# Lô x7 — Tìm nhanh (Ctrl/⌘+K) + chuông thông báo

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x7-tim-nhanh` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x7` · 5317 |
| Cần có | đợt 1 đã gộp (link hồ sơ `/nguoi-thue/:id`, `/phong/:id`, `/hop-dong/:id` phải mở màn thật) |
| Ước | 45', 3 task |
| Đọc thêm | `_common-04.md` · `ux-v2/02` §1 + §4 (Tìm nhanh lọc phía client) · ảnh `03` (Ctrl+K), `11` (chuông) · `prototype/app.js` `searchIndex`, `cmdk`, `overlays` · `ma-mau/.../timNhanh.ts`(+test) |

## File sở hữu
`TimNhanh.tsx`, `ChuongThongBao.tsx` (vỏ x0), mới `timNhanh.ts`(+test) (chép mã mẫu), `ThongBao.tsx`(+test), mới `TimNhanh.test.tsx`, `ChuongThongBao.test.tsx`.

## Task

### 1. Bảng lệnh (~25')
- Chép `timNhanh.ts` + test nguyên văn.
- `TimNhanh` (Chủ/QL): mở bằng Ctrl+K / ⌘+K (lắng nghe `keydown` ở `window`, `preventDefault`), bằng nút ô tìm ở thanh trên (x0 đã nối: khung mount `<TimNhanh {...trangProps} mo datMo />`, nút gọi `datMo(true)`), và bằng `/` khi focus không ở ô nhập. `role="dialog"` `aria-modal` `aria-label="Tìm nhanh"`, ô `role="combobox"` `aria-expanded` `aria-controls` → `role="listbox"`, mỗi kết quả `role="option"` `aria-selected`; mũi tên lên/xuống, Enter mở (`dieuHuong(href)`), Esc đóng, focus trả về chỗ cũ.
- Dữ liệu: tải **lần đầu mở** (không tải khi khởi động), cache trong phiên: `managementRequest('/api/nguoi-thue')`, `fetchPhong` + `fetchHopDongQuanLy` + `fetchHoaDonQuanLy(token, toa, '')` cho các toà của context (Chủ: mọi toà; QL: 1 toà). Dựng bằng `taoChiMuc`, tìm bằng `timNhanh` (đã nhóm, tối đa 4/nhóm), tô đậm bằng `catDanhDau` (`<mark>`).
- Nhóm Lệnh luôn hiện cuối: Ghi nhận thu tiền (`/thu-tien`) · Tạo hợp đồng (`/hop-dong/moi`) · Báo sự cố (`/su-co?baoMoi=1`).
- Trạng thái: đang tải (skel 3 dòng), chưa gõ (chỉ Lệnh + gợi ý "Gõ tên, số phòng, mã hợp đồng hoặc mã hoá đơn"), không thấy ("Không thấy “…” trong dữ liệu đã tải." + Lệnh), lỗi tải (Thử lại).
- `shortcut:` đã có trong mã mẫu — giữ nguyên comment.

### 2. Chuông (~15')
- `ChuongThongBao` (x0 đã đặt vào TopBar qua prop `chuong`; mọi vai trò có `/thong-bao`): nút chuông có số chưa đọc (`aria-label="Thông báo, n chưa đọc"`), bấm mở popover (`.pop`, `role="dialog"`, Esc/click ngoài đóng, focus trả về chuông): tiêu đề + "Đánh dấu đã đọc" (gọi đúng API đánh dấu mà `ThongBao` đang dùng), 5 tin mới nhất (`fetchThongBao`), link "Xem tất cả" → `/thong-bao`.
- Số chưa đọc: `ThongBao` đã có `onUnreadCountChange` — dùng cùng nguồn (gọi `fetchThongBao` và đếm như `ThongBao` đếm). Làm mới khi đóng popover và khi trang `/thong-bao` báo đổi.
- `ThongBao.tsx` (`/thong-bao`): QL — giữ phần **soạn thông báo cư dân**, hộp thư cá nhân thu gọn thành danh sách ngắn (popover đã lo việc đọc nhanh); Thợ/Khách — giữ hộp thư. Bỏ ô chọn toà riêng → context. Không đổi API.

### 3. Test (~10')
`TimNhanh.test.tsx`: Ctrl+K mở, Esc đóng + focus trả; gõ "quang huy" ra 2 người (fixture có "Nguyễn Quang Huy", "Trần Quang Huy"); mũi tên + Enter gọi `dieuHuong` đúng href hoá đơn có `kyId`; không tải API trước khi mở; QL không gọi `/api/bao-cao/cong-no`. `ChuongThongBao.test.tsx`: số chưa đọc; mở popover 5 tin; "Đánh dấu đã đọc" gọi API rồi số về 0. Test cũ `ThongBao` xanh.

## Ảnh
Chủ Ctrl+K đã gõ "quang huy" 1440 (so `03`) — cần bấm phím → script CDP riêng hoặc ghi "chưa chụp" + test; chuông mở (so `11`) cùng cách; QL `/thong-bao` 1440 + 390; Thợ `/thong-bao` 390.

## Không làm
Không gọi API tìm toàn cục (chưa có). Không tìm trên server. Không đổi API thông báo.
