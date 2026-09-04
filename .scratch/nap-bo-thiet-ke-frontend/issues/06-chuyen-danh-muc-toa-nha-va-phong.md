# 06: Chuyển danh mục toà nhà và phòng · FR-BLD-01 · FR-BLD-02 · NFR-USA-01

**What to build:** Viết lại `DanhMucToaNha.tsx` (394 dòng) và `DanhMucPhong.tsx` (588 dòng) bằng bộ component. Giữ nguyên hành vi.

**Blocked by:** 05

**Status:** done

## Việc đầu tiên: viết test, **trước khi** động vào giao diện

Cả hai màn này **không có test nào**. Đây là khác biệt lớn nhất so với ticket 04 — nó chạy an toàn vì `GhiChiSo.test.tsx` làm lưới.

Viết lại 982 dòng giao diện mà không có lưới là **làm mù**: hỏng một nhánh nhỏ cũng không ai biết cho tới lúc dùng thật.

**Thứ tự bắt buộc, đảo là mất phần lớn giá trị:**

1. Viết `DanhMucToaNha.test.tsx` và `DanhMucPhong.test.tsx` đặc tả **hành vi hiện tại**
2. Chạy xanh **trên mã cũ** — chứng minh test mô tả đúng thực tế, không mô tả điều mình tưởng
3. **Chỉ khi đó** mới viết lại giao diện
4. Test vẫn xanh, **không sửa**

Bước 2 là bước hay bị bỏ. Test viết sau khi đã sửa mã thì chỉ chứng minh mã làm điều mã làm.

## Hành vi tối thiểu test phải phủ

**`DanhMucToaNha`:** liệt kê toà theo phạm vi được phân công · tạo toà · sửa toà · lỗi trùng mã toà · lỗi ngày chốt số không hợp lệ · ngưỡng thất thoát giữ đúng phần thập phân.

**`DanhMucPhong`:** liệt kê phòng theo toà · lọc theo tầng · tạo một phòng · **xem trước tạo hàng loạt** · xác nhận tạo hàng loạt · trùng số phòng bị chặn ở bước xem trước · trạng thái phòng do hệ thống đặt, client gửi lên bị bỏ qua.

Xem trước hàng loạt là phần rủi ro nhất — `slice-01 · 03` dựng nó **không ghi gì cho tới khi xác nhận**. Làm hỏng tính chất đó là tạo phòng ngoài ý muốn.

## Component nên dùng

| Phần | Component |
|---|---|
| Nhóm phòng theo toà / tầng | `building/BuildingSection` — **chưa dùng ở đâu** |
| Ô phòng trong sơ đồ | `building/RoomCell` — đã dùng ở `#18` |
| Lọc theo tầng | `forms/FilterChip` — **chưa dùng ở đâu** |
| Xác nhận tạo hàng loạt | `feedback/ConfirmDialog` — **chưa dùng ở đâu** |
| Danh sách rỗng | `feedback/EmptyState` |
| Con số tổng quan | `shell/StatStrip` — **chưa dùng ở đâu** |

`ConfirmDialog` cần cẩn thận: `Doc/UX/00-nen-tang-ux.md` mục 8 quy định toàn hệ thống chỉ có **đúng năm** chỗ được dùng hộp thoại xác nhận, và mỗi chỗ phải nêu hậu quả bằng con số (`NFR-USA-05`). Tạo phòng hàng loạt là một trong năm — câu xác nhận phải nói rõ *sẽ tạo bao nhiêu phòng, từ số nào đến số nào*.

## Hai màn rỗng khác nhau

`EmptyState` phải phân biệt **rỗng-lần-đầu** và **rỗng-do-lọc** — hai câu khác nhau, không phải một câu có tham số:

- *"Toà này chưa có phòng nào."*
- *"Không có phòng nào ở tầng 3."*

Gộp lại thì người dùng không biết nên tạo mới hay nên bỏ lọc.

## Hoàn thành khi

- [x] `DanhMucToaNha.test.tsx` và `DanhMucPhong.test.tsx` tồn tại, **xanh trên mã cũ trước khi chuyển**
- [x] Test phủ đủ hành vi ở mục trên, gồm **xem trước hàng loạt không ghi gì cho tới khi xác nhận**
- [x] Hai màn dựng bằng component từ `src/design/`, không còn lớp CSS riêng
- [x] Rỗng-lần-đầu và rỗng-do-lọc là **hai câu khác nhau**
- [x] Xác nhận tạo hàng loạt **nêu hậu quả bằng con số** (`NFR-USA-05`)
- [x] Test vẫn xanh sau khi chuyển, **không sửa**
- [x] Chạy được ở 360 px và 1920 px, không cuộn ngang ở 360 px
- [x] `npm run build` và `npm test` xanh
- [x] Không mã màu ghi cứng trong hai tệp
- [x] **Không đổi hành vi, không đổi lời gọi API**

## Comments

- TDD baseline: hai file test mới được chạy trên mã cũ; lần RED ban đầu phát hiện fixture test sai định dạng API/form, sau khi sửa fixture, baseline GREEN đạt 7/7 trước migration.
- Files: chuyển `DanhMucToaNha` sang design-token inline styles và `Button`/`EmptyState`/`StatStrip`; bổ sung `BuildingSection`, `FilterChip`, `EmptyState`, `StatStrip`, `ConfirmDialog` cho danh mục phòng. Các class/data-testid cũ của floor map được giữ làm compatibility hooks cho App tests, không sửa test hay API.
- Batch: preview gọi endpoint xem trước, chỉ `ConfirmDialog` mới gọi endpoint tạo; dialog ghi số lượng và khoảng số phòng.
- Verification: `npm test -- src/App.test.tsx src/DanhMucToaNha.test.tsx src/DanhMucPhong.test.tsx` = 27/27; `npm test` = 65/65; `npm run build` thành công.
- Fix round 4/5: sau khi xoá CSS legacy, `DanhMucPhong.tsx` tự sở hữu toàn bộ layout/trình bày bằng inline styles dùng `var(--ma-...)`: root/header, bộ lọc, grid hai cột auto-fit, list/detail, panel/card, status grid, facts, form rows/actions/hint. `BuildingSection` dùng `minmax(0, 1fr)` và wrap tiêu đề để giữ layout ở 360px. Regression contract test kiểm tra các style contract này; focused 3 files = 29/29, full = 67/67, build xanh, browser shell không tràn ngang ở 360px và 1920px. Không sửa `styles.css`, API, payload hay trạng thái server.
