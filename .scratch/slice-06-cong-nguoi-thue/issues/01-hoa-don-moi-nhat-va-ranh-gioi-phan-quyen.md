# 01: Hoá đơn kỳ gần nhất và ranh giới phân quyền · FR-POR-01 · FR-POR-04

**What to build:** Người thuê đăng nhập thấy ngay hoá đơn kỳ gần nhất (`#32`), và **bộ ca kiểm thử theo hướng tấn công** chứng minh không xem được dữ liệu người khác.

**Blocked by:** None *(nên bắt đầu sau ticket `slice-05 · 02` — xem dưới)*

**Status:** ready-for-agent

**Migration:** không cần. **Slice này không được đẻ migration nào.**

## Ticket này dựng xương sống phân quyền cho cả slice

Bốn ticket còn lại đều là màn đọc treo lên cùng một luật: *người thuê chỉ thấy dữ liệu của chính mình*. Làm luật đó cho đúng ở đây thì bốn ticket sau chỉ là hiển thị.

Kế hoạch nói thẳng đây là điểm đáng đầu tư nhất của slice:

> *"`FR-POR-04` là yêu cầu **an ninh**, không phải yêu cầu hiển thị. Phải kiểm thử theo hướng tấn công: đăng nhập bằng tài khoản người thuê phòng 101, rồi gọi thẳng API hoá đơn của phòng 102 bằng mã định danh **đoán được**. Phải nhận 403. Ca kiểm thử này nên demo khi bảo vệ — nó chứng minh nhóm hiểu phân quyền là chuyện ở tầng máy chủ, không phải chuyện ẩn nút trên giao diện."*

## Ba mặt phải phủ, không chỉ một

Chặn được hoá đơn mà quên hai cái sau là lỗ hổng thật:

| Mặt | Ca tấn công |
|---|---|
| Hoá đơn | Người thuê phòng 101 gọi API hoá đơn phòng 102 |
| **Ảnh công tơ** | Xin liên kết ký cho ảnh công tơ kỳ của phòng 102 |
| **Hợp đồng** | Đọc hợp đồng của người thuê khác |

`slice-02 · 02` từng có đúng lỗi này: tiêu chí ghi *"người không có quyền thì không xin được liên kết"* nhưng bị hiểu thành kiểm **vai trò**, không kiểm **phạm vi** — và lọt cho tới đợt soát sau Slice 04.

## Tiền lệ có sẵn để chép

- `HoaDonChiTietService` đã so `nguoiDung.nguoiThueId()` với `hoaDon.nguoiThueId()`
- Bộ `*AuthorizationIntegrationTest` của Slice 04 đã dựng khuôn ca 403
- `CR-001` đã xong: `V11__link_account_to_tenant.sql`, `NguoiDung.nguoiThueId`, vai trò `NGUOI_THUE` trong enum

**Dùng lại. Không viết cơ chế phân quyền thứ hai.**

## Người thuê đã thanh lý hợp đồng — ruling 3A

**Vẫn xem được** hoá đơn và hợp đồng cũ **của chính mình**, không giới hạn thời gian.

Lý do không phải sự tiện lợi mà là **mâu thuẫn nội tại** nếu chọn ngược lại: ticket `slice-05 · 09` sinh **hoá đơn quyết toán** khi cọc trừ công nợ ra số âm, và hoá đơn đó phát sinh **sau** khi hợp đồng thanh lý. Cắt quyền xem lúc thanh lý nghĩa là người thuê không bao giờ xem được hoá đơn mà chính họ phải trả.

Hai điều kiện siết lại, **phải có test**:

1. Chỉ hợp đồng **của chính mình** — thanh lý không nới lỏng gì
2. Tài khoản bị **khoá** thì mất quyền ngay — cơ chế đã có từ Slice 00 (`FR-AUT-06`, `FR-AUT-07`, ADR-0001), không làm mới

## Vì sao nên bắt đầu sau ticket `slice-05 · 02`

`HOA_DON.da_thu` đã tồn tại nên mã chạy được ngay. Nhưng tới khi `slice-05 · 02` ghi nhận thanh toán thật, cột đó **luôn bằng 0** — người thuê thấy **mọi hoá đơn đều chưa trả**, kể cả đã trả xong.

Không sai mã. Hỏng hẳn khi demo. **Không phải đợi hết Slice 05**, chỉ cần ticket 02 của nó.

## Hoàn thành khi

- [ ] Người thuê đăng nhập **thấy ngay** hoá đơn kỳ gần nhất, không qua màn trung gian
- [ ] Chưa có hoá đơn nào → màn rỗng nói rõ vì sao, **không để trắng và không báo lỗi**
- [ ] **Ba ca tấn công đều nhận 403** ở tầng máy chủ: hoá đơn, ảnh công tơ, hợp đồng của người khác
- [ ] Mã định danh **đoán được** vẫn bị chặn — không dựa vào việc giấu id
- [ ] Người thuê đã thanh lý **vẫn xem được** hợp đồng cũ của mình
- [ ] Tài khoản bị khoá → mất quyền ngay
- [ ] QTHT và Thợ → 403
- [ ] **Không thêm migration nào**
- [ ] Tên test mang mã `FR-POR-01` và `FR-POR-04`

## Comments
