# 06: Khai báo thay công tơ · FR-MTR-09 · CR-004 · BR-09

**What to build:** Khi công tơ được thay giữa kỳ, ghi được **bốn** chỉ số thay vì hai: chỉ số đầu kỳ trên công tơ cũ, chỉ số cuối cùng của công tơ cũ, chỉ số đầu của công tơ mới, và chỉ số cuối kỳ trên công tơ mới. Mức tiêu thụ bằng **tổng hai đoạn**.

**Vì sao phải là bốn chỉ số.** CR-004 chỉ ra rằng ERD phiên bản 1.0 chỉ có `chi_so_dau`, `chi_so_cuoi` và một cờ luận lý — tức hệ thống **biết** đã thay công tơ nhưng **không có dữ liệu để tính ra con số**. Công tơ mới thường bắt đầu từ 0, nên lấy hiệu của hai chỉ số đầu-cuối sẽ ra một số âm hoặc một số vô nghĩa.

**Blocked by:** 03

**Status:** done

- [x] Migration thêm `chi_so_cuoi_cong_to_cu` và `chi_so_dau_cong_to_moi` vào `CHI_SO_DICH_VU`, cả hai cho phép rỗng
- [x] Ràng buộc: hai trường đó **chỉ có giá trị khi** `co_thay_cong_to` bật, và **bắt buộc có giá trị** khi cờ đó bật. Ép bằng `CHECK` ở tầng cơ sở dữ liệu
- [x] Giao diện chỉ hiện hai ô thêm khi người dùng bật khai báo thay công tơ
- [x] Công thức tiêu thụ theo BR-09: `(cuối công tơ cũ − đầu kỳ) + (cuối kỳ − đầu công tơ mới)`
- [x] Có test cho ca công tơ mới bắt đầu từ 0, và ca công tơ mới bắt đầu từ một số khác 0
- [x] Tên test mang mã `FR-MTR-09`, `CR-004`, `BR-09`

**Ghi chú.** Phép cộng hai đoạn ở đây là **một phần của BR-09**, mà BR-09 thuộc `billing/calc`. Cân nhắc đặt hàm tính vào `billing/calc` ngay từ ticket này và viết kiểm thử trước — đó đúng là cách Slice 4 sẽ làm, và làm quen trước với một quy tắc nhỏ thì rẻ hơn làm quen với mười chín quy tắc cùng lúc.
