# Plan 01 — Bảng Hợp đồng (05) + 3 màn điện thoại: Ghi chỉ số (06), Thợ (07), Hoá đơn khách thuê (08)

> Thi công bằng `superpowers:executing-plans`. Mỗi màn một task độc lập → **4 task chạy song song được** (4 worktree tách từ `feat/ui-tokens` sau khi plan 00 đã merge).

## Cần có trước
- Plan 00 đã merge: `design/components.css`, `Icon`, `Button/StatusTag/FilterChip` mới, `design/table/{bangDuLieu.ts, DataTable.tsx}`, `Card`, `Field`, `EmptyState kind=loading|error`, `NavPanel` (bottom-nav ≤ 5 mục, `shortLabel`), `tools/app-shot.mjs`.
- Stack demo 5190 chạy (`docker start miniapart-prj1demo-postgres-1 miniapart-prj1demo-backend-1 miniapart-prj1demo-frontend-1`), hoặc `npm run dev` với proxy về 5190.
- Ảnh đích: `docs/design/ui-redesign/screens/png/05-hop-dong.png`, `06-ghi-chi-so-mobile.png`, `07-tho-cong-viec-mobile.png`, `08-hoa-don-khach-mobile.png`.

## Số đo thật — lần kiểm 21/11/2026
- `npm test` 38 file / 252 test xanh; `npm run build` qua (790,40 kB JS). `git log -1` = `a38cc81`.
- Component + test hiện có:

| Màn | File (dòng) | Test hiện có | API / kiểu dữ liệu |
|---|---|---|---|
| 05 Hợp đồng | `HopDongQuanLy.tsx` (331) nhúng `HopDongThaoTac.tsx` (2.745) | không có file test riêng; `App.test.tsx` "FR-BLD-06…" khoá `[data-testid="manager-contract-screen"]`, `[data-contract-row="<id>"]`, chữ `Đang lọc hợp đồng sắp hết hạn`, gọi `/api/hop-dong?toaNhaId=1`; `HopDongThaoTac.test.tsx` (8) | `fetchHopDongQuanLy(token, toaNhaId): ThongTinHopDong[]` (trả cả danh sách, **không phân trang server**), `fetchToaNha`; PDF `GET /api/hop-dong/{id}/xuat-pdf`; enum `TrangThaiHopDong` = `CHO_KY, DA_COC, HIEU_LUC, DA_THANH_LY`; cờ `sapHetHan`, `soNgayConLai` |
| 06 Ghi chỉ số | `GhiChiSo.tsx` (1.009) | `GhiChiSo.test.tsx` (13: FR-MTR-01…09, NFR-USA-01) | `fetchChiSoDichVu`, `fetchKyThanhToan`, `fetchPhongChuaGhiChiSo`, `ghiChiSoDichVu`, `chotKyThanhToan`; `ThongTinGhiChiSo.phong[].dichVu[].thongTinCanhBaoTieuThu {soKyLichSu, trungBinhBaKyTruoc, nguongCanhBao}` |
| 07 Thợ | `ThoCongViec.tsx` (1.270) render ở `/viec-cua-toi` | `ThoCongViec.test.tsx` (3), `App.tho.test.tsx` (2) | `fetchThoCongViec(token, {nhom,…})`, `fetchThoChiTietCongViec`, `capNhatKhaoSat`, `taoBaoGia`, `guiDuyetBaoGia`, `baoXongViecTho`; `ThongTinViecThoRow` có sẵn `maYeuCau, hangMuc, moTa, toaNha, diaChiToaNha, soPhong, tang, soDienThoaiLienHe, mucDo, trangThai…`; `fetchThoTongQuan().kpi` (`dangXuLy`, `choXacNhan`, `tyLeHoanThanh{daHoanThanh,tongDuocGiao}`) |
| 08 Hoá đơn khách | `HoaDon.tsx` (271), `LichSuHoaDon.tsx` (182) | `HoaDon.test.tsx` (10); `LichSuHoaDon` chưa có test | `fetchHoaDonMoiNhatCuaNguoiThue`, `fetchHoaDonCuaNguoiThue`, `fetchHoaDonCongNoChiTiet`, `fetchLichSuHoaDonCuaNguoiThue`; `ThongTinHoaDonChiTiet {maHoaDon, soPhong, hanThanhToan, trangThai, tongTien, daThu, conLai, cacDong[]}` |

