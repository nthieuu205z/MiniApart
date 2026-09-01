# 07: Trạng thái phòng *Đang sửa chữa* · BR-11 · CR-012

**What to build:** Cho `PHONG.trang_thai` suy ra được giá trị *Đang sửa chữa*, và kiểm giá trị đệm khớp giá trị tính lại.

**Blocked by:** 02

**Status:** ready-for-agent

**Migration:** không cần — `PHONG.trang_thai` đã có từ `V7`.

## Slice này làm một nhánh của BR-11 khả thi lần đầu

`BR-11` định nghĩa bốn trạng thái phòng, suy tự động từ dữ liệu:

| Trạng thái | Điều kiện |
|---|---|
| *Đang thuê* | Có hợp đồng hiệu lực |
| *Đã đặt cọc* | Có hợp đồng đã cọc nhưng chưa tới ngày bắt đầu |
| ***Đang sửa chữa*** | **Có yêu cầu sửa chữa mức Khẩn cấp đang mở **và** quản lý đánh dấu ngừng cho thuê** |
| *Trống* | Còn lại |

Ba nhánh đầu đã cài từ Slice 01–02. Nhánh thứ ba **chưa bao giờ xảy ra được**, vì trước slice này **không có yêu cầu sửa chữa nào tồn tại trong hệ thống**.

> Kế hoạch mục 6 **không liệt kê BR-11** ở Slice 07. Spec slice này bổ sung, vì đây là slice duy nhất làm nhánh đó khả thi.

## Điều kiện có **hai** vế, không phải một

Đọc kỹ: *"có yêu cầu sửa chữa mức Khẩn cấp đang mở **và** quản lý đánh dấu ngừng cho thuê"*.

Một yêu cầu Khẩn cấp **không tự động** làm phòng thành *Đang sửa chữa*. Vòi nước rỉ mức Khẩn cấp vẫn ở được. Phải có **quản lý chủ động đánh dấu ngừng cho thuê**.

Nghĩa là cần một cờ do người dùng đặt, không suy được từ mức độ. Đặt cờ đó ở đâu — trên yêu cầu hay trên phòng — là quyết định kỹ thuật; ghi lựa chọn và lý do vào `## Comments`.

Bỏ vế thứ hai là làm sai BR-11 theo hướng **chặn cho thuê nhầm** — hậu quả kinh doanh thật.

## CR-012: `trang_thai` là đệm, phải có test đối chiếu

> *"Trạng thái phòng vẫn được **lưu thành một cột**, nhưng cột đó là **giá trị đệm** phục vụ hiển thị nhanh sơ đồ phòng ở `FR-BLD-05`, chỉ hệ thống được ghi, người dùng không sửa tay. Nguồn sự thật vẫn là dữ liệu hợp đồng và yêu cầu sửa chữa. **Cần có kiểm thử đối chiếu giá trị đệm với giá trị tính lại từ dữ liệu gốc.**"*

Chú ý cụm *"và yêu cầu sửa chữa"* — CR-012 đã tính trước tới slice này.

`slice-02 · 07` đã dựng cơ chế cập nhật đệm và `slice-01` có `tinhLaiTrangThaiPhong`. **Mở rộng chúng, đừng viết đường tính thứ hai** — hai công thức suy trạng thái là hai chỗ để lệch nhau.

Đây là **lần thứ hai** mẫu hình đệm-lệch-nguồn xuất hiện; lần thứ ba là `HOA_DON.da_thu` ở `slice-05 · 02`.

## Hoàn thành khi

- [ ] Yêu cầu Khẩn cấp đang mở **cộng** cờ ngừng cho thuê → phòng *Đang sửa chữa*
- [ ] **Chỉ một trong hai vế → phòng KHÔNG chuyển** *Đang sửa chữa*. Hai test riêng cho hai nửa
- [ ] Yêu cầu đóng hoặc huỷ, hoặc gỡ cờ → phòng quay về trạng thái suy từ hợp đồng
- [ ] Phòng đang có hợp đồng hiệu lực **mà** đang sửa chữa → chốt thứ tự ưu tiên giữa *Đang thuê* và *Đang sửa chữa*, ghi lý do vào `## Comments`
- [ ] **Test đối chiếu CR-012:** sau mọi dãy thao tác, `PHONG.trang_thai` khớp giá trị tính lại từ hợp đồng và yêu cầu sửa chữa
- [ ] Người dùng **không sửa tay được** `trang_thai` — client gửi lên thì bị bỏ qua
- [ ] Dùng lại đường tính hiện có, **không viết công thức suy trạng thái thứ hai**
- [ ] Tên test mang mã `BR-11` và `CR-012`

## Comments
