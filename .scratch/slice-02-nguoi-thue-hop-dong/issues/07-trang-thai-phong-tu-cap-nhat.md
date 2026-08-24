# 07: Trạng thái phòng tự cập nhật theo hợp đồng · FR-BLD-04 · CR-012

**What to build:** Ký hợp đồng thì phòng tự chuyển sang `DA_COC` rồi `DANG_THUE`; thanh lý thì tự về `TRONG`. Người dùng không sửa tay trạng thái phòng ở bất kỳ đâu.

**`PHONG.trang_thai` là giá trị đệm, không phải nguồn sự thật.** CR-012 nói rõ điều này. Nguồn sự thật là dữ liệu hợp đồng; cột `trang_thai` chỉ tồn tại để màn hình sơ đồ phòng hiện được hàng chục phòng cùng lúc mà không phải tính lại từng cái.

Giá trị đệm luôn có nguy cơ lệch khỏi nguồn sự thật. Vì thế CR-012 đòi thêm một thứ mà ticket này bắt buộc phải có: **kiểm thử đối chiếu giá trị đệm với giá trị tính lại từ dữ liệu gốc**.

**Blocked by:** 04, `slice-01 · 03` (sơ đồ phòng)

**Status:** ready-for-agent

- [ ] Trạng thái phòng đổi theo hành động trên hợp đồng, không có endpoint nào cho phép đặt trực tiếp
- [ ] Có một hàm **tính lại** trạng thái phòng từ dữ liệu hợp đồng tại một ngày cho trước
- [ ] **Ca kiểm thử bắt buộc:** dựng một loạt tình huống hợp đồng, rồi khẳng định giá trị đệm trong cột **bằng đúng** giá trị hàm tính lại trả về. Đây là ca chứng minh CR-012 được xử lý đúng
- [ ] Có một lệnh chạy tay để tính lại toàn bộ trạng thái phòng, dùng khi phát hiện lệch
- [ ] Sơ đồ phòng ở Slice 1 hiện đúng trạng thái mới ngay sau khi ký hợp đồng
- [ ] Tên test mang mã `FR-BLD-04` và `CR-012`
