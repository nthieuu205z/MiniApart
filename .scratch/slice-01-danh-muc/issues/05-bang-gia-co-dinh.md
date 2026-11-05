# 05: Bảng giá theo ngày hiệu lực · FR-BLD-06

**What to build:** Mỗi dịch vụ có một dãy đơn giá, mỗi đơn giá kèm **ngày bắt đầu hiệu lực**. Sửa giá không ghi đè giá cũ mà thêm một dòng mới. Màn hình hiện cả lịch sử giá, và nói rõ dòng nào đang áp dụng hôm nay.

**Cái bẫy của ticket này, và là lý do nó đáng làm kỹ.** Quy tắc tra giá **không phải** "lấy dòng mới nhất". Chép nguyên từ CR-003:

> lấy bản có `ngay_hieu_luc` **lớn nhất nhưng không vượt quá ngày kết thúc kỳ đang tính**

Lấy dòng mới nhất thì mỗi lần tăng giá điện, **mọi hoá đơn cũ in lại sẽ ra số tiền mới** — vi phạm trực tiếp NFR-CMP-02. Đây là lỗi im lặng: không có thông báo lỗi nào, chỉ có con số khác đi.

**Blocked by:** 04

**Status:** done

- [x] Bảng `BANG_GIA` nhiều dòng cho một dịch vụ, mỗi dòng một `ngay_hieu_luc`
- [x] `don_gia` là `NUMERIC(15,2)`
- [x] Hàm tra giá nhận vào **một ngày** và trả về đơn giá áp dụng cho ngày đó
- [x] Có test cho ba tình huống: ngày trước mọi mốc hiệu lực (không có giá, phải báo lỗi rõ ràng chứ không trả 0), ngày đúng bằng một mốc, ngày giữa hai mốc
- [x] **Test then chốt:** đặt giá cho tháng 1, tra ra giá A. Thêm một mức giá mới hiệu lực từ tháng 3. Tra lại cho tháng 1 — **vẫn phải ra giá A**. Test này là thứ chứng minh NFR-CMP-02 được tôn trọng
- [x] Không sửa và không xoá được dòng giá đã tồn tại — chỉ thêm dòng mới
- [x] Tên test mang mã `FR-BLD-06`

## Comments

- Implemented append-only fixed-price history through `GET`/`POST /api/dich-vu/{id}/bang-gia`, with requested-date lookup using the greatest effective date not after the requested date.
- History responses identify the row applicable today; forbidden roles and out-of-scope managers receive explicit HTTP 403 coverage.
- Verification: full backend suite passed with Java 21 and `--rerun-tasks` (69 tests, 0 failures/errors). Review fix round 1 confirmed the today-marker test uses a deterministic test clock while production clock semantics remain unchanged.
