# Vertical Slice 6 — Cổng người thuê

**Nguồn:** `Doc/PRJ1_Ke-hoach-trien-khai.md`, mục 6, Vertical Slice 6.
**Dải migration:** **không cấp** — slice này chỉ đọc. Xem `.scratch/dai-so-hieu-migration.md`.

**Trạng thái spec:** ✅ **Đã duyệt 01/09/2026.** Ticket đã chẻ ở `issues/`, 5 ticket.
**Ruling nền:** `.scratch/quyet-dinh-truoc-slice-06-07/quyet-dinh-can-chot.md` — câu 3 chốt **A**.

## Vật cản của kế hoạch đã được gỡ

Kế hoạch ghi: *"**Phụ thuộc:** CR-001 — vertical slice này **không khởi động được** nếu CR-001 chưa xong."*

**CR-001 đã xong.** `V11__link_account_to_tenant.sql` tồn tại, `slice-02 · 03-noi-tai-khoan-voi-nguoi-thue.md` ở trạng thái `done`, và `NguoiDung` đã mang trường `nguoiThueId`. Vai trò `NGUOI_THUE` đã có trong enum `VaiTro`.

Slice này khởi động được.

## Problem Statement

Người thuê hiện **không có gì cả**. Hoá đơn tính xong nằm trong cơ sở dữ liệu, quản lý xem được, người thuê thì không.

Đây là slice đầu tiên có người dùng **ngoài** đội vận hành. Ba slice trước phục vụ người trong nhà; slice này phục vụ người trả tiền.

## Đóng những yêu cầu nào

FR-POR-01 [M], FR-POR-02 [M], FR-POR-03 [M], FR-POR-04 [M], FR-POR-05 [S], FR-POR-06 [M], FR-POR-07 [S]

**Quy tắc nghiệp vụ:** BR-17 (phạm vi dữ liệu cá nhân), BR-14 (cảnh báo hợp đồng sắp hết hạn), BR-15 (dòng làm tròn có thể âm)

## Slice chỉ đọc — và đó là ràng buộc, không phải mô tả

Bảy `FR-POR` đều là màn **xem**. Không tạo, không sửa, không xoá gì cả.

Hệ quả cần ép: **slice này không được đẻ migration nào.** Nếu người cài đặt thấy mình cần thêm bảng hay thêm cột, đó là dấu hiệu đang làm việc của slice khác — dừng lại và hỏi, đừng thêm.

## FR-POR-04 là yêu cầu an ninh, không phải yêu cầu hiển thị

Kế hoạch nói thẳng, và đây là điểm đáng đầu tư nhất của slice:

> *"Phải kiểm thử theo hướng tấn công: đăng nhập bằng tài khoản người thuê phòng 101, rồi gọi thẳng API hoá đơn của phòng 102 bằng mã định danh **đoán được**. Phải nhận 403. Ca kiểm thử này nên demo khi bảo vệ — nó chứng minh nhóm hiểu phân quyền là chuyện ở tầng máy chủ, không phải chuyện ẩn nút trên giao diện."*

Dự án đã có tiền lệ tốt để chép: `HoaDonChiTietService` đã so `nguoiDung.nguoiThueId()` với `hoaDon.nguoiThueId()`, và bộ test `*AuthorizationIntegrationTest` của Slice 04–05 đã dựng khuôn.

**Ba mặt phải phủ, không chỉ một:** hoá đơn phòng khác · ảnh công tơ kỳ của phòng khác · hợp đồng của người thuê khác. Chặn được cái thứ nhất mà quên hai cái sau là lỗ hổng thật.

## Ranh giới UX: tài liệu người thuê trải trên ba slice

`Doc/UX/03-nguoi-thue.md` đặc tả toàn bộ trải nghiệm người thuê, nhưng **không phải màn nào cũng thuộc slice này**:

| Màn | Thuộc slice | Ghi chú |
|---|---|---|
| `#32` Hoá đơn mới nhất | **06** | `FR-POR-01` |
| `#33` Hoá đơn bản người thuê | **06** | `FR-POR-02`, `FR-POR-06`; dòng làm tròn có thể âm |
| `#34` Lịch sử 12 kỳ | **06** | `FR-POR-03`; ít hơn 12 kỳ thì hiện đúng số có |
| `#35` Biểu đồ tiêu thụ | **06** | `FR-POR-05`; biểu đồ **và** bảng, điện nước tách riêng |
| `#36` Hợp đồng + cảnh báo hết hạn | **06** | `FR-POR-07`, `BR-14` |
| `#29` Mã QR chuyển khoản | **05** | `FR-INV-10` — ticket `05 · 06` |
| `#37` Báo hỏng | **07** | `FR-MNT-01` — không làm ở đây |
| `#44` Hộp thông báo | **08** | Dùng chung |

Người cài đặt đọc `03-nguoi-thue.md` sẽ thấy cả tám màn và dễ làm luôn. **Chỉ làm năm màn của slice này.**

## Vì sao nên xây sau ticket `05 · 02`, dù kỹ thuật thì làm được ngay

`HOA_DON.da_thu` đã tồn tại làm cột, nên mã chạy được ngay. Nhưng cho tới khi ticket `05 · 02` ghi nhận thanh toán thật, cột đó **luôn bằng 0** — nghĩa là người thuê mở cổng ra thấy **mọi hoá đơn đều chưa trả**, kể cả hoá đơn đã trả xong.

Không sai về mã. Sai về thứ người dùng nhìn thấy, và hỏng hẳn khi demo.

**Không phải đợi hết Slice 05** — chỉ cần ticket `05 · 02`. Sau đó slice này chạy song song với phần còn lại của 05 được.

