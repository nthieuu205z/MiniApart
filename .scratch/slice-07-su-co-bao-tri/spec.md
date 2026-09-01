# Vertical Slice 7 — Sự cố và bảo trì

**Nguồn:** `Doc/PRJ1_Ke-hoach-trien-khai.md`, mục 6, Vertical Slice 7.
**Dải migration:** `V36`–`V45` — xem `.scratch/dai-so-hieu-migration.md`. Dự kiến dùng **2 tệp**: `V36` (`YEU_CAU_SUA_CHUA`), `V37` (`THONG_BAO`).

**Trạng thái spec:** ✅ **Đã duyệt 01/09/2026.** Ticket đã chẻ ở `issues/`, 9 ticket.
**Ruling nền:** `.scratch/quyet-dinh-truoc-slice-06-07/quyet-dinh-can-chot.md` — ba ruling chốt 01/09/2026. **Đọc trước tệp này.**

## Problem Statement

Người thuê phát hiện vòi nước rỉ thì hiện không có cách nào báo. Quản lý không có nơi ghi việc, thợ không có nơi nhận việc, và chi phí sửa chữa không có đường vào hoá đơn.

Đây cũng là slice làm cho **vai trò Thợ sửa chữa tồn tại**. Bốn vai trò kia đều đã có màn hình; `THO` hiện là một giá trị enum chưa dùng vào việc gì.

## Vì sao slice này chạy song song được với Slice 05

Đã soát phụ thuộc dữ liệu: **không chạm bảng nào Slice 05 tạo** (`THANH_TOAN`, `SO_DU_KHA_DUNG`, `GIAO_DICH_COC`). Ba bằng chứng:

1. **`KHOAN_PHAT_SINH` đã có từ Slice 04** (`V23__pending_invoice_extras.sql`), kèm `trang_thai` `CHO_TINH`/`DA_TINH`, `nguon_loai`, `nguon_id`. Tiêu chí *"chi phí do người thuê chịu tự vào hoá đơn kỳ sau đúng một lần"* dùng máy móc Slice 04, **không** phải Slice 05.
2. **`ANH_DINH_KEM` đã dành sẵn chỗ.** `V10__attachment_images.sql:3` có `CHECK (doi_tuong_loai IN ('NGUOI_THUE', 'CHI_SO_DICH_VU', 'YEU_CAU_SUA_CHUA'))` — Slice 02 đã chừa giá trị thứ ba. `FR-MNT-01` (tối đa 5 ảnh) có sẵn nơi lưu và sẵn cơ chế liên kết ký 15 phút, không phải dựng lại.
3. Bảng `YEU_CAU_SUA_CHUA` **chưa tồn tại** — cần migration mới, nhưng nằm gọn trong dải `V36`+.

## Đóng những yêu cầu nào

FR-MNT-01 [M], FR-MNT-02 [M], FR-MNT-03 [M], FR-MNT-04 [M], FR-MNT-05 [S], FR-MNT-06 [S], FR-MNT-07 [C], FR-MNT-08 [S]

**Đóng trọn cả tám**, kể cả vế thông báo của `FR-MNT-02`/`04` — ruling 1B. Cộng thêm phần nối để `FR-INV-08` của Slice 05 đóng trọn.

**Áp phiếu thay đổi:** CR-008 — khoản phát sinh nối sang hoá đơn.

**Quy tắc nghiệp vụ:** BR-16 (vòng đời), BR-17 (ảnh và phạm vi toà), BR-11 (trạng thái phòng *Đang sửa chữa*)

> **BR-11 được bổ sung.** Kế hoạch mục 6 không liệt kê, nhưng BR-11 định nghĩa trạng thái phòng *Đang sửa chữa* là *"có yêu cầu sửa chữa mức Khẩn cấp đang mở **và** quản lý đánh dấu ngừng cho thuê"*. Trước slice này, nhánh đó của BR-11 **không thể xảy ra** vì chưa có yêu cầu sửa chữa nào. Slice này làm nó khả thi lần đầu, nên phải kiểm cả giá trị đệm `PHONG.trang_thai` theo CR-012.

