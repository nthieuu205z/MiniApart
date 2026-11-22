# Báo cáo lô x11 — Tạo hợp đồng 5 bước

## Việc / commit
1. Tách hook `useFormTaoHopDong(rooms, tenants, services, macDinh?)` + `kiemTraFormTao(form, buoc)` trong `HopDongThaoTac.tsx`; form cũ dùng lại hook. Commit a44db73 (test cũ `HopDongThaoTac.test.tsx` 8/8 xanh, không sửa).
2. Wizard `/hop-dong/moi` (`TaoHopDong.tsx` + `TaoHopDong.css`): breadcrumb, `.wiz` 3 cột, `.vsteps` có tick + tóm tắt + bấm lại bước đã xong, bước chưa tới không bấm được, `?buoc=` (Back đi lùi), `?phongId=` điền sẵn, Huỷ có xác nhận nếu đã nhập, ≤767px: thanh chấm + "Bước n/5", tóm tắt gấp, nút chính dính đáy.
3. `TaoHopDong.test.tsx` (5 test) + ảnh + báo cáo (commit cuối).

## Kiểm
- `npx tsc -b`: sạch · `npx vitest run`: Test Files 70 passed, Tests 595 passed · `npm run build`: thành công.
- Test mới: thiếu trường chặn Tiếp · đi đủ 5 bước, POST `/api/hop-dong` body đúng · quay lại giữ dữ liệu · `?phongId=` điền sẵn · `?buoc=4` bị kéo về bước thiếu · Huỷ xác nhận · mỗi bước 1 `.btn-primary`.
- QA 10 ảnh: overflow 0, belowHit 0, contrast.below 0, textBelowFloor 0, noAccessibleName 0.

## Ảnh (app thật qua vite 5321, vai trò CHU, toà 3, phòng 401; không bấm "Tạo hợp đồng")
| Ảnh | Khung | Khác prototype `14` |
|---|---|---|
| 11-ql-tao-hop-dong-b1-1440 | 1440 | Bước 1 chỉ 2 ô (phòng, người thuê); không có ảnh prototype tương ứng |
| 11-ql-tao-hop-dong-b2-1440 | 1440 | Thiếu ô "Ngày thu tiền hằng tháng" và "Tiền cọc" (cọc ở bước 4, theo form cũ); có chip 3/6 tháng, 1/2 năm; giá hiện "3600000.00" (đúng form cũ) |
| b3, b4, b5 1440 | 1440 | Bước 3 liệt kê 10 dịch vụ thật; bước 4 cọc + báo trước; bước 5 xem lại; prototype không có ảnh |
| b2 390 | 390 | Thanh chấm + "Bước 2/5", tóm tắt gấp dưới form, nút chính full-width trên Huỷ/Quay lại |
| b1, b3, b4, b5 390 | 390 | tương tự |
Ngày hiển thị mm/dd/yyyy là locale ô date của trình duyệt headless.

## Test cũ đã sửa
Không có.

## Cố ý không làm / chưa kiểm
- "Lưu nháp": form cũ không có lưu nháp → không làm. Không có "Ngày thu tiền hằng tháng" (không có trong payload).
- Người ở cùng: form cũ không có trường này lúc tạo → bước 4 chỉ cọc + báo trước, ghi chú "thêm ở hồ sơ hợp đồng".
- Có `?phongId=` thì vẫn mở bước 1 (cần chọn người thuê trước, vì "Tiếp" bị chặn khi thiếu); brief ghi mở bước 2.
- Hook nhận danh sách phòng/người thuê/dịch vụ thay vì (token, toaNhaId) để form cũ không tải lại dữ liệu; POST nằm ở `TaoHopDong`.
- Chưa tách Gia hạn/Ký/Thanh lý khỏi `HopDongThaoTac` (brief không yêu cầu; `HoSoHopDong360` vẫn nhúng nguyên).
- POST thật chỉ kiểm bằng mock fetch; Huỷ dùng `window.confirm`; sticky đáy mobile chỉ xem qua CSS, ảnh fullPage không thể hiện.
- `chup.mjs` là script chụp riêng (app-shot không điền được form).
