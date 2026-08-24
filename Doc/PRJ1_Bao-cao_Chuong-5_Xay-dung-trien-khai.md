# CHƯƠNG 5. XÂY DỰNG VÀ TRIỂN KHAI

> **Trạng thái: KHUNG.** Chương này **chỉ viết được sau khi có sản phẩm chạy**. Đừng cố viết trước — nội dung của nó là ảnh màn hình thật và số liệu thật.
>
> **Nguyên tắc quan trọng:** viết từng mục **ngay khi vertical slice tương ứng hoàn thành**, không dồn đến cuối. Để dồn thì phải dựng lại dữ liệu mẫu chỉ để chụp ảnh, và những lý do đằng sau các quyết định sẽ quên mất.

---

## 5.1. Tổ chức mã nguồn

`[ĐIỀN sau Vertical Slice 0]`

Cần có: cây thư mục thực tế của kho mã, giải thích quy ước đặt tên, và cách chạy dự án tại máy (`docker compose up`).

## 5.2. Cơ sở dữ liệu

`[ĐIỀN sau Vertical Slice 1–2]`

- Danh sách bảng thực tế đã tạo, đối chiếu với ERD phiên bản 2
- Danh sách tệp di trú Flyway theo thứ tự
- **Nêu rõ những chỗ cài đặt khác so với thiết kế, kèm lý do.** Chênh lệch là bình thường; giấu chênh lệch mới là vấn đề

## 5.3. Giao diện các phân hệ

`[ĐIỀN dần theo từng vertical slice]`

Mỗi phân hệ một mục nhỏ, mỗi mục gồm: ảnh màn hình, mô tả luồng thao tác, và mã yêu cầu chức năng mà màn hình đó đáp ứng.

| Mục | Phân hệ | Sau vertical slice | Ảnh cần chụp |
|---|---|---|---|
| 5.3.1 | Đăng nhập và phân quyền | 0 | Màn hình đăng nhập; menu khác nhau của các vai trò |
| 5.3.2 | Danh mục toà nhà, phòng, dịch vụ | 1 | Sơ đồ phòng theo tầng; màn hình khai báo biểu giá bậc thang |
| 5.3.3 | Người thuê và hợp đồng | 2 | Hồ sơ người thuê; màn hình lập hợp đồng |
| 5.3.4 | Ghi chỉ số dịch vụ | 3 | **Chụp trên điện thoại thật**, không phải trình duyệt thu nhỏ |
| 5.3.5 | Hoá đơn | 4 | Kết quả tạo hàng loạt kèm danh sách phòng bị bỏ qua và lý do |
| 5.3.6 | Thanh toán và công nợ | 5 | Ghi nhận thanh toán; mã QR chuyển khoản; biên lai |
| 5.3.7 | Cổng người thuê | 6 | Hoá đơn chi tiết từng khoản; biểu đồ tiêu thụ |
| 5.3.8 | Sự cố và bảo trì | 7 | Vòng đời một yêu cầu sửa chữa |
| 5.3.9 | Thông báo và nhắc việc | 8 | Bảng nhắc việc trên màn hình chính |
| 5.3.10 | Báo cáo và thống kê | 9 | Màn hình tổng quan; báo cáo công nợ |
| 5.3.11 | An toàn và nhật ký | 10 | Tra cứu nhật ký thao tác |

**Về ảnh màn hình.** Ba điều quyết định chất lượng của chương này:

1. **Dữ liệu mẫu phải trông thật.** Tên phòng "101", "102" chứ không phải "Test 1", "abc". Số tiền hợp lý chứ không phải 999.999.999.
2. **Tuyệt đối không dùng dữ liệu cá nhân thật của người thật** — không ảnh căn cước thật, không số điện thoại thật. Đây vừa là biện pháp giảm rủi ro R-13, vừa là điều đúng đắn cần làm.
3. **Ảnh phải đọc được khi in.** Chụp ở độ phân giải đủ cao, cắt bỏ phần thừa của trình duyệt.

## 5.4. Triển khai lên máy chủ

`[ĐIỀN sau Vertical Slice 11]`

- Sơ đồ triển khai: dùng lại Hình 4.1
- Các bước dựng máy chủ, kèm cấu hình thực tế
- Cấu hình bảo mật: tường lửa, khoá SSH, chứng chỉ, cách ly cơ sở dữ liệu
- Quy trình sao lưu và **kết quả của lần thử phục hồi**
- Địa chỉ truy cập hệ thống

**Về mục sao lưu:** phải ghi rõ đã thử phục hồi vào một cơ sở dữ liệu trống và kết quả ra sao. Một bản sao lưu chưa từng được thử phục hồi thì chưa phải bản sao lưu, chỉ là một tệp mà ta hy vọng dùng được.

## 5.5. Quy trình tích hợp và triển khai tự động

`[ĐIỀN sau Vertical Slice 0, hoàn thiện sau Vertical Slice 11]`

Các bước của quy trình đã mô tả ở mục 6.5. Ở đây cần bổ sung: ảnh chụp một lần chạy thật, và **ảnh chụp một lần chạy thất bại** nếu có — cái sau chứng minh cơ chế thật sự chặn được mã lỗi, chứ không phải chỉ là cấu hình cho đẹp.

## 5.6. Thống kê sản phẩm

`[ĐIỀN cuối cùng]`

| Chỉ số | Giá trị |
|---|---|
| Số yêu cầu chức năng đã cài đặt / tổng phạm vi | `[ĐIỀN]` / 81 |
| Số bảng trong cơ sở dữ liệu | `[ĐIỀN]` |
| Số điểm cuối API | `[ĐIỀN]` |
| Số màn hình giao diện | `[ĐIỀN]` |
| Số ca kiểm thử tự động | `[ĐIỀN]` |
| Số dòng mã (backend / frontend) | `[ĐIỀN]` |

> **Cảnh báo về số dòng mã.** Chỉ số này ít nói lên chất lượng, và nếu bị hỏi "vì sao nhiều thế" hoặc "vì sao ít thế" thì khó trả lời hay. Nếu đưa vào, hãy đặt cạnh số ca kiểm thử để cân bằng, và đừng biến nó thành luận điểm chính.

---

## Ghi chú cho người viết chương này

**Trung thực về phạm vi đạt được.** Nếu có yêu cầu nào không hoàn thành, ghi rõ ở mục 5.6 và giải thích ở Chương 7. Nhóm ghi "hoàn thành 100%" rồi bị phát hiện một chức năng không chạy khi demo sẽ mất nhiều điểm hơn nhóm nói thẳng "đạt 74 trên 81 yêu cầu, bảy yêu cầu còn lại thuộc phân hệ báo cáo, chưa kịp làm vì lý do sau".

**Đừng mô tả mã nguồn từng dòng.** Chương này trình bày **kết quả** và **cách triển khai**, không phải hướng dẫn đọc mã. Chi tiết thiết kế lớp đã nằm ở Chương 3.
