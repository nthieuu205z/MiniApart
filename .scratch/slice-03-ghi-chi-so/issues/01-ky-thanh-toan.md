# 01: Kỳ thanh toán · nền cho cả slice

**What to build:** Mỗi toà nhà mở được một kỳ thanh toán mới (tháng năm), và mọi chỉ số, mọi hoá đơn về sau đều thuộc về một kỳ. Danh sách kỳ hiện rõ kỳ nào đang mở, kỳ nào đã chốt.

Ticket này không đóng một FR nào, nhưng **không có nó thì bảy ticket còn lại của slice không có chỗ mà gắn dữ liệu vào**. Kỳ thanh toán là thực thể trung tâm của toàn bộ phần vận hành.

**Blocked by:** `slice-01 · 01` (toà nhà)

**Status:** done

- [x] Bảng `KY_THANH_TOAN` theo ERD, gắn với một toà nhà, có năm, tháng, ngày bắt đầu, ngày kết thúc, trạng thái
- [x] Ngày bắt đầu và kết thúc suy ra từ `TOA_NHA.ngay_chot_so` — kỳ **không** nhất thiết trùng tháng dương lịch
- [x] Một toà không có hai kỳ trùng năm-tháng: ràng buộc duy nhất ở tầng cơ sở dữ liệu
- [x] Chỉ có **một kỳ đang mở** cho mỗi toà tại một thời điểm
- [x] Kỳ đã chốt thì không mở lại được bằng thao tác thường

## Comments

- Dùng endpoint con của toà nhà để giữ đúng mẫu phân quyền theo toà hiện có.
- Khóa trùng kỳ và một-kỳ-mở được chốt ở cả service lẫn ràng buộc cơ sở dữ liệu.
- Không thêm thao tác mở lại hay chốt kỳ trong ticket này để giữ đúng phạm vi nền tảng của slice.
