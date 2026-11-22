# Lô x11 — Tạo hợp đồng 5 bước

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x11-tao-hop-dong` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x11` · 5321 |
| Cần có | đợt 2 đã gộp (x4 đã chuyển nút "Tạo hợp đồng" sang `/hop-dong/moi`) |
| Ước | 50', 3 task — file lớn nhất repo, đọc kỹ trước khi sửa |
| Đọc thêm | `_common-04.md` · `ux-v2/03` §D2 · ảnh `14` · `prototype/app.js` hàm `hopDongMoi` · `HopDongThaoTac.tsx` (2.743 dòng: phần form tạo hợp đồng, validate, POST) + `HopDongThaoTac.test.tsx` |

## File sở hữu
`TaoHopDong.tsx` (vỏ x0, hiện = form cũ), `HopDongThaoTac.tsx`(+test), mới `TaoHopDong.test.tsx`.

## Nguyên tắc
Toàn bộ trường lấy từ form tạo hiện có, **chỉ chia lại thành bước; không thêm trường, không đổi payload POST, không đổi validate** (`03` §D2). Cách ít rủi ro nhất: tách state + handler tạo hợp đồng của `HopDongThaoTac` thành hook export (`useFormTaoHopDong`) trong cùng file, giữ nguyên logic; `TaoHopDong` dùng hook đó và chia JSX ra 5 bước. Form cũ trong `HopDongThaoTac` (nếu còn chỗ khác dùng) dùng lại cùng hook.

## Task

### 1. Tách hook (~20')
- Kiểm `git grep -n "HopDongThaoTac"` để biết mọi nơi dùng. Tách state/validate/submit của phần tạo vào `useFormTaoHopDong(token, toaNhaId, macDinh?)`. Test cũ `HopDongThaoTac.test.tsx` phải xanh **không sửa** sau bước này (commit riêng).

### 2. Wizard `/hop-dong/moi` (~25')
- Breadcrumb Hợp đồng › Tạo hợp đồng; h1 "Tạo hợp đồng". `.wiz` 3 cột: trái `.vsteps` 5 bước (Phòng & người thuê · Thời hạn & giá · Dịch vụ áp dụng · Người ở cùng & cọc · Xem lại & tạo), bước xong có tick + tóm tắt, bấm quay lại được, bước chưa tới không bấm được; giữa form bước hiện tại (nhãn luôn hiện, `help` dưới ô, lỗi theo ô); phải Tóm tắt (`.sumrow`).
- Chân form: ghost "Huỷ" (→ `/hop-dong`, hỏi xác nhận nếu đã nhập), phụ "Quay lại", **chính "Tiếp: {tên bước sau}"**; bước 5 chính = **"Tạo hợp đồng"** (gọi submit của hook). "Lưu nháp": chỉ làm nếu form cũ đã có lưu nháp; nếu không có → không làm (không thêm nghiệp vụ), ghi vào báo cáo.
- Chặn "Tiếp" khi bước có lỗi validate (dùng validate của hook theo nhóm trường của bước). Bước ở `?buoc=` (Back trình duyệt đi lùi bước).
- Tham số vào: `?phongId=&toaNhaId=` (từ hồ sơ phòng trống, x3) → điền sẵn bước 1, mở bước 2. Toà: `useMotToa()`.
- Tạo xong → `dieuHuong('/hop-dong/{idMới}')` (hồ sơ hợp đồng, x4).
- ≤ 767px: cột trái thành dòng "Bước n/5 · {tên}" + thanh chấm; tóm tắt gấp dưới form; nút chính dính đáy.

### 3. Test (~5')
Đi đủ 5 bước với fixture → POST đúng URL + body **bằng** body form cũ tạo ra (so với snapshot từ test cũ); "Tiếp" bị chặn khi thiếu trường bắt buộc; quay lại bước 1 giữ dữ liệu; `?phongId=` điền sẵn; mỗi bước chỉ 1 `.btn-primary`.

## Ảnh
QL `/hop-dong/moi?phongId={401}&toaNhaId=3` 1440 bước 2 (so `14`) — mở bước bằng `?buoc=2`; bước 1, 3, 4, 5 1440; bước 2 390.
**Không bấm "Tạo hợp đồng" trên 5190.**

## Không làm
Không thêm trường/ bước nghiệp vụ. Không đổi luồng ký/gia hạn/thanh lý (đã ở hồ sơ x4).
