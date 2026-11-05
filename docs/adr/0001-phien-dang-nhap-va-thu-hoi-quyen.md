# ADR-0001: Phiên đăng nhập mang số phiên bản để thu hồi quyền có hiệu lực ngay

**Trạng thái:** Đã quyết · **Ngày:** 24/08/2026 · **Vertical Slice:** 0, ticket 03

## Bối cảnh

FR-AUT-01 chỉ đòi đăng nhập bằng số điện thoại và mật khẩu. Nếu chỉ nhìn yêu cầu đó thì cách rẻ nhất là phát một JWT hạn dài, không lưu trạng thái gì ở máy chủ.

Nhưng ở Vertical Slice 10 có **FR-AUT-07**: *hệ thống phải chấm dứt hiệu lực phiên đăng nhập của người dùng bị thu hồi quyền trong tối đa 5 phút.*

Một JWT không trạng thái **không làm được điều đó**. Token đã phát thì máy chủ không thu lại được; nó có hiệu lực cho tới lúc hết hạn, bất kể tài khoản đã bị khoá hay bị gỡ quyền quản lý toà nhà. Cách duy nhất để thoả FR-AUT-07 với JWT thuần là đặt hạn token xuống dưới 5 phút, tức là bắt người dùng đăng nhập lại 12 lần mỗi giờ.

Vấn đề là **thời điểm** phát hiện ra điều này. Nếu để tới Slice 10 mới nhận ra thì phần xác thực đã có 6 slice xây bên trên, và phải đập đi làm lại.

## Quyết định

`NGUOI_DUNG` có thêm cột `phien_ban_token` kiểu số nguyên, mặc định 0.

- Access token là JWT, mang thêm claim `ver` bằng giá trị `phien_ban_token` lúc phát.
- Mỗi lần gọi API, ngoài kiểm chữ ký và hạn dùng, máy chủ **so `ver` trong token với `phien_ban_token` trong cơ sở dữ liệu**. Lệch nhau là từ chối.
- Thu hồi quyền, khoá tài khoản, hoặc đổi mật khẩu đều **tăng `phien_ban_token` lên một**. Mọi token đã phát cho người đó lập tức vô hiệu.

Hạn access token đặt 30 phút, cấu hình được.

## Hệ quả

**Được:** FR-AUT-07 thoả với biên độ rộng — thu hồi có hiệu lực **ngay**, không phải trong 5 phút. Không cần thêm bảng nào ngoài lược đồ đã thiết kế ở Chương 3; chỉ thêm một cột. Ticket 07 (khoá tài khoản) và Slice 10 (thu hồi quyền) chỉ việc tăng số, không phải dựng thêm cơ chế.

**Mất:** mỗi lần gọi API tốn một lượt đọc cơ sở dữ liệu để lấy `phien_ban_token`. Đây đúng là điều mà JWT không trạng thái sinh ra để tránh. Chấp nhận vì quy mô hệ thống này là vài chục người dùng đồng thời, và vì bảng `NGUOI_DUNG` sẽ nằm sẵn trong bộ nhớ đệm của PostgreSQL. Đổi một lượt đọc chỉ mục lấy khả năng thu hồi quyền là đổi có lợi.

**Chưa làm:** refresh token. Hết 30 phút thì đăng nhập lại. Hoãn được **mà không sợ phải làm lại**, vì phần đắt đỏ là cơ chế thu hồi thì đã có; thêm refresh token về sau chỉ là phát thêm một loại token mang cùng claim `ver`.

## Các phương án đã loại

**JWT hạn dài, không trạng thái.** Rẻ nhất, nhưng không thoả FR-AUT-07. Loại.

**JWT hạn dưới 5 phút, không trạng thái.** Thoả FR-AUT-07 đúng nghĩa đen. Loại vì người ghi chỉ số đang đứng giữa hành lang, sóng yếu, mà cứ 5 phút bị đá ra đăng nhập lại thì không dùng được.

**Bảng phiên đăng nhập ở máy chủ.** Thu hồi được, nhưng thêm một thực thể không có trong ERD ở Chương 3, kéo theo phải sửa sơ đồ và phải dọn phiên hết hạn. Một cột `phien_ban_token` đạt cùng mục đích với chi phí thấp hơn hẳn.
