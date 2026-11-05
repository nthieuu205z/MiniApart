# Khung kế hoạch — Slice 08, 09, 10, 12

**Đây không phải spec.** Bốn slice dưới đây **chưa lên spec đầy đủ được**, và đó là quyết định có chủ ý chứ không phải làm dở.

## Vì sao dừng ở mức khung

Slice 08 và 09 đọc dữ liệu mà **Slice 05 chưa tạo ra**. Viết spec chi tiết bây giờ là viết dựa trên hình dạng `THANH_TOAN` chưa tồn tại — làm xong sẽ phải viết lại, đúng cái bẫy đã tránh được hồi Slice 04.

Slice 10 và 12 thì khác: chúng chạm **mọi bảng**, nên spec chỉ ổn định khi bảng đã đủ.

Tệp này ghi lại **những gì đã biết chắc** để không rơi mất, và **những gì phải quyết** khi tới lượt.

---

## Slice 08 — Thông báo và nhắc việc

**Dải migration:** `V46`–`V55` · **Phụ thuộc cứng:** Slice 05

**Đóng:** FR-NTF-01 [S], FR-NTF-02 [S], FR-NTF-04 [S], FR-NTF-05 [S], FR-NTF-07 [S] · **BR-14**

### Vì sao phải đợi 05

`FR-NTF-04` nhắc ở ba mốc *"trước hạn 3 ngày, quá hạn 1 ngày, quá hạn 5 ngày"*; `FR-NTF-05` *"huỷ các nhắc còn lại khi hoá đơn đã được thanh toán đủ"*. Cả hai đọc trạng thái thanh toán — thứ chỉ có sau ticket `05 · 02`.

### Nợ đã nhận từ hai slice khác

Slice này **thừa kế phần chưa làm** của hai FR thuộc slice khác:

| Nợ | Từ | Căn cứ |
|---|---|---|
| Vế *"gửi thông báo tới người thuê"* của `FR-INV-08` | Slice 05 | **Ruling 3** đã chốt |
| Vế *"thông báo tới quản lý"* của `FR-MNT-02` và *"gửi thông báo cho người được phân công"* của `FR-MNT-04` | Slice 07 | **Chưa có ruling** — spec Slice 07 đề nghị áp cùng ruling 3 |

Ba FR này hiện **đóng một nửa**. Ma trận truy vết phải phản ánh, nếu không người đọc báo cáo thấy "đã đóng" mà thực tế mới nửa vời.

### Ranh giới đã rõ

Chỉ làm thông báo **trong ứng dụng**, đúng như `FR-NTF-07` tự giới hạn. Kế hoạch nói thẳng: *"Không tích hợp email hay Zalo — ngoài phạm vi và thêm một điểm hỏng khi demo."*

`FR-NTF-03` (danh sách phòng đã xem) và `FR-NTF-06` (bật/tắt mốc nhắc theo toà) là **Could have**, không nằm trong danh sách kế hoạch giao cho slice này.

### Phải quyết khi tới lượt

- **Nhắc tự động cần tác vụ nền — dự án chưa có cái nào.** Cùng vấn đề với `FR-MNT-07` ở Slice 07. Nên quyết **một lần cho cả hai**, đừng để mỗi slice tự chọn một kiểu.
- `#44` Hộp thông báo dùng chung năm vai trò (`Doc/UX/00-nen-tang-ux.md` mục 4.4) — slice này sở hữu nó.

---

## Slice 09 — Báo cáo và thống kê

**Dải migration:** `V56`–`V60` (nhiều khả năng chỉ cần chỉ mục) · **Phụ thuộc cứng:** Slice 05, và `FR-RPT-08` cần Slice 07

**Đóng:** FR-RPT-01 [M], FR-RPT-02 [M], FR-RPT-03 [M], FR-RPT-04 [S], FR-RPT-05 [S], FR-RPT-08 [S]

### Vì sao phải đợi

`FR-RPT-01` đòi *"doanh thu phát hành, **đã thu**, công nợ"*. `FR-RPT-03` là *"báo cáo công nợ sắp xếp theo số ngày quá hạn giảm dần"*. Đọc thẳng `THANH_TOAN`.

`FR-RPT-08` (chi phí bảo trì theo toà/hạng mục/thời gian) cần Slice 07.

### Cái bẫy kế hoạch đã cảnh báo

> *"`FR-RPT-04` yêu cầu số liệu xuất ra Excel **khớp đúng** với số trên màn hình. Nghe hiển nhiên nhưng rất hay sai, vì màn hình thường làm tròn để hiển thị còn file xuất lấy số gốc. Cần một ca kiểm thử đối chiếu trực tiếp hai nguồn."*

Đây là **lần thứ ba** cùng một mẫu hình xuất hiện: đệm hiển thị lệch nguồn sự thật. Hai lần trước là `PHONG.trang_thai` (CR-012) và `HOA_DON.da_thu` (ticket `05 · 02`). Spec Slice 09 phải nhắc lại tiền lệ đó.

