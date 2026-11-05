# Sáu quyết định cần chốt trước khi viết spec Slice 05

**Nguồn:** review mã ngày 01/09/2026, sau commit `c5377e3`. Chi tiết findings ở phiên review; tệp này chỉ chứa phần cần người quyết định.

**Vì sao phải chốt trước.** `AGENTS.md` mục 5 phân biệt hai loại mơ hồ. Sáu câu dưới đây đều là **product ambiguity** — hành vi nghiệp vụ chưa xác định, hoặc hai tài liệu nguồn nói ngược nhau. Theo mục 5, tầng thực thi **không được tự phát minh câu trả lời**; phải quay về tầng lập kế hoạch và cập nhật spec trước.

Mỗi câu đều đổi **migration** hoặc đổi **hành vi nghiệp vụ**, nên trả lời sau khi đã viết mã là phải sửa lược đồ đã chạy — mà Flyway không cho sửa tệp đã chạy.

**Cách dùng:** chọn A, B hay C cho từng câu, ghi vào mục `## Chốt` cuối tệp. Sau đó mới chạy `grill-with-docs` → `to-spec` → `to-tickets`.

---

## Câu 1 — Bút toán đối ứng trên hoá đơn đã thanh toán đủ thì trạng thái đi đâu?

**Ảnh hưởng:** máy trạng thái `QuyTacTrangThaiHoaDon`, có thể phải lập CR sửa BR-08.

**Vì sao mơ hồ.** Hai nguồn nói ngược nhau, không thể cùng đúng:

> **BR-08:** *"Hoá đơn ở trạng thái Đã thanh toán không thể quay lại trạng thái trước đó."*

> **CR-010 + `14-seq-uc12-ghi-thanhtoan.mmd`:** bút toán đối ứng mang số tiền âm → *"Tinh lai da thu va trang thai"*.

Đã xác minh bằng chạy thật: gọi `ghiNhanThanhToan(DA_THANH_TOAN, …)` với đã-thu tụt xuống dưới tổng thì **ném `IllegalArgumentException`**. Mã hiện đang theo BR-08.

| P.án | Nội dung | Được | Mất |
|---|---|---|---|
| **A** | Giữ BR-08 nguyên văn. Hoá đơn `DA_THANH_TOAN` **không** lập được bút toán đối ứng. Muốn sửa thì huỷ cả hoá đơn rồi phát hành lại | Không đụng BR-08, không cần CR, máy trạng thái giữ nguyên | Lỗi thường gặp nhất là gõ nhầm số tiền — sửa bằng cách huỷ cả hoá đơn là dùng dao mổ trâu. Phát hành lại sinh **mã hoá đơn mới**, người thuê nhận hai mã cho cùng một kỳ |
| **B** | Cho lùi `DA_THANH_TOAN → DA_THU_MOT_PHAN`/`QUA_HAN`, **chỉ khi** nguyên nhân là bút toán đối ứng. Lập CR sửa BR-08 | Khớp CR-010 và sơ đồ tuần tự Chương 3. Trạng thái luôn phản ánh đúng số tiền thực | Phải lập CR sửa một BR đã viết trong tài liệu phân tích. Phải chặn chặt: chỉ bút toán đối ứng được đi cạnh lùi này, không phải mọi đường |
| **C** | Thêm trạng thái mới `DA_DIEU_CHINH` để không phải lùi | Giữ được chữ "không lùi" theo nghĩa hình thức | Thêm giá trị thứ bảy vào enum, sửa `CHECK` constraint, sửa mọi truy vấn và giao diện. Và trạng thái mới **vẫn phải trả lời** "còn nợ bao nhiêu" — tức nó không thay thế `DA_THU_MOT_PHAN`, chỉ chồng lên |

**Đề xuất: B.** Sơ đồ tuần tự Chương 3 đã vẽ đúng B. Quan trọng hơn: CR-010 tồn tại là **vì** BR-18 cấm xoá dữ liệu tài chính — chọn A tức là buộc người dùng huỷ cả hoá đơn để sửa một bút toán, đi ngược đúng tinh thần "sửa bằng bút toán đối ứng chứ không xoá" mà CR-010 sinh ra để bảo vệ.

---

## Câu 2 — `han_thanh_toan` lấy từ đâu?

**Ảnh hưởng:** truy vấn công nợ, xác định quá hạn, nhắc nợ. Có thể phải bỏ một cột.

