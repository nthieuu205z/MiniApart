# Báo cáo y2 — Hồ sơ: Người thuê · Phòng · Toà · Hợp đồng

Nhánh `ui/y2-ho-so`. Vite cổng 5320 (đã tắt), dữ liệu thật từ 5190, chỉ GET (ngoài đăng nhập).

## 1. Việc theo task
| Task | Commit | Nội dung |
|---|---|---|
| T1 | `ui(y2): danh sách Người thuê…` | Dòng đầu trang từ dữ liệu thật (người nợ + hợp đồng ≤ 30 ngày, bấm đặt chip), chip Tất cả/Còn nợ/Sắp hết hạn, thứ tự nợ → hết hạn → còn lại, nút Ghi thu/Gia hạn/không nút, "Thêm người thuê" là nút thường. Nguồn nợ/hợp đồng lỗi thì chỉ cột đó hiện "—". |
| T2 | `ui(y2): hồ sơ người thuê…` | DauTrang, KhoiSo, bảng "Hoá đơn chưa trả đủ" + hàng Cộng, Nhắc qua Zalo (NganNhacNo), nút chính "Ghi thu X ₫" chỉ khi nợ (< 768: ChanDinh), Điện nước ẩn, "Ghi chú liên hệ" + nhãn cần backend. Giữ `?tab=` và ngăn sửa. |
| T3 | `ui(y2): hồ sơ toà…` | Dòng Việc kế tiếp (4 ca + không việc; nút chính duy nhất), KhoiSo, sơ đồ phòng (tầng cao trên, nợ/trống/đang sửa), giá dịch vụ, Cần chú ý, PCCC từ `/api/toa-nha/:id/pccc`. |
| T4 | `ui(y2): hồ sơ phòng…` | Nút chính theo trạng thái (Tạo hợp đồng / Ghi thu / không), KhoiSo, hoá đơn Tháng·Hạn·Phải trả·Còn nợ, Công tơ tháng N chỉ khi có dữ liệu. |
| T5 | `ui(y2): hồ sơ hợp đồng…` | Nút chính Gia hạn hợp đồng / Ghi nhận đã ký, băng vàng, Điều khoản chính, Vòng đời (ThanhBuoc doc), "Nếu thanh lý hôm nay" + `Thanh lý hợp đồng…` (danger). |
| fix | `ui(y2): sửa lỗi sau chụp ảnh…` | Chân dính nằm trên bottom-nav; ô phòng auto-fit; nợ của Quản lý ghép theo phòng + họ tên (JSON `/api/hoa-don` không có `hopDongId`). |

## 2. Lệnh kiểm
`npx tsc -b` sạch · `npx vitest run`: **650 → 665 test**, 75 file xanh (gồm guard `designTokens`) · `npm run build` xong.
`qa.json` cả 12 ảnh: horizontalOverflow 0 · belowHit 0 · contrast.below 0 · textBelowFloor 0 · noAccessibleName 0 · h1.count 1 (h1 left/top: 1440 → 288/96–133, 390 → 16/112–129).

## 3. Ảnh (so `v3/screens/png/`)
| Mã | Khung | Khác prototype · đổi giữa 1440 và 390 |
|---|---|---|
| 12 | 1440, 390 | Ảnh V3 cũ chưa có dòng việc kế tiếp; bản này có "15 người còn nợ … · 3 hợp đồng hết hạn…" bấm được, chip, cột hành động. Dữ liệu thật 63 người nên bảng phân trang 20 dòng. 390: thẻ Người thuê · Phòng · Còn nợ, ẩn điện thoại/thuê đến/nút. |
| 03 | 1440, 390 | Khối Điện nước ẩn (không có API cho Chủ/QL) nên cột trái chỉ còn bảng nợ. Tab `?tab=` giữ lại, prototype không có. Số ngày trễ lệch 1 ngày do ngày chụp. 390: Zalo ẩn, "Ghi thu" ở chân dính trên bottom-nav. |
| 04 | 1440, 390 | PCCC và giá dịch vụ lấy API thật (prototype là số tay). Có thêm nút "Sửa thông tin toà" (đang có sẵn). 390: Cần chú ý lên trên Sơ đồ, lưới 4 cột, "Giao thợ" ở chân dính. |
| 05 | 1440, 390 | Không có khối Người đang ở (đã thành ô KhoiSo); giữ Lịch sử hợp đồng + Tài sản. Cột Người thuê của bảng hoá đơn bỏ. 390: Hợp đồng đến ẩn. |
| 07 | 1440, 390 | Vòng đời dọc ở cột phải; giữ khối Liên kết và menu "…" (Phụ lục, Người ở cùng, Phát sinh, Cọc). 390: nút chính ở chân dính. |
| QL | 1440 | `/nguoi-thue/1`, `/toa-nha/3`: không có 403; tiêu đề "Phòng", không vết; Ghi thu / Giao thợ vẫn là nút chính duy nhất. |

