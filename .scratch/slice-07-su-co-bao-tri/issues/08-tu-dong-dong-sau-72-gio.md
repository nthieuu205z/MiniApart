# 08: Tự đóng sau 72 giờ · FR-MNT-07 · BR-16 · ruling 2B

**What to build:** Yêu cầu ở *Chờ xác nhận* quá 72 giờ thì hệ thống coi như *Đã đóng* — **suy ra khi đọc, không ghi, không tác vụ nền**.

**Blocked by:** 01, 03

**Status:** ready-for-agent

**Migration:** không cần.

## Ruling 2B: vì sao không dùng tác vụ nền

`BR-16` viết *"Tự động chuyển từ Chờ xác nhận sang Đã đóng sau 72 giờ không phản hồi"* nhưng không nói làm bằng cách nào.

Ghi chú **CR-012** trong `BR-14` đã từ chối đúng mẫu hình đó khi không lưu "sắp hết hạn" thành cột trạng thái:

> *"hệ thống sẽ cần một tác vụ chạy hằng ngày quét lại toàn bộ hợp đồng, và **tác vụ đó lỗi một hôm thì dữ liệu sai mà không ai biết**."*

Dự án hiện **không có hạ tầng chạy theo lịch ở đâu cả**. Dựng cái đầu tiên cho một yêu cầu mức **Could have** là đánh đổi tồi — và nó thành điểm hỏng im lặng đầu tiên của hệ thống.

## Điểm yếu của cách này, và cách bù

Suy ra khi đọc nghĩa là **mọi** truy vấn trạng thái phải nhớ áp luật 72 giờ. Quên một chỗ là lệch: màn quản lý thấy *Chờ xác nhận*, màn thợ thấy *Đã đóng*.

**Cách bù bắt buộc: đặt luật vào đúng một chỗ** trong tầng thuần, cùng khuôn `QuyTacTrangThaiHoaDon` — một hàm nhận trạng thái lưu, thời điểm vào *Chờ xác nhận*, và thời điểm hiện tại, trả về trạng thái hiệu lực.

**Tuyệt đối không rải `INTERVAL '72 hours'` ra từng câu SQL.** Đây đúng cái bẫy `TinhHoaDonRepository:281` đã dính ở Slice 04 — logic BR nằm trong SQL, nơi ArchUnit không soi tới, và lệch với tầng thuần mà không ai biết cho tới lúc review.

## Cần một cột thời điểm

Phải biết yêu cầu vào *Chờ xác nhận* **lúc nào**. Cột đó đã tạo sẵn ở `V36` (ticket 02) hay chưa — kiểm trước; nếu chưa thì ticket này cần một migration nhỏ trong dải `V38`+.

**Không dùng thời điểm cập nhật chung chung.** Mọi thao tác khác cũng chạm nó, và đồng hồ 72 giờ sẽ bị đẩy lùi mỗi lần ai đó sửa gì đó.

## Hoàn thành khi

- [ ] Luật 72 giờ nằm ở **đúng một chỗ**, trong tầng thuần, không phụ thuộc Spring hay cơ sở dữ liệu
- [ ] **Không có `INTERVAL` hay phép tính 72 giờ nào trong SQL** — kiểm bằng `grep`
- [ ] Yêu cầu *Chờ xác nhận* quá 72 giờ hiện là *Đã đóng* ở **mọi** đường đọc: danh sách quản lý, chi tiết, danh sách thợ, lịch sử
- [ ] Đúng 72 giờ (không hơn) thì **vẫn** *Chờ xác nhận* — test biên
- [ ] Người thuê xác nhận **trước** 72 giờ → *Đã đóng* thật, ghi vào cơ sở dữ liệu
- [ ] Người thuê phản hồi **sau** 72 giờ → chốt hành vi (đã đóng thì thôi, hay mở lại) và ghi lý do vào `## Comments`
- [ ] Test dùng **đồng hồ đẩy được** — khuôn `MutableClock` đã có ở bốn bộ test tích hợp, dùng lại, **không chờ thật**
- [ ] Thời điểm vào *Chờ xác nhận* lưu riêng, **không dùng cột cập nhật chung**
- [ ] Tên test mang mã `FR-MNT-07` và `BR-16`

## Comments