- **Ngưỡng cảnh báo tiêu thụ (màn 06) — đọc từ backend:** `ChiSoDichVuService` lấy hệ số từ cấu hình `app.toa-nha.canh-bao-tieu-thu-nguong` (mặc định `1.50`), chỉ cảnh báo khi `soKyLichSu ≥ 3`, `trungBinh > 0` và `mucTieuThu > trungBinh × hệ số` (so sánh **lớn hơn hẳn**). Hệ số trả về frontend trong `thongTinCanhBaoTieuThu.nguongCanhBao`. Frontend **đã có** hàm đúng logic này: `taoCanhBaoTieuThu()` trong `GhiChiSo.tsx` (dòng ~939). → Dùng lại hàm này, **không viết hằng 1,5**.
- **Màn Thợ ở 5190 có rỗng không — đã xác minh:** log backend: lần khởi động đầu `2026-11-20T17:56:33Z` `ThoBatchDemoSeeder: Baseline PHONG is not yet seeded; skipping…`; lần khởi động lại `2026-11-21T06:49:42Z` `Successfully seeded Tho Batch 44! Repairs: 30 -> 74 (+44), Quotes: 0 -> 34 (+34), Payments: 0 -> 13 (+13)`. Nguyên nhân: `ThoBatchDemoSeeder` có `@Order(100)`, `PresentationDemoSeeder` **không có `@Order`** (mặc định chạy sau cùng) → lần đầu seeder thợ chạy trước khi có phòng nên bỏ qua; chỉ có dữ liệu từ lần khởi động thứ hai. Đọc DB (chỉ SELECT) hiện tại: thợ `0999000031` Lê Quốc Huy có 33 yêu cầu (3 chờ xác nhận, 7 đang xử lý, 8 đã phân công, 13 đã đóng, 2 huỷ), thợ `0999000032` có 29; 34 báo giá, 13 thanh toán thợ. Tài khoản `0900000004` "Thợ sửa chữa mẫu" có 0 việc. Ảnh hiện trạng ở commit `c0137b7` chụp trước lần khởi động lại nên màn Thợ rỗng. **Chưa GET API thợ** (phải đăng nhập = POST, phiên lập plan không làm).

## Trước khi thi công, kiểm lại với code thật
- `App.tsx` dòng ~523–560 (`hienThiHopDongQuanLy`, `hienThiViecCuaToi`) và ~899–940 (render). `ViecCuaToi` được import (dòng 25) nhưng **không render** — `/viec-cua-toi` dùng `ThoCongViec`.
- `HopDongQuanLy.tsx`: thuộc tính `data-contract-building-select`, `data-contract-expiring-filter`, `data-contract-filter`, `data-contract-list`, `data-contract-row`; đọc `?sapHetHan=true` từ URL.
- `GhiChiSo.tsx`: `inputRefs` + hàm nhảy focus (dòng ~326–334), `inputMode="decimal"` (dòng 686/747/766), `taoCanhBaoTieuThu` (~939), `tinhMucTieuThu` (~912).
- `ThoCongViec.tsx`: tab nhóm `DANG_LAM | CHO_XAC_NHAN | LICH_SU | TAT_CA` (dòng ~290), `tel:` (dòng 467, 603), drawer `task-detail-drawer`.
- `HoaDon.tsx`: `invoice-screen`, `invoice-detail`; bản in A4 (test FR-INV-02 in không xuất PDF).
- `MaQrChuyenKhoanService.kiemTraQuyen` chỉ cho `CHU`/`QUAN_LY` (dòng ~96) — người thuê gọi QR sẽ 403.

