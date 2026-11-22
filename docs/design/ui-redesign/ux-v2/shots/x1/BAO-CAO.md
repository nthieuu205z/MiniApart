# Báo cáo lô x1 — Thu tiền (nhánh `ui/x1-thu-tien`)

**1. Việc theo task**
- T1 `c302c57` Cần thu: nhóm theo người/phòng (`nhomNoTheoNguoi`), hàng tổng theo toàn bộ danh sách đã lọc, chip + tìm + nhóm + trang ghi `?loc&theo&q&trang` (replaceState + popstate), 4 trạng thái, toà lấy từ `useToaDangChon`.
- T2 `2d7f3b1` Bulkbar: chọn n người, "Ghi nhận thu" khoá khi ≠ 1, "Xuất danh sách" (CSV có BOM qua Blob + `<a download>`), "Gửi nhắc nợ" `aria-disabled` + "cần API nhắc nợ", Esc bỏ chọn, ô chọn hết ở `<th>`.
- T3 `5e43185` Ngăn Ghi nhận thu: portal, `role=dialog aria-modal`, `useDialogTrap` (Esc, trả focus), `FinancePaymentPanel` giữ đúng props; mở từ nút chính / bulkbar / nút "Thu" ở hàng con / `?nguoiThueId=` / `?hoaDonId=`; thành công → đóng, tải lại, toast.
- T4 `6ac1ec5` `?tab=da-thu` (từng toà rồi gộp khi "Tất cả toà"), `?tab=coc` (giữ `ContractFinance`), bỏ 2 tab `useState`; `HoaDonQuanLy` dùng toà dùng chung + link `/chu-ky`.
- `ebed0ce` chỉnh bố cục 390/1180, ảnh + QA.

**2. Lệnh kiểm** (worktree, đã chạy thật)
- `npx tsc -b` → exit 0 · `npx vitest run` → **Test Files 59 passed, Tests 512 passed** (nền 498)
- `vitest run src/ThuTien.test.tsx src/HoaDonQuanLy.test.tsx` → 2 files, 19 tests passed · `npm run build` → OK (chỉ cảnh báo chunk > 500 kB có từ trước)
- `git diff --stat feat/ux-v2...HEAD`: ThuTien.tsx/.css/.test.tsx, HoaDonQuanLy.tsx/.test.tsx + `shots/x1/` (không file ngoài ma trận)
- QA 16 ảnh (`qa.json`): overflow 0 · belowHit 0 · contrast.below 0 · textBelowFloor 0 · noAccessibleName 0

**3. Ảnh** (dữ liệu thật qua vite 5311; số khớp brief: Chủ 15 người · 60 kỳ · 78.670.000 ₫ · 173.450.000 ₫, chip 15/15/9; QL toà 3 = 5 người · 20 kỳ · 50.398.000 ₫)
| mã | ảnh | khung | khác prototype |
|---|---|---|---|
| 04 | 04-chu-thu-tien-1440 | 1440 | **Tab (TabTrang của khung) nằm TRÊN tiêu đề**; prototype: tiêu đề + nút rồi mới tab trong thẻ. Còn lại khớp (hàng tổng, pager, kid rows). Khung x0, không sửa |
| 05 | 05-chu-thu-tien-chon-1440 | 1440 | bulkbar khớp; chọn 1 nên "Ghi nhận thu" bật (prototype chọn 2); hàng con vẫn mở |
| 25 | 25-chu-thu-tien-390 | 390 | prototype ẩn mọi số, ở đây giữ "Còn nợ"; bỏ avatar, kỳ/trễ/đã thu xem ở hàng con; hàng con ẩn mã HĐ ở 390 |
| 27 | 27-chu-thu-tien-1180 | 1180 | sidebar thu icon (khung); hàng con xuống dòng mã HĐ ở 1180 |
| – | chu-thu-tien-chon-390 | 390 | bulkbar xuống 2 dòng, nút ≥ 44px |
| – | chu-thu-tien-ngan-1440 / -390 | 1440/390 | ngăn chọn hoá đơn (bảng Hoá đơn · Còn lại · Thu tiền); 390 toàn màn dạng thẻ |
| – | chu-thu-tien-da-thu-1440 / -390 | | 63 hoá đơn đã thu đủ (khớp tab "Đã thu 63" của prototype) |
| – | chu-thu-tien-coc-1440 / -390 | | giữ bảng + panel cũ, toà qua `?toaNhaId=3` |
| – | chu-hoa-don-1440, ql-hoa-don-1440 / -390 | | h1 đổi "Thu tiền" (tab "Hoá đơn" của khung), ô chọn toà riêng bỏ, thêm link Chu kỳ |
| – | ql-thu-tien-1440 / -390 | | QL không gọi `/api/bao-cao/cong-no` |

**4. Test cũ đã sửa**
- `ThuTien.test.tsx`: 3 test cũ (bảng hoá đơn phẳng + chip "Còn nợ"; chọn hoá đơn trong bảng; tab cọc bằng `<button>`) viết lại vì màn đã đổi cấu trúc (nhóm theo người, tab theo query, panel trong ngăn). Hành vi nghiệp vụ: panel/payload giữ nguyên (test "ghi nhận" khoá URL POST). 
- `HoaDonQuanLy.test.tsx`, `financeFlows.test.tsx`: không sửa test cũ; HoaDonQuanLy thêm 2 test.

**5. Không làm / chưa kiểm**
- Không bấm ghi trên backend thật; luồng ghi chỉ chứng minh bằng test mock `fetch`.
- Sau khi ghi nhận, ngăn đóng ngay (theo brief) nên biên lai "Đã ghi BL-…" không còn hiện; xem lại ở ngăn của hoá đơn.
- "Kỳ" ở hàng con lấy tháng ngày phát hành (QL: tháng của hạn) — khớp dữ liệu demo, chưa kiểm hoá đơn phát hành khác tháng.
- Đã thu / Hoá đơn ở 390 dùng thẻ của `DataTable`; chưa chụp trạng thái rỗng/lỗi trên app thật (có test).
- `/hoa-don` không có ô chọn toà riêng nữa: Chủ "Tất cả toà" thấy ô chọn tại chỗ (`BuildingSelect`), đổi luôn toà của khung.
