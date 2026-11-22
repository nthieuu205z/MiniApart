# Báo cáo x9 — Thợ: Việc của tôi

## Việc / commit
- T1 đầu trang (`m-sum` 3 số, `seg-links` ?loc=gap|dang-lam|xong, h1 class `h1`, bỏ font inline) · T2 thẻ `.job` (tag mức độ/trạng thái, chấm bước, gọi, 1 nút kế tiếp) · T3 test — gộp 1 commit `02b1dea` (+ commit sau: sửa vùng bấm/cỡ chữ nút drawer, ảnh, báo cáo).
- `buocViecTho` (export, thuần): DA_PHAN_CONG→1 Khảo sát; DANG_XU_LY→2 Báo giá, báo giá DA_DUYET→3 Sửa; còn lại→4 Nhận tiền (không nút, "Chờ quản lý thanh toán").

## Kiểm
- `npx tsc -b`: sạch · `npx vitest run`: Test Files 69 passed, Tests 592 passed · `ThoCongViec.test.tsx`: 7 passed · `npm run build`: xong.
- qa.json 6 ảnh: overflow 0, belowHit 0, textBelowFloor 0, contrast.below 0.

## Ảnh (app thật, vite 5319 → 5190)
| mã | file | khung | khác prototype |
|---|---|---|---|
| 20 | 20-tho-viec-390 | 390 | Đúng bố cục; lề ngoài rộng hơn (~38px) do khung x0b, không bù. "chưa báo giá" tính từ danh sách (KPI không có trường này) |
| 20 | 20-tho-viec-1440 | 1440 | Desktop vẫn bảng cũ (brief chỉ thiết kế 390); chỉ đổi h1 sang class |
| 20 | 20-tho-viec-xong-390 | 390 | Xong (n), thẻ bước 4, dòng "Chờ quản lý thanh toán", không nút primary |
| 20 | 20-tho-viec-drawer-390 | 390 | Drawer cũ mở từ thẻ đầu (ảnh chụp sau khi mở bằng thao tác bấm tiêu đề — chỉ GET) |
| 20 | 20-tho-tong-quan-390 | 390 | Tự chuyển về Việc của tôi |
| 20 | 20-tho-chi-phi-390 | 390 | Không vỡ |

## Test cũ đã sửa
- "mobile: mỗi thẻ có đúng 1 nút chính…": nhãn đổi theo brief (Bắt đầu khảo sát / Gửi báo giá / Báo đã sửa xong), handler giữ nguyên.
- "mobile: tab đếm theo nhóm…": thay bằng test seg `?loc=` (tab cũ không còn trên mobile).

## Chưa làm / chưa kiểm
- Desktop (≥ bảng) chưa theo kiểu thẻ. Gấp = mọi việc đang mở mức ≠ thường; Đang làm gồm cả Chờ xác nhận.
- Chưa bấm nút kế tiếp trên 5190 (chỉ test mock). Nút "Xem báo giá" giữ cho báo giá nháp/chờ duyệt (ngoài 3 nhãn brief).
