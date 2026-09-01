# Phân hệ Quản trị hệ thống (QTHT)

Đọc `00-nen-tang-ux.md` trước.

**Người đại diện:** không có persona riêng trong khảo sát — trong thực tế đồ án, đây là vai trò kỹ thuật do một thành viên nhóm hoặc chính chủ sở hữu kiêm nhiệm.

**Đặc thù phân hệ này:** vai trò duy nhất có `#3` **độc lập**, không trùng số với màn nào khác. Ba mục menu: Tài khoản · Toà nhà · Nhật ký. Dùng **hoàn toàn trên máy tính** — không có tình huống quản trị hệ thống từ điện thoại giữa hành lang.

---

## 1. Bối cảnh dùng

| Yếu tố | Thực tế |
|---|---|
| Thiết bị | **Máy tính, 100%** |
| Tần suất | Rất thấp — tạo tài khoản khi có người mới, còn lại là tra cứu khi có sự cố |
| Rủi ro | **Cao** — sai ở đây khoá nhầm người hoặc mở nhầm quyền |
| Kỹ năng | Cao nhất trong năm vai trò |

**Hệ quả:** đây là phân hệ **không tối ưu cho tốc độ**. Tối ưu cho *nhìn thấy rõ hậu quả trước khi làm* và *tra cứu lại được sau khi làm*.

---

## 2. Trang chủ `#3` — bảng điều khiển tối giản

Ba lối vào, không hơn:

| Mục | Con số kèm theo | Dẫn tới |
|---|---|---|
| **Tài khoản** | *"12 tài khoản · 1 đang khoá"* | `#4` |
| **Toà nhà** | *"3 toà · 2 quản lý được phân công"* | `#5` |
| **Nhật ký thao tác** | *"48 thao tác trong 7 ngày qua"* | `#52` |

Con số kèm theo có mục đích: cho biết tình trạng hệ thống mà không cần vào từng màn. *"1 đang khoá"* là thứ đáng để ý ngay.

---

## 3. Màn `#4` — Quản lý tài khoản

Toàn bộ vòng đời tài khoản diễn ra **trong một màn**, không tách ra nhiều trang. Vì số lượng nhỏ (khoảng 10–20 tài khoản), danh sách và chi tiết hiển thị cạnh nhau trên màn rộng.

### 3.1. Bố cục hai cột trên máy tính

```
┌─────────────────────┬──────────────────────────────┐
│  Danh sách tài khoản│  Chi tiết tài khoản đang chọn│
│                     │                              │
│  ● Quản trị hệ thống│  Họ tên, số điện thoại       │
│  ● Nguyễn Văn A     │  Vai trò                     │
│    Chủ sở hữu       │  Toà được phân công          │
│  ● Trần Thị B       │  Trạng thái                  │
│    QL toà A         │                              │
│  ○ Lê Văn C  (khoá) │  [Lưu]  [Khoá tài khoản]     │
│                     │                              │
│  [+ Tạo tài khoản]  │                              │
└─────────────────────┴──────────────────────────────┘
```

Chọn một tài khoản bên trái → chi tiết hiện bên phải. **Không chuyển trang**, vì người dùng thường xem 3–4 tài khoản liên tiếp để so sánh quyền.

### 3.2. Tạo tài khoản

| Bước | Chi tiết UX |
|---|---|
| 1 | Bấm *"Tạo tài khoản"* → form hiện **bên phải**, không mở hộp thoại |
| 2 | Nhập họ tên, số điện thoại, chọn vai trò | **Số điện thoại là định danh đăng nhập** — không dùng email |
| 3 | **Vai trò quyết định các trường tiếp theo** | Chọn "QL toà nhà" → hiện ô chọn toà. Chọn "QTHT" → **không** hiện ô chọn toà |
| 4 | Lưu | Hiện mật khẩu tạm **một lần duy nhất**, kèm nút sao chép |

Bước 3 là chi tiết quan trọng: hiện tất cả các trường của mọi vai trò rồi mờ đi những cái không dùng sẽ làm form dài gấp đôi mà không thêm thông tin. **Hiện dần theo lựa chọn.**

Bước 4 — mật khẩu tạm: nói rõ *"Mật khẩu này chỉ hiện một lần. Gửi cho người dùng và yêu cầu đổi ở lần đăng nhập đầu."*

### 3.3. Khoá tài khoản — không xoá

`FR-AUT-06` và `BR-18`: tài khoản đã phát sinh dữ liệu **không xoá được**.

| Yêu cầu | Thể hiện |
|---|---|
| Chỗ thường có nút thùng rác → đặt nút **"Khoá tài khoản"** | |
| Hộp thoại nêu hậu quả | *"Khoá tài khoản Trần Thị B? Người này sẽ không đăng nhập được nữa. **Lịch sử thao tác và các bản ghi đã tạo vẫn giữ nguyên.** Có thể mở khoá lại sau."* |
| Giải thích chủ động vì sao không xoá | Dòng nhỏ dưới nút: *"Tài khoản không xoá được — vì các bản ghi chỉ số, thanh toán và nhật ký đều tham chiếu tới người thực hiện."* |
| Mở khoá lại được | Tài khoản đã khoá hiện nút *"Mở khoá"*, không biến mất khỏi danh sách |

### 3.4. Thu hồi quyền có hiệu lực ngay — `FR-AUT-07`

Yêu cầu gốc: người bị thu hồi quyền thì phiên đăng nhập phải chết **trong vòng 5 phút**.

