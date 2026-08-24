# 08: Gia hạn hợp đồng · FR-TNT-07

**What to build:** Gia hạn một hợp đồng sắp hết hạn, kế thừa toàn bộ điều khoản của hợp đồng cũ — giá thuê, tiền cọc, danh sách dịch vụ — và chỉ cần sửa những gì thay đổi.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Gia hạn sinh ra một **hợp đồng mới** nối tiếp, không sửa ngày kết thúc của hợp đồng cũ. Lịch sử phải đọc được: kỳ nào giá bao nhiêu
- [ ] Hợp đồng mới bắt đầu **đúng ngày sau** ngày kết thúc hợp đồng cũ, nên ràng buộc loại trừ ở ticket 05 không được báo chồng — có test cho đúng ranh giới này
- [ ] Danh sách người ở cùng kế thừa sang hợp đồng mới
- [ ] Tiền cọc **không thu lại** nếu đã có ở hợp đồng cũ; chỉ thu thêm phần chênh nếu giá thuê tăng
- [ ] Tên test mang mã `FR-TNT-07`