**Vì sao mơ hồ.** Ba định nghĩa đang sống song song:

| Nguồn | Công thức |
|---|---|
| BR-12 | `ngày phát hành + TOA_NHA.so_ngay_han_tt` |
| `HOA_DON.han_thanh_toan` | cột lưu sẵn lúc tạo hoá đơn |
| `TinhHoaDonRepository.java:281` | `?::date > kt.ngay_ket_thuc + tn.so_ngay_han_tt` |

Câu SQL dùng **ngày kết thúc kỳ**, bỏ qua hoàn toàn cột `han_thanh_toan` nằm ngay trong cùng bảng.

| P.án | Nội dung | Được | Mất |
|---|---|---|---|
| **A** | Cột `HOA_DON.han_thanh_toan` là nguồn sự thật duy nhất. Sửa câu SQL để đọc cột | Khớp BR-12. Giá trị **đóng băng tại lúc phát hành** → đổi `so_ngay_han_tt` của toà sau này không làm đổi hạn của hoá đơn cũ. Đúng tinh thần bất biến lịch sử NFR-CMP-02 mà Slice 04 đã bảo vệ. Rẻ nhất — sửa một câu SQL | Phải nhớ tính đúng cột này lúc phát hành, không phải lúc tạo nháp |
| **B** | Bỏ cột, tính lại mỗi lần từ kỳ + cấu hình toà | Một nguồn duy nhất, không bao giờ lệch | **Đổi `so_ngay_han_tt` của toà làm đổi hạn của mọi hoá đơn cũ** → hoá đơn đang quá hạn bỗng hết quá hạn. Vi phạm NFR-CMP-02, và đúng loại lỗi mà CR-002/CR-003 đã bắt ở Slice 04 |
| **C** | Giữ cả hai, cột là đệm, thêm test đối chiếu | Có kiểm tra chéo | Thêm một cái đệm nữa phải canh mà không được lợi gì so với A |

**Đề xuất: A.** B vi phạm bất biến lịch sử — cùng loại lỗi dự án đã tốn hai phiếu CR để sửa.

---

## Câu 3 — Vế "gửi thông báo" của FR-INV-08 làm tới đâu trong Slice 05?

**Ảnh hưởng:** phạm vi slice, ma trận truy vết, có thể phải tạo bảng thông báo sớm.

**Vì sao mơ hồ.** FR-INV-08 viết: *"phát hành hoá đơn hàng loạt **và gửi thông báo tới người thuê**"*. Sơ đồ tuần tự có hẳn `ThongBaoService` và tham chiếu FR-NTF-05 (huỷ các nhắc còn lại). Nhưng toàn bộ FR-NTF thuộc **Slice 08**.

| P.án | Nội dung | Được | Mất |
|---|---|---|---|
| **A** | Slice 05 **không** làm thông báo. Chỉ đóng vế "phát hành hàng loạt". Vế thông báo ghi rõ là của Slice 08 | Ranh giới sạch, không mã chết. Slice 08 tự do thiết kế lược đồ thông báo | FR-INV-08 bị đóng ở **hai slice** → ma trận truy vết phải ghi rõ, nếu không người đọc thấy "đã đóng" mà thực tế mới nửa vời |
| **B** | Slice 05 ghi bản ghi thông báo vào bảng của Slice 08, chưa có giao diện đọc | FR-INV-08 đóng trọn trong một slice | Slice 05 phải **đặt lược đồ bảng thông báo** rồi Slice 08 phải nhận lược đồ do slice khác định nghĩa. Ghi vào bảng chưa ai đọc là mã chết cho tới Slice 08 |
| **C** | Kéo phần thông báo trong ứng dụng của Slice 08 lên làm luôn ở Slice 05 | Đóng trọn cả FR-INV-08 lẫn FR-NTF-05 | Phình Slice 05 — vốn đã là slice nặng thứ hai sau Slice 04. Và rủi ro R-11 của kế hoạch nói Slice 8–10 là **chỗ cắt an toàn khi thiếu thời gian**; kéo Slice 8 lên là tự bỏ mất chỗ cắt đó |

**Đề xuất: A**, kèm điều kiện bắt buộc: ma trận truy vết ghi rõ FR-INV-08 đóng ở hai slice, để không ai đọc nhầm là xong.

---

## Câu 4 — Ai được lập bút toán đối ứng?

