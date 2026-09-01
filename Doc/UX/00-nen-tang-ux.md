# MiniApart — Nền tảng UX

Tài liệu số 0 của bộ đặc tả trải nghiệm. **Đọc file này trước mọi file khác.** Mọi quy tắc ở đây áp dụng cho toàn bộ 53 màn hình và cả 5 vai trò; các file 01–05 chỉ mô tả phần riêng của từng phân hệ và **không lặp lại** những gì đã nói ở đây.

**Phạm vi:** tài liệu này đặc tả **hành vi** — luồng thao tác, chuyển màn, trạng thái, xử lý lỗi, phản hồi vi mô. Nó **không** đặc tả hình thức — màu, phông, khoảng cách, thành phần đồ hoạ thuộc phần thiết kế giao diện, làm riêng.

---

## 1. Sản phẩm này là gì — và không là gì

**Là:** một **ứng dụng web chạy trong trình duyệt**. Mở bằng địa chỉ web, không cài đặt.

**Không là:** một ứng dụng gốc trên điện thoại.

Phân biệt này quyết định rất nhiều thứ bên dưới, nên nói rõ ngay:

| Mặt bằng | Độ rộng | Ai dùng, làm gì | Mức ưu tiên |
|---|---|---|---|
| **Máy tính để bàn / laptop** | ≥ 1280px | Quản lý toà nhà, Chủ sở hữu, Quản trị hệ thống — toàn bộ công việc bàn giấy: khai báo, chốt kỳ, tạo hoá đơn, đối soát, báo cáo | **Chính** |
| Máy tính bảng / cửa sổ hẹp | 768–1279px | Cùng những người trên, khi thu nhỏ cửa sổ hoặc dùng máy tính bảng | Phụ — dùng lại bố cục máy tính, thu menu thành dải biểu tượng |
| **Trình duyệt trên điện thoại** | 360–767px | Đúng ba việc ngoài hiện trường: **ghi chỉ số công tơ**, **màn hình thợ**, **cổng người thuê** | **Chính cho ba việc đó, phụ cho phần còn lại** |

Ràng buộc gốc: `NFR-USA-01` buộc giao diện chạy đúng từ **360px đến 1920px**. Không có màn hình nào được phép hỏng ở một trong hai đầu.

### 1.1. Khai thác trình duyệt như một tính năng, không phải như một khung chứa

Người dùng đã biết dùng trình duyệt trước khi biết sản phẩm này. Mọi thói quen đó phải hoạt động:

| Khả năng của trình duyệt | Bắt buộc phải đúng |
|---|---|
| **Địa chỉ URL** | Mỗi màn hình có URL riêng, đọc được: `/toa/A/ky/2026-08/ghi-chi-so`. Chủ gửi đường dẫn hoá đơn qua Zalo cho quản lý, mở ra đúng hoá đơn đó |
| **Nút Back / Forward** | Đi đúng lịch sử, không nhảy về trang chủ, không mất bộ lọc đang đặt |
| **Đánh dấu trang (bookmark)** | Quản lý ghim màn ghi chỉ số của toà mình. Mở lại tháng sau vẫn đúng màn, tự nhảy sang kỳ hiện hành |
| **F5 / tải lại** | Không mất việc đang làm. Form nhiều bước phải khôi phục được (xem mục 6.3) |
| **Mở nhiều tab** | Quản lý mở song song hoá đơn phòng 302 và bảng giá để đối chiếu. Hai tab không được giẫm lên nhau (xem mục 8.4) |
| **`Ctrl+F` của trình duyệt** | Danh sách phải in ra DOM thật, không ảo hoá quá tay khiến tìm kiếm của trình duyệt không thấy dòng dưới |
| **Phóng to 200%** | `NFR-USA-01` gián tiếp đòi điều này. Không khoá `user-scalable=no` |
| **In (`Ctrl+P`)** | Hoá đơn và biên lai phải có bản in A4 riêng — đây là thứ dán lên cửa phòng |
| **Trình quản lý mật khẩu** | Ô đăng nhập phải có `autocomplete` đúng chuẩn, **cho phép dán**. WCAG 2.2 AA *Accessible Authentication* cấm chặn dán mà không có cách khác |

### 1.2. Sáu khuôn mẫu của app gốc — không dùng

1. **Thanh tab cố định ở đáy làm điều hướng chính.** Trên web, điều hướng chính là menu dọc bên trái (máy tính) hoặc menu bung ra từ nút ở đầu trang (điện thoại). Thanh đáy chỉ được dùng làm **thanh hành động theo ngữ cảnh** trong màn ghi chỉ số và màn thợ — hai màn dùng bằng một tay ngoài hiện trường.
2. **Màn hình chờ khởi động (splash).** Web không có bước cài đặt, không cần màn chờ thương hiệu. Vào thẳng.
3. **Vuốt để xoá / vuốt để lưu trữ như đường duy nhất.** Cử chỉ vuốt không khám phá được và không có trên máy tính. Mọi hành động phải có nút thấy được.
4. **Kéo xuống để tải lại như đường duy nhất.** Trên web đã có F5. Nếu muốn có nút "Tải lại" thì đặt nút thật.
5. **Lời mời cài ứng dụng.** Hùng — người thuê trong khảo sát — nói thẳng là *ngại cài thêm app chỉ để xem tiền phòng*. Đừng hỏi.
6. **Chuyển màn kiểu đẩy trang ngang (push transition).** Đó là ngôn ngữ của app gốc. Trên web, chuyển trang nên gần như tức thì; hiệu ứng nếu có thì chỉ là mờ dần rất ngắn.

