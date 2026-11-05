# Dải số hiệu migration đặt trước

**Vấn đề.** Flyway không cho sửa tệp đã chạy (`BAN-GIAO.md` mục 5.2). Hai slice làm song song trong hai worktree sẽ **cùng đặt tên `V26__`**, và lúc gộp về Flyway từ chối khởi động — khi đó cả hai đã viết xong, sửa rất đắt.

**Cách chống.** Đặt trước dải số hiệu cho từng slice. Flyway chỉ đòi số hiệu **tăng dần và duy nhất**; **để trống khoảng giữa là hợp lệ**, không gây vấn đề gì.

**Số hiệu cao nhất đã dùng: `V25__invoice_detail_snapshots.sql`** (tính đến 01/09/2026).

| Slice | Dải | Ước tính dùng | Ghi chú |
|---|---|---|---|
| **05 — Thanh toán và công nợ** | `V26`–`V35` | 4 tệp | Ticket 02 (`THANH_TOAN`), 04 (`SO_DU_KHA_DUNG`), 08 (`GIAO_DICH_COC`), 09 (nới ràng buộc `HOA_DON`) |
| **06 — Cổng người thuê** | *(không cấp)* | **0 tệp** | Slice chỉ đọc. Nếu thấy mình cần migration ở đây thì **dừng lại** — nhiều khả năng đang làm việc của slice khác |
| **07 — Sự cố và bảo trì** | `V36`–`V45` | 2–3 tệp | `YEU_CAU_SUA_CHUA`, phân công thợ, chi phí |
| **08 — Thông báo** | `V46`–`V55` | 1–2 tệp | Bảng thông báo, cấu hình mốc nhắc theo toà |
| **09 — Báo cáo** | `V56`–`V60` | 0–2 tệp | Chủ yếu là truy vấn; có thể cần chỉ mục |
| **10 — An toàn và nhật ký** | `V61`–`V70` | 2–3 tệp | Gồm cấp quyền tầng CSDL cho `FR-SEC-07` |
| **12 — Còn thời gian** | `V71`+ | | `CHI_SO_TONG` theo CR-007 |

## Quy tắc

1. **Trước khi đặt tên tệp**, đọc dải của slice mình trong bảng trên. Đừng lấy "số cao nhất hiện có + 1" — trên nhánh của mình con số đó có thể đã lạc hậu so với nhánh chính.
2. Trong một slice, đánh số **tuần tự từ đầu dải**: Slice 05 dùng `V26`, `V27`, `V28`, `V29`.
3. **Khoảng trống là bình thường.** Slice 05 dùng hết `V29` rồi Slice 07 bắt đầu ở `V36` — Flyway không phàn nàn.
4. Dải cạn thì **mở rộng bảng này**, đừng lấn sang dải slice khác.
5. Cách rẻ nhất vẫn là **không chạy song song hai ticket có migration**. Dải số hiệu là lưới an toàn, không phải giấy phép chạy song song vô tội vạ.
