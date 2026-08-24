# KẾ HOẠCH TRIỂN KHAI

**Dự án:** PRJ1-CCM — Hệ thống Quản lý và Vận hành Chung cư mini
**Phiên bản:** 1.0 · Ngày lập: 23/08/2026
**Căn cứ:** Tài liệu phân tích yêu cầu v1.0 + Lô phiếu thay đổi số 01

---

## 1. Phạm vi và các quyết định nền

| Hạng mục | Quyết định |
|---|---|
| Phạm vi | Must have + Should have — **32 user story, 81 yêu cầu chức năng, 171 điểm** |
| Cộng thêm từ lô CR-01 | ~8 điểm → **tổng khoảng 179 điểm** |
| Ngôn ngữ, nền tảng | Spring Boot + PostgreSQL + React |
| Triển khai | Máy chủ riêng ảo tự thuê, Docker Compose, Nginx, chứng chỉ Let's Encrypt |
| Tự động hoá | GitHub Actions — chạy kiểm thử rồi mới đưa lên máy chủ |
| Thuế GTGT | Không tính (CR-011) |
| Chế độ giá điện mặc định | Đơn giá cố định; vẫn cài đặt đầy đủ bậc thang và định mức đầu người |
| Ràng buộc thời gian | Không bó buộc — ưu tiên **hoàn chỉnh** hơn nhanh |

**Về 12 yêu cầu mức Could have.** Nằm ngoài phạm vi, nhưng cần lưu ý một hệ quả: **CR-007 (bảng chỉ số công tơ tổng) chỉ phục vụ FR-RPT-06 và FR-RPT-07, cả hai đều mức Could have.** Vì vậy CR-007 được **hoãn xuống vertical slice cuối**, thực hiện nếu còn thời gian. Mười ba phiếu CR còn lại đều phục vụ yêu cầu Must hoặc Should nên bắt buộc làm.

---

## 2. Nguyên tắc chỉ đạo

Bốn nguyên tắc dưới đây chi phối mọi quyết định về thứ tự và cách làm. Khi có mâu thuẫn, nguyên tắc ở trên thắng.

**Nguyên tắc 1 — Vertical slice *(lát cắt dọc)*, không phải tầng ngang.**
Mỗi vertical slice đi trọn từ cơ sở dữ liệu qua tầng nghiệp vụ, qua API, lên tới giao diện, và **chạy được thật**. Không có giai đoạn "làm hết backend rồi mới làm frontend". Lý do: dừng ở bất kỳ vertical slice nào cũng còn một sản phẩm demo được; còn cách làm theo tầng ngang thì dừng giữa chừng là **không có gì để trình bày**.

**Nguyên tắc 2 — Tiền bạc được kiểm thử trước khi được cài đặt.**
Toàn bộ quy tắc từ BR-01 đến BR-19 phải có kiểm thử tự động **viết trước phần cài đặt**. Đây là phần khó nhất, dễ sai nhất, và là phần đáng đem ra bảo vệ nhất của đồ án. Chi tiết ở mục 5.

**Nguyên tắc 3 — Không có chức năng nào không truy được về một mã yêu cầu.**
Chép nguyên nguyên tắc từ mục 8.4 của tài liệu phân tích. Mỗi nhánh mã nguồn, mỗi lần gộp mã, mỗi ca kiểm thử đều mang mã FR trong tên. Khi bảo vệ, hỏi bất kỳ chức năng nào cũng chỉ ra được nó sinh ra từ yêu cầu nào, yêu cầu đó sinh ra từ phát hiện khảo sát nào.

**Nguyên tắc 4 — Báo cáo viết song song, không viết sau.**
Mỗi vertical slice kết thúc bằng việc bổ sung phần tương ứng vào báo cáo, kèm ảnh màn hình chụp ngay lúc đó. Để dồn đến cuối sẽ phải dựng lại dữ liệu mẫu chỉ để chụp ảnh, và những lý do đằng sau các quyết định thiết kế sẽ quên mất.

