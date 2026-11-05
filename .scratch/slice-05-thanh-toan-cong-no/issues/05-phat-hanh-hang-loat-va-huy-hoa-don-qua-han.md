# 05: Phát hành hàng loạt và huỷ hoá đơn quá hạn · FR-INV-08 · BR-08 · ruling 6

**What to build:** Phát hành nhiều hoá đơn nháp trong một thao tác, và mở đường huỷ cho hoá đơn đang `QUA_HAN`.

**Blocked by:** 01

**Status:** done

## Hai việc, một ticket, vì cùng chạm vòng đời

Slice 04 làm được **tạo hàng loạt** hoá đơn nháp (`TaoHoaDonHangLoatService`). Chưa có **phát hành hàng loạt** — hiện `PhatHanhHoaDonService.phatHanh` chỉ nhận một `hoaDonId`. Với toà 24 phòng, quản lý phải bấm 24 lần.

Huỷ hoá đơn quá hạn gộp vào đây vì cùng là thao tác vòng đời do quản lý/chủ thực hiện trên hoá đơn đã phát hành, và cùng dùng lại `QuyTacTrangThaiHoaDon` ticket 01 vừa sửa.

## Ranh giới: FR-INV-08 chỉ đóng một nửa ở slice này — ruling 3

FR-INV-08 viết: *"phát hành hoá đơn hàng loạt **và gửi thông báo tới người thuê**"*.

**Vế thông báo không thuộc Slice 05.** Ruling 3 chốt đẩy sang Slice 08, vì toàn bộ `FR-NTF` ở đó, và vì kế hoạch mục 9 (rủi ro R-11) coi Slice 8–10 là **chỗ cắt an toàn khi thiếu thời gian** — kéo nó lên là tự bỏ mất chỗ cắt.

Hệ quả bắt buộc: **ma trận truy vết phải ghi FR-INV-08 đóng ở hai slice.** Nếu không, người đọc báo cáo thấy "đã đóng" mà thực tế mới nửa vời. Việc sửa ma trận thuộc tầng lập kế hoạch, không phải ticket này — nhưng ticket này phải nhắc trong `## Comments` rằng nó đã để lại nửa còn thiếu.

## Huỷ hoá đơn quá hạn — ruling 6

Sơ đồ BR-08 vẽ mũi tên huỷ **từ *Đã phát hành***, và `huy(QUA_HAN, …)` hiện **ném lỗi**.

Ruling 6 chốt là **cho huỷ**. Lập luận: sơ đồ cũng vẽ *Quá hạn* là nhánh đi ra từ chính *Đã phát hành*, nên đây là **bổ sung nét sơ đồ chưa vẽ**, không phải làm trái sơ đồ. Và ca thực tế rất thường gặp — hoá đơn phát hành nhầm chỉ bị phát hiện khi người thuê bị nhắc nợ, tức là sau khi đã quá hạn. Không huỷ được thì nó nằm đó vĩnh viễn làm bẩn báo cáo công nợ.

Điều kiện giữ nguyên như huỷ hoá đơn đã phát hành: **Chủ sở hữu**, lý do bắt buộc, ghi nhật ký.

## Phát hành hàng loạt: học lại bài của Slice 04

`slice-04 · 05` đã giải bài toán "hàng loạt có phần thất bại" cho việc **tạo** hoá đơn: phòng thiếu dữ liệu **bị bỏ qua có báo rõ**, không làm gián đoạn phần còn lại. Ticket này lặp lại đúng mẫu hình đó cho việc **phát hành** — đừng phát minh cách báo lỗi mới.

Hoá đơn không phát hành được (đã phát hành rồi, đã huỷ, tổng tiền bằng 0…) phải nằm trong báo cáo kết quả kèm lý do phân loại, giống `ThongTinLyDoBoQua`.

## Hoàn thành khi

- [x] Phát hành nhiều hoá đơn nháp của một kỳ trong **một thao tác**
- [x] Hoá đơn không phát hành được **bị bỏ qua có lý do phân loại**, không làm gián đoạn phần còn lại
- [x] Kết quả trả về đếm rõ: đã phát hành / đã ở trạng thái khác / bỏ qua kèm lý do
- [x] Chạy lần hai trên cùng kỳ **không** phát hành lại cái đã phát hành
- [x] Huỷ được hoá đơn đang `QUA_HAN`: **Chủ sở hữu**, lý do bắt buộc không rỗng, ghi `NHAT_KY_THAO_TAC`
- [x] Quản lý toà thử huỷ → **403**, kể cả đúng toà — BR-08 chỉ cho Chủ sở hữu
- [x] QTHT → 403 ở cả hai chức năng
- [x] Tên test mang mã `FR-INV-08` và `BR-08`
- [x] `## Comments` ghi rõ vế thông báo của FR-INV-08 **chưa làm**, thuộc Slice 08

## Comments

- `POST /api/toa-nha/{toaNhaId}/ky-thanh-toan/{kyId}/hoa-don/phat-hanh-hang-loat` reuses the Slice 04 bulk-summary shape: it publishes `NHAP` invoices, counts invoices already in another state, and returns `ThongTinLyDoBoQua`-style classified skips without interrupting the remaining invoices.
- Each publish is isolated in a new transaction so one invoice-level failure is reported as a skip rather than rolling back the period's other publications.
- `QUA_HAN` cancellation needs no separate authorization path: the existing issued-invoice owner/reason/audit flow applies after the lifecycle rule derives the overdue state from the stored due date.
- The tenant-notification half of **FR-INV-08 is intentionally deferred to Slice 08** under ruling 3; this ticket implements bulk publication only.
