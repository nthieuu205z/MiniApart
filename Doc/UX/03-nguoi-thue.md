# Phân hệ Người thuê

Đọc `00-nen-tang-ux.md` trước.

**Người đại diện:** Hùng, sinh viên, ở ghép, ngân sách hạn chế. **Chỉ dùng điện thoại.** Thành thạo công nghệ nhưng **ngại cài thêm app chỉ để xem tiền phòng** — đây là lý do sản phẩm phải là web mở bằng trình duyệt.

**Đặc thù phân hệ này:** đây là phần **người ngoài tổ chức** nhìn thấy. Chất lượng của nó quyết định người thuê tin hay không tin con số. Mọi màn ở đây chỉ đọc — người thuê không sửa gì ngoài việc gửi báo hỏng.

> **Câu định hình cả phân hệ** — Hùng, khảo sát: *"tiền điện tự nhiên gấp rưỡi, tôi không biết đường nào mà kiểm tra"*.

---

## 1. Bối cảnh dùng

| Yếu tố | Thực tế |
|---|---|
| Thiết bị | **Điện thoại, gần như 100%** |
| Tần suất | **Mỗi tháng một lần** — lúc nhận thông báo hoá đơn mới |
| Thời lượng mỗi lần | 1–3 phút, trừ khi có thắc mắc |
| Trạng thái tinh thần | Trung tính, cho tới khi thấy số cao hơn dự kiến → **cần kiểm chứng ngay** |
| Kỳ vọng | Mở ra thấy ngay số tiền, không phải đi tìm |

**Hệ quả thiết kế quan trọng nhất:** người dùng này ghé rất hiếm, nên **không có thời gian học giao diện**. Mọi thứ phải hiểu được ngay lần đầu, không có onboarding, không có gợi ý dùng dần.

---

## 2. Trang chủ `#32` — hoá đơn mới nhất ngay lập tức

`#3` của Người thuê **chính là** `#32`.

`FR-POR-01`: *"hiển thị hoá đơn kỳ gần nhất ngay khi người thuê đăng nhập"*. Không phải một bảng điều khiển có liên kết tới hoá đơn — mà **chính hoá đơn đó**, ngay trên trang đầu.

### 2.1. Thứ tự thông tin trên `#32`

```
┌────────────────────────────────┐
│  Phòng 302 · Kỳ 08/2026        │
│                                │
│  1.888.000 đ                   │  ← rất to, là lý do người ta mở
│  Hạn thanh toán: 10/09/2026    │
│  ● Chưa thanh toán             │  ← nhãn chữ, không chỉ màu
│                                │
│  [Xem chi tiết từng khoản]     │  ← đường tới lòng tin
│  [Xem mã QR chuyển khoản]      │  ← đường tới hành động
├────────────────────────────────┤
│  Hợp đồng · Lịch sử · Báo hỏng │
└────────────────────────────────┘
```

Ba thứ theo đúng thứ tự người dùng cần: **bao nhiêu** → **khi nào** → **trả thế nào**.

### 2.2. Bốn trạng thái của `#32`

| Trạng thái | Hiện gì |
|---|---|
| Có hoá đơn chưa trả | Như trên |
| **Đã trả đủ** | Số tiền + nhãn *"Đã thanh toán"* + ngày trả. Không hiện nút QR nữa |
| **Đã trả một phần** | *"Đã trả 500.000 đ / còn 1.388.000 đ"* — **hiện cả hai số** |
| **Chưa có hoá đơn kỳ này** | *"Chưa có hoá đơn kỳ 09/2026. Hoá đơn thường phát hành sau ngày chốt số (05 hàng tháng)."* — nói rõ **khi nào có**, không để trống |

Trạng thái thứ tư hay bị bỏ sót và là nguyên nhân của những cuộc gọi *"sao chưa thấy hoá đơn"*.

---

## 3. Màn quyết định lòng tin — `#33` Chi tiết hoá đơn

Đây là màn trả lời trực tiếp câu của Hùng. `FR-POR-02` đòi hiển thị **chỉ số đầu kỳ, cuối kỳ, mức tiêu thụ, đơn giá, thành tiền** cho từng khoản.

### 3.1. Nguyên tắc: mỗi dòng kiểm tra lại được bằng máy tính bỏ túi

**Sai:**
```
Tiền điện          203.000 đ
```

**Đúng:**
```
Tiền điện
1.240 → 1.298 = 58 kWh × 3.500 đ        203.000 đ
```

### 3.2. Hoá đơn bậc thang — chỗ khó nhất

Khi tính theo biểu giá bậc thang (`BR-02b`) kèm định mức đầu người (`BR-02c`), phải hiện **cả cách quy đổi hộ**, vì đây là chỗ người thuê thắc mắc nhiều nhất:

```
Số người ở trong kỳ: 6 người → 2 hộ quy đổi
  (quy tắc: 4 người tính là 1 hộ)

  Bậc 1   0–200 kWh (100 × 2 hộ)   200 kWh × 1.984 đ      396.800 đ
  Bậc 2   201–400 kWh              150 kWh × 2.380 đ      357.000 đ
```

