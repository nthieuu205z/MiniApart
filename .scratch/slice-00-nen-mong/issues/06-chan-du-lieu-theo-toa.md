# 06: Chỉ thấy dữ liệu của toà được gán · FR-AUT-05

**What to build:** Người dùng chỉ đọc được dữ liệu của những toà nhà đã gán cho họ trong `PHAN_QUYEN_TOA`. Quản lý toà A gọi API danh sách toà thì chỉ thấy toà A. Quan trọng hơn: quản lý toà A **gọi thẳng đường dẫn chi tiết của toà B bằng mã định danh đoán được** thì nhận 403, chứ không nhận dữ liệu.

**Đây là ticket an ninh, không phải ticket hiển thị.** Nó phải được kiểm thử theo hướng tấn công: giả định người dùng biết định dạng đường dẫn và đoán được số định danh, vì đó đúng là điều xảy ra ngoài đời. Ca kiểm thử của ticket này là **TC-002-02** trong ma trận truy vết, và là ca nên demo khi bảo vệ.

**Blocked by:** 03, 05

**Status:** done

- [x] Mặc định là **từ chối** — quy ước số 3. Endpoint mới mà quên khai quyền thì phải đóng, không phải mở
- [x] Việc lọc theo toà nằm ở tầng máy chủ, không phải lọc ở frontend sau khi đã nhận đủ dữ liệu về
- [x] Test tấn công: đăng nhập vai quản lý toà A, gọi chi tiết toà B bằng ID, khẳng định nhận **403 chứ không phải 404 rỗng hay 200 rỗng**
- [x] Chủ sở hữu thấy mọi toà của mình; quản trị hệ thống thấy tất cả; thợ và người thuê thấy đúng phạm vi của họ
- [x] Test lặp được cho **mọi** endpoint có sau này, không phải viết tay lại từ đầu mỗi lần thêm endpoint
- [x] Tên test mang mã `FR-AUT-05`, ca kiểm thử mang mã `TC-002-02`

## Comments

- `task-6-brief.md` đang rỗng vì plan này lưu source-of-truth theo numbered issue; implementation bám `task-6-source.md`, ticket này, và API path chính thức trong `Doc/PRJ1_Thiet-ke-giao-dien_Brief.md`.
- Ruling kỹ thuật được áp dụng đúng ticket: thêm `GET /api/toa-nha` và `GET /api/toa-nha/{toaNhaId}`, dùng một service scope tái sử dụng dựa trên `PHAN_QUYEN_TOA`; `QTHT` thấy tất cả, vai trò còn lại bị lọc theo phân quyền.
- Để giữ seed của Ticket 03 nguyên vẹn, test cho `CHU`, `THO`, `NGUOI_THUE` tự thêm rồi xoá bản ghi `PHAN_QUYEN_TOA` tạm thời trong từng lượt chạy.
- Policy chi tiết phân biệt đúng hai trường hợp: ID toà có thật nhưng ngoài phạm vi trả `403` (TC-002-02), còn ID không tồn tại trả `404`.
