# 01 — Phân tích hiện trạng và mẫu tham chiếu

Đầu vào: 12 ảnh chụp app hiện tại (dữ liệu thật, 1440px) ở `docs/ui-audit-2026-11-20/`, code `frontend/src/tokens/*.css`, `frontend/src/design/**`, `roleNavigation.ts`; mẫu Figma Community "Full Dashboard with Widgets, Sidebar, Charts, Graphs" (Giliard Gomes, CC BY 4.0) — chỉ có ảnh cover `reference/figma-ref-dashboard-cover.png` vì file gốc cần đăng nhập.

## 1. Vấn đề → nguyên nhân → cách sửa

| # | Vấn đề nhìn thấy (ảnh) | Nguyên nhân trong code | Cách sửa trong bộ mới |
|---|---|---|---|
| 1 | Chữ **mono IN HOA giãn cách** ở nhãn, số, trạng thái, mã hoá đơn, giờ hẹn, SĐT; trộn với chữ thường nên trông như bảng điều khiển kỹ thuật (mọi ảnh, rõ nhất Lịch hẹn, Báo cáo, Hoá đơn) | `--ma-font-mono: "IBM Plex Mono"` được dùng trong `--ma-text-figure*`, `--ma-text-room-no`, `--ma-text-syslabel`; `--ma-tracking-syslabel` + `text-transform: uppercase` | Một font Archivo; `--ma-font-mono` trỏ về Archivo; số dùng `tabular-nums`; nhãn chữ thường 13px; bỏ IN HOA |
| 2 | **Chữ Việt lệch nét**: ă ơ ư đ ₫ và dấu nặng khác font với phần còn lại | Bộ `archivo-*.woff2` trong repo thiếu glyph tiếng Việt (đo bằng canvas: 27 ký tự rơi về font hệ thống) | Đóng gói lại Archivo 400–700 tách subset `latin` + `vietnamese` (@fontsource 5.2.5), có giấy phép OFL + SHA256 |
| 3 | **Ký hiệu ₫ rớt xuống dòng riêng** dưới số KPI (Báo cáo: "13.567.000 / ₫") | Ô KPI hẹp + số mono rộng + không `white-space: nowrap` cho cặp số–đơn vị | `.kpi-value` số + `.unit` cùng dòng, số Archivo tỷ lệ (không mono) hẹp hơn; thẻ KPI rộng 4/12 cột |
| 4 | **Hàng KPI lẻ 5 + 1** (thẻ "Sự cố đang mở" rơi xuống hàng 2) ở Tổng quan/Báo cáo Chủ | Lưới `auto-fill` theo bề rộng tối thiểu, không theo 12 cột | Dashboard theo lưới 12 cột: 3 thẻ KPI lớn (Thực thu · Công nợ · Lấp đầy) + 3 thẻ nhỏ; số liệu phụ vào thẻ nhỏ |
| 5 | **Hộp viền lồng hộp cùng độ nổi** (Sự cố: form "Gửi yêu cầu sửa chữa" là hộp viền trong hộp viền; Hoá đơn: khối lọc trong khung viền) | `--ma-shadow` + `border` trên cả khung trang và khối con; `--ma-shadow-frame` | Thẻ trắng không viền/không bóng trên nền kem; khối con dùng nền sunken (`--ma-bg-sunken`), không viền |
| 6 | **Icon menu sai nghĩa và trùng nhau** (nhiều mục cùng một ô vuông rỗng: Người thuê, Dịch vụ và kỳ, Cư trú, Lịch hẹn…) | `GlyphName` thiếu icon, mục thiếu thì rơi về glyph mặc định | Bộ 70 icon tự vẽ cùng nét; mỗi mục menu một icon riêng (`assets/shell.js` + `assets/icons.svg`) |
| 7 | **Emoji làm icon** (💡 trước dòng gợi ý ở Hoá đơn) | Chuỗi trong component | Banner `info` với icon SVG + chữ |
| 8 | **Hợp đồng là các thẻ viền dày cao ~100px**, không bảng, không lọc, không sắp xếp | `HopDongQuanLy` render danh sách thẻ | Màn 05: bảng có tìm, chip lọc kèm số đếm, sort, chọn hàng + hành động hàng loạt, phân trang; một nút chính "Tạo hợp đồng" |
| 9 | **Nhiều nút ngang hàng không có nút chính**; nút tắt nhạt không rõ lý do (Hoá đơn: 2 nút tắt "Tạo hoá đơn nháp…", "Phát hành…") | Không quy ước một hành động chính; `disabled` thay cho giải thích | Mỗi màn một nút teal; nút tắt dùng `aria-disabled` + lý do ngay cạnh; hành động phụ vào menu "…" |
| 10 | **Nút chính navy full-width** chiếm cả bề rộng form desktop (Sự cố) | `--ma-brand-primary: #0F172A` + `width:100%` | Brand teal `#0F766E`; nút theo nội dung trên desktop, full-width chỉ trên mobile |
| 11 | **Màn Thợ gần như rỗng và dùng sidebar desktop** trên điện thoại | Shell chung cho mọi vai trò | Màn 07: không sidebar, bottom-nav 4 mục có số việc, thẻ việc có nút chính 48px, gọi điện 1 chạm |
| 12 | **Ghi chỉ số: nhãn "Phòng 101" quá to, viền đen đè ô nhập, nhãn lặp** | `--ma-text-room-no` mono + viền `--ma-ink-*` đậm cho ô nhập | Màn 06: ô số 40px trong khung 72px viền 3,51:1, bàn phím số riêng, dải chip phòng, tiêu thụ hiện tức thì, cảnh báo ≥ 1,5 × TB 3 kỳ, tự nhảy công tơ/phòng kế |
| 13 | **Trạng thái chỉ bằng màu / chấm đỏ** (Lịch hẹn: "● CHỜ XÁC NHẬN" mono đỏ nhỏ) | StatusTag không bắt buộc icon | `.tag-*` luôn icon + chữ thường; đủ 6 biến thể đo ≥ 4,5:1 |
| 14 | **Biểu đồ gần như rỗng** (Báo cáo: 3 vạch mảnh trên một dòng 11/2026) | Biểu đồ thanh ngang 1 kỳ, không trục | Biểu đồ vùng nhiều kỳ có trục, chú thích, nhãn kỳ đang mở; thanh ngang có số in kèm |
| 15 | Nền xám xanh lạnh `#F8FAFC` + navy → cảm giác phần mềm nội bộ | `--ma-bg-page`, `--ma-brand-primary` | Nền kem ấm `#F4F2EE` (theo mẫu), teal giữ nhận diện, amber tiết chế cho dữ liệu cần chú ý |
| 16 | Control nhỏ so với ngón tay khi dùng điện thoại (chip, nút lọc trạng thái nhỏ ở Lịch hẹn) | Không có thang cỡ điều khiển theo thiết bị | Token MỚI `--ma-control-h` 40 / `-sm` 36 / `-touch` 48; QA đo 0 control < 44px ở 390 |