## Rủi ro
- `HopDongThaoTac.tsx` 2.745 dòng chứa toàn bộ thao tác (tạo, ký, gia hạn, thanh lý, PDF). Đụng vào là rủi ro lớn → plan này **chỉ thay phần danh sách** trong `HopDongQuanLy`, giữ `HopDongThaoTac` làm khung chi tiết/thao tác.
- `GhiChiSo` có 13 test bám chặt luồng focus và xác nhận cảnh báo; thay bố cục dễ làm mất `ref`. Giữ nguyên state + handler, chỉ thay JSX.
- Ảnh 07 phụ thuộc dữ liệu thợ: volume demo mới tạo sẽ rỗng ở lần khởi động đầu (xem trên) → trước khi chụp phải `docker restart miniapart-prj1demo-backend-1` một lần hoặc chờ backend sửa `@Order`.

## Không làm
- Không viết lại `HopDongThaoTac.tsx`, `ViecCuaToi.tsx` (không được render).
- Không vẽ bàn phím số riêng ở 06: dùng bàn phím hệ thống qua `inputMode="decimal"` (đã có). Hình bàn phím trong `06-ghi-chi-so-mobile.png` là minh hoạ.
- Không làm "Xuất Excel" danh sách hợp đồng, "Gửi nhắc gia hạn" hàng loạt, khối QR/ngân hàng cho người thuê, tên người thuê trên thẻ phòng ở 06 → **phụ thuộc backend** (cuối file).
- Không đổi API, không thêm field.

---

## Task 01-1 — Bảng Hợp đồng (màn 05)  · cỡ M · song song
**File:** `HopDongQuanLy.tsx` (viết lại phần danh sách, ~331 → ~220 dòng), `HopDongQuanLy.test.tsx` (mới), `App.test.tsx` (không đổi nếu giữ data-attr).
**Làm:**
- `TopBar`: tiêu đề "Hợp đồng" + dòng tóm tắt tính từ dữ liệu: "N đang hiệu lực · tổng tiền thuê X ₫/tháng · tiền cọc đang giữ Y ₫" (cộng `giaThue`/`tienCoc` của `HIEU_LUC`), chọn toà (`select` giữ `data-contract-building-select`), **một** nút chính "Tạo hợp đồng" (mở form tạo trong `HopDongThaoTac` như hiện nay).
- `DataTable` (plan 00): cột Phòng · Người thuê (avatar chữ đầu + tên) · Thời hạn (`ngayBatDau – ngayKetThuc` + "còn N ngày"/"bắt đầu sau N ngày"/"đã thanh lý") · Giá thuê · Tiền cọc · Trạng thái (`StatusTag`) · Thao tác. Tìm theo `soPhong + hoTenNguoiThue`. Chip: Tất cả / Hiệu lực / Sắp hết hạn (`sapHetHan`) / Chờ ký / Đã cọc (chỉ hiện khi > 0) / Đã thanh lý, mỗi chip có số (`demTheoChip`). Sắp xếp Phòng (số tự nhiên), Thời hạn, Giá thuê, Tiền cọc. Phân trang 20/trang.
- Hành động hàng: "Gia hạn" khi `sapHetHan`, "Ghi nhận ký" khi `CHO_KY`, còn lại "Xem" → mở `HopDongThaoTac` cho hợp đồng đó (như nút hiện tại).
- Bulkbar: "In PDF" = tải tuần tự `GET /api/hop-dong/{id}/xuat-pdf` cho từng hàng đã chọn (dùng hàm tải file đang có trong `HopDongThaoTac`/`managementApi.downloadManagementFile`), tối đa 10 hàng/lần (`shortcut: tải tuần tự, đổi sang 1 file gộp khi backend có endpoint in nhiều`).
- `?sapHetHan=true` trên URL → chip "Sắp hết hạn" bật sẵn và vẫn hiện chữ `Đang lọc hợp đồng sắp hết hạn`.
- Giữ `data-testid="manager-contract-screen"`, `data-contract-row={id}` trên `<tr>`.
**Anh sẽ thấy (1440, CHU, toà An Nhiên):** bảng 11 hợp đồng giống `05-hop-dong.png`; gõ "dinh" còn 1 dòng; bấm "Sắp hết hạn" còn phòng 303 với nút "Gia hạn"; chọn 1 dòng hiện "Đã chọn 1 hợp đồng · In PDF". 1024: bảng không cuộn ngang trang (cuộn trong khung bảng nếu cần). 390: mỗi hợp đồng là một thẻ.
**Không được xảy ra:** gọi API khác ngoài `/api/hop-dong?toaNhaId=` + `/api/toa-nha` khi mở màn; nút "Tạo hợp đồng" thứ hai; chip đếm sai khi đang tìm (đếm theo danh sách đã qua tìm kiếm).
**Test:** `HopDongQuanLy.test.tsx` mới, 4 test (mock fetch như `App.test.tsx` FR-BLD-06): (1) chip hiện đúng số theo trạng thái; (2) `?sapHetHan=true` chỉ còn hàng sắp hết hạn + chữ `Đang lọc…`; (3) tìm "dinh" ra đúng 1 `data-contract-row`; (4) chọn hàng hiện bulkbar "Đã chọn 1". FR-BLD-06 trong `App.test.tsx` phải xanh không sửa.
**Lệnh:** `npx vitest run src/HopDongQuanLy.test.tsx src/App.test.tsx src/HopDongThaoTac.test.tsx` → tất cả passed; `npm test` ≥ 256 + 4.