---

## 2. Bốn người dùng thật — và điều mỗi người sợ

Lấy từ khảo sát ở Chương 2 báo cáo. Mọi quyết định UX dưới đây truy về được một trong bốn người này.

| | Anh Minh — Chủ sở hữu | Chị Lan — Quản lý toà | Chú Tuấn — Thợ | Hùng — Người thuê |
|---|---|---|---|---|
| **Việc cần làm** | Biết ba con số trong ba giây: thu được bao nhiêu, ai đang nợ, có gì cần quyết | Chạy trọn một kỳ: ghi chỉ số → chốt → tạo hoá đơn → thu tiền | Biết hôm nay phải sửa gì, ở phòng nào | Biết tiền phòng tháng này bao nhiêu và **vì sao** |
| **Thiết bị chính** | Điện thoại lúc đi đường, laptop lúc ngồi làm | **Máy tính để bàn** cho việc bàn giấy, **điện thoại** khi đi hành lang ghi chỉ số | Điện thoại, chỉ điện thoại | Điện thoại |
| **Kỹ năng** | Trung bình — Zalo, Excel cơ bản, ngân hàng số | Cơ bản | Thấp | Thành thạo |
| **Điều sợ nhất** | Không biết tiền đi đâu | **Bấm nhầm làm mất dữ liệu.** Ngại quy trình nhiều bước | Phần mềm phức tạp hơn mức cần | Bị tính sai mà không kiểm tra được |
| **Hệ quả UX bắt buộc** | Màn tổng quan trả lời đúng ba câu, không hơn | Mọi thao tác phá huỷ đều xác nhận **và nêu hậu quả** (`NFR-USA-05`); mọi thao tác thường đều hoàn tác được | Một màn hình, không có màn thứ hai | Mỗi dòng hoá đơn kiểm tra lại được bằng máy tính bỏ túi |

> **Câu nói định hình cả sản phẩm** — Hùng, khảo sát: *"tiền điện tự nhiên gấp rưỡi, tôi không biết đường nào mà kiểm tra"*. Toàn bộ triết lý minh bạch số liệu ở mục 5 sinh ra từ câu này.

---

## 3. Bảy nguyên tắc UX chi phối mọi màn hình

Không phải gợi ý. Vi phạm là làm hỏng sản phẩm.

**1. Con số phải tự bào chữa được.** Không bao giờ hiện một số tiền mà không hiện phép tính ra nó. `203.000 đ` là vô nghĩa; `1.240 → 1.298 = 58 kWh × 3.500 đ = 203.000 đ` là kiểm tra được. Áp dụng cho mọi dòng tiền, mọi màn, mọi vai trò.

**2. Người nhập phải phát hiện lỗi khi còn sửa được.** Chị Lan đứng trước công tơ là lúc duy nhất chị đối chiếu được với thực tế. Tính mức tiêu thụ **ngay khi gõ xong** (`FR-MTR-02`), không đợi tới lúc chốt kỳ. Lỗi phát hiện muộn một tuần là lỗi phải huỷ hoá đơn.

**3. Không có gì biến mất im lặng.** Dữ liệu tiền không xoá được (`BR-18`). Với dữ liệu khác, mọi thay đổi đều để lại dấu vết xem lại được. Chỗ người ta quen thấy nút thùng rác thì ở đây là **Khoá** hoặc **Huỷ kèm lý do**.

**4. Hoàn tác tốt hơn hỏi trước.** Với thao tác đảo ngược được, làm ngay rồi cho hoàn tác trong 10 giây — nhanh hơn và ít mệt hơn hộp thoại xác nhận. Hộp thoại xác nhận chỉ dành cho thao tác **thật sự không đảo ngược được**, và khi đó phải nêu rõ hậu quả bằng con số cụ thể (`NFR-USA-05`).

**5. Trạng thái nói bằng chữ, không chỉ bằng màu.** Khoảng 8% nam giới rối loạn sắc giác đỏ–lục, và ảnh chụp màn hình in đen trắng vào báo cáo sẽ mất hết màu. Mọi trạng thái phải có **nhãn chữ** đi kèm.

**6. Máy chủ là nơi phán quyết, giao diện chỉ là nơi trình bày.** Ẩn một nút không phải là chặn quyền. Nhưng ngược lại cũng đúng: nếu máy chủ sẽ từ chối, đừng để người dùng gõ xong 5 phút rồi mới báo — chặn sớm ở giao diện **và** chặn thật ở máy chủ.

**7. Không màn hình nào là ngõ cụt.** Mọi màn đều phải trả lời được: người ta tới đây từ đâu, làm xong thì đi đâu, nếu không có dữ liệu thì làm gì tiếp.

---

## 4. Kiến trúc thông tin và điều hướng

### 4.1. Khung ứng dụng

**Máy tính (≥1280px)** — bố cục ba vùng cố định:

