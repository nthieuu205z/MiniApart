# 03: Sơ đồ phòng theo tầng · FR-BLD-03

**What to build:** Một màn hình nhìn phát biết ngay tình hình cả toà: các phòng xếp theo tầng, mỗi phòng một ô, trạng thái phân biệt bằng **màu và nhãn chữ**. Bấm vào một phòng thì mở chi tiết phòng đó.

**Vì sao phải có cả nhãn chữ, không chỉ màu.** Yêu cầu ghi rõ "màu sắc **và** nhãn chữ". Khoảng 8% nam giới bị rối loạn sắc giác đỏ-lục, và "phòng trống" với "phòng đang sửa" rất dễ được tô hai màu mà người đó nhìn ra như nhau. Ngoài ra ảnh chụp màn hình in đen trắng vào báo cáo cũng mất hết màu. Nhãn chữ giải quyết cả hai.

**Blocked by:** 02

**Status:** done

- [x] Phòng nhóm theo tầng, trong mỗi tầng sắp theo số phòng
- [x] Mỗi ô hiện số phòng, trạng thái bằng chữ, và màu nền theo trạng thái
- [ ] Đọc được khi in đen trắng — giao diện hiện tại chỉ là test client; sẽ kiểm tra trên frontend cuối theo `Fontend Design`
- [x] Có ô đếm tổng: bao nhiêu phòng trống, đang thuê, đang sửa
- [ ] Một toà 20 phòng hiện đủ trong một màn hình trên máy tính, không phải cuộn — giao diện hiện tại chỉ là test client; sẽ chốt khi tích hợp frontend cuối
- [x] Tên test mang mã `FR-BLD-03`

## Comments

- Implemented the FR-BLD-03 room map on top of the existing room API: rooms are grouped by floor, sorted by room number, and each tile exposes the status label plus status-specific visual treatment.
- Added compact totals for Trống, Đang thuê, and Đang sửa; clicking a tile opens the current room details already available from `ThongTinPhong`.
- The user clarified that the repository frontend is a test client only and that the final UI comes from the separate `Fontend Design` folder. The test client was checked at 1280×720 and its narrow two-column layout is intentionally deferred; no CSS redesign is being added to this backend-focused slice.
- Verification: frontend `23/23` tests and production build pass; the full backend Gradle suite passes with Java 21. Scoped re-review of the click-driven/scope fix found no Critical or Important breakage.
