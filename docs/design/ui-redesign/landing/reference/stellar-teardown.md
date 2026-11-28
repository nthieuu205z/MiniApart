# Mổ xẻ tham chiếu: Stellar Management (+ chất ấm Casa Momo)

Nguồn: https://www.stellarmanagement.com/ (Awwwards Honorable Mention, mục Real Estate). Đo ngày 28/11/2026, Chrome 1440×900 và 390×844, chế độ sáng.
Ký hiệu: **[đo]** = đọc từ DOM/CSS/JS; **[nhìn]** = từ ảnh chụp. Ảnh ở `stellar/`.

Chủ tịch đã duyệt: Stellar là tham chiếu chính, lấy thêm chất ấm của Casa Momo; landing **có** khối "Dành cho chủ nhà".

## 1. Khung chung

| Mục | Số đo / quan sát |
|---|---|
| Chiều cao trang | 12.319px ở 1440, 10 dải [đo] |
| Font | `General Sans Variable` 500 cho mọi chữ, chữ nghiêng có chân `Playfair Display Medium Italic` cho 1 từ nhấn trong tiêu đề ("find *home*", "Explore our *backyard*", "Featured *properties*", "Let's *talk*") [đo] |
| Thang chữ | H1 81px / lh 0.9 / tracking −3.24px (−4%); H2 lớn 70px / −3%; H2 vừa 54px / −3%; H3 thẻ 21.6–28.8px; body 16.2px / lh 1.5; nhãn nhỏ 12.6–14.4px. Toàn bộ weight 500 — không dùng bold [đo] |
| Màu | Nền trắng `#fff`, chữ `rgb(24,21,19)` (đen ấm), dải nhấn xanh navy đậm `~#0B1A4F` cho "Key figures" và chân trang, nút chính navy [đo/nhìn] |
| Lề | Lề trái/phải 36px ở 1440 (nội dung chạy sát gần mép, không đóng hộp 1200) [nhìn] |
| Chuyển động | Lenis (cuộn mượt) + GSAP ScrollTrigger + Swiper [đo]. Hero `scroll-locked-fullscreen`: video nền autoplay/muted/loop [đo] |

## 2. Menu trên (header)

- `position: fixed`, cao 63px, nền trong suốt trên hero (chữ trắng), không blur [đo].
- Trái: logo chữ có chân. Phải: `Company ↓ · Capabilities ↓ · Rentals ↓` dàn rộng, **`Portal`** tách riêng sát mép phải, cùng cỡ chữ 14.4px, không phải nút [đo/nhìn].
- Điện thoại: chỉ logo + chữ "Menu" gạch chân [nhìn `m-hero.jpg`].
- Chân trang có 2 nút nhỏ "Broker Login" / "Resident Login" — đăng nhập chỉ xuất hiện ở góc menu và chân trang [nhìn `band12.jpg`].

## 3. Nhịp các dải (1440)

| # | Dải | Top / cao | Bố cục | Ảnh |
|---|---|---|---|---|
| 1 | Hero | 0 / 900 | Ảnh/video đời thường full màn; H1 3 dòng góc trái dưới, 1 dòng phụ; góc phải dưới: thẻ nhỏ "Approach" + nút trắng **Rent now** [nhìn] | `band00.jpg`, `menu-open.jpg` |
| 2 | Tuyên ngôn | 900 / 952 | Câu H2 70px chạy nhiều dòng, **ảnh nhỏ lồng giữa dòng chữ** (inline image) [nhìn] | `band01.jpg` |
| 3 | Khu vực | 1852 / 720 | 2 cột: trái tiêu đề + danh sách khu vực dạng hàng kẻ mảnh có mũi tên → + đoạn ngắn + nút viền "View all"; phải ảnh dọc lớn [nhìn] | `band02.jpg` |
| 4 | Số liệu | 2707 / 1356 | Nền navy, nhãn IN HOA nhỏ, H2 giữa, 3 số lớn (font mảnh, ~80px) chia cột bằng đường kẻ 1px [nhìn] | `band03.jpg` |
| 5 | Toà nổi bật | 4063 / 2340 | Ảnh toà full màn làm nền, thẻ trắng ở giữa (tiêu đề + ảnh + tên + mô tả + `02/03`), slider [nhìn] | `band05.jpg` |
| 6 | Về con người | 6628 / 1478 | Câu lớn + ảnh người thật full bề ngang | — |
| 7 | Năng lực | 8331 / 678 | Danh sách dịch vụ | — |
| 8 | Tin | 9234 / 1054 | 3 thẻ tin | — |
| 9 | CTA | 10513 / 900 | Tiêu đề giữa "Let's *talk* Real Estate" + 1 dòng + nút navy, 2 bên là ảnh toà [nhìn] | `band12.jpg` |
| 10 | Chân trang | navy | Cột thông tin + 4 cột link + nút đăng nhập nhỏ | `band12.jpg` |

Trang Rentals/Neighborhoods: tiêu đề "Find *your* place" bên trái, bản đồ nét mảnh với ghim khu vực bên phải [nhìn `rentals.jpg`].

## 4. Casa Momo (chỉ lấy chất ấm)
Căn hộ boutique: tông kem/đất ấm, ảnh nội thất ánh sáng tự nhiên, chữ có chân lớn, nút "Book Your Stay" [nhìn `casamomo.jpg`]. Lấy: ảnh phòng thật ánh sáng ấm, nhịp thoáng, cảm giác "ở được". Không lấy: font, màu thương hiệu.

## 5. Lấy gì → áp vào đâu

| Lấy | Áp vào |
|---|---|
| Menu trên cố định, link nội dung bên trái/giữa, "Cổng cư dân" là link chữ nhỏ ở mép phải (không phải nút to) | Landing `/`, Tìm phòng `/tim-phong`, Chi tiết phòng |
| 1 font sans weight 500 + 1 font nghiêng có chân cho **1 từ nhấn** mỗi tiêu đề | Landing (và tiêu đề trang Tìm phòng) |
| Hero ảnh đời thường full màn, H1 góc trái dưới, 1 CTA "Tìm phòng" | Landing |
| Danh sách khu vực/toà dạng hàng kẻ + mũi tên, ảnh dọc bên cạnh | Landing (toà của mình) |
| Dải số liệu nền đậm, số lớn chia cột kẻ mảnh | Landing — **chỉ số thật từ API** (số toà, phòng trống) |
| Thẻ trắng nổi trên ảnh nền cho "phòng nổi bật" | Landing |
| CTA cuối giữa trang + chân trang nhiều cột, đăng nhập nhỏ ở chân | Landing |

**Thêm (tham chiếu không có):** khối "Dành cho chủ nhà" (mời chủ nhà dùng hệ thống quản lý: hoá đơn tự động, thu tiền, sự cố), quy trình thuê 3 bước (Tìm → Xem phòng → Ký & vào ở), "giá rõ từng khoản điện nước" (dữ liệu `danhSachDichVu` có thật).

**Không lấy:** font General Sans/Playfair nguyên bản (chọn font có subset tiếng Việt), màu navy thương hiệu, logo, câu chữ, ảnh/video của họ (bản quyền), số liệu marketing không có dữ liệu ("40+ năm"), tin tức, video nền nặng (dùng ảnh tĩnh; chuyển động nhẹ, tôn trọng `prefers-reduced-motion`), scroll-lock hero.

**Lưu ý tiếng Việt:** lh 0.9 và tracking −4% làm chồng dấu (Ề, Ữ) → tiêu đề lh ≥ 1.0–1.05, tracking ≤ −2%; font nghiêng phải có subset `vietnamese`.