```
┌────────────┬──────────────────────────────────────────────┐
│            │  Thanh đầu: [Toà đang chọn ▾]  [Kỳ ▾]        │
│   Menu     │              [🔔 Thông báo]  [Tên người ▾]   │
│   dọc      ├──────────────────────────────────────────────┤
│   trái     │  Đường dẫn phân cấp: Toà A › Kỳ 08/2026 › …  │
│            ├──────────────────────────────────────────────┤
│  (luôn     │                                              │
│   hiện)    │              Vùng nội dung                   │
│            │                                              │
└────────────┴──────────────────────────────────────────────┘
```

- **Menu trái luôn hiện**, không giấu sau nút ba gạch. Người dùng máy tính cần thấy toàn bộ phạm vi công việc của mình.
- **Bộ chọn toà nhà và kỳ nằm ở thanh đầu**, không nằm trong từng màn. Đây là **ngữ cảnh dùng chung**: đổi toà ở đây thì mọi màn bên dưới đổi theo, không phải chọn lại ở từng chỗ (WCAG 2.2 *Redundant Entry* — không bắt nhập lại thứ đã nhập).
- **Đường dẫn phân cấp (breadcrumb)** xuất hiện khi sâu từ 3 cấp trở lên, và **mỗi cấp bấm được**.

**Điện thoại (360–767px)**:

- Menu trái thu thành nút ở đầu trang, bung ra dạng lớp phủ.
- Bộ chọn toà/kỳ vẫn ở đầu trang nhưng thu gọn thành một dòng chữ bấm được.
- **Thanh hành động ngữ cảnh ở đáy** chỉ xuất hiện ở ba màn hiện trường: ghi chỉ số, màn thợ, và bước ghi nhận thu tiền. Đây không phải điều hướng — đó là nút hành động chính đặt trong tầm ngón cái.

### 4.2. Quy tắc URL

| Loại màn | Dạng URL | Ví dụ |
|---|---|---|
| Danh sách | `/{đối-tượng}` | `/hoa-don` |
| Danh sách có lọc | `/{đối-tượng}?{tham-số}` | `/hoa-don?toa=A&ky=2026-08&trang-thai=qua-han` |
| Chi tiết | `/{đối-tượng}/{mã}` | `/hoa-don/A-302-202608` |
| Tác vụ trong ngữ cảnh | `/{ngữ-cảnh}/{tác-vụ}` | `/ky/2026-08/ghi-chi-so` |

Ba ràng buộc:

1. **Bộ lọc nằm trong URL**, không nằm trong bộ nhớ tạm. Người dùng gửi được đường dẫn đã lọc cho đồng nghiệp; nút Back khôi phục đúng bộ lọc trước.
2. **Mã trong URL là mã nghiệp vụ đọc được** (`A-302-202608` theo `FR-INV-07`), không phải số thứ tự nội bộ. Nhìn URL biết đang xem hoá đơn phòng nào.
3. **Truy cập thẳng URL không có quyền → 403 kèm màn hình giải thích**, không phải chuyển hướng im lặng về trang chủ. Người dùng cần biết mình bị từ chối, không phải tưởng mình bấm nhầm.

### 4.3. Luồng vào hệ thống — dùng chung mọi vai trò

Ba màn này (`#1`, `#2`, `#3`) là cửa vào duy nhất của cả năm phân hệ, nên đặc tả ở đây thay vì lặp lại năm lần.

| Bước | Từ | Hành động | Đến |
|---|---|---|---|
| 1 | — | Mở địa chỉ web | **`#1` Đăng nhập** |
| 2a | `#1` | Nhập đúng **số điện thoại** + mật khẩu | **`#3` Trang chủ** — đúng biến thể theo vai trò |
| 2b | `#1` | Bấm *"Quên mật khẩu"* | **`#2`** — mã OTP hạn 5 phút |
| 3 | `#2` | Nhập OTP đúng, đặt mật khẩu mới | ⟲ **`#1`** — **không** tự đăng nhập luôn, bắt gõ lại mật khẩu mới để người dùng nhớ |
| 4 | `#1` | Sai mật khẩu **5 lần trong 15 phút** (`FR-AUT-02`) | Ở lại `#1` + thông báo khoá tạm **kèm giờ mở lại**. Không có đường từ đây sang `#2` |

**Bảy yêu cầu của màn `#1`:**

1. **Định danh là số điện thoại, không phải email.** Người thuê và quản lý đều không dùng email thường xuyên (`FR-AUT-01`).
2. **Cho phép dán mật khẩu** và khai báo `autocomplete="current-password"` — WCAG 2.2 AA *Accessible Authentication*.
3. **Thông báo lỗi giống hệt nhau** cho "sai mật khẩu" và "không có tài khoản". Khác nhau là dò được số điện thoại nào có tài khoản — với một khu trọ, đó là dò được ai đang ở đây.
4. **Khoá tạm phải nói giờ mở lại**, không nói chung chung: *"Đã nhập sai 5 lần. Thử lại sau 14:35."*
5. **Sau khi phiên hết hạn, đăng nhập lại phải quay đúng màn đang dở**, không đá về trang chủ.
6. **Không có nút "Đăng ký".** Tài khoản do QTHT tạo (`05-quan-tri-he-thong.md`).
7. **Ô OTP ở `#2` cho phép dán cả chuỗi** — dán `483920` vào một ô phải tự rải sang các ô còn lại, không bắt gõ từng số.

