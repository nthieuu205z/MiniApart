# Báo cáo lô y1 — Hôm nay & Tiền (nhánh `ui/y1-tien`)

## 1. Việc theo task
| Task | Commit | Nội dung |
|---|---|---|
| T1 + T2 | `0cdb07e` | `HomNay.tsx/.css/.test.tsx`: Hôm nay Chủ (4 ô số từ hoá đơn, Ai đang nợ, Cần quyết, Theo toà) và Quản lý (nút chính theo bước, băng "đang trễ", `ThanhBuoc`, Việc cần làm, Lịch xem phòng có "Xác nhận"). Gộp một commit vì cùng một file. |
| T3 + T4 + T5 | `2df54ce` | `ThuTien.tsx/.css/.test.tsx`: Tiền/Thu tiền theo người, 4 tab (`can-thu`, `da-thu`, `hoa-don`, `coc`), hàng con `?xem=`, ngăn Ghi thu một lần (`phanBoThu` + `ghiThuLanLuot`), ngăn Nhắc (`NganNhacNo`), bảng phẳng + hàng tổng, Tiền cọc. Gộp một commit vì cùng một file. |
| Ảnh + báo cáo | commit cuối | `shots/y1/*` |

`FinancePaymentPanel.tsx`, `financeFlows.test.tsx` **không sửa** (giữ default export, `message`, props cho y5/y6).

## 2. Lệnh kiểm đã chạy thật
- `npx tsc -b` sạch · `npx vitest run`: **650 → 654 test xanh** (75 file; gồm guard `designTokens.test.ts`) · `npm run build` xanh.
- `git diff --stat feat/v3...HEAD`: chỉ 6 file trong "File được sửa" + `shots/y1`.
- Ảnh chụp từ vite `5310` → backend `5190`, chỉ GET (đăng nhập do `app-shot.mjs`); đã tắt vite.

## 3. Ảnh (dữ liệu thật; so với `v3/screens/png/`)
QA mọi ảnh: `horizontalOverflow` 0 · `belowHit` 0 · `contrast.below` 0 (min 5,03) · `textBelowFloor` 0 · `noAccessibleName` 0 · `h1.count` 1 (1440: left 288; 390: left 16; top 96 / 84 ở Hôm nay, 133 / 129 ở Tiền vì còn hàng tab của khung).

| Mã | Khung | Khác prototype | 1440 → 390 |
|---|---|---|---|
| 01 Chủ Hôm nay | 1440, 390 | Ai đang nợ chỉ có Gọi (không Nhắc, theo brief `rut`); không có cột bản đồ phòng ở Theo toà (brief không có cột này); "Cần quyết" không có dòng "Duyệt báo giá" (chưa có API) | 390: KhoiSo còn 3 ô (ẩn "Phòng đang thuê"), nút Thông báo ẩn, Theo toà còn Toà · Còn nợ; số tiền không còn bị cắt |
| 31 Chủ Hôm nay một toà | 1440 | Bỏ khối Theo toà, số lọc theo An Nhiên | — |
| 13 QL Hôm nay | 1440, 390 | Thanh bước hiện "mở từ dd/mm" thay vì mô tả khác; không có "Thông báo <số>" (App giữ số chưa đọc) | 390: ThanhBuoc chỉ còn "Bước 2/4: Khoá chỉ số", Thông báo ẩn |
| 02 Chủ Tiền | 1440, 390 | Dải theo toà không có nhãn tháng ở thanh; hàng con mặc định đóng (chỉ mở theo `?xem=`) | 390: danh sách `DongNguoiNo rut`, dải theo toà ẩn, nút chính trong `ChanDinh` (đặt trên thanh nav dưới) |
| 34 Chủ Ngăn Ghi thu | 1440 | Có thêm ô chọn "Người nộp" (để đổi người khi mở từ nút chính); không bấm gửi | — |
| 18 QL Tiền | 1440, 390 | Tiêu đề "Thu tiền", không có dải theo toà | như 02 |

