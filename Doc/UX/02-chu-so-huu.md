# Phân hệ Chủ sở hữu

Đọc `00-nen-tang-ux.md` trước.

**Người đại diện:** anh Minh, không sống tại toà nhà, sở hữu **nhiều toà**, thuê 2 người quản lý. Đi lại nhiều. Kỹ năng công nghệ trung bình — Zalo, Excel cơ bản, ngân hàng số.

**Đặc thù phân hệ này:** Chủ **không nhập liệu**, Chủ **đọc và quyết định**. Mọi màn hình ở đây tối ưu cho việc *hiểu nhanh* và *quyết đúng*, không phải cho việc *nhập nhanh*.

---

## 1. Bối cảnh dùng — hai chế độ đọc

| | Chế độ liếc | Chế độ soi |
|---|---|---|
| **Khi nào** | Đang đi đường, giữa hai cuộc hẹn | Ngồi bàn, cuối tháng, đối soát |
| **Thiết bị** | Điện thoại | Laptop |
| **Câu hỏi** | *"Mọi thứ có ổn không?"* | *"Tiền tháng này đi đâu?"* |
| **Thời gian** | **Ba giây** | 15–30 phút |
| **Màn phục vụ** | `#41` Bảng tổng quan | `#22`, `#30`, `#45`–`#47` |

Sản phẩm phải phục vụ tốt **cả hai**, và `#41` phải chuyển được từ chế độ một sang chế độ hai chỉ bằng một cú bấm.

---

## 2. Màn tổng quan `#41` — ba câu hỏi, ba giây

Đây là trang chủ của Chủ (`#3` = `#41`) và là màn hình quan trọng nhất của phân hệ.

### 2.1. Ba câu hỏi cố định

| Câu hỏi | Con số trả lời | Bấm vào → |
|---|---|---|
| **Tháng này thu được bao nhiêu?** | `41.536.000 đ` đã thu / `48.900.000 đ` phải thu — **kèm tỷ lệ 85%** | `#22` lọc kỳ hiện tại |
| **Ai đang nợ?** | `5 hoá đơn quá hạn — 8.450.000 đ` | `#30` |
| **Có gì cần tôi quyết?** | `2 việc` | Tuỳ loại — xem mục 3 |

**Ba câu này là toàn bộ nội dung của `#41`.** Mọi thứ thêm vào đều làm loãng. Nếu có ý tưởng thêm thẻ thứ tư, kiểm tra xem nó trả lời câu hỏi nào trong ba câu trên — nếu không, nó thuộc về báo cáo (`#45`–`#47`), không thuộc `#41`.

### 2.2. Gộp nhiều toà — mặc định và bộ lọc

Anh Minh có nhiều toà. Mặc định `#41` hiện **tổng gộp cả ba toà**, kèm bộ lọc chuyển sang từng toà.

| Yêu cầu | Chi tiết |
|---|---|
| Mặc định | Gộp tất cả toà được sở hữu, kỳ hiện hành |
| Bộ lọc | Theo toà, theo khoảng thời gian — **nằm trong URL** để chia sẻ và Back được |
| Khi lọc một toà | Tiêu đề đổi rõ ràng: *"Toà A — kỳ 08/2026"*, không để người dùng nhầm đang xem toàn bộ |
| So sánh giữa các toà | Có, nhưng **không mặc định** — chỉ khi bấm *"Xem theo toà"* |

### 2.3. Khác biệt giữa hai mặt bằng

Đây là màn hình dùng thật trên **cả hai** mặt bằng, và bố cục phải khác nhau thật:

| | Điện thoại | Máy tính |
|---|---|---|
| Ba con số | Ba thẻ **xếp dọc**, mỗi thẻ chiếm chiều ngang | Ba thẻ **một hàng ngang** |
| Bên dưới | Hết. Cuộn xuống là danh sách rút gọn | **Bảng chi tiết theo từng toà** — chỗ trống của màn rộng dùng vào việc này |
| Biểu đồ xu hướng | Không có — không đọc được trên màn hẹp | Có, 6–12 kỳ gần nhất |

**Bản máy tính không phải bản điện thoại giãn ra.** Màn 1440px mà chỉ có ba thẻ giữa màn là lãng phí đúng thứ mà chế độ soi cần.

---

## 3. Luồng quyết định

Chủ có đúng **ba loại quyết định** trong hệ thống. Ngoài ba loại này, Chủ chỉ đọc.

### 3.1. Huỷ hoá đơn đã phát hành (`#23` → `#25`)

**Chỉ Chủ mới có quyền này** (`BR-08`). Vì sao: huỷ hoá đơn động tới số tiền người thuê phải trả, cần thẩm quyền cao hơn QL.

