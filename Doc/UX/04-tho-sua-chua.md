# Phân hệ Thợ sửa chữa

Đọc `00-nen-tang-ux.md` trước.

**Người đại diện:** chú Tuấn. Kỹ năng công nghệ **thấp nhất trong năm vai trò**. Kỳ vọng nguyên văn từ khảo sát: *"không cần chức năng gì phức tạp hơn"*.

**Đặc thù phân hệ này:** đúng **một màn hình**, và đó là quyết định thiết kế có chủ ý, không phải thiếu sót.

---

## 1. Bối cảnh dùng

| Yếu tố | Thực tế |
|---|---|
| Thiết bị | Điện thoại, **chỉ điện thoại** |
| Tay | Thường **một tay** — tay kia cầm đồ nghề |
| Ánh sáng | Hành lang, tầng hầm, gầm bồn rửa — thường tối |
| Tần suất | Vài lần/tuần, mỗi lần vài phút |
| Kỹ năng | Thấp. **Không đọc hướng dẫn, không thử nghiệm, không khám phá** |

**Hệ quả:** mọi thứ chú Tuấn cần phải nằm trên một màn, thấy được ngay, không giấu sau thao tác nào. Không có menu, không có tab, không có bộ lọc.

---

## 2. Màn `#40` — "Việc của tôi"

`#3` của Thợ **chính là** `#40`, và đây là toàn bộ hệ thống mà vai trò này nhìn thấy.

### 2.1. Nội dung mỗi việc

```
┌──────────────────────────────────┐
│  PHÒNG 302                       │  ← rất to
│  Toà A · Tầng 3                  │
│                                  │
│  Vòi nước bồn rửa bị rỉ          │  ← mô tả, chữ to
│  ● Gấp                           │  ← nhãn chữ + màu
│                                  │
│  [Ảnh 1] [Ảnh 2]                 │  ← ảnh người thuê gửi
│                                  │
│  📞 0912 345 678                 │  ← BẤM LÀ GỌI
│     Anh Hùng · người thuê        │
│                                  │
│  ┌────────────────────────────┐  │
│  │      ĐÃ SỬA XONG           │  │  ← nút rất to
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### 2.2. Bảy yêu cầu bắt buộc

| # | Yêu cầu | Vì sao |
|---|---|---|
| 1 | **Số phòng rất to**, to hơn mọi thứ khác | Đây là thông tin chú Tuấn cần trước tiên: đi đâu |
| 2 | **Số điện thoại bấm là gọi** | Không bắt copy rồi mở ứng dụng điện thoại. Đây là hành động chú dùng nhiều nhất sau khi đọc việc |
| 3 | **Ảnh người thuê gửi hiện sẵn**, không phải bấm mới thấy | Xem ảnh trước khi đi giúp mang đúng đồ nghề |
| 4 | **Nút "Đã sửa xong" rất to**, tối thiểu 44px, đặt cuối mỗi việc | Một tay, trời tối |
| 5 | **Không có bộ lọc, không có sắp xếp, không có tìm kiếm** | Chú Tuấn có 2–5 việc, không cần công cụ quản lý danh sách |
| 6 | Việc **gấp lên đầu**, hệ thống tự sắp | Không bắt người dùng tự sắp |
| 7 | Xong việc → **việc biến mất khỏi danh sách** | Danh sách luôn là "việc còn phải làm", không phải kho lưu trữ |

### 2.3. Ba trạng thái của màn

| Trạng thái | Hiện gì |
|---|---|
| **Có việc** | Danh sách như trên |
| **Hết việc** | *"Hôm nay không có việc nào."* — chữ to, thân thiện. Không để trắng |
| **Chưa tải được** | *"Không tải được danh sách việc. [Thử lại]"* — nút thử lại to |

---

## 3. Luồng — chỉ có ba hành động

| # | Hành động | Kết quả |
|---|---|---|
| 1 | Mở app (đăng nhập) | Thấy `#40` ngay, không qua màn trung gian |
| 2 | Bấm số điện thoại | Gọi trực tiếp — **rời khỏi trình duyệt**, không phải chuyển màn trong sản phẩm |
| 3 | Bấm *"Đã sửa xong"* | Việc chuyển sang *Chờ xác nhận* (`BR-16`), biến mất khỏi `#40` |