---

## 3. Kiến trúc mục tiêu

```
                          Internet
                             │
                     ┌───────▼────────┐
                     │  Nginx  :443   │  TLS, Let's Encrypt
                     └───┬────────┬───┘
                 tĩnh    │        │  /api
                ┌────────▼──┐  ┌──▼──────────────┐
                │ React     │  │ Spring Boot     │
                │ (đã build)│  │ :8080           │
                └───────────┘  └──┬───────────┬──┘
                                  │           │
                   mạng nội bộ    │           │  volume
                   Docker         │           │
                            ┌─────▼─────┐  ┌──▼──────────┐
                            │PostgreSQL │  │ /var/uploads│
                            │  :5432    │  │ ảnh công tơ │
                            │ KHÔNG mở  │  │ ảnh giấy tờ │
                            │ ra ngoài  │  └─────────────┘
                            └───────────┘
```

**Phân lớp bên trong Spring Boot** — theo module nghiệp vụ, không theo loại kỹ thuật:

```
com.prj1.ccm
├── auth/          xác thực, phân quyền          FR-AUT
├── building/      toà nhà, phòng, dịch vụ, giá   FR-BLD
├── tenant/        người thuê, hợp đồng           FR-TNT
├── metering/      ghi chỉ số                     FR-MTR
├── billing/       hoá đơn, thanh toán, công nợ   FR-INV
│   └── calc/      ★ CÁC QUY TẮC TÍNH TIỀN — thuần tuý, không phụ thuộc gì
├── maintenance/   sự cố, bảo trì                 FR-MNT
├── notification/  thông báo, nhắc việc           FR-NTF
├── portal/        cổng người thuê                FR-POR
├── report/        báo cáo, thống kê              FR-RPT
├── safety/        an toàn, nhật ký               FR-SEC
└── shared/        kiểu tiền tệ, kỳ, lỗi chung
```

Gói `billing/calc` là trung tâm của đồ án và có một ràng buộc riêng: **không được phụ thuộc vào Spring, vào cơ sở dữ liệu, hay vào bất cứ thứ gì bên ngoài.** Nó nhận dữ liệu vào, trả kết quả ra, không đọc ghi gì cả. Nhờ vậy kiểm thử nó chạy trong mili giây và có thể viết hàng trăm ca mà không cần dựng cơ sở dữ liệu.

---

## 4. Quy ước kỹ thuật bắt buộc

Sáu quy ước dưới đây **được ép bằng công cụ tự động**, không dựa vào việc ai đó nhớ.

| # | Quy ước | Cách ép |
|---|---|---|
| 1 | Mọi số tiền dùng `BigDecimal` ở Java và `NUMERIC(15,2)` ở PostgreSQL. **Cấm tuyệt đối `double`, `float`** | Luật ArchUnit chạy trong kiểm thử — gãy build nếu vi phạm |
| 2 | Mọi thay đổi cấu trúc bảng đi qua tệp migration Flyway, đánh số tăng dần, **không sửa tệp đã chạy** | Flyway tự kiểm tra mã băm, sai là không khởi động được |
| 3 | Không gọi API nào mà không kiểm tra quyền; mặc định là **từ chối** | Kiểm thử tích hợp cho mọi endpoint với vai trò sai, phải nhận 403 |
| 4 | Mọi endpoint có mã FR trong chú thích, mọi ca kiểm thử có mã FR trong tên | Script quét, đối chiếu với ma trận truy vết |
| 5 | Ảnh không bao giờ phục vụ trực tiếp — luôn qua liên kết ký hạn 15 phút | Nginx không cấu hình đường dẫn tĩnh nào tới thư mục tải lên |
| 6 | Cổng 5432 **không** publish ra ngoài Docker | Kiểm tra trong script triển khai |