## BR-16 — vòng đời

```
Mới tiếp nhận → Đã tiếp nhận → Đã phân công → Đang xử lý → Chờ xác nhận → Đã đóng
      |                                                          |
      +--- Đã huỷ (từ bất kỳ trạng thái nào trước Đã đóng, kèm lý do) ---+
```

**Dùng lại khuôn `QuyTacTrangThaiHoaDon`, đừng phát minh cách mới.** Slice 04 đã dựng một máy trạng thái thuần trong `billing/calc` với bảng chuyển hợp lệ và ném lỗi khi chuyển sai. BR-16 có hình dạng y hệt BR-08.

**Bài học bắt buộc đọc từ Slice 05.** Máy trạng thái BR-08 lọt ba đường đi hỏng vì bảng chuyển thiếu cạnh, và chỉ có **một** test cho đường thanh toán. Slice này phải test **mọi cạnh hợp lệ và một mẫu cạnh không hợp lệ**, không phải vài cạnh tiêu biểu.

Chú ý cạnh huỷ: *"từ **bất kỳ** trạng thái nào trước Đã đóng"* — năm trạng thái nguồn, không phải một.

## Thông báo: thuộc slice này — ruling 1B

`FR-MNT-02` viết *"sinh mã yêu cầu **và thông báo tới quản lý** toà nhà tương ứng"*; `FR-MNT-04` viết *"phân công cho thợ **và gửi thông báo** cho người được phân công"*. Cả hai là **Must have**.

Tiền lệ ruling 3 ở Slice 05 đã đẩy vế thông báo của `FR-INV-08` sang Slice 08. **Ruling 1B không áp lại cách đó**, vì một rủi ro lộ ra khi có tới ba FR cùng bị đóng nửa vời:

Ba FR đó — `FR-INV-08`, `FR-MNT-02`, `FR-MNT-04` — **đều là Must have**, trong khi Slice 08 **toàn Should have** và kế hoạch mục 9 (rủi ro **R-11**) chỉ định thẳng Slice 8–10 là chỗ cắt an toàn:

> *"Vertical Slice 8–10 cắt được mà không ảnh hưởng luồng chính"*

Cắt Slice 08 thì ba Must have hở vĩnh viễn — không còn là "cắt an toàn".

**Chốt:** slice này dựng **thông báo tối thiểu trong ứng dụng** — bảng `THONG_BAO` và màn `#44`. Slice 08 sau đó mở rộng (thông báo chung theo phạm vi, nhắc thanh toán, cấu hình mốc theo toà).

Phạm vi tối thiểu, đúng nghĩa tối thiểu: sinh thông báo, đọc thông báo, đánh dấu đã đọc. **Không** soạn thông báo chung, **không** nhắc theo lịch, **không** cấu hình mốc — ba thứ đó là `FR-NTF-02`/`04`/`06`, vẫn thuộc Slice 08.

`#44` vốn là màn **dùng chung năm vai trò** (`Doc/UX/00-nen-tang-ux.md` mục 4.4), nên dựng ở đây không phí — Slice 08 và các slice sau đều dùng lại.

### Hệ quả: `FR-INV-08` của Slice 05

Lập luận trên áp y nguyên cho `FR-INV-08`. Nhưng **ticket Slice 05 không mở lại** — chúng đã chốt và vế thông báo đã ghi rõ ngoài phạm vi ở đó.

Thay vào đó, ticket `05` cuối cùng của slice này mang thêm **một việc nối**: sau khi `THONG_BAO` tồn tại, phát hành hoá đơn hàng loạt sinh thông báo cho người thuê, đóng trọn `FR-INV-08` **không phụ thuộc Slice 08**.

## FR-MNT-07 — tự đóng sau 72 giờ, suy ra khi đọc (ruling 2B)

`BR-16` viết: *"Tự động chuyển từ Chờ xác nhận sang Đã đóng sau 72 giờ không phản hồi."* Không nói làm bằng cách nào.

**Chốt: suy ra khi đọc, không ghi, không tác vụ nền.** Quá 72 giờ ở *Chờ xác nhận* thì hệ thống coi như *Đã đóng*.

