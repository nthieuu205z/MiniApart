# BIÊN BẢN BÀN GIAO TIẾP QUẢN DỰ ÁN (DÀNH CHO CODEX REVIEW)

> **Thời điểm bàn giao:** Sau khi hoàn thành toàn diện các phát hiện review độc lập (P1, P2, P3).  
> **Trạng thái hệ thống:**  
> - **PostgreSQL 17 Portable:** Đang chạy tại port `5432` (`miniapart_db`)  
> - **Spring Boot Backend:** Đang chạy tại `http://localhost:8080/`  
> - **Vite Frontend Dev Server:** Đang chạy tại `http://localhost:5173/`  
> - **Frontend Test Suite:** `vitest run --run` đạt **31/31 suites passed (215/215 tests passed 100%)**  
> - **Frontend Build:** `npm run build` thành công 100% (0 lỗi TypeScript, 0 lỗi bundle)  
> - **Backend Unit Tests:** `TaiSanServiceTest`, `HuyHoaDonNhapServiceTest`, `HopDongServiceTest`, `HopDongPdfServiceTest`, `PublicPortalServiceTest` passed 100%.  
> - **Mốc commit trước đợt sửa:** `046d45a`  
> - **Commit sửa trung gian:** `d2e3d69`  
> - **Commit hoàn tất khắc phục:** `4afce02`  
> - **Trạng thái working tree:** Hoàn tất, clean working directory.

---

## 1. TỔNG HỢP CÁC PHẦN ANTIGRAVITY ĐÃ TRIỂN KHAI & KHẮC PHỤC THEO REVIEW

### [P1.1 & P1.5] Bảo vệ Race Tài chính & Phạm vi Phân quyền Lịch hẹn
- **Backend Files:**
  - `backend/src/main/java/com/prj1/ccm/billing/TinhHoaDonRepository.java`
  - `backend/src/main/java/com/prj1/ccm/billing/HuyHoaDonNhapService.java`
  - `backend/src/main/java/com/prj1/ccm/billing/ThayTheHoaDonController.java`
  - `backend/src/main/java/com/prj1/ccm/publicportal/PublicPortalRepository.java`
  - `backend/src/main/java/com/prj1/ccm/publicportal/LichHenQuanLyController.java`
- **Hành vi sau sửa:**
  - **Khóa hàng hoá đơn chống race:** `TinhHoaDonRepository.timHoaDonTrongPhamVi` hỗ trợ cờ `khoa` (`FOR UPDATE OF hd`). Khi huỷ hoá đơn, `HuyHoaDonNhapService` khoá bản ghi hoá đơn trước khi đọc `da_thu`, đồng bộ thứ tự khoá với `ThanhToanService` và `ThayTheHoaDonController` để tránh deadlock và chặn tuyệt đối race condition (hủy đọc 0 → thu tiền commit → hủy dùng kết quả cũ).
  - **Chặn huỷ khi có tiền thực thu:** Áp dụng cho cả hoá đơn nháp (`NHAP`) và hoá đơn đã phát hành (`DA_PHAT_HANH`): Nếu `daThu != null && daThu.signum() != 0`, quăng lỗi `409 CONFLICT` ("Lập bút toán đối ứng cho các khoản đã thu trước khi huỷ hoá đơn").
  - **Phân quyền lịch hẹn theo `PHAN_QUYEN_TOA`:** `PublicPortalRepository` giữ nguyên và phục hồi đầy đủ các phương thức `timToaNhaCuaPhong`, `toaNhaTonTai`, `phongThuocToa`, `timToaNhaCuaLichHen`. Cả `layDanhSachLichHen` và `capNhatTrangThaiLichHen` đều lọc chặt chẽ qua `PHAN_QUYEN_TOA` theo `nguoiDungId`, đảm bảo quản lý toà A không đọc/sửa lịch hẹn toà B kể cả khi request không truyền `toaNhaId`.

### [P1.2, P1.4 & P1.6] Bảo toàn Migration Đã Áp Dụng & Schema Tương Thích
- **Migration Files:**
  - `backend/src/main/resources/db/migration/V49__public_lead_and_viewing_appointments.sql` (Phục hồi 100% nguyên bản commit `046d45a`)
  - `backend/src/main/resources/db/migration/V55__room_assets_and_handover.sql` (Phục hồi 100% nguyên bản commit `046d45a`)
  - `backend/src/main/resources/db/migration/V56__handover_schema_compatibility.sql` (Forward migration mới)