**Về quy ước 1.** Đây là quy ước quan trọng nhất và cũng là thứ dễ vi phạm nhất mà không ai nhận ra. Một phép nhân bằng `double` giữa đơn giá và số lượng có thể ra `203000.00000000003`, làm sai số tiền ở hàng đơn vị — nhìn hoá đơn bằng mắt thường **không phát hiện được**, chỉ lộ ra khi đối chiếu tổng cuối kỳ. Phụ lục B của tài liệu phân tích đã cảnh báo điều này; ở đây ta biến cảnh báo thành ràng buộc máy kiểm.

---

## 5. Chiến lược kiểm thử phần tính tiền

Đây là mục quan trọng nhất của kế hoạch, và cũng là mục nên trình bày kỹ nhất khi bảo vệ.

**Vì sao cần chiến lược riêng.** Sai sót ở phần tính tiền có ba đặc điểm khiến nó nguy hiểm hơn lỗi thường: nó **không làm chương trình báo lỗi**; nó **ảnh hưởng trực tiếp tới tiền của người dùng thật**; và nó **chỉ lộ ra sau nhiều kỳ**, khi việc sửa đã kéo theo phải tính lại dữ liệu lịch sử.

**Ba tầng kiểm thử:**

**Tầng 1 — Ca kiểm thử ví dụ.** Mỗi quy tắc từ BR-01 đến BR-19 có tối thiểu ba ca: một ca thông thường, một ca ở biên, một ca ngoại lệ. Ví dụ tính hoá đơn ở mục 5.4.5 của tài liệu phân tích trở thành **ca kiểm thử số một**, chép nguyên số liệu, kỳ vọng đúng 1.888.000 đồng. Đây là ca kiểm thử mà nhóm nên trình chiếu khi bảo vệ — nó nối thẳng tài liệu phân tích với mã nguồn đang chạy.

**Tầng 2 — Kiểm thử theo tính chất.** Thay vì liệt kê ca cụ thể, phát biểu những tính chất phải luôn đúng rồi để máy sinh hàng nghìn bộ dữ liệu ngẫu nhiên thử phá:

- Tổng các dòng chi tiết cộng khoản làm tròn **luôn** bằng tổng tiền hoá đơn, kể cả khi khoản làm tròn mang dấu âm
- Tiền điện bậc thang **luôn** lớn hơn hoặc bằng tiền tính theo đơn giá bậc một
- Tiền thuê tính theo ngày của một kỳ trọn vẹn **luôn** bằng đúng giá thuê tháng
- Với mọi dãy thanh toán, "đã thu" **luôn** bằng tổng đại số các bút toán
- Số dư khả dụng **không bao giờ** âm

Tầng này tìm ra loại lỗi mà con người không nghĩ tới khi ngồi liệt kê ca — đặc biệt là lỗi làm tròn ở biên các bậc thang.

**Tầng 3 — Kiểm thử bất biến lịch sử.** Ứng với NFR-CMP-02: tạo hoá đơn, chốt kỳ, rồi **cố ý thay đổi bảng giá, thay đổi số người ở, thay đổi đơn giá dịch vụ**, sau đó in lại hoá đơn cũ và khẳng định con số **không đổi**. Đây chính là tầng kiểm thử chứng minh CR-002 và CR-003 đã được giải quyết đúng.

---

## 6. Các vertical slice

Ký hiệu: **[M]** Must have · **[S]** Should have · **[C]** Could have, ngoài phạm vi

### Vertical Slice 0 — Nền móng

**Mục tiêu:** dựng bộ khung chạy được đầu-cuối với đúng một màn hình đăng nhập thật.

| Việc | Chi tiết |
|---|---|
| Kho mã | Một kho, hai thư mục `backend/` và `frontend/` |
| Chạy tại máy | `docker compose up` là có Postgres + backend + frontend |
| Cơ sở dữ liệu | Flyway migration đầu tiên: bảng `NGUOI_DUNG`, `TOA_NHA`, `PHAN_QUYEN_TOA` |
| Xác thực | Đăng nhập bằng số điện thoại và mật khẩu, cấp token |
| Tự động hoá | GitHub Actions: build, chạy kiểm thử, dựng ảnh Docker |
| Luật kiến trúc | ArchUnit — cấm `double`/`float` cho tiền, cấm `billing/calc` phụ thuộc Spring |

