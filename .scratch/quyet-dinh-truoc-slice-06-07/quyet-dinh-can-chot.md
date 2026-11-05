# Ba quyết định cần chốt trước khi chẻ ticket Slice 06 và 07

**Nguồn:** soạn spec Slice 06 và 07 ngày 01/09/2026. Xem `.scratch/slice-06-cong-nguoi-thue/spec.md` và `.scratch/slice-07-su-co-bao-tri/spec.md`.

**Vì sao phải chốt trước.** Cả ba đều là **product ambiguity** theo `AGENTS.md` mục 5 — hành vi nghiệp vụ chưa xác định hoặc hai tài liệu nguồn nói ngược nhau. Tầng thực thi không được tự phát minh câu trả lời.

Câu 1 đổi **phạm vi slice**, câu 2 đổi **hạ tầng kỹ thuật**, câu 3 đổi **ranh giới bảo mật**. Cả ba đều đắt hơn nếu trả lời sau khi đã viết mã.

---

## Câu 1 — Vế "thông báo" của `FR-MNT-02` và `FR-MNT-04` làm ở đâu?

**Ảnh hưởng:** phạm vi Slice 07, ma trận truy vết, và rủi ro R-11.

**Vì sao mơ hồ.** Hai FR có vế thông báo mà toàn bộ `FR-NTF` lại thuộc Slice 08:

> `FR-MNT-02` — *"sinh mã yêu cầu **và thông báo tới quản lý** toà nhà tương ứng"* [M]
> `FR-MNT-04` — *"phân công yêu cầu cho thợ **và gửi thông báo** cho người được phân công"* [M]

Đã có tiền lệ: **ruling 3** chốt đẩy vế thông báo của `FR-INV-08` sang Slice 08.

### Nhưng tiền lệ đó có một rủi ro chưa ai soi

Ba FR bị đóng nửa vời — `FR-INV-08`, `FR-MNT-02`, `FR-MNT-04` — **cả ba đều là Must have**.

Chúng đang treo vào Slice 08, mà Slice 08 **toàn Should have**, và kế hoạch mục 9 (rủi ro **R-11**) chỉ định thẳng Slice 8–10 là **chỗ cắt an toàn khi thiếu thời gian**:

> *"Vertical Slice 8–10 cắt được mà không ảnh hưởng luồng chính"*

Cắt Slice 08 thì **ba Must have hở vĩnh viễn**. Đó không còn là "cắt an toàn".

| P.án | Nội dung | Được | Mất |
|---|---|---|---|
| **A** | Áp nguyên ruling 3. Slice 07 không làm thông báo; cả ba FR đóng ở hai slice | Nhất quán với quyết định đã chốt. Ranh giới sạch, không mã chết. Slice 08 tự do thiết kế lược đồ thông báo | **Ba Must have treo vào một slice mà kế hoạch chỉ định là chỗ cắt.** Ma trận truy vết phải mang ba dòng ngoại lệ |
| **B** | Slice 07 dựng **thông báo tối thiểu trong ứng dụng**: một bảng thông báo + màn `#44`. Slice 08 sau đó mở rộng (thông báo chung theo phạm vi, nhắc thanh toán, cấu hình mốc) | `FR-MNT-02`/`04` đóng **trọn**. `#44` vốn là màn dùng chung năm vai trò (`00-nen-tang-ux.md` mục 4.4) nên dựng sớm không phí. Cắt được Slice 08 mà không hở Must have nào | Slice 07 phải **đặt lược đồ bảng thông báo**, và Slice 08 nhận lược đồ do slice khác định nghĩa. Phình Slice 07 thêm 1–2 ticket |
| **C** | Kéo trọn phần thông báo trong ứng dụng của Slice 08 lên làm ở Slice 07 | Giải quyết triệt để một lần | Phình nặng. Và **không kéo trọn được**: `FR-NTF-04`/`05` (nhắc thanh toán) vẫn phải đợi Slice 05, nên Slice 08 vẫn tồn tại — chỉ là bị moi ruột |

**Đề xuất: B.** Lý do không phải sự gọn gàng mà là rủi ro: A đúng về nguyên tắc nhưng đặt ba Must have vào đúng chỗ kế hoạch dự định cắt. B đóng chúng bằng phạm vi nhỏ nhất — một bảng và một màn vốn đã phải làm.