**`#3` Trang chủ không phải một màn hình đứng riêng.** Nó là bí danh của:

| Vai trò | `#3` thực chất là |
|---|---|
| Quản lý toà nhà | `#42` Bảng nhắc việc |
| Chủ sở hữu | `#41` Bảng tổng quan |
| Người thuê | `#32` Trang chủ người thuê |
| Thợ sửa chữa | `#40` Việc của tôi |
| Quản trị hệ thống | Màn riêng — vai trò duy nhất có `#3` độc lập |

Đừng thiết kế "Trang chủ" như màn thứ 54.

### 4.4. Hộp thông báo `#44` — dùng chung mọi vai trò

`#44` là màn duy nhất trong 53 màn mà **cả 5 vai trò dùng chung một thiết kế** — không có bản riêng theo vai trò như `#23`. Vì vậy đặc tả ở đây.

| Bước | Từ | Hành động | Đến |
|---|---|---|---|
| 1 | Bất kỳ màn nào đã đăng nhập | Bấm biểu tượng chuông ở thanh đầu | `#44` |
| 2 | `#44` | Bấm một thông báo | Đúng màn liên quan — bảng đích đến đầy đủ ở `06-luong-xuyen-vai-tro.md` mục 5 |

Ba quy tắc:

- **Số chưa đọc phải chính xác**, và giảm ngay khi đọc. Con số sai làm người dùng ngừng tin cái chuông.
- **Thông báo đã đọc không biến mất**, chỉ đổi trạng thái. Người dùng thường quay lại tìm cái vừa đọc.
- **Chỗ đặt con số phải giữ sẵn** kể cả khi bằng 0, để lúc có số không đẩy các nút bên cạnh dịch chỗ.

### 4.5. Quy tắc nút Back

| Tình huống | Back phải làm gì |
|---|---|
| Từ chi tiết về danh sách | Về đúng danh sách, đúng bộ lọc, đúng vị trí cuộn |
| Đang giữa form nhiều bước | Lùi **một bước** trong form, không thoát cả form |
| Vừa hoàn tất một luồng (ký hợp đồng, tạo hoá đơn hàng loạt) | **Không** quay lại giữa luồng đã xong. Back từ màn kết quả về danh sách |
| Sau khi mở hộp thoại | Đóng hộp thoại, không rời trang |
| Có thay đổi chưa lưu | Chặn lại, hỏi *"Rời khỏi trang? Thay đổi chưa lưu sẽ mất."* |

---

## 5. Sáu trạng thái bắt buộc của mọi màn hình

Đây là chỗ hay bị bỏ sót nhất. Mọi màn có dữ liệu đều phải thiết kế đủ sáu trạng thái — không phải một.

| # | Trạng thái | Khi nào | Phải có gì |
|---|---|---|---|
| 1 | **Đang tải lần đầu** | Chưa có gì để hiện | Khung xương giữ đúng chỗ nội dung sắp hiện, `aria-busy="true"`. **Không** làm nhảy bố cục khi dữ liệu về |
| 2 | **Có dữ liệu** | Bình thường | — |
| 3 | **Rỗng lần đầu** | Chưa ai tạo gì | Câu giải thích + **một nút hành động chính**. Không để trắng trơn. Vd: *"Toà này chưa có phòng nào. [Tạo dãy phòng]"* |
| 4 | **Rỗng do lọc** | Có dữ liệu nhưng bộ lọc không khớp | **Khác hẳn trạng thái 3**: nói rõ đang lọc gì + nút **Xoá bộ lọc**. Vd: *"Không có hoá đơn quá hạn ở toà A kỳ 08/2026. [Bỏ lọc]"* |
| 5 | **Lỗi** | Không tải được | Nói bằng tiếng Việt việc gì hỏng + **nút Thử lại**. Không hiện mã lỗi kỹ thuật (`NFR-USA-04`) |
| 6 | **Mất kết nối** | Không có mạng | Xem mục 7 |

**Ba trạng thái 3, 4, 5 là ba màn khác nhau, không phải một màn dùng chung.** Gộp chúng lại là lỗi thiết kế thường gặp nhất, và hậu quả là người dùng không biết mình nên tạo mới hay nên bỏ lọc.

### 5.1. Chỉ báo đang tải — chọn theo độ dài chờ

Không dùng một kiểu cho mọi thứ:

| Thời gian chờ dự kiến | Dùng gì |
|---|---|
| < 300ms | **Không hiện gì.** Con quay nhấp nháy 100ms gây khó chịu hơn là chờ im lặng |
| 300ms – 2s | Khung xương (skeleton) ở đúng vị trí nội dung, giữ nguyên bố cục |
| 2s – 10s | Khung xương + dòng chữ nói đang làm gì: *"Đang tính hoá đơn cho 24 phòng…"* |
| > 10s (tạo hoá đơn hàng loạt) | **Thanh tiến độ có số thật**: *"Đã tạo 12/24 hoá đơn"*. Cho phép rời màn và quay lại xem tiếp |

Trong mọi trường hợp: **giữ chỗ trước** cho nội dung sắp hiện. Nội dung nhảy khi tải xong là lỗi, không phải chuyện nhỏ.

