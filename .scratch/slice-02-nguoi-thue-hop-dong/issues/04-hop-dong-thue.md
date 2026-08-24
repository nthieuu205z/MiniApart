# 04: Tạo hợp đồng thuê · FR-TNT-04 · CR-005 · CR-012

**What to build:** Ký được một hợp đồng thuê với đầy đủ điều khoản: phòng, người thuê đại diện, ngày bắt đầu, ngày kết thúc, giá thuê, tiền cọc, chu kỳ thanh toán, số ngày báo trước, và danh sách dịch vụ áp dụng cho hợp đồng đó.

**Bốn trạng thái, theo CR-005 và CR-012:**

| Trạng thái | Nghĩa |
|---|---|
| `CHO_KY` | Đã tạo, chưa nhận cọc |
| `DA_COC` | Đã nhận cọc, chưa tới ngày bắt đầu |
| `HIEU_LUC` | Đang thuê |
| `DA_THANH_LY` | Đã kết thúc và quyết toán xong |

**Không có `SAP_HET`.** CR-012 đã bỏ giá trị này. "Sắp hết hạn" được BR-14 định nghĩa bằng **một công thức ngày** — còn dưới 30 ngày tới ngày kết thúc — nên nó đổi theo thời gian ngay cả khi không ai động vào dữ liệu. Lưu nó thành một trạng thái thì phải có tác vụ quét hằng ngày, và tác vụ đó lỗi một hôm là dữ liệu sai mà không ai biết. Đúng chỗ của nó là **điều kiện truy vấn**, không phải một giá trị trong cột.

**Blocked by:** 01, `slice-01 · 02` (phòng), `slice-01 · 04` (dịch vụ)

**Status:** ready-for-agent

- [ ] Bảng `HOP_DONG` theo ERD, `trang_thai` ép bằng `CHECK` với đúng bốn giá trị trên
- [ ] `gia_thue` và `tien_coc` là `NUMERIC(15,2)`
- [ ] Bảng `HOP_DONG_DICH_VU` nối hợp đồng với các dịch vụ áp dụng, kèm chỗ ghi đè đơn giá riêng nếu hợp đồng có thoả thuận khác
- [ ] Ngày kết thúc phải sau ngày bắt đầu
- [ ] Hợp đồng chuyển trạng thái theo **hành động**, không cho sửa tay giá trị trạng thái trên giao diện — CR-012
- [ ] "Sắp hết hạn" hiện lên danh sách bằng **truy vấn theo ngày**, không phải bằng một cột lưu sẵn. Có test đẩy đồng hồ tới để chứng minh danh sách tự đổi mà không cần chạy tác vụ nào
- [ ] Tên test mang mã `FR-TNT-04` và `CR-005`
