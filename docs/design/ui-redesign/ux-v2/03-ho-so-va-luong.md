# 03 · Hồ sơ 360° và luồng nhiều bước (Brief §C, §D)

Mọi số và tên trong màn khung lấy từ app 5190 (GET ngày 22/11/2026). Mã màn như `06` là ảnh `screens/png/06-*.png`, cũng mở được trong `prototype/index.html`.

## C. Hồ sơ 360°

**Bố cục chung (Em chọn):**
- Đầu trang gồm tên, thẻ trạng thái và một dòng phụ (phòng · toà · SĐT). Bên phải có **1 nút chính** và tối đa 2 nút phụ; các thao tác hiếm gom vào nút "…".
- Thân trang có 2 cột. Cột trái là các khối liên kết theo nghiệp vụ, mỗi hàng bấm được để mở hồ sơ của đối tượng đó. Cột phải là "Hoạt động" và thông tin tra cứu.
- Breadcrumb chỉ hiện khi vào hồ sơ từ danh sách (2 tầng).
- Từ mọi danh sách và từ Ctrl+K, bấm một hàng là vào đúng hồ sơ. Không còn form mở bên dưới danh sách. Ở app cũ, form này nằm ở y = 1.140px; xem `01-nhiem-vu.md`.

| Hồ sơ | Nút chính | Khối / tab | Liên kết ra |
|---|---|---|---|
| **Người thuê** (`06`, Trần Quang Huy, P101) | Ghi nhận thu tiền | Tab: Tổng quan · Hoá đơn (số kỳ nợ) · Hợp đồng · Sự cố · Giấy tờ & cư trú. Tổng quan gồm: Tiền (nợ 4 kỳ, 7.580.000 ₫), Hợp đồng đang hiệu lực, Sự cố của phòng, Điện 4 kỳ gần nhất, Hoạt động, Liên hệ & giấy tờ | Phòng, hợp đồng, từng hoá đơn, từng sự cố |
| **Phòng** (`07`) | Phòng trống: **Tạo hợp đồng**. Đang thuê: chỉ có nút phụ "Mở hợp đồng" | Người đang ở · Hoá đơn của phòng · Sự cố · Điện nước kỳ này · Lịch sử hợp đồng | Người thuê 360°, hợp đồng, toà |
| **Hợp đồng** (`08`) | Theo trạng thái: sắp hết hạn → **Gia hạn**; chờ ký → **Ký hợp đồng**; đang hiệu lực bình thường → không có nút chính. Thanh lý, phụ lục, khoản phát sinh, người ở cùng, giao dịch cọc nằm trong menu "…" | Điều khoản · Dịch vụ áp dụng · Hoá đơn theo hợp đồng · Liên kết · Mốc (tạo/ký → hiệu lực → báo trước 30 ngày → thanh lý & quyết toán cọc) | Người thuê, phòng, hoá đơn |
| **Toà nhà** (`09`) | Khai báo phòng | Dải số (phòng, đang thuê, trống, nợ) · **Sơ đồ phòng** theo tầng, màu theo trạng thái · **Cần chú ý ở toà này** (người còn nợ, hợp đồng sắp hết/chờ ký) | Phòng 360°, người thuê, hợp đồng |

**Em chọn:** Hợp đồng đang hiệu lực bình thường **không có nút chính**. Lý do: "Thanh lý" là hành động phá huỷ và hiếm dùng, không nên là nút nổi nhất. Vì vậy hồ sơ hợp đồng chỉ có nút chính khi có việc thật phải làm (gia hạn, ký).

## D. Luồng nhiều bước

### D1. Chu kỳ tháng của Quản lý (`12` desktop, `23` điện thoại)
```
[1 Ghi chỉ số] ──đủ công tơ──▶ [2 Chốt kỳ] ──────────▶ [3 Phát hành hoá đơn] ─────────▶ [4 Thu tiền]
  n/m công tơ · còn 4            mở từ 25/11/2026        9 phòng đang thuê               kỳ trước còn nợ
  nút chính: "Ghi 4 công tơ"     khoá chỉ số, không      tạo nháp 9 hoá đơn,             theo dõi ở Thu tiền,
                                 sửa được nữa            kiểm rồi phát hành              nhóm theo người
```
Bản xem trước vẽ chi tiết bước 1, là bước đang làm. Nhãn nút chính của bước 2–4 ("Chốt kỳ", "Phát hành", "Mở Thu tiền") là đề xuất và chưa có màn riêng; cột "Sau bước này" mô tả nội dung từng bước.
- Thanh bước ở đầu trang. Mỗi bước có trạng thái (xong / đang làm / chưa tới) và dòng tóm tắt. Mỗi bước có đúng một nút chính.
- Bước 1 liệt kê **công tơ còn thiếu trước**, phòng đã ghi gấp lại. Cột phải "Sau bước này" giải thích các bước còn lại sẽ làm gì; kỳ trước (10/2026, đã chốt) hiện bên dưới để đối chiếu.
- Trên điện thoại (`23`) chỉ còn một công tơ mỗi màn với ô số to. Nút "Lưu, sang 401 · Điện" vừa lưu vừa chuyển sang công tơ kế tiếp; tiến độ ghi là "Bước 1/4 · n/m công tơ".
- Các API giữ nguyên: `/toa-nha/{id}/ky-thanh-toan`, `/ky-thanh-toan/{id}/thieu-chi-so`, `/chi-so`, `/hoa-don`.

