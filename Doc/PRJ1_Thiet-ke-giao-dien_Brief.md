# MiniApart — Brief thiết kế giao diện

**Sản phẩm:** Hệ thống Quản lý và Vận hành Chung cư mini
**Dùng cho:** thiết kế giao diện toàn hệ thống
**Ngày:** 24/08/2026

---

## 1. Sản phẩm này là gì

Một ứng dụng web giúp chủ chung cư mini vận hành toà nhà: khai báo phòng, ký hợp đồng, ghi số công tơ, **tính hoá đơn**, thu tiền, nhận báo hỏng. Có cổng riêng cho người thuê tự xem hoá đơn của mình.

Thay thế cho thứ đang được dùng thật ngoài đời: **một file Excel và một cuốn sổ tay**.

**Điều quan trọng nhất cần hiểu trước khi thiết kế:** đây là phần mềm **tính tiền của người thật**. Không phải một bảng điều khiển đẹp để ngắm. Mọi quyết định thiết kế phải phục vụ một trong hai việc: **giúp người nhập không gõ sai**, hoặc **giúp người trả tiền tin được con số**.

---

## 2. Bốn người dùng thật

Trích nguyên văn từ khảo sát. Đọc kỹ phần *thiết bị* và *kỹ năng* — hai thứ đó quyết định thiết kế nhiều hơn mọi thứ khác.

### Anh Minh, 45 tuổi — Chủ sở hữu

> *"Tôi có 3 toà, tổng 78 phòng. Cuối tháng nào tôi cũng phải ngồi ghép 3 file Excel để biết tháng này thu được bao nhiêu, ai còn nợ. Nhiều lúc đến giữa tháng sau mới phát hiện có phòng chưa đóng tiền."*

Không sống tại toà nhà, thuê 2 người quản lý. Đi lại nhiều, **chủ yếu dùng điện thoại**. Kỹ năng công nghệ trung bình — Zalo, Excel cơ bản, ngân hàng số.

**Anh ấy mở app để trả lời đúng ba câu:** tháng này thu được bao nhiêu? Ai còn nợ? Có gì bất thường không?

### Chị Lan, 38 tuổi — Quản lý toà nhà

> *"Ngày 28 hằng tháng tôi đi từng tầng ghi số công tơ, chụp lại rồi tối về nhập Excel. Nhập 30 phòng mất cả buổi tối, có hôm nhầm số phòng 302 với 305, người ta cãi nhau cả tuần."*

Sống tại tầng 1, **làm việc chủ yếu trên điện thoại**, thỉnh thoảng laptop cũ. Kỹ năng cơ bản. **Ngại ứng dụng nhiều bước, sợ bấm nhầm làm mất dữ liệu.**

Chị ấy là người dùng nhiều nhất, và câu *"nhầm 302 với 305"* là yêu cầu thiết kế trực tiếp.

### Bạn Hùng, 21 tuổi — Người thuê

> *"Tháng trước tiền điện tự nhiên gấp rưỡi, tôi hỏi thì chị quản lý bảo 'công tơ nó thế'. Tôi cũng không biết đường nào mà kiểm tra."*

Sinh viên, ở ghép, ngân sách hạn chế. **Chỉ dùng điện thoại.** Thành thạo công nghệ nhưng **ngại cài thêm app chỉ để xem tiền phòng** — nên đây phải là web mở bằng trình duyệt, không phải ứng dụng cài đặt.

Câu nói của Hùng là lý do tồn tại của màn hình chi tiết hoá đơn.

### Chú Tuấn, 52 tuổi — Thợ sửa chữa

Thợ điện nước tự do, nhận việc từ 4–5 toà. Cần biết: việc ở đâu, phòng nào, lỗi gì, có ảnh không, liên hệ ai. Bấm nhận việc, bấm báo xong.

> **Kỳ vọng ghi nguyên trong tài liệu:** *"không cần chức năng gì phức tạp hơn"*.

Màn hình của chú Tuấn phải là màn hình **đơn giản nhất cả hệ thống**. Đừng thiết kế đẹp cho nó — thiết kế **to và ít**.

---

## 3. Bảy ràng buộc chi phối mọi màn hình

Đây không phải gợi ý. Đây là điều kiện để sản phẩm dùng được.

**1. Điện thoại trước, máy tính sau.** Ba trong bốn người dùng làm việc chính trên điện thoại. Màn hình ghi chỉ số được dùng **giữa hành lang, thiếu sáng, sóng yếu, một tay cầm điện thoại một tay soi công tơ**. Thiết kế cho máy tính rồi thu nhỏ lại là làm ngược.

**2. Màu không bao giờ là thông tin duy nhất.** Trạng thái phòng, trạng thái hoá đơn, mức độ ưu tiên — luôn phải có **nhãn chữ** kèm màu. Lý do: khoảng 8% nam giới bị rối loạn sắc giác đỏ-lục, và ảnh chụp màn hình in đen trắng vào báo cáo sẽ mất hết màu.

**3. Tiếng Việt dài hơn tiếng Anh khoảng 30%.** "Đã thanh toán một phần" so với "Partially paid". Đừng thiết kế nút và nhãn vừa khít — chúng sẽ vỡ. Cũng đừng quên dấu tiếng Việt cần chiều cao dòng rộng hơn: chữ **ế**, **ộ**, **ữ** có dấu chồng hai tầng.

**4. Số tiền có định dạng riêng.** Dấu **chấm** ngăn nghìn, không phải dấu phẩy: `1.888.000 đ`. Luôn dùng phông chữ số đều bề ngang (tabular numerals) trong mọi bảng tiền — để hàng nghìn thẳng cột và mắt so sánh được.

**5. Hoá đơn phải in được ra giấy A4.** Đây là thứ **dán lên cửa phòng**. Phải có bản in riêng, không phải chụp màn hình.

**6. Ảnh không bao giờ hiện ngay.** Ảnh giấy tờ và ảnh công tơ lấy về qua liên kết hết hạn sau 15 phút. Nghĩa là giao diện cần **trạng thái chờ** khi mở ảnh, và trạng thái **"liên kết đã hết hạn, bấm để lấy lại"**.