**Đóng:** FR-AUT-01 [M], FR-AUT-02 [M], FR-AUT-04 [M], FR-AUT-05 [M], FR-AUT-06 [M]
**Hoàn thành khi:** đăng nhập được bằng năm vai trò khác nhau, mỗi vai trò thấy một menu khác nhau; sai mật khẩu năm lần thì bị khoá tạm; luật ArchUnit chạy và gãy build khi cố tình vi phạm.

---

### Vertical Slice 1 — Danh mục toà nhà, phòng, dịch vụ

**Mục tiêu:** khai báo được toàn bộ dữ liệu nền để các vertical slice sau có cái mà dùng.

**Đóng:** FR-BLD-01 [M], FR-BLD-02 [M], FR-BLD-03 [M], FR-BLD-05 [M], FR-BLD-06 [M], FR-BLD-07 [M], FR-BLD-08 [S]
**Áp dụng CR:** CR-003 (bảng giá bậc thang)

**Điểm cần chú ý.** Bảng giá phải lưu được **nhiều phiên bản theo ngày hiệu lực** ngay từ vertical slice này, không phải chỉ một mức giá hiện hành. Làm đúng ngay từ đầu thì rẻ; sửa về sau thì phải chuyển đổi toàn bộ dữ liệu đã có. Quy tắc tra giá: lấy bản có ngày hiệu lực lớn nhất **nhưng không vượt quá ngày kết thúc kỳ đang tính**.

**Hoàn thành khi:** khai báo được một toà 3 tầng 20 phòng; khai báo được dịch vụ điện ở cả hai chế độ giá; nhập được biểu giá sáu bậc; sửa giá có ngày hiệu lực mới mà giá cũ vẫn tra được.

---

### Vertical Slice 2 — Người thuê và hợp đồng

**Đóng:** FR-TNT-01 [M], FR-TNT-02 [M], FR-TNT-03 [S], FR-TNT-04 [M], FR-TNT-05 [M], FR-TNT-07 [S], FR-BLD-04 [M]
**Áp dụng CR:** CR-001 (liên kết tài khoản ↔ người thuê), CR-002 phần (a), CR-005 (trạng thái hợp đồng), CR-012 (trạng thái là giá trị đệm), CR-013 (ảnh giấy tờ)

**Điểm cần chú ý.** FR-TNT-05 cấm hai hợp đồng cùng hiệu lực trên một phòng — phải ép bằng **ràng buộc ở tầng cơ sở dữ liệu**, không chỉ kiểm ở tầng ứng dụng. PostgreSQL có kiểu khoảng và ràng buộc loại trừ làm được việc này chính xác. Kiểm ở tầng ứng dụng sẽ hở khi hai người cùng thao tác một lúc.

**Hoàn thành khi:** ký được hợp đồng, phòng tự chuyển trạng thái; thử ký hợp đồng thứ hai chồng ngày lên cùng phòng thì bị từ chối; ảnh căn cước tải lên xem được qua liên kết hết hạn sau 15 phút, dán liên kết đó vào cửa sổ ẩn danh sau 15 phút thì không xem được.

---

### Vertical Slice 3 — Ghi chỉ số dịch vụ

**Đóng:** FR-MTR-01 [M], FR-MTR-02 [M], FR-MTR-03 [M], FR-MTR-04 [S], FR-MTR-06 [M], FR-MTR-07 [S], FR-MTR-08 [M], FR-MTR-09 [S], FR-MTR-10 [M]
**Áp dụng CR:** CR-004 (bốn chỉ số khi thay công tơ)