> **Hệ quả phải nói rõ nếu chọn B.** Lập luận này áp **y nguyên** cho `FR-INV-08`. Chọn B nghĩa là ruling 3 chỉ còn đúng một nửa: Slice 05 vẫn không làm thông báo (tickets đã chốt, không mở lại), nhưng khi Slice 07 dựng xong hạ tầng thì cần **một ticket nối** để `FR-INV-08` đóng trọn — **không phụ thuộc Slice 08**. Ticket đó thuộc Slice 07 hay là việc riêng, cần ghi rõ lúc chẻ ticket.

---

## Câu 2 — `FR-MNT-07` tự đóng sau 72 giờ: ghi trạng thái hay suy ra khi đọc?

**Ảnh hưởng:** có phải dựng hạ tầng chạy theo lịch hay không — thứ dự án **chưa có ở đâu cả**.

**Vì sao mơ hồ.** `BR-16` viết: *"Tự động chuyển từ Chờ xác nhận sang Đã đóng sau 72 giờ không phản hồi."* Không nói làm bằng cách nào.

Ghi chú **CR-012** trong `BR-14` đã cảnh báo đúng mẫu hình này khi từ chối lưu "sắp hết hạn" thành cột trạng thái:

> *"hệ thống sẽ cần một tác vụ chạy hằng ngày quét lại toàn bộ hợp đồng, và **tác vụ đó lỗi một hôm thì dữ liệu sai mà không ai biết**."*

| P.án | Nội dung | Được | Mất |
|---|---|---|---|
| **A** | Tác vụ nền quét định kỳ, **ghi** `Đã đóng` vào cơ sở dữ liệu | Trạng thái thật, truy vấn đơn giản. Nhật ký có dòng *"hệ thống tự đóng lúc X"* — đúng sự thật | Dựng **điểm hỏng im lặng đầu tiên** của dự án, đúng thứ CR-012 từ chối. Cần hạ tầng lập lịch chưa tồn tại |
| **B** | **Suy ra khi đọc**: quá 72 giờ ở *Chờ xác nhận* thì coi như *Đã đóng*, không ghi gì | Không tác vụ nền, không hỏng im lặng. Cùng cách CR-012 đã chọn. Test bằng đồng hồ đẩy được — khuôn `MutableClock` đã có sẵn ở bốn bộ test | *Đã đóng* là **trạng thái cuối** của BR-16, khác bản chất với "sắp hết hạn" vốn chỉ là một cách nhìn. Và **mọi** truy vấn đọc trạng thái đều phải nhớ áp luật 72 giờ — quên một chỗ là lệch |
| **C** | **Ghi khi chạm**: lần đầu có ai đó đọc một yêu cầu đã quá 72 giờ thì ghi luôn `Đã đóng` | Trạng thái thật trong CSDL mà không cần tác vụ nền | Thời điểm đóng **phụ thuộc lúc có người mở xem** — hai yêu cầu cùng quá hạn, cái được xem trước đóng trước. Nhật ký ghi giờ đóng **không đúng sự thật**. Và thao tác đọc gây ghi là thứ dễ gây bất ngờ |

**Đề xuất: B**, và giảm nhẹ điểm yếu của nó bằng cách **đặt luật 72 giờ vào đúng một chỗ** — một đối tượng quy tắc trong tầng thuần, giống `QuyTacTrangThaiHoaDon`. Không rải điều kiện `INTERVAL '72 hours'` ra từng câu SQL.

> **Đáng cân nhắc trước khi chọn:** `FR-MNT-07` là **Could have**. Bỏ hẳn cũng là một lựa chọn chính đáng, và spec Slice 07 vẫn đứng vững nếu thiếu nó. Nếu giữ thì B.

---

## Câu 3 — Người thuê đã thanh lý hợp đồng còn xem được hoá đơn cũ không?

**Ảnh hưởng:** ranh giới bảo mật của Slice 06, và tính đúng đắn của ticket `05 · 09`.

**Vì sao mơ hồ.** `FR-POR-03` đòi *"tra cứu tối thiểu 12 kỳ hoá đơn gần nhất"*, `FR-POR-04` đòi *"chỉ truy cập được dữ liệu của phòng mình"*. Không câu nào nói gì về người **đã dọn đi**.

| P.án | Nội dung | Được | Mất |
|---|---|---|---|
| **A** | **Cho xem tiếp**. Tài khoản còn hoạt động thì còn tra được hoá đơn của các hợp đồng cũ của chính mình | Là dữ liệu của chính họ. Còn công nợ hay còn chờ hoàn cọc thì cần đối chiếu. Khớp tinh thần `BR-18` — dữ liệu tài chính không biến mất | Bề mặt tấn công tồn tại lâu hơn. Một tài khoản cũ bị lộ là lộ lịch sử hoá đơn |
| **B** | **Cắt ngay khi thanh lý.** Đăng nhập được nhưng không thấy dữ liệu nào | Bề mặt tấn công nhỏ nhất | **Mâu thuẫn trực tiếp với ticket `05 · 09`** — xem dưới |
| **C** | Cho xem **có thời hạn**: N tháng sau ngày thanh lý rồi cắt | Cân bằng; đủ thời gian đối chiếu công nợ và cọc | Thêm một tham số phải chốt và test biên. Tranh chấp kéo dài quá N tháng thì cắt đúng lúc cần nhất |

