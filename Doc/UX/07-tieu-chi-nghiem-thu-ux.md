# Tiêu chí nghiệm thu UX

Đọc các file `00`–`06` trước.

File này biến những điều đã đặc tả thành **thứ kiểm tra được**. Không có phần này thì tài liệu UX chỉ là ý kiến; có nó thì nó là hợp đồng.

Ba nhóm: **tiêu chí đo được** (mục 1), **danh mục rà soát trước khi giao** (mục 2), **kịch bản kiểm thử với người thật** (mục 3).

---

## 1. Tiêu chí đo được — lấy từ NFR của dự án

Những con số này không do tài liệu UX tự đặt ra; chúng đã nằm trong tài liệu phân tích yêu cầu và là cam kết của đồ án.

| Mã | Tiêu chí | Ngưỡng | Cách đo |
|---|---|---|---|
| `NFR-USA-01` | Giao diện chạy đúng trên mọi bề rộng | **360px → 1920px** | Kiểm tra ở 5 kích thước: 360, 768, 1024, 1440, 1920 |
| `NFR-USA-02` | Người quản lý mới ghi xong chỉ số | **30 phòng, sau 15 phút hướng dẫn, không cần trợ giúp** | Kiểm thử khả dụng với 3 người thật — kịch bản K1 ở mục 3 |
| `NFR-USA-03` | Nút thao tác chính trên điện thoại | **≥ 44×44 px** | Rà soát thiết kế + đo trên trình duyệt |
| `NFR-USA-04` | Nhãn và thông báo lỗi | **Tiếng Việt có dấu, không mã kỹ thuật** | Liệt kê toàn bộ chuỗi thông báo, rà từng dòng |
| `NFR-USA-05` | Thao tác không đảo ngược được | **Có bước xác nhận nêu rõ hậu quả** | Đối chiếu với 5 hộp thoại ở `00-nen-tang-ux.md` mục 8.3 |
| `NFR-USA-06` | Định dạng số và ngày | **`1.888.000 đ` và `29/08/2026`** | Rà soát giao diện |
| `TC-013-01` | Ghi chỉ số 30 phòng | **≤ 15 phút** | Bấm giờ trong kịch bản K1 |

### 1.1. Tiêu chí bổ sung do tài liệu UX này đặt ra

| Tiêu chí | Ngưỡng | Vì sao |
|---|---|---|
| Thời gian từ đăng nhập tới lúc thợ biết đi phòng nào | **≤ 5 giây, 0 thao tác thừa** | `04-tho-sua-chua.md` mục 6 |
| Thời gian người thuê biết số tiền phải trả | **≤ 3 giây sau đăng nhập, 0 cú bấm** | `FR-POR-01` |
| Thời gian Chủ trả lời được ba câu hỏi | **≤ 3 giây** | `02-chu-so-huu.md` mục 2 |
| Số cú bấm để thợ báo xong một việc | **1** | `04-tho-sua-chua.md` |
| Tỷ lệ hoàn thành ký hợp đồng không bỏ dở | **≥ 90%** trong kiểm thử | `#15` được cảnh báo là dễ bỏ dở |

---

## 2. Danh mục rà soát trước khi giao cho phần code

Chạy toàn bộ danh mục này trên **từng màn hình** đã thiết kế. Một dòng không đạt là một lỗi phải sửa trước, không phải sau.

### 2.1. Trạng thái — 6 điểm

- [ ] Có trạng thái **đang tải** với khung xương giữ đúng chỗ, không nhảy bố cục khi dữ liệu về
- [ ] Có trạng thái **rỗng lần đầu** kèm câu giải thích và **một nút hành động**
- [ ] Có trạng thái **rỗng do lọc**, **khác hẳn** rỗng lần đầu, kèm nút *Xoá bộ lọc*
- [ ] Có trạng thái **lỗi** kèm nút *Thử lại*, không hiện mã kỹ thuật
- [ ] Với `#18`/`#19`: có trạng thái **mất kết nối**, vẫn nhập được
- [ ] Chỉ báo tải chọn đúng theo độ dài chờ (`00` mục 5.1), không dùng một kiểu cho mọi thứ

### 2.2. Điều hướng — 7 điểm

- [ ] Màn hình có **URL riêng, đọc được**
- [ ] Bộ lọc nằm **trong URL**, không trong bộ nhớ tạm
- [ ] Nút **Back** của trình duyệt về đúng chỗ, giữ bộ lọc và vị trí cuộn
- [ ] **F5** không làm mất việc đang làm
- [ ] Vào thẳng URL không đủ quyền → **403 có giải thích**, không chuyển hướng im lặng
- [ ] Không có màn hình nào là **ngõ cụt** — biết đến từ đâu, đi đâu tiếp
- [ ] Đường dẫn phân cấp xuất hiện khi sâu ≥ 3 cấp, **mỗi cấp bấm được**

### 2.3. Biểu mẫu — 8 điểm