## 2. Mẫu Figma: lấy gì / bỏ gì

**Lấy**
- Nền ngoài màu kem, sidebar là một thẻ trắng nổi (bo lớn, cách mép 16px), các widget là thẻ trắng bo ~24px, tách nhau bằng khe 16px — không viền.
- KPI số rất to, nhãn nhỏ phía trên, mô tả ngắn phía dưới, liên kết "xem thêm" ở chân thẻ.
- Gauge nửa vòng cho tỷ lệ (dùng cho **Tỷ lệ lấp đầy**), biểu đồ vùng có tô nhạt (dùng cho **Doanh thu theo tháng**), danh sách có avatar tròn chữ cái (dùng cho **Nợ quá hạn nhiều nhất**), thẻ nhỏ "top" (Toà thu nhiều nhất, Hợp đồng sắp hết, Sự cố đang mở), thanh ngang (Tiêu thụ điện theo toà, Công nợ theo toà).
- Ô tìm kiếm dạng pill trên topbar, chuông có chấm số.

**Bỏ / đổi**
- Gradient nhiều màu trên thanh biểu đồ → màu phẳng teal/amber/stone, số in kèm.
- Tông cam/đỏ làm màu chủ đạo → teal (nhận diện MiniApart), amber chỉ để nhấn.
- Font display/hình minh hoạ trang trí, avatar ảnh người → avatar chữ cái (dữ liệu demo không có ảnh).
- Nội dung tiếng Anh, số giả → tiếng Việt và số thật lấy từ demo (`/api/dashboard/chu`, `/api/bao-cao/cong-no`, `/api/bao-cao/tieu-thu`…).
- Mẫu chỉ có dashboard: các màn bảng, form, mobile tự thiết kế theo cùng token.

## 3. Đề xuất của `ui-ux-pro-max` (search.py) — giữ gì, bỏ gì

Lệnh: `search.py "property management dashboard apartment rental" --design-system -p MiniApart --variance 5 --motion 3 --density 7`.

