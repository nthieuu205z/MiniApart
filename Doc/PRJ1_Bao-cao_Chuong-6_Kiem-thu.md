# CHƯƠNG 6. KIỂM THỬ VÀ ĐÁNH GIÁ

> **Trạng thái:** phần chiến lược và thiết kế ca kiểm thử viết được trọn vẹn ngay. Phần kết quả `[ĐIỀN]` sau khi chạy thật.
>
> **Lưu ý phân biệt.** Chương này nói về **kiểm thử phần mềm**. Đừng nhầm với mục 2.5 — mục đó là **xác minh yêu cầu**, tức kiểm tra chất lượng của bản đặc tả (yêu cầu có rõ ràng không, có truy vết được không), một việc hoàn toàn khác.

---

## 6.1. Vì sao hệ thống này cần chiến lược kiểm thử riêng

Phần lớn lỗi phần mềm tự thông báo sự tồn tại của mình: chương trình dừng, màn hình hiện thông báo, bản ghi nhật ký xuất hiện dòng đỏ. Lỗi tính tiền **không thuộc loại đó**. Nó có ba đặc điểm khiến việc kiểm thử thông thường không đủ:

**Thứ nhất, nó im lặng.** Một hoá đơn ghi sai vài trăm đồng trông không khác gì hoá đơn đúng. Không có ngoại lệ nào được ném ra, không có bản ghi nào báo lỗi. Chương trình chạy xong và báo thành công.

**Thứ hai, hậu quả là tiền thật của người thật.** Đây không phải lỗi hiển thị sai một nhãn. Người thuê hoặc bị thu thừa, hoặc chủ trọ bị thất thu, và cả hai trường hợp đều làm mất niềm tin vào hệ thống — trong khi minh bạch tiền bạc chính là mục tiêu số một nêu ở mục 1.2.

**Thứ ba, nó lộ ra muộn.** Sai sót thường chỉ bị phát hiện khi có người đối chiếu tổng thu cuối kỳ, hoặc khi người thuê khiếu nại. Đến lúc đó, hoá đơn đã phát hành, tiền đã thu, và việc sửa kéo theo phải tính lại dữ liệu lịch sử.

Phiếu **CR-008** trong lô thay đổi số 01 là ví dụ đúng loại này: thiếu một trường đánh dấu khoản phát sinh đã được tính, hệ thống sẽ **thu tiền sửa chữa lặp lại mỗi kỳ** cho một lần sửa duy nhất, mà không hề báo lỗi. Nếu không có ca kiểm thử chạy hai kỳ liên tiếp để đối chiếu, lỗi này có thể tồn tại nhiều tháng.

Kết luận: với hệ thống này, câu hỏi cần trả lời khi bảo vệ không phải *"phần mềm làm được những gì"* mà là ***"làm sao biết nó tính đúng"***. Chương này là câu trả lời.

## 6.2. Chiến lược ba tầng

### Tầng 1 — Ca kiểm thử ví dụ

Mỗi quy tắc từ BR-01 đến BR-19 có tối thiểu ba ca: một ca thông thường, một ca ở biên, một ca ngoại lệ.

**Ca kiểm thử số một** được chép nguyên từ ví dụ tính hoá đơn ở mục 2.4.4.5, giữ nguyên từng con số:

| Khoản mục | Dữ liệu | Kết quả kỳ vọng |
|---|---|---|
| Tiền phòng | 3.500.000 đ/tháng, ở 12 ngày trong kỳ 31 ngày | 1.354.838,71 đ |
| Tiền điện | Chỉ số 1240 → 1298, đơn giá 3.500 đ/kWh | 203.000 đ |
| Tiền nước | Chỉ số 210 → 214, đơn giá 25.000 đ/m³ | 100.000 đ |
| Phí gửi xe | | 30.000 đ |
| Phí vệ sinh | | 100.000 đ |
| Phí internet | | 100.000 đ |
| **Cộng** | | **1.887.838,71 đ** |
| Làm tròn đến nghìn, quy tắc nửa lên (BR-15) | Dòng chênh lệch +161,29 đ | **1.888.000 đ** |

Ca kiểm thử này có giá trị đặc biệt khi bảo vệ: nó **nối thẳng tài liệu phân tích với mã nguồn đang chạy**. Trình chiếu nó là chứng minh được rằng đặc tả không phải viết cho đẹp, mà đã được cài đặt và kiểm chứng đúng như đã viết.

### Tầng 2 — Kiểm thử theo tính chất

Thay vì liệt kê từng ca cụ thể, tầng này phát biểu những **tính chất phải luôn đúng**, rồi để máy sinh hàng nghìn bộ dữ liệu ngẫu nhiên tìm cách phá:

| # | Tính chất bất biến | Quy tắc liên quan |
|---|---|---|
| P1 | Tổng các dòng chi tiết, cộng dòng làm tròn, **luôn** bằng tổng tiền hoá đơn | BR-15 |
| P2 | Tiền điện tính bậc thang **luôn** lớn hơn hoặc bằng tiền tính theo đơn giá bậc một | BR-02b |
| P3 | Tiền phòng tính theo ngày của một kỳ trọn vẹn **luôn** bằng đúng giá thuê tháng | BR-01, BR-06 |
| P4 | Với mọi dãy thanh toán, "đã thu" **luôn** bằng tổng đại số các bút toán | BR-08, BR-18 |
| P5 | Số dư khả dụng **không bao giờ** âm | BR-13 |
| P6 | Mức tiêu thụ **không bao giờ** âm, kể cả khi có thay công tơ | BR-09 |

Tầng này tìm ra loại lỗi mà con người **không nghĩ tới khi ngồi liệt kê ca** — đặc biệt là lỗi làm tròn ở đúng ranh giới giữa các bậc thang, nơi một chênh lệch một đơn vị làm nhảy sang bậc giá khác.

### Tầng 3 — Kiểm thử bất biến lịch sử

Tầng này ứng với NFR-CMP-02: *hoá đơn cũ in lại phải ra đúng số cũ*. Kịch bản:

1. Tạo hoá đơn cho một kỳ, chốt kỳ, ghi lại tổng tiền
2. **Cố ý thay đổi** bảng giá dịch vụ, số người ở của phòng, và đơn giá trong hợp đồng
3. In lại hoá đơn của kỳ cũ
4. Khẳng định con số **không đổi**

Đây là tầng kiểm thử chứng minh hai phiếu CR-002 và CR-003 đã được xử lý đúng — cụ thể là việc kết tinh nhân khẩu xuống bảng `NHAN_KHAU_KY` khi chốt kỳ, và việc lưu đơn giá đã áp dụng vào `CHI_TIET_HOA_DON` thay vì tra ngược sang bảng giá.

## 6.3. Kiểm thử phân quyền theo hướng tấn công

Yêu cầu FR-POR-04 — *người thuê chỉ truy cập được dữ liệu phòng mình* — là yêu cầu **an ninh**, không phải yêu cầu hiển thị. Kiểm thử nó bằng cách đăng nhập rồi nhìn màn hình là **không đủ**, vì màn hình chỉ phản ánh những gì giao diện chọn hiển thị.

Cách kiểm thử đúng là mô phỏng hành vi của người cố tình vượt quyền:

| Mã ca | Kịch bản | Kết quả kỳ vọng |
|---|---|---|
| SEC-01 | Đăng nhập tài khoản người thuê phòng 101, gọi thẳng API hoá đơn của phòng 102 bằng mã định danh đoán được | 403 Forbidden |
| SEC-02 | Gọi API quản trị bằng token của vai trò người thuê | 403 Forbidden |
| SEC-03 | Gọi API không kèm token | 401 Unauthorized |
| SEC-04 | Dùng lại liên kết ảnh đã ký sau khi quá 15 phút | Từ chối |
| SEC-05 | Quản lý toà A gọi API dữ liệu của toà B | 403 Forbidden |
| SEC-06 | Gửi yêu cầu sửa bản ghi nhật ký thao tác | Từ chối ở tầng cơ sở dữ liệu |

Ba ca SEC-01, SEC-02, SEC-05 đã được mô hình hoá từ giai đoạn thiết kế: **Hình 3.20 ở mục 3.8.4** có riêng một khối minh hoạ người thuê phòng 101 gọi thẳng API hoá đơn phòng 102 và nhận `403 Forbidden`. Bộ ca kiểm thử ở đây là bản hiện thực hoá khối đó.

Ca **SEC-01** nên được demo trực tiếp khi bảo vệ. Nó chứng minh nhóm hiểu rằng phân quyền phải chặn ở **tầng máy chủ**, chứ không phải bằng cách ẩn nút trên giao diện — ranh giới phân biệt rõ giữa hiểu đúng và hiểu sai về bảo mật ứng dụng web.

## 6.4. Kiểm thử đối chiếu với yêu cầu phi chức năng

Tài liệu phân tích đặc tả 36 yêu cầu phi chức năng, **mỗi yêu cầu đều kèm cách đo**. Đó là điều kiện đủ để nghiệm thu bằng số liệu thay vì bằng cảm nhận. Một số ca tiêu biểu:

| Yêu cầu | Cách đo | Kết quả |
|---|---|---|
| NFR-PER-02 (thời gian tạo hoá đơn hàng loạt) | Đo thời gian tạo hoá đơn cho `[ĐIỀN]` phòng | `[ĐIỀN]` |
| NFR-SEC-01 (mã hoá đường truyền) | Kiểm tra chứng chỉ và giao thức bằng công cụ quét | `[ĐIỀN]` |
| NFR-SEC-04 (ảnh phát qua liên kết có hạn) | Ca SEC-04 ở mục 6.3 | `[ĐIỀN]` |
| NFR-CMP-02 (in lại hoá đơn cũ) | Tầng 3 ở mục 6.2 | `[ĐIỀN]` |
| NFR-REL-04 (không để hoá đơn dở dang khi lỗi) | Gây lỗi có chủ đích ở giữa quá trình tạo hoá đơn, kiểm tra không còn bản ghi rác | `[ĐIỀN]` |

> **Ghi chú.** Bảng trên là trích. Bảng đầy đủ 36 yêu cầu nằm ở phụ lục, lấy từ sheet `NFR` của tệp ma trận yêu cầu.

## 6.5. Kiểm thử tự động trong quy trình tích hợp

Toàn bộ các tầng kiểm thử trên chạy tự động qua GitHub Actions **trước mỗi lần triển khai**. Thứ tự các bước:

1. Biên dịch mã nguồn
2. Chạy kiểm thử đơn vị và kiểm thử theo tính chất (gói `billing.calc`)
3. Chạy luật ArchUnit — cấm `double`/`float` cho tiền, cấm gói `calc` phụ thuộc Spring
4. Chạy kiểm thử tích hợp trên PostgreSQL thật dựng bằng Testcontainers
5. **Chỉ khi tất cả xanh** mới dựng ảnh Docker và đưa lên máy chủ

Ý nghĩa: bộ kiểm thử cho phần tính tiền **không phụ thuộc vào việc có ai nhớ chạy hay không**. Không thể đưa lên máy chủ một phiên bản mà kiểm thử đang đỏ.

## 6.6. Kết quả kiểm thử

`[ĐIỀN sau khi chạy thật]`

| Nhóm | Số ca | Đạt | Không đạt | Ghi chú |
|---|---|---|---|---|
| Quy tắc nghiệp vụ (BR-01 → BR-19) | | | | |
| Kiểm thử theo tính chất | | | | |
| Bất biến lịch sử | | | | |
| Phân quyền | | | | |
| Tích hợp | | | | |
| **Tổng** | | | | |

## 6.7. Những lỗi đáng chú ý đã phát hiện

`[ĐIỀN — mục này rất đáng viết, xem ghi chú cuối chương]`

| # | Lỗi | Phát hiện bởi | Nguyên nhân | Cách xử lý |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |

## 6.8. Đánh giá chung

`[ĐIỀN]` — cần trả lời ba câu: hệ thống đạt bao nhiêu phần trăm yêu cầu trong phạm vi; những yêu cầu nào chưa đạt và vì sao; mức độ tin cậy của phần tính tiền dựa trên bằng chứng nào.

---

## Ghi chú cho người viết chương này

**Mục 6.7 là mục đáng đầu tư nhất mà cũng hay bị bỏ trống nhất.** Nhiều nhóm ngại viết vì nghĩ rằng thừa nhận có lỗi là điểm trừ. Thực tế ngược lại: một bộ kiểm thử **không bắt được lỗi nào** thì hoặc là bộ kiểm thử quá yếu, hoặc là nhóm không thật sự chạy nó. Người chấm biết điều đó.

Cách viết tốt cho mỗi lỗi: ghi rõ **tầng kiểm thử nào bắt được**, và **lỗi đó sẽ gây hậu quả gì nếu lọt ra sản phẩm thật**. Lỗi bị bắt bởi kiểm thử theo tính chất đặc biệt đáng kể, vì đó là loại lỗi con người không nghĩ tới khi liệt kê ca.

Hai điều cần tránh:

- **Đừng điền số liệu ước chừng vào mục 6.6.** Chạy thật rồi chép kết quả thật. Số liệu bịa rất dễ bị phát hiện khi bị hỏi cách đo.
- **Đừng ghi "100% ca đạt" nếu chưa từng có ca nào đỏ.** Nếu đúng là chưa lỗi nào bị bắt, hãy nói thẳng điều đó và nêu nhận định về giới hạn của bộ kiểm thử hiện tại — trung thực về giới hạn được đánh giá cao hơn một con số tròn trịa.
