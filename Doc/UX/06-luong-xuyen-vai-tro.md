# Luồng xuyên vai trò

Đọc `00-nen-tang-ux.md` và năm file phân hệ (`01`–`05`) trước.

File này đặc tả những chỗ **hai vai trò trở lên cùng chạm vào một luồng**. Đây là phần dễ hỏng nhất khi mỗi phân hệ được thiết kế riêng lẻ: mỗi bên nhìn đẹp, nhưng ghép lại thì thiếu mắt xích.

---

## 1. Nguyên tắc nền: không ai điều khiển màn hình của ai

**Mọi liên kết giữa các vai trò đi qua *dữ liệu dùng chung*, không đi qua điều hướng.**

Khi QL bấm *"Phát hành"* ở `#23`, QL **không** thấy màn `#32` của người thuê bật lên. QL chỉ thấy `#23` đổi trạng thái tại chỗ. Người thuê, ở một phiên đăng nhập khác, mở `#32` lên thì tự thấy dữ liệu mới — vì `#32` đọc cùng một hoá đơn từ máy chủ.

Hệ quả thiết kế: **mỗi đầu của một luồng xuyên vai trò phải tự đứng vững**, không giả định người kia đang xem.

---

## 2. Luồng A — Báo hỏng → Phân công → Thi công → Đóng

Luồng dài nhất, đi qua **ba vai trò** và tuân theo máy trạng thái `BR-16`.

### 2.1. Bảng chuyển giao

| # | Vai trò | Màn | Hành động | Điều gì xảy ra ở đầu kia |
|---|---|---|---|---|
| 1 | **Người thuê** | `#37` | Gửi báo hỏng + tối đa 5 ảnh | QL thấy yêu cầu mới ở `#38` **và** ở nhóm "Sự cố mới" trên `#42` |
| 2 | **QL** | `#38` → `#39` | Mở yêu cầu, đọc mô tả + ảnh | Trạng thái → *Đã tiếp nhận*. **Người thuê thấy trạng thái đổi ở `#37`** |
| 3 | **QL** | `#39` | Chọn thợ, lưu | Trạng thái → *Đã phân công*. **Việc xuất hiện ở `#40` của đúng thợ đó** |
| 4 | **Thợ** | `#40` | (đến nơi, sửa) → bấm *"Đã sửa xong"* | Trạng thái → *Chờ xác nhận*. **Người thuê nhận thông báo + đồng hồ 72 giờ chạy** |
| 5a | **Người thuê** | `#37` | Bấm *"Đã ổn"* | Trạng thái → *Đã đóng* |
| 5b | **Người thuê** | — | Không làm gì trong 72 giờ | **Hệ thống tự đóng** (`FR-MNT-07`) |
| 5c | **Người thuê** | `#37` | Bấm *"Chưa ổn"* | Trạng thái quay về *Đang xử lý*, **việc hiện lại ở `#40` của thợ** |
| 6 | **QL** | `#39` | Ghi chi phí + bên chịu chi phí | Nếu người thuê chịu → **tự tạo khoản phát sinh vào hoá đơn kỳ sau** (`FR-MNT-06`) |

### 2.2. Bốn mắt xích dễ đứt

| Mắt xích | Nếu thiếu thì sao |
|---|---|
| **Bước 2 — người thuê thấy "Đã tiếp nhận"** | Người thuê tưởng không ai đọc, gọi điện hỏi. Đây là cuộc gọi phòng tránh được bằng một dòng trạng thái |
| **Bước 3 — việc xuất hiện ở `#40`** | Thợ không biết mình có việc. Đầu QL nhìn vẫn "đã phân công", nhưng thực tế không ai làm |
| **Bước 5c — quay lại `#40` của thợ** | Người thuê bấm "Chưa ổn" mà việc không quay lại danh sách thợ thì luồng chết ở đó |
| **Bước 6 — khoản phát sinh có nguồn gốc** | Tháng sau người thuê thấy `350.000 đ` lạ trên hoá đơn → tranh cãi. Xem `03-nguoi-thue.md` mục 3.5 |

### 2.3. Trạng thái phải thống nhất tên gọi ở cả ba đầu

Cùng một trạng thái, ba vai trò nhìn thấy — **phải cùng một nhãn chữ**. Không được QL thấy *"Đã phân công"* còn người thuê thấy *"Đang xử lý"* cho cùng một thời điểm.