Không giải thích quy tắc "4 người = 1 hộ" thì con số `2 hộ` trông như tuỳ tiện.

### 3.3. Dòng làm tròn — phải hiện, kể cả khi âm

`BR-15` làm tròn đến 1.000 đ **theo cách gần nhất**, nên dòng làm tròn **có thể mang dấu âm**:

```
Cộng                                    1.887.839 đ
Làm tròn đến 1.000 đ                         +161 đ
Tổng phải thu                           1.888.000 đ
```

Giấu dòng này đi thì tổng không khớp với tổng các dòng, và đó chính là kiểu chênh lệch làm người ta mất niềm tin.

### 3.4. Ảnh công tơ — bằng chứng cuối cùng

`FR-POR-06`: người thuê xem được ảnh công tơ tương ứng từng kỳ.

Đây là **chốt chặn cuối** của lòng tin: khi mọi giải thích bằng số vẫn chưa đủ, người thuê nhìn ảnh công tơ. Yêu cầu:

- Đặt ngay cạnh dòng điện/nước tương ứng, không giấu ở cuối trang.
- Ảnh qua liên kết ký hạn 15 phút → cần **trạng thái đang lấy** và **trạng thái hết hạn + nút Lấy lại**.
- Phóng to được — chữ số trên công tơ nhỏ.

### 3.5. Khoản phát sinh — phải nói rõ nguồn gốc

Nếu hoá đơn có khoản phát sinh từ sửa chữa (`FR-MNT-06`), không được hiện trơ trọi:

```
Chi phí sửa chữa                          350.000 đ
  Yêu cầu #SC-0142 · Sửa vòi nước · 12/08/2026
  [Xem chi tiết yêu cầu]
```

Khoản lạ không giải thích trên hoá đơn là nguyên nhân tranh cãi số một.

---

## 4. Luồng chính

| Bước | Từ | Hành động | Đến |
|---|---|---|---|
| 1 | Đăng nhập | — | `#32` — thấy ngay hoá đơn mới nhất |
| 2 | `#32` | *"Xem chi tiết"* | `#33` |
| 3 | `#33` | *"Xem lịch sử"* | `#34` — 12 kỳ (`FR-POR-03`) |
| 4 | `#34` | Bấm một kỳ cũ | `#33` của kỳ đó |
| 5 | `#33`/`#34` | *"Xem biểu đồ"* | `#35` — tiêu thụ 12 kỳ (`FR-POR-05`) |
| 6 | Menu | *"Hợp đồng"* | `#36` |
| 7 | Menu | *"Báo hỏng"* | `#37` |
| 8 | `#37` | Gửi xong | ⟲ `#32` + xác nhận đã gửi |
| 9 | `#32`/`#33` | *"Mã QR"* | `#29` — lớp phủ, không rời màn |
| 10 | `#33` | *"In"* | Bản in A4 — chế độ in của `#33`, không phải màn riêng |

---

## 5. Màn `#35` — biểu đồ tiêu thụ, dùng để tự trả lời

Đây không phải màn trang trí. Nó tồn tại để người thuê **tự trả lời** câu *"sao tháng này cao thế"* mà không cần gọi ai.

| Yêu cầu | Vì sao |
|---|---|
| 12 kỳ gần nhất, điện và nước **tách riêng** | Gộp chung hai đơn vị khác nhau là vô nghĩa |
| **Bảng số kèm biểu đồ** | Biểu đồ thấy xu hướng, bảng kiểm chứng |
| Đánh dấu kỳ đang xem | Để định vị |
| Chú giải bằng chữ, không chỉ bằng màu | Nguyên tắc 5, file nền tảng |
| Chạm vào một cột hiện đúng số | Trên điện thoại không có rê chuột |
| Nếu ít hơn 12 kỳ | Hiện đúng số kỳ có, kèm *"Bạn ở đây được 4 kỳ"* — không vẽ cột rỗng |

---

## 6. Màn `#36` — hợp đồng và cảnh báo hết hạn

`FR-POR-07`: cảnh báo khi còn **dưới 30 ngày** đến hạn.

| Trạng thái | Hiện gì |
|---|---|
| Còn > 30 ngày | Thông tin hợp đồng bình thường |
| **Còn < 30 ngày** | Dải cảnh báo: *"Hợp đồng còn **12 ngày** (hết hạn 10/09/2026)"* + nút liên hệ quản lý |
| Đã hết hạn | *"Hợp đồng đã hết hạn ngày 10/09/2026"* |
| Đã thanh lý | Vẫn xem được trong **90 ngày** (`FR-POR-09`), kèm *"Chế độ chỉ đọc — còn xem được đến 09/12/2026"* |

Cảnh báo phải xuất hiện **cả trên `#32`**, không chỉ nằm trong `#36` — vì người thuê chỉ mở `#32`.

---

## 7. Màn `#37` — báo hỏng

`FR-MNT-01`: hạng mục, mô tả, mức độ, **tối đa 5 ảnh**.

### 7.1. Thiết kế cho tình huống thật

Người thuê báo hỏng lúc **đang bực** (vòi nước vỡ, mất điện). Form phải ngắn nhất có thể:

| Trường | Kiểu | Bắt buộc |
|---|---|---|
| Hạng mục | Chọn từ danh sách ngắn (Điện · Nước · Cửa/khoá · Vệ sinh · Khác) | Có |
| Mô tả | Ô chữ nhiều dòng | Có |
| Mức độ | 3 mức: Bình thường · Gấp · **Khẩn cấp (mất điện, ngập nước)** | Có |
| Ảnh | Tối đa 5, chụp trực tiếp hoặc chọn từ máy | Không |

### 7.2. Bốn chi tiết dễ bỏ sót

1. **Đếm ảnh rõ ràng:** *"3/5 ảnh"*. Thêm ảnh thứ 6 thì nút thêm **mờ đi**, kèm giải thích — không phải báo lỗi sau khi chọn xong.
2. **Ảnh đang tải lên phải thấy tiến độ.** Ảnh điện thoại 3–5MB, mạng yếu thì lâu. Không có phản hồi là người dùng bấm gửi nhiều lần.
3. **Mức "Khẩn cấp" phải nói rõ nghĩa** ngay tại chỗ chọn: *"Khẩn cấp — mất điện toàn phòng, ngập nước, hỏng khoá cửa"*. Không định nghĩa thì mọi người đều chọn khẩn cấp.
4. **Sau khi gửi, cho biết điều gì xảy ra tiếp:** *"Đã gửi yêu cầu #SC-0142. Quản lý toà sẽ tiếp nhận và phân công thợ. Bạn sẽ nhận thông báo khi có người được phân công."*

### 7.3. Theo dõi yêu cầu — đồng hồ 72 giờ

`FR-MNT-07` tự đóng yêu cầu sau 72 giờ nếu người thuê không phản hồi ở trạng thái *Chờ xác nhận*.

Người thuê **phải thấy đồng hồ đếm ngược**, không được bị đóng bất ngờ:

> *"Thợ báo đã sửa xong. Bạn xác nhận đã ổn chưa?*
> *Còn **2 ngày 4 giờ** — sau đó yêu cầu tự đóng."*
> `[Đã ổn, đóng yêu cầu]` `[Chưa ổn, mở lại]`

---

## 8. Ranh giới quyền — người thuê **không** được thấy gì

`FR-POR-04`: người thuê chỉ truy cập được dữ liệu của phòng mình.

| Không thấy | Vì sao |
|---|---|
| `#23` bản nội bộ của hoá đơn (có nút Sửa/Phát hành/Huỷ) | Đó là công cụ vận hành |
| `#26`–`#28` thao tác thu tiền | Người thuê không ghi nhận thanh toán |
| `#30` công nợ toàn toà | Dữ liệu người khác |
| Hoá đơn của phòng khác | Kể cả khi đoán được URL — máy chủ trả 403 |
| Thông tin người thuê phòng khác | |

**Kiểm tra khi nghiệm thu:** nếu bản thiết kế của `#33` vô tình có nút Sửa hay Huỷ, đó là lỗi phân quyền phải sửa **trước** khi giao cho phần code — vì thiết kế sai ở đây dẫn tới lập trình viên hiện nút rồi mới chặn ở máy chủ, và người dùng thấy nút mình không bấm được.

---

## 9. Danh sách màn hình của phân hệ này

| # | Màn | Mặt bằng | Trạng thái cần thiết kế |
|---|---|---|---|
| 29 | Mã QR chuyển khoản | 📱 | Lớp phủ; QR chứa sẵn số tiền + mã hoá đơn (`FR-INV-10`) |
| **32** | **Trang chủ ★★** | **📱** | **4 trạng thái** ở mục 2.2 |
| 33 | Hoá đơn bản người thuê | 📱🖨 | Ảnh: đang lấy / hết hạn; dòng làm tròn có thể âm |
| 34 | Lịch sử 12 kỳ | 📱 | Ít hơn 12 kỳ thì hiện đúng số có |
| 35 | Biểu đồ tiêu thụ | 📱 | Biểu đồ **và** bảng; chạm hiện số |
| 36 | Hợp đồng + cảnh báo hết hạn | 📱 | 4 trạng thái ở mục 6 |
| 37 | Báo hỏng | 📱 | Đếm ảnh, tiến độ tải, đồng hồ 72h |
| 44 | Hộp thông báo | 📱 | Dùng chung — xem `00-nen-tang-ux.md` |

---

## 10. Bốn bẫy UX của phân hệ này

1. **Bắt người thuê bấm thêm một lần mới thấy hoá đơn.** `FR-POR-01` đòi hiện **ngay khi đăng nhập**. Một bảng điều khiển có ô "Hoá đơn mới nhất" là đã sai một nhịp.
2. **Giấu dòng làm tròn vì nó xấu.** Giấu thì tổng không khớp, và mất lòng tin nhiều hơn là một dòng `+161 đ`.
3. **Hiện khoản phát sinh mà không nói nguồn gốc.** Khoản lạ trên hoá đơn là nguyên nhân tranh cãi số một.
4. **Để yêu cầu sửa chữa tự đóng mà không báo trước.** Đồng hồ 72 giờ phải nhìn thấy được.