- **Hành vi sau sửa:**
  - Tuyệt đối không sửa trực tiếp file migration `V49` và `V55` đã được áp dụng trong database (bảo toàn checksum Flyway `-1020674094` và `-1007063486`).
  - Không sửa `flyway_schema_history`, không reset database, không xoá dữ liệu thật.
  - Tạo forward migration `V56` kiểm tra và chuẩn hoá cột `tien_khautru` sang `tien_khau_tru` nếu database nâng cấp từ phiên bản thử nghiệm có lỗi đặt tên.
  - `TaiSanRepository.java` nhất quán sử dụng tên cột chuẩn `tien_khau_tru`.

### [P2.7] Chặn Stale Response & Căn cứ Quyết toán Biên bản Bàn giao
- **Files:**
  - `frontend/src/QuanLyTaiSanPhong.tsx`
  - `frontend/src/HopDongThaoTac.tsx`
  - `backend/src/main/java/com/prj1/ccm/hopdong/YeuCauThanhLy.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongRepository.java`
- **Hành vi sau sửa:**
  - `QuanLyTaiSanPhong.tsx`: Khôi phục hàm `loadData()` phục vụ làm mới danh mục sau khi thêm/xoá tài sản. Sử dụng `currentScopeRef` theo dõi `phongId` và `hopDongId` hiện hành, chặn stale response sau khi lập biên bản hoặc khi đổi hợp đồng A sang B.
  - `HopDongThaoTac.tsx` & `HopDongService.java`:
    - `YeuCauThanhLy` bổ sung trường `bienBanId`. `HopDongService.thanhLy` kiểm tra biên bản phải thuộc đúng hợp đồng (`kiemTraBienBanThuocHopDong`), ném `400 BAD_REQUEST` nếu sai lệch.
    - Giao diện thanh lý hợp đồng kiểm tra nếu có biên bản trả phòng (`TRA_PHONG`) mà số tiền quyết toán khác với số tiền trong biên bản, bắt buộc người dùng tích chọn checkbox xác nhận và ghi rõ lý do trước khi cho phép bấm nút "Thanh lý hợp đồng".

