# Lô x2 — Hôm nay (Chủ + Quản lý)

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x2-hom-nay` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x2` · 5312 |
| Cần có | x0 đã gộp |
| Ước | 45', 3 task |
| Đọc thêm | `_common-04.md` · `ux-v2/01` (Hôm nay theo vai trò) · ảnh `01` (Chủ 1440), `24` (Chủ 390), `10` (QL 1440) · `prototype/app.js` hàm `homNay`, `homNayQL` |

## File sở hữu
`HomNay.tsx` (vỏ do x0 tạo), `QuanLyDashboard.tsx`(+test), `BangViecVanHanh.tsx`(+test), mới `HomNay.test.tsx`, `HomNay.css` nếu cần.
**Không sửa** `ChuDashboard.tsx` (vẫn là Báo cáo › Tổng quan ở `/tong-quan`).

## Nguồn dữ liệu (GET có sẵn; không API mới)
| Khối | Chủ | Quản lý |
|---|---|---|
| Dải số | `fetchDashboardChu` (thực thu, lấp đầy) + tổng nợ từ `fetchCongNoBaoCao(token, null)` + số sự cố mở | `fetchDashboardQuanLy(token, toa)` (`kpi.khoanConPhaiThu`, `congTo.soCongToChuaGhi/tongSoCongTo`, lấp đầy) |
| Nợ quá hạn theo người (5 người, link `/nguoi-thue/{id}`, "Mở Thu tiền") | `nhomNo(tuCongNo(...))` từ `nhomNoTheoNguoi.ts` (x0 đã chép) | không có khối này (có trong Việc cần làm) |
| Hợp đồng sắp hết hạn / chờ ký | `fetchHopDongQuanLy` từng toà (`Promise.all`), lọc ngày kết thúc ≤ 30 ngày, trạng thái chờ ký | — (nằm trong Bảng việc) |
| Sự cố cần quyết | `managementRequest(token, '/api/yeu-cau-sua-chua')`, `MOI_TIEP_NHAN` + mức khẩn | — |
| Phòng chưa cho thuê | `fetchPhong(token, toa)` từng toà, trạng thái trống / đang sửa → link `/toa-nha/{id}` | — |
| Chu kỳ tháng (4 chấm + "Ghi n công tơ còn thiếu", nút chính "Ghi chỉ số" → `/chu-ky`) | 1 thẻ phụ "Kỳ tháng 11" | `congTo.danhSachChuaGhi` |
| Việc cần làm | — | `fetchBangViecVanHanh` (giữ hành động từng loại như `BangViecVanHanh` hiện có, đổi đích link sang màn mới: nợ → `/thu-tien`, thiếu chỉ số → `/chu-ky`, sự cố → `/su-co`, hợp đồng → `/hop-dong/{id}` nếu có id) |
| Lịch hẹn | `fetchPublicLichHen(token, toa?)` hôm nay | lịch tới, có trạng thái |
| Cột phải khác | "Còn phải thu theo toà" (thanh ngang) | "Cảnh báo điện nước" (`fetchCanhBaoTieuThu`) |

Toà: `useToaDangChon()`; Chủ "Tất cả toà" gộp 3 toà, chọn 1 toà thì lọc.

## Task
1. **Chủ** (~20'): dựng `HomNay` theo `01`: `.ph` (h1 "Hôm nay", dòng phụ ngày · toà · giờ cập nhật), `.strip` 4 ô bấm được, cột trái `.surface` 4 `.sec` (mỗi `.sec-h` có h2 + meta + link), cột phải `.side`. Mỗi khối có rỗng riêng ("Không ai nợ quá hạn" có tick) và lỗi riêng (một khối lỗi không làm trắng trang — `Promise.allSettled`). Trang Chủ **không có nút chính** ở đầu (mọi việc là link vào nơi xử lý) — **Em chọn**, đúng prototype.
2. **Quản lý** (~15'): `HomNay` vai trò QL theo `10`: dải số, khối Chu kỳ tháng (nút chính duy nhất "Ghi chỉ số"), Việc cần làm (dùng lại `BangViecVanHanh` với prop mới `bienThe="hom-nay"` để render `.irow` thay bảng, hoặc lấy dữ liệu và render tại chỗ — chọn cách ít dòng hơn, giữ test cũ của `BangViecVanHanh`), cột phải Lịch hẹn + Cảnh báo. Phần còn lại của `QuanLyDashboard` (biểu đồ, bảng dài) **không** đưa vào Hôm nay; `QuanLyDashboard` chỉ bỏ ô chọn toà riêng nếu còn được dùng ở nơi khác, không thì để yên.
3. **390** (~10'): Chủ theo `24` (dải số 2×2, các khối xếp dọc, cột phải xuống dưới). Không cuộn ngang.

## Test tối thiểu (`HomNay.test.tsx`, mock fetch)
Chủ: nợ theo người đúng thứ tự + tổng ở meta; hợp đồng sắp hết lọc đúng mốc 30 ngày (dùng ngày cố định qua `vi.setSystemTime`); một API lỗi → khối đó hiện lỗi, khối khác vẫn hiện. QL: không gọi `/api/dashboard/chu` và `/api/bao-cao/cong-no` (403); nút chính duy nhất "Ghi chỉ số" trỏ `/chu-ky`. Link hàng nợ trỏ `/nguoi-thue/{id}`.

## Ảnh
Chủ `/hom-nay` 1440 (so `01`), 390 (so `24`), Chủ chọn 1 toà 1440; QL `/hom-nay` 1440 (so `10`), 390; QL `/nhac-viec` (phải tự chuyển về `/hom-nay`).

## Không làm
Không vẽ lại `ChuDashboard`/Báo cáo. Không thêm KPI không có trong API. Không làm Thu tiền (x1).