## 4. Test cũ đã sửa (lý do)
- `HoSoNguoiThue.test`: "liệt kê hồ sơ với SĐT…" → thay bằng 4 test mới (cột CCCD/Quê quán/Cảnh báo bị bỏ theo brief); "bấm một hàng…" chỉ đổi mock sang `mayChu`; "Thêm người thuê mở ngăn…" → chuyển sang nút ở trạng thái rỗng (header giờ là liên kết `/hop-dong/moi`).
- `HoSo360.test`: "tiêu đề, thẻ nợ…" (tags/hoạt động/Điện → KhoiSo/bảng nợ/ẩn Điện nước); "đúng một nút chính…" (nhãn "Ghi thu X ₫", Gọi → số điện thoại); "điện thoại: nút chính…" (`.sticky-act` → `.ma-chandinh`); "phòng đang thuê…" (đang nợ nên có Ghi thu; `nav.crumb` → `.ma-vet`).
- `HoSoToa360.test`: "sơ đồ đủ số phòng…" (tầng cao trên, aria-label thêm "nợ …"); "Cần chú ý…" (chờ ký lên trước; tiêu chí hợp đồng ≤ 30 ngày thay `sapHetHan` nên hợp đồng 1 cũng vào; `.strip` → `.ma-khoiso`; Khai báo phòng không còn là nút chính).
- `HoSoHopDong360.test`: 3 test nút chính (nhãn mới), "…" còn 4 mục (Thanh lý thành nút riêng), test mở ngăn Thanh lý đổi sang bấm nút `Thanh lý hợp đồng…`.
- Không có test khoá 44px phải đổi.

## 5. Không làm / chưa kiểm / cần lô khác
- **Cần lô khác:** `App.tsx` dòng `case 'nguoi-thue'` phải truyền `vaiTro` (đã sửa 1 dòng, ngoài danh sách file; cần y0/controller xác nhận). Nếu bỏ, danh sách Người thuê coi mọi vai là Chủ và Quản lý sẽ gọi `/api/bao-cao/cong-no` (403 → cột nợ "—").
- `HopDongThaoTac` hiện export `GiaHanHopDong/KyHopDong/ThanhLyHopDong/PhuLucHopDong/NguoiOCungHopDong` (chưa phải `GiaHan/Ky/...` như brief); dùng tên hiện có.
- "Tải PDF" luôn hiện (đã có `downloadManagementFile`); chưa bấm thử trên app thật (luồng tải).
- Phần "tháng chưa gửi hoá đơn" của Việc kế tiếp chỉ biết "tháng đang mở chưa có hoá đơn đã gửi", không biết bước Ghi chỉ số.
- Chưa bấm thật luồng ghi (Ghi thu, Gia hạn, Ký, Thanh lý, sửa hồ sơ): chỉ có test mock. Ghi chú liên hệ cần backend.
- `?phongId=` của "Tạo hợp đồng" đã có `TaoHopDong` đọc, giữ kèm `&toaNhaId=` như cũ.
- `/thu-tien?xem=` ("Mọi hoá đơn →") chưa được màn Tiền đọc; chờ y1.
- Chưa chụp 768–1024.