| Mã (`BR-16`) | Nhãn hiển thị — dùng chung cả ba vai trò |
|---|---|
| `MOI_TIEP_NHAN` | Mới tiếp nhận |
| `DA_TIEP_NHAN` | Đã tiếp nhận |
| `DA_PHAN_CONG` | Đã phân công |
| `DANG_XU_LY` | Đang xử lý |
| `CHO_XAC_NHAN` | Chờ xác nhận |
| `DA_DONG` | Đã đóng |
| `DA_HUY` | Đã huỷ |

Máy chủ trả cả mã lẫn nhãn; giao diện hiện nhãn và **không tự dịch mã** (xem `00-nen-tang-ux.md` mục 11).

---

## 3. Luồng B — Phát hành hoá đơn → Người thuê nhìn thấy

| # | Vai trò | Màn | Hành động | Đầu kia |
|---|---|---|---|---|
| 1 | **QL** | `#21` | Tạo hoá đơn hàng loạt | Hoá đơn ở trạng thái *Nháp* — **người thuê chưa thấy gì** |
| 2 | **QL** | `#23`/`#24` | Kiểm tra, sửa nháp nếu cần | Vẫn chưa thấy |
| 3 | **QL** | `#23` | Bấm *"Phát hành"* | Trạng thái → *Đã phát hành*. **Người thuê thấy ngay ở `#32`** + nhận thông báo (`FR-INV-08`) |
| 4 | **Người thuê** | `#32` → `#33` | Xem chi tiết | — |
| 5 | **Người thuê** | `#29` | Quét QR, chuyển khoản | **QL chưa biết gì** — hệ thống không tự đối soát ngân hàng |
| 6 | **QL** | `#26` | Ghi nhận thanh toán thủ công | Trạng thái → *Đã thu một phần* / *Đã thanh toán* (`BR-08`). **Người thuê thấy "còn nợ" giảm ở `#33`** |

### 3.1. Khoảng trống ở bước 5 phải được thừa nhận

Giữa lúc người thuê chuyển khoản và lúc QL ghi nhận có một **khoảng trống thời gian** — có thể vài giờ tới vài ngày. Đây không phải lỗi, mà là bản chất của việc đối soát thủ công (`FR-INV-15` xếp việc tự khớp sao kê ở mức *Could have*).

Thiết kế phải nói thật về khoảng trống này, thay vì để người thuê tưởng hệ thống hỏng:

Ở `#33` sau khi người thuê đã mở QR:

> *"Sau khi chuyển khoản, quản lý sẽ xác nhận trong 1–2 ngày làm việc. Trạng thái sẽ tự cập nhật."*

Không nói thì người thuê chuyển khoản xong, mở lại thấy vẫn *"Chưa thanh toán"*, và kết luận là hệ thống không nhận được tiền.

### 3.2. Ranh giới Nháp / Đã phát hành

Đây là ranh giới quan trọng nhất của luồng này:

| | Nháp | Đã phát hành |
|---|---|---|
| Người thuê thấy? | **Không** | **Có, ngay lập tức** |
| QL sửa được? | **Có** (`#24`) | Không (`FR-INV-06`) |
| Sửa sai thế nào? | Sửa trực tiếp | Huỷ (Chủ) + phát hành lại |

Giao diện `#23` phải làm ranh giới này **nhìn thấy được**, vì bấm "Phát hành" là điểm không quay lại: hiện rõ trạng thái hiện tại và câu cảnh báo trong hộp thoại xác nhận (xem `00-nen-tang-ux.md` mục 8.3).

---

## 4. Luồng C — Thu tiền → Công nợ cập nhật

| # | Vai trò | Màn | Hành động | Đầu kia |
|---|---|---|---|---|
| 1 | **QL** | `#26` | Ghi nhận một lần thu (có thể một phần) | **Người thuê** thấy "còn nợ" giảm ở `#33` |
| 2 | — | — | Hệ thống tính lại trạng thái theo `BR-08` | **Chủ** thấy `#41` và `#30` đổi số |
| 3 | Nếu thu thừa | — | Phần dư → số dư khả dụng (`FR-INV-16`) | Người thuê thấy dòng *"Số dư khả dụng 112.000 đ sẽ trừ vào kỳ sau"* ở `#32` |

**Ba vai trò cùng nhìn một con số.** Nếu QL ghi nhận 500.000 đ thì cả ba đầu phải khớp ngay: `#33` của người thuê, `#30` của QL, `#41` của Chủ. Không có độ trễ hiển thị, không có bộ nhớ đệm khiến một bên còn số cũ.

---

## 5. Luồng D — Thông báo

