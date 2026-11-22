# Báo cáo lô x5 — Chu kỳ tháng
1. Commit: 6078371 (T1 hàm tính bước) · 80d8695 (T2 trang /chu-ky) · 1803e63 (T3 Dịch vụ & đơn giá) · commit cuối: giữ tiêu đề khi tải/lỗi/rỗng, sửa 2 test App, ảnh.
2. Kiểm: `npx tsc -b` sạch · `Test Files 65 passed (65), Tests 555 passed (555)` · lô: 3 file / 14 test xanh · `npm run build` xong.
3. Ảnh (app thật qua vite 5315, QA: overflow 0, belowHit 0, contrast.below 0, textBelowFloor 0 ở cả 14 ảnh). So với prototype `12`/`23`:
| ảnh | khung | khác prototype |
|---|---|---|
| 12-ql-chu-ky-1440 (b mặc định = 2) | 1440 | dữ liệu demo đủ công tơ nên mở bước 2 (prototype mở bước 1); bước 1 hiện tích "xong"; lề trái trang 288 vs 280 (x0b) |
| 12-ql-chu-ky-b1/b2/b3/b4-1440 | 1440 | b1: banner "Đã ghi đủ" + GhiChiSo cũ nhúng (ruột x8, còn selector toà/kỳ riêng); b3 nút "Tạo nháp" bị khoá vì kỳ chưa chốt; b4 một nút "Mở Thu tiền" |
| 23-ql-chu-ky-390, 23-ql-chu-ky-b1-390, ql-chu-ky-b2-390 | 390 | thanh bước xếp dọc, select kỳ xuống dòng riêng; b1 chưa có bảng công tơ dạng thẻ (x8) |
| ql-ghi-chi-so-chuyen-1440 | 1440 | /ghi-chi-so tự về /chu-ky (cùng ảnh b2) |
| chu-chu-ky-tat-ca-1440/390 | 1440/390 | ô chọn toà tại chỗ (không có trong prototype) |
| chu-chu-ky-toa3-1440 | 1440 | như QL, sidebar Chủ |
| ql-dich-vu-1440/390 | 1440/390 | khối kỳ còn đúng form "Mở kỳ thanh toán" + link sang Chu kỳ tháng; lề trang lệch (x0b) |
4. Test cũ đã sửa: `DichVuVaKy.test` "liệt kê dịch vụ…" — bỏ kỳ vọng "Đã chốt/Đang mở/8/2026" (thẻ kỳ đã gỡ), thay bằng link `/chu-ky` + "kỳ đang mở 9/2026". `App.test` 2 ca FR-MTR-01 (/ghi-chi-so) — chờ `#chu-ky-title` thay `[data-testid=meter-screen]` vì /ghi-chi-so nay chuyển về trang Chu kỳ (bước 2 không nhúng GhiChiSo).
5. Cố ý/chưa:
- Đổi tên `chuKyThang.ts` → `tinhBuocChuKy.ts` (+test): trên Windows trùng `ChuKyThang.tsx`, import './ChuKyThang' trỏ nhầm .ts (tsc báo TS1149).
- "n/m công tơ" dùng phòng (API trả theo phòng). Cuộn tới công tơ: `[id^="cong-to-{phongId}-"]` của phòng thiếu đầu tiên — x8 cần đặt id `cong-to-{phongId}-{dichVuId}`.
- Giữ ở DichVuVaKy thao tác "Mở kỳ thanh toán" (Chu kỳ tháng chưa có).
- GhiChiSo nhúng tự chọn toà/kỳ (đọc ?toaNhaId); chưa đồng bộ với toà khung — việc x8.
- Không bấm Chốt/Phát hành trên 5190; luồng ghi chứng minh bằng test mock fetch. Chưa kiểm ảnh b1 với dữ liệu thiếu công tơ (demo không có).