**Điểm cần chú ý.** Màn hình này là màn hình dùng **nhiều nhất và trên điện thoại**, giữa hành lang, có thể thiếu sáng và yếu sóng. Thiết kế giao diện phải ưu tiên: ô nhập số to, bàn phím số, tự nhảy sang phòng kế tiếp, hiện ngay mức tiêu thụ vừa tính để người ghi tự phát hiện gõ nhầm. FR-MTR-05 (giữ dữ liệu khi mất mạng) là yêu cầu Should have nhưng phức tạp — để cuối vertical slice, cắt được nếu cần.

**Hoàn thành khi:** ghi chỉ số cho 20 phòng trên điện thoại; nhập số nhỏ hơn kỳ trước thì bị chặn, trừ khi khai thay công tơ; tiêu thụ bất thường thì cảnh báo; chốt kỳ bị chặn khi còn phòng chưa ghi.

---

### Vertical Slice 4 — Tính hoá đơn ★

**Đây là vertical slice quan trọng nhất của toàn bộ đồ án.** Làm chậm cũng được, nhưng phải đúng tuyệt đối.

**Đóng:** FR-INV-01 [M], FR-INV-02 [M], FR-INV-03 [M], FR-INV-04 [M], FR-INV-05 [S], FR-INV-06 [M], FR-INV-07 [M]
**Áp dụng CR:** CR-002 phần (b) — kết tinh nhân khẩu khi chốt kỳ; CR-008 (khoản phát sinh chờ); CR-011 (bỏ thuế GTGT)
**Quy tắc nghiệp vụ:** BR-01 → BR-09, BR-15, BR-16

**Thứ tự bắt buộc trong vertical slice này:**

1. Viết **toàn bộ** kiểm thử cho `billing/calc` — cả ba tầng ở mục 5 — trong khi chưa có dòng cài đặt nào
2. Cài đặt cho tới khi mọi kiểm thử xanh
3. Chỉ khi đó mới nối vào cơ sở dữ liệu và giao diện

Đảo thứ tự này là mất phần lớn giá trị của vertical slice. Khi viết kiểm thử trước, các câu hỏi kiểu "kỳ đầu tiên của một hợp đồng ký giữa tháng thì tính tiền phòng thế nào" sẽ **bật ra ngay**, lúc chưa tốn công cài đặt gì. Viết mã trước thì những câu đó chỉ lộ ra khi đã muộn.

**Hoàn thành khi:** ca kiểm thử chép từ mục 5.4.5 ra đúng 1.888.000 đồng; tạo hàng loạt hoá đơn cho 20 phòng trong một thao tác; phòng thiếu chỉ số bị bỏ qua có báo rõ, không làm gián đoạn phần còn lại; thử tạo lần hai cho cùng kỳ thì bị chặn; **kiểm thử bất biến lịch sử ở tầng 3 xanh**.

---

### Vertical Slice 5 — Thanh toán và công nợ

**Đóng:** FR-INV-08 [M], FR-INV-09 [S], FR-INV-10 [S], FR-INV-11 [M], FR-INV-12 [M], FR-INV-13 [S], FR-INV-14 [M], FR-INV-16 [S], FR-TNT-08 [M], FR-TNT-09 [M]
**Áp dụng CR:** CR-006 (số dư khả dụng), CR-009 (giao dịch cọc), CR-010 (bút toán đối ứng)
**Quy tắc nghiệp vụ:** BR-08, BR-12, BR-13, BR-17, BR-18

**Điểm cần chú ý.** Mã QR chuyển khoản ở FR-INV-10 gây ấn tượng tốt khi demo mà công sức bỏ ra ít — mã QR ngân hàng theo chuẩn hiện hành sinh được hoàn toàn ở phía máy chủ, không cần tích hợp với ngân hàng nào. Nên làm sớm trong vertical slice này. Ngược lại, FR-INV-15 (đối soát sao kê) **không nằm trong phạm vi** — đã đúng là Should have nhưng phụ thuộc định dạng file của từng ngân hàng, rủi ro cao mà giá trị trình bày thấp.