## Task 01-2 — Ghi chỉ số điện thoại (màn 06)  · cỡ M · song song
**File:** `GhiChiSo.tsx` (chỉ phần JSX nhánh `mobile`), `GhiChiSo.test.tsx` (+2 test).
**Làm (giữ toàn bộ state/handler hiện có):**
- Đầu màn: "Ghi chỉ số" + "toà · kỳ", thanh tiến độ `.progress` "Đã ghi X/Y công tơ" + "còn …" (từ `tongPhong/daGhi` và danh sách phòng chưa ghi đã có).
- Dải chọn phòng cuộn ngang (chip số phòng, phòng xong có dấu ✓, phòng đang ghi `aria-current`).
- Thẻ phòng: tab Điện/Nước (dịch vụ của phòng), "Chỉ số kỳ trước" (`chiSoDau`), `MeterInput`/ô `.input-meter` số to 48px, `inputMode="decimal"`, nhãn ẩn "Chỉ số điện mới, phòng 303".
- Dòng "Tiêu thụ N kWh · TB 3 kỳ M kWh" (`tinhMucTieuThu` + `trungBinhBaKyTruoc`). Cảnh báo **chỉ khi `taoCanhBaoTieuThu()` trả khác null** → khối amber "Cao gấp 1,7 lần trung bình." + gợi ý chụp ảnh; nút "Chụp ảnh công tơ" (input camera đã có, FR-MTR-06).
- Nút chính duy nhất, rộng 100%, cao 48px, dính đáy trên bottom-nav: "Lưu, sang công tơ nước 303" / "Lưu, sang phòng 401" (tính từ hàm nhảy focus có sẵn).
**Anh sẽ thấy (390, QUAN_LY An Nhiên):** giống `06-ghi-chi-so-mobile.png`, trừ bàn phím (là bàn phím máy) và tên người thuê (chưa có dữ liệu). Nhập số lớn bất thường → hiện cảnh báo đúng con số "gấp X lần" do backend tính hệ số.
**Không được xảy ra:** cảnh báo hiện khi `soKyLichSu < 3` hoặc không có `thongTinCanhBaoTieuThu`; số `1.5` hoặc `1,5` xuất hiện trong `GhiChiSo.tsx`; mất tự nhảy focus (FR-MTR-02).
**Test:** giữ 13 test cũ xanh. Thêm: (1) hệ số backend `nguongCanhBao: "2.00"`, tiêu thụ = 1,8 × TB → **không** cảnh báo (chứng minh không dùng 1,5); (2) nút chính đổi nhãn sang dịch vụ/phòng kế tiếp sau khi lưu. Guard: `grep -nE "1[.,]5\b" src/GhiChiSo.tsx` → không có kết quả.
**Lệnh:** `npx vitest run src/GhiChiSo.test.tsx` → 15 passed.