## BR-15: dòng làm tròn âm là chỗ dễ mất niềm tin nhất

`Doc/UX/03-nguoi-thue.md` gọi `#33` là màn **quyết định niềm tin**. Người thuê mở hoá đơn ra để trả lời đúng một câu: *"sao tháng này đắt hơn tháng trước"*.

Dòng *"Làm tròn"* mang số **âm** là thứ trông như lỗi nếu không giải thích. BR-15 ghi rõ nó có thể âm, và Slice 04 đã cài đúng. Slice này phải **hiển thị nó tử tế**, không giấu và không đổi dấu cho đẹp.

Tương tự với bậc thang: `FR-POR-02` đòi *"chỉ số đầu kỳ, cuối kỳ, mức tiêu thụ, đơn giá, thành tiền"* — từng bậc phải hiện, để người thuê cộng lại được bằng tay. `HoaDonChiTietService` đã trả về đủ dữ liệu này cho phía quản lý; slice này dùng lại, **không viết đường tính thứ hai**.

## Phân quyền

| Ai | Thấy gì |
|---|---|
| **Người thuê** | Hoá đơn, chỉ số, ảnh công tơ, hợp đồng — **chỉ của chính mình**, qua `NguoiDung.nguoiThueId` |
| Quản lý, Chủ | Đã có từ các slice trước; slice này không đổi |
| **QTHT** | **403 ở mọi endpoint** — CR-016 |
| Thợ | 403 |

### Người thuê đã thanh lý hợp đồng — ruling 3A

**Chốt: vẫn xem được** hoá đơn và hợp đồng cũ **của chính mình**, không giới hạn thời gian.

Lý do không phải sự tiện lợi mà là một **mâu thuẫn nội tại** nếu chọn ngược lại. Ticket `05 · 09` sinh **hoá đơn quyết toán** khi tiền cọc trừ công nợ ra số âm — và hoá đơn đó phát sinh **sau** khi hợp đồng đã thanh lý, đó chính là lý do nó không nhét được vào hoá đơn kỳ cuối. Cắt quyền xem lúc thanh lý nghĩa là người thuê **không bao giờ xem được hoá đơn mà chính họ phải trả**.

Hai điều kiện siết lại, phải có test:

1. Chỉ xem được hợp đồng **của chính mình** — `FR-POR-04` áp nguyên, kiểm qua `NguoiDung.nguoiThueId`. Thanh lý **không** nới lỏng gì.
2. Tài khoản bị **khoá** thì mất quyền ngay. Cơ chế đã có từ Slice 00 (`FR-AUT-06`, `FR-AUT-07`, ADR-0001) — đây là van an toàn cho lo ngại bề mặt tấn công, không cần luật thời hạn riêng.

## Hoàn thành khi

1. Người thuê đăng nhập **thấy ngay** hoá đơn kỳ gần nhất, không qua màn trung gian (`FR-POR-01`)
2. Chi tiết đủ để **cộng lại bằng tay**: từng khoản, từng bậc, chỉ số đầu/cuối, đơn giá, thành tiền, dòng làm tròn kể cả âm
3. Tra cứu được 12 kỳ; ít hơn 12 thì hiện đúng số có, không báo lỗi
4. Xem được ảnh công tơ **của đúng kỳ tương ứng**, qua liên kết ký 15 phút
5. **Kiểm thử theo hướng tấn công xanh cả ba mặt**: hoá đơn, ảnh công tơ, hợp đồng của người khác đều 403 ở tầng máy chủ
6. Biểu đồ 12 kỳ, **điện và nước tách riêng**, kèm bảng số
7. Hợp đồng hiện cảnh báo khi còn dưới 30 ngày (`BR-14`) — bằng **điều kiện truy vấn**, không phải cột trạng thái (ghi chú CR-012)
8. **Không có migration nào được thêm trong slice này**
9. QTHT và Thợ nhận 403
10. **Người thuê đã thanh lý vẫn xem được hợp đồng cũ của chính mình**; khoá tài khoản thì mất quyền ngay (ruling 3A)

## Bảng ticket

| # | Ticket | Blocked by | Migration |
|---|---|---|---|
| 01 | Hoá đơn kỳ gần nhất và ranh giới phân quyền | — | **không** |
| 02 | Hoá đơn bản người thuê | 01 | **không** |
| 03 | Lịch sử 12 kỳ | 02 | **không** |
| 04 | Biểu đồ tiêu thụ 12 kỳ | 02 | **không** |
| 05 | Hợp đồng và cảnh báo hết hạn | 02 | **không** |

Độ phủ đã soát: **10/10** mã FR/BR/CR trong phạm vi đều có ticket.

**Ticket 01 dựng xương sống phân quyền cho cả slice** — bốn ticket sau đều treo lên cùng một luật *"người thuê chỉ thấy dữ liệu của chính mình"*, nên làm đúng ở 01 thì bốn cái sau chỉ là hiển thị. Đây cũng là ticket mang bộ ca kiểm thử theo hướng tấn công mà kế hoạch đề nghị demo khi bảo vệ.

Ticket 03, 04, 05 **không chặn nhau** — chạy song song được sau 02.

**Không ticket nào được thêm migration.** Slice chỉ đọc.

## Không thuộc phạm vi

- `#37` Báo hỏng — Slice 07
- `#29` Mã QR — ticket `05 · 06`
- `#44` Hộp thông báo — Slice 08
- `FR-POR-08`, `FR-POR-09` — không nằm trong danh sách kế hoạch giao cho slice này
- Mọi thao tác ghi. Người thuê ở slice này **chỉ đọc**