### Vì sao B không chỉ là đánh đổi, mà là mâu thuẫn

Ticket `05 · 09` (ruling 5) sinh **hoá đơn quyết toán** khi tiền cọc trừ công nợ ra số âm. Hoá đơn đó phát sinh **sau** khi hợp đồng đã thanh lý — đó là toàn bộ lý do nó không nhét được vào hoá đơn kỳ cuối.

Chọn B nghĩa là: người thuê **không bao giờ xem được hoá đơn mà chính họ phải trả**. Đó là mâu thuẫn nội tại giữa hai slice, không phải một đánh đổi hợp lệ.

**Đề xuất: A**, kèm hai điều kiện siết lại:

1. Chỉ xem được hợp đồng **của chính mình** — `FR-POR-04` vẫn áp nguyên, kiểm qua `NguoiDung.nguoiThueId`.
2. Tài khoản bị **khoá** thì mất quyền ngay. Cơ chế đã có từ Slice 00 (`FR-AUT-06`, `FR-AUT-07`, ADR-0001), không phải làm mới. Đây là van an toàn cho lo ngại về bề mặt tấn công: quản trị viên khoá tài khoản là cắt được, không cần một luật thời hạn riêng.

---

## Tóm tắt đề xuất

| Câu | Vấn đề | Đề xuất |
|---|---|---|
| 1 | Thông báo của `FR-MNT-02`/`04` | **B** — Slice 07 dựng thông báo tối thiểu + `#44` |
| 2 | `FR-MNT-07` tự đóng 72 giờ | **B** — suy ra khi đọc, luật đặt một chỗ *(hoặc bỏ hẳn: Could have)* |
| 3 | Người thuê đã thanh lý | **A** — cho xem tiếp, siết bằng khoá tài khoản |

Chọn bộ này thì phát sinh: **một bảng thông báo + màn `#44`** vào Slice 07 (câu 1), **một ticket nối để `FR-INV-08` đóng trọn** (hệ quả câu 1), và **không migration nào** cho câu 2 hay câu 3.

---

## Chốt

**Ngày chốt:** 01/09/2026 · **Người quyết định:** chủ nhiệm đồ án · **Chốt theo đúng bộ đề xuất.**

| Câu | Chốt | Ghi chú |
|---|---|---|
| 1 | **B** | Slice 07 dựng thông báo tối thiểu trong ứng dụng + màn `#44`. Slice 08 mở rộng sau |
| 2 | **B** | `FR-MNT-07` suy ra khi đọc, **giữ chứ không bỏ**. Luật 72 giờ đặt ở đúng một chỗ trong tầng thuần |
| 3 | **A** | Người thuê đã thanh lý **vẫn xem được** hợp đồng cũ của chính mình; siết bằng khoá tài khoản |

### Việc phát sinh từ bộ chốt này

| Việc | Từ câu | Thuộc đâu |
|---|---|---|
| Bảng `THONG_BAO` + màn `#44` | 1 | Ticket `slice-07 · 05` |
| **Ticket nối để `FR-INV-08` đóng trọn** | 1 (hệ quả) | `slice-07 · 05`, mục cuối |
| Luật 72 giờ trong tầng thuần, không rải ra SQL | 2 | Ticket `slice-07 · 08` |
| Không có migration nào cho câu 2 và câu 3 | 2, 3 | |

### Ruling 3 của Slice 05 giờ chỉ còn đúng một nửa

Chốt 1B nghĩa là lập luận *"Must have không được treo vào slice có thể bị cắt"* thắng. Áp cho `FR-INV-08` thì:

- **Ticket Slice 05 không mở lại.** Chúng đã chốt, và vế thông báo vốn đã ghi rõ ngoài phạm vi ở đó.
- Sau khi `slice-07 · 05` dựng xong `THONG_BAO`, cần **một ticket nối** để `FR-INV-08` đóng trọn — **không phụ thuộc Slice 08**.
- Ma trận truy vết: `FR-INV-08` vẫn ghi đóng ở hai slice, nhưng slice thứ hai là **07**, không phải 08.