---

## 6. Nhập liệu và biểu mẫu

### 6.1. Quy tắc chung

| Quy tắc | Chi tiết |
|---|---|
| **Nhãn luôn thấy được** | Không dùng chữ mờ trong ô làm nhãn duy nhất — gõ vào là nhãn biến mất, người dùng quên đang điền gì |
| **Kiểm tra khi rời ô, không đợi bấm Gửi** | Báo lỗi ngay khi người dùng rời khỏi ô sai. Đợi tới lúc bấm Gửi mới báo 6 lỗi cùng lúc là cách chắc chắn làm người ta bỏ cuộc |
| **Lỗi nằm ngay dưới ô sai** | Kèm liên kết ngữ nghĩa để trình đọc màn hình đọc được đúng lỗi của đúng ô |
| **Bảng tóm tắt lỗi ở đầu form** | Với form dài (ký hợp đồng, khai báo toà): sau khi bấm Gửi mà lỗi, hiện hộp tóm tắt ở đầu, **đưa con trỏ vào đó**, mỗi dòng lỗi bấm được để nhảy tới ô tương ứng. **Vẫn giữ** lỗi ở từng ô — tóm tắt là bổ sung, không phải thay thế |
| **Không hỏi lại thứ đã biết** | Đã chọn toà ở thanh đầu thì form không hỏi lại toà. Đã có địa chỉ người thuê ở hồ sơ thì hợp đồng tự điền |
| **Bàn phím số cho ô số** | Ô chỉ số, số tiền, số điện thoại phải mở bàn phím số trên điện thoại |
| **Enter để gửi** | Trên máy tính, Enter trong form một-mục-đích phải gửi được. Chị Lan gõ 30 phòng bằng bàn phím số, không muốn với chuột |

### 6.2. Định dạng số và ngày (`NFR-USA-06`)

| Loại | Hiển thị | Khi nhập |
|---|---|---|
| Tiền | `1.888.000 đ` — dấu **chấm** ngăn nghìn | Tự chèn dấu chấm khi gõ; chấp nhận cả khi người dùng gõ liền không dấu |
| Ngày | `29/08/2026` | Ô chọn ngày + cho phép gõ tay `29/08/2026` |
| Chỉ số công tơ | Số nguyên, không ngăn nghìn (`1298`) | Bàn phím số |
| Mức tiêu thụ | `58 kWh` / `12 m³` — luôn kèm đơn vị | Không nhập tay, hệ thống tính |

**Số tiền dùng phông chữ số đều bề ngang** trong mọi bảng để hàng nghìn thẳng cột. Đây là chi tiết trình bày nhưng có hệ quả UX thật: mắt so sánh được hai con số mà không cần đọc từng chữ số.

### 6.3. Form nhiều bước — chống bỏ dở

Áp dụng cho **ký hợp đồng** (`#15`) và **tạo hoá đơn hàng loạt** (`#21`).

- **Chỉ báo bước rõ ràng**: *"Bước 2/4 — Thông tin người thuê"*. Không có chỉ báo là không biết còn bao xa.
- **Lưu nháp tự động sau mỗi bước.** F5 hay mất mạng giữa chừng thì mở lại vẫn ở đúng bước đó. Đây là điều kiện bắt buộc, vì brief đã cảnh báo `#15` *"nhiều bước, dễ bỏ dở"*.
- **Rẽ nhánh phải quay lại được.** Đang ở bước 2 mà cần tạo hồ sơ người thuê mới → mở màn hồ sơ → lưu xong **quay đúng bước 2** với dữ liệu đã điền còn nguyên.
- **Cho lùi bước tự do.** Bước 3 quay lại bước 1 sửa rồi tiến tiếp, không phải làm lại từ đầu.

---

## 7. Mất kết nối — bắt buộc theo `FR-MTR-05`

Yêu cầu gốc: *"giữ dữ liệu đã nhập trên thiết bị khi mất kết nối và tự đồng bộ khi có mạng trở lại"*. Đây là màn ghi chỉ số — chị Lan đứng giữa hành lang tầng 3, sóng yếu.

> **Ghi chú về nguồn:** cơ sở dữ liệu UX của bộ công cụ không có mục riêng cho ngoại tuyến; phần dưới đây suy ra từ `FR-MTR-05` cùng bối cảnh khảo sát, không phải trích từ cơ sở dữ liệu.

### 7.1. Ba trạng thái kết nối

| Trạng thái | Dấu hiệu cho người dùng | Hành vi |
|---|---|---|
| **Trực tuyến** | Không hiện gì | Lưu thẳng lên máy chủ |
| **Mất mạng** | Dải chữ ở đầu màn: *"Đang ngoại tuyến — đã lưu 7 phòng trên máy, sẽ tự gửi khi có mạng"* | Vẫn gõ và lưu được vào máy. **Không chặn.** Không hiện hộp thoại lỗi mỗi lần lưu |
| **Đang đồng bộ** | *"Đang gửi 7 phòng…"* rồi đổi thành *"Đã gửi xong"* rồi tự ẩn sau 3 giây | Gửi nền, không chặn thao tác tiếp |

### 7.2. Ba quy tắc không được vi phạm

