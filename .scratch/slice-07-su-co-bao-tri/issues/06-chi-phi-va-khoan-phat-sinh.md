# 06: Ghi chi phí và nối sang hoá đơn · FR-MNT-05 · FR-MNT-06 · CR-008

**What to build:** Ghi chi phí sửa chữa và bên chịu chi phí. Bên chịu là người thuê thì sinh một `KHOAN_PHAT_SINH` để hoá đơn kỳ sau cuốn vào.

**Blocked by:** 02

**Status:** ready-for-agent

**Migration:** không cần — cột chi phí đã tạo sẵn ở `V36` (ticket 02).

## CR-008 tồn tại vì một lỗi có hậu quả tiền bạc

> *"quy trình tạo hoá đơn sẽ quét lại các yêu cầu sửa chữa mỗi kỳ và tính lại cùng một khoản chi phí, khiến người thuê **bị thu tiền lặp mỗi tháng** cho một lần sửa chữa duy nhất."*

Đây chính là ticket mà CR-008 được viết ra để phục vụ.

## Máy móc đã có sẵn — chỉ nối nguồn

**Đừng dựng cơ chế chống tính lặp mới.** Slice 04 đã cài xong và đã test:

- Bảng `KHOAN_PHAT_SINH` (`V23__pending_invoice_extras.sql`) với `trang_thai` `CHO_TINH`/`DA_TINH`
- Cặp `nguon_loai` + `nguon_id` đa hình
- `MayTinhHoaDon` cuốn khoản `CHO_TINH` vào hoá đơn rồi đánh dấu `DA_TINH`
- **Test chạy hai kỳ liên tiếp chứng minh không tính lặp** — `slice-04 · 06`

Việc ở đây: khi ghi chi phí với bên chịu là người thuê, sinh một `KHOAN_PHAT_SINH` với `nguon_loai = 'SUA_CHUA'` và `nguon_id` trỏ về yêu cầu.

Nếu thấy mình đang sửa `MayTinhHoaDon` thì đã đi sai đường.

## Ba câu phải trả lời trong thiết kế

**1. Ghi chi phí ở trạng thái nào?** Chi phí chỉ biết sau khi sửa xong, nhưng *Đã đóng* là trạng thái cuối. Đề xuất: cho ghi từ *Đang xử lý* trở đi, sửa được cho tới khi *Đã đóng*. Chốt và ghi lý do vào `## Comments`.

**2. Sửa chi phí sau khi đã sinh khoản phát sinh thì sao?** Nếu khoản đó **chưa** vào hoá đơn (`CHO_TINH`) thì cập nhật được. Nếu **đã** vào (`DA_TINH`) thì **không được sửa** — hoá đơn đã phát hành, và `BR-18` cấm sửa dữ liệu tài chính đã ghi. Phải chặn, và thông báo nói rõ vì sao.

**3. Huỷ yêu cầu đã sinh khoản phát sinh?** `slice-04 · 05` đã có tiền lệ: huỷ hoá đơn nháp thì **trả khoản phát sinh về hàng chờ**. Áp cùng cách — nhưng chỉ khi khoản còn `CHO_TINH`.

## Bên chịu chi phí

Tối thiểu hai giá trị: **chủ nhà** và **người thuê**. Chỉ *người thuê* mới sinh khoản phát sinh.

Chia đôi hay chia tỷ lệ **không có yêu cầu nào đòi** — đừng thêm.

## Hoàn thành khi

- [ ] Ghi được chi phí và bên chịu chi phí; tiền là `NUMERIC(15,2)` và `BigDecimal`
- [ ] Bên chịu là **người thuê** → sinh `KHOAN_PHAT_SINH` `nguon_loai = 'SUA_CHUA'`, `nguon_id` trỏ đúng yêu cầu, `trang_thai = CHO_TINH`
- [ ] Bên chịu là **chủ nhà** → **không** sinh khoản nào
- [ ] **Ca kiểm thử trung tâm:** ghi chi phí, chạy tạo hoá đơn **hai kỳ liên tiếp**, khẳng định khoản đó vào hoá đơn **đúng một lần**
- [ ] Sửa chi phí khi khoản còn `CHO_TINH` → cập nhật được; khi đã `DA_TINH` → **bị chặn** kèm lý do rõ
- [ ] Huỷ yêu cầu có khoản `CHO_TINH` → khoản trả về hàng chờ hoặc bị vô hiệu; chốt một cách và ghi lý do
- [ ] **Không sửa `MayTinhHoaDon`** — test hiện có của `billing/calc` vẫn xanh không đổi
- [ ] Kiểm cặp `nguon_loai`/`nguon_id` ở tầng ứng dụng, **có test riêng** — đánh đổi CR-008
- [ ] Người thuê và Thợ **không** ghi được chi phí → 403. QTHT → 403
- [ ] Tên test mang mã `FR-MNT-06` và `CR-008`

## Comments