- [ ] Nhãn **luôn thấy được**, không dùng chữ mờ trong ô làm nhãn duy nhất
- [ ] Kiểm tra **khi rời ô**, không đợi bấm Gửi
- [ ] Lỗi nằm **ngay dưới ô sai**, có liên kết ngữ nghĩa cho trình đọc màn hình
- [ ] Form dài có **bảng tóm tắt lỗi** ở đầu, con trỏ tự vào, mỗi dòng bấm được — **và vẫn giữ** lỗi từng ô
- [ ] Ô số mở **bàn phím số** trên điện thoại
- [ ] **Enter** gửi được form một-mục-đích trên máy tính
- [ ] Không hỏi lại thứ đã nhập (toà đã chọn ở thanh đầu)
- [ ] Form nhiều bước: có **chỉ báo bước**, **lưu nháp**, **lùi bước tự do**

### 2.4. Tiền và số — 5 điểm

- [ ] Mọi số tiền hiện kèm **phép tính ra nó** (nguyên tắc 1)
- [ ] Định dạng `1.888.000 đ`, dấu **chấm** ngăn nghìn
- [ ] Số trong bảng dùng phông chữ số đều bề ngang, **thẳng cột**
- [ ] Dòng **làm tròn hiện ra**, kể cả khi mang dấu âm
- [ ] Hoá đơn bậc thang hiện **số người ở và số hộ quy đổi** kèm giải thích quy tắc

### 2.5. Khả năng tiếp cận — 8 điểm

- [ ] Nút chính trên điện thoại **≥ 44×44px**; khoảng cách giữa các nút **≥ 8px**
- [ ] **Vòng con trỏ bàn phím không bị xoá**
- [ ] Thứ tự `Tab` theo đúng **thứ tự nhìn thấy**
- [ ] Thanh đầu dính không **che con trỏ** đang focus
- [ ] Ô mật khẩu và OTP **cho phép dán**, khai báo `autocomplete` đúng
- [ ] Nút chỉ có biểu tượng đều có **tên đọc được**
- [ ] Lỗi được **trình đọc màn hình đọc lên**, không chỉ đổi màu viền
- [ ] Mọi trạng thái có **nhãn chữ**, không chỉ có màu

### 2.6. Câu chữ — 5 điểm

- [ ] Nút ghi **động từ + đối tượng**, không ghi *OK*
- [ ] Lỗi nói **cách sửa**, không chỉ nói sai
- [ ] Không có **mã kỹ thuật** nào lọt ra giao diện
- [ ] Không đổ lỗi cho người dùng
- [ ] Chừa chỗ cho tiếng Việt **dài hơn tiếng Anh ~30%**

### 2.7. Riêng cho web (không phải app) — 6 điểm

- [ ] **Không** dùng thanh tab đáy làm điều hướng chính
- [ ] **Không** có màn hình chờ khởi động
- [ ] **Không** có cử chỉ vuốt làm đường duy nhất tới một hành động
- [ ] **Không** mời cài ứng dụng
- [ ] Trình duyệt **phóng to 200%** vẫn dùng được, không khoá `user-scalable`
- [ ] Hoá đơn và biên lai có **bản in A4** riêng, không menu, không nút, có chỗ ký

---

## 3. Kịch bản kiểm thử khả dụng

Năm kịch bản, mỗi kịch bản một vai trò. Làm với **người thật chưa từng thấy sản phẩm**, tối thiểu 3 người mỗi kịch bản.

### Quy tắc chung khi chạy

- **Không hướng dẫn trong lúc làm.** Nếu người thử hỏi, ghi lại câu hỏi đó — đó chính là kết quả.
- **Ghi lại chỗ họ dừng lại lâu**, kể cả khi cuối cùng vẫn làm được. Dừng lâu = giao diện chưa rõ.
- **Đo bằng đồng hồ**, không ước lượng.
- Làm trên **đúng thiết bị và bối cảnh thật** — K1 phải làm ở hành lang, không phải ở bàn.

---

### K1 — Ghi chỉ số 30 phòng (Quản lý toà nhà) · `NFR-USA-02`

**Bối cảnh dựng lại:** đứng ở hành lang, cầm điện thoại một tay, ánh sáng yếu.

**Hướng dẫn cho người thử (15 phút trước khi bắt đầu):** cách đăng nhập, cách mở màn ghi chỉ số. Không hướng dẫn gì thêm.

**Nhiệm vụ:** ghi chỉ số cho 30 phòng.

| Đo cái gì | Ngưỡng đạt |
|---|---|
| Tổng thời gian | **≤ 15 phút** |
| Số lần cần hỏi | **0** |
| Số phòng ghi nhầm | **0** |
| Có tự phát hiện khi gõ sai một chỉ số bất thường không? | **Có** — nhờ mức tiêu thụ hiện ngay |

**Bài kiểm tra cài vào:** ở phòng thứ 12, đưa một chỉ số **nhỏ hơn kỳ trước**. Xem người thử có hiểu thông báo lỗi và tự tìm được nút *"Công tơ đã thay"* không.

