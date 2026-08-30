# 07: Chốt kỳ — chặn khi còn phòng chưa ghi · FR-MTR-08

**What to build:** Trước khi chốt kỳ, hệ thống hiện danh sách **những phòng chưa ghi chỉ số** và không cho chốt cho tới khi hết. Chốt xong thì kỳ đóng lại và kỳ mới mở ra.

Chốt kỳ khi còn phòng thiếu chỉ số nghĩa là phòng đó không ra được hoá đơn, hoặc ra hoá đơn thiếu tiền dịch vụ — và chuyện đó chỉ lộ ra khi người thuê thắc mắc sao tháng này rẻ thế.

**Blocked by:** 02

**Status:** done

- [x] Màn hình chốt kỳ liệt kê rõ từng phòng còn thiếu, bấm vào là nhảy thẳng tới ô nhập của phòng đó
- [x] Chặn ở **máy chủ**, không chỉ ẩn nút trên giao diện
- [x] Phòng không có hợp đồng hiệu lực trong kỳ **không tính là thiếu**
- [x] Chốt kỳ là một thao tác nguyên tử: hoặc chốt trọn, hoặc không đổi gì
- [x] Tên test mang mã `FR-MTR-08`

## Comments

- Thêm `GET /api/toa-nha/{toaNhaId}/ky-thanh-toan/{kyId}/thieu-chi-so` để màn hình lấy danh sách phòng còn thiếu.
- Thêm `POST /api/toa-nha/{toaNhaId}/ky-thanh-toan/{kyId}/chot`; nếu còn phòng thiếu thì trả 409 kèm danh sách phòng, nếu đủ thì đổi đúng kỳ đó sang `DA_CHOT`.
- Danh sách thiếu được tính từ cùng scope với `findChoNhap`, nên phòng không có dịch vụ theo chỉ số hợp lệ không bị liệt kê.
- Chuyển trạng thái và kiểm tra thiếu cùng nằm trong một transaction để tránh UI cũ làm chốt nhầm.
