# Báo cáo lô x3 — Hồ sơ 360° Người thuê + Phòng (nhánh ui/x3-ho-so-nguoi-phong)

**Task (commit):** T1 hồ sơ người thuê `cac0f79` · T2 danh sách người thuê `06997a4` · T3 hồ sơ phòng `e4789d7` · T4 danh sách phòng `10d2f9c`. (T1 và T2 cùng sửa `HoSoNguoiThue.tsx`: code danh sách nằm trong T1, T2 mang test của nó.)

**Kiểm (chạy thật):** `npx tsc -b` sạch · `npx vitest run` → **Test Files 60 passed (60), Tests 512 passed (512)** (nền 498; thêm `HoSo360.test.tsx` 12 test, danh sách người thuê +2, danh sách phòng +1) · `npm run build` ok.

**Ảnh** `shots/x3/` (app thật qua vite 5313 → 5190; `qa.json`: overflow 0, belowHit 0, contrast.below 0, textBelowFloor 0, noAccessibleName 0 cho cả 15 ảnh). Mở từng ảnh bằng vision; so `06`/`07`:

| Ảnh | Khác prototype |
|---|---|
| chu-nguoi-thue-1-1440 (so `06`) | Khớp bố cục. Bảng Tiền sắp kỳ cũ→mới như `06`. Tag "7 sự cố đang mở" khớp. Dòng điện lấy kỳ đã chốt (07–10) |
| chu-nguoi-thue-1-390 · vung/vung-nhin-chu-nguoi-thue-1-390 | 1 cột; hoá đơn thành thẻ; nút chính "Ghi nhận thu tiền" dính đáy sát mép (ảnh full-page hiện nó giữa trang vì `position:fixed`, xem ảnh vung-nhin) |
| ql-nguoi-thue-1-1440/390 | Giống Chủ; sidebar QL |
| chu-nguoi-thue-1-hoa-don-1440 | Tab Hoá đơn: bảng đủ 4 kỳ + số nợ; tab chọn có gạch chân (aria-current) |
| chu-nguoi-thue-ds-1440/390 | Hàng/tên là link, hết form dưới bảng. Tiêu đề "Người thuê" (prototype có hàng tab "Danh sách/Khai báo cư trú" **trên** tiêu đề do khung x0 — đúng như điều phối nói, không sửa) |
| chu-nguoi-thue-ds-ngan-them-1440 | Ngăn phải 520px: 5 trường + Lưu/Đóng (ảnh full-page nên lớp mờ chỉ phủ 900px đầu) |
| ql-phong-101-1440 · chu-phong-101-1440 (so `07`) | Khớp: người đang ở, hoá đơn 4 kỳ, sự cố, điện nước 11/2026, lịch sử HĐ; nút Báo sự cố + Mở hợp đồng, không nút chính. Thêm cột Hạn/Đã thu trong bảng hoá đơn (prototype gọn hơn) và khối "Tài sản trong phòng" (xem mục 5) |
| ql-phong-401-1440/390 | Phòng trống: nút chính duy nhất "Tạo hợp đồng" (390: dính đáy). Người đang ở rỗng dù phòng có HĐ #10 "Chờ ký" — theo đúng brief (chỉ HĐ hiệu lực) |
| ql-phong-ds-1440/390 | Cột Phòng là link; hết khung chi tiết; còn form khai báo phòng (tạo mới, không phải xem chi tiết) |

**Test cũ đã sửa (lý do):**
- `HoSoNguoiThue.test`: "liệt kê…" (thay nút "Xem và sửa" bằng link, không form), "mở hồ sơ để sửa…PUT" và "thêm hồ sơ mới POST" (form chuyển sang ngăn `NganFormNguoiThue`; payload/validate y cũ) — brief bỏ form dưới danh sách.
- `DanhMucPhong.test`: "opens room detail with Enter and Space" (→ gọi `dieuHuong('/phong/11?toaNhaId=1')`), "responsive layout" (bỏ 3 dòng kiểm `.building-summary__facts` của ô chi tiết đã bỏ).
- `App.test` (ngoài danh sách sở hữu, buộc sửa): "FR-BLD-03 … opens room detail" — bỏ kỳ vọng ô `room-detail`, thay bằng "bấm ô 403 → `/phong/<id>?toaNhaId=1`".

**Quyết định ngoài brief / lệch brief (bác nếu sai):**
1. Chủ cũng lấy hoá đơn bằng `fetchHoaDonQuanLy` từng toà (không `fetchCongNoBaoCao`) — cần cả hoá đơn đã thu cho tab Hoá đơn/Hoạt động; QL và Chủ dùng một đường. Test khoá: không ai gọi `/api/bao-cao/cong-no`.
2. Điện 4 kỳ: có GET `/ky-thanh-toan/{id}/chi-so` cho QL nên **không ẩn**; lấy 4 kỳ DA_CHOT gần nhất.
3. Ô phòng trên **sơ đồ tầng** vẫn là `role="button"` (RoomCell/BuildingSection thuộc `design/**`, không được sửa) nhưng Enter/Space/click mở hồ sơ; hàng bảng thì có `<a href>` thật.
4. Chi tiết phòng dưới danh sách chứa `QuanLyTaiSanPhong` (khai báo tài sản) — mang về hồ sơ phòng, đóng sẵn sau nút "Xem và khai báo tài sản" để trang giữ đúng 1 nút chính. Chưa có test riêng cho khối này.
5. `DanhMucPhong`/`HoSoNguoiThue` chưa nhận `dieuHuong` từ App (App.tsx không thuộc lô) → dùng bản mặc định pushState+popstate y `dieuHuongToi`; App truyền `dieuHuong` thì tự dùng.
6. Link sự cố `/su-co?yeuCauId=` và nút Báo sự cố `/su-co?baoMoi=1&phongId=…&toaNhaId=…`: lô sự cố (x?) phải đọc các tham số này; hiện `TrangSuCo` chưa chắc xử lý.

**Chưa làm / chưa kiểm:** không có API ghi chú liên hệ (dòng chú trong Hoạt động); chưa test bàn phím cho ngăn (dựa `useDialogTrap` có sẵn); chưa chụp "Sửa hồ sơ" mở từ menu (chỉ ngăn Thêm); "Thu tiền ?nguoiThueId=" do x1 xử lý; chưa thử trên dữ liệu có khách ở nhiều toà. Dev server 5313 đã tắt.
