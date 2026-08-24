# 06: Chỉ thấy dữ liệu của toà được gán · FR-AUT-05

**What to build:** Người dùng chỉ đọc được dữ liệu của những toà nhà đã gán cho họ trong `PHAN_QUYEN_TOA`. Quản lý toà A gọi API danh sách toà thì chỉ thấy toà A. Quan trọng hơn: quản lý toà A **gọi thẳng đường dẫn chi tiết của toà B bằng mã định danh đoán được** thì nhận 403, chứ không nhận dữ liệu.

**Đây là ticket an ninh, không phải ticket hiển thị.** Nó phải được kiểm thử theo hướng tấn công: giả định người dùng biết định dạng đường dẫn và đoán được số định danh, vì đó đúng là điều xảy ra ngoài đời. Ca kiểm thử của ticket này là **TC-002-02** trong ma trận truy vết, và là ca nên demo khi bảo vệ.

**Blocked by:** 03, 05

**Status:** ready-for-agent

- [ ] Mặc định là **từ chối** — quy ước số 3. Endpoint mới mà quên khai quyền thì phải đóng, không phải mở
- [ ] Việc lọc theo toà nằm ở tầng máy chủ, không phải lọc ở frontend sau khi đã nhận đủ dữ liệu về
- [ ] Test tấn công: đăng nhập vai quản lý toà A, gọi chi tiết toà B bằng ID, khẳng định nhận **403 chứ không phải 404 rỗng hay 200 rỗng**
- [ ] Chủ sở hữu thấy mọi toà của mình; quản trị hệ thống thấy tất cả; thợ và người thuê thấy đúng phạm vi của họ
- [ ] Test lặp được cho **mọi** endpoint có sau này, không phải viết tay lại từ đầu mỗi lần thêm endpoint
- [ ] Tên test mang mã `FR-AUT-05`, ca kiểm thử mang mã `TC-002-02`
