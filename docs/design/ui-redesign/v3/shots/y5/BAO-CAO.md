# Báo cáo y5 — Tháng (Quản lý)

## 1. Việc theo task
- T1 `tinhBuocChuKy.ts` (tên 4 bước, tóm tắt V3): commit "T1 tên 4 bước…".
- T2 `GhiChiSo.tsx/.css` (bảng, Enter xuống phòng dưới, ChanDinh mobile): commit "T2 ghi chỉ số dạng bảng…".
- T1/T3/T4/T5 `ChuKyThang.tsx` (DauTrang + ThanhBuoc, bản vẽ bước sau, khoá chỉ số, gửi hoá đơn, thu tiền): commit "T1,T3-T5 màn Tháng…" (một file gộp nên một commit).
- T6 `HoaDonQuanLy.tsx`, `InvoiceActions.tsx`: commit "T6 hoá đơn hàng loạt…".
- Commit sửa lỗi sau chụp ảnh (CSS ô nhập, bố cục bước ≠ 2, ghi chú "phòng"), ảnh + báo cáo: commit cuối. Hash: `git log --oneline feat/v3..ui/y5-thang`.

## 2. Lệnh kiểm
`npx tsc -b` sạch · `npx vitest run` 650 → 655 xanh (75 file) · `npm run build` xanh.

## 3. Ảnh (dữ liệu thật đang ở **bước 2**: 9/9 phòng đã ghi, chưa khoá; 1 hoá đơn tháng 11 đã gửi)
QA cả 8 ảnh: overflow 0 · belowHit 0 · contrast 0 · textBelowFloor 0 · noAccessibleName 0 · h1 = 1.
| Mã | Khung | Khác prototype |
|---|---|---|
| 14 `/chu-ky?b=1` | 1440 | Không có cột "Người thuê" (API chỉ số không trả tên), không có nhãn vàng "tăng x%" (không có phòng vượt ngưỡng). Dữ liệu 9 phòng × 2 dịch vụ nên 2 cột dịch vụ. Nút "Lưu chỉ số" chặn kèm lý do vì chưa có gì để lưu. Hàng phụ (ảnh, thay công tơ) mở bằng nút camera. Dưới bảng có "Sau bước này" và "Tháng 10 (đã khoá)" xếp ngang. |
| 14 | 390 | Dạng thẻ từng công tơ (như cũ), nút chính trong ChanDinh; không lặp header/tiến độ vì đã có ở khung. Thấy trạng thái "đã ghi đủ" (không có công tơ thiếu). |
| 15 `?b=2` | 1440 | Đây là bước hiện tại nên không có nhãn minh hoạ; bước 3, 4 mới có. Không có dòng "không phòng nào tăng quá 50%" (brief không yêu cầu, không tính được). |
| 16 `?b=3` | 1440 | Có băng minh hoạ + nút chặn "Khoá chỉ số trước khi tạo hoá đơn". Bảng chỉ có 1 hoá đơn thật (đã gửi). Không có cột Tiền phòng/Điện/Nước/Dịch vụ (API không trả), không có ô chọn (xem mục 5), không có "hạn trả N ngày". |
| 17 `?b=4` | 1440 | 3 ô KhoiSo số thật (4.578.000 ₫ đã thu · 0 ₫ chưa trả · nợ cũ 50.398.000 ₫, 5 người — khớp prototype). Không có nút Gọi (API không có SĐT). |
| 18 `/hoa-don` | 1440/390 | Đổi chữ Tháng/Gửi, hàng "Cộng 20 hoá đơn". 390: DataTable chuyển thẻ như y0. |
| 19 `/chu-ky` CHU | 1440 | Cùng màn với QL; khác sidebar. |
Giữa 1440 và 390: bước 1 đổi bảng → thẻ từng công tơ; nút chính từ đầu trang → ChanDinh dính đáy; thanh bước → "Bước n/4".

## 4. Test cũ đã sửa (lý do)
- `App.test` · "FR-MTR-01 ensures the connection status panel…" và "routes CHU to the scoped meter-reading screen…": `#chu-ky-title` và chữ "Chu kỳ tháng" không còn (h1 do DauTrang, "Tháng n/yyyy"); đổi sang kiểm `h1` bắt đầu bằng "Tháng".
- `managementFlows.test` · "requires a reason and uses PUT…": nút "Sửa" bỏ (ô nhập sửa trực tiếp trong bảng); mở hàng phụ bằng nút "Ảnh và thay công tơ" để lấy nút Lưu từng công tơ.
- `GhiChiSo.test` (9 `it`): FR-MTR-01 lists (inputMode `numeric` theo brief, "đã ghi 0/2 công tơ" thay "0 / 2 phòng"); FR-MTR-02 calculates (mức dùng ở ô "Dùng", không còn dòng "Mức tiêu thụ:"); FR-MTR-02 keeps room progress (đếm công tơ ở tiêu đề); FR-MTR-04 re-saves (giá trị đã ghi hiển thị `160`, không `160.00`); FR-MTR-06 camera, FR-MTR-03 blocks lower, FR-MTR-09, `moSua` helper (ảnh/checkbox ở hàng phụ phải mở trước); "anNutChot" (bản nhúng không in "Kỳ 8/2026"); x8 desktop (viết lại cho bảng + thêm test Enter).
- `HoaDonQuanLy.test`: nhãn select "Lọc tháng hoá đơn", link "Tháng này"; thêm test hàng tổng + ConfirmDialog.
- `ChuKyThang.test`, `tinhBuocChuKy.test`: viết lại theo tên/chữ V3 (đã nêu trong brief).

## 5. Không làm / chưa kiểm / cần lô khác
- **Bỏ ô chọn ở bảng hoá đơn nháp (T4)**: API gửi tất cả nháp, ô chọn sẽ như thể gửi được một phần. Ghi câu "Gửi tất cả hoá đơn nháp của tháng."
- **Thiếu backend**: tên người thuê ở ghi chỉ số; SĐT (nút Gọi); tách Tiền phòng/Điện/Nước; hạn trả N ngày. Ghi thu nối người qua `/api/hop-dong` (ghép phòng + họ tên, như `nhomNoTheoNguoi`); không ghép được thì về `/thu-tien`.
- Đếm "phòng" (API đếm phòng), không "công tơ" như brief; tiêu đề bảng ghi chỉ số đếm công tơ thật (18/18). Lý do: nói đúng số API trả. Brief ghi "còn K công tơ", mình viết "còn K phòng".
- `GhiChiSo` nhận thêm 2 prop (`kyIdCoDinh`, `nutChinhSlot`) để bước 1 dùng đúng tháng đang chọn và đặt "Lưu chỉ số" ở đầu trang.
- **Chưa nhìn thấy trên app thật** (dữ liệu demo không có ca này, và không được ghi): hàng thiếu (viền đỏ, "Thiếu n công tơ"), nhãn vàng tăng %, hộp xác nhận, bước 3 có nháp, nút Ghi thu/Nhắc. Chỉ có test mock.
- Tên cột/ô theo tên dịch vụ thật ("Điện sinh hoạt", "Nước sạch"), không cứng "Điện/Nước".
