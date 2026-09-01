# 03: Lịch sử 12 kỳ · FR-POR-03

**What to build:** Màn `#34` — danh sách tối thiểu 12 kỳ hoá đơn gần nhất, bấm một kỳ thì mở `#33` của kỳ đó.

**Blocked by:** 02

**Status:** ready-for-agent

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

- [ ] Hiện tối thiểu 12 kỳ gần nhất, mới nhất lên đầu
- [ ] **Ít hơn 12 kỳ → hiện đúng số có**, không lỗi, không dòng trống
- [ ] **Không kỳ nào → màn rỗng-lần-đầu** nói rõ vì sao, khác màn lỗi
- [ ] Bấm một kỳ → mở `#33` của đúng kỳ đó
- [ ] Nhiều hợp đồng → mỗi dòng cho biết **kỳ và phòng**
- [ ] Hợp đồng **đã thanh lý vẫn hiện** (ruling 3A)
- [ ] Mỗi dòng hiện tổng tiền và tình trạng thanh toán
- [ ] Chỉ hoá đơn của chính mình → ca tấn công kế thừa ticket 01
- [ ] Tên test mang mã `FR-POR-03`

## Comments
