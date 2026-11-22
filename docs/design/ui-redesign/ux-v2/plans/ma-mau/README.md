# Mã mẫu cho đợt thi công UX v2 (KHÔNG phải code sản phẩm)

Đường dẫn trong thư mục này trùng đường dẫn đích trong repo. Lô nào có file ở đây thì **chép nguyên file** sang đúng chỗ rồi dùng; chỉ sửa khi brief của lô cho phép.

Lần kiểm 22/11/2026 trên bản clone `--shared` của `feat/ui-tokens@028edcd` (đã gồm lô font của điều phối), Node + `node_modules` của worktree:

| Lệnh (chạy trong `frontend/`) | Kết quả |
|---|---|
| `npx vitest run src/dinhTuyen.test.ts src/toaDangChon.test.tsx src/timNhanh.test.ts src/nhomNoTheoNguoi.test.ts` | 4 file / **87 test** xanh (chạy liền 4 lần, không chập chờn) |
| `npx tsc -b` | sạch, exit 0 |
| `npx vitest run` (cả repo + 4 file mẫu) | 59 file / **445 test** xanh (baseline 55 file / 358 + 87) |
| Đột biến: 37 lần gỡ guard / đổi điều kiện trong 4 file nguồn | **37/37** bị test bắt (4 test thêm sau vòng đột biến đầu: `đ` thường, sắp kỳ theo hạn, sắp nợ trước trễ, không gộp nhầm hai người chưa ghép được hợp đồng) |
| Đối chiếu dữ liệu thật (JSON GET từ 5190 lúc 19:2x, script ở scratch, không chép vào đây) | Chủ: **15 người · 60 kỳ · đã thu 78.670.000 ₫ · còn nợ 173.450.000 ₫**, chip 15 / 15 / 9 = đúng số trên prototype `04`. Quản lý toà 3 (dựng từ `/api/hoa-don`) = đúng phần toà 3 của Chủ: 5 người, 20 kỳ, 50.398.000 ₫, cùng `nguoiThueId`, cùng số ngày trễ |

Chưa chạy: trên trình duyệt thật (chỉ jsdom), trên `vite build` (tsc đã qua).

| File | Lô dùng | Nội dung |
|---|---|---|
| `frontend/src/dinhTuyen.ts` (+test) | x0 | Bảng đường dẫn → màn (`KhoaTrang`), quyền theo vai trò, 4 đường dẫn cũ tự chuyển, trang đầu mỗi vai trò, nhóm tab (`NHOM_TAB`), `TrangProps` |
| `frontend/src/toaDangChon.tsx` (+test) | x0 (lô sau chỉ gọi hook) | `ToaDangChonProvider`, `useToaDangChon()`, `useMotToa()`, `tenToaDangChon()`, khoá `localStorage` `ma.toaNhaId` |
| `frontend/src/timNhanh.ts` (+test) | x7 | Bỏ dấu, dựng chỉ mục từ dữ liệu API, tìm + nhóm (tối đa 4 dòng/nhóm), cắt đoạn để tô đậm |
| `frontend/src/nhomNoTheoNguoi.ts` (+test) | x0 chép; x1, x2, x3 import | Gộp nợ theo người / theo phòng, chip đếm, lọc + tìm không dấu, hàng tổng; hai nguồn: công nợ (Chủ) và hoá đơn của toà (Quản lý) |

Phát hiện khi dựng mã mẫu (đã xử lý trong code, ghi lại để không ai đoán ngược):
- `GET /api/bao-cao/cong-no` trả **403 cho Quản lý** → tab Cần thu của Quản lý phải dựng từ `GET /api/hoa-don?toaNhaId=`.
- JSON thật của `/api/hoa-don` **không có `hopDongId`** dù type `ThongTinHoaDonQuanLy` ghi có; có thêm `ngayPhatHanh`, `toaNhaId`. Ghép người thuê bằng `soPhong + họ tên` với `fetchHopDongQuanLy`.
- Mở chi tiết hoá đơn cho Quản lý cần đủ `toaNhaId + kyId + hoaDonId` (nhánh `hienThiHoaDon` của App); thiếu `kyId` thì App rơi về thẻ chung. Link từ Tìm nhanh luôn kèm `kyId` khi có.
