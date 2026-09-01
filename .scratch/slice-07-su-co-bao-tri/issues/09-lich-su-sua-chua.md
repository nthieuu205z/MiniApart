# 09: Lịch sử sửa chữa và tổng chi phí · FR-MNT-08

**What to build:** Màn tra cứu lịch sử sửa chữa và tổng chi phí bảo trì theo phòng, theo toà, theo hạng mục.

**Blocked by:** 06

**Status:** ready-for-agent

**Migration:** không cần — chỉ đọc.

## Ticket chỉ đọc

Không tạo, không sửa, không xoá. Nếu thấy cần thêm bảng hay thêm cột thì đang làm việc của ticket khác.

## Ranh giới với Slice 09 — dễ lẫn

| | Ở đây (`FR-MNT-08`) | Slice 09 (`FR-RPT-08`) |
|---|---|---|
| Bản chất | **Tra cứu vận hành** — quản lý mở khi cần biết phòng này đã sửa gì | **Báo cáo** — chủ sở hữu xem tổng hợp để ra quyết định |
| Phạm vi | Theo phòng, toà, hạng mục | Theo toà, hạng mục, **khoảng thời gian** |
| Xuất Excel | Không | Có (`FR-RPT-04`) |

Làm phần báo cáo ở đây là lấn Slice 09 và sẽ bị làm hai lần.

## `Doc/UX/04-tho-sua-chua.md` cấm màn này cho thợ

Danh sách bảy điều cấm có dòng:

> *"Lịch sử việc đã làm — chú Tuấn không tra cứu. Quản lý mới cần, và họ có `#48`."*

Nên màn này là **của quản lý và chủ**, không phải của thợ. Thợ gọi vào → **403**.

## Tiền: đọc kỹ quy ước 1

Tổng chi phí là phép cộng tiền. `BigDecimal`, không `double`. ArchUnit canh gói `billing`, nhưng **gói sửa chữa không nằm trong `..billing..`** — nên luật hiện tại **không soi tới đây**.

> **Việc phát sinh cần cân nhắc:** có nên mở rộng luật ArchUnit sang gói sửa chữa không? Đây là gói đầu tiên ngoài `billing` có phép cộng tiền. Ghi ý kiến vào `## Comments` để người duyệt quyết — **đừng tự sửa luật kiến trúc trong ticket này**.

## Hoàn thành khi

- [ ] Tra được lịch sử theo **phòng**, theo **toà**, theo **hạng mục**
- [ ] Hiện tổng chi phí, tách rõ **phần chủ nhà chịu** và **phần người thuê chịu**
- [ ] Yêu cầu đã huỷ **không** tính vào tổng chi phí; hiện riêng hoặc lọc ra
- [ ] Tiền dùng `BigDecimal`, **không `double`** ở bất kỳ khâu nào kể cả định dạng
- [ ] Định dạng tiền dùng lại đường đã có (`NFR-USA-06`: `1.888.000 đ`), **không viết hàm thứ hai**
- [ ] Rỗng-lần-đầu và rỗng-do-lọc là **hai câu khác nhau** (`00-nen-tang-ux.md` mục 5)
- [ ] Bộ lọc nằm trong URL — chia sẻ được kết quả tra cứu
- [ ] Quản lý chỉ thấy toà được phân công; **Thợ → 403**; QTHT → 403
- [ ] **Không** làm phần báo cáo theo khoảng thời gian và **không** xuất Excel — đó là `FR-RPT-08`, Slice 09
- [ ] Tên test mang mã `FR-MNT-08`

## Comments
