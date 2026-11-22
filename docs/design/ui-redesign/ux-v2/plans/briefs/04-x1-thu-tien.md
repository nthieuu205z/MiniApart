# Lô x1 — Thu tiền: Cần thu nhóm theo người, hàng tổng, bulkbar, ghi nhận thu trong ngăn

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x1-thu-tien` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x1` · 5311 |
| Cần có | x0 đã gộp vào `feat/ux-v2` |
| Ước | 45–55', 4 task |
| Đọc thêm | `_common-04.md` · `ux-v2/02` §2 (gộp Hoá đơn + Thu tiền + Công nợ) · ảnh `04`, `05`, `25` (390), `27` (1180) · `prototype/app.js` hàm `tien` · `ma-mau/frontend/src/nhomNoTheoNguoi.ts`(+test) |

## File sở hữu
`ThuTien.tsx`(+test), `HoaDonQuanLy.tsx`(+test), `FinancePaymentPanel.tsx`, `InvoiceActions.tsx`, `financeFlows.test.tsx`, mới `ThuTien.css` nếu cần. `nhomNoTheoNguoi.ts` đã do x0 chép — **chỉ import**; cần đổi hàm → báo controller (x2, x3 cùng dùng).
**Không sửa** `CongNoBaoCao.tsx` (hết được định tuyến; giữ file + test). Không sửa `App.tsx` (đường dẫn, tab, chuyển `/cong-no` đã có từ x0).

## Hiện trạng cần biết (đo 22/11)
- `ThuTien.tsx` (199 dòng): 2 tab nội bộ `useState` "Thu theo hoá đơn" (bảng hoá đơn → chọn → `FinancePaymentPanel`) và "Tiền cọc và trả phòng" (`ContractFinance`). Tự `fetchToaNha`. QL gọi `fetchHoaDonQuanLy(token, toa, '')` (chuỗi rỗng = mọi trạng thái; mặc định của hàm là `NO_QUA_HAN`).
- Chủ có `GET /api/bao-cao/cong-no` (mọi toà, 1 lần gọi; `fetchCongNoBaoCao(token, null)`); **QL bị 403** → dựng từ `fetchHoaDonQuanLy(token, toa, '')` + `fetchHopDongQuanLy`. JSON thật của `/api/hoa-don` không có `hopDongId` (mã mẫu đã ghép theo phòng + họ tên).
- Số thật để đối chiếu ảnh: Chủ, tất cả toà = **15 người · 60 kỳ · đã thu 78.670.000 ₫ · còn nợ 173.450.000 ₫**; chip 15 / 15 / 9. QL toà 3 = 5 người · 20 kỳ · 50.398.000 ₫.

## Task

### 1. Cần thu (`/thu-tien`, không có `?tab`) (~20')
- Dữ liệu (import `nhomNoTheoNguoi.ts`): Chủ = `tuCongNo(congNo)` lọc theo `toaNhaId` của context (null = mọi toà); QL = `tuHoaDonQuanLy(hoaDon, toa, homNay, hopDong)`. Toà lấy từ `useToaDangChon()`; bỏ ô chọn toà riêng của màn.
- Đầu trang `.ph`: h1 "Thu tiền", dòng phụ "{tên toà hoặc Tất cả 3 toà} · nhóm theo người thuê, mỗi người một hàng tổng", **nút chính** "Ghi nhận thu tiền" (mở ngăn ở task 3, chưa chọn hoá đơn).
- Thanh công cụ: ô tìm (không dấu, `locNo`), 3 chip (`demBoLoc`: Tất cả · Trễ trên 30 ngày · Đã trả một phần, `aria-pressed`), nhóm theo `seg` Người thuê / Phòng. Trạng thái lọc + nhóm + trang ghi vào query (`?loc=&theo=&q=&trang=`) bằng `history.replaceState` để Back/tải lại giữ nguyên.
- Bảng `.table.gtable` (`<table>` thật): cột chọn · Người thuê · phòng (link tới `/nguoi-thue/{id}` khi có `nguoiThueId`; không có thì chữ thường) · Chưa trả đủ (n kỳ) · Trễ lâu nhất (tag) · Đã thu · Còn nợ · nút mở (`aria-expanded`, `aria-controls`). Mở ra = các hàng `kid` từng hoá đơn: kỳ + mã, hạn, tag Trả một phần/Chưa trả, đã thu / tổng, còn lại, nút phụ "Thu" (mở ngăn với hoá đơn đó).
- Hàng tổng `tot` cuối bảng = `hangTong(ds đang hiện sau lọc)` — **không** theo trang. Phân trang 10 nhóm/trang bằng `.pager` có sẵn.
- 4 trạng thái: tải (skel 5 hàng), rỗng lần đầu ("Không ai còn nợ. Hoá đơn kỳ mới phát hành ở Chu kỳ tháng." + link `/chu-ky`), rỗng do lọc (`EmptyState kind="filtered"` + bỏ lọc), lỗi (Thử lại).