**Bài kiểm tra thứ hai:** ở phòng thứ 20, **tắt mạng**. Xem người thử có tiếp tục làm được không, và có hiểu dữ liệu chưa gửi không.

---

### K2 — Chốt kỳ và tạo hoá đơn (Quản lý toà nhà)

**Bối cảnh:** ngồi bàn, máy tính.

**Nhiệm vụ:** chốt kỳ 08/2026 và tạo hoá đơn cho toà A.

**Bài kiểm tra cài vào:** để sẵn **3 phòng thiếu dữ liệu, mỗi phòng thiếu một loại khác nhau** (thiếu chỉ số / thiếu bảng giá / thiếu số người ở).

| Đo cái gì | Ngưỡng đạt |
|---|---|
| Có nhận ra ba loại thiếu là ba việc khác nhau không? | **Có** |
| Tự tìm được đường khắc phục từng loại? | **Có**, không cần hỏi |
| Có hiểu hậu quả của "chốt kỳ" trước khi bấm không? | **Có** — hỏi lại sau khi chạy |
| Sau khi sửa xong, có chạy lại **chỉ 3 phòng** thay vì cả 24 không? | **Có** |

---

### K3 — Hiểu hoá đơn (Người thuê)

**Bối cảnh:** điện thoại, người thử **chưa từng dùng sản phẩm**.

**Nhiệm vụ:** *"Tháng này bạn phải trả bao nhiêu, và vì sao tiền điện cao hơn tháng trước?"*

| Đo cái gì | Ngưỡng đạt |
|---|---|
| Thời gian tới lúc nói được số tiền | **≤ 3 giây**, 0 cú bấm |
| Có tự giải thích được vì sao tiền điện cao không? | **Có** — bằng chỉ số và mức tiêu thụ trên màn |
| Có tìm được ảnh công tơ không? | **Có**, không cần gợi ý |
| Có hiểu dòng làm tròn không? | **Có** — hỏi *"dòng +161 đ này là gì?"* |
| Có hiểu quy đổi hộ không? | **Có** — hỏi *"6 người sao thành 2 hộ?"* |

**Đây là kịch bản quan trọng nhất về mặt sản phẩm.** Nếu người thử không tự giải thích được con số, màn `#33` chưa đạt — và toàn bộ lý do tồn tại của cổng người thuê chưa thành.

---

### K4 — Nhận và báo xong việc (Thợ sửa chữa)

**Bối cảnh:** điện thoại, người thử có **kỹ năng công nghệ thấp** — chọn đúng kiểu người, không chọn sinh viên IT.

**Nhiệm vụ:** *"Hôm nay bạn phải sửa gì, ở đâu? Gọi cho người báo hỏng. Sửa xong thì báo lại."*

| Đo cái gì | Ngưỡng đạt |
|---|---|
| Thời gian biết phải đi phòng nào | **≤ 5 giây** |
| Số cú bấm để gọi điện | **1** |
| Số cú bấm để báo xong | **1** |
| Số lần cần hướng dẫn | **0** |
| Có bấm nhầm "Đã sửa xong" không? Nếu có, có tự hoàn tác được không? | Hoàn tác được trong 10 giây |

---

### K5 — Ba câu hỏi trong ba giây (Chủ sở hữu)

**Bối cảnh:** điện thoại, mô phỏng đang vội — cho người thử **đúng 5 giây** nhìn màn hình rồi che đi.

**Nhiệm vụ:** sau 5 giây, hỏi ba câu: *Tháng này thu được bao nhiêu? Ai đang nợ? Có gì cần quyết?*

| Đo cái gì | Ngưỡng đạt |
|---|---|
| Trả lời đúng cả ba câu sau 5 giây nhìn | **≥ 2/3 người thử** |
| Có nhớ nhầm con số nào không? | **Không** |

Sau đó chuyển sang laptop, nhiệm vụ thứ hai: *"Tìm hoá đơn quá hạn lâu nhất và cho biết phòng nào."*

---

## 4. Cách dùng file này

| Thời điểm | Dùng phần nào |
|---|---|
| Khi Claude Design giao bản thiết kế | Chạy **mục 2** trên từng màn |
| Trước khi giao cho phần code | Chạy lại mục 2 + đối chiếu ma trận quyền ở `06` mục 6 |
| Khi code xong một vertical slice | Chạy kịch bản tương ứng ở **mục 3** |
| Khi viết Chương 6 báo cáo (Kiểm thử) | Kết quả mục 1 và mục 3 là dữ liệu thật để đưa vào |

**Lưu ý cho báo cáo:** kịch bản ở mục 3 sinh ra số liệu định lượng (thời gian, số lần hỏi, tỷ lệ hoàn thành). Đây đúng là loại bằng chứng mà `NFR-USA-02` đòi hỏi — *"kiểm thử khả dụng với 3 người dùng thử"* — nên chạy thật và ghi lại, đừng suy đoán.