| Bước | Chi tiết UX |
|---|---|
| 1 | Ở `#23`, nút *"Huỷ hoá đơn"* **chỉ hiện với vai trò Chủ**. QL không thấy nút này |
| 2 | Bấm → `#25` với **ô lý do bắt buộc**, không bỏ trống được |
| 3 | Hộp thoại nêu hậu quả bằng số: *"Huỷ hoá đơn A-302-202608 (1.888.000 đ)? Người thuê sẽ thấy trạng thái Đã huỷ. Thao tác được ghi nhật ký."* |
| 4 | Sau khi huỷ → gợi ý ngay bước kế: *"Phát hành hoá đơn thay thế?"* (`FR-INV-06`) |

Bước 4 quan trọng: huỷ hoá đơn hiếm khi là mục đích cuối. Người ta huỷ **để phát hành lại cái đúng**. Bỏ qua gợi ý này là để người dùng tự nhớ, và họ sẽ quên.

### 3.2. Duyệt sự cố nghiêm trọng (`#41` → `#39`)

Chủ xem `#39` ở **chế độ chỉ đọc + duyệt chi phí**, không tự phân công thợ (đó là việc QL).

Điều Chủ cần thấy ngay trên `#39`: **chi phí dự kiến** và **bên chịu chi phí**. Đây là chỗ ảnh hưởng tiền.

### 3.3. Sửa chỉ số của kỳ đã phát hành (`FR-MTR-10`)

Trường hợp hiếm nhưng có thật: phát hiện ghi sai chỉ số sau khi đã phát hành hoá đơn.

**Chỉ Chủ làm được**, và phải rất rõ ràng về hậu quả:

> *"Sửa chỉ số phòng 302 kỳ 08/2026 (đã phát hành hoá đơn)?*
> *Hoá đơn A-302-202608 sẽ **không tự tính lại**. Sau khi sửa, cần huỷ và phát hành lại hoá đơn.*
> *Thao tác được ghi nhật ký."*

Không tự động tính lại là quyết định có chủ ý — tính lại ngầm một hoá đơn đã gửi cho người thuê là cách chắc chắn nhất để phá vỡ lòng tin.

---

## 4. Luồng thiết lập toà nhà (`#5` → `#6`)

Chủ là người **tạo toà**; QL chỉ vận hành toà đã có.

| Bước | Chi tiết |
|---|---|
| 1 | `#5` Danh sách toà — rỗng lần đầu: *"Chưa có toà nhà nào. [Khai báo toà đầu tiên]"* |
| 2 | `#6` Khai báo toà: tên, địa chỉ, số tầng, **ngày chốt số** (1–28), hạn thanh toán |
| 3 | Lưu → ⟲ `#5`, và **gợi ý bước kế**: *"Toà A đã tạo. [Tạo phòng] hoặc [Phân công quản lý]"* |

**Ngày chốt số giới hạn 1–28** là ràng buộc nghiệp vụ — tháng 2 chỉ có 28 ngày. Giao diện phải chặn ở ô nhập, kèm giải thích: *"Từ 1 đến 28 — để mọi tháng đều có ngày này."*

**`NFR-MNT-02`:** mọi tham số nghiệp vụ (ngày chốt số, ngưỡng cảnh báo, số ngày hạn thanh toán, biểu giá) phải **cấu hình được qua giao diện**, không viết cứng. Màn `#6` là nơi đặt phần lớn các tham số này.

---

## 5. Báo cáo (`#45`–`#47`)

Ba màn đứng riêng, **không nối tiếp nhau** — mỗi cái trả lời một câu khác nhau.

| Màn | Câu hỏi trả lời | Đặc thù UX |
|---|---|---|
| `#45` Công nợ | *"Ai nợ, nợ bao lâu?"* | **Xuất Excel** — anh Minh dùng Excel cơ bản, đây là cầu nối với công cụ anh đã quen |
| `#46` Tiêu thụ điện nước | *"Có phòng nào dùng bất thường?"* | Biểu đồ 12 kỳ + bảng số. Biểu đồ để thấy xu hướng, bảng để kiểm tra |
| `#47` Chi phí bảo trì | *"Sửa chữa tốn bao nhiêu?"* | Nhóm theo hạng mục và theo phòng (`FR-MNT-08`) |

### 5.1. Quy tắc chung cho màn báo cáo

1. **Luôn có bảng số kèm biểu đồ.** Biểu đồ để nhận ra xu hướng; bảng để kiểm chứng. Chỉ có biểu đồ là không kiểm tra được — vi phạm nguyên tắc 1 ở file nền tảng.
2. **Bộ lọc nằm trong URL.** Anh Minh gửi đường dẫn báo cáo cho kế toán qua Zalo.
3. **Nói rõ dữ liệu tính đến lúc nào**: *"Số liệu tính đến 29/08/2026 14:30"*. Báo cáo không ghi thời điểm là báo cáo không dùng để đối chiếu được.
4. **Xuất Excel giữ nguyên định dạng tiền Việt Nam** (`NFR-USA-06`) — mở ra trong Excel phải là số, không phải chuỗi.
5. **Trạng thái rỗng phải phân biệt** *"chưa có dữ liệu kỳ này"* với *"bộ lọc không khớp"*.

