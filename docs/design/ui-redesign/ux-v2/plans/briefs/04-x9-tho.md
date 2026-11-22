# Lô x9 — Thợ: Việc (gộp Tổng quan), thẻ việc có bước + một nút kế tiếp

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x9-tho` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x9` · 5319 |
| Cần có | đợt 2 đã gộp |
| Ước | 45', 3 task |
| Đọc thêm | `_common-04.md` · `ux-v2/03` §D3 (bên Thợ) · ảnh `20` (390) · `prototype/app.js` hàm `thoViec` · `ThoCongViec.tsx` (1.410 dòng) + test · `ThoTongQuan.tsx` (đọc để lấy 3 số) |

## File sở hữu
`ThoCongViec.tsx`(+test), mới `ThoCongViec.css` nếu cần. **Không sửa** `ThoTongQuan.tsx`, `ViecCuaToi.tsx` (hết được định tuyến — `/tho/tong-quan` tự chuyển `/viec-cua-toi` từ x0), `ThoChiPhi.tsx` (x12 chỉ đổi lề).

## Task

### 1. Đầu trang Việc (~10')
- Ba số ở đầu `.m-sum` (đang làm · chưa báo giá · còn được trả) lấy từ `fetchThoTongQuan` (nguồn `ThoTongQuan` đang dùng) — chỉ đọc số, không nhúng `ThoTongQuan`.
- Lọc dạng liên kết `seg` (Gấp (n) · Đang làm (n) · Xong (n)), mặc định Gấp nếu có việc gấp, không thì Đang làm; lưu ở `?loc=` (giữ `yeuCauId` như cũ).
- h1 "Việc của tôi" + dòng phụ tên thợ · ngày. Bỏ style inline font cỡ chữ tự đặt (dòng 328, 367) → class `h1`/token có sẵn.

### 2. Thẻ việc (~20')
- Mỗi thẻ (`.job` hoặc thẻ hiện có, giữ `id`/`aria-labelledby` cũ): tag mức độ, tag trạng thái, giờ báo; hạng mục; toà · phòng · tầng; người liên hệ · SĐT; chấm bước `Bước n/4 · {Khảo sát | Báo giá | Sửa | Nhận tiền}` (`aria-label` đủ câu) — ánh xạ từ trạng thái + có báo giá hay chưa, viết thành hàm thuần `buocViecTho(viec)` trong file, có test bảng.
- Hành động: nút gọi (icon, `aria-label="Gọi {tên}"`), **một nút kế tiếp** theo bước gọi đúng handler đang có: "Bắt đầu khảo sát" · "Gửi báo giá" (mở form báo giá đang có trong `ThoCongViec`/drawer) · "Báo đã sửa xong". Bước "Nhận tiền" → không nút kế tiếp, dòng "Chờ quản lý thanh toán". Chỉ **thẻ đầu tiên** dùng `btn-primary`, các thẻ sau `btn-secondary` (theo `03` §D3).
- Bấm thân thẻ mở chi tiết (drawer cũ, giữ `yeuCauId` trên URL).

### 3. Test (~10')
`buocViecTho` 5 ca; chỉ 1 `.btn-primary` trên trang; nút kế tiếp gọi đúng URL/handler như test cũ; `?loc=xong` lọc đúng; `yeuCauId` mở drawer như cũ. Test cũ xanh.

## Ảnh
Thợ `/viec-cua-toi` 390 (so `20`), 1440, `?loc=xong` 390, drawer chi tiết 390; `/tho/tong-quan` (phải tự chuyển); `/tho/chi-phi` 390 (kiểm không vỡ).
**Không bấm nút kế tiếp trên 5190.**

## Không làm
Không đổi luồng báo giá/chứng từ. Không sửa `ThoChiPhi`.