Ticket `05 · 07` (xuất PDF) cũng đã mang cùng ràng buộc — nên khi tới Slice 09, đường định dạng tiền **đã có sẵn hai người dùng**. Đừng viết cái thứ ba.

### Phải quyết khi tới lượt

- Thư viện xuất Excel — chưa có trong `build.gradle`, cùng vấn đề với PDF và QR ở Slice 05.
- `FR-RPT-01` là *"màn hình tổng quan tổng hợp **mọi toà**"* — nhưng Quản lý chỉ thấy toà được phân công. Cần chốt: Quản lý mở màn này thì thấy gì?

---

## Slice 10 — An toàn, tuân thủ và nhật ký

**Dải migration:** `V61`–`V70` · **Phụ thuộc:** nên làm **sau khi mọi bảng đã tồn tại**

**Đóng:** FR-SEC-01, 02, 03, 05, 06, 07 [S]; FR-AUT-03 [M], FR-AUT-07 [S], FR-TNT-06 [S], FR-TNT-11 [S]

### Vì sao xếp muộn dù không bị chặn

`FR-SEC-07` đòi nhật ký **chỉ đọc, không sửa được**, và kế hoạch chốt cách làm:

> *"Ép bằng quyền ở tầng cơ sở dữ liệu: tài khoản mà ứng dụng dùng chỉ được cấp quyền thêm dòng vào bảng nhật ký, không có quyền sửa hay xoá. Chặn ở tầng ứng dụng thôi thì chưa đủ mạnh để gọi là không sửa được, và đây là chỗ dễ bị hỏi vặn."*

Cấp quyền tầng CSDL chạm **mọi bảng**. Làm trước Slice 05 và 07 nghĩa là phải cấp lại quyền mỗi lần chúng đẻ bảng mới.

### Phần đã làm rồi, đừng làm lại

- `FR-AUT-07` (thu hồi quyền có hiệu lực trong 5 phút) — **đã cài từ Slice 00** theo ADR-0001, cơ chế phiên bản token. Slice này chỉ cần **kiểm chứng và ghi vào báo cáo**, không cài lại.
- `FR-SEC-05` (nhật ký thao tác nhạy cảm, lưu giá trị trước và sau) — bảng `NHAT_KY_THAO_TAC` đã có từ `V9`, và bốn dịch vụ đã ghi vào nó. Slice này **rà cho đủ**, không dựng mới.
- `#52` Nhật ký thao tác đã có đặc tả UX ở `Doc/UX/05-quan-tri-he-thong.md` mục 5, kèm ví dụ dòng đúng và dòng sai.

### Phần thật sự mới

`FR-SEC-01`, `02`, `03` là **hồ sơ và thiết bị PCCC** — một miền dữ liệu hoàn toàn mới, không dính gì tới hoá đơn hay hợp đồng. Đây mới là phần nặng của slice, không phải phần nhật ký.

`FR-TNT-06` (hợp đồng dạng PDF) dùng lại thư viện PDF của ticket `05 · 07`.

---

## Slice 12 — Còn thời gian thì làm

**Dải migration:** `V71`+

Kế hoạch đã xếp sẵn theo tỷ lệ giá trị trình bày trên công sức:

| Ưu tiên | Việc | Ghi chú của kế hoạch |
|---|---|---|
| 1 | `FR-RPT-06`, `FR-RPT-07` + **CR-007** — công tơ tổng và cảnh báo thất thoát (`BR-19`) | *"một trong năm điểm khác biệt đã tuyên bố"* — làm được thì luận điểm giá trị của đề tài đứng vững hơn |
| 2 | `FR-MTR-05` — giữ dữ liệu khi mất mạng | *"Ấn tượng khi demo, nhưng tốn công"* |
| 3 | `FR-BLD-09`, `FR-TNT-10` — tài sản trong phòng, đăng ký xe | *"Dễ, nhưng ít gây ấn tượng"* |
| 4 | `FR-INV-15` — đối soát sao kê | **Không khuyến nghị** |

**Một điều đáng cân nhắc sớm hơn thứ tự này gợi ý.** `TOA_NHA.nguong_that_thoat` đã tồn tại từ `V2` và `app.toa-nha.canh-bao-tieu-thu-nguong` đã có trong `application.yml`. Nghĩa là **một nửa hạ tầng của ưu tiên 1 đã nằm sẵn trong mã** từ Slice 00 — chỉ thiếu bảng `CHI_SO_TONG` (CR-007). Công sức thật có thể thấp hơn nhiều so với vẻ ngoài của một mục "còn thời gian thì làm".

`FR-MTR-05` thì ngược lại: `Doc/UX/00-nen-tang-ux.md` mục 7 đã đặc tả nó khá kỹ, nhưng chính tài liệu đó ghi chú rằng phần ngoại tuyến **suy ra từ yêu cầu và bối cảnh khảo sát**, không trích từ cơ sở dữ liệu UX nào. Độ chắc chắn thấp hơn phần còn lại.
