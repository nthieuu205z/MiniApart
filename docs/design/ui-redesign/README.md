# Thiết kế lại giao diện MiniApart — bộ design tổng quan (chờ Chủ tịch duyệt)

Bản tổng quan để duyệt bằng mắt **trước** khi làm hết các màn và trước khi đụng vào app. Chưa sửa gì trong `frontend/`. Mọi số liệu trên màn là dữ liệu demo thật (lấy chỉ đọc từ `http://localhost:5190` ngày 21/11/2026).

## Tóm tắt một trang

**Hướng chọn (một hướng):** bám tinh thần mẫu Figma Chủ tịch chỉ định — nền kem ấm, sidebar và các thẻ trắng bo 24px tách nhau bằng khoảng trắng, KPI số to, gauge, biểu đồ vùng, danh sách có avatar — nhưng là sản phẩm MiniApart: teal làm thương hiệu, amber chỉ để nhấn số liệu cần chú ý, một font Archivo đủ dấu tiếng Việt, số tiền thẳng cột `1.888.000 ₫`.

**5 quyết định lớn**
1. **Bỏ hẳn chữ mono và chữ IN HOA giãn cách**; một font Archivo, số dùng chữ số đều cột. Thay bộ font trong repo vì bộ hiện tại **thiếu glyph tiếng Việt** (ă ơ ư đ ₫ rơi về font hệ thống).
2. **Thẻ phẳng trên nền kem**: không viền, không bóng, không hộp lồng hộp; bóng chỉ cho menu/toast/modal.
3. **Nút chính đổi từ navy sang teal `#0F766E`**, mỗi màn đúng một nút chính; trạng thái luôn có icon + chữ.
4. **Danh sách nghiệp vụ thành bảng** (Hợp đồng, Tài khoản…): tìm, chip lọc có số đếm, sắp xếp, chọn hàng + hành động hàng loạt, phân trang.
5. **Điện thoại là màn riêng cho Thợ, Khách thuê, Ghi chỉ số**: không sidebar, bottom-nav ≤ 5 mục, nút chính 48px, ô số to + bàn phím số, tự nhảy phòng kế, cảnh báo tiêu thụ bất thường.

Kỹ thuật: token viết dưới dạng **overlay giữ đúng tên `--ma-*` của app** (phủ 182/182 token cũ, thêm 22 token đánh dấu MỚI) — khi duyệt chỉ cần thêm một file. Đã thử overlay trên bản chép của `frontend/`: 252/252 test qua, build qua.

## Mở xem thế nào

Mở thẳng bằng trình duyệt (không cần server, không cần mạng):

- `design-system.html` — toàn bộ token + component, bấm được (chip, tab, sắp xếp bảng…), đủ trạng thái.
- `screens/01-dang-nhap.html` … `screens/09-tai-khoan-qtht.html` — 9 màn khung. Màn 06/07/08 là điện thoại: mở DevTools → chế độ thiết bị 390×844 cho đúng.
- Ảnh chụp sẵn: `screens/png/*.png` (desktop 1440, điện thoại 390, chụp cả trang).
- Figma: `figma/*.svg` kéo thả vào Figma, hướng dẫn ở `figma/IMPORT.md`; file Figma đích ở `FIGMA.md`.

| # | Màn | Vai trò | Khung |
|---|---|---|---|
| 01 | Đăng nhập | mọi vai trò | 1440 |
| 02 | Tìm phòng (công khai): hero + bộ lọc + lưới phòng | khách vãng lai | 1440 |
| 03 | Tổng quan Chủ nhà (bám bố cục mẫu Figma) | Chủ sở hữu | 1440 |
| 04 | Nhắc việc | Quản lý | 1440 |
| 05 | Hợp đồng dạng bảng | Chủ / Quản lý | 1440 |
| 06 | Ghi chỉ số | Quản lý | 390 |
| 07 | Công việc của thợ | Thợ | 390 |
| 08 | Hoá đơn của tôi (chi tiết khoản + QR) | Khách thuê | 390 |
| 09 | Tài khoản (menu thao tác đang mở) | QTHT | 1440 |

## Mục lục

