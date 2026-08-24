# CHƯƠNG 7. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

> **Trạng thái: KHUNG.** Viết sau cùng, khi đã biết thực tế đạt được đến đâu.

---

## 7.1. Kết quả đạt được

`[ĐIỀN]`

Cần trả lời gọn ba câu, không dài dòng:

1. **Hệ thống làm được gì** — nêu theo luồng nghiệp vụ, không liệt kê chức năng rời rạc
2. **Đạt bao nhiêu trên tổng phạm vi** — con số thật từ mục 5.6
3. **Điều gì làm được tốt hơn mong đợi**

## 7.2. Đóng góp đáng kể nhất của đồ án

`[ĐIỀN — gợi ý bên dưới]`

Mục này trả lời câu: *"nếu chỉ được kể một điều về đồ án này, thì đó là gì?"*

Dựa trên những gì đã làm, ba ứng viên mạnh nhất:

**Ứng viên 1 — Phần tính tiền được kiểm chứng chứ không chỉ được viết.** Chiến lược ba tầng ở Chương 6, đặc biệt là kiểm thử theo tính chất và kiểm thử bất biến lịch sử, là thứ ít đồ án sinh viên có. Đa số trình bày được *hệ thống làm gì*; rất ít trình bày được *làm sao biết nó tính đúng*.

**Ứng viên 2 — Đợt rà soát mô hình dữ liệu tự phát hiện 14 vấn đề.** Lô phiếu thay đổi số 01 cho thấy nhóm không chỉ viết ra một quy trình quản lý thay đổi rồi để đó, mà đã dùng nó thật. Đáng nhấn mạnh: cả 14 vấn đề được tìm ra bằng **một thao tác cơ học duy nhất** — với mỗi quy tắc nghiệp vụ, liệt kê những trường dữ liệu mà công thức của nó cần đọc, rồi đối chiếu xem trường đó có tồn tại trong mô hình không. Thao tác này **chỉ thực hiện được vì mục 2.4.4 đã viết quy tắc thành công thức tường minh**; nếu quy tắc chỉ mô tả bằng lời chung chung thì không rà được.

**Ứng viên 3 — Xử lý đúng bài toán giá điện bậc thang theo định mức đầu người.** Đây là phần nghiệp vụ khó nhất và cũng là điểm khác biệt đã tuyên bố ở mục 2.2.5.2.

> Chọn **một** ứng viên làm luận điểm chính, hai cái còn lại nhắc thoáng qua. Nêu cả ba ngang nhau sẽ làm loãng.

## 7.3. Hạn chế

`[ĐIỀN]`

Mục này **bắt buộc phải có nội dung thật**. Nhóm viết "không có hạn chế nào" là tự đặt mình vào thế bí khi bị hỏi. Những hạn chế đã biết trước, có thể viết ngay:

| Hạn chế | Chi tiết |
|---|---|
| **Dữ liệu khảo sát là giả định** | Mục 2.2.6 đã khai báo trung thực điều này. Nhóm không phỏng vấn được chủ trọ và người thuê thật, nên các con số về quy mô và tần suất là ước lượng. |
| **Không kiểm chứng với người dùng thật** | Hệ thống chưa từng vận hành trên một toà nhà thật trong một kỳ thanh toán thật. |
| **12 yêu cầu mức Could have ngoài phạm vi** | Đã liệt kê ở Vertical Slice 12 của kế hoạch triển khai. |
| **Không tích hợp ngân hàng** | Đối soát sao kê (FR-INV-15) bị loại khỏi phạm vi vì phụ thuộc định dạng tệp riêng của từng ngân hàng. |
| **Thông báo chỉ trong ứng dụng** | Không gửi email hay tin nhắn ra ngoài, đúng giới hạn của FR-NTF-07. |
| `[ĐIỀN thêm]` | Những hạn chế phát sinh trong quá trình làm |

## 7.4. Bài học rút ra

`[ĐIỀN — mục này thường được đánh giá cao nếu viết thật]`

Viết về **quá trình**, không viết về sản phẩm. Vài hướng có thể khai thác, tuỳ trải nghiệm thật của nhóm:

- Giá trị của việc viết quy tắc nghiệp vụ thành **công thức tường minh** thay vì mô tả bằng lời — đã chứng minh qua đợt rà soát ở mục 7.2
- Vì sao **viết kiểm thử trước** lại làm lộ ra các câu hỏi thiết kế sớm hơn, lúc chưa tốn công cài đặt
- Chi phí thật của việc phát hiện lỗi mô hình dữ liệu **muộn** so với **sớm**
- Cách làm việc nhóm khi phần lớn mã do công cụ hỗ trợ sinh ra: trọng tâm dịch chuyển từ *viết mã* sang *kiểm soát và kiểm chứng mã*

## 7.5. Hướng phát triển

`[ĐIỀN]`

Xếp theo giá trị thực tế, không liệt kê tràn lan cho dài:

| Hướng | Vì sao đáng làm |
|---|---|
| Hoàn thiện 12 yêu cầu Could have | Đã có thiết kế, chỉ thiếu thời gian |
| Đối soát sao kê ngân hàng tự động | Khâu tốn công nhất của chủ trọ hiện nay |
| Ứng dụng di động cho người ghi chỉ số | Màn hình ghi chỉ số là màn hình dùng nhiều nhất, ở điều kiện khó nhất |
| Hỗ trợ nhiều chủ sở hữu trên cùng hệ thống | Mở đường cho mô hình dịch vụ cho thuê phần mềm |
| `[ĐIỀN thêm]` | |

## 7.6. Về đạo đức xử lý dữ liệu cá nhân

`[ĐIỀN — mục ngắn nhưng nên có]`

Hệ thống lưu số giấy tờ tuỳ thân và ảnh giấy tờ của người thuê — thuộc nhóm dữ liệu cá nhân cần bảo vệ. Trong khuôn khổ đồ án, nhóm đã: chỉ dùng dữ liệu bịa cho toàn bộ phần trình diễn; không đưa dữ liệu thật của người thật lên máy chủ; và thiết kế cơ chế phát ảnh qua liên kết có hạn thay vì để ảnh truy cập tự do.

Nếu hệ thống được đưa vào dùng thật, cần bổ sung: cơ chế cho phép người thuê yêu cầu xoá dữ liệu của mình sau khi kết thúc hợp đồng, và chính sách quy định thời hạn lưu trữ.

> Mục này ngắn thôi, nhưng cho thấy nhóm nghĩ xa hơn phạm vi bài tập. Nó cũng là chỗ tự nhiên để nhắc lại NFR-SEC-04 và phiếu CR-013.

---

## Ghi chú cho người viết chương này

**Đừng viết kết luận theo kiểu tổng kết lại toàn bộ báo cáo.** Người đọc vừa đọc xong sáu chương, không cần đọc lại tóm tắt. Chương này trả lời ba câu khác: *đạt được gì, chưa làm được gì, và tiếp theo nên làm gì.*

**Mục 7.3 và 7.4 là hai mục phân biệt báo cáo tốt với báo cáo trung bình.** Chúng đòi hỏi nhìn lại một cách trung thực, và đó là thứ không sao chép được từ đâu.
