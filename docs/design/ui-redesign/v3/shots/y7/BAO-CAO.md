# Báo cáo y7 — Thợ (nhánh ui/y7-tho)

## 1. Việc theo task
- T1–T4 Việc · Chi tiết · Báo giá · Báo đã sửa xong: `ThoCongViec.tsx` viết lại (1.291 → ~560 dòng), commit `0f4d0d9` + sửa sau chụp ảnh (commit cuối lô).
- T5 Tiền công: `ThoChiPhi.tsx` viết lại (856 → ~480 dòng), commit `c5c735a`. Hex cứng: 0 ở cả hai file.
- Màn chi tiết / báo giá là màn riêng theo URL `?yeuCauId=<id>` và `&baoGia=1` (thay ngăn kéo cũ). Route cũ vẫn mở được.

## 2. Lệnh kiểm
`npx tsc -b` sạch · `npx vitest run` 75 file, **650 → 653** test xanh · `npm run build` OK.

## 3. Ảnh (app thật, vite 5370, vai THO). Có thêm 1440 và 2 ảnh viewport `-vp` (nút dính đáy; ảnh full-page làm thanh dưới nằm giữa trang).
QA 390: horizontalOverflow 0 · belowHit 0 · contrast 0 · noAccessibleName 0 · h1 = 1 (left 16, top 16, là h1 của thanh trên). textBelowFloor còn 1: "9" 13px (huy hiệu chuông, khung chung).
QA 1440: h1 = 1 (left 288); belowHit 5 và textBelowFloor 5 đều của khung (mục nav 204×36, nút chuông/đăng xuất, chữ nav 14,5px, avatar "LQ", tên người dùng) → lô khác.

| Mã | Khung | Khác prototype |
|---|---|---|
| 26 | 390 | Tab "Đang làm 6 / Đã xong 3" là nút phân đoạn (`.seg-links`), không phải gạch chân. Tên thợ nằm dòng riêng dưới thanh trên (thanh trên của khung chỉ ghi "Việc"). Việc đầu là việc "Làm trước" theo khẩn rồi cũ. Không có chuông trong màn (khung có). |
| 26 | 1440 | Cùng nội dung, cột 720 đặt cạnh thanh bên; khối không giãn hết bề ngang. |
| 27 | 390 | Không có "Chụp ảnh hiện trạng" và "Tôi không nhận được việc này" (code chưa có luồng ảnh / trả việc → ẩn). Thêm khối "Ghi chú khảo sát" và "Báo giá" khi có dữ liệu. "Đã làm gì" lấy từ lịch sử thật, chỉ ghi tên người. Số điện thoại hiện cạnh nút Gọi. |
| 27 | 1440 | Nút chính căn phải dưới nội dung (không dính đáy). |
| 28 | 390 | Mở trống, không điền dòng ví dụ, không nhãn "minh hoạ" (app thật). Nút "Gửi báo giá 0 ₫" `blocked` kèm "Thêm ít nhất một dòng có đơn giá." Có "Xoá dòng" khi >1 dòng. |
| 29 | 390 | Số dư 0 ₫ (dữ liệu demo không có báo giá duyệt). Mỗi dòng việc xong ghi "—" vì không có số thật, không dùng 250.000 ₫. |
| 29 | 1440 | Như 390, cột 720. |

Giữa 1440 và 390 đổi: nút chính dính đáy (trên bottom nav) so với căn phải; chữ phần "Đã làm gì" không đổi (mật độ thoáng ở cả hai).

## 4. Test cũ đã sửa (toàn bộ `ThoCongViec.test.tsx` + `ThoChiPhi.test.tsx`; `App.tho.test.tsx` không đụng)
- ThoCongViec: "máy tính: thẻ việc dạng lưới…" → khối Làm trước (lưới thẻ + chip Gấp/Đang làm/Xong bỏ theo brief). "mở drawer…" → thay bằng test chi tiết `?yeuCauId` (ngăn kéo bỏ). "trạng thái rỗng" → chữ rỗng mới của brief. "mobile: mỗi thẻ 1 nút chính" → đủ 4 trạng thái. "lọc ?loc=xong, Gấp, chấm bước" → tab Đang làm/Đã xong (bỏ chip Gấp và chấm bước). "yeuCauId mở drawer" → gộp vào test chi tiết. Giữ nguyên `buocViecTho`. Thêm: báo xong (bắt buộc + /bao-xong), báo xong lỗi giữ chữ, báo giá (aria-disabled, bao-gia → gui-duyet), `Tieu` import được.
- ThoChiPhi: 3 test cũ (bảng + chip lọc, phiếu in, thẻ mobile 3 ô) → 3 test mới: không 250.000 / không `.btn-primary` / một h1; "—" và cộng Còn được nhận; mở phiếu chứng từ. Không có test cũ khoá `minHeight` 44/48.

## 5. Không làm / chưa kiểm / cần lô khác
- Bỏ khỏi Việc: lọc theo toà và mức độ (chỉ còn ô tìm, hiện khi >12 việc); bỏ KPI "chưa báo giá / còn được trả". Bỏ khỏi Tiền công: bảng, chip lọc, lọc toà, tìm kiếm, "Xem thêm" (V3 không vẽ).
- "Còn được nhận" = phần chưa trả của việc ĐÃ ĐÓNG có báo giá đã duyệt (định nghĩa tôi chọn; cũ cộng mọi báo giá duyệt).
- Chưa chạy trên app thật: mọi luồng ghi (bắt đầu khảo sát, gửi báo giá, báo xong) chỉ có test mock `fetch`. Tiền công "—" và 0 ₫ nên chưa thấy số tiền thật hiện trên ảnh.
- Cần lô khác (khung/y0): nav desktop 36 px và chữ 14,5 px; huy hiệu chuông 13 px; thanh trên mobile chỉ ghi "Việc" thay vì "Việc của tôi". CSS chung `.btn` 15 px, `.label` 14 px, `.irow .t` 15 px nên màn Thợ ghi đè bằng một khối `<style>` trong `ThoCongViec.tsx` (`CSS_THO`, dùng lại ở Tiền công) — nên sửa tại `components.css` / `ux-v2.css`.
- Ảnh 27/28 dùng việc id 13 và 24 theo tên mẫu; ảnh 28 chỉ mở, không gửi. `ThanhBuoc` dùng tên bước làm key nên lịch sử có hai bước trùng tên sẽ cảnh báo key.