**Không có hành động thứ tư.** Thợ không tự nhận việc, không tự tạo việc, không sửa mô tả, không xem lịch sử.

### 3.1. Sau khi bấm "Đã sửa xong"

Đây là điểm duy nhất cần thêm một chút cẩn thận, vì bấm nhầm thì việc biến mất:

- **Không dùng hộp thoại xác nhận** — quá nặng với vai trò này.
- Dùng **hoàn tác**: việc mờ đi, hiện dòng *"Đã báo xong — [Hoàn tác]"* trong **10 giây** rồi mới biến mất hẳn.
- Đây là ứng dụng đúng của nguyên tắc 4 (file nền tảng): hoàn tác tốt hơn hỏi trước.

### 3.2. Ghi chú tuỳ chọn — cân nhắc kỹ trước khi thêm

Có thể thêm ô ghi chú ngắn khi báo xong (*"đã thay gioăng"*), nhưng:

- **Phải là tuỳ chọn**, bỏ trống vẫn báo xong được.
- **Không mở màn mới** — ô nhập hiện ngay tại chỗ.
- Nếu thử nghiệm với người dùng thật cho thấy chú Tuấn bỏ qua nó 100% số lần thì **gỡ đi**, đừng giữ vì "biết đâu có ích".

---

## 4. Điều tuyệt đối không làm

Đây là phân hệ dễ bị "cải tiến" thành hỏng nhất, vì nhìn qua thấy trống trải và người thiết kế muốn thêm vào. Danh sách cấm:

| Không thêm | Vì sao |
|---|---|
| Màn hình thứ hai | Kỳ vọng gốc là *"không cần chức năng gì phức tạp hơn"* |
| Menu điều hướng | Một màn thì không cần điều hướng |
| Lịch sử việc đã làm | Chú Tuấn không tra cứu. Quản lý mới cần, và họ có `#48` |
| Bảng thống kê năng suất | Đây là công cụ quản lý, không phải công cụ của thợ |
| Chức năng chat | Đã có nút gọi điện — cách chú Tuấn vốn dùng |
| Yêu cầu chụp ảnh sau khi sửa | Thêm một rào cản vào bước cuối. Nếu thật sự cần, để **tuỳ chọn** |
| Đánh giá sao | Không phục vụ việc gì |

**Nguyên tắc kiểm tra:** trước khi thêm bất cứ thứ gì vào `#40`, hỏi — *chú Tuấn có bị chặn khỏi việc sửa chữa nếu thiếu cái này không?* Nếu không, đừng thêm.

---

## 5. Danh sách màn hình của phân hệ này

| # | Màn | Mặt bằng | Ghi chú |
|---|---|---|---|
| **40** | **Việc của tôi ★** | **📱** | Toàn bộ phân hệ |

Ngoài ra thợ dùng chung `#1` đăng nhập và `#44` hộp thông báo (xem `00-nen-tang-ux.md`).

---

## 6. Tiêu chí nghiệm thu riêng

Phân hệ này có tiêu chí đo được rất rõ ràng, dùng khi kiểm thử khả dụng:

| Tiêu chí | Ngưỡng |
|---|---|
| Thời gian từ lúc mở đến lúc biết phải đi phòng nào | **Dưới 5 giây**, không cần thao tác nào ngoài đăng nhập |
| Số thao tác để gọi người thuê | **1 chạm** |
| Số thao tác để báo xong một việc | **1 chạm** + 10 giây chờ hoàn tác |
| Số lần cần hướng dẫn để dùng được | **0** — nếu người thử nghiệm cần hỏi, thiết kế sai |