**Ảnh hưởng:** phân quyền, test 403, câu chuyện khi bảo vệ.

**Vì sao mơ hồ.** BR-08 nói rõ **chỉ Chủ sở hữu** mới được huỷ hoá đơn đã phát hành, bắt buộc lý do, ghi nhật ký. CR-010 và FR-INV-14 **không nói gì** về quyền lập bút toán đối ứng — trong khi thao tác đó sửa được số tiền đã thu, rủi ro ngang với huỷ hoá đơn. Bỏ trống thì mặc định rơi vào Quản lý toà.

| P.án | Nội dung | Được | Mất |
|---|---|---|---|
| **A** | Chỉ **Chủ sở hữu**, bắt buộc lý do, ghi nhật ký — y hệt huỷ hoá đơn ở BR-08 | Nhất quán với BR-08: thao tác sửa tiền đã ghi thì cần quyền cao nhất. Có phân tách trách nhiệm: người ghi nhận thanh toán không phải người sửa được nó | Chủ sở hữu là vai trò đăng nhập thưa nhất → lỗi ghi nhầm phải chờ, có thể vài ngày |
| **B** | **Quản lý toà** lập được, Chủ sở hữu thấy trên nhật ký | Sửa nhanh, đúng người phát hiện ra lỗi | Quản lý vừa là người ghi nhận thanh toán vừa là người sửa được số tiền đã ghi → **không có phân tách trách nhiệm** ở đúng chỗ tiền mặt đi qua |
| **C** | Quản lý lập được trong N giờ kể từ bút toán gốc; quá hạn thì phải Chủ sở hữu | Cân bằng: sửa lỗi gõ nhầm thì nhanh, sửa lịch sử cũ thì cần quyền cao | Thêm một tham số thời gian phải cấu hình và test biên. Và khó giải thích cho người dùng vì sao *"hôm qua sửa được, hôm nay không"* |

**Đề xuất: A.** Tiêu chí hoàn thành của Slice 05 trong kế hoạch có sẵn câu *"thử xoá bản ghi thanh toán thì bị cấm, chỉ lập được bút toán đối ứng có lý do"* — A cho ra câu chuyện rõ nhất khi demo và khớp sẵn khuôn BR-08 đã cài. C hấp dẫn về nghiệp vụ nhưng thêm độ phức tạp không có yêu cầu nào đòi.

---

## Câu 5 — Quyết toán cọc ra số âm thì khoản phải thu bổ sung nằm ở đâu?

**Ảnh hưởng:** migration — có thể phải nới ràng buộc trên `HOA_DON`.

**Vì sao mơ hồ.** BR-07 viết: *"Nếu kết quả âm, hệ thống tạo một **khoản phải thu bổ sung** thay vì hoàn tiền."* Không nói khoản đó lưu ở đâu.

Lưu ý một cái bẫy: BR-07 tính `Tiền cọc đã thu − Công nợ còn lại − Khấu trừ hư hỏng`, mà "công nợ còn lại" **đã bao gồm hoá đơn kỳ cuối**. Nên khoản bổ sung này phát sinh **sau** khi hoá đơn kỳ cuối đã phát hành — không nhét ngược vào đó được, sẽ thành vòng lặp.

| P.án | Nội dung | Được | Mất |
|---|---|---|---|
| **A** | Ghi thành `KHOAN_PHAT_SINH` với `nguon_loai = THANH_LY`, `trang_thai = CHO_TINH` | Bảng đã có sẵn (CR-008), cơ chế "chờ tính → vào hoá đơn đúng một lần" đã cài và đã test ở Slice 04. Không cần migration mới | Hợp đồng đang thanh lý thì **không còn kỳ sau** để hoá đơn nào cuốn nó vào → khoản `CHO_TINH` nằm mãi, không ai đòi được. Đây là vòng lặp nói ở trên |
| **B** | Tạo một **hoá đơn quyết toán** riêng cho khoản phải thu bổ sung | Có chứng từ độc lập với mã hoá đơn. Thu tiền qua đúng luồng `THANH_TOAN` đã dựng, có hạn thanh toán, có trạng thái BR-08, vào được báo cáo công nợ — tất cả **miễn phí** vì máy móc đã có | Cần migration nới ràng buộc: `HOA_DON.ky_id` đang `NOT NULL`, và `uq_hoa_don_hop_dong_ky` sẽ cản nếu hợp đồng đã có hoá đơn ở kỳ đó |
| **C** | Ghi một dòng `GIAO_DICH_COC` loại `KHAU_TRU_COC` mang số âm, để công nợ nằm trên hợp đồng | Gọn nhất, không đụng `HOA_DON` | Khoản phải thu nằm **ngoài** luồng hoá đơn → không có hạn thanh toán, không nhắc nợ được, không vào báo cáo công nợ. Trái với chính chữ "khoản phải thu" trong BR-07 |

