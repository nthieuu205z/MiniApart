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

Ký hiệu: 📱 dùng chủ yếu trên điện thoại · 🖨 phải in được · ★ màn hình quyết định thành bại

### Mức 1 — cần thiết kế ngay

| # | Màn hình | Ai dùng | Ghi chú |
|---|---|---|---|
| 1 | Đăng nhập | tất cả | đã có, cần chuẩn hoá |
| 2 | Quên mật khẩu (mã OTP 5 phút) | tất cả | |
| 3 | Trang chủ — 5 biến thể theo vai trò | tất cả | 📱 |
| 4 | Quản lý tài khoản | QTHT | không có nút xoá |
| 5 | Danh sách toà nhà | Chủ, QL | |
| 6 | Khai báo / sửa toà nhà | Chủ | |
| 7 | Danh sách phòng + tạo hàng loạt | QL | tạo dãy 201–208 một lần |
| 8 | **Sơ đồ phòng theo tầng** ★ | Chủ, QL | màu **và** nhãn chữ |
| 9 | Khai báo dịch vụ (4 cách tính) | QL | |
| 10 | Bảng giá theo ngày hiệu lực | QL | hiện cả lịch sử giá |
| 11 | Biểu giá điện bậc thang | QL | 5 bậc, nhập theo tỷ lệ |
| 12 | Danh sách người thuê | QL | số giấy tờ che bớt |
| 13 | Hồ sơ người thuê + ảnh giấy tờ | QL | ảnh qua liên kết 15 phút |
| 14 | Danh sách hợp đồng | QL | |
| 15 | Ký hợp đồng | QL | nhiều bước, dễ bỏ dở |
| 16 | Chi tiết hợp đồng + người ở cùng | QL | |
| 17 | Danh sách kỳ thanh toán | QL | |
| 18 | **Ghi chỉ số công tơ** ★★★ | QL | 📱 quan trọng nhất |
| 19 | Khai báo thay công tơ | QL | 📱 4 ô chỉ số |
| 20 | Chốt kỳ + danh sách phòng còn thiếu | QL | |
| 21 | Tạo hoá đơn hàng loạt + báo cáo bỏ qua | QL | |
| 22 | Danh sách hoá đơn | QL, Chủ | |
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
| 30 | Công nợ, sắp theo số ngày quá hạn | Chủ, QL | |
| 31 | Thanh lý hợp đồng + quyết toán cọc | QL | |
| 32 | **Trang chủ người thuê** ★★ | Người thuê | 📱 hiện ngay hoá đơn mới nhất |
| 33 | Hoá đơn bản người thuê | Người thuê | 📱🖨 |
| 34 | Lịch sử 12 kỳ | Người thuê | 📱 |
| 35 | Biểu đồ tiêu thụ điện nước 12 kỳ | Người thuê | 📱 |
| 36 | Thông tin hợp đồng + cảnh báo sắp hết hạn | Người thuê | 📱 |
| 37 | Báo hỏng (tối đa 5 ảnh) | Người thuê | 📱 |
| 38 | Danh sách yêu cầu sửa chữa | QL | |
| 39 | Chi tiết + phân công thợ | QL | |
| 40 | **Việc của tôi** ★ | Thợ | 📱 đơn giản nhất hệ thống |
| 41 | **Bảng tổng quan** ★★ | Chủ | 📱 ba câu hỏi của anh Minh |
| 42 | Bảng nhắc việc (5 nhóm) | QL | |

### Mức 3 — còn xa, thiết kế sau

| # | Màn hình | Ai dùng |
|---|---|---|
| 43 | Soạn thông báo theo toà / tầng / phòng | QL |
| 44 | Hộp thông báo | tất cả |
| 45 | Báo cáo công nợ (xuất Excel) | Chủ |
| 46 | Báo cáo tiêu thụ điện nước | Chủ |
| 47 | Báo cáo chi phí bảo trì | Chủ |
| 48 | Lịch sử sửa chữa theo phòng | QL |
| 49 | Hồ sơ PCCC | Chủ |
| 50 | Thiết bị PCCC + hạn kiểm định | Chủ |
| 51 | Danh mục tự kiểm tra an toàn | QL |
| 52 | Nhật ký thao tác | QTHT, Chủ |
| 53 | Chỉ số công tơ tổng + cảnh báo thất thoát | Chủ |

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

Mỗi màn hình cần **bản điện thoại** trước, **bản máy tính** sau — trừ các màn hình báo cáo thì ngược lại.
