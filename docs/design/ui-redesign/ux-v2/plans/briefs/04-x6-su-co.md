# Lô x6 — Sự cố: một danh sách + ngăn chi tiết, 6 bước, nút chính đổi theo bước

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x6-su-co` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x6` · 5316 |
| Cần có | đợt 1 đã gộp |
| Ước | 45', 3 task |
| Đọc thêm | `_common-04.md` · `ux-v2/03` §D3 · ảnh `13` · `prototype/app.js` `SC_STEPS`, `scStep`, `suCo` |

## File sở hữu
`TrangSuCo.tsx` (vỏ x0), `SuCoQuanLy.tsx`(+test nếu có), `QuanLyBaoGiaVaThanhToan.tsx`(+test), mới `TrangSuCo.test.tsx`, `SuCo.css` nếu cần.
**Không sửa** `LichSuSuaChua.tsx` (trước đây hiện dưới `/su-co`; nay nội dung nằm trong chip "Đã đóng" + ngăn; giữ file + test), `QuanLySuaChua.tsx` (biến thể khách không dùng ở đây). `managementFlows.test.tsx`: chỉ `it` của sự cố nếu có.

## Hiện trạng (đo 22/11)
`/su-co` = `QuanLySuaChua` (→ `SuCoQuanLy`, đã có danh sách + chi tiết chọn) **cộng** `LichSuSuaChua` (bảng thứ hai, tự `replaceState` về `/su-co?…`). `SuCoQuanLy` có nhóm Mới · Đang xử lý · Chờ xác nhận · Đã đóng, các lệnh `/api/yeu-cau-sua-chua/{id}/{path}` (tiếp nhận, phân công, huỷ, xác nhận đóng…), dùng `useBuildings` (đã theo toà khung từ x0).

## Task

### 1. Danh sách + chip (~15')
- `TrangSuCo` render `SuCoQuanLy` (bỏ `LichSuSuaChua` khỏi trang). `.ph`: h1 "Sự cố", dòng phụ "{toà} · bấm một dòng để xem chi tiết bên phải", nút **phụ** "Báo sự cố" (form tạo có sẵn trong `SuCoQuanLy`, mở trong ngăn). Trang không có nút chính ở đầu — nút chính nằm trong ngăn (**Em chọn**, theo prototype).
- Chip đổi theo `03` §D3: Đang mở (mặc định) · Cần phân công (`MOI_TIEP_NHAN`, `DA_TIEP_NHAN`) · Đang sửa (`DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_XAC_NHAN`) · Đã đóng (`DA_DONG`, `DA_HUY`); số đếm trên chip; khẩn cấp lên đầu, rồi mới nhất. Ô tìm phòng/hạng mục (không dấu — dùng `boDau` nếu x7 đã gộp, nếu chưa thì `normalize('NFD')` tại chỗ 1 dòng).
- Hàng = `.irow` `<a href="/su-co?id={id}&loc={chip}">` (đường dẫn giữ `/su-co`; chọn bằng query, Back hoạt động), hàng đang chọn `aria-current="true"`.
- `?baoMoi=1&phongId=` (từ hồ sơ phòng, x3) → mở sẵn form báo sự cố với phòng đó.

### 2. Ngăn chi tiết (~20')
- Desktop: `.split` (danh sách trái, `.drawer` phải luôn hiện); ≤ 1180px: ngăn trượt phủ, `role="dialog"`, Esc đóng, focus trả về hàng; ≤ 767px: toàn màn.
- Đầu ngăn: tag mức độ, tag trạng thái, mã; h2 hạng mục; toà · phòng · tầng. Mô tả. **Tiến độ 6 bước** (`.vsteps`): Tiếp nhận → Phân công thợ → Khảo sát & báo giá → Duyệt báo giá → Sửa xong · chờ nghiệm thu → Thanh toán thợ; ánh xạ trạng thái theo `scStep` của prototype, bước "Duyệt báo giá"/"Thanh toán thợ" đọc thêm trạng thái báo giá/thanh toán từ `fetchBaoGiaYeuCau`/`fetchThanhToanYeuCau`.
- `.kv`: báo lúc, liên hệ, thợ, chi phí, ảnh (`fetchLienKetAnh` nếu `SuCoQuanLy` đang dùng).
- Chân ngăn: **một nút chính theo bước** gọi đúng lệnh cũ: Phân công thợ (form chọn thợ cũ) · Duyệt báo giá (nhúng `QuanLyBaoGiaVaThanhToan` phần báo giá) · Nghiệm thu (`xac-nhan-dong` như cũ) · Xác nhận thanh toán thợ (phần thanh toán của `QuanLyBaoGiaVaThanhToan`). Bước "Khảo sát & báo giá" (việc của thợ) → không nút chính, chỉ dòng "Đang chờ thợ gửi báo giá". Nút phụ "Huỷ yêu cầu" (lý do bắt buộc như cũ). "Nhắc thợ" trong prototype **không làm** (chưa có API) — ghi vào báo cáo.
- Đã đóng: ngăn chỉ đọc, hiện chi phí cuối + lịch sử (dữ liệu `fetchLichSuSuaChua`/`fetchChiTietSuaChua` mà `LichSuSuaChua` đang dùng).

### 3. Test (~10')
Chip lọc + số đếm; khẩn cấp lên đầu; chọn hàng đổi query + ngăn; mỗi trạng thái → đúng nhãn nút chính (bảng 5 ca) và đúng URL lệnh; huỷ cần lý do; Esc đóng ngăn (≤ 1180). Test cũ `QuanLyBaoGiaVaThanhToan` xanh.

## Ảnh
QL `/su-co` 1440 (so `13`), `/su-co?loc=xong`, Chủ `/su-co` "Tất cả toà", 1180 ngăn mở, 390 danh sách + 390 ngăn.
**Không bấm lệnh nào trên 5190.**

## Không làm
Không thêm "Nhắc thợ". Không đổi API/thứ tự lệnh. Không sửa màn thợ (x9).
