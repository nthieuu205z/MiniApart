# 06: Khoản phát sinh chờ · CR-008 · FR-INV-05

**What to build:** Một khoản tiền phát sinh ngoài kỳ — chi phí sửa chữa người thuê phải chịu, đền bù tài sản hỏng, phạt vi phạm nội quy — được ghi vào một hàng chờ, rồi **tự động vào hoá đơn kỳ kế tiếp đúng một lần**.

**Đây là ticket sửa một lỗi nghiệp vụ có hậu quả tiền bạc.** CR-008 nói rõ: không có gì đánh dấu một khoản đã được tính vào hoá đơn nào chưa, thì quy trình tạo hoá đơn sẽ **quét lại các yêu cầu sửa chữa mỗi kỳ và tính lại cùng một khoản** — người thuê **bị thu tiền lặp mỗi tháng** cho một lần sửa chữa duy nhất.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Bảng `KHOAN_PHAT_SINH(id, hop_dong_id, nguon_loai, nguon_id, ten_khoan, so_tien, loai, trang_thai, hoa_don_id)` đúng như CR-008
- [ ] `trang_thai` chỉ nhận `CHO_TINH` hoặc `DA_TINH`, ép bằng `CHECK`
- [ ] Tạo hoá đơn thì quét các khoản `CHO_TINH` của hợp đồng, đưa vào hoá đơn, và **chuyển sang `DA_TINH` trong cùng một giao dịch**. Nửa vời ở đây nghĩa là thu lặp hoặc mất khoản
- [ ] `loai` phân biệt khoản **phải thu thêm** và khoản **giảm trừ** — giảm trừ mang dấu âm
- [ ] **Ca kiểm thử bắt buộc:** tạo một khoản phát sinh, chạy tạo hoá đơn **hai kỳ liên tiếp**, khẳng định khoản đó chỉ xuất hiện ở kỳ đầu. Đây là ca trực tiếp chứng minh CR-008 được xử lý đúng
- [ ] Huỷ một hoá đơn nháp thì các khoản của nó **quay về `CHO_TINH`**, không bị mất
- [ ] Cặp `nguon_loai`/`nguon_id` **không kiểm được bằng khoá ngoại** ở tầng cơ sở dữ liệu. CR-008 đã nêu rõ đây là đánh đổi có cân nhắc, và đòi bù lại bằng **kiểm ở tầng ứng dụng kèm kiểm thử riêng**. Phải có ca kiểm thử cho việc trỏ tới một nguồn không tồn tại
- [ ] Tên test mang mã `CR-008` và `FR-INV-05`
