# QA · UX v2 bản xem trước (22/11/2026)

Mọi số dưới đây là kết quả chạy thật trên `prototype/index.html` (file://, không mạng). Chạy lại từ thư mục `docs/design/ui-redesign/ux-v2`:

```
node tools/shoot.mjs tools/jobs.json > tools/shoot-result.json   # chụp PNG + xuất SVG + ../../tools/qa-probe.js
node tools/text-floor.mjs                                        # chữ ≥ 13px mọi khung (qa-probe chỉ đòi 12px ở desktop)
node tools/interact-check.mjs                                    # 11 kiểm tương tác
node tools/svg-render.mjs <tmp> && python tools/compare.py --svg <tmp>   # độ trung thực SVG
python tools/compare.py                                          # ảnh trước/sau → compare/
```

## 1. Ngưỡng và kết quả tổng

| Tiêu chí (Brief §F) | Ngưỡng | Kết quả |
|---|---|---|
| Không cuộn ngang | `horizontalOverflow = 0` | **24/24** màn đạt |
| Vùng chạm | ≥ 44px ở 390, ≥ 36px ở desktop | **0** điều khiển dưới ngưỡng (đã đo 730 điều khiển) |
| Tương phản chữ | ≥ 4,5:1 (chữ lớn ≥ 3:1) | **0** nút chữ dưới ngưỡng; thấp nhất **4,98:1** (`05`) |
| Cỡ chữ | ≥ 13px | **0** nút chữ < 13px (`text-floor.mjs`, 24/24 màn) |
| Tên truy cập | mọi điều khiển có tên | **0** thiếu |
| Font | chỉ Archivo | 24/24 chỉ dùng `Archivo` |
| Lỗi console | 0 | **0** |
| Nút chính mỗi màn | ≤ 1 | Tối đa **1** trên mọi màn (Brief §G: không có nhiều nút chính ngang hàng) |
| Ảnh thiếu alt | 0 | 0 |
| Vòng focus | thấy rõ | `solid 2px rgb(15,118,110)` |
| Guard token `frontend` | xanh | Không đụng token. Vẫn chạy `cd frontend && npx vitest run src/designTokens.test.ts`: **1 file, 6/6 test đạt** |

Lượt QA trước từng bắt được các lỗi sau, đều đã sửa và đo lại:
- Ở 390: ô tìm kiếm, nút phân đoạn, ô người trong bảng, nút mở rộng và mục nav chỉ cao 36–40px.
- Nút menu điện thoại không bao giờ hiện, vì `components.css` khai báo `.m-only{display:none!important}` nằm sau media query. Đã ghi đè trong `ux.css`.
- Bộ đếm trên nav có chữ 12px; phím tắt `Ctrl K` cũng 12px.

## 2. Từng màn (`tools/shoot-result.json`)

| Màn | Khung | Cao trang | Cuộn ngang | Điều khiển | Dưới ngưỡng chạm | Tương phản thấp nhất | Nút chính |
|---|---|---|---|---|---|---|---|
| 01 Chủ · Hôm nay | 1440 | 1.397 | 0 | 37 | 0 | 5,28 | 0 |
| 02 Tìm nhanh Ctrl+K | 1440 | 1.397 | 0 | 52 | 0 | 5,02 | 0 |
| 03 Chọn toà | 1440 | 1.397 | 0 | 41 | 0 | 5,28 | 0 |
| 04 Thu tiền · Cần thu | 1440 | 1.184 | 0 | 57 | 0 | 5,28 | 1 |
| 05 Thu tiền · đang chọn 2 | 1440 | 1.000 | 0 | 55 | 0 | 4,98 | 1 |
| 06 Người thuê 360° | 1440 | 1.537 | 0 | 32 | 0 | 5,14 | 1 |
| 07 Phòng 360° (đang thuê) | 1440 | 1.089 | 0 | 24 | 0 | 5,14 | 0 |
| 08 Hợp đồng 360° (hiệu lực) | 1440 | 1.026 | 0 | 20 | 0 | 5,14 | 0 |
| 09 Toà 360° | 1440 | 909 | 0 | 39 | 0 | 5,14 | 1 |
| 10 Quản lý · Hôm nay | 1440 | 900 | 0 | 25 | 0 | 5,28 | 1 |
| 11 Thông báo (popover) | 1440 | 900 | 0 | 31 | 0 | 5,28 | 1 |
| 12 Chu kỳ tháng | 1440 | 1.030 | 0 | 20 | 0 | 5,28 | 1 |
| 13 Sự cố + ngăn | 1440 | 907 | 0 | 33 | 0 | 5,24 | 1 |
| 14 Tạo hợp đồng 2/5 | 1440 | 900 | 0 | 29 | 0 | 5,14 | 1 |
| 15 Không có quyền | 1440 | 900 | 0 | 17 | 0 | 5,28 | 1 |
| 16 Trạng thái rỗng/lỗi | 1440 | 900 | 0 | 17 | 0 | 5,28 | 0 |
| 20 Thợ · Việc | 390 | 1.186 | 0 | 15 | 0 | 5,14 | 1 |
| 21 Khách · Cần trả | 390 | 1.208 | 0 | 11 | 0 | 5,14 | 1 |
| 22 Khách · Trả tiền 2/3 | 390 | 844 | 0 | 6 | 0 | 5,14 | 1 |
| 23 Ghi chỉ số | 390 | 844 | 0 | 4 | 0 | 5,14 | 1 |
| 24 Chủ · Hôm nay | 390 | 2.477 | 0 | 25 | 0 | 5,47 | 0 |
| 25 Chủ · Thu tiền | 390 | 1.491 | 0 | 45 | 0 | 5,28 | 1 |
| 26 Chủ · menu ngăn | 390 | 2.477 | 0 | 38 | 0 | 5,47 | 0 |
| 27 Chủ · Thu tiền | 1180 | 1.184 | 0 | 57 | 0 | 5,28 | 1 |

So với app thật (`evidence-app/probe-*.json`):

| Màn | App thật | Bản mới |
|---|---|---|
| Ghi chỉ số (1440) | 11.151px, 18 nút chính | Chu kỳ tháng 1.030px, 1 nút chính |
| Sự cố (1440) | 1.548px (ảnh dot-03: 3.168px), 3 ô chọn, bảng yêu cầu + Lịch sử sửa chữa | 907px, 1 danh sách + ngăn |
| Công nợ | 4.134px | Thu tiền 1.184px |
| Công việc của thợ (390) | 4.135px, 0 nút chính | 1.186px, 1 nút chính |

## 3. Tương tác (`tools/interact-check.mjs`): 11/11 đạt
1. Route cũ `/hoa-don` chuyển tới Thu tiền › tab Hoá đơn.
2. Route cũ `/ghi-chi-so` chuyển tới Chu kỳ tháng.
3. Ctrl+K mở bảng lệnh.
4. Gõ không dấu "quang huy" ra Nguyễn Quang Huy.
5. Esc đóng bảng lệnh.
6. Chọn toà Mộc Lan thì tên toà hiện ở khung.
7. Toà đã chọn được nhớ khi sang Thu tiền: chỉ còn 5 người của Mộc Lan.
8. Bấm menu Sự cố thì đổi màn.
9. Bấm hàng người nợ thì mở hồ sơ 360°.
10. Đổi vai trò sang Thợ thì ra màn điện thoại.
11. Chủ mở `/phong` (route của Quản lý) thì ra trang "Không có quyền".

## 4. Độ trung thực SVG
20 SVG, 0 `<foreignObject>`, 0 ảnh raster. Pixel lệch so với PNG là **0,26–1,88 %**; bảng chi tiết ở `figma/IMPORT.md`.

## 5. Tự soát ảnh (Brief §G) và bảng slop
Các ảnh đã được mở và xem bằng công cụ xem ảnh qua 4 lượt. Lỗi thấy được và đã sửa:
- Tên toà và dòng phụ dính một dòng.
- Bộ lọc sự cố mặc định "Cần phân công" làm danh sách gần rỗng; đổi sang "Đang mở".
- Thẻ việc của thợ có 3 nút chính ngang hàng; giờ chỉ thẻ đầu dùng nút chính.
- `<a><button>` lồng nhau ở bộ lọc thợ.
- Phòng đang thuê vẫn có nút "Tạo hợp đồng".
- Hợp đồng hiệu lực lấy "Thanh lý" làm nút chính.
- Toà 360° có khoảng trống lớn; đã thêm khối "Cần chú ý ở toà này".
- Thẻ trạng thái bị chen trên điện thoại.
- Câu tả trong ảnh so sánh mobile bị cắt.
- Thiếu lối vào menu trên điện thoại.

Bảng slop trên ảnh cuối (`01, 04, 06, 08, 10, 12, 13, 14, 20, 21`):

| Mục | Kết quả |
|---|---|
| Thẻ rỗng | Không có. Các khối đều có dữ liệu thật; trạng thái rỗng chỉ có ở `16` và có hành động kế tiếp |
| Hộp lồng hộp | Không có. Khối trong thẻ dùng đường kẻ/hàng, không bọc thêm thẻ. Ngoại lệ có chủ ý: callout cảnh báo trong `12` |
| Nhiều nút chính ngang hàng | Không có (đo được tối đa 1 trên mỗi màn) |
| Chữ mono | Không có (chỉ Archivo) |
| IN HOA giãn chữ | Không có. Tiêu đề cột và nhóm nav viết thường kiểu câu |
| Chữ lặp nhãn | Đã bỏ breadcrumb lặp tiêu đề và thanh "Không gian quản lý" |
| Số liệu bịa | Không có. Số lấy từ GET 5190; chỗ cần API chưa có được ghi rõ ("chờ API B2", "cần API nhắc nợ") |

## 6. Điều chưa kiểm
- Chưa thử bằng trình đọc màn hình thật; mới kiểm tên truy cập và `aria-*`.
- Chưa kiểm điều hướng bàn phím ngoài Ctrl+K/Esc.
- Chưa import SVG vào Figma.
- Bản xem trước chỉ vẽ màn đại diện. Các mục còn lại (Lịch hẹn, An toàn, Báo cáo, danh sách Người thuê/Hợp đồng…) là trang giữ chỗ, ghi rõ nội dung nào được giữ.
- Dữ liệu là ảnh chụp GET ngày 22/11/2026, sinh tĩnh bằng `tools/gen-data.py`. Bản xem trước không tự cập nhật theo app.