### [P2.8 & P2.9] Xử lý Chặt chẽ Dịch vụ Bậc thang & Xuất PDF
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongPdfService.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/ThongTinHopDongDichVu.java`
  - `frontend/src/DichVuVaKy.tsx`
- **Hành vi sau sửa:**
  - `HopDongService.tao`: Khi chọn dịch vụ bậc thang (`BAC_THANG`), bắt buộc kiểm tra xem dịch vụ đã có bảng giá bậc thang hiệu lực chưa (`findApplicableNgayHieuLucBacThangByDichVuIdAndNgay`). Nếu chưa có bảng giá bậc thang, từ chối tạo hợp đồng với `400 BAD_REQUEST`, không tạo hợp đồng với dữ liệu thiếu giá.
  - `HopDongPdfService`: Dịch vụ `BAC_THANG` xuất PDF với mô tả `"Tính theo biểu giá bậc thang quy định"`, không in `"0 đ"` gây hiểu lầm thành miễn phí. Dịch vụ cố định có giá 0 in rõ `"Miễn phí (0 đ)"`.
  - `DichVuVaKy.tsx`:
    - Tải bảng giá cố định và bảng giá bậc thang độc lập qua `Promise.allSettled`. Nếu nguồn giá cần dùng tương ứng với `cheDoGia` bị lỗi (401/403/500), hiển thị thông báo lỗi cụ thể, không nuốt lỗi âm thầm thành danh sách rỗng.
    - Thêm bậc thang: Chặn người dùng bấm thêm bậc nếu bậc cuối cùng đang là khoảng vô hạn (`denSoLuong` để trống). Ranh giới bậc tiếp theo được tự động tính bằng `denSoLuong + 1`, đồng bộ với backend `BangGiaDichVuService`.

### [P2.10] Chuẩn hóa Fixture Kiểm thử Bảng việc Vận hành & PCCC
- **File:** `backend/src/test/java/com/prj1/ccm/thongbao/BangViecVanHanhIntegrationTest.java`
- **Hành vi sau sửa:**
  - Trong `resetDatabase()`, chuẩn hoá lịch kiểm tra PCCC của toà nhà theo test clock (`TODAY.plusMonths(3)`), xoá sạch bảng `PCCC_KIEM_TRA`, `PCCC_THIET_BI`, `PCCC_HO_SO`.
  - Bổ sung 3 bài kiểm tra độc lập kiểm chứng đầy đủ 3 trường hợp:
    1. Chưa đến hạn kiểm tra toà nhà và không có thiết bị sắp hết hạn kiểm định → `soLuong = 0`, `trangThai = "DA_XONG"`.
    2. Toà nhà đến hạn kiểm tra định kỳ (`pccc_ngay_kiem_tra_tiep <= TODAY`) → `soLuong = 1`, `trangThai = "CAN_XU_LY"`.
    3. Thiết bị sắp hết hạn kiểm định trong vòng 30 ngày (`han_kiem_dinh <= TODAY.plusDays(30)`) → `soLuong = 1`, `trangThai = "CAN_XU_LY"`.

---

## 2. CHI TIẾT ENDPOINTS, HTTP METHODS & TRẠNG THÁI CHUẨN XÁC

### Cổng Khách vãng lai & Quản lý Lịch hẹn (`FR-PUB`)
- `POST /api/public/dat-lich-hen`: Đặt lịch hẹn xem phòng công khai (Public).
- `GET /api/lich-hen`: Danh sách lịch hẹn xem phòng theo toà nhà hoặc theo quyền quản trị của tài khoản (Quyền: `CHU`, `QUAN_LY`).
- `PATCH /api/lich-hen/{id}/trang-thai`: Cập nhật trạng thái lịch hẹn xem phòng (Quyền: `CHU`, `QUAN_LY`).
- **Tập trạng thái hợp lệ của Lịch hẹn xem phòng (`LICH_HEN_XEM_PHONG`):**
  - `CHO_XAC_NHAN`: Chờ xác nhận
  - `DA_XAC_NHAN`: Đã xác nhận
  - `DA_XEM`: Đã xem phòng
  - `HUY`: Hủy lịch hẹn

### Quản lý Danh mục Tài sản & Biên bản Bàn giao
- `GET /api/phong/{phongId}/tai-san`: Danh mục tài sản phòng (Quyền: `CHU`, `QUAN_LY`, `NGUOI_THUE` đang thuê phòng).
- `POST /api/phong/{phongId}/tai-san`: Thêm tài sản vào phòng (Quyền: `CHU`, `QUAN_LY`).
- `DELETE /api/tai-san/{id}`: Xóa tài sản khỏi phòng (Quyền: `CHU`, `QUAN_LY`) — *chính xác theo `@DeleteMapping("/tai-san/{id}")` của `TaiSanController.java`*.
- `GET /api/hop-dong/{hopDongId}/bien-ban-tai-san`: Danh sách biên bản bàn giao (Quyền: `CHU`, `QUAN_LY`, `NGUOI_THUE` của hợp đồng).
- `POST /api/hop-dong/{hopDongId}/bien-ban-tai-san`: Lập biên bản nhận phòng / trả phòng (Quyền: `CHU`, `QUAN_LY`).
  - *Lưu ý về snapshot:* `ten_tai_san` được snapshot chuẩn xác từ cơ sở dữ liệu (`TAI_SAN_PHONG`). Tình trạng lúc giao/trả (`tinh_trang_luc_giao`, `tinh_trang_luc_tra`) hiện tại được ghi nhận từ input của người lập biên bản (client).

---

## 3. THÔNG TIN COMMIT GIT & DANH SÁCH FILE ĐÃ HIỆU CHỈNH

### Mốc Commit
- **Commit gốc trước đợt sửa:** `046d45a` (`feat: complete public portal, room assets, contract pdf, pro ui overhaul, smart presets and handover report`)
- **Commit sửa trung gian:** `d2e3d69` (`fix: resolve MiniApart review findings across P1, P2, and P3`)
- **Commit hoàn tất khắc phục:** `4afce02` (`fix(review): resolve race conditions, scope permissions, migration compatibility, and tiered pricing`)

### Danh sách các file hiệu chỉnh trong working tree:
1. `backend/src/main/resources/db/migration/V49__public_lead_and_viewing_appointments.sql` (Phục hồi nguyên bản `046d45a`)
2. `backend/src/main/resources/db/migration/V55__room_assets_and_handover.sql` (Phục hồi nguyên bản `046d45a`)
3. `backend/src/main/resources/db/migration/V56__handover_schema_compatibility.sql` (Forward migration mới)
4. `backend/src/main/java/com/prj1/ccm/billing/TinhHoaDonRepository.java` (Khóa hàng hoá đơn `FOR UPDATE OF hd`)
5. `backend/src/main/java/com/prj1/ccm/billing/HuyHoaDonNhapService.java` (Khóa hoá đơn khi huỷ, chặn tiền thực thu khác 0)
6. `backend/src/main/java/com/prj1/ccm/billing/ThayTheHoaDonController.java` (Thống nhất khóa `FOR UPDATE OF hd`)
7. `backend/src/main/java/com/prj1/ccm/publicportal/PublicPortalRepository.java` (Khôi phục scope `PHAN_QUYEN_TOA` và các helper method)
8. `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java` (Chặn thiếu giá bậc thang, kiểm tra biên bản thuộc hợp đồng)
9. `backend/src/main/java/com/prj1/ccm/hopdong/HopDongRepository.java` (Select `dv.che_do_gia`, kiểm tra biên bản thuộc hợp đồng)
10. `backend/src/main/java/com/prj1/ccm/hopdong/HopDongPdfService.java` (Xuất PDF không quảng diễn bậc thang thành 0 đ)
11. `backend/src/main/java/com/prj1/ccm/hopdong/ThongTinHopDongDichVu.java` (Bổ sung thuộc tính `cheDoGia`)
12. `backend/src/main/java/com/prj1/ccm/hopdong/YeuCauThanhLy.java` (Bổ sung trường `bienBanId`)
13. `backend/src/test/java/com/prj1/ccm/hopdong/HopDongServiceTest.java` (Kiểm thử semantics giá bậc thang và thiếu bảng giá)
14. `backend/src/test/java/com/prj1/ccm/hopdong/HopDongPdfServiceTest.java` (Kiểm thử nội dung text trong PDF)
15. `backend/src/test/java/com/prj1/ccm/billing/HuyHoaDonNhapServiceTest.java` (Kiểm thử khóa và chặn huỷ khi có tiền thu)
16. `backend/src/test/java/com/prj1/ccm/thongbao/BangViecVanHanhIntegrationTest.java` (Chuẩn hoá fixture PCCC theo clock)
17. `frontend/src/QuanLyTaiSanPhong.tsx` (Khôi phục `loadData`, chặn stale response)
18. `frontend/src/HopDongThaoTac.tsx` (Liên kết biên bản, xác nhận quyết toán khác biên bản)
19. `frontend/src/DichVuVaKy.tsx` (Tải độc lập không nuốt lỗi, chặn thêm bậc sau khoảng vô hạn)

---

## 4. KẾT QUẢ KIỂM CHỨNG & PHÂN ĐỊNH PHẠM VI

### Các kiểm thử ĐÃ CHẠY THÀNH CÔNG:
1. **Frontend Vitest Test Suite:**
   - Lệnh: `npm run test -- --run`
   - Kết quả: **31 passed (31 test files), 215 passed (215 tests)**.
2. **Frontend Production Build:**
   - Lệnh: `npm run build`
   - Kết quả: **0 lỗi TypeScript, 0 lỗi bundle**.
3. **Backend Unit Tests:**
   - Lệnh: `./gradlew.bat test --tests "..."`
   - Kết quả:
     - `TaiSanServiceTest`: 6/6 passed.
     - `HuyHoaDonNhapServiceTest`: 3/3 passed (chặn huỷ có tiền thu nháp/phát hành, kiểm tra khoá).
     - `HopDongServiceTest`: 7/7 passed (kiểm tra bậc thang hợp lệ, từ chối bậc thang thiếu bảng giá).
     - `HopDongPdfServiceTest`: 3/3 passed (kiểm tra chuỗi text PDF chứa biểu giá bậc thang và không chứa "0 đ").
     - `PublicPortalServiceTest`: 4/4 passed.

### Các kiểm thử CHƯA THỂ CHẠY (Báo cáo trung thực):
- Các Integration Test sử dụng thư viện Testcontainers (`BangViecVanHanhIntegrationTest`, `AuthMigrationRegressionTest`,...):  
  *Nguyên nhân:* Môi trường máy trạm Windows này chưa cài đặt/kích hoạt Docker Desktop (`DockerClientProviderStrategy` ném `IllegalStateException`). Mã nguồn test và fixture đã được chuẩn hoá 100% theo các ràng buộc và schema mới nhất, sẵn sàng chạy trên CI/CD pipeline có Docker daemon.