**Hoàn thành khi:** thu tiền nhiều lần trên một hoá đơn, trạng thái tự đổi đúng; trả thừa thì sinh số dư, kỳ sau tự trừ; thử xoá bản ghi thanh toán thì bị cấm, chỉ lập được bút toán đối ứng có lý do; thanh lý hợp đồng tính đúng tiền cọc hoàn lại sau khi trừ công nợ.

---

### Vertical Slice 6 — Cổng người thuê

**Đóng:** FR-POR-01 [M], FR-POR-02 [M], FR-POR-03 [M], FR-POR-04 [M], FR-POR-05 [S], FR-POR-06 [M], FR-POR-07 [S]
**Phụ thuộc:** CR-001 — vertical slice này **không khởi động được** nếu CR-001 chưa xong

**Điểm cần chú ý.** FR-POR-04 là yêu cầu **an ninh**, không phải yêu cầu hiển thị. Phải kiểm thử theo hướng tấn công: đăng nhập bằng tài khoản người thuê phòng 101, rồi gọi thẳng API hoá đơn của phòng 102 bằng mã định danh đoán được. Phải nhận 403. Ca kiểm thử này nên demo khi bảo vệ — nó chứng minh nhóm hiểu phân quyền là chuyện ở tầng máy chủ, không phải chuyện ẩn nút trên giao diện.

**Hoàn thành khi:** người thuê đăng nhập thấy đúng hoá đơn phòng mình với đầy đủ chỉ số và đơn giá từng khoản; xem được ảnh công tơ của kỳ tương ứng; thử truy cập dữ liệu phòng khác thì bị chặn ở tầng máy chủ.

---

### Vertical Slice 7 — Sự cố và bảo trì

**Đóng:** FR-MNT-01 [M], FR-MNT-02 [M], FR-MNT-03 [M], FR-MNT-04 [M], FR-MNT-05 [S], FR-MNT-06 [S], FR-MNT-08 [S]
**Áp dụng CR:** CR-008 — khoản phát sinh nối sang hoá đơn

**Hoàn thành khi:** người thuê gửi yêu cầu kèm ảnh; quản lý phân công cho thợ; ghi chi phí và bên chịu; **chi phí do người thuê chịu tự vào hoá đơn kỳ sau đúng một lần** — chạy tạo hoá đơn hai kỳ liên tiếp để chứng minh không bị tính lặp. Đây là ca kiểm thử trực tiếp chứng minh CR-008 đã xử lý đúng.

---

### Vertical Slice 8 — Thông báo và nhắc việc

**Đóng:** FR-NTF-01 [S], FR-NTF-02 [S], FR-NTF-04 [S], FR-NTF-05 [S], FR-NTF-07 [S]
**Quy tắc nghiệp vụ:** BR-14

**Điểm cần chú ý.** Chỉ làm thông báo **trong ứng dụng**, đúng như FR-NTF-07 đã giới hạn. Không tích hợp email hay Zalo — ngoài phạm vi và thêm một điểm hỏng khi demo.

---

### Vertical Slice 9 — Báo cáo và thống kê

**Đóng:** FR-RPT-01 [M], FR-RPT-02 [M], FR-RPT-03 [M], FR-RPT-04 [S], FR-RPT-05 [S], FR-RPT-08 [S]

**Điểm cần chú ý.** FR-RPT-04 yêu cầu số liệu xuất ra Excel **khớp đúng** với số trên màn hình. Nghe hiển nhiên nhưng rất hay sai, vì màn hình thường làm tròn để hiển thị còn file xuất lấy số gốc. Cần một ca kiểm thử đối chiếu trực tiếp hai nguồn.

---

### Vertical Slice 10 — An toàn, tuân thủ và nhật ký

**Đóng:** FR-SEC-01 [S], FR-SEC-02 [S], FR-SEC-03 [S], FR-SEC-05 [S], FR-SEC-06 [S], FR-SEC-07 [S], FR-AUT-03 [M], FR-AUT-07 [S], FR-TNT-11 [S], FR-TNT-06 [S]

