# Soát lỗi sau Slice 04 — việc phải xong trước khi mở Slice 05

**Nguồn:** phiên review mã ngày 2026-08-31, sau khi Slice 00–04 đóng (commit `11df994`).

## Bối cảnh

Slice 00–04 đã xong: 37/38 ticket `done`, chỉ còn `slice-00/08-github-actions`. Toàn bộ 46 lớp test backend xanh, `billing/calc` có đủ ba tầng kiểm thử theo mục 5 kế hoạch, jqwik đã có trong `build.gradle`.

Nhưng một đợt soát mã có chủ đích tìm ra **năm chỗ hở**, trong đó **hai chỗ là vi phạm BR-17 thật sự**, không phải chuyện siết công cụ. Cả năm đều nằm ở phần đã đánh dấu `done` — nghĩa là chúng lọt qua được cả ticket lẫn kiểm thử, và sẽ tiếp tục lọt nếu không có ticket riêng.

## Vì sao gom thành một thư mục riêng, không nhét vào slice cũ

Ba lý do:

1. **Slice cũ đã đóng.** Mở lại ticket đã `done` làm mất dấu vết "cái gì xong lúc nào" — thứ mà thầy đọc để theo tiến độ.
2. **Đây không phải một lát cắt dọc.** Không có tính năng mới nào cho người dùng thấy; đúng bản chất là nợ kỹ thuật và nợ bảo mật.
3. **Phải xong trước Slice 05.** Slice 05 (Thanh toán và công nợ) thêm tiền vào một chỗ mới và thêm bút toán đối ứng. Hai ticket về ràng buộc máy (04, 05) rẻ khi `billing` mới có 26 lớp, đắt hơn hẳn khi slice 05 nhân đôi số đó.

## Thứ tự làm

| # | Ticket | Loại | Chặn Slice 05? |
|---|---|---|---|
| 01 | Chặn ảnh giấy tờ theo toà — BR-17 | Bảo mật | **Có** |
| 02 | Ghi nhật ký mọi lượt xem ảnh giấy tờ — BR-17 | Bảo mật | **Có** |
| 03 | Chốt ranh giới quyền của QTHT | Quyết định — cần người | Có, gián tiếp |
| 04 | Luật ArchUnit về tiền phải soi cả phương thức | Ràng buộc máy | Nên xong trước |
| 05 | Kiểm thử hồi quy lược đồ cho các cột tiền | Ràng buộc máy | Nên xong trước |

Ticket 01 và 02 độc lập nhau, làm song song được. Ticket 03 là quyết định của người, không phải việc của agent — nhưng nó **có thể đảo kết quả của 01**, nên đọc trước khi làm 01.

## Điều không đưa vào đây

Đợt soát cũng ghi nhận hai tính chất tầng 2 mà kế hoạch mục 5 đòi nhưng chưa có trong `BillingCalcPropertiesTest`:

- *"Với mọi dãy thanh toán, đã thu luôn bằng tổng đại số các bút toán"*
- *"Số dư khả dụng không bao giờ âm"*

**Đây không phải lỗi.** Cả hai nói về thanh toán và số dư — thuộc Slice 05, chưa có mã để mà kiểm. Ghi lại ở đây để người viết kế hoạch Slice 05 đưa thẳng vào ticket, đừng để rơi.
