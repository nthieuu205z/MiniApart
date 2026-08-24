# 05: Bảng giá theo ngày hiệu lực · FR-BLD-06

**What to build:** Mỗi dịch vụ có một dãy đơn giá, mỗi đơn giá kèm **ngày bắt đầu hiệu lực**. Sửa giá không ghi đè giá cũ mà thêm một dòng mới. Màn hình hiện cả lịch sử giá, và nói rõ dòng nào đang áp dụng hôm nay.

**Cái bẫy của ticket này, và là lý do nó đáng làm kỹ.** Quy tắc tra giá **không phải** "lấy dòng mới nhất". Chép nguyên từ CR-003:

> lấy bản có `ngay_hieu_luc` **lớn nhất nhưng không vượt quá ngày kết thúc kỳ đang tính**

Lấy dòng mới nhất thì mỗi lần tăng giá điện, **mọi hoá đơn cũ in lại sẽ ra số tiền mới** — vi phạm trực tiếp NFR-CMP-02. Đây là lỗi im lặng: không có thông báo lỗi nào, chỉ có con số khác đi.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Bảng `BANG_GIA` nhiều dòng cho một dịch vụ, mỗi dòng một `ngay_hieu_luc`
- [ ] `don_gia` là `NUMERIC(15,2)`
- [ ] Hàm tra giá nhận vào **một ngày** và trả về đơn giá áp dụng cho ngày đó
- [ ] Có test cho ba tình huống: ngày trước mọi mốc hiệu lực (không có giá, phải báo lỗi rõ ràng chứ không trả 0), ngày đúng bằng một mốc, ngày giữa hai mốc
- [ ] **Test then chốt:** đặt giá cho tháng 1, tra ra giá A. Thêm một mức giá mới hiệu lực từ tháng 3. Tra lại cho tháng 1 — **vẫn phải ra giá A**. Test này là thứ chứng minh NFR-CMP-02 được tôn trọng
- [ ] Không sửa và không xoá được dòng giá đã tồn tại — chỉ thêm dòng mới
- [ ] Tên test mang mã `FR-BLD-06`