---

## 6. An toàn và tuân thủ (`#49`, `#50`)

| Màn | Nội dung | Đặc thù |
|---|---|---|
| `#49` Hồ sơ PCCC | Giấy tờ, ngày cấp, ngày hết hạn | |
| `#50` Thiết bị PCCC + hạn kiểm định | Danh sách thiết bị, chu kỳ kiểm định (`BR-20`) | **Cảnh báo trước hạn**, không phải sau |

**Nguyên tắc của nhóm màn này:** cảnh báo phải xuất hiện **trước** khi quá hạn, và xuất hiện ở `#41` chứ không chỉ nằm im trong `#50`. Người ta không mở màn PCCC hàng tuần; nếu cảnh báo chỉ nằm ở đó thì nó vô dụng.

> Trên `#41`: *"3 bình chữa cháy hết hạn kiểm định trong 30 ngày tới"* → bấm sang `#50`.

---

## 7. Nhật ký và công tơ tổng (`#52`, `#53`)

| Màn | Dùng khi nào | Đặc thù UX |
|---|---|---|
| `#52` Nhật ký thao tác | Khi cần truy ai đã làm gì | **Chỉ đọc.** Lọc theo người, theo loại thao tác, theo khoảng thời gian |
| `#53` Chỉ số công tơ tổng | Hàng tháng, kiểm tra thất thoát | Cảnh báo theo `BR-19` |

### 7.1. `#53` — cảnh báo thất thoát phải giải thích được

`BR-19` tính tỷ lệ chênh lệch giữa công tơ tổng và tổng tiêu thụ các phòng. Ngưỡng mặc định 10%.

Không hiện *"Cảnh báo thất thoát"* rồi thôi. Hiện đủ phép tính (nguyên tắc 1):

> *Công tơ tổng: **4.850 kWh***
> *Tổng tiêu thụ 24 phòng: 4.180 kWh*
> *Tiêu thụ khu vực chung: 210 kWh*
> *Chênh lệch: **460 kWh (9,5%)** — dưới ngưỡng 10%*

Có con số thì anh Minh tự đánh giá được; chỉ có nhãn cảnh báo thì anh phải gọi điện hỏi.

---

## 8. Danh sách màn hình của phân hệ này

| # | Màn | Mặt bằng | Ghi chú UX |
|---|---|---|---|
| 5 | Danh sách toà nhà | 🖥 | Rỗng lần đầu có nút tạo |
| 6 | Khai báo / sửa toà nhà | 🖥 | Nơi đặt tham số nghiệp vụ (`NFR-MNT-02`) |
| 8 | Sơ đồ phòng theo tầng | 🖥📱 | Chế độ xem, không thao tác vận hành |
| 22 | Danh sách hoá đơn | 🖥 | Gộp nhiều toà, lọc theo toà |
| 23 | Chi tiết hoá đơn | 🖥📱 | **Nút Huỷ chỉ hiện với Chủ** |
| 25 | Huỷ hoá đơn kèm lý do | 🖥 | Lý do bắt buộc + gợi ý phát hành lại |
| 30 | Công nợ | 🖥 | Sắp theo ngày quá hạn |
| 39 | Chi tiết sự cố | 🖥 | Chỉ đọc + duyệt chi phí |
| **41** | **Bảng tổng quan ★★ = trang chủ** | **🖥📱** | **Ba câu hỏi, ba giây** |
| 45 | Báo cáo công nợ | 🖥 | Xuất Excel |
| 46 | Báo cáo tiêu thụ | 🖥 | Biểu đồ **và** bảng |
| 47 | Báo cáo chi phí bảo trì | 🖥 | Nhóm theo hạng mục/phòng |
| 49 | Hồ sơ PCCC | 🖥 | |
| 50 | Thiết bị PCCC + hạn kiểm định | 🖥 | Cảnh báo đẩy lên `#41` |
| 52 | Nhật ký thao tác | 🖥 | Chỉ đọc, có bộ lọc |
| 53 | Công tơ tổng + thất thoát | 🖥 | Hiện đủ phép tính `BR-19` |

---

## 9. Bốn bẫy UX của phân hệ này

1. **Nhồi thêm thẻ vào `#41`.** Ba câu hỏi là ba câu hỏi. Thẻ thứ tư làm hỏng lời hứa "ba giây".
2. **Bản máy tính của `#41` chỉ là bản điện thoại giãn ra.** Màn rộng phải dùng chỗ trống cho bảng chi tiết theo toà.
3. **Cảnh báo an toàn nằm im trong `#50`.** Phải đẩy lên `#41`, vì không ai mở `#50` hàng tuần.
4. **Báo cáo chỉ có biểu đồ.** Anh Minh cần kiểm chứng bằng con số, không chỉ nhìn hình.