### 2. Bulkbar (~8')
- Chọn ≥ 1 nhóm → `.bulkbar` (đã có trong components.css) "Đã chọn n người · tổng": "Ghi nhận thu" (chỉ bật khi chọn đúng 1 người; mở ngăn với hoá đơn cũ nhất của người đó), "Xuất danh sách" (CSV từ dữ liệu đang hiện: họ tên, toà, phòng, số kỳ, trễ, còn nợ — dùng `ExcelExportButton` nếu nhận được mảng hàng, nếu không thì `Blob` + `<a download>`; 1 test), "Gửi nhắc nợ" `aria-disabled` + lý do hiện chữ "cần API nhắc nợ" (`aria-describedby`), "Bỏ chọn".
- Chọn hết trên trang bằng ô ở `<th>`. Esc bỏ chọn.

### 3. Ngăn Ghi nhận thu (~10')
- `.drawer` phải (desktop) / toàn màn (≤ 767px), `role="dialog"` `aria-modal`, tiêu đề, Esc + nút Đóng, khoá focus (`useDialogTrap` có sẵn ở `design/feedback`), trả focus về nút đã mở.
- Có hoá đơn: tải `fetchHoaDonCongNoChiTiet` (Chủ) / chi tiết như `ThuTien` cũ đang dùng (QL), render `FinancePaymentPanel` **với đúng props** như `ThuTien` cũ truyền. Sau ghi nhận thành công: đóng ngăn, tải lại Cần thu, toast có sẵn.
- Mở từ nơi khác: `/thu-tien?nguoiThueId={id}` (nút chính của hồ sơ người thuê, x3) → mở ngăn với hoá đơn còn nợ cũ nhất của người đó; người không nợ → mở ngăn ở chế độ chọn hoá đơn. `/thu-tien?hoaDonId={id}` → mở ngăn đúng hoá đơn.
- Chưa có hoá đơn (nút chính đầu trang): trong ngăn hiện bảng "Thu theo hoá đơn" cũ (`cotHoaDonThu`) để chọn → chuyển sang panel. Không viết luồng thu mới.

### 4. Đã thu, Tiền cọc, Hoá đơn (~10')
- `?tab=da-thu`: bảng hoá đơn `DA_THANH_TOAN` của toà đang chọn (Chủ "Tất cả toà" → gọi `fetchHoaDonQuanLy(token, id, 'DA_THANH_TOAN')` cho từng toà, `Promise.all`), cột như prototype (Kỳ · Phòng · người thuê · Hạn · Tổng · Còn lại · Trạng thái), tìm + pager.
- `?tab=coc`: nội dung tab "Tiền cọc và trả phòng" cũ, giữ nguyên `ContractFinance`.
- Bỏ 2 tab `useState` cũ trong `ThuTien` (tab giờ do `TabTrang` của khung + query).
- `HoaDonQuanLy` (`/hoa-don`): đổi ô chọn toà → `useToaDangChon()`/`useMotToa()`; bỏ h1 trùng nếu khung đã có tab; giữ nguyên mọi thứ còn lại kể cả `replaceState` về `/hoa-don?…`, bộ lọc trạng thái, drill-down `hoaDonId`. Thêm link "Phát hành hoá đơn kỳ mới ở Chu kỳ tháng →" (`/chu-ky`).

## Test tối thiểu
- `ThuTien.test.tsx`: Chủ — render từ fixture công nợ 3 người → 3 nhóm, hàng tổng đúng; chip "Trễ trên 30 ngày" lọc + tổng đổi; mở nhóm thấy kỳ; bulkbar chọn 2 → "Ghi nhận thu" bị khoá, chọn 1 → mở ngăn; "Gửi nhắc nợ" `aria-disabled`. QL — không gọi `/api/bao-cao/cong-no` (assert URL fetch), gọi `/api/hoa-don?toaNhaId=3&trangThai=`. Ngăn: Esc đóng, focus trả về. Ghi nhận thành công → gọi lại API danh sách. Tab cọc: `ContractFinance` vẫn render.
- Test cũ của `ThuTien`/`HoaDonQuanLy`/`financeFlows` còn xanh; test nào sửa ghi lý do.

## Ảnh bắt buộc
Chủ `/thu-tien` 1440 (so `04`) · Chủ 390 (so `25`) · 1180 (so `27`) · QL `/thu-tien` 1440 · `/hoa-don` 1440 · `/thu-tien?tab=da-thu` · `?tab=coc`. Trạng thái bulkbar (so `05`): `app-shot.mjs` không bấm được → chụp bằng script CDP riêng nếu kịp, không thì ghi "chưa chụp" và dựa vào test bulkbar.

## Không làm
Không gửi nhắc nợ thật. Không đổi `FinancePaymentPanel`/`InvoiceActions` ngoài việc bọc layout (props, payload giữ nguyên). Không gộp nhiều hoá đơn vào một lần thu (API thu theo từng hoá đơn).
