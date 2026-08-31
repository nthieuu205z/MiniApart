# 05: Kiểm thử hồi quy lược đồ cho các cột tiền · quy ước 1 · FR-INV-02

**What to build:** Một kiểm thử đọc `information_schema` sau khi Flyway chạy xong, khẳng định **mọi cột tiền đều là `NUMERIC(15,2)`**. Hiện chỉ có SQL viết đúng, không có gì chặn một migration sau này viết sai.

**Status:** done

**Blocked by:** None. Nên làm **trước** khi Slice 05 bắt đầu.

## Lỗ hổng

`MONEY_RULE_REASON` trong `ArchitectureRules.java` phát biểu quy ước cho **cả hai phía**:

> *"Tiền phải dùng BigDecimal (Java) và NUMERIC(15,2) (Postgres)"*

Nhưng ArchUnit đọc bytecode. Nó **không đọc được tệp `.sql`**. Nghĩa là vế Postgres của quy ước 1 hiện **không có ràng buộc máy nào cả**.

Thực trạng đang tốt: 25 migration, `grep -rn "DOUBLE PRECISION\|REAL\|FLOAT"` trả về **rỗng**, và năm bảng hoá đơn mới của Slice 04 (`V22`–`V25`) dùng đúng `NUMERIC(15,2)` cho cả 13 cột tiền. Nhưng đó là kỷ luật, không phải ràng buộc.

## Vì sao migration là chỗ nguy hiểm nhất để dựa vào kỷ luật

Migration là **chỉ-ghi-thêm**. Ticket `slice-02/02` ghi rõ nguyên tắc: *"V1–V9 were not changed"* — migration đã chạy thì không sửa được nữa, chỉ thêm `V26`, `V27`.

Nên một cột `DOUBLE PRECISION` lọt vào `V26` sẽ không sửa được bằng cách sửa `V26`. Phải viết thêm `V27` để `ALTER COLUMN`, trên bảng có thể đã có dữ liệu, mà dữ liệu đó đã bị `double` làm sai từ lúc ghi vào. **Lỗi này không có nút hoàn tác.**

Slice 05 thêm bảng thanh toán, bút toán đối ứng, số dư khả dụng — toàn cột tiền, viết bởi một agent có thể không đọc quy ước 1. Đây đúng là lúc cần cái lưới.

## Đã có khuôn sẵn

`backend/src/test/java/com/prj1/ccm/auth/AuthMigrationRegressionTest.java` là tiền lệ: một test Testcontainers chạy Flyway thật rồi khẳng định ở mức lược đồ. Có 25 lớp test đã dùng Testcontainers, hạ tầng sẵn sàng.

Đặt test mới cạnh `ArchitectureRulesTest`, vì về bản chất nó là **luật kiến trúc cho tầng cơ sở dữ liệu**, không phải test của riêng phân hệ nào.

## Nhận diện cột tiền thế nào

Đừng liệt kê tay danh sách cột — danh sách sẽ lạc hậu ngay ở migration tiếp theo, và một test lạc hậu còn tệ hơn không có test vì nó tạo cảm giác an toàn giả.

Dùng **quy ước đặt tên**. Quét `information_schema.columns` tìm cột có tên khớp các gốc từ đang dùng trong lược đồ: `*_tien`, `tien_*`, `so_tien`, `don_gia`, `gia_*`, `thanh_tien`, `da_thu`, `tong_tien`. Với mỗi cột khớp, khẳng định `data_type = 'numeric'`, `numeric_precision = 15`, `numeric_scale = 2`.

**Xử lý ngoại lệ cho tử tế.** Có cột hợp lệ mà không phải tiền và sẽ dính bẫy tên gọi — ví dụ `BANG_GIA_BAC_THANG.ty_le` là `NUMERIC(10,2)`, `PHONG.dien_tich` là `NUMERIC(10,2)`. Nếu chúng khớp mẫu tìm kiếm thì đưa vào một **danh sách loại trừ có ghi lý do từng dòng**, đừng nới lỏng điều kiện khớp. Danh sách loại trừ có chú thích thì đọc được; điều kiện khớp nới lỏng thì không ai biết nó đã bỏ sót gì.

## Hoàn thành khi

- [x] Test chạy Flyway đầy đủ rồi truy vấn `information_schema.columns`, không đọc tệp `.sql` bằng chuỗi
- [x] Nhận diện cột tiền theo **quy ước đặt tên**, không phải danh sách cứng
- [x] Khẳng định đủ ba thứ: `numeric`, `precision = 15`, `scale = 2`
- [x] Danh sách loại trừ — nếu cần — có **lý do viết cạnh từng dòng**
- [x] **Ca kiểm thử tự chứng minh:** test phải đỏ nếu có một cột tiền sai kiểu. Chứng minh bằng cách tạm thêm một bảng sai kiểu trong test rồi khẳng định luật cắn, hoặc bằng một khẳng định tương đương — không nhận một test chỉ biết xanh
- [x] Thông báo khi đỏ **nêu đúng tên bảng và tên cột** sai, không chỉ "có cột sai kiểu"
- [x] Tên test mang mã `FR-INV-02` và nhắc quy ước 1

## Comments

- Thêm `MoneySchemaRegressionTest`: chạy toàn bộ 25 migration Flyway trên PostgreSQL 17 Testcontainer, đọc `information_schema.columns`, và kiểm tra `numeric(15,2)` theo quy ước tên cột.
- Danh sách loại trừ có lý do cho diện tích, tỷ lệ, timestamp đăng nhập, và giá trị text của audit; không liệt kê cứng từng cột tiền.
- Test tự dựng `TEST_SAI_TIEN.so_tien DOUBLE PRECISION` để khẳng định failure message nêu đúng `TABLE.column` và kiểu sai. Schema regression test và full backend suite đều xanh.