**7. Không bao giờ có nút Xoá cho dữ liệu tiền.** Tài khoản, bản ghi thanh toán, hoá đơn đã phát hành — tất cả **chỉ khoá hoặc huỷ có lý do**, không xoá. Giao diện phải phản ánh điều đó: chỗ mà người ta quen thấy nút thùng rác thì ở đây là **Khoá** hoặc **Huỷ (kèm lý do)**.

### Hai kích thước màn hình — cả hai đều phải có

"Điện thoại trước" ở ràng buộc 1 là **thứ tự thiết kế**, không phải phạm vi. Sản phẩm là **web mở bằng trình duyệt**, nên cùng một địa chỉ sẽ được mở trên cả điện thoại lẫn máy tính và không có cách nào ngăn được. Nếu chỉ có bản điện thoại, khi anh Minh mở trên laptop sẽ thấy một cột hẹp lọt thỏm giữa màn hình rộng — trông như phần mềm bị lỗi.

Hai điểm gãy, không cần nhiều hơn:

| | Bề rộng | Bố cục | Việc làm ở đây |
|---|---|---|---|
| 📱 Điện thoại | < 768px | một cột · thanh điều hướng ở **đáy** · mỗi bản ghi là một thẻ · vùng bấm ≥ 44px | ghi chỉ số, thu tiền tại chỗ, màn hình thợ, toàn bộ phần người thuê |
| 🖥 Máy tính | ≥ 1024px | menu dọc **bên trái** luôn hiện · bảng nhiều cột thật · xem nhiều thứ cùng lúc | khai báo dịch vụ và bảng giá, chốt kỳ, tạo hoá đơn hàng loạt, công nợ, báo cáo |

Khoảng 768–1024px (máy tính bảng) **dùng lại bản máy tính**, chỉ thu menu trái thành dải biểu tượng. Không thiết kế riêng cho khoảng này.

**Bản máy tính không phải bản điện thoại kéo giãn ra.** Ba khác biệt bắt buộc:

1. **Bảng phải là bảng thật.** Trên điện thoại, một hoá đơn là một thẻ. Trên máy tính, 30 hoá đơn là 30 hàng — có tiêu đề cột bấm để sắp xếp, có ô chọn nhiều dòng, số tiền thẳng cột bên phải. Danh sách thẻ xếp dọc trên màn hình 1440px là lãng phí và khó so sánh.
2. **Điều hướng đổi chỗ, không chỉ đổi cỡ.** Điện thoại: thanh đáy 4–5 mục (ngón cái với tới). Máy tính: menu dọc bên trái, hiện đủ các mục theo vai trò ở mục 5, không giấu sau nút ba gạch.
3. **Việc hàng loạt chỉ có ở bản máy tính.** Tạo dãy phòng 201–208, chốt kỳ cả toà, tạo hoá đơn hàng loạt, xuất báo cáo — chị Lan làm những việc này lúc ngồi bàn, không làm giữa hành lang.