Số thật đọc trên ảnh (trùng prototype, lệch 0): còn phải thu **173.450.000 ₫**, **15 người**, **60 hoá đơn**; tháng 11 đã thu 15.367.000 ₫ (3 hoá đơn); tháng 10: 68% (94.032.500 / 137.395.000 ₫); QL An Nhiên 50.398.000 ₫ / 5 người / 20 hoá đơn.
Lệch: "Phòng đang thuê" ghi "0 đang sửa" (prototype "3 đang sửa") vì `kpi.soPhongDangSua` demo = 0; tab Tiền cọc đếm 30 (prototype 27) vì đếm mọi hợp đồng chưa thanh lý có cọc > 0.

## 4. Test cũ đã sửa (lý do)
`HomNay.test.tsx` — viết lại cả 6 `it` vì UI đổi cấu trúc:
- "nợ quá hạn gộp theo người…" → khối là `DongNguoiNo`, không còn `a.irow`/"Mở Thu tiền".
- "hợp đồng sắp hết hạn…" → gộp thành `DongViec` trong "Cần quyết", bỏ khối riêng; hàm `sapHet` vẫn kiểm.
- "một API lỗi…" → khối Sự cố bỏ; lỗi một nguồn giờ hiện trong "Cần quyết" + "Tải lại".
- "không ai nợ…" → câu đổi thành "Không ai còn nợ."; khối Phòng chưa cho thuê bỏ.
- QL "không gọi API của Chủ…" và "bảng việc lỗi…" → nút chính đổi thành "Ghi K công tơ còn thiếu"; K lấy từ `thieu-chi-so`, không từ `bang-viec`.

`ThuTien.test.tsx` — viết lại cả 15 `it` (cấu trúc bảng/ngăn đổi): "3 nhóm theo người", "chip lọc", "nhóm đầu mở sẵn" (nay mở theo `?xem=`), "ô tìm / nhóm theo Phòng" (bỏ chuyển nhóm theo Phòng), "rỗng do lọc / lỗi tải", "Quản lý không gọi cong-no", 2 test bulkbar (thay bằng "Chọn để nhắc nhiều người"), "xuất danh sách" (nay là nút "Xuất Excel"), 3 test ngăn (ngăn mới, bỏ chế độ chọn hoá đơn), "mở từ nơi khác", "tab Đã thu", "tab Tiền cọc". Payload POST thu tiền giữ nguyên: `{ soTien, hinhThuc, ngayThu, xacNhanThuThem }`, đến đúng URL cũ. `App*.test.tsx` không sửa.

## 5. Không làm / chưa kiểm / cần lô khác / phụ thuộc backend
- **Cần lô nền**: `dinhTuyen.ts` `NHOM_TAB['thu-tien']` vẫn dựng hàng tab của khung (Cần thu · Hoá đơn · Đã thu · Tiền cọc) nên ở `/thu-tien` có **hai hàng tab**; brief yêu cầu tab trong thẻ nên giữ bản trong thẻ, cần gỡ nhóm tab ở khung. `ChanDinh` ở 390 dính đáy viewport nên bị thanh nav dưới che; đã ghi đè `bottom: var(--ma-bottom-nav-height)` trong `ThuTien.css`, nên sửa ở `components.css`.
- Chưa có: "Duyệt báo giá" (thiếu API), số thông báo chưa đọc trên nút "Thông báo", ngày hạn kiểm định PCCC (chỉ có "N toà"), Hoàn tác sau ghi thu (chưa có API huỷ).
- Tiền cọc: giữ nút "Thu cọc" mở `ContractFinance` ngay dưới bảng (thu cọc/quyết toán) ngoài việc bấm tên phòng → `/hop-dong/:id`; "Cọc đang giữ" lấy từ `tienCoc` hợp đồng, không gọi sổ cọc từng hợp đồng.
- Chưa kiểm trên app thật: bấm Xác nhận lịch, ghi thu, ghi cọc (cấm ghi; chỉ có test mock). Chỉ kiểm CHU và QUAN_LY; không kiểm mất mạng thật.
- Khối "Cần quyết" gộp nhiều toà ở bước "ghi chỉ số / khoá chỉ số" thành "N toà còn ở bước …".
