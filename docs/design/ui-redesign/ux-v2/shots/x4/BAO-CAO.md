# Báo cáo lô x4 — Hồ sơ 360° Hợp đồng + Toà (nhánh ui/x4-ho-so-hop-dong-toa)

## 1. Việc đã làm (thứ tự thực hiện: 1 → 2 → 4 → 3, vì hồ sơ toà dùng `FormToaNha` tách từ danh sách toà)
- T1 `61bc291` Hồ sơ hợp đồng `/hop-dong/:id`: đầu + tag (hạn, nợ), nút theo trạng thái (sắp hết → Gia hạn; chờ ký → Ký hợp đồng; còn lại không nút chính), "…" 5 mục, Tải PDF, Điều khoản/Dịch vụ/Hoá đơn nợ/Liên kết/Mốc, ngăn thao tác. Thêm `Ngan` dùng chung (export từ `HoSoHopDong360.tsx`).
- T2 `57beb98` Danh sách hợp đồng: hàng là `<a href="/hop-dong/{id}">`, "Tạo hợp đồng" → `/hop-dong/moi`, bỏ chi tiết/form dưới bảng, toà lấy từ `useMotToa()`, bỏ `fetchToaNha`.
- T4 `7d94dad` Danh sách toà: tên toà + "Mở hồ sơ" là link `/toa-nha/{id}`, form khai báo vào ngăn, tách `FormToaNha` (giữ trường/payload).
- T3 `f0bcc58` Hồ sơ toà `/toa-nha/:id`: đầu, strip 4 ô, sơ đồ phòng theo tầng (`<a aria-label="Phòng 101, Đang thuê">`), "Cần chú ý" (3 người nợ giảm dần + HĐ sắp hết/chờ ký), ngăn sửa toà; QTHT chỉ xem thông tin toà.
- Commit cuối: chỉnh theo ảnh (avatar, bảng nợ dạng thẻ ở 390, nhãn tầng), sửa 1 test App, ảnh + báo cáo.

## 2. Kiểm
- `npx tsc -b`: sạch. `npx vitest run`: **Test Files 61 passed (61) · Tests 509 passed (509)**. `npm run build`: built OK.
- Test mới: `HoSoHopDong360.test.tsx` 5, `HoSoToa360.test.tsx` 6 (11 passed); `HopDongQuanLy.test.tsx` 5; `DanhMucToaNha.test.tsx` 5.
- `git diff --stat`: chỉ `HoSoHopDong360`, `HoSoToa360`, `HopDongQuanLy`, `DanhMucToaNha`, `HoSoHopDongToa.css` (+ test của chúng) và `App.test.tsx` (xem mục 4).

## 3. Ảnh (app thật qua vite 5314; qa.json: overflow 0, belowHit 0, noAccessibleName 0, contrast.below 0 cho cả 13 ảnh trang)
| mã | đường dẫn | khung | khác prototype |
|---|---|---|---|
| 08 | /hop-dong/9 (sắp hết) | 1440 | gần như trùng; nút "…" không có viền (dùng `MenuThaoTac` sẵn); cột Kỳ hiện mã hoá đơn thay vì "07/2026"; khoảng trống trên cùng + lề trái rộng hơn ~48px do khung x0 |
| 08 | /hop-dong/10 (chờ ký), /hop-dong/1 (thường) | 1440 | nút chính đúng "Ký hợp đồng" / không có; mốc bước 1 "cur" khi chờ ký |
| 08 | /hop-dong/9, /10 | 390 | xếp 1 cột, bảng nợ thành thẻ, nút xuống dòng, không tràn |
| 08 | /hop-dong/9 bấm Gia hạn | 1440 | ngăn phải mở đúng, nhúng HopDongThaoTac chế độ chi tiết |
| 09 | /toa-nha/3 | 1440 | số liệu trùng (9/12, 50.398.000 ₫, 12, ...); ô thứ 4 của strip là "Hợp đồng cần xử lý" (brief) thay vì "Kỳ đang mở"; sơ đồ chia theo tầng (brief) thay vì 6 cột liền; "Cần chú ý" có avatar/tile |
| 09 | /toa-nha/3 · ngăn sửa | 390 | form đúng, không tràn |
| - | /hop-dong?toaNhaId=3, /toa-nha | 1440+390 | không có ảnh prototype; 1 nút chính; hàng là link |
| - | QTHT /toa-nha/3 | 1440+390 | chỉ thông tin toà + câu giải thích, không nút Chủ/QL |

## 4. Test cũ đã sửa (từng cái)
- `HopDongQuanLy.test`: "chip hiện đúng số…" — không còn gọi `/api/toa-nha` (toà do khung); "?sapHetHan=true" — nút hàng là `<a>` có chữ ẩn cho đọc màn hình nên dùng `toContain('Gia hạn')`.
- `DanhMucToaNha.test`: bỏ 3 test (2 test sửa toà + 1 test nhãn nút "Sửa …" trên di động) vì nút Sửa chuyển sang hồ sơ toà; nội dung tương đương nằm ở `HoSoToa360.test` (PUT đúng payload, lỗi máy chủ). Form khai báo giờ ở ngăn (portal) nên helper query `document`.
- `App.test` "FR-BLD-01 … create and edit a building": file ngoài danh sách sở hữu nhưng khoá bố cục cũ → chỉ sửa test này: form tìm trong `document` (ngăn), câu "tháng hai" chuyển vào form, bỏ đoạn Sửa (đã có ở HoSoToa360.test).

## 5. Cố ý không làm / chưa kiểm / cần controller quyết
- Ngăn Gia hạn/Ký/Thanh lý/Phụ lục/… đều nhúng cùng `HopDongThaoTac` (embedded, chi tiết hợp đồng) vì file không export phần con; chỉ khác tiêu đề ngăn, người dùng tự chọn bước bên trong. Tải lại hồ sơ khi đóng ngăn, không phải ngay sau từng thao tác. Ảnh ngăn có 2 `belowHit` + 10 chữ <13px nằm trong HopDongThaoTac (x11).
- "Khai báo phòng" là link `/phong?toaNhaId=&moi=1` (form nằm ở `DanhMucPhong`, x3). **Chủ không có route `/phong`** (`dinhTuyen`) nên bấm sẽ vào trang "không có quyền"; `moi=1` do x3 xử lý. Cần controller/x3 chốt.
- `GET /api/hop-dong/{id}` không trả `toaNhaId`: hồ sơ tìm hợp đồng trong danh sách từng toà được xem (≤3 lần gọi). Nợ theo hợp đồng: Chủ qua báo cáo công nợ, QL qua hoá đơn quá hạn của toà (không gồm hoá đơn chưa quá hạn).
- Tag "Hết hạn sau n ngày" dùng cờ `sapHetHan` của máy chủ, không tự lọc ≤30. QTHT: ẩn nút Sửa toà (máy chủ vốn từ chối PUT của QTHT). Danh sách hợp đồng của Chủ ở "Tất cả toà" hiện ô chọn toà tại chỗ (không tự chọn toà đầu như cũ). Không thử thao tác ghi trên app thật; không kiểm bàn phím trong ngăn ngoài test.
