# 03: Lịch sử 12 kỳ · FR-POR-03

**What to build:** Màn `#34` — danh sách tối thiểu 12 kỳ hoá đơn gần nhất, bấm một kỳ thì mở `#33` của kỳ đó.

**Blocked by:** 02

**Status:** done

## Yêu cầu

> `FR-POR-03` — *"cho phép người thuê tra cứu **tối thiểu 12 kỳ** hoá đơn gần nhất"* [M]

"Tối thiểu 12" là sàn, không phải trần. Cắt cứng đúng 12 là đọc sai yêu cầu — nhưng phân trang khi nhiều hơn thì hợp lý.

## Ca thường bị bỏ sót: ít hơn 12 kỳ

Hợp đồng mới ký hai tháng thì chỉ có 2 hoá đơn. Màn phải hiện **đúng 2**, bình thường, **không báo lỗi và không hiện 10 dòng trống**.

`Doc/UX/03-nguoi-thue.md` ghi rõ: *"Ít hơn 12 kỳ thì hiện đúng số có"*.

Và ca **không có kỳ nào** — người thuê vừa ký, chưa tới kỳ đầu — là màn **rỗng-lần-đầu**, phải nói rõ vì sao rỗng, khác hẳn màn lỗi (`00-nen-tang-ux.md` mục 5).

## Nhiều hợp đồng qua thời gian

Một người thuê có thể có **nhiều hợp đồng** — thuê, dọn đi, quay lại; hoặc đổi phòng trong cùng toà. `CR-001` nói rõ điều này khi giải thích vì sao tách `NGUOI_DUNG` và `NGUOI_THUE`:

> *"một người thuê có thể ký **nhiều hợp đồng** qua thời gian"*

Nên lịch sử là của **người thuê**, không phải của một hợp đồng. Và theo **ruling 3A**, hợp đồng đã thanh lý **vẫn hiện trong lịch sử**.

Hệ quả hiển thị: khi có nhiều hợp đồng, mỗi dòng phải cho biết **kỳ nào, phòng nào** — nếu không người thuê từng ở hai phòng sẽ không biết hoá đơn nào của phòng nào.

## Hoàn thành khi

- [x] Hiện tối thiểu 12 kỳ gần nhất, mới nhất lên đầu
- [x] **Ít hơn 12 kỳ → hiện đúng số có**, không lỗi, không dòng trống
- [x] **Không kỳ nào → màn rỗng-lần-đầu** nói rõ vì sao, khác màn lỗi
- [x] Bấm một kỳ → mở `#33` của đúng kỳ đó
- [x] Nhiều hợp đồng → mỗi dòng cho biết **kỳ và phòng**
- [x] Hợp đồng **đã thanh lý vẫn hiện** (ruling 3A)
- [x] Mỗi dòng hiện tổng tiền và tình trạng thanh toán
- [x] Chỉ hoá đơn của chính mình → ca tấn công kế thừa ticket 01
- [x] Tên test mang mã `FR-POR-03`

## Comments

- API `GET /api/cong/hoa-don` lấy phạm vi từ `nguoiThueId` trong token, giữ thứ tự kỳ mới nhất trước và bao phủ nhiều hợp đồng/phòng.
- Dùng `LEFT JOIN KY_THANH_TOAN` để hoá đơn quyết toán sau thanh lý (`ky_id IS NULL`) vẫn xuất hiện; các trường kỳ và ngày kỳ được trả `null`, frontend hiển thị `Quyết toán hợp đồng`.
- Trạng thái lịch sử dùng chung luật trạng thái hiệu lực với chi tiết hoá đơn, nên hoá đơn quá hạn và đã thu một phần không bị lệch nhãn.
- Không thêm migration. Bổ sung test FR-POR-03 cho 12+ kỳ, ít hơn 12 kỳ, trạng thái quá hạn, nhiều hợp đồng, thanh lý, quyết toán, mobile, empty state và phân quyền.
- Xác minh: targeted backend `CongNguoiThueAuthorizationIntegrationTest` 7/7; `ThanhLyHopDongIntegrationTest` 13/13 sau khi cố định `Clock` trong test; full backend 413/413; frontend 127/127; frontend build thành công.