Chiều ngược lại cũng đúng: **màn hình ghi chỉ số (#18) không cần thiết kế riêng cho máy tính** — bản máy tính của nó chỉ là bản điện thoại đặt giữa và giới hạn bề rộng khoảng 480px. Không ai đứng trước công tơ với cái laptop.

---

## 4. Đã có sẵn gì — thiết kế nên kế thừa, đừng vứt

Phần nền móng đã code xong và chạy được. Thiết kế mới nên phát triển từ đây chứ không thay hẳn:

- **Màn hình đăng nhập** và **trang chủ tối giản** đã có
- **Chủ đề tối và sáng** tự đổi theo cài đặt hệ điện thoại
- Bộ biến màu hiện dùng: chữ chính, chữ phụ, viền, nền, xanh (tốt), đỏ (lỗi)
- Phông: phông hệ thống (`system-ui`) — chọn thế vì tải nhanh và hiển thị tiếng Việt chuẩn trên mọi máy

Nếu thiết kế muốn đổi bảng màu hay phông, **nói rõ đổi sang gì** để bên code thay một chỗ.

---

## 5. Điều hướng theo vai trò

Năm vai trò thấy năm menu khác nhau. Đây là bản đồ điều hướng cần thiết kế:

| Vai trò | Thấy gì trên menu |
|---|---|
| **Quản trị hệ thống** | Tài khoản · Toà nhà · Nhật ký thao tác |
| **Chủ sở hữu** | Tổng quan · Toà nhà · Hoá đơn · Công nợ · Báo cáo · Sự cố · An toàn |
| **Quản lý toà nhà** | Nhắc việc · Ghi chỉ số · Hoá đơn · Thu tiền · Phòng · Hợp đồng · Sự cố · Thông báo |
| **Thợ sửa chữa** | Việc của tôi *(chỉ một mục)* |
| **Người thuê** | Hoá đơn của tôi · Lịch sử · Hợp đồng · Báo hỏng |

**Lưu ý về menu.** Menu là chuyện tiện dụng, **không phải chuyện an ninh** — việc chặn thật nằm ở máy chủ. Nhưng menu quyết định người dùng có tìm thấy việc của mình không, nên hai người có cùng vai trò mà quản hai toà khác nhau vẫn thấy menu giống hệt; chỉ **dữ liệu** bên trong khác.

---

## 6. Danh mục màn hình đầy đủ

53 màn hình, chia ba mức ưu tiên. **Mức 1 cần trước** vì phần code đang làm tới đó; mức 3 còn xa và nhiều khả năng sẽ đổi.

Ký hiệu: 📱 dùng chủ yếu trên điện thoại · 🖥 dùng chủ yếu trên máy tính · 🖨 phải in được · ★ màn hình quyết định thành bại

Màn hình **không có ký hiệu 📱 hay 🖥 vẫn cần cả hai bản** — ký hiệu chỉ nói cái nào thiết kế trước và tối ưu cho cái nào.

### Mức 1 — cần thiết kế ngay

| # | Màn hình | Ai dùng | Ghi chú |
|---|---|---|---|
| 1 | Đăng nhập | tất cả | đã có, cần chuẩn hoá |
| 2 | Quên mật khẩu (mã OTP 5 phút) | tất cả | |
| 3 | Trang chủ — 5 biến thể theo vai trò | tất cả | 📱 |
| 4 | Quản lý tài khoản | QTHT | 🖥 không có nút xoá |
| 5 | Danh sách toà nhà | Chủ, QL | |
| 6 | Khai báo / sửa toà nhà | Chủ | |
| 7 | Danh sách phòng + tạo hàng loạt | QL | 🖥 tạo dãy 201–208 một lần |
| 8 | **Sơ đồ phòng theo tầng** ★ | Chủ, QL | màu **và** nhãn chữ |
| 9 | Khai báo dịch vụ (4 cách tính) | QL | 🖥|
| 10 | Bảng giá theo ngày hiệu lực | QL | 🖥 hiện cả lịch sử giá |
| 11 | Biểu giá điện bậc thang | QL | 🖥 5 bậc, nhập theo tỷ lệ |
| 12 | Danh sách người thuê | QL | số giấy tờ che bớt |
| 13 | Hồ sơ người thuê + ảnh giấy tờ | QL | ảnh qua liên kết 15 phút |
| 14 | Danh sách hợp đồng | QL | |
| 15 | Ký hợp đồng | QL | 🖥 nhiều bước, dễ bỏ dở |
| 16 | Chi tiết hợp đồng + người ở cùng | QL | |
| 17 | Danh sách kỳ thanh toán | QL | |
| 18 | **Ghi chỉ số công tơ** ★★★ | QL | 📱 quan trọng nhất |
| 19 | Khai báo thay công tơ | QL | 📱 4 ô chỉ số |
| 20 | Chốt kỳ + danh sách phòng còn thiếu | QL | 🖥 |
| 21 | Tạo hoá đơn hàng loạt + báo cáo bỏ qua | QL | 🖥 |
| 22 | Danh sách hoá đơn | QL, Chủ | 🖥|
| 23 | **Chi tiết hoá đơn** ★★★ | tất cả | 🖨 quyết định lòng tin |

### Mức 2 — cần sau khi xong phần tính tiền

| # | Màn hình | Ai dùng | Ghi chú |
|---|---|---|---|
| 24 | Sửa hoá đơn nháp (thêm khoản, giảm trừ) | QL | |
| 25 | Huỷ hoá đơn kèm lý do | Chủ | |
| 26 | Ghi nhận thanh toán (thu nhiều lần) | QL | 📱 |
| 27 | Bút toán đối ứng (sửa sai không xoá) | QL | |
| 28 | Biên lai | QL | 🖨 |
| 29 | Mã QR chuyển khoản | tất cả | 📱 |
| 30 | Công nợ, sắp theo số ngày quá hạn | Chủ, QL | 🖥 |
| 31 | Thanh lý hợp đồng + quyết toán cọc | QL | 🖥|
| 32 | **Trang chủ người thuê** ★★ | Người thuê | 📱 hiện ngay hoá đơn mới nhất |
| 33 | Hoá đơn bản người thuê | Người thuê | 📱🖨 |
| 34 | Lịch sử 12 kỳ | Người thuê | 📱 |
| 35 | Biểu đồ tiêu thụ điện nước 12 kỳ | Người thuê | 📱 |
| 36 | Thông tin hợp đồng + cảnh báo sắp hết hạn | Người thuê | 📱 |
| 37 | Báo hỏng (tối đa 5 ảnh) | Người thuê | 📱 |
| 38 | Danh sách yêu cầu sửa chữa | QL | 🖥|
| 39 | Chi tiết + phân công thợ | QL | 🖥|
| 40 | **Việc của tôi** ★ | Thợ | 📱 đơn giản nhất hệ thống |
| 41 | **Bảng tổng quan** ★★ | Chủ | 📱 ba câu hỏi của anh Minh |
| 42 | Bảng nhắc việc (5 nhóm) | QL | 🖥|

### Mức 3 — còn xa, thiết kế sau

| # | Màn hình | Ai dùng |
|---|---|---|
| 43 | Soạn thông báo theo toà / tầng / phòng | QL 🖥 |
| 44 | Hộp thông báo | tất cả |
| 45 | Báo cáo công nợ (xuất Excel) | Chủ 🖥 |
| 46 | Báo cáo tiêu thụ điện nước | Chủ 🖥 |
| 47 | Báo cáo chi phí bảo trì | Chủ 🖥 |
| 48 | Lịch sử sửa chữa theo phòng | QL 🖥 |
| 49 | Hồ sơ PCCC | Chủ 🖥 |
| 50 | Thiết bị PCCC + hạn kiểm định | Chủ 🖥 |
| 51 | Danh mục tự kiểm tra an toàn | QL |
| 52 | Nhật ký thao tác | QTHT, Chủ 🖥 |
| 53 | Chỉ số công tơ tổng + cảnh báo thất thoát | Chủ 🖥 |

---

## 7. Bốn màn hình quyết định thành bại — mô tả kỹ

Nếu chỉ thiết kế được bốn màn hình, thiết kế bốn cái này.

### 7.1. Ghi chỉ số công tơ ★★★ 📱

**Bối cảnh dùng thật:** chị Lan đứng giữa hành lang tầng 3, tay trái cầm điện thoại, tay phải soi đèn pin vào công tơ. Trời tối. Sóng yếu. Chị làm việc này cho **20–30 phòng liên tiếp**.

**Yêu cầu thiết kế:**

- Danh sách phòng xếp **theo tầng rồi theo số phòng**, không xáo trộn
- **Số phòng phải rất to** — đây là chỗ đã xảy ra vụ "nhầm 302 với 305 khiến người ta cãi nhau cả tuần"
- Chỉ số kỳ trước hiện **ngay cạnh** ô nhập, không phải bấm mới thấy
- Ô nhập số **to**, mở bàn phím số
- Gõ xong **hiện ngay mức tiêu thụ vừa tính** — để người ghi tự phát hiện gõ nhầm khi còn đứng trước công tơ
- Lưu xong **tự nhảy sang phòng kế tiếp**
- Thanh tiến độ: *đã ghi 12 / 20 phòng*
- Nút chụp ảnh công tơ ngay trên dòng đó
- **Ba trạng thái cần thiết kế:** chưa ghi · đã ghi · **cảnh báo tiêu thụ bất thường** (vượt 150% trung bình ba kỳ). Cảnh báo phải hiện *kỳ này bao nhiêu, trung bình bao nhiêu, gấp mấy lần* — rồi cho bấm xác nhận, **không chặn**

**Cấm:** hộp thoại nhiều bước, cuộn ngang, chữ nhỏ, nút gần mép màn hình.

### 7.2. Chi tiết hoá đơn ★★★ 🖨

**Đây là màn hình trả lời câu của Hùng:** *"tiền điện tự nhiên gấp rưỡi, tôi không biết đường nào mà kiểm tra"*.

Nguyên tắc: **mỗi dòng phải kiểm tra lại được bằng máy tính bỏ túi.**

Không viết `Tiền điện: 203.000`. Viết:

```
Tiền điện     1.240 → 1.298 = 58 kWh × 3.500 đ      203.000 đ
```

**Với hoá đơn tính bậc thang** thì mỗi bậc một dòng, và phải hiện **số người ở đã dùng để tính** cùng số hộ quy đổi, kèm một câu giải thích quy tắc *4 người tính là 1 hộ* — vì đây là chỗ người thuê thắc mắc nhất:

```
Số người ở trong kỳ: 6 người → 2 hộ quy đổi
  Bậc 1   0–200 kWh (100 × 2 hộ)   200 kWh × 1.984 đ    396.800 đ
  Bậc 2   201–400 kWh              150 kWh × 2.380 đ    357.000 đ
```

**Dòng làm tròn có thể mang dấu âm** — phải hiện, không được giấu:

```
Cộng                                              1.887.839 đ
Làm tròn đến 1.000 đ                                   +161 đ
Tổng phải thu                                     1.888.000 đ
```

Ảnh công tơ của kỳ đó xem được từ đây.

**Cần hai bản:** bản xem trên điện thoại (dọc, cuộn được) và **bản in A4** (không có menu, không có nút, có chỗ ký).

### 7.3. Bảng tổng quan của chủ sở hữu ★★ 📱

Anh Minh mở app trên điện thoại giữa lúc đi đường. Phải trả lời **ba câu trong ba giây**:

1. **Tháng này thu được bao nhiêu?** — đã phát hành / đã thu / còn nợ
2. **Ai còn nợ?** — danh sách ngắn, sắp theo **số ngày quá hạn giảm dần**, quá hạn lâu nhất lên đầu
3. **Có gì bất thường không?** — phòng trống, sự cố đang mở, chênh lệch công tơ

Gộp **cả ba toà** vào một màn hình, có bộ lọc theo toà và theo khoảng thời gian.

Bản máy tính của màn hình này **không phải bản điện thoại giãn ra**: điện thoại xếp ba con số thành ba thẻ chồng dọc, máy tính đặt chúng thành một hàng ngang rồi **dùng chỗ trống bên dưới cho bảng chi tiết theo toà** — thứ mà điện thoại không đủ chỗ để hiện.

Đừng thiết kế thành một rừng biểu đồ. Anh Minh cần **con số to** trước, biểu đồ sau.

### 7.4. Việc của tôi — màn hình của thợ ★ 📱

**Đây là màn hình phải đơn giản nhất cả hệ thống.** Tài liệu ghi nguyên văn kỳ vọng của chú Tuấn: *"không cần chức năng gì phức tạp hơn"*.

Một danh sách. Mỗi việc một thẻ:

- Toà nào, phòng nào, tầng mấy
- Hỏng cái gì, mức độ
- Ảnh người thuê chụp
- Số điện thoại liên hệ — **bấm là gọi**
- Một nút duy nhất: **Nhận việc** → sau đó thành **Báo hoàn thành**

Không menu, không bộ lọc, không biểu đồ, không thống kê.

---

## 8. Hệ thống thiết kế cần có

### Trạng thái phải có màu và nhãn riêng

**Phòng:** Trống · Đã cọc · Đang thuê · Đang sửa · Ngừng
**Hoá đơn:** Nháp · Đã phát hành · Đã thu một phần · Đã thanh toán · Quá hạn · Đã huỷ
**Hợp đồng:** Chờ ký · Đã cọc · Hiệu lực · Đã thanh lý *(cộng thêm cách nhìn "sắp hết hạn" — dưới 30 ngày, là một **nhãn phụ** chứ không phải trạng thái)*
**Sửa chữa:** Mới tiếp nhận · Đã tiếp nhận · Đã phân công · Đang xử lý · Chờ xác nhận · Đã đóng · Đã huỷ
**Mức độ sự cố:** Thường · Gấp · Khẩn cấp

Mỗi trạng thái **một màu + một nhãn chữ**. 21 trạng thái là nhiều — cần một quy tắc màu nhất quán chứ không phải 21 màu tuỳ hứng.

### Thành phần dùng lại nhiều

- **Ô nhập số lớn** cho điện thoại — dùng ở ghi chỉ số và thu tiền
- **Ô nhập tiền** — tự thêm dấu chấm ngăn nghìn khi gõ
- **Thẻ trạng thái** — màu + chữ
- **Bảng có cột số** — số phải thẳng cột
- **Ô mở ảnh** — kèm trạng thái *đang lấy liên kết* và *liên kết đã hết hạn*
- **Hộp xác nhận kèm ô lý do bắt buộc** — dùng cho mọi thao tác huỷ, khoá, sửa dữ liệu đã chốt
- **Trạng thái rỗng** — "chưa có phòng nào", "chưa có hoá đơn nào" kèm nút hành động tiếp theo

### Ba trạng thái mà thiết kế hay quên

1. **Đang tải** — mạng yếu là chuyện thường ở đây
2. **Lỗi** — nói rõ lỗi gì và làm gì tiếp, không phải "Đã có lỗi xảy ra"
3. **Không có quyền** — người dùng gõ tay một đường dẫn không thuộc vai trò mình

---

## 9. Đừng thiết kế những thứ này

- **Đăng nhập bằng email** — hệ thống dùng **số điện thoại**, vì người thuê và người quản lý đều không dùng email thường xuyên
- **Nút xoá** cho tài khoản, thanh toán, hoá đơn đã phát hành, dịch vụ đã dùng
- **Thông báo qua email hoặc Zalo** — chỉ có thông báo trong ứng dụng
- **Dòng thuế GTGT** trên hoá đơn — đã bỏ khỏi phạm vi
- **Ứng dụng cài đặt** — đây là web mở bằng trình duyệt, vì người thuê "ngại cài thêm app chỉ để xem tiền phòng"
- **Màn hình cấu hình phức tạp** — chị Lan "ngại ứng dụng nhiều bước, sợ bấm nhầm làm mất dữ liệu"

---

## 10. Cần nhận lại gì

Theo thứ tự ưu tiên:

1. **Hệ thống thiết kế** — bảng màu sáng và tối, thang chữ, khoảng cách, 21 nhãn trạng thái, các thành phần dùng lại
2. **Bốn màn hình ở mục 7**, thiết kế kỹ, có đủ trạng thái rỗng / đang tải / lỗi
3. **23 màn hình mức 1** ở mục 6
4. Mức 2 và mức 3 khi phần code chạm tới

**Mỗi màn hình cần đủ hai bản: 📱 điện thoại và 🖥 máy tính.** Thứ tự làm thì theo ký hiệu ở mục 6 — màn hình đánh 📱 vẽ bản điện thoại trước rồi suy ra bản máy tính, màn hình đánh 🖥 thì ngược lại. Quy tắc dựng hai bản nằm ở mục 3, phần *Hai kích thước màn hình*.

Ngoại lệ duy nhất là **màn hình ghi chỉ số (#18)**: bản máy tính của nó chỉ là bản điện thoại giới hạn bề rộng, không cần vẽ riêng.

Kèm theo, cần **hệ thống thiết kế nói rõ hai bố cục điều hướng** — thanh đáy cho điện thoại và menu trái cho máy tính — vì đây là thứ bên code dựng một lần rồi mọi màn hình dùng chung.

---

# Phụ lục A — Hợp đồng API

Phần này để **mã giao diện cắm vào là chạy**, không phải dịch lại tên trường. Mọi tên dưới đây đã chốt: một số đã có trong mã đang chạy, số còn lại lấy thẳng từ sơ đồ thực thể ở Chương 3 của báo cáo.

## A.1. Quy ước chung

**Đường dẫn.** Mọi lời gọi đi tới `/api/...` — **đường dẫn tương đối**, không bao giờ ghi cứng tên máy chủ. Lúc phát triển Vite chuyển tiếp, lúc chạy thật Nginx chuyển tiếp.

**Xác thực.** Gửi kèm `Authorization: Bearer <token>`. Token lấy từ `POST /api/auth/login`, sống 30 phút.

**Tên trường.** camelCase, **tiếng Việt không dấu**: `hoTen`, `soDienThoai`, `tongTien`. Không dịch sang tiếng Anh — tên này khớp với sơ đồ lớp ở Chương 3 báo cáo, đổi đi là báo cáo sai.

**Ngày tháng.** Chuẩn ISO 8601.
- Ngày: `"2026-08-28"`
- Thời điểm: `"2026-08-24T07:36:02Z"`

### ⚠️ Số tiền là CHUỖI, không phải số

```json
{ "tongTien": "1888000.00", "daThu": "500000.00" }
```

**Đây không phải nhầm lẫn, và cũng không phải chuyện làm cho phức tạp.**

Kiểu `number` của JavaScript là dấu phẩy động nhị phân. `0.1 + 0.2` cho `0.30000000000000004`. Áp vào bài toán này, cộng vài dòng tiền có thể ra `1887999.9999999998`. Sai số đó **không làm chương trình báo lỗi** và **không nhìn thấy bằng mắt trên hoá đơn** — chỉ lộ ra khi đối chiếu tổng cuối kỳ.

Chương 4 của báo cáo đã loại phương án viết backend bằng JavaScript đúng vì lý do này. Sẽ vô nghĩa nếu backend giữ kỷ luật `BigDecimal` rồi lại để số tiền đi qua `number` ở giao diện.

**Quy tắc cho giao diện:**

- Số tiền nhận về là chuỗi, **chỉ để hiển thị**
- **Không cộng, trừ, nhân, chia số tiền ở giao diện.** Cần tổng thì máy chủ đã trả sẵn
- Người dùng nhập tiền thì gửi lên **cũng dưới dạng chuỗi**
- Định dạng hiển thị: dấu chấm ngăn nghìn, `1.888.000 đ`

Ngược lại, **số lượng thì là số thật**: `soLuong`, `chiSoDau`, `mucTieuThu`, `soNguoi`, `soTang` — chúng là số nguyên hoặc số đo, không phải tiền.

### Mã trạng thái HTTP

| Mã | Nghĩa | Giao diện làm gì |
|---|---|---|
| `200` | Thành công | |
| `201` | Đã tạo mới | |
| `400` | Dữ liệu không hợp lệ | hiện lỗi ngay tại ô nhập sai |
| `401` | Chưa đăng nhập, hoặc token hết hạn / bị thu hồi | xoá token, về màn đăng nhập |
| `403` | Đã đăng nhập nhưng không đủ quyền | hiện trang "không có quyền" |
| `404` | Không tìm thấy | |
| `409` | Xung đột | trùng mã, hợp đồng chồng ngày, tạo hoá đơn lần hai |

### Hình dạng lỗi

```json
{ "thongBao": "Số điện thoại hoặc mật khẩu không đúng" }
```

Lỗi kiểm tra dữ liệu có thêm phần chỉ rõ ô nào sai:

```json
{
  "thongBao": "Dữ liệu không hợp lệ",
  "loiTruong": { "ngayChotSo": "Chỉ nhận giá trị từ 1 đến 28" }
}
```

`thongBao` **luôn là câu tiếng Việt đọc được cho người dùng cuối**, không phải mã lỗi kỹ thuật. Giao diện hiện thẳng nó ra được.

### Danh sách có phân trang

```json
{ "noiDung": [ ... ], "tongSo": 78, "trang": 0, "kichThuoc": 20 }
```

## A.2. Cặp mã và nhãn

Mọi trường kiểu liệt kê trả về **hai giá trị**: mã để mã nguồn dùng, nhãn để hiển thị. Giao diện **luôn hiện nhãn**, không tự dịch mã.

```json
{ "vaiTro": "QUAN_LY", "tenVaiTro": "Quản lý toà nhà" }
{ "trangThai": "DA_THU_MOT_PHAN", "tenTrangThai": "Đã thu một phần" }
```

Quy ước đặt tên: mã ở trường `x`, nhãn ở trường `tenX`.

### Toàn bộ tập giá trị

| Nhóm | Mã | Nhãn |
|---|---|---|
| **Vai trò** | `QTHT` · `CHU` · `QUAN_LY` · `THO` · `NGUOI_THUE` | Quản trị hệ thống · Chủ sở hữu · Quản lý toà nhà · Thợ sửa chữa · Người thuê |
| **Trạng thái tài khoản** | `HOAT_DONG` · `BI_KHOA` | Hoạt động · Bị khoá |
| **Trạng thái phòng** | `TRONG` · `DA_COC` · `DANG_THUE` · `DANG_SUA` · `NGUNG` | Trống · Đã đặt cọc · Đang thuê · Đang sửa · Ngừng khai thác |
| **Trạng thái hợp đồng** | `CHO_KY` · `DA_COC` · `HIEU_LUC` · `DA_THANH_LY` | Chờ ký · Đã cọc · Hiệu lực · Đã thanh lý |
| **Trạng thái hoá đơn** | `NHAP` · `DA_PHAT_HANH` · `DA_THU_MOT_PHAN` · `DA_THANH_TOAN` · `QUA_HAN` · `DA_HUY` | Nháp · Đã phát hành · Đã thu một phần · Đã thanh toán · Quá hạn · Đã huỷ |
| **Trạng thái yêu cầu sửa chữa** | `MOI_TIEP_NHAN` · `DA_TIEP_NHAN` · `DA_PHAN_CONG` · `DANG_XU_LY` · `CHO_XAC_NHAN` · `DA_DONG` · `DA_HUY` | Mới tiếp nhận · Đã tiếp nhận · Đã phân công · Đang xử lý · Chờ xác nhận · Đã đóng · Đã huỷ |
| **Mức độ sự cố** | `THUONG` · `GAP` · `KHAN_CAP` | Thường · Gấp · Khẩn cấp |
| **Cách tính dịch vụ** | `THEO_CHI_SO` · `CO_DINH` · `THEO_DAU_NGUOI` · `THEO_SO_LUONG` | Theo chỉ số · Cố định theo phòng · Theo đầu người · Theo số lượng |
| **Lý do bỏ qua khi tạo hoá đơn** | `THIEU_CHI_SO` · `THIEU_BANG_GIA` · `KHONG_XAC_DINH_SO_NGUOI` | Chưa ghi chỉ số · Chưa có bảng giá cho kỳ · Không xác định được số người ở |

**Chú ý:** `DA_COC` xuất hiện ở cả trạng thái phòng lẫn trạng thái hợp đồng, và đó là cố ý — chúng nói về cùng một tình trạng nhìn từ hai phía.

## A.3. Các endpoint

### Xác thực — **đã chạy thật**

```
POST /api/auth/login
```
```json
// gửi lên
{ "soDienThoai": "0900000003", "matKhau": "MatKhau@123" }

// nhận về
{
  "token": "eyJhbGciOi...",
  "thoiHanGiay": 1800,
  "nguoiDung": {
    "id": 3,
    "hoTen": "Quản lý Toà A",
    "soDienThoai": "0900000003",
    "vaiTro": "QUAN_LY",
    "tenVaiTro": "Quản lý toà nhà"
  }
}
```

```
GET /api/auth/me      → ThongTinNguoiDung (như phần nguoiDung ở trên)
```

> Sai mật khẩu và không có tài khoản trả về **cùng một thông báo** `401`. Đây là cố ý: thông báo khác nhau sẽ cho phép dò xem số nào có tài khoản, mà với một khu trọ thì đó là dò ra ai đang ở đây. Giao diện đừng cố phân biệt hai trường hợp.

### Toà nhà

```
GET    /api/toa-nha          → danh sách toà người đang đăng nhập được xem
POST   /api/toa-nha
GET    /api/toa-nha/{id}
PUT    /api/toa-nha/{id}
```
```json
{
  "id": 1,
  "maToa": "TN-A",
  "ten": "Toà A — Ngõ Hoà Bình",
  "diaChi": "Số 12 ngõ 34 đường Hoà Bình, Phường Mẫu, Hà Nội",
  "soTang": 5,
  "ngayChotSo": 1,
  "soNgayHanTt": 7,
  "tkNganHang": "0123456789 — Ngân hàng Mẫu",
  "nguongThatThoat": "10.00"
}
```

### Phòng

```
GET    /api/toa-nha/{toaNhaId}/phong          → danh sách
POST   /api/toa-nha/{toaNhaId}/phong          → tạo một phòng
POST   /api/toa-nha/{toaNhaId}/phong/hang-loat → tạo một dãy phòng
GET    /api/toa-nha/{toaNhaId}/so-do          → sơ đồ theo tầng
```
```json
{
  "id": 12,
  "toaNhaId": 1,
  "soPhong": "305",
  "tang": 3,
  "dienTich": 22.5,
  "sucChua": 4,
  "giaThueMacDinh": "3500000.00",
  "trangThai": "DANG_THUE",
  "tenTrangThai": "Đang thuê"
}
```

Sơ đồ trả về đã nhóm sẵn theo tầng, giao diện không phải tự gom:

```json
{
  "tang": [
    { "soTang": 3, "phong": [ ... ] },
    { "soTang": 2, "phong": [ ... ] }
  ],
  "tongKet": { "trong": 4, "dangThue": 15, "dangSua": 1, "daCoc": 0, "ngung": 0 }
}
```

### Dịch vụ và bảng giá

```
GET    /api/toa-nha/{toaNhaId}/dich-vu
POST   /api/toa-nha/{toaNhaId}/dich-vu
GET    /api/dich-vu/{id}/bang-gia            → toàn bộ lịch sử giá
POST   /api/dich-vu/{id}/bang-gia            → thêm một mức giá mới
GET    /api/dich-vu/{id}/bac-thang           → các bộ bậc thang theo ngày hiệu lực
POST   /api/dich-vu/{id}/bac-thang
```
```json
// dịch vụ
{
  "id": 5, "toaNhaId": 1, "ten": "Điện",
  "cachTinh": "THEO_CHI_SO", "tenCachTinh": "Theo chỉ số",
  "donViTinh": "kWh", "laDien": true, "dangSuDung": true
}

// một mức giá cố định
{ "id": 9, "dichVuId": 5, "donGia": "3500.00", "ngayHieuLuc": "2026-01-01", "dangApDung": true }

// một bậc trong biểu giá bậc thang
{
  "id": 21, "dichVuId": 5, "bac": 1,
  "tuSoLuong": 0, "denSoLuong": 100,
  "tyLe": "90.00", "donGia": "1984.00",
  "ngayHieuLuc": "2025-05-10"
}
```

`denSoLuong` của bậc cuối là `null` — nghĩa là **không có giới hạn trên**. Giao diện hiển thị `"từ 701 trở lên"`.

### Người thuê và hợp đồng

```
GET    /api/nguoi-thue?tim=...
POST   /api/nguoi-thue
GET    /api/nguoi-thue/{id}
POST   /api/nguoi-thue/{id}/anh          → tải ảnh giấy tờ lên
GET    /api/anh/{id}/lien-ket            → xin liên kết xem ảnh, hạn 15 phút

GET    /api/hop-dong?toaNhaId=&trangThai=
POST   /api/hop-dong
GET    /api/hop-dong/{id}
POST   /api/hop-dong/{id}/gia-han
POST   /api/hop-dong/{id}/thanh-ly
GET    /api/hop-dong/{id}/nguoi-o-cung
POST   /api/hop-dong/{id}/nguoi-o-cung
```
```json
// người thuê — soGiayTo đã che bớt
{
  "id": 7, "hoTen": "Nguyễn Văn Mẫu", "ngaySinh": "2005-03-14",
  "soDienThoai": "0900000006", "soGiayTo": "••••••1234",
  "queQuan": "Tỉnh Mẫu"
}

// hợp đồng
{
  "id": 3, "phongId": 12, "soPhong": "305", "nguoiThueId": 7,
  "hoTenNguoiThue": "Nguyễn Văn Mẫu",
  "ngayBatDau": "2026-08-17", "ngayKetThuc": "2027-08-16",
  "giaThue": "3500000.00", "tienCoc": "3500000.00",
  "soNgayBaoTruoc": 30,
  "trangThai": "HIEU_LUC", "tenTrangThai": "Hiệu lực",
  "sapHetHan": false, "soNgayConLai": 357
}

// liên kết xem ảnh
{ "duongDan": "https://.../anh/abc?chuKy=...", "hetHanLuc": "2026-08-24T08:05:00Z" }
```

> `sapHetHan` là **giá trị tính ra tại thời điểm gọi**, không phải một trạng thái lưu sẵn — xem CR-012. Giao diện hiện nó thành **nhãn phụ** bên cạnh trạng thái, không thay thế trạng thái.

> `soGiayTo` mặc định che bớt. Muốn xem đủ thì gọi `GET /api/nguoi-thue/{id}/so-giay-to`, và lần gọi đó **được ghi nhật ký**.

### Kỳ thanh toán và ghi chỉ số

```
GET    /api/toa-nha/{toaNhaId}/ky
POST   /api/toa-nha/{toaNhaId}/ky                → mở kỳ mới
GET    /api/ky/{kyId}/chi-so                     → danh sách phòng cần ghi
PUT    /api/ky/{kyId}/chi-so/{phongId}/{dichVuId} → ghi một phòng
GET    /api/ky/{kyId}/thieu-chi-so               → phòng còn thiếu
POST   /api/ky/{kyId}/chot
```
```json
// một dòng trong màn hình ghi chỉ số
{
  "phongId": 12, "soPhong": "305", "tang": 3,
  "dichVuId": 5, "tenDichVu": "Điện", "donViTinh": "kWh",
  "chiSoDau": 1240,
  "chiSoCuoi": 1298,
  "mucTieuThu": 58,
  "daGhi": true,
  "coAnh": true,
  "canhBao": {
    "loai": "TIEU_THU_BAT_THUONG",
    "thongBao": "Cao gấp 1,8 lần trung bình 3 kỳ gần nhất",
    "trungBinhBaKy": 32
  }
}
```

`canhBao` là `null` khi bình thường. Có giá trị thì giao diện hiện cảnh báo **nhưng vẫn cho lưu** sau khi người dùng xác nhận — đây là cảnh báo, không phải chặn.

Khi khai thay công tơ, gửi lên thêm ba trường:

```json
{
  "chiSoCuoi": 45,
  "coThayCongTo": true,
  "chiSoCuoiCongToCu": 1290,
  "chiSoDauCongToMoi": 0
}
```

### Hoá đơn

```
POST   /api/ky/{kyId}/hoa-don/tao-hang-loat
GET    /api/hoa-don?toaNhaId=&kyId=&trangThai=
GET    /api/hoa-don/{id}
PUT    /api/hoa-don/{id}                → chỉ khi đang là NHAP
POST   /api/hoa-don/{id}/phat-hanh
POST   /api/hoa-don/{id}/huy            → bắt buộc có lyDo
POST   /api/hoa-don/{id}/thanh-toan
```

Kết quả tạo hàng loạt — chú ý phần bỏ qua, giao diện phải hiện rõ:

```json
{
  "soHoaDonDaTao": 18,
  "boQua": [
    { "phongId": 14, "soPhong": "307", "lyDo": "THIEU_CHI_SO",
      "tenLyDo": "Chưa ghi chỉ số", "chiTiet": "Thiếu chỉ số điện" }
  ]
}
```

Chi tiết một hoá đơn:

```json
{
  "id": 44,
  "maHoaDon": "TN-A-305-202608",
  "hopDongId": 3, "soPhong": "305", "hoTenNguoiThue": "Nguyễn Văn Mẫu",
  "kyId": 8, "tuNgay": "2026-07-28", "denNgay": "2026-08-28", "soNgayCuaKy": 31,
  "soNguoiO": 2, "soHoQuyDoi": 1,
  "trangThai": "DA_PHAT_HANH", "tenTrangThai": "Đã phát hành",
  "hanThanhToan": "2026-09-04",
  "chiTiet": [
    { "tenKhoan": "Tiền phòng", "dienGiai": "3.500.000 ÷ 31 × 12 ngày",
      "soLuong": 12, "donViTinh": "ngày", "donGia": "112903.23", "thanhTien": "1354839.00" },
    { "tenKhoan": "Tiền điện", "dienGiai": "1.240 → 1.298 = 58 kWh × 3.500 đ",
      "soLuong": 58, "donViTinh": "kWh", "donGia": "3500.00", "thanhTien": "203000.00" },
    { "tenKhoan": "Làm tròn", "dienGiai": "đến 1.000 đ",
      "soLuong": null, "donViTinh": null, "donGia": null, "thanhTien": "161.00" }
  ],
  "cong": "1887839.00",
  "tongTien": "1888000.00",
  "daThu": "0.00",
  "conNo": "1888000.00"
}
```

**Ba điều giao diện phải xử lý đúng ở đây:**

1. `thanhTien` của dòng làm tròn **có thể âm** — `"-200.00"`. Không được giấu đi, và không được tô như lỗi.
2. `soLuong`, `donViTinh`, `donGia` có thể là `null` với các dòng không có đơn giá (làm tròn, khoản giảm trừ). Giao diện để trống ô đó, không hiện `null`.
3. `dienGiai` là **thứ khiến người thuê tin được con số**. Luôn hiện, đừng cắt bớt cho gọn.

Với hoá đơn tính bậc thang, mỗi bậc là một dòng trong `chiTiet`:

```json
{ "tenKhoan": "Tiền điện — Bậc 1", "dienGiai": "0–200 kWh (định mức 100 × 2 hộ)",
  "soLuong": 200, "donViTinh": "kWh", "donGia": "1984.00", "thanhTien": "396800.00" }
```

### Thanh toán

```json
// gửi lên
{ "soTien": "500000", "hinhThuc": "CHUYEN_KHOAN", "ghiChu": "..." }

// nhận về
{ "id": 91, "maBienLai": "BL-202608-0091", "soTien": "500000.00",
  "thoiDiem": "2026-08-30T09:12:00Z", "nguoiGhi": "Quản lý Toà A",
  "hoaDonSauKhiThu": { "daThu": "500000.00", "conNo": "1388000.00",
                       "trangThai": "DA_THU_MOT_PHAN", "tenTrangThai": "Đã thu một phần" } }
```

> **Không có endpoint xoá thanh toán.** Sửa sai bằng cách lập bút toán đối ứng: `POST /api/thanh-toan/{id}/doi-ung` kèm `lyDo` bắt buộc. Giao diện đừng thiết kế nút thùng rác ở đây.

### Cổng người thuê

```
GET    /api/cong/hoa-don-moi-nhat
GET    /api/cong/hoa-don?soKy=12
GET    /api/cong/hoa-don/{id}
GET    /api/cong/tieu-thu?soKy=12       → dữ liệu vẽ biểu đồ
GET    /api/cong/hop-dong
```

Hình dạng hoá đơn giống hệt phần trên. Máy chủ **tự giới hạn theo người đang đăng nhập** — không truyền `phongId` lên, và có truyền cũng bị bỏ qua.

### Sửa chữa

```
GET    /api/yeu-cau-sua-chua?toaNhaId=&trangThai=
POST   /api/yeu-cau-sua-chua              → người thuê tạo, tối đa 5 ảnh
GET    /api/yeu-cau-sua-chua/{id}
POST   /api/yeu-cau-sua-chua/{id}/phan-cong
POST   /api/yeu-cau-sua-chua/{id}/hoan-thanh
GET    /api/tho/viec-cua-toi              → màn hình của thợ
```
```json
{
  "id": 17, "maYeuCau": "SC-202608-0017",
  "toaNha": "Toà A", "soPhong": "305", "tang": 3,
  "hangMuc": "Điện nước", "moTa": "Vòi nước nhà tắm rỉ liên tục",
  "mucDo": "THUONG", "tenMucDo": "Thường",
  "trangThai": "DA_PHAN_CONG", "tenTrangThai": "Đã phân công",
  "soDienThoaiLienHe": "0900000006",
  "anh": [ { "id": 55 }, { "id": 56 } ],
  "chiPhi": null, "benChiuChiPhi": null,
  "taoLuc": "2026-08-22T14:03:00Z"
}
```

`anh` chỉ có `id`. Muốn hiện thì gọi `GET /api/anh/{id}/lien-ket` cho từng ảnh — **không có đường dẫn sẵn**, xem quy ước 6 ở mục 3.

### Tổng quan và báo cáo

```
GET    /api/tong-quan?toaNhaId=&tuNgay=&denNgay=
GET    /api/bao-cao/cong-no?toaNhaId=
GET    /api/nhac-viec
```
```json
{
  "doanhThuPhatHanh": "142500000.00",
  "daThu": "118200000.00",
  "conNo": "24300000.00",
  "tyLeLapDay": 0.87,
  "soPhongTrong": 4,
  "soSuCoDangMo": 3,
  "congNo": [
    { "soPhong": "307", "hoTenNguoiThue": "…", "soTien": "1888000.00", "soNgayQuaHan": 23 }
  ]
}
```

`congNo` **đã sắp theo `soNgayQuaHan` giảm dần** — nợ lâu nhất lên đầu. Giao diện không cần sắp lại.

`tyLeLapDay` là số thật trong khoảng 0–1, **không phải tiền**. Hiển thị thành `87%`.

## A.4. Bốn điều dễ làm sai

**1. Đừng tính toán số tiền ở giao diện.** Kể cả phép cộng đơn giản. Cần tổng thì máy chủ trả sẵn `cong`, `tongTien`, `daThu`, `conNo`. Nếu thiếu con số nào thì báo để bổ sung endpoint, đừng tự cộng.

**2. Đừng tự dịch mã trạng thái.** Máy chủ trả kèm `tenTrangThai` rồi. Tự dịch thì hai chỗ lệch nhau, và tiếng Việt trong mã giao diện sẽ khác tiếng Việt trong báo cáo.

**3. Đừng lưu đường dẫn ảnh.** Liên kết hết hạn sau 15 phút. Mỗi lần mở ảnh là một lần xin liên kết mới. Giao diện cần trạng thái *đang lấy liên kết* và *liên kết đã hết hạn, bấm để lấy lại*.

**4. Gặp `401` thì xoá token và về màn đăng nhập ngay.** `401` không chỉ nghĩa là hết hạn — nó cũng xảy ra khi tài khoản bị khoá hoặc bị thu hồi quyền, và lúc đó token đã chết hẳn. Đừng thử gọi lại.