## Task 01-3 — Công việc của thợ điện thoại (màn 07)  · cỡ M · song song
**File:** `ThoCongViec.tsx` (nhánh `mobile`), `ThoCongViec.test.tsx` (+2), `App.tsx` (chỉ `shortLabel: 'Báo giá'` cho `/tho/chi-phi` khi plan 02 task 02-1 chưa làm — nếu 02-1 làm trước thì bỏ).
**Làm:**
- Đầu màn "Công việc" + "tên thợ · N toà được giao"; hàng 3 số: Đang làm (`kpi.dangXuLy`), Mới giao (đếm `trangThai = DA_PHAN_CONG` trong danh sách), Xong kỳ này (`tyLeHoanThanh.daHoanThanh/tongDuocGiao`). Gọi thêm `fetchThoTongQuan` **một lần** (đã có ở `ThoTongQuan.tsx`) — kiểm lại xem `ThoCongViec` có sẵn KPI không trước khi gọi thêm.
- Segmented 3 nhóm: Đang mở / Chờ xác nhận / Đã xong (map tab cũ `DANG_LAM`, `CHO_XAC_NHAN`, `LICH_SU`; bỏ "Tất cả" trên mobile), có số đếm.
- Thẻ việc: `StatusTag` trạng thái + `maYeuCau · ngày`, tiêu đề `hangMuc — moTa ngắn`, "toà · Phòng · Tầng", ghi chú; nút gọi `tel:` (icon `phone`, ≥ 44px); **một** nút chính 48px rộng theo trạng thái: `DA_PHAN_CONG` → "Nhận việc & khảo sát" (`capNhatKhaoSat`), `DANG_XU_LY` chưa báo giá → "Lập báo giá", đã duyệt → "Báo xong" (`baoXongViecTho`). Chạm thẻ → drawer chi tiết cũ.
- Bottom-nav thợ 4 mục, nhãn "Báo giá".
**Anh sẽ thấy (390, THO 0999000031):** giống `07-tho-cong-viec-mobile.png` với dữ liệu thật (33 yêu cầu); bấm "Báo xong" hiện xác nhận như cũ.
**Không được xảy ra:** nút chính thứ hai trên cùng thẻ; số điện thoại không bấm được; tab cũ trên desktop (≥ 768) thay đổi (test "filters by status group tabs").
**Test:** giữ 3 + 2 test cũ. Thêm: (1) mobile hiện đúng 1 nút chính/ thẻ với nhãn theo trạng thái (3 dòng mock 3 trạng thái); (2) có `a[href^="tel:"]`. `App.tho.test.tsx` vẫn xanh.
**Lệnh:** `npx vitest run src/ThoCongViec.test.tsx src/App.tho.test.tsx` → passed.

## Task 01-4 — Hoá đơn của tôi điện thoại (màn 08)  · cỡ S/M · song song
**File:** `HoaDon.tsx` (nhánh mobile), `LichSuHoaDon.tsx` (khối "Kỳ trước còn nợ" tái dùng), `HoaDon.test.tsx` (+2).
**Làm:**
- Đầu: "Hoá đơn của tôi" + "Phòng · toà"; thẻ tổng: "Kỳ MM/YYYY" + `StatusTag` (Quá hạn/Chưa đến hạn/Đã trả), **"Còn phải trả" số rất to** (`conLai`), dòng "Đã trả `daThu` trên `tongTien` · hạn `hanThanhToan`".
- "Chi tiết khoản": giữ nội dung `cacDong` hiện có (chỉ số đầu → cuối = tiêu thụ × đơn giá, bậc thang, làm tròn âm…) nhưng trình bày theo `.detail-grid`/dòng tiền thẳng cột; "Tổng kỳ này".
- "Kỳ trước còn nợ": 2–3 kỳ gần nhất chưa trả từ `fetchLichSuHoaDonCuaNguoiThue` (đã có) + liên kết "Lịch sử".
- Khối "Thanh toán bằng QR / Chuyển khoản": **không render** cho tới khi backend mở QR cho người thuê (phụ thuộc B2). Không để chỗ trống.
**Anh sẽ thấy (390, NGUOI_THUE 0999100001):** giống `08-hoa-don-khach-mobile.png` **trừ khối QR**; mọi số khớp bản in A4 hiện tại.
**Không được xảy ra:** đổi cách định dạng tiền (test "formats large and negative NUMERIC money strings without floating-point conversion"); gọi `/ma-qr-chuyen-khoan` từ vai trò người thuê.
**Test:** giữ 10 test. Thêm: (1) mobile hiện "Còn phải trả" bằng `conLai`; (2) không có request nào chứa `ma-qr` trong `fetchMock.mock.calls`.
**Lệnh:** `npx vitest run src/HoaDon.test.tsx` → 12 passed.

