# 08: Bảng `GIAO_DICH_COC` và thu tiền cọc · CR-009 · BR-07 · US-09

**What to build:** Bảng `GIAO_DICH_COC` và chức năng ghi nhận **đã thu** tiền cọc của một hợp đồng.

**Blocked by:** None

**Status:** ready-for-agent

## Vì sao cần bảng riêng, không dùng `HOP_DONG.tien_coc`

CR-009 nói rõ:

> *"`HOP_DONG.tien_coc` chỉ lưu **số tiền phải cọc theo thoả thuận**, không phải bản ghi rằng khoản đó đã thu hay chưa, thu ngày nào, ai thu."*

Đây là hai khái niệm khác nhau bị lẫn vào một trường. Hợp đồng ghi *"cọc 6.000.000"* không cho biết người thuê **đã đưa tiền chưa**. US-09 đòi *"hệ thống ghi nhận khoản thu tiền cọc chờ xác nhận"* — không có bảng này thì không có gì để ghi.

## Tiền cọc **không** là một dòng hoá đơn

`BR-07` mở đầu bằng đúng câu này:

> *"Tiền cọc thu một lần khi ký hợp đồng, **không** là một dòng trong hoá đơn kỳ, mà là một khoản mục riêng."*

Nên `GIAO_DICH_COC` **không** nối vào `HOA_DON` và **không** đi qua `MayTinhHoaDon`. Nó treo trên `HOP_DONG`. Ai định cho tiền cọc vào hoá đơn là đang làm sai BR-07.

## Lược đồ

`Doc/diagrams-v2/07-erd-v2.mmd` dòng 234: `hop_dong_id`, `loai` (`THU_COC` \| `HOAN_COC` \| `KHAU_TRU_COC`), `so_tien`, `ngay`, `nguoi_thu_id`, `ma_bien_lai`, `ly_do`.

Ticket này chỉ dùng `THU_COC`. Hai loại còn lại là việc của ticket 09 — nhưng **tạo đủ ba giá trị trong ràng buộc `CHECK` ngay từ migration này**, để ticket 09 không phải đẻ thêm migration chỉ để nới một `CHECK`.

## BR-17 ở ticket này

`nguoi_thu_id` và `ma_bien_lai` gắn một con người với một khoản tiền. Đây là lý do BR-17 nằm trong danh sách quy tắc của Slice 05 — **không phải** vì ảnh giấy tờ.

Hệ quả: phạm vi theo toà như mọi dữ liệu nghiệp vụ khác, và ghi nhật ký.

## Không có ràng buộc "chỉ thu cọc một lần"

Cân nhắc rồi mới bỏ: người thuê có thể đưa cọc làm hai lần. Ràng buộc duy nhất trên `(hop_dong_id, loai)` sẽ chặn ca hợp lệ đó.

Thay vào đó dùng **tổng**: tổng `THU_COC` của một hợp đồng không được vượt `HOP_DONG.tien_coc`. Nếu ca vượt là hợp lệ trong thực tế thì cảnh báo chứ đừng chặn — nhưng ticket này chốt là **chặn**, và ai muốn đổi thì phải quay về tầng lập kế hoạch.

## Hoàn thành khi

- [ ] Migration tạo `GIAO_DICH_COC` đúng ERD, `CHECK` có **đủ ba** giá trị `loai`, `so_tien` là `NUMERIC(15,2)`
- [ ] Ghi nhận thu cọc cho một hợp đồng, sinh `ma_bien_lai` có ràng buộc duy nhất
- [ ] Thu cọc **nhiều lần** trên một hợp đồng được phép
- [ ] Tổng `THU_COC` vượt `HOP_DONG.tien_coc` → **bị chặn**, thông báo nêu rõ đã thu bao nhiêu và thoả thuận bao nhiêu
- [ ] Giao dịch cọc **không** xuất hiện trong bất kỳ dòng hoá đơn nào — test khẳng định, vì đây là vi phạm BR-07 dễ xảy ra nhất
- [ ] Xem được tổng đã thu cọc của một hợp đồng
- [ ] Ghi `NHAT_KY_THAO_TAC`
- [ ] Test 403: QTHT chặn hoàn toàn; Quản lý sai toà chặn
- [ ] Tên test mang mã `CR-009` và `BR-07`

## Comments
