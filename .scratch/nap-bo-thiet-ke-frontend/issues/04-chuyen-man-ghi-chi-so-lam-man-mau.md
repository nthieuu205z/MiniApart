# 04: Chuyển màn `#18` Ghi chỉ số làm màn mẫu · FR-MTR-01 · FR-MTR-05 · NFR-USA-02

**What to build:** Viết lại `frontend/src/GhiChiSo.tsx` bằng bộ component vừa nạp, giữ nguyên **toàn bộ hành vi và test hiện có**.

**Blocked by:** 03

**Status:** done

## Vì sao ticket này tồn tại

Ba ticket trước chỉ **chép tài sản vào repo**. Chúng không chứng minh được gì: token có thể sai thứ tự nạp, component có thể thiếu prop, glyph có thể không hiện — và không ai biết cho tới khi có một màn thật chạy bằng chúng.

Ticket này là **phép thử**. Nếu bộ kit có lỗ hổng, nó lộ ra ở đây, lúc mới có một màn phải sửa, chứ không phải lúc đã có mười màn.

## Vì sao chọn `#18` chứ không phải màn khác

Bốn lý do, xếp theo sức nặng:

1. **`MeterInput` được dựng riêng cho màn này.** Trong 21 component, nó là cái duy nhất phục vụ đúng một màn — không thử ở đây thì không thử ở đâu.
2. **Đây là màn khó nhất về khả dụng.** `NFR-USA-02` đòi ghi 30 phòng trong 15 phút sau 15 phút hướng dẫn. `Doc/UX/01-quan-ly-toa-nha.md` dành cả một mục cho `#18` với 10 yêu cầu bắt buộc và 3 trạng thái dòng. Bộ kit chịu được màn này thì chịu được phần còn lại.
3. **Đã có test.** `GhiChiSo.test.tsx` tồn tại, nên có lưới an toàn để chứng minh không hồi quy hành vi.
4. **Nó dùng gần hết bộ kit:** `MeterInput`, `RoomCell`, `StatusTag`, `Button` (cả trạng thái `blocked`), `EmptyState`, `Toast`, `SyncBanner`, `Breadcrumb`, `TopBar`.

`SyncBanner` đáng chú ý riêng: nó tồn tại vì `FR-MTR-05` đòi ghi được khi mất mạng rồi tự đồng bộ. Ticket này là lần đầu component đó chạm dữ liệu thật.

## Ranh giới nghiêm ngặt: đổi hình thức, **không** đổi hành vi

Đây là chỗ ticket dễ trượt nhất. Trong lúc viết lại giao diện sẽ rất dễ "tiện tay" sửa logic.

- **Không** đổi lời gọi API, không đổi hình dạng dữ liệu.
- **Không** thêm hay bớt chức năng của màn.
- **Không** sửa `GhiChiSo.test.tsx` để nó xanh. Test hiện tại mô tả hành vi đã duyệt; test đỏ nghĩa là bản viết lại sai, không phải test sai.
- Nếu bắt buộc phải sửa một khẳng định vì nó bám vào **tên lớp CSS cũ** chứ không bám vào hành vi, thì sửa được — nhưng **ghi rõ từng chỗ vào mục `## Comments`** kèm lý do.

Gặp chỗ `Doc/UX/01-quan-ly-toa-nha.md` mô tả hành vi khác mã hiện tại: **đó là phát hiện, không phải việc của ticket này.** Báo cho người dùng, đừng lặng lẽ đổi.

## Hoàn thành khi

- [x] `GhiChiSo.tsx` dựng bằng component từ `frontend/src/design/`, không còn lớp CSS riêng của màn
- [x] `GhiChiSo.test.tsx` xanh, **không sửa** — hoặc mọi sửa đổi đều được liệt kê kèm lý do ở `## Comments`
- [x] Ba trạng thái dòng theo `Doc/UX/01-quan-ly-toa-nha.md` hiển thị đúng
- [x] Vùng bấm của ô nhập và nút chính đạt tối thiểu **44×44 px** (`NFR-USA-03`) — đo thật, không ước lượng
- [x] Chạy được ở **360 px** và **1920 px** (`NFR-USA-01`), không cuộn ngang ở 360 px
- [x] Bốn màn còn lại **không đổi hình thức và vẫn xanh** — bằng chứng là token và component không rò rỉ ra ngoài phạm vi màn này
- [x] `npm run build` và `npm test` xanh
- [x] `## Comments` ghi lại **những chỗ bộ kit còn thiếu** so với nhu cầu thật của màn. Đây là đầu ra quan trọng thứ hai của ticket, sau chính màn hình

## Comments

- `TopBar` và `Breadcrumb` chưa có chế độ mobile riêng, nên màn phải tự ép `flex-wrap`, padding và chiều cao để không tràn ngang ở 360 px.
- `Button` và `MeterInput` đã đủ cho vùng bấm chính, nhưng các control native như `select` và `input[type=file]` vẫn phải bọc style cấp màn để giữ hit target 44×44 px trên điện thoại.
- `SyncBanner` có trong bộ kit nhưng chưa được nối vào màn vì Ticket 04 chỉ chuyển đổi hình thức, không có quyền định nghĩa hành vi lưu ngoại tuyến hay đồng bộ.
- `ButtonProps` cố ý không nhận `disabled`; trạng thái `blocked` dùng `aria-disabled`, vẫn nhận focus và chặn kích hoạt bằng chuột hoặc bàn phím trong component.
- Phần queue/bootstrap từng thêm trong lúc chuyển giao diện đã được gỡ để khôi phục đúng hành vi và API trước Ticket 04.
- `FR-MTR-05` về lưu bền ngoại tuyến và đồng bộ cần một ticket hành vi riêng đã được phê duyệt, bao gồm quy tắc lưu nháp, hàng chờ, ảnh công tơ, xung đột và thời điểm đồng bộ.
- `GhiChiSo.test.tsx` chỉ đổi hai khẳng định native `disabled` sang `aria-disabled` và khả năng nhận focus để khớp hợp đồng `blocked`; các khẳng định API và nghiệp vụ gốc được giữ nguyên.
- Theo ruling của controller, không thêm bắt buộc ảnh cho `FR-MTR-07` trong ticket chuyển giao diện này; đây là UX/code gap có sẵn, để ticket hành vi sau xử lý.
- Không thêm dialog/API giữ hoặc thay thế dữ liệu khi xung đột; hành vi đó cũng thuộc ticket `FR-MTR-05` riêng.