**Đề xuất: B**, và chấp nhận trả giá bằng một migration. Lý do: khoản này **là một khoản phải thu thật**, cần đòi được, cần theo dõi được. A nghe rẻ nhưng tạo ra khoản tiền không ai đòi; C tạo ra khoản tiền không ai thấy.

---

## Câu 6 — Có cho huỷ hoá đơn đang ở trạng thái Quá hạn không?

**Ảnh hưởng:** máy trạng thái, báo cáo công nợ.

**Vì sao mơ hồ.** Sơ đồ BR-08 vẽ mũi tên huỷ **từ "Đã phát hành"**. Đã xác minh: `huy(QUA_HAN, true, "…")` **ném lỗi**. Nhưng sơ đồ cũng vẽ *Quá hạn* là một nhánh đi ra từ *Đã phát hành* — nên không rõ sơ đồ đang **cấm**, hay chỉ là **không vẽ hết**.

| P.án | Nội dung | Được | Mất |
|---|---|---|---|
| **A** | Không cho. Giữ đúng nét vẽ của sơ đồ | Không phải đụng gì | Hoá đơn phát hành nhầm thường bị phát hiện **sau** khi đã quá hạn — người thuê chỉ khiếu nại khi bị nhắc nợ. Lúc đó không huỷ được, đành để nó quá hạn vĩnh viễn làm bẩn báo cáo công nợ |
| **B** | Cho, cùng điều kiện như huỷ hoá đơn đã phát hành: Chủ sở hữu + lý do + nhật ký | Giải quyết đúng ca thực tế. Và vì *Quá hạn* vốn là nhánh của *Đã phát hành* theo chính sơ đồ đó, B **không mâu thuẫn** sơ đồ — chỉ bổ sung nét sơ đồ chưa vẽ | Cần ghi một dòng vào spec nói rõ đây là diễn giải, để người đọc báo cáo không tưởng là làm sai sơ đồ |
| **C** | Cho cả từ `QUA_HAN` lẫn `DA_THU_MOT_PHAN` | Đầy đủ nhất | Huỷ hoá đơn **đã thu một phần** thì phần tiền đã thu đi đâu? Phải chuyển thành số dư khả dụng → kéo thêm một nhánh nghiệp vụ vào slice vốn đã nặng |

**Đề xuất: B.**

---

## Tóm tắt đề xuất

| Câu | Vấn đề | Đề xuất |
|---|---|---|
| 1 | Bút toán đối ứng trên hoá đơn đã thanh toán | **B** — cho lùi, lập CR sửa BR-08 |
| 2 | Nguồn của `han_thanh_toan` | **A** — cột đã lưu là nguồn duy nhất |
| 3 | Thông báo trong FR-INV-08 | **A** — đẩy sang Slice 08, ghi rõ ma trận truy vết |
| 4 | Quyền lập bút toán đối ứng | **A** — chỉ Chủ sở hữu |
| 5 | Khoản phải thu sau quyết toán cọc | **B** — hoá đơn quyết toán riêng |
| 6 | Huỷ hoá đơn quá hạn | **B** — cho, cùng điều kiện huỷ thường |

Nếu chốt đúng bộ đề xuất này thì phát sinh **hai việc tài liệu**: một CR sửa BR-08 (câu 1) và một ghi chú diễn giải sơ đồ BR-08 (câu 6); cùng **một migration nới ràng buộc** trên `HOA_DON` (câu 5).

---

## Chốt

**Ngày chốt:** 01/09/2026 · **Người quyết định:** chủ nhiệm đồ án