Hệ quả UX cần thể hiện: sau khi khoá tài khoản hoặc đổi vai trò, hiện xác nhận nói rõ điều đã xảy ra:

> *"Đã khoá tài khoản Trần Thị B. Nếu người này đang đăng nhập, phiên làm việc sẽ kết thúc ngay lập tức."*

Ở phía người bị thu hồi, họ thấy màn chuyển về đăng nhập kèm câu giải thích — **không phải một lỗi kỹ thuật không hiểu**:

> *"Quyền truy cập của bạn đã thay đổi. Đăng nhập lại hoặc liên hệ quản trị viên."*

### 3.5. Phân công toà — điểm dễ sai nhất

Đây là chỗ một cú bấm nhầm khiến quản lý toà A đọc được dữ liệu toà B.

| Yêu cầu | Chi tiết |
|---|---|
| Hiện rõ đang phân công **ai** cho **toà nào** | Không dùng danh sách chọn nhiều mục trơ trọi |
| Xem trước hậu quả trước khi lưu | *"Trần Thị B sẽ đọc và sửa được toàn bộ dữ liệu của **Toà A** (24 phòng, 22 hợp đồng)."* |
| Gỡ phân công cũng phải xác nhận | *"Gỡ Trần Thị B khỏi Toà A? Người này sẽ mất quyền truy cập toàn bộ dữ liệu toà A ngay lập tức."* |
| QTHT **không** tự gán toà cho chính mình | Ngăn leo thang quyền. Nếu cần, phải do Chủ thực hiện |

---

## 4. Màn `#5` — Toà nhà, ở chế độ quản trị

QTHT thấy danh sách toà **nhưng không thao tác nghiệp vụ bên trong**. Quyền khác hẳn Chủ và QL:

| Vai trò | Ở `#5` làm được gì |
|---|---|
| **Chủ** | Tạo toà mới, sửa tham số, vào mọi màn nghiệp vụ |
| **QL** | Xem toà được phân công, vào màn vận hành |
| **QTHT** | **Chỉ xem danh sách + biết toà nào có ai quản lý.** Không vào hoá đơn, không vào chỉ số |

Ranh giới này phải thể hiện ở giao diện: QTHT mở `#5` thì **không thấy** các nút dẫn vào màn nghiệp vụ. Không phải thấy rồi bấm vào bị chặn.

---

## 5. Màn `#52` — Nhật ký thao tác

Màn tra cứu thuần tuý. Dùng khi có sự cố: *"ai đã sửa chỉ số phòng 302?"*, *"ai xem ảnh giấy tờ của người thuê này?"* (`BR-17`).

### 5.1. Yêu cầu

| Yêu cầu | Chi tiết |
|---|---|
| **Chỉ đọc tuyệt đối** | Không có nút sửa, không có nút xoá. `BR-18` |
| Bộ lọc | Theo người thực hiện · theo loại thao tác · theo khoảng thời gian · theo đối tượng bị tác động |
| Bộ lọc nằm trong URL | Chia sẻ được kết quả tra cứu |
| Mỗi dòng trả lời đủ 4 câu | **Ai** · **làm gì** · **với cái gì** · **lúc nào** |
| Thao tác nhạy cảm nổi bật | Xem ảnh giấy tờ, huỷ hoá đơn, sửa chỉ số kỳ đã phát hành, khoá tài khoản |
| Phân trang, không cuộn vô tận | Người dùng cần quay lại đúng trang đã xem |

### 5.2. Ví dụ một dòng đúng

```
29/08/2026 14:32   Trần Thị B (QL toà A)
Xem ảnh giấy tờ    Người thuê: Nguyễn Văn Hùng (phòng 302)
```

So với một dòng sai — không đủ ngữ cảnh để dùng vào việc gì:

```
14:32  user_3  VIEW_DOCUMENT  id=1842
```

`NFR-USA-04` cấm hiện mã kỹ thuật cho người dùng, và nhật ký không phải ngoại lệ.

---

## 6. Danh sách màn hình của phân hệ này

| # | Màn | Mặt bằng | Ghi chú UX |
|---|---|---|---|
| 3 | Trang chủ QTHT | 🖥 | Ba lối vào kèm con số tình trạng |
| 4 | Quản lý tài khoản | 🖥 | Hai cột; khoá không xoá; hiện dần theo vai trò |
| 5 | Danh sách toà nhà | 🖥 | **Chỉ xem** — không có nút vào màn nghiệp vụ |
| 52 | Nhật ký thao tác | 🖥 | Chỉ đọc, bộ lọc trong URL, không mã kỹ thuật |

---

## 7. Bốn bẫy UX của phân hệ này

1. **Đặt nút Xoá tài khoản.** Không có nút này. Và phải **giải thích chủ động** vì sao, nếu không người dùng đi tìm rồi kết luận phần mềm thiếu.
2. **Phân công toà bằng danh sách chọn nhiều mục trơ trọi.** Đây là thao tác quyết định ai đọc được dữ liệu của ai — phải xem trước hậu quả bằng con số.
3. **Nhật ký hiện mã kỹ thuật.** `user_3`, `VIEW_DOCUMENT`, `id=1842` là dữ liệu thô, không phải nhật ký dùng được.
4. **Cho QTHT vào được màn nghiệp vụ.** QTHT quản trị tài khoản, không vận hành toà nhà. Ranh giới này phải thấy được ở giao diện, không chỉ chặn ở máy chủ.