### D2. Tạo hợp đồng (`14`)
```
Phòng trống (hồ sơ phòng / Ctrl+K "Tạo hợp đồng")
 └▶ 1 Phòng & người thuê ▶ 2 Thời hạn & giá ▶ 3 Dịch vụ áp dụng ▶ 4 Người ở cùng & cọc ▶ 5 Xem lại & tạo
        (đã chọn ✓)          (đang ở đây)        mặc định theo toà     tuỳ chọn               tóm tắt + "Tạo hợp đồng"
```
- Cột trái là danh sách bước dọc, có thể quay lại bước đã xong. Cột giữa là form của bước hiện tại với nhãn luôn hiện; cột phải là tóm tắt hợp đồng đang tạo.
- Chỉ có một nút chính "Tiếp: Dịch vụ áp dụng". Nút "Lưu nháp" là nút phụ.
- Toàn bộ trường lấy từ `HopDongThaoTac.tsx` hiện có, chỉ chia lại thành bước; không thêm trường mới.

### D3. Sự cố: từ tiếp nhận tới thanh toán thợ (`13`)
```
Tiếp nhận ▶ Phân công thợ ▶ Khảo sát & báo giá ▶ Duyệt báo giá ▶ Sửa xong · chờ nghiệm thu ▶ Thanh toán thợ
 (QL)         (QL)            (Thợ, điện thoại)    (QL/Chủ)        (Thợ → QL nghiệm thu)        (QL)
```
- Gộp một danh sách với chip lọc "Đang mở · Cần phân công · Đang sửa · Đã đóng" (mặc định Đang mở), khẩn cấp xếp lên đầu. Bên phải là **ngăn chi tiết** gồm tiến độ 6 bước, giờ báo, liên hệ, thợ, chi phí và ảnh. Nút chính đổi theo bước: Phân công thợ → Nhắc thợ gửi báo giá → Duyệt báo giá → Nghiệm thu → Xác nhận thanh toán thợ.
- Bỏ bảng "Lịch sử sửa chữa" thứ hai: nội dung của nó nằm trong ngăn và trong chip Đã đóng.
- Bên Thợ (`20`): mỗi thẻ việc ghi bước hiện tại theo chuỗi Khảo sát → Báo giá → Sửa → Nhận tiền ("Bước 1/4 · Khảo sát") và một nút kế tiếp ("Bắt đầu khảo sát", "Gửi báo giá", "Báo đã sửa xong"). Chỉ thẻ đầu tiên dùng nút chính.

### D4. Khách thuê xem và trả hoá đơn (`21` → `22`)
```
Cần trả (tổng mọi kỳ chưa trả: 7.580.000 ₫, 4 kỳ)
 ├▶ "Trả 7.580.000 ₫" (chính)  ─┐
 └▶ "Chỉ trả kỳ 10/2026" (phụ) ─┴▶ Bước 2/3 Chuyển khoản (số TK, nội dung = mã hoá đơn, QR*) ▶ Bước 3/3 Chờ quản lý xác nhận → "Đã thu"
```
- Màn Cần trả trả lời ngay "tôi phải trả bao nhiêu". App cũ chỉ hiện kỳ mới nhất (1.895.000 ₫) và giấu 3 kỳ nợ cũ.
- \*QR và nút "Tôi đã chuyển khoản" phụ thuộc backend (B2, endpoint khách báo trả); xem `02-kien-truc-thong-tin.md` §4.

## Màn đại diện (Brief §E) có trong bản xem trước
| Yêu cầu | Màn |
|---|---|
| Chủ: Hôm nay (nợ quá hạn theo người, hợp đồng sắp hết, sự cố cần quyết, phòng chưa thuê, lịch hẹn) + số liệu gọn | `01` (1440), `24` (390) |
| Chủ: Thu tiền (nhóm theo người, hàng tổng, một bộ lọc, bulkbar khi chọn) | `04`, `05`, `25` (390), `27` (1180) |
| Hồ sơ người thuê 360° | `06` |
| Sự cố: danh sách + ngăn | `13` |
| Quản lý: Chu kỳ tháng + Hôm nay (Nhắc việc) | `12`, `10` |
| Thợ, Khách thuê (390) | `20`, `21`, `22` |
| Khung: sidebar, chọn toà, Ctrl+K, thông báo, Không có quyền, trạng thái | `02`, `03`, `11`, `15`, `16`, `26` |
| Ghi chỉ số (390) | `23` |