| Câu | Chốt | Ghi chú |
|---|---|---|
| 1 | **B** | Cho lùi `DA_THANH_TOAN → DA_THU_MOT_PHAN`/`QUA_HAN` khi nguyên nhân là bút toán đối ứng. Phải lập CR sửa BR-08 |
| 2 | **A** | `HOA_DON.han_thanh_toan` là nguồn sự thật duy nhất. Sửa `TinhHoaDonRepository.java:281` đọc cột thay vì tính lại từ kỳ |
| 3 | **A** | Slice 05 không làm thông báo. Ma trận truy vết phải ghi FR-INV-08 đóng ở hai slice |
| 4 | **C** | *(khác đề xuất)* Quản lý lập được bút toán đối ứng trong N giờ kể từ bút toán gốc; quá N giờ thì phải Chủ sở hữu |
| 5 | **B** | Hoá đơn quyết toán riêng. Cần migration nới `HOA_DON.ky_id` và `uq_hoa_don_hop_dong_ky` |
| 6 | **B** | Cho huỷ hoá đơn `QUA_HAN`, cùng điều kiện huỷ thường: Chủ sở hữu + lý do + nhật ký |

### Việc phát sinh từ bộ chốt này

| Việc | Từ câu | Loại |
|---|---|---|
| CR sửa BR-08 cho phép lùi trạng thái khi có bút toán đối ứng | 1 | Tài liệu |
| Ghi chú diễn giải sơ đồ BR-08: *Quá hạn* là nhánh của *Đã phát hành* nên huỷ được | 6 | Tài liệu |
| Migration nới ràng buộc `HOA_DON` cho hoá đơn quyết toán | 5 | Lược đồ |
| **Chốt giá trị N và nơi cấu hình** | 4 | **Còn treo — xem dưới** |

### Câu 4 phương án C — hai thứ còn phải quyết

Chọn C thay vì A kéo theo hai câu hỏi mà A không có:

**a) N bằng bao nhiêu, và cấu hình ở đâu?** Ba khả năng, theo thứ tự công sức tăng dần:

- **Hằng số trong mã** — đơn giản nhất, đủ cho đồ án, nhưng đổi phải sửa mã và triển khai lại.
- **Cột trên `TOA_NHA`** — cùng chỗ với `so_ngay_han_tt` và `ngay_chot_so`, tức là nhất quán với cách dự án đã đặt các tham số theo toà. Tốn một migration.
- **Cấu hình cấp hệ thống** — dự án chưa có bảng cấu hình chung nào; dựng riêng cho một tham số là quá tay.

Đề xuất: **hằng số trong mã, giá trị 24 giờ.** Lý do: nó là tham số **an toàn**, không phải tham số **nghiệp vụ theo toà** — không có lý do gì để toà A cho sửa trong 24 giờ còn toà B 48 giờ. Đặt lên `TOA_NHA` là mời người dùng chỉnh một thứ họ không có cơ sở để chỉnh. 24 giờ phủ được ca thực tế "ghi nhầm hôm nay, sáng mai phát hiện".

**b) N đếm từ mốc nào?** Phải nói rõ trong spec, vì hai mốc cho kết quả khác nhau:

- từ `THANH_TOAN.ngay_thu` của bút toán gốc — là **ngày thu tiền**, do người dùng nhập, có thể lùi về quá khứ;
- từ thời điểm **ghi bản ghi vào hệ thống**.

Đề xuất mốc thứ hai. Dùng `ngay_thu` thì một bút toán nhập ngày lùi 3 hôm sẽ **hết hạn sửa ngay khi vừa tạo**, và người dùng không hiểu vì sao. Nhưng bảng `THANH_TOAN` trong ERD **chưa có cột thời điểm tạo bản ghi** — nên chốt mốc này kéo theo phải thêm cột đó vào migration của Slice 05.

### Lưu ý về tương tác giữa câu 1 và câu 4

Hai chốt này giao nhau ở đúng chỗ rủi ro nhất: sau khi chốt 1B, bút toán đối ứng **kéo lùi được trạng thái của một hoá đơn đã thanh toán đủ**; sau khi chốt 4C, **Quản lý toà** làm được việc đó trong N giờ mà không cần Chủ sở hữu.

Đây không phải lý do để đổi chốt — nhưng spec phải bù lại bằng ba thứ, và ticket phải có test cho cả ba:

1. Bút toán đối ứng **luôn** ghi nhật ký kèm người thực hiện, dù ai lập.
2. Lý do là **bắt buộc**, không cho chuỗi rỗng — đây là thứ BR-18 đòi.
3. Sau khi hết N giờ, Quản lý nhận **403**, và thông báo nói rõ phải nhờ Chủ sở hữu — không phải một lỗi kỹ thuật khó hiểu (`NFR-USA-04`).