1. **Không bao giờ mất chữ người dùng đã gõ.** Ghi vào bộ nhớ máy ngay khi rời ô, không đợi bấm Lưu.
2. **Nói rõ cái gì chưa gửi được.** Mỗi dòng phòng có dấu hiệu riêng: *đã gửi* / *chờ gửi*. Chị Lan phải biết được mình có thể đóng trình duyệt hay chưa.
3. **Xung đột thì hỏi, không tự quyết.** Nếu chỉ số phòng 302 đã bị người khác ghi trong lúc mất mạng: hiện cả hai giá trị, hỏi giữ cái nào. Không tự đè.

**Chỉ màn ghi chỉ số (`#18`) và khai báo thay công tơ (`#19`) cần khả năng này.** Các màn khác mất mạng thì báo lỗi bình thường theo mục 8 — không cần làm ngoại tuyến cho toàn hệ thống, đó là chi phí lớn không đổi lại giá trị tương ứng.

---

## 8. Phân loại lỗi và cách xử lý

`NFR-USA-04`: *"Toàn bộ nhãn, thông báo lỗi bằng tiếng Việt có dấu, diễn đạt theo ngôn ngữ nghiệp vụ của người dùng, không hiển thị mã lỗi kỹ thuật"*.

| Loại lỗi | Ví dụ trong sản phẩm | Hiện ở đâu | Câu chữ mẫu |
|---|---|---|---|
| **Sai dữ liệu nhập** | Chỉ số mới < chỉ số cũ (`BR-09`) | Ngay dưới ô | *"Chỉ số mới (1.180) nhỏ hơn kỳ trước (1.240). Nếu vừa thay công tơ, chọn 'Công tơ đã thay'."* |
| **Vi phạm quy tắc nghiệp vụ** | Tạo hoá đơn trùng kỳ (`FR-INV-04`) | Hộp cảnh báo trong màn | *"Phòng 302 đã có hoá đơn kỳ 08/2026. Mở hoá đơn đó?"* + nút mở |
| **Không đủ quyền** | Quản lý toà A mở hoá đơn toà B | Màn hình riêng | *"Bạn không được phân công quản lý toà B."* + nút về nơi hợp lệ |
| **Xung đột đồng thời** | Hai người sửa cùng hoá đơn | Hộp thoại | *"Hoá đơn này vừa được người khác sửa. Xem thay đổi trước khi lưu."* |
| **Mất kết nối** | — | Dải chữ đầu màn | Xem mục 7 |
| **Lỗi máy chủ** | 500 | Trong vùng nội dung | *"Không tải được danh sách hoá đơn. [Thử lại]"* — kèm mã tra cứu nhỏ ở góc cho người hỗ trợ, không phải cho người dùng |
| **Phiên hết hạn** | Token 30 phút hết | Chuyển về đăng nhập | *"Phiên làm việc đã hết. Đăng nhập lại để tiếp tục."* — và **quay lại đúng màn đang làm** sau khi đăng nhập |

### 8.1. Ba điều cấm khi báo lỗi

1. **Cấm chỉ có màu.** Viền đỏ không phải thông báo lỗi. Phải có chữ.
2. **Cấm báo lỗi mà không có lối ra.** Mỗi lỗi phải kèm ít nhất một hành động: thử lại, sửa, hoặc đi chỗ khác.
3. **Cấm mã kỹ thuật.** `NullPointerException`, `500`, `constraint violation` không bao giờ hiện cho người dùng.

### 8.2. Toast, thông báo trong dòng, hay hộp thoại?

| Dùng | Khi nào | Ví dụ |
|---|---|---|
| **Toast** (tự tắt sau 4s) | Xác nhận việc đã xong, không cần hành động | *"Đã lưu chỉ số phòng 302"* |
| **Toast có nút Hoàn tác** (8–10s) | Việc đã xong nhưng đảo ngược được | *"Đã gỡ khoản giảm trừ. [Hoàn tác]"* |
| **Thông báo trong dòng** | Cần đọc, gắn với một chỗ cụ thể trên màn | Lỗi ô nhập, cảnh báo tiêu thụ bất thường |
| **Hộp thoại chặn** | **Chỉ** khi không đảo ngược được, và phải nêu hậu quả | Xem 8.3 |

### 8.3. Hộp thoại xác nhận — chỉ 5 chỗ trong toàn hệ thống

`NFR-USA-05` đòi *"mọi thao tác xoá hoặc không thể hoàn tác phải có bước xác nhận nêu rõ hậu quả"*. Đúng năm chỗ:

| Thao tác | Câu hỏi phải nêu hậu quả bằng con số |
|---|---|
| Chốt kỳ (`#20`) | *"Chốt kỳ 08/2026 toà A? Sau khi chốt, **không sửa được chỉ số của 24 phòng** trong kỳ này."* |
| Phát hành hoá đơn (`#23`) | *"Phát hành 24 hoá đơn? Người thuê sẽ thấy ngay. Hoá đơn đã phát hành **không sửa được**, chỉ huỷ và phát hành lại."* |
| Huỷ hoá đơn (`#25`) | *"Huỷ hoá đơn A-302-202608 (1.888.000 đ)? Bắt buộc nhập lý do. Thao tác được ghi nhật ký."* + ô lý do **bắt buộc** |
| Khoá tài khoản (`#4`) | *"Khoá tài khoản Nguyễn Văn A? Người này sẽ không đăng nhập được. Lịch sử thao tác vẫn giữ nguyên."* |
| Thanh lý hợp đồng (`#31`) | *"Thanh lý hợp đồng phòng 302? Sẽ quyết toán cọc 3.000.000 đ và **chuyển phòng sang trạng thái Trống**."* |