## Nghiệm thu bằng ảnh (mỗi task)
`jobs-01.json` (đặt ở `evidence/ui-redesign/01/`, không commit mật khẩu):
```json
[
 {"name":"05-1440","path":"/hop-dong?toaNhaId=3","role":"CHU","w":1440,"h":900,"full":true},
 {"name":"05-1024","path":"/hop-dong?toaNhaId=3","role":"CHU","w":1024,"h":768,"full":true},
 {"name":"05-390","path":"/hop-dong?toaNhaId=3","role":"CHU","w":390,"h":844,"full":true},
 {"name":"06-390","path":"/ghi-chi-so?toaNhaId=3","role":"QUAN_LY","w":390,"h":844,"full":true},
 {"name":"06-1024","path":"/ghi-chi-so?toaNhaId=3","role":"QUAN_LY","w":1024,"h":768,"full":true},
 {"name":"07-390","path":"/viec-cua-toi","role":"THO","w":390,"h":844,"full":true},
 {"name":"08-390","path":"/hoa-don-cua-toi","role":"NGUOI_THUE","w":390,"h":844,"full":true}
]
```
`node docs/design/ui-redesign/tools/app-shot.mjs evidence/ui-redesign/01/jobs-01.json evidence/ui-redesign/01` → so từng ảnh với `screens/png/0X-*.png`; `qa.json` đạt tiêu chí chung ở plan 00 (không cuộn ngang, vùng chạm 44/36, tương phản). Màn 06/07/08 chụp thêm 1440 chỉ để chắc không vỡ (desktop vẫn dùng bố cục cũ có token mới).

## Phụ thuộc backend (ghi nhận, KHÔNG làm trong plan này)
| # | Màn | Thiếu gì | Đề xuất |
|---|---|---|---|
| B1 | 07 (demo) | Dữ liệu thợ rỗng ở lần khởi động đầu của volume mới | `PresentationDemoSeeder` thêm `@Order(50)` (chạy trước `ThoBatchDemoSeeder @Order(100)`), hoặc seeder thợ tự chạy lại sau baseline |
| B2 | 08 | QR/thông tin chuyển khoản cho người thuê: `MaQrChuyenKhoanService.kiemTraQuyen` chỉ cho CHU/QUAN_LY | Thêm `GET /api/cong/hoa-don/{hoaDonId}/ma-qr-chuyen-khoan` vào `CongNguoiThueController` (`@RequestMapping("/api/cong")`, đã có `/hoa-don/{hoaDonId}`), kiểm hoá đơn thuộc hợp đồng của chính người thuê như endpoint chi tiết đang làm |
| B3 | 05 | Xuất Excel danh sách hợp đồng: chỉ có `/api/bao-cao/<tong-quan, cong-no, tieu-thu, chi-phi-bao-tri>/xuat-excel` | `GET /api/hop-dong/xuat-excel?toaNhaId=` |
| B4 | 05 | "Gửi nhắc gia hạn" hàng loạt: chưa có API | `POST /api/hop-dong/nhac-gia-han` nhận danh sách id |
| B5 | 06 | Tên người thuê trên thẻ phòng: `ThongTinGhiChiSo.phong[]` không có | Thêm `hoTenNguoiThue` (nullable) vào từng phòng |
