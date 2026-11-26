# BAO-CAO y4 — Sự cố & Báo cáo một trang

Nhánh `ui/y4-su-co` · vite cổng 5340 (đã tắt) · dữ liệu thật demo, chỉ GET.

## 1. Việc theo task
| Task | Commit | Việc |
|---|---|---|
| T1+T2 | `853ed83` | `SuCoQuanLy` 3 nhóm (Cần quyết · Thợ đang làm · Đã xong tháng này), lưới 5/7, chi tiết có `ThanhBuoc` 8 bước, nút chính Giao thợ / Duyệt X ₫ / Nghiệm thu, Từ chối… (`danger`, lý do bắt buộc). `QuanLyBaoGiaVaThanhToan`: prop `anChoDuyet`, nút `danger`, "₫". `TrangSuCo` truyền `vaiTro` (Chủ không có "Ghi sự cố mới"). |
| T3 | `52a5e6f` | `BaoCaoTongQuan` một trang: Đã thu / Còn nợ / Đã gửi cộng từ hoá đơn (`/api/hoa-don` từng toà), cột đôi theo tháng, nợ theo tuổi, bảng Theo toà có hàng Cộng. Báo cáo phụ + `/tong-quan`: bảng tiếng nói, `DauBaoCao` → `DauTrang`. |
| sửa sau chụp | commit cuối | Chân nút trên mobile nằm trên thanh tab; ẩn form chi phí khi chưa giao thợ; mô tả "Tất cả 3 toà"; Cộng ở mobile; dashboard "Đã thu" dùng `daThuHopDong`. |

## 2. Lệnh kiểm
`npx tsc -b` sạch · `npx vitest run` **650 → 668 test** (75 file xanh) · `npm run build` OK.
qa.json (10 ảnh): `horizontalOverflow` 0 · `belowHit` 0 · `contrast.below` 0 · `textBelowFloor` 0 · `noAccessibleName` 0 · `h1.count` 1 (left 288/top 96–133 ở 1440; left 16/top 84–129 ở 390).

## 3. Ảnh (so với `screens/png/`)
| Mã | Khung | Khác prototype |
|---|---|---|
| 08 chu-su-co | 1440 | Có chip Tất cả/Đang mở/Đã xong + ô tìm (brief giữ `?loc=`); demo 6 cần quyết · 6 thợ (prototype 7·5); không dòng "Chờ duyệt" vì demo chưa có báo giá; ô chi phí hiện ở "Thợ đang làm". |
| 09 chu-su-co-4 | 1440 | Prototype vẽ ca báo giá 450.000 ₫; app thật chụp sự cố khẩn mới báo (id 1) → select "Giao cho thợ", nút chính "Giao thợ" (chặn tới khi chọn thợ). Ca Duyệt chỉ chứng minh bằng test mock. 8 bước xuống 2 hàng (4+4), prototype 1 hàng. |
| 09 chu-su-co-4 | 390 | Chỉ chi tiết + "← Tất cả sự cố" + "Bước 1/8: Báo hỏng"; nút trong `ChanDinh` dính đáy, đặt trên thanh tab. 1440→390: danh sách ẩn, 8 bước thành 1 dòng, kv xếp dọc. |
| 19 ql-su-co | 1440 + 390 | Có "Ghi sự cố mới"; chip + ô tìm như 08. 390: nút xuống dòng dưới tiêu đề, danh sách một cột. |
| 10 chu-bao-cao | 1440 | Số khớp prototype (391.497.000 · 173.450.000 · 69% · 75% · 750.000 · 60 hoá đơn của 15 người). Khác: thanh tab "Doanh thu & lấp đầy" của khung; "1–3 trong 3 toà" + nút trang của `DataTable`. |
| 10 chu-bao-cao | 390 | Chip khoảng thời gian vẫn hiện (prototype ẩn); chú thích cột chỉ "94 tr"; Theo toà thành thẻ, Cộng thành một dòng chữ dưới bảng (không hàng tổng). |
| y4-tong-quan / tieu-thu / chi-phi | 1440 | Chỉ token + chữ: Đã thu, Còn nợ, Phòng đang thuê, Tháng. |

## 4. Test cũ đã sửa (lý do)
- `TrangSuCo.test.tsx`: viết lại cả file (UI đổi từ ngăn trượt 6 bước sang 3 nhóm + 8 bước; nhãn nút đổi). Không xoá ca nào về huỷ/`?yeuCauId`/`?baoMoi`/tìm/sắp xếp.
- `BaoCaoTongQuan.test.tsx`: viết lại (6 KPI thẻ → 4 ô số từ hoá đơn; mock thêm `/api/hoa-don`, phòng, sự cố; mặc định lọc 5 tháng thay vì tháng này). Giữ: popstate, đang tải/lỗi, rỗng, 24 tháng một lần gọi.
- `ChuDashboard.test.tsx` → `it('renders all 6 owner KPIs…')`: nhãn Đã thu/Còn nợ/Phòng đang thuê; số 376.130.000 → 382.497.000 (`daThuHopDong`).
- **Ngoài danh sách file:** `QuanLySuaChua.test.tsx` (y9) 4 `it`, vì nó render `SuCoQuanLy`: liệt kê mọi yêu cầu · yêu cầu mới (tiếp nhận → Giao thợ) · yêu cầu đã đóng · form báo sự cố. Chỉ đổi selector/nhãn.

## 5. Không làm / chưa kiểm / cần lô khác / backend
- Duyệt / Từ chối / Giao thợ / Nghiệm thu **chưa bấm trên app thật** (chỉ test mock).
- Nghiệm thu gọi `xac-nhan-dong` (đúng code cũ); `hoan-thanh` trong brief là API của thợ.
- Không có API gộp báo giá: danh sách hỏi `/bao-gia` của tối đa 40 việc thợ đang làm.
- Báo cáo: 3 + 1 GET mỗi toà (hoá đơn, phòng, sự cố) ngoài `tong-quan`; Chi sửa chữa = việc `DA_DONG` có chi phí, tính theo ngày báo trong khoảng.
- Dashboard `/tong-quan`: biểu đồ và "Toà thu nhiều nhất" vẫn dùng `thucThu` (sổ giao dịch), lệch với "Đã thu" từ hoá đơn. Cần y-lô dashboard/backend thống nhất.
- Cần lô nền/khung: `ChanDinh` (y0) chưa tính chiều cao thanh tab dưới (override ở `SuCo.css`); `DataTable` luôn hiện pager "1–3 trong 3 toà"; thanh tab trang báo cáo còn chữ "Doanh thu & lấp đầy"; `CongNoBaoCao` còn chữ "Công nợ".
- `Chi sửa chữa` form cũ (nhập tay) giữ lại ở bước đã giao thợ trở đi; chưa xoá vì không rõ backend còn cần.
- Chưa mở lại 09/08 sau lần chụp cuối (chỉ đổi chữ ở tiêu thụ + dashboard).