**Ngoài năm chỗ này, không dùng hộp thoại xác nhận.** Mọi thứ khác dùng hoàn tác.

Ba quy tắc cho hộp thoại:
- Nút hành động ghi **động từ cụ thể** (*"Chốt kỳ"*), không ghi *"OK"*.
- Nút huỷ bỏ là mặc định khi bấm Esc.
- Con trỏ tự vào hộp thoại khi mở, và **trở về đúng nút vừa bấm** khi đóng.

### 8.4. Nhiều tab cùng lúc

Quản lý mở song song hai tab là chuyện bình thường trên web. Hai tình huống phải xử lý:

1. **Đăng xuất ở tab này** → tab kia phát hiện và chuyển về màn đăng nhập, không để người dùng thao tác tiếp rồi mới báo lỗi.
2. **Sửa cùng một hoá đơn ở hai tab** → tab lưu sau nhận thông báo xung đột (mục 8), không được lặng lẽ đè lên.

---

## 9. Khả năng tiếp cận — mức tuân thủ WCAG 2.2 AA

Không phải mục làm cho đẹp hồ sơ. Ba trong bốn người dùng thật ở mục 2 hưởng lợi trực tiếp.

| Tiêu chí | Yêu cầu | Áp dụng cụ thể ở đây |
|---|---|---|
| **Kích thước vùng bấm** | WCAG 2.2 AA đòi tối thiểu **24×24 px** cho web. Nhưng `NFR-USA-03` của dự án **chặt hơn: 44×44 px** cho nút chính trên điện thoại | Theo mức chặt hơn: 44px ở màn ghi chỉ số, màn thợ, cổng người thuê |
| **Khoảng cách giữa nút** | Tối thiểu 8px | Không xếp nút sát nhau ở màn ghi chỉ số — chị Lan bấm bằng ngón cái, đang cầm đèn pin tay kia |
| **Xác thực tiếp cận được** | Không được chỉ dựa vào bài kiểm tra trí nhớ | **Cho phép dán mã OTP.** Không chặn dán mật khẩu. Khai báo `autocomplete` đúng để trình quản lý mật khẩu điền được |
| **Con trỏ không bị che** | Vùng đang có con trỏ bàn phím không được bị thanh cố định che | Thanh đầu dính ở trên → phải bù khoảng đệm cuộn tương ứng |
| **Không nhập lại** | Không bắt nhập lại thứ đã nhập trong cùng quy trình | Đã chọn toà ở thanh đầu → form không hỏi lại |
| **Thông báo lỗi được đọc lên** | Lỗi phải được trình đọc màn hình thông báo | Không chỉ đổi màu viền |
| **Nhãn cho nút chỉ có biểu tượng** | Mọi nút biểu tượng phải có tên đọc được | Nút chụp ảnh công tơ, nút chuông thông báo |
| **Vòng con trỏ bàn phím** | **Không được xoá.** Chị Lan dùng Tab để đi giữa 30 ô chỉ số | Giữ vòng focus rõ ràng ở mọi ô |
| **Tương phản chữ** | 4.5:1 với chữ thường | Thuộc phần thiết kế giao diện, nhưng nghiệm thu ở đây |

### 9.1. Bàn phím — mặt bằng máy tính là chính, nên đây không phải phần phụ

| Phím | Ở đâu | Làm gì |
|---|---|---|
| `Tab` / `Shift+Tab` | Mọi màn | Đi giữa các ô theo đúng thứ tự đọc |
| `Enter` | Ô chỉ số | Lưu và nhảy xuống phòng kế tiếp |
| `Esc` | Hộp thoại, lớp phủ | Đóng, không lưu |
| `/` | Màn danh sách | Nhảy vào ô tìm kiếm |
| `Ctrl/Cmd + Enter` | Form dài | Gửi form |

Thứ tự Tab phải **theo thứ tự nhìn thấy**. Ở màn ghi chỉ số, Tab đi từ phòng 201 → 202 → 203, không nhảy sang thanh bên.

---

## 10. Phản hồi vi mô — thời lượng theo mục đích

Chuyển động phải mang nghĩa. Một thời lượng dùng cho mọi thứ là dấu hiệu chưa nghĩ kỹ.

| Loại | Thời lượng | Vì sao |
|---|---|---|
| Phản hồi khi bấm (nút lún xuống) | 100ms | Phải cảm thấy tức thì |
| Hiện/ẩn thông báo lỗi trong dòng | 150ms | Đủ để mắt bắt được là có gì đó mới xuất hiện |
| Mở/đóng lớp phủ, hộp thoại | 200ms vào / **150ms ra** | Đóng nhanh hơn mở — người dùng đã quyết định xong |
| Chuyển giữa các trang | ≤ 150ms, hoặc không hiệu ứng | Web không phải app; chuyển trang chậm làm cảm giác nặng nề |
| Toast trượt vào | 200ms | |
| Dòng vừa lưu xong nhấp nháy xanh | 400ms rồi tắt dần | Đủ chậm để nhìn thấy khi mắt đang ở chỗ khác |

