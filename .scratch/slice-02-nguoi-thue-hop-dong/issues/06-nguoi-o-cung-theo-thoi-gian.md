# 06: Người ở cùng, có chiều thời gian · FR-TNT-02, FR-TNT-03 · CR-002(a)

**What to build:** Khai báo được danh sách người ở cùng của mỗi hợp đồng, mỗi người kèm **ngày chuyển đến** và **ngày chuyển đi**. Hệ thống trả lời được câu hỏi "ngày X phòng này có mấy người", không chỉ "hiện giờ có mấy người".

Khi tổng số người ở vượt sức chứa tối đa của phòng thì **cảnh báo** — cảnh báo chứ không chặn, vì thực tế có trường hợp ở tạm vài hôm và người quản lý cần tự quyết.

**Vì sao chiều thời gian là bắt buộc.** BR-02c tính định mức điện theo **số hộ quy đổi** = trần(số người ÷ 4), và BR-03 tính tiền nước theo đầu người. Cả hai đều cần số người **của kỳ đang tính**, không phải số người hôm nay. Người chuyển đến giữa tháng 3 thì hoá đơn tháng 2 không được đổi.

**Blocked by:** 04

**Status:** done

- [x] Bảng `NGUOI_O_CUNG` có `tu_ngay` và `den_ngay` (rỗng nghĩa là còn ở)
- [x] Một truy vấn trả về số người ở của một phòng tại một ngày bất kỳ
- [x] Cảnh báo khi vượt `suc_chua` của phòng, hiện rõ đang mấy người trên sức chứa bao nhiêu — **không chặn** lưu
- [x] Người ở cùng có thể chính là người thuê đại diện, hoặc là người khác có hồ sơ riêng
- [x] Có test: khai một người chuyển đến giữa kỳ, kiểm tra số người ở **đầu kỳ** và **cuối kỳ** khác nhau đúng như mong đợi
- [x] Tên test mang mã `FR-TNT-02` và `CR-002`

**Ghi chú — phần (b) của CR-002 KHÔNG thuộc ticket này.** Bảng `NHAN_KHAU_KY`, bản kết tinh bất biến ghi lúc chốt kỳ, là việc của **Slice 4**. Ticket này chỉ làm nguồn sự thật; bản kết tinh phải ghi đúng lúc chốt kỳ nên nó thuộc về quy trình tạo hoá đơn.

## Comments

- Đã thêm migration `V14__temporal_co_occupants.sql`; không sửa migration cũ, không thêm `NHAN_KHAU_KY`, và không đụng hành vi cache trạng thái phòng.
- Chọn khoảng ngày đóng, bao gồm cả `tuNgay` và `denNgay`; `denNgay = null` nghĩa là còn ở. Truy vấn dùng `tu_ngay <= ngay` và `den_ngay IS NULL OR den_ngay >= ngay`.
- Khi tạo một khoảng mới, cảnh báo tính tại `tuNgay` sau khi lưu, hiển thị số người hiện tại và sức chứa. Đây là cảnh báo không chặn, nên trả HTTP 201.
