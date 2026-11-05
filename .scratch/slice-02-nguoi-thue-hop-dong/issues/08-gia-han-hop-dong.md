# 08: Gia hạn hợp đồng · FR-TNT-07

**What to build:** Gia hạn một hợp đồng sắp hết hạn, kế thừa toàn bộ điều khoản của hợp đồng cũ — giá thuê, tiền cọc, danh sách dịch vụ — và chỉ cần sửa những gì thay đổi.

**Blocked by:** 05

**Status:** done

- [x] Gia hạn sinh ra một **hợp đồng mới** nối tiếp, không sửa ngày kết thúc của hợp đồng cũ. Lịch sử phải đọc được: kỳ nào giá bao nhiêu
- [x] Hợp đồng mới bắt đầu **đúng ngày sau** ngày kết thúc hợp đồng cũ, nên ràng buộc loại trừ ở ticket 05 không được báo chồng — có test cho đúng ranh giới này
- [x] Danh sách người ở cùng kế thừa sang hợp đồng mới
- [x] Tiền cọc **không thu lại** nếu đã có ở hợp đồng cũ; chỉ thu thêm phần chênh nếu giá thuê tăng
- [x] Tên test mang mã `FR-TNT-07`

## Comments

- Added `POST /api/hop-dong/{hopDongId}/gia-han`. The request needs `ngayKetThuc` and may provide a changed `giaThue`; all other terms are copied from the expiring contract.
- The successor begins at `ngayKetThuc` of the prior contract plus one day, so the inclusive PostgreSQL exclusion constraint permits the contiguous range and the original history remains unchanged.
- Renewals copy applied services and only co-occupants whose interval continues past the old contract end. Their new interval starts with the successor contract; no `NHAN_KHAU_KY` was added.
- Because this slice has no deposit receipt ledger, the endpoint returns `tienCocCanThu`. A previously deposited contract creates a `DA_COC` successor when no top-up is needed, or a `CHO_KY` successor when the rent increase creates a positive top-up.
