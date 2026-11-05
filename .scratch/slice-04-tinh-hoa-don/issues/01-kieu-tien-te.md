# 01: Kiểu tiền tệ và bộ khung `billing/calc`

**What to build:** Một kiểu `TienTe` bọc `BigDecimal`, và bộ khung các kiểu dữ liệu vào-ra của phần tính tiền. Không có phép tính nghiệp vụ nào ở ticket này.

**Vì sao bọc lại thay vì dùng thẳng `BigDecimal`.** Sơ đồ lớp Chương 3 (`11-class-billing-calc.mmd`) đã có lớp `TienTe` — đây là chép theo thiết kế, không phải sáng tạo thêm. Lợi ích thực tế: `BigDecimal` trần cho phép cộng tiền với một số lượng kWh mà trình biên dịch không phản đối. Một kiểu riêng thì không.

Cũng ở ticket này: đặt xong các kiểu vào-ra để ticket 02 có cái mà viết kiểm thử. Kiểm thử không biên dịch được thì không viết trước được.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `TienTe` bọc `BigDecimal`, **bất biến**, luôn giữ đúng 2 chữ số thập phân
- [x] Không có phương thức nào nhận hay trả `double`/`float` — ArchUnit đã canh, nhưng đừng để nó phải cắn
- [x] So sánh bằng **giá trị**, không bằng `equals` mặc định của `BigDecimal` — `1.00` và `1.0` phải bằng nhau. Đây là bẫy kinh điển của `BigDecimal`
- [x] Cộng, trừ, nhân với một số lượng; **không có phép chia trần** — mọi phép chia phải nói rõ làm tròn thế nào
- [x] Cho phép **giá trị âm**: dòng làm tròn ở BR-15 có thể âm, và khoản giảm trừ cũng âm
- [x] Các kiểu vào-ra của phép tính hoá đơn: kỳ, hợp đồng, chỉ số, biểu giá, số người ở, khoản phát sinh — đều là bản ghi bất biến, **không phải thực thể JPA**
- [x] Tên lớp và thuộc tính khớp `Doc/diagrams-v2/11-class-billing-calc.mmd` về tên và cấu trúc; `BoiCanhTinh.soNguoiOTrongKy` dùng `Integer` để giữ trạng thái “không xác định” theo CR-002, thay vì làm mất trạng thái đó khi dùng `int`
- [x] Toàn bộ nằm trong `com.prj1.ccm.billing.calc`, và luật ArchUnit vẫn xanh

## Comments

- Đã thêm `TienTe` bất biến và các bản ghi/enums dữ liệu thuần cho gói `billing/calc`; chưa thêm phép tính nghiệp vụ.
- TDD: test nền đỏ do thiếu kiểu dữ liệu, sau đó xanh sau khi cài đặt. Test tập trung và toàn bộ backend đều `BUILD SUCCESSFUL`.
- Ruling về `Integer`: ticket 04 yêu cầu phân biệt “không xác định” với `0`; `int` không biểu diễn được trạng thái này. Giữ nullable ở boundary thuần và không sửa sơ đồ trong `Doc/`.
- Review ghi nhận production đã dùng `List.copyOf(...)`; coverage trực tiếp cho danh sách của `KetQuaTinhHoaDon` được deferred như minor để không mở rộng ticket.
