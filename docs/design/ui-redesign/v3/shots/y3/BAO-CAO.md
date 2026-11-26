# Báo cáo lô y3 — Danh mục & Hợp đồng

## 1. Việc theo task
- T1 `d176e7c` Toà & phòng: thẻ ngang/toà, sơ đồ chấm theo tầng (thuê=mực, nợ=đỏ, trống=viền đứt), "Đang thuê x/y phòng" (ẩn <768), Còn nợ (chỉ Chủ; QL/QTHT ẩn, không gọi cong-no). QTHT đề "Toà nhà".
- T3 `197f396` Bảng hợp đồng: tab Cần xử lý (mặc định)/Đang hiệu lực/Đã thanh lý kèm số đếm, ghi `?loc=`; giữ `toaNhaId`, `sapHetHan=true` (mở Cần xử lý), `hopDongId`; xếp theo ngày còn lại tăng dần; nút thường Gia hạn / Ghi nhận đã ký.
- T4 `d4a70f3` Tạo hợp đồng một trang 8/4, cột phải sticky Thu khi ký + Còn thiếu; nút chính blocked kèm lý do; <768 nút chính ở ChanDinh. Payload `taoBody()` giữ nguyên.
- T5 `57e0b1b` HopDongThaoTac/QuanLyTaiSanPhong: 10 hex → token, Thanh lý/Từ chối/Xoá tài sản → danger, nút bật tab không còn là primary, chữ cũ ("Chủ sở hữu" nhãn, "Kỳ thanh toán", "Hủy bỏ"→"Huỷ"). Export/props/API không đổi.
- T2 `f8b0bf6` Phòng (QL): DauTrang, nút thường "Tạo hợp đồng" cho phòng trống (→ `/hop-dong/moi?phongId=`), "Lịch hẹn xem phòng" → "Lịch xem phòng".
- Sửa sau chụp ảnh (chưa commit riêng lúc viết báo cáo, nằm trong commit cuối): căn ô form, bỏ lỗi đỏ khi form rỗng, lý do chặn ngắn gọn, tầng cao lên trên, CSS thẻ mobile.

## 2. Lệnh kiểm
`npx tsc -b` sạch · `npx vitest run` **650 (mốc) → 659 xanh, 75 file** · `npm run build` ok · `stylesCleanup.test.ts` không sửa, qua · diff chỉ nằm trong danh sách file + shots/y3 (kèm 1 dòng `App.test.tsx`, xem mục 4).
Ảnh: `app-shot.mjs` qua vite 5330, backend demo 5190 chỉ GET. qa.json cả 9 ảnh: horizontalOverflow 0, belowHit 0, contrast.below 0 (min 5.03), textBelowFloor 0, noAccessibleName 0, h1.count 1.

## 3. Ảnh (h1: trái/trên)
| Mã | Khung | Khác prototype |
|---|---|---|
| 11 | 1440 (h1 288/96) | Chấm: tầng cao nằm trên; dữ liệu thật nên nợ nhiều hơn mẫu; thanh tìm + chuông của khung y0. 390: ẩn sơ đồ và "Đang thuê", còn Còn nợ + mũi tên. |
| qtht | 1440 | Không có ảnh V3. Ẩn Còn nợ, không có sơ đồ (QTHT không đọc được phòng) — thẻ chỉ tên + địa chỉ. |
| 06 | 1440 (288/96) | Thẻ có ô tìm + ô chọn (checkbox In PDF) của DataTable mà prototype không vẽ; dữ liệu thật chỉ 2 dòng Cần xử lý (toà đang chọn). 390: chỉ Phòng · Người thuê · Tình trạng; thanh tab cuộn ngang, nhãn "Đã thanh lý" bị cắt ở mép. |
| 20 | 1440 (288/122) | Dịch vụ không có Đơn giá (API danh sách dịch vụ không trả giá) → ô "Theo giá toà" để nhập giá riêng; mặc định tích hết dịch vụ; dòng lý do chặn nằm dưới nút chính làm tiêu đề cao hơn mẫu. 390: khối xếp dọc, Còn thiếu rồi Thu khi ký rồi chân dính (full-page chụp chân dính đè lên nội dung — chỉ là hiệu ứng chụp). |
| – | /phong QL 1440+390 | Giữ bảng; thêm cột Thao tác. Không có ảnh V3. |

## 4. Test cũ đã sửa
- `App.test.tsx` it "FR-BLD-03 groups rooms by floor…": selector `.topbar .sub` → `.ma-dautrang-phu` (DauTrang thay topbar).
- `DanhMucToaNha.test`: "mỗi toà là liên kết…" selector `a.td-main` → `a.tn-the` (thẻ thay bảng). Thêm 1 test mới.
- `HopDongQuanLy.test`: viết lại 5 it cũ (chip → tab; chip Đã cọc/Hiệu lực không còn; tìm "dinh" → "ngo" vì thanh lý nằm tab khác) + 3 it mới.
- `TaoHopDong.test`: viết lại cả file (5 bước → một trang): 5 it cũ → 8 it mới.
- `HopDongThaoTacCon.test`: thêm 1 it export, thêm 2 expect vào it Thanh lý (btn-danger, không btn-primary).
- `DanhMucPhong.test`: thêm 1 it.

## 5. Không làm / chưa kiểm / phụ thuộc
- **Phòng QL**: không có chip "Đang nợ", cột Còn nợ, nút "Ghi thu" — màn không có nguồn nợ (cần gọi `/api/hoa-don?toaNhaId=` + `tuHoaDonQuanLy`; làm thì vượt phạm vi lô).
- **CCCD, Số người ở** (Tạo HĐ): payload cũ không có hai trường này → chỉ giữ ở client, gắn nhãn "cần backend". CCCD vẫn bắt buộc 12 số trong "Còn thiếu" theo brief; tự điền nếu `soGiayTo` của người thuê đủ 12 số. Nếu người thuê chỉ có `soGiayToChe` (bị che) thì phải gõ tay.
- **Thêm người mới** trong ô Người thuê: không có (cần luồng tạo người thuê); câu trợ giúp trỏ sang mục Người thuê.
- **Đơn giá dịch vụ**: không hiển thị (xem trên).
- Ngày kết thúc = bắt đầu + n tháng − 1 ngày (khớp prototype), khác `chonThoiHan` cũ (+n tháng); `chonThoiHan/chonTienCoc/chonTatCaDichVu` trong `useFormTaoHopDong` vẫn giữ cho form cũ.
- Tab "Cần xử lý" gồm cả `DA_COC` (brief chỉ nói chờ ký) để hợp đồng đã cọc không biến mất khỏi mọi tab.
- "Chủ sở hữu" là giá trị mặc định gửi API/in hợp đồng (`benAChucVu`) giữ nguyên, chỉ đổi nhãn hiển thị. "Chốt pháp lý/Chốt hồ sơ" (nghĩa khác "Chốt kỳ") giữ nguyên.
- Chưa bấm thử luồng ghi trên app thật (chỉ test mock). Chưa kiểm chân dính ở thiết bị thật.
- Đã tắt vite 5330.