**Điểm cần chú ý.** FR-SEC-07 đòi nhật ký **chỉ đọc, không sửa được**. Ép bằng quyền ở tầng cơ sở dữ liệu: tài khoản mà ứng dụng dùng chỉ được cấp quyền thêm dòng vào bảng nhật ký, không có quyền sửa hay xoá. Chặn ở tầng ứng dụng thôi thì chưa đủ mạnh để gọi là không sửa được, và đây là chỗ dễ bị hỏi vặn.

---

### Vertical Slice 11 — Đưa lên máy chủ thật

| Việc | Chi tiết |
|---|---|
| Máy chủ | Dựng máy chủ riêng ảo, vùng Singapore |
| Bảo mật cơ bản | Tường lửa chỉ mở 22, 80, 443; đăng nhập bằng khoá, tắt mật khẩu |
| Tên miền, chứng chỉ | Trỏ tên miền, cấp chứng chỉ Let's Encrypt, bật tự gia hạn |
| Cơ sở dữ liệu | Chỉ nghe trên mạng nội bộ Docker — **kiểm tra lại bằng cách quét cổng từ máy khác** |
| Sao lưu | `pg_dump` hằng ngày, đẩy ra ngoài máy chủ, **thử phục hồi ít nhất một lần** |
| Tự động đưa lên | GitHub Actions đẩy lên máy chủ sau khi kiểm thử xanh |
| Dự phòng khi bảo vệ | Docker Compose chạy tại máy, dữ liệu mẫu sẵn sàng |

**Về bản sao lưu chưa từng thử phục hồi:** nó chưa phải bản sao lưu, chỉ là một tệp mà ta hy vọng dùng được. Phải thử phục hồi một lần vào cơ sở dữ liệu trống rồi mới tính là xong việc.

---

### Vertical Slice 12 — Còn thời gian thì làm

Xếp theo tỷ lệ giá trị trình bày trên công sức, cao xuống thấp:

1. **FR-RPT-06, FR-RPT-07 + CR-007** — chỉ số công tơ tổng và cảnh báo thất thoát. BR-19 là một trong năm điểm khác biệt đã tuyên bố ở mục 3.5.2, làm được thì luận điểm giá trị của đề tài đứng vững hơn.
2. **FR-MTR-05** — giữ dữ liệu khi mất mạng. Ấn tượng khi demo, nhưng tốn công.
3. **FR-BLD-09, FR-TNT-10** — tài sản trong phòng, đăng ký xe. Dễ, nhưng ít gây ấn tượng.
4. **FR-INV-15** — đối soát sao kê. **Không khuyến nghị**: phụ thuộc định dạng file từng ngân hàng, công sức lớn, rủi ro cao.

---

## 7. Ánh xạ sang các chương báo cáo

Cột bên phải là thứ phải viết **ngay khi** vertical slice kết thúc, không để dồn.

| Vertical slice | Viết vào báo cáo |
|---|---|
| 0 | Chương 4 — công nghệ sử dụng, lý do chọn; Chương 3 — sơ đồ kiến trúc |
| 1–2 | Chương 3 — lược đồ cơ sở dữ liệu, sơ đồ lớp, thiết kế giao diện |
| 3 | Chương 5 — ảnh màn hình ghi chỉ số trên điện thoại |
| **4** | **Chương 3 — sơ đồ tuần tự quy trình tạo hoá đơn; Chương 6 — chiến lược kiểm thử tiền tệ, kết quả** |
| 5–6 | Chương 5 — ảnh màn hình; Chương 6 — ca kiểm thử phân quyền |
| 7–10 | Chương 5 — ảnh màn hình từng phân hệ |
| 11 | Chương 5 — quy trình đưa lên máy chủ, sơ đồ triển khai, cấu hình bảo mật |
| Sau cùng | Chương 7 — kết luận, hạn chế, hướng phát triển; hoàn thiện tài liệu tham khảo |