**Bắt buộc:** tôn trọng thiết lập *giảm chuyển động* của hệ điều hành. Người bật thiết lập đó thì mọi hiệu ứng trên rút về 0ms, chỉ đổi trạng thái tức thì.

### 10.1. Ba phản hồi vi mô đáng đầu tư nhất

1. **Ô chỉ số: hiện mức tiêu thụ ngay khi gõ.** Không đợi rời ô. Gõ `1298` → dưới ô lập tức hiện `= 58 kWh`. Đây là cơ chế bắt lỗi rẻ nhất trong cả sản phẩm.
2. **Dòng vừa lưu: nhấp nháy nhẹ rồi tự cuộn tới phòng kế.** Chị Lan không cần nhìn cũng biết đã lưu và đang ở đâu.
3. **Thanh tiến độ ghi chỉ số: đếm số thật.** *"12/24 phòng"*. Biết còn bao xa là thứ giữ người ta làm tiếp, đặc biệt khi đang đứng ở hành lang tối.

---

## 11. Ngôn ngữ giao diện

| Quy tắc | Đúng | Sai |
|---|---|---|
| Nút ghi **động từ + đối tượng** | *"Chốt kỳ 08/2026"* | *"OK"*, *"Đồng ý"* |
| Nói bằng từ nghiệp vụ của người dùng | *"Chưa ghi chỉ số"* | *"Dữ liệu không hợp lệ"* |
| Lỗi nói **cách sửa**, không chỉ nói sai | *"Chỉ số mới phải lớn hơn 1.240"* | *"Giá trị không hợp lệ"* |
| Không đổ lỗi cho người dùng | *"Chưa nhập số tiền"* | *"Bạn đã nhập sai"* |
| Số nhiều tiếng Việt không đổi dạng | *"24 phòng"* | *"24 phòng(s)"* |
| Tiếng Việt dài hơn tiếng Anh ~30% | Chừa chỗ cho *"Đã thanh toán một phần"* | Nút vừa khít chữ tiếng Anh |

**21 nhãn trạng thái** dùng chung toàn hệ thống — máy chủ trả cả mã lẫn nhãn tiếng Việt, giao diện hiện nhãn và **không tự dịch mã**. Tự dịch thì tiếng Việt trong sản phẩm sẽ lệch tiếng Việt trong báo cáo.

---

## 12. Máy trạng thái dùng chung

Hai vòng đời này xuất hiện ở nhiều vai trò, nên đặt ở đây thay vì lặp lại.

### 12.1. Hoá đơn (`BR-08`)

```
Nháp ──phát hành──▶ Đã phát hành ──thu một phần──▶ Đã thu một phần ──thu đủ──▶ Đã thanh toán
  │                       │                              │
  │                       ├────── quá hạn ──────────────▶ Quá hạn
  │                       │
  └── huỷ ───────────────┴── huỷ (kèm lý do) ──────────▶ Đã huỷ
```

Hệ quả UX phải tuân theo:
- **Chỉ trạng thái Nháp mới hiện nút Sửa.** Ở các trạng thái khác, nút Sửa **không hiện** (không phải hiện rồi báo lỗi khi bấm).
- **Chỉ Chủ sở hữu mới thấy nút Huỷ**, và bắt buộc nhập lý do.
- **Đã thanh toán là trạng thái cuối** — không có đường quay lại. Giao diện không được gợi ý điều ngược lại.

### 12.2. Yêu cầu sửa chữa (`BR-16`)

```
Mới tiếp nhận ▶ Đã tiếp nhận ▶ Đã phân công ▶ Đang xử lý ▶ Chờ xác nhận ▶ Đã đóng
      │                                                          │
      └────────── Đã huỷ (kèm lý do, từ bất kỳ đâu trước Đã đóng)┘
```

Hệ quả UX:
- **Tự đóng sau 72 giờ** nếu người thuê không phản hồi ở *Chờ xác nhận* (`FR-MNT-07`). Người thuê phải **thấy đồng hồ đếm ngược** — *"Còn 2 ngày để xác nhận, sau đó tự đóng"* — chứ không bị đóng bất ngờ.
- Mỗi lần đổi trạng thái, **người liên quan phía bên kia phải biết** (xem `06-luong-xuyen-vai-tro.md`).

---

## 13. Danh sách file trong bộ tài liệu này

| File | Nội dung |
|---|---|
| `00-nen-tang-ux.md` | File này — nền tảng dùng chung |
| `01-quan-ly-toa-nha.md` | Phân hệ Quản lý toà nhà — nặng nhất |
| `02-chu-so-huu.md` | Phân hệ Chủ sở hữu |
| `03-nguoi-thue.md` | Phân hệ Người thuê |
| `04-tho-sua-chua.md` | Phân hệ Thợ sửa chữa |
| `05-quan-tri-he-thong.md` | Phân hệ Quản trị hệ thống |
| `06-luong-xuyen-vai-tro.md` | Chỗ nối giữa các phân hệ |
| `07-tieu-chi-nghiem-thu-ux.md` | Tiêu chí đo được + kịch bản kiểm thử khả dụng |
