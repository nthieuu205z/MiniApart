# 07: Trạng thái phòng tự cập nhật theo hợp đồng · FR-BLD-04 · CR-012

**What to build:** Ký hợp đồng thì phòng tự chuyển sang `DA_COC` rồi `DANG_THUE`; thanh lý thì tự về `TRONG`. Người dùng không sửa tay trạng thái phòng ở bất kỳ đâu.

**`PHONG.trang_thai` là giá trị đệm, không phải nguồn sự thật.** CR-012 nói rõ điều này. Nguồn sự thật là dữ liệu hợp đồng; cột `trang_thai` chỉ tồn tại để màn hình sơ đồ phòng hiện được hàng chục phòng cùng lúc mà không phải tính lại từng cái.

Giá trị đệm luôn có nguy cơ lệch khỏi nguồn sự thật. Vì thế CR-012 đòi thêm một thứ mà ticket này bắt buộc phải có: **kiểm thử đối chiếu giá trị đệm với giá trị tính lại từ dữ liệu gốc**.

**Blocked by:** 04, `slice-01 · 03` (sơ đồ phòng)

**Status:** done

- [x] Trạng thái phòng đổi theo hành động trên hợp đồng, không có endpoint nào cho phép đặt trực tiếp
- [x] Có một hàm **tính lại** trạng thái phòng từ dữ liệu hợp đồng tại một ngày cho trước
- [x] **Ca kiểm thử bắt buộc:** dựng một loạt tình huống hợp đồng, rồi khẳng định giá trị đệm trong cột **bằng đúng** giá trị hàm tính lại trả về. Đây là ca chứng minh CR-012 được xử lý đúng
- [x] Có một lệnh chạy tay để tính lại toàn bộ trạng thái phòng, dùng khi phát hiện lệch
- [x] Sơ đồ phòng ở Slice 1 hiện đúng trạng thái mới ngay sau khi ký hợp đồng
- [x] Tên test mang mã `FR-BLD-04` và `CR-012`

## Comments

- Added `Phong.tinhLaiTrangThai(LocalDate tai)` to keep the room-status rule in the domain model. For this slice it derives only from contract data: `HIEU_LUC` in-range gives `DANG_THUE`, `DA_COC` before `ngay_bat_dau` gives `DA_COC`, and all remaining cases fall back to `TRONG`.
- Kept `PHONG.trang_thai` system-owned. There is still no direct mutation endpoint; room cache writes now happen inside contract create/action flows and through one repair-style recompute command.
- Added `POST /api/toa-nha/{toaNhaId}/phong/tinh-lai-trang-thai` as the manual repair command. It is building-scoped, reuses the same room authorization gate, and returns `204 No Content`.
- The recompute path intentionally ignores repair requests because this slice does not yet include the repair workflow named in BR-11. When later slices add that source of truth, `Phong.tinhLaiTrangThai(...)` is the seam to extend.
- No Flyway migration was needed because the cache already existed in `PHONG.trang_thai`; this ticket only taught the backend how to maintain and repair it from contract data.