Lý do là ghi chú **CR-012** trong `BR-14`, từ chối đúng mẫu hình tác vụ nền:

> *"hệ thống sẽ cần một tác vụ chạy hằng ngày quét lại toàn bộ hợp đồng, và **tác vụ đó lỗi một hôm thì dữ liệu sai mà không ai biết**."*

Dự án hiện **không có hạ tầng chạy theo lịch ở đâu cả**. Dựng cái đầu tiên cho một yêu cầu mức Could have là đánh đổi tồi.

**Điểm yếu phải bù.** Suy ra khi đọc nghĩa là mọi truy vấn trạng thái đều phải nhớ áp luật 72 giờ — quên một chỗ là lệch. Cách chống: **đặt luật vào đúng một chỗ** trong tầng thuần, cùng khuôn `QuyTacTrangThaiHoaDon`. Tuyệt đối không rải `INTERVAL '72 hours'` ra từng câu SQL.

Test bằng **đồng hồ đẩy được** — khuôn `MutableClock` đã có sẵn ở bốn bộ test tích hợp, dùng lại.

## Vai trò Thợ — đọc UX trước khi thiết kế

`Doc/UX/04-tho-sua-chua.md` đặc tả phân hệ này là **đúng một màn hình** (`#40`), và nói rõ đó là quyết định có chủ ý. Tài liệu có sẵn một danh sách **bảy thứ cấm thêm** (màn thứ hai, menu, lịch sử, thống kê năng suất, chat, bắt buộc chụp ảnh sau sửa, đánh giá sao).

Kỳ vọng gốc từ khảo sát, nguyên văn: *"không cần chức năng gì phức tạp hơn"*.

Ba hành động, không có hành động thứ tư: mở app thấy việc · bấm số điện thoại là gọi · bấm *"Đã sửa xong"*.

## Phân quyền

Mặc định từ chối. Sau CR-016, QTHT nhận 403 ở mọi endpoint nghiệp vụ của slice này.

| Thao tác | Ai |
|---|---|
| Tạo yêu cầu sửa chữa kèm ảnh | Người thuê (phòng mình), Quản lý, Chủ |
| Tiếp nhận, phân công cho thợ | Quản lý toà được phân công, Chủ |
| Đánh dấu *Đang xử lý*, *Đã sửa xong* | **Thợ được phân công** — và chỉ việc của mình |
| Ghi chi phí và bên chịu chi phí | Quản lý, Chủ |
| Xác nhận đóng yêu cầu | Người thuê tạo ra nó, hoặc Quản lý |
| Huỷ kèm lý do | Quản lý, Chủ |

**Chỗ mới cần cẩn thận:** đây là lần đầu vai trò `THO` truy cập dữ liệu. Thợ **không** thuộc `PHAN_QUYEN_TOA` — phạm vi của thợ là **danh sách việc được phân công**, không phải toà nhà. `layToaNhaNeuNhanVienDuocXem` hiện chỉ nhận `CHU` và `QUAN_LY`, nên thợ cần đường kiểm quyền riêng. Ticket phải nêu rõ điều này, nếu không sẽ có người gán bừa thợ vào `PHAN_QUYEN_TOA`.

## CR-008 — chống tính lặp, đã có tiền lệ

CR-008 tồn tại vì một lỗi có hậu quả tiền bạc:

> *"quy trình tạo hoá đơn sẽ quét lại các yêu cầu sửa chữa mỗi kỳ và tính lại cùng một khoản chi phí, khiến người thuê **bị thu tiền lặp mỗi tháng** cho một lần sửa chữa duy nhất."*

Slice 04 đã cài `trang_thai` `CHO_TINH`/`DA_TINH` và **đã có test** chứng minh chạy hai kỳ liên tiếp không tính lặp. Slice này chỉ **nối nguồn**: khi ghi chi phí với bên chịu là người thuê thì sinh một `KHOAN_PHAT_SINH` với `nguon_loai = SUA_CHUA` và `nguon_id` trỏ về yêu cầu.

