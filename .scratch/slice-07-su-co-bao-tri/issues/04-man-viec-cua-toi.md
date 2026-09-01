# 04: Màn `#40` "Việc của tôi" · FR-MNT-04 · NFR-USA-03

**What to build:** Giao diện của thợ. **Đúng một màn**, và đó là toàn bộ hệ thống mà vai trò này nhìn thấy.

**Blocked by:** 03

**Status:** ready-for-agent

## Đây là phân hệ dễ bị "cải tiến" thành hỏng nhất

`Doc/UX/04-tho-sua-chua.md` cảnh báo thẳng: nhìn qua thấy trống trải và người thiết kế muốn thêm vào. Tài liệu có sẵn **danh sách bảy thứ cấm thêm**:

màn hình thứ hai · menu điều hướng · lịch sử việc đã làm · bảng thống kê năng suất · chức năng chat · bắt buộc chụp ảnh sau khi sửa · đánh giá sao

**Nguyên tắc kiểm tra trước khi thêm bất cứ thứ gì:** *chú Tuấn có bị chặn khỏi việc sửa chữa nếu thiếu cái này không?* Không thì đừng thêm.

## Bối cảnh dùng quyết định thiết kế

| Yếu tố | Thực tế |
|---|---|
| Thiết bị | Điện thoại, **chỉ điện thoại** |
| Tay | Thường **một tay** — tay kia cầm đồ nghề |
| Ánh sáng | Hành lang, tầng hầm, gầm bồn rửa — thường tối |
| Kỹ năng | Thấp nhất trong năm vai trò. **Không đọc hướng dẫn, không thử nghiệm, không khám phá** |

## Bảy yêu cầu bắt buộc

| # | Yêu cầu | Vì sao |
|---|---|---|
| 1 | **Số phòng rất to**, to hơn mọi thứ khác | Thông tin cần trước tiên: đi đâu |
| 2 | **Số điện thoại bấm là gọi** | Không bắt copy rồi mở ứng dụng điện thoại |
| 3 | **Ảnh người thuê gửi hiện sẵn**, không phải bấm mới thấy | Xem trước khi đi giúp mang đúng đồ nghề |
| 4 | Nút *"Đã sửa xong"* rất to, **tối thiểu 44×44 px** | Một tay, trời tối — `NFR-USA-03` |
| 5 | **Không bộ lọc, không sắp xếp, không tìm kiếm** | Thợ có 2–5 việc, không cần công cụ quản lý danh sách |
| 6 | Việc **gấp lên đầu**, hệ thống tự sắp | Không bắt người dùng tự sắp |
| 7 | Xong việc → **biến mất khỏi danh sách** | Danh sách là "việc còn phải làm", không phải kho lưu trữ |

## Ba trạng thái của màn

| Trạng thái | Hiện gì |
|---|---|
| Có việc | Danh sách |
| **Hết việc** | *"Hôm nay không có việc nào."* — chữ to, thân thiện. **Không để trắng** |
| **Chưa tải được** | *"Không tải được danh sách việc. [Thử lại]"* — nút thử lại to |

Rỗng và lỗi là **hai màn khác nhau**, đúng mục 5 của `Doc/UX/00-nen-tang-ux.md`.

## Sau khi bấm "Đã sửa xong" — dùng hoàn tác, không dùng hộp thoại

Đây là điểm duy nhất cần cẩn thận, vì bấm nhầm thì việc biến mất.

- **Không hộp thoại xác nhận** — quá nặng với vai trò này
- Dùng **hoàn tác**: việc mờ đi, hiện *"Đã báo xong — [Hoàn tác]"* trong **10 giây** rồi mới biến mất hẳn
- Toàn hệ thống chỉ có **đúng năm** chỗ được dùng hộp thoại xác nhận (`00-nen-tang-ux.md` mục 8); đây không phải một trong năm

## Ghi chú tuỳ chọn — cân nhắc kỹ trước khi thêm

Có thể thêm ô ghi chú ngắn khi báo xong (*"đã thay gioăng"*), nhưng:

- **Phải là tuỳ chọn**, bỏ trống vẫn báo xong được
- **Không mở màn mới** — ô nhập hiện ngay tại chỗ
- Nếu thử với người dùng thật cho thấy bỏ qua 100% số lần thì **gỡ đi**, đừng giữ vì "biết đâu có ích"

## Hoàn thành khi

- [ ] Đúng **một màn**. Không màn thứ hai, không menu
- [ ] Bảy yêu cầu ở bảng trên đều đạt
- [ ] Vùng bấm của nút chính **≥ 44×44 px** — đo thật, không ước lượng
- [ ] Ba trạng thái đều có, rỗng và lỗi là hai câu khác nhau
- [ ] Báo xong dùng **hoàn tác 10 giây**, không hộp thoại
- [ ] Chạy được ở **360 px** (`NFR-USA-01`), không cuộn ngang
- [ ] Không có thứ nào trong **danh sách bảy điều cấm**
- [ ] Chữ hiển thị tiếng Việt, **không mã lỗi kỹ thuật** (`NFR-USA-04`)

## Tiêu chí nghiệm thu riêng

Từ `Doc/UX/04-tho-sua-chua.md` mục 6 — đo được, dùng khi kiểm thử khả dụng:

| Tiêu chí | Ngưỡng |
|---|---|
| Từ lúc mở đến lúc biết phải đi phòng nào | **Dưới 5 giây**, không thao tác nào ngoài đăng nhập |
| Số thao tác để gọi người thuê | **1 chạm** |
| Số thao tác để báo xong một việc | **1 chạm** + 10 giây chờ hoàn tác |
| Số lần cần hướng dẫn để dùng được | **0** — người thử phải hỏi thì thiết kế sai |

## Comments
