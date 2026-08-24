# 01: Kiểu tiền tệ và bộ khung `billing/calc`

**What to build:** Một kiểu `TienTe` bọc `BigDecimal`, và bộ khung các kiểu dữ liệu vào-ra của phần tính tiền. Không có phép tính nghiệp vụ nào ở ticket này.

**Vì sao bọc lại thay vì dùng thẳng `BigDecimal`.** Sơ đồ lớp Chương 3 (`11-class-billing-calc.mmd`) đã có lớp `TienTe` — đây là chép theo thiết kế, không phải sáng tạo thêm. Lợi ích thực tế: `BigDecimal` trần cho phép cộng tiền với một số lượng kWh mà trình biên dịch không phản đối. Một kiểu riêng thì không.

Cũng ở ticket này: đặt xong các kiểu vào-ra để ticket 02 có cái mà viết kiểm thử. Kiểm thử không biên dịch được thì không viết trước được.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `TienTe` bọc `BigDecimal`, **bất biến**, luôn giữ đúng 2 chữ số thập phân
- [ ] Không có phương thức nào nhận hay trả `double`/`float` — ArchUnit đã canh, nhưng đừng để nó phải cắn
- [ ] So sánh bằng **giá trị**, không bằng `equals` mặc định của `BigDecimal` — `1.00` và `1.0` phải bằng nhau. Đây là bẫy kinh điển của `BigDecimal`
- [ ] Cộng, trừ, nhân với một số lượng; **không có phép chia trần** — mọi phép chia phải nói rõ làm tròn thế nào
- [ ] Cho phép **giá trị âm**: dòng làm tròn ở BR-15 có thể âm, và khoản giảm trừ cũng âm
- [ ] Các kiểu vào-ra của phép tính hoá đơn: kỳ, hợp đồng, chỉ số, biểu giá, số người ở, khoản phát sinh — đều là bản ghi bất biến, **không phải thực thể JPA**
- [ ] Tên lớp và thuộc tính khớp `Doc/diagrams-v2/11-class-billing-calc.mmd`
- [ ] Toàn bộ nằm trong `com.prj1.ccm.billing.calc`, và luật ArchUnit vẫn xanh