CR-008 cũng ghi rõ đánh đổi phải giữ:

> *"ràng buộc khoá ngoại không kiểm được ở tầng cơ sở dữ liệu, nên **phải kiểm ở tầng ứng dụng và phải có kiểm thử riêng cho việc này**."*

## Hoàn thành khi

Tiêu chí kế hoạch, cộng bốn tiêu chí sinh ra từ soát phụ thuộc:

1. Người thuê gửi yêu cầu kèm ảnh; ảnh đi qua liên kết ký 15 phút như `BR-17`
2. Quản lý phân công cho thợ; thợ thấy việc của mình ở `#40`
3. Ghi chi phí và bên chịu chi phí
4. **Chi phí do người thuê chịu tự vào hoá đơn kỳ sau đúng một lần** — chạy tạo hoá đơn hai kỳ liên tiếp để chứng minh
5. **Mọi cạnh hợp lệ của BR-16 có test**, kể cả năm cạnh huỷ; cạnh không hợp lệ ném lỗi
6. **Thợ chỉ thấy và chỉ thao tác được việc được phân công cho mình** — gọi API việc của thợ khác nhận 403
7. **`PHONG.trang_thai` chuyển *Đang sửa chữa* đúng BR-11**, và giá trị đệm khớp giá trị tính lại (CR-012)
8. QTHT nhận 403 ở mọi endpoint
9. **Thông báo tới quản lý khi có yêu cầu mới, tới thợ khi được phân công** — ruling 1B
10. **Tự đóng sau 72 giờ suy ra đúng**, kiểm bằng đồng hồ đẩy được; luật nằm ở đúng một chỗ
11. **Phát hành hoá đơn hàng loạt sinh thông báo cho người thuê** — `FR-INV-08` đóng trọn

## Bảng ticket

| # | Ticket | Blocked by | Migration |
|---|---|---|---|
| 01 | Máy trạng thái yêu cầu sửa chữa | — | |
| 02 | Bảng `YEU_CAU_SUA_CHUA` và tạo yêu cầu kèm ảnh | 01 | `V36` |
| 03 | Tiếp nhận và phân công cho thợ | 02 | |
| 04 | Màn `#40` "Việc của tôi" | 03 | |
| 05 | Thông báo tối thiểu và hộp thông báo `#44` | 03 | `V37` |
| 06 | Ghi chi phí và nối sang hoá đơn | 02 | |
| 07 | Trạng thái phòng *Đang sửa chữa* | 02 | |
| 08 | Tự đóng sau 72 giờ | 01, 03 | |
| 09 | Lịch sử sửa chữa và tổng chi phí | 06 | |

Độ phủ đã soát: **15/15** mã FR/CR/BR trong phạm vi đều có ticket.

**Chỉ hai ticket có migration** — `V36` tạo `YEU_CAU_SUA_CHUA` **đầy đủ ngay**, gồm cả cột phân công (ticket 03) và cột chi phí (ticket 06) dù hai ticket đó chưa dùng tới. Lý do: Flyway không cho sửa tệp đã chạy, nên ba migration cho một bảng là ba lần `ALTER TABLE` trên bảng có thể đã có dữ liệu, cộng ba cơ hội va số hiệu.

Ticket 04, 06, 07 **không chặn nhau** — chạy song song được sau khi 02 và 03 xong.

## Không thuộc phạm vi

- **Thông báo chung theo phạm vi toà/tầng/phòng** (`FR-NTF-02`), **nhắc theo lịch** (`FR-NTF-04`), **cấu hình mốc theo toà** (`FR-NTF-06`) — Slice 08
- **FR-SEC-04** (tự tạo yêu cầu Khẩn cấp khi kiểm tra an toàn không đạt) — mức Could have, thuộc Slice 10
- **FR-RPT-08** (báo cáo chi phí bảo trì theo toà/hạng mục/thời gian) — Slice 9. Khác `FR-MNT-08` là lịch sử theo phòng
- Bất cứ thứ gì trong danh sách bảy điều cấm ở `Doc/UX/04-tho-sua-chua.md`