`#44` Hộp thông báo dùng chung mọi vai trò (đặc tả ở `00-nen-tang-ux.md`). Bảng dưới liệt kê **ai nhận gì**:

| Sự kiện | Người nhận thông báo | Bấm vào dẫn tới |
|---|---|---|
| Hoá đơn phát hành (`FR-INV-08`) | Người thuê của phòng đó | `#33` |
| Yêu cầu sửa chữa mới (`FR-MNT-02`) | QL của toà đó | `#39` |
| Được phân công sửa chữa (`FR-MNT-04`) | Thợ được chọn | `#40` |
| Thợ báo đã xong | Người thuê + QL | `#37` / `#39` |
| Hợp đồng còn < 30 ngày (`FR-POR-07`) | Người thuê + QL | `#36` / `#14` |
| Thông báo QL soạn (`#43`) | Người thuê trong phạm vi đã chọn | Hiện nội dung tại chỗ |
| Quyền bị thay đổi (`FR-AUT-07`) | Người bị ảnh hưởng | Màn đăng nhập kèm giải thích |

### 5.1. Ba quy tắc

1. **Thông báo phải dẫn tới hành động**, không chỉ thông báo. Mỗi loại ở bảng trên có đích đến cụ thể.
2. **Không gửi thông báo cho người vừa gây ra sự kiện.** QL bấm phát hành thì QL không nhận thông báo "đã phát hành" — họ vừa làm việc đó.
3. **Lọc đúng phạm vi.** QL soạn *"gửi toàn toà A"* thì chỉ người thuê toà A thấy, không phải toàn hệ thống. Trước khi gửi phải hiện số người nhận cụ thể (`01-quan-ly-toa-nha.md` mục 9).

---

## 6. Ma trận: một dữ liệu, nhiều vai trò nhìn khác nhau

Bảng này chống lỗi thiết kế phổ biến nhất — vẽ một màn hình rồi dùng chung cho mọi vai trò.

| Dữ liệu | QTHT | Chủ | QL | Thợ | Người thuê |
|---|---|---|---|---|---|
| **Hoá đơn** | Không thấy | `#23` đủ quyền + **nút Huỷ** | `#23` không có nút Huỷ | Không thấy | `#33` bản rút gọn, **không nút thao tác** |
| **Chỉ số công tơ** | Không thấy | Sửa được kể cả kỳ đã phát hành (`FR-MTR-10`) | Ghi mới; **khoá sau khi chốt** | Không thấy | Chỉ xem trong hoá đơn của mình |
| **Ảnh giấy tờ** (`BR-17`) | Không thấy | Xem được, **ghi nhật ký** | Xem được toà mình, **ghi nhật ký** | Không thấy | Chỉ ảnh của chính mình |
| **Yêu cầu sửa chữa** | Không thấy | Xem + duyệt chi phí | Toàn quyền vận hành | **Chỉ việc được giao cho mình** | Chỉ yêu cầu mình gửi |
| **Công nợ** | Không thấy | Toàn bộ các toà | Toà được phân công | Không thấy | **Chỉ nợ của chính mình** |
| **Tài khoản người dùng** | Toàn quyền | Không thấy | Không thấy | Không thấy | Không thấy |
| **Nhật ký thao tác** | Toàn bộ | Toà của mình | Không thấy | Không thấy | Không thấy |

**Cách dùng bảng này khi nghiệm thu:** với mỗi màn hình đã thiết kế, đối chiếu xem nút và dữ liệu hiển thị có khớp cột vai trò không. Một nút hiện sai cột là lỗi phân quyền ở tầng thiết kế — và nó sẽ đi thẳng vào mã nếu không bắt ở đây.

---

## 7. Bốn điểm kiểm tra khi ghép các phân hệ

Trước khi coi bản thiết kế là xong, kiểm tra bốn điều này:

1. **Mọi mũi tên ở mục 2–5 có đủ hai đầu chưa?** Mỗi hành động của vai trò này phải có một chỗ cụ thể mà vai trò kia nhìn thấy kết quả.
2. **Nhãn trạng thái có giống nhau ở mọi vai trò không?** Đối chiếu mục 2.3.
3. **Có nút nào hiện sai cột trong ma trận mục 6 không?**
4. **Các khoảng trống thời gian đã được nói ra chưa?** Chuyển khoản → ghi nhận (mục 3.1), thợ sửa xong → người thuê xác nhận (72 giờ). Khoảng trống không nói ra thì người dùng tưởng hệ thống hỏng.
