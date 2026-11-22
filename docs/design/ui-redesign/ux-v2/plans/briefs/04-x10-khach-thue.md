# Lô x10 — Khách thuê: Cần trả (mọi kỳ chưa trả), Trả tiền, Phòng của tôi, Báo hỏng

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x10-khach` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x10` · 5320 |
| Cần có | đợt 2 đã gộp |
| Ước | 45', 4 task |
| Đọc thêm | `_common-04.md` · `ux-v2/03` §D4 · `02` §4 (QR, "Tôi đã chuyển khoản" phụ thuộc backend) · ảnh `21`, `22` (390) · `prototype/app.js` `ntCanTra`, `ntTra`, `mShell` |

## File sở hữu
`HoaDon.tsx`(+test) (chỉ nhánh `cheDoNguoiThue`; nhánh quản lý/công nợ giữ nguyên byte-by-byte về hành vi), `LichSuHoaDon.tsx`(+test), `HopDongNguoiThue.tsx`(+test), `BieuDoTieuThu.tsx`(+test), `BaoHongKhach.tsx`(+test), mới `CanTra.tsx`(+test) nếu tách được gọn hơn.

## Hiện trạng
`/hoa-don-cua-toi` = `HoaDon cheDoNguoiThue` chỉ hiện **kỳ mới nhất** (`fetchHoaDonMoiNhatCuaNguoiThue`, 1.895.000 ₫) và giấu 3 kỳ nợ cũ. `fetchLichSuHoaDonCuaNguoiThue` trả mọi kỳ (có `conLai`) → đủ để tính "Cần trả" mà không cần API mới. QR (`/api/hoa-don/{id}/ma-qr-chuyen-khoan`) **404**; endpoint "khách báo đã trả" **chưa có**. Số tài khoản: chỉ thấy trong `CauHinhBenADto` (`/api/toa-nha/{id}/ben-a`) — **chưa kiểm** khách có GET được không (task 1 kiểm bằng token khách, GET).

## Task

### 1. Cần trả `/hoa-don-cua-toi` (~20')
- Đầu `mShell`: "Phòng {số}" + dòng phụ "{toà} · {tên}". Khối `.payhero`: tag "{n} kỳ quá hạn", "Cần trả", số lớn = tổng `conLai` mọi kỳ chưa trả đủ, câu giải thích, **nút chính** "Trả {tổng}" → `/hoa-don-cua-toi?tra=tat-ca`; nút phụ "Chỉ trả kỳ {kỳ mới nhất}" → `?tra={hoaDonId}`.
- "Các kỳ chưa trả đủ": danh sách `.irow` (kỳ, hạn · đã trả, còn lại, trễ n ngày) → bấm mở chi tiết kỳ (`?hoaDonId=` như cũ). "Kỳ {mới nhất} gồm": các dòng `cacDong` (đã có từ API chi tiết).
- Không nợ: payhero "Không còn khoản nào cần trả" + kỳ mới nhất đã thu.
- Tab trang (khung x0): Cần trả · Lịch sử (`/lich-su`, `LichSuHoaDon` giữ nội dung, chỉ đổi khung mobile + chữ IN HOA nếu có).

### 2. Trả tiền `?tra=` (~10')
- Thanh 3 bước "Bước 2/3 · Chuyển khoản". Số tiền, phạm vi ("4 kỳ 07–10/2026" / "Kỳ 10/2026"), **nội dung chuyển khoản = mã hoá đơn** (nút sao chép, `navigator.clipboard`, có thông báo đã chép).
- Số tài khoản: nếu task 1 xác nhận khách GET được `ben-a` → hiện ngân hàng/số TK/chủ TK; nếu không → câu "Hỏi quản lý toà để lấy số tài khoản" + nút gọi quản lý nếu có SĐT trong dữ liệu đã tải. **Không** hiện số giả như prototype (`000000000000000`).
- Khung QR: không render ô QR giả; một dòng "Mã QR chưa có (chờ API)". Nút "Tôi đã chuyển khoản": **ẩn** (theo `02` §4). Dòng cuối: "Quản lý xác nhận rồi hoá đơn chuyển sang “Đã thu”."
- Trả nhiều kỳ: nội dung chuyển khoản liệt kê các mã hoá đơn, phân tách bằng dấu cách.

### 3. Phòng của tôi + Báo hỏng (~10')
- `/hop-dong` (khách) + `/tieu-thu`: tab "Hợp đồng · Tiêu thụ" (khung x0). `HopDongNguoiThue`, `BieuDoTieuThu`: chỉ đổi khung mobile (lề, thẻ `m-card`, chữ ≥ 13px), bỏ h1 trùng với tab, không đổi dữ liệu.
- `/bao-hong`: `BaoHongKhach` giữ form + danh sách; đổi khung mobile, nút chính duy nhất "Gửi yêu cầu", ảnh tối đa 5 như cũ.

### 4. Test (~5')
Cần trả: tổng = Σ `conLai` từ fixture lịch sử 4 kỳ (7.580.000), số kỳ quá hạn đúng, nút chính đúng nhãn/href; không nợ → không có nút Trả. Trả: nội dung chuyển khoản = mã hoá đơn; không có "Tôi đã chuyển khoản"; không có số TK giả. Test cũ của 5 file xanh (nhánh quản lý của `HoaDon` không đổi — chạy `HoaDon.test.tsx` đủ).

## Ảnh
Khách `/hoa-don-cua-toi` 390 (so `21`), `?tra=tat-ca` 390 (so `22`, khác biệt: không QR, không nút "đã chuyển", số TK theo task 1 — báo Chủ tịch), `/lich-su`, `/hop-dong`, `/tieu-thu`, `/bao-hong` 390; `/hoa-don-cua-toi` 1440.

## Không làm
Không gọi QR/endpoint báo trả. Không đổi nhánh quản lý của `HoaDon`. Không tạo API.
