# 03: Chặn chỉ số nhỏ hơn kỳ trước · FR-MTR-03

**What to build:** Nhập chỉ số nhỏ hơn chỉ số kỳ trước thì bị từ chối ngay tại ô nhập, kèm lời giải thích. Trừ một trường hợp: đã khai báo **thay công tơ** cho phòng đó trong kỳ.

Công tơ chỉ quay tiến. Số lùi nghĩa là gõ nhầm, hoặc công tơ đã bị thay — và trường hợp thứ hai phải được khai báo tường minh chứ không phải cho qua im lặng.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Chặn ở **cả hai nơi**: giao diện báo ngay lúc gõ, và máy chủ từ chối lưu. Chỉ chặn ở giao diện là hở khi gọi thẳng API
- [ ] Thông báo nói rõ chỉ số kỳ trước là bao nhiêu, và gợi ý "nếu đã thay công tơ thì khai báo ở đây"
- [ ] Cờ `co_thay_cong_to` bật thì bỏ qua phép kiểm này
- [ ] Có test cho ba ca: nhỏ hơn (chặn), bằng đúng (cho qua — công tơ không chạy là chuyện có thật khi phòng bỏ trống), lớn hơn (cho qua)
- [ ] Tên test mang mã `FR-MTR-03`
