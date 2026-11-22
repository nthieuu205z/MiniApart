# Báo cáo lô x8 — Ghi chỉ số (bước 1 Chu kỳ tháng)

## 1. Việc đã làm
1. Desktop: bỏ ô chọn toà riêng (dùng `useBuildings`/`BuildingSelect` như các màn khác; ô chọn chỉ hiện khi Chủ đang "Tất cả toà" hoặc màn chạy ngoài khung). Nhóm "Chưa ghi (k)" lên đầu, mỗi công tơ một hàng (`id="cong-to-{phongId}-{dichVuId}"`, ô nhập, đơn vị, kỳ trước, chụp ảnh qua `nenAnhCongTo`, nút "Lưu" secondary). Nhóm "Đã ghi (n)" là `<table>` gọn, "Sửa" mở hàng nhập ngay dưới hàng đó. Một nút chính "Lưu k chỉ số" (lần lượt gọi `luuChiSo` cũ: cùng API, cùng validate, cùng xác nhận cảnh báo). `anNutChot` → không render khối/nút chốt.
2. Điện thoại: dòng "Chu kỳ MM/YYYY · Bước 1/4 Ghi chỉ số · n/m" + thanh `.mstep`, thẻ công tơ hiện tại, nhãn "Chỉ số mới" luôn hiện, `inputmode="numeric"`, "Chụp ảnh công tơ", "Bỏ qua, ghi sau", danh sách "Còn lại" bấm được, nút dính đáy "Lưu, sang {phòng} · {dịch vụ}" / "Lưu và xong". Lỗi lưu hiện dưới ô, số giữ nguyên, không chuyển. Hết công tơ → thẻ "Đã ghi đủ".
3. Test: 5 test mới + sửa 5 test cũ (bên dưới).
Commit: xem `git log ui/x8-ghi-chi-so` (code · test · ảnh+báo cáo).

## 2. Kiểm
- `npx tsc -b` sạch · `npx vitest run`: **Test Files 63 passed (63), Tests 548 passed (548)** · `npm run build` xong.

## 3. Ảnh (app thật qua vite 5318 → 5190; qa.json: overflow 0, belowHit 0, contrast.below 0, textBelowFloor 0)
| mã | tệp | khung | khác prototype |
|---|---|---|---|
| 12 | 12-ql-chu-ky-1440.png | 1440 | Chưa có thanh bước/tab (x5), dữ liệu demo đã ghi đủ 9/9 nên "Chưa ghi (0)"; bảng đã ghi có thêm cột "Sửa"; kỳ-select nằm đầu trang; lề đầu trang chưa đều (x0b) |
| 23 | 23-ql-ghi-chi-so-390.png | 390 | Dữ liệu thật đủ 18/18 → thẻ "Đã ghi đủ" thay thẻ công tơ; thanh bước + dòng tiến độ giống 23 |
| — | 12-chu-toa-3-1440.png | 1440 | như 12 (Chủ, toà 3, sidebar Chủ) |
| — | 23-chu-toa-3-390.png | 390 | như 23 |
| 12/23 (trạng thái thiếu) | x8-gia-lap-thieu-1440/390.png | 1440/390 | dữ liệu giả lập (fetch stub, harness tạm đã xoá) để thấy hàng nhập; không có sidebar/khung |
Chiều cao trang bước 1 (app thật, 1440): **1.164px** (cũ 11.151px); nút chính trong vùng nhìn thấy: 1 ("Lưu chỉ số"; "Chốt kỳ" là secondary).

## 4. Test cũ đã sửa
- `anNutChot ẩn nút…`: 'Kỳ: 8/2026' → 'Kỳ 8/2026' (đổi câu chữ tiêu đề).
- `mobile primary button names…`: 'Lưu, sang công tơ nước 101'/'Lưu, sang phòng 201' → 'Lưu, sang 101 · Nước'/'Lưu, sang 201 · Điện' (theo brief).
- `FR-MTR-04 re-saves persisted anomaly`, `FR-MTR-03 re-saves server-marked replacement`, `managementFlows › owner closed-period correction`: công tơ đã ghi nay nằm trong bảng → thêm bước bấm "Sửa" trước khi nhập (hành vi/payload không đổi).

## 5. Cố ý không làm / chưa kiểm
- Không bấm Lưu trên 5190; luồng lưu chứng minh bằng test mock fetch.
- Mobile không còn chip chọn phòng/công tơ đã ghi: sửa số đã ghi chỉ ở desktop. `inputmode=numeric` theo brief → bàn phím iOS không có dấu thập phân.
- Cột bảng đã ghi suy ra từ tên dịch vụ có trong dữ liệu (không cố định Điện/Nước).
- Dùng `useToaDangChon` + `useBuildings` thay vì chỉ `useMotToa` để giữ chạy được ngoài `ToaDangChonProvider` (test cũ).
- Chưa thấy ảnh app thật ở trạng thái còn thiếu công tơ (demo đã ghi đủ); chỉ có ảnh giả lập.
