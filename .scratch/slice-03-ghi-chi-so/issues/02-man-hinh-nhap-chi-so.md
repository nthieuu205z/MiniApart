# 02: Màn hình nhập chỉ số trên điện thoại · FR-MTR-01, FR-MTR-02

**What to build:** Người ghi mở điện thoại, chọn toà và kỳ, thấy danh sách phòng xếp theo tầng rồi theo số phòng. Mỗi dòng có chỉ số kỳ trước hiện sẵn và một ô nhập chỉ số mới. Gõ xong là **hiện ngay mức tiêu thụ vừa tính**, rồi tự nhảy xuống phòng kế tiếp.

**Đây là ticket mà thiết kế giao diện quyết định độ đúng của dữ liệu**, không phải chuyện đẹp xấu. Đọc lại phần "Điều quyết định chất lượng slice này" trong `spec.md` trước khi bắt đầu.

**Blocked by:** 01, `slice-01 · 04` (dịch vụ), `slice-02 · 04` (hợp đồng)

**Status:** ready-for-agent

- [ ] Bảng `CHI_SO_DICH_VU` theo ERD: phòng, dịch vụ, kỳ, chỉ số đầu, chỉ số cuối, người ghi, thời điểm ghi
- [ ] Chỉ số đầu kỳ **tự lấy** từ chỉ số cuối của kỳ trước, không bắt gõ lại
- [ ] Ô nhập dùng bàn phím số trên điện thoại, cỡ chữ đủ lớn để đọc ngoài hành lang
- [ ] Mức tiêu thụ hiện **ngay khi gõ**, không phải sau khi bấm lưu
- [ ] Chỉ hiện những phòng **có hợp đồng hiệu lực trong kỳ** — phòng trống không có gì để ghi
- [ ] Lưu từng phòng một, không phải lưu cả trang một lần: mất mạng giữa chừng thì mất một phòng, không mất cả buổi
- [ ] Hiện rõ đã ghi bao nhiêu trên tổng bao nhiêu phòng
- [ ] **Kiểm chứng thật trên khung điện thoại**, không phải thu nhỏ cửa sổ trình duyệt rồi coi là xong
- [ ] Tên test mang mã `FR-MTR-01` và `FR-MTR-02`
