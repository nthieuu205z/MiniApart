# 07: Chốt kỳ — chặn khi còn phòng chưa ghi · FR-MTR-08

**What to build:** Trước khi chốt kỳ, hệ thống hiện danh sách **những phòng chưa ghi chỉ số** và không cho chốt cho tới khi hết. Chốt xong thì kỳ đóng lại và kỳ mới mở ra.

Chốt kỳ khi còn phòng thiếu chỉ số nghĩa là phòng đó không ra được hoá đơn, hoặc ra hoá đơn thiếu tiền dịch vụ — và chuyện đó chỉ lộ ra khi người thuê thắc mắc sao tháng này rẻ thế.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Màn hình chốt kỳ liệt kê rõ từng phòng còn thiếu, bấm vào là nhảy thẳng tới ô nhập của phòng đó
- [ ] Chặn ở **máy chủ**, không chỉ ẩn nút trên giao diện
- [ ] Phòng không có hợp đồng hiệu lực trong kỳ **không tính là thiếu**
- [ ] Chốt kỳ là một thao tác nguyên tử: hoặc chốt trọn, hoặc không đổi gì
- [ ] Tên test mang mã `FR-MTR-08`
