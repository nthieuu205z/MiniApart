# 03: Tiếp nhận và phân công cho thợ · FR-MNT-03 · FR-MNT-04

**What to build:** Quản lý tiếp nhận yêu cầu và phân công cho thợ; thợ chuyển việc sang *Đang xử lý* rồi *Chờ xác nhận*.

**Blocked by:** 02

**Status:** ready-for-agent

## Vai trò `THO` phá vỡ khuôn phân quyền hiện có — đọc kỹ

Đây là **lần đầu** vai trò `THO` truy cập dữ liệu. Bốn vai trò kia đã có đường đi rồi; thợ thì chưa, và khuôn hiện có **không dùng được**.

`PhanQuyenToaService.layToaNhaNeuNhanVienDuocXem` chỉ nhận `CHU` và `QUAN_LY`. Thợ **không** thuộc `PHAN_QUYEN_TOA`, và **không được** gán vào đó.

**Phạm vi của thợ là danh sách việc được phân công, không phải toà nhà.** Thợ có thể sửa việc ở nhiều toà; thợ cũng không được xem toàn bộ toà chỉ vì có một việc ở đó.

> **Cấm rõ ràng:** không gán thợ vào `PHAN_QUYEN_TOA` để cho qua kiểm quyền. Làm thế là mở cho thợ đọc **toàn bộ dữ liệu nghiệp vụ của toà** — hoá đơn, hợp đồng, ảnh giấy tờ người thuê. Vi phạm `BR-17` và nguyên tắc từ chối mặc định.

Cần **một đường kiểm quyền riêng cho thợ**: được thao tác trên yêu cầu ⟺ yêu cầu đó được phân công cho chính thợ đó.

## Ai chuyển trạng thái nào

| Chuyển | Ai |
|---|---|
| *Mới tiếp nhận* → *Đã tiếp nhận* | Quản lý toà được phân công, Chủ |
| *Đã tiếp nhận* → *Đã phân công* | Quản lý, Chủ — kèm chọn thợ |
| *Đã phân công* → *Đang xử lý* | **Thợ được phân công**, chỉ việc của mình |
| *Đang xử lý* → *Chờ xác nhận* | **Thợ được phân công** |
| *Chờ xác nhận* → *Đã đóng* | Người thuê tạo ra nó, hoặc Quản lý |
| bất kỳ → *Đã huỷ* | Quản lý, Chủ — lý do bắt buộc |

Dùng máy trạng thái ticket 01. **Không viết luật chuyển trạng thái lần thứ hai trong service.**

## UX của thợ — đọc trước khi thiết kế

`Doc/UX/04-tho-sua-chua.md` đặc tả phân hệ thợ là **đúng một màn** (`#40`), và nói rõ đó là quyết định có chủ ý, không phải thiếu sót. Kỳ vọng gốc từ khảo sát: *"không cần chức năng gì phức tạp hơn"*.

Ticket này lo phần **máy chủ** của việc đó; màn `#40` là ticket 04.

Nhưng API phải hợp với màn đó: thợ cần **một lời gọi** trả về danh sách việc của mình kèm đủ thông tin để đi làm — số phòng, mô tả, mức độ, ảnh, **số điện thoại người thuê**. Không bắt thợ gọi ba API rồi tự ghép.

## Hoàn thành khi

- [ ] Quản lý tiếp nhận và phân công cho thợ; lưu ai phân công, lúc nào
- [ ] Thợ chuyển được *Đang xử lý* và *Chờ xác nhận* — **chỉ việc được phân công cho mình**
- [ ] **Thợ gọi API của việc thợ khác → 403.** Ca kiểm thử bắt buộc, đây là lý do tồn tại của phần phân quyền ticket này
- [ ] Thợ **không** đọc được hoá đơn, hợp đồng, ảnh giấy tờ, danh mục phòng — 403 ở tất cả
- [ ] **Không tài khoản `THO` nào xuất hiện trong `PHAN_QUYEN_TOA`** — test khẳng định
- [ ] Một lời gọi trả đủ dữ liệu cho màn `#40`, gồm số điện thoại người thuê
- [ ] Mọi chuyển trạng thái đi qua máy trạng thái ticket 01
- [ ] Chuyển sai vai trò → 403; chuyển sai trạng thái → lỗi nghiệp vụ, **không phải 500**
- [ ] QTHT → 403
- [ ] Ghi `NHAT_KY_THAO_TAC` cho tiếp nhận, phân công, huỷ

## Comments
