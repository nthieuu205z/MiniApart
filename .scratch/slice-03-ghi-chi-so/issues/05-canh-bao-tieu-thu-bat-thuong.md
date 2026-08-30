# 05: Cảnh báo tiêu thụ bất thường · FR-MTR-04

**What to build:** Khi mức tiêu thụ vừa nhập vượt **150% trung bình ba kỳ gần nhất của cùng phòng đó**, hiện cảnh báo ngay tại chỗ. Cảnh báo, không chặn — mùa hè bật điều hoà thì tiêu thụ tăng gấp đôi là bình thường.

Mục đích là bắt lỗi gõ nhầm ngay lúc còn đứng trước công tơ, khi việc kiểm tra lại chỉ tốn năm giây. Phát hiện ở khâu phát hành hoá đơn thì đã phải đi lại một chuyến.

**Blocked by:** 02

**Status:** done

- [x] So với trung bình ba kỳ gần nhất **của chính phòng đó**, không phải trung bình cả toà
- [x] Phòng chưa có đủ ba kỳ lịch sử thì **không cảnh báo** — không đủ dữ liệu để nói gì có ý nghĩa
- [x] Cảnh báo hiện rõ: kỳ này bao nhiêu, trung bình ba kỳ trước bao nhiêu, gấp mấy lần
- [x] Người ghi bấm xác nhận là lưu được. Việc xác nhận đó **ghi lại** để về sau đối chiếu
- [x] Ngưỡng 150% để ở một chỗ đặt được cấu hình, không rải số 1.5 khắp mã nguồn
- [x] Tên test mang mã `FR-MTR-04`