| File | Nội dung |
|---|---|
| `01-phan-tich.md` | Bảng 16 vấn đề → nguyên nhân trong code → cách sửa; mẫu Figma lấy gì/bỏ gì; đề xuất của công cụ `ui-ux-pro-max` giữ/bỏ |
| `02-he-thong-thiet-ke.md` | Màu (có tương phản đo), chữ, spacing, bo góc, độ nổi, focus, chuyển động, lưới, breakpoint, component; **bảng ánh xạ 204 token** sang `--ma-*` |
| `design-system.html` | Trang xem thử hệ thiết kế |
| `screens/` | 9 màn khung HTML + PNG |
| `screen-inventory.md` | Toàn bộ 44 mục màn theo 5 vai trò → mẫu bố cục → màn khung đại diện |
| `figma/` | 10 SVG figma-ready (chữ là text) + `IMPORT.md` |
| `QA.md` | Số đo: tương phản, vùng chạm, cuộn ngang ở 390, focus, reduced-motion, SVG, guard repo, bảng slop |
| `assets/` | `tokens.css`, `components.css`, `icons.svg` (+ `icons.js`), `shell.js`, `fonts/` (woff2 + giấy phép OFL + SHA256), `img/` (ảnh phòng demo) |
| `tools/` | Công cụ chụp/đo/xuất SVG, chạy guard repo, sinh QA.md (xem đầu mỗi file) |

## Câu hỏi cần Chủ tịch chốt

1. **Nút chính teal thay navy?** Đề xuất: **đồng ý** — teal là màu nhận diện sẵn có, chữ trắng 5,47:1; navy hiện tại làm app trông như phần mềm nội bộ.
2. **Nền kem ấm `#F4F2EE` thay xám xanh `#F8FAFC`?** Đề xuất: **đồng ý** (theo mẫu Figma). Nếu Chủ tịch muốn lạnh hơn, chỉ đổi 3 token nền, không đụng bố cục.
3. **Bỏ hoàn toàn chữ mono (IBM Plex Mono)**, kể cả mã hoá đơn/mã yêu cầu? Đề xuất: **bỏ**; mã vẫn dễ đọc nhờ chữ số đều cột.
4. **Thay bộ font Archivo trong repo bằng bản có subset tiếng Việt** (@fontsource 5.2.5, cùng giấy phép OFL)? Đề xuất: **đồng ý** — đây là lỗi hiển thị thật, nên sửa ngay cả khi chưa áp phần còn lại.
5. **Màu amber cho số liệu cần chú ý** (công nợ theo toà, giá trị tiêu thụ, "còn 11 ngày") — giữ hay chỉ dùng đỏ/teal? Đề xuất: **giữ, tiết chế** — đỏ dành cho lỗi/quá hạn, amber cho "cần để ý".
6. **Ngưỡng cảnh báo tiêu thụ bất thường** ở màn Ghi chỉ số đang vẽ là **≥ 1,5 × trung bình 3 kỳ** (giả định của bản thiết kế). Đề xuất: Chủ tịch chốt con số, hoặc dùng đúng ngưỡng backend đang tính trong `thongTinCanhBaoTieuThu`.
7. **Tổng quan Chủ nhà không có nút chính** (màn chỉ đọc, mọi hành động là liên kết "Xem công nợ", "Tất cả 60 hoá đơn quá hạn"…). Đề xuất: **giữ như vậy**; nếu cần, thêm nút "Gửi nhắc nợ" làm hành động chính.
8. **Sidebar gom nhóm** (Chủ: Vận hành / Tiền / Theo dõi; Quản lý: Hằng ngày / Tiền / Toà nhà / Theo dõi) — giữ nguyên đường dẫn và nhãn hiện có. Đề xuất: **đồng ý**.
9. **Bottom-nav Thợ rút nhãn "Báo giá & thanh toán" → "Báo giá"** để vừa ô 1/4 màn hình. Đề xuất: **đồng ý** (tiêu đề trang vẫn ghi đầy đủ).
10. **Biến thể tông màu cho dashboard**: brief cho phép kèm một biến thể nhỏ — bản này **không làm** để tập trung một hướng. Có cần không?
11. **Thứ tự làm sau khi duyệt**: đề xuất (a) áp overlay token + font mới (nhanh, ít rủi ro), (b) làm lại bảng Hợp đồng và 3 màn điện thoại, (c) dashboard Chủ/Quản lý, (d) các màn còn lại theo `screen-inventory.md`.

## Giới hạn đã biết

- Chưa import thật vào Figma (không có đăng nhập Figma trong phiên này); SVG đã kiểm bằng render trình duyệt, lệch 0,42–2,05 % pixel.
- Chưa thử trên điện thoại thật; khung 1024–1279 (sidebar thu gọn) mới có CSS + mẫu trong `design-system.html`, chưa có ảnh màn khung.
- Ảnh phòng lấy từ `frontend/public/rooms/` (ảnh demo của repo).