| Đề xuất | Quyết định | Lý do |
|---|---|---|
| Primary `#0F766E`, ring `#0F766E` | **Giữ** | Trùng nhận diện teal hiện có; chữ trắng 5,47:1 |
| Secondary `#14B8A6` | Bỏ | Chữ trắng trên nền này chỉ 2,49:1 (đo); dùng `#0D9488` cho đồ hoạ (3,74:1) |
| Accent `#0369A1` (xanh dương) | Bỏ | Thêm một màu thương hiệu thứ hai gây loạn; xanh dương chỉ còn cho trạng thái "thông tin" |
| Nền `#F0FDFA`, viền `#99F6E4`, chữ `#134E4A` | Bỏ | Cả trang ngả xanh ngọc, viền nhạt dưới 3:1; chọn nền kem trung tính theo mẫu |
| Font **Cinzel + Josefin Sans** | **Bỏ** | Serif display trang trọng kiểu bất động sản xa xỉ, không hợp phần mềm vận hành dày số; Cinzel không có chữ thường; cần đủ dấu tiếng Việt → Archivo |
| Style **Glassmorphism** (blur 10–20px) | **Bỏ** | Brief cấm kính mờ thừa; giảm tương phản chữ; token `--ma-backdrop-blur*` = 0 |
| Pattern "Hero-centric" | Chỉ dùng cho trang công khai Tìm phòng (02) | App vận hành không cần hero |
| Motion scroll-reveal GSAP 300–400ms | Bỏ | Không thêm thư viện; dashboard không cần hiện dần; motion chỉ cho phản hồi thao tác ≤ 220ms |
| Checklist (không emoji, focus thấy rõ, reduced-motion, 4,5:1, responsive 375–1440) | **Giữ** | Thành tiêu chí QA (`QA.md`) |

Kết quả cũ `design-system/miniapart/MASTER.md` (ngày 16/11, cùng công cụ, Cinzel + Josefin Sans) không dùng vì cùng lý do trên.

## 4. Kỷ luật token học từ các hệ thật (skill `popular-web-designs`)

Đọc `templates/linear.app.md` và `templates/stripe.md` để lấy cách làm, không lấy diện mạo (Linear là nền tối, Stripe dùng sohne-var 300 — đều không hợp):
- **Linear:** gần như vô sắc, phân cấp bằng 3 mức mực (chính / phụ / tertiary cho meta, placeholder) và **một màu nhấn dùng tiết chế** chỉ cho CTA, trạng thái đang chọn → MiniApart: 3 mức mực `--ma-text-primary/secondary/muted`, teal là màu nhấn duy nhất của thương hiệu.
- **Stripe:** số tài chính dùng **tabular numerals** (`tnum`) → `tabular-nums` cho toàn bộ số; **bóng nhuộm theo màu thương hiệu** → bóng nhuộm theo mực ấm `rgba(28,27,25,…)` thay vì đen/xám xanh, và chỉ dùng cho lớp nổi (không lấy bóng nhiều lớp của Stripe cho thẻ).
- Chung: tên token theo **vai trò**, không theo màu; trạng thái là **cặp chữ/nền đã đo tương phản**.

## 5. Ánh xạ vào MiniApart

| Thành phần mẫu | Trong MiniApart | Màn |
|---|---|---|
| Sidebar thẻ trắng + nhóm | Menu theo vai trò từ `roleNavigation.ts`, gom nhóm, badge số (Sự cố 12, Nhắc việc 4) | 03, 04, 05, 09 |
| 3 KPI lớn + gauge | Thực thu 376.130.000 ₫ · Công nợ 173.450.000 ₫ · Lấp đầy 75 % (27/36 phòng) | 03 |
| Biểu đồ vùng | Thực thu theo tháng 06–11/2026, đường "Phát hành" so sánh, kỳ 11 đang mở nét đứt | 03 |
| Danh sách avatar | Nợ quá hạn nhiều nhất (top 5 người thuê, số ngày trễ) | 03 |
| Thẻ nhỏ top | Toà thu nhiều nhất · Hợp đồng sắp hết · Sự cố đang mở | 03 |
| Thanh ngang | Tiêu thụ điện theo toà (kWh) · Công nợ theo toà | 03 |
| Danh sách việc | Nhắc việc quản lý (nợ quá hạn, PCCC, hợp đồng sắp hết, thiếu chỉ số, sự cố tồn) | 04 |

Số liệu trên lấy bằng GET từ stack demo `http://localhost:5190` (chỉ `POST /api/auth/login` để lấy token), ngày 21/11/2026.
