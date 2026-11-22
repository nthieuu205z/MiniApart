# x10 — Khách thuê (báo cáo)
**Việc / commit** (nhánh ui/x10-khach)
1. Cần trả + Trả tiền (`CanTra.tsx` mới, nối vào nhánh khách-mobile của `HoaDon.tsx`; chưa chọn kỳ → CanTra, có `?hoaDonId=` → chi tiết cũ; lịch sử lỗi → màn kỳ mới nhất cũ). Nhánh quản lý của HoaDon không đổi.
2. Phòng của tôi / Báo hỏng: h1 mobile → `sr-only` (HopDong, TieuThu, LichSu), bỏ lề kép + cột `minmax(0,1fr)` trong chi tiết hoá đơn, nút báo hỏng "Gửi yêu cầu".
3. Ảnh + báo cáo.
**Kiểm**: `npx tsc -b` sạch · `npx vitest run` → Test Files 70 passed (70), Tests 594 passed (594) · `npx vitest run src/CanTra.test.tsx` 4 test mới (tổng 7.580.000, 4 kỳ quá hạn, nhãn/href nút; không nợ → không nút Trả; nội dung CK = mã HĐ, sao chép, không "Tôi đã chuyển khoản", không số TK giả; trả một kỳ) · `npm run build` OK.
**Task 1 (GET ben-a bằng token khách)**: `/api/toa-nha/3/ben-a` → **403**, `/api/toa-nha/3` → 403. ⇒ khách không lấy được số TK; màn Trả hiện "Hỏi quản lý toà để lấy số tài khoản". Không có SĐT quản lý trong dữ liệu đã tải ⇒ không có nút gọi.
**Ảnh** (qa: overflow 0, belowHit 0, contrast.below 0, textBelowFloor 0 cả 7)
| mã | file | khung | khác prototype |
|---|---|---|---|
|21|21-khach-can-tra-390|390|tiêu đề "Cần trả" + tab là của khung nên "Phòng 101" thành tiêu đề trong thân; câu giải thích tổng quát (không nói "trả một nửa"); hạn/đã trả xuống dòng|
|22|22-khach-tra-tien-390|390|không QR giả, không nút "Tôi đã chuyển khoản", số TK = câu hỏi quản lý; thêm nút sao chép + "Về Cần trả"; nội dung CK liệt kê 4 mã|
|23|23-khach-lich-su-390|390|chỉ ẩn h1 trùng tab; thẻ lịch sử giữ nguyên|
|24|24-khach-hop-dong-390|390|bỏ h1 trùng tab|
|25|25-khach-tieu-thu-390|390|bỏ h1 trùng tab|
|26|26-khach-bao-hong-390|390|giữ form + danh sách; nút "Gửi yêu cầu"|
|21|21-khach-can-tra-1440|1440|vẫn là chi tiết kỳ mới nhất cũ (xem dưới)|
**Test cũ đã sửa**: `HoaDon.test` "tenant mobile shows the amount still due…" (đổi tên + assertion: mobile khách không chọn kỳ nay là Cần trả gộp 3.790.000, không còn `data-invoice-due`/khối "Kỳ trước còn nợ"); `BaoHongKhach.test` nhãn nút submit "Gửi yêu cầu sửa chữa" → "Gửi yêu cầu" (brief).
**Chưa làm / chưa kiểm**: desktop (≥768) khách vẫn thấy chỉ kỳ mới nhất (giấu nợ cũ) — CanTra mới chỉ cho mobile vì nhiều test desktop khoá màn cũ; cần quyết định. BaoHongKhach không có prop mobile nên chưa ẩn h2 "Báo hỏng" trùng tiêu đề khung. Ảnh QR/sao chép trên trình duyệt thật chưa bấm (chỉ test mock). Đăng nhập demo từng trả 401 tạm thời khi chụp liên tiếp (hết sau ~1 phút).