**Vertical Slice 4 in đậm vì đó là chương đáng đầu tư nhất.** Phần lớn đồ án sinh viên trình bày được "hệ thống làm được gì"; rất ít trình bày được "làm sao biết nó tính đúng". Đó là chỗ tạo khác biệt.

---

## 8. Phân công theo vai trò

Chia theo **vai trò dọc**, không theo module — để mỗi người đều chạm vào toàn hệ thống và **tự bảo vệ được phần của mình** khi được hỏi.

| Vai trò | Trách nhiệm | Người |
|---|---|---|
| **A — Nghiệp vụ và kiểm thử** | Sở hữu `billing/calc` và toàn bộ BR. Viết kiểm thử trước khi có cài đặt. Chủ trì Vertical Slice 4. Là người trả lời khi bị hỏi "làm sao biết tính đúng" | *(điền)* |
| **B — Giao diện** | Sở hữu React. Đặc biệt màn hình ghi chỉ số trên điện thoại và cổng người thuê | *(điền)* |
| **C — Hạ tầng** | Docker, GitHub Actions, máy chủ, Nginx, chứng chỉ, sao lưu. Sở hữu Vertical Slice 0 và 11 | *(điền)* |
| **D — Tài liệu và truy vết** | Cập nhật ma trận truy vết mỗi vertical slice, quản lý phiếu CR, biên tập báo cáo, dựng slide | *(điền)* |

**Về việc phần lớn mã do công cụ hỗ trợ sinh ra.** Điều này không làm bảng phân công mất ý nghĩa, nhưng làm **đổi bản chất công việc**: mỗi người không còn được đánh giá bằng số dòng đã gõ, mà bằng việc **có kiểm soát được phần mình phụ trách hay không**. Câu hỏi khi bảo vệ sẽ là "chỗ này hoạt động thế nào", "vì sao chọn cách này", "làm sao biết nó đúng" — chứ không phải "ai gõ dòng này". Vì vậy mỗi người phải tự đọc, tự chạy, và tự kiểm thử được phần của mình trước khi coi là xong.

Một hệ quả thực tế: **người ở vai trò A cần hiểu sâu nhất**, vì đó là phần chắc chắn bị hỏi kỹ nhất. Nên chọn người vững nhất nhóm vào vai trò này.

---

## 9. Rủi ro bổ sung

Ba rủi ro dưới đây phát sinh từ các quyết định trong kế hoạch này, chưa có trong Phụ lục D của tài liệu phân tích.

| Mã | Rủi ro | Khả năng | Tác động | Biện pháp |
|---|---|---|---|---|
| **R-11** | Chọn phạm vi Must + Should (171 điểm) là mức cao; nguy cơ dở dang nhiều phân hệ | Trung bình | Cao | Vertical Slice — dừng ở đâu cũng còn sản phẩm chạy được. Vertical Slice 8–10 cắt được mà không ảnh hưởng luồng chính |
| **R-12** | Máy chủ hỏng hoặc mạng trục trặc đúng hôm bảo vệ | Thấp | Rất cao | Luôn có Docker Compose chạy tại máy kèm dữ liệu mẫu; **diễn tập trước ít nhất một lần** |
| **R-13** | Máy chủ tự thuê bị tấn công do cấu hình sai, trong khi cơ sở dữ liệu chứa số giấy tờ tuỳ thân | Trung bình | Rất cao | Sáu việc bắt buộc ở Vertical Slice 11; không đưa dữ liệu thật của người thật lên máy chủ, chỉ dùng dữ liệu mẫu |

**Về R-13.** Cần nói rõ vì nó liên quan tới trách nhiệm chứ không chỉ kỹ thuật: **không đưa dữ liệu cá nhân thật của người thật lên máy chủ đồ án.** Toàn bộ dữ liệu trình diễn phải là dữ liệu bịa. Đây vừa là biện pháp giảm rủi ro, vừa là điều đúng đắn cần làm, và cũng là một ý đáng viết vào chương kết luận khi bàn về đạo đức xử lý dữ liệu cá nhân.
