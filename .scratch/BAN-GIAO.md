# BIÊN BẢN BÀN GIAO TIẾP QUẢN DỰ ÁN (DÀNH CHO CODEX REVIEW)

> **Thời điểm bàn giao:** Tiếp nối từ thời điểm Codex hết token và đã hoàn thiện toàn bộ 12 phát hiện review (P1, P2, P3).  
> **Trạng thái hệ thống:**  
> - **PostgreSQL 17 Portable:** Đang chạy tại port `5432` (`miniapart_db`)  
> - **Spring Boot Backend:** Đang chạy tại `http://localhost:8080/`  
> - **Vite Frontend Dev Server:** Đang chạy tại `http://localhost:5173/`  
> - **Frontend Test Suite:** `vitest run --run` đạt **31/31 suites passed (215/215 tests passed 100%)**  
> - **Frontend Build:** `npm run build` thành công 100% (0 lỗi TypeScript, 0 lỗi bundle)  
> - **Backend Unit Tests:** `TaiSanServiceTest`, `HuyHoaDonNhapServiceTest`, `HopDongServiceTest`, `PublicPortalServiceTest`, `BillingCalc*` passed 100%.  
> - **Commit gốc:** `046d45a`  
> - **Commit kết thúc:** Xem mục 3 bên dưới sau khi lưu toàn bộ thay đổi.

---

## 1. TỔNG HỢP CÁC PHẦN ANTIGRAVITY ĐÃ TRIỂN KHAI & HIỆU CHỈNH THEO REVIEW

### [P1.1 & P2.5] Phân quyền, kiểm tra toàn vẹn và nghiệp vụ Quản lý Tài sản / Biên bản bàn giao
- **Backend Files:**
  - `backend/src/main/java/com/prj1/ccm/taisan/TaiSanController.java`
  - `backend/src/main/java/com/prj1/ccm/taisan/TaiSanService.java`
  - `backend/src/main/java/com/prj1/ccm/taisan/TaiSanRepository.java`
  - `backend/src/test/java/com/prj1/ccm/taisan/TaiSanServiceTest.java`
- **Endpoints & Phân quyền:**
  - `GET /api/phong/{phongId}/tai-san`: `CHU`, `QUAN_LY` (thuộc phạm vi tòa nhà quản lý) hoặc `NGUOI_THUE` đang có hợp đồng hiệu lực tại phòng đó.
  - `POST /api/phong/{phongId}/tai-san`: `CHU`, `QUAN_LY` (thuộc phạm vi tòa nhà).
  - `DELETE /api/phong/tai-san/{id}`: `CHU`, `QUAN_LY` (thuộc phạm vi tòa nhà).
  - `GET /api/hop-dong/{hopDongId}/bien-ban-tai-san`: `CHU`, `QUAN_LY` (thuộc phạm vi tòa) hoặc `NGUOI_THUE` của hợp đồng đó.
  - `POST /api/hop-dong/{hopDongId}/bien-ban-tai-san`: `CHU`, `QUAN_LY` (thuộc phạm vi tòa).
- **Quy tắc & Kiểm tra nghiệp vụ sau sửa:**
  - Xóa bỏ hoàn toàn fallback người lập ID 1; người lập biên bản được lấy trực tiếp từ `NguoiDung.id()` của phiên đăng nhập (`nguoiDung.id()`).
  - Kiểm tra tài sản trong chi tiết biên bản bắt buộc phải thuộc đúng phòng của hợp đồng (`kiemTraTaiSanThuocPhong`).
  - Chặn tài sản trùng lặp trong cùng một biên bản kiểm kê.
  - Kiểm tra số lượng hợp lệ: `0 < soLuong <= soLuongHienCoTrongDb`.
  - Kiểm tra tiền khấu trừ không âm (`tienKhauTru >= 0`).
  - Snapshot tên tài sản và tình trạng gốc lấy trực tiếp từ cơ sở dữ liệu (`TAI_SAN_PHONG`), không tin cậy dữ liệu client gửi lên.

### [P1.2 & P1.3] Chuẩn hóa Migration, Nâng cấp Seed Demo và Bảo vệ Dữ liệu Thật
- **Migration Files:**
  - `backend/src/main/resources/db/migration/V49__public_lead_and_viewing_appointments.sql`
  - `backend/src/main/resources/db/migration/V55__room_assets_and_handover.sql`
- **Hành vi sau sửa:**
  - `V49`: Không hardcode ID phòng khi chèn demo; xử lý nâng cấp khi phòng đã tồn tại theo unique `(toa_nha_id, so_phong)` bằng lệnh `UPDATE ... SET tien_ich = ..., mo_ta = ... WHERE toa_nha_id = ... AND so_phong = ...`; seed phòng mới được bọc điều kiện `WHERE NOT EXISTS (SELECT 1 FROM PHONG WHERE toa_nha_id = ... AND so_phong = ...)`.
  - Dịch vụ demo chỉ chèn khi chưa tồn tại (`WHERE NOT EXISTS (SELECT 1 FROM DICH_VU WHERE ...)`); không xóa hay ghi đè dịch vụ thật.
  - `V55`: Chèn dữ liệu tài sản mẫu bọc điều kiện `AND NOT EXISTS (SELECT 1 FROM TAI_SAN_PHONG WHERE phong_id = ... AND ten_tai_san = ...)`; không xóa dữ liệu thật theo tên.

### [P1.4] Thống nhất Quy tắc Hủy / Thay thế Hóa đơn Nháp có Tiền Đã Thu
- **Backend Files:**
  - `backend/src/main/java/com/prj1/ccm/billing/TinhHoaDonRepository.java`
  - `backend/src/main/java/com/prj1/ccm/billing/HuyHoaDonNhapService.java`
  - `backend/src/test/java/com/prj1/ccm/billing/HuyHoaDonNhapServiceTest.java`
- **Hành vi sau sửa:**
  - Trong `HuyHoaDonNhapService`, bổ sung kiểm tra số tiền đã thu: nếu `hoaDon.daThu() != null && hoaDon.daThu().signum() != 0`, chặn hủy trực tiếp và quăng lỗi `409 CONFLICT` với thông điệp rõ ràng: `"Lập bút toán đối ứng cho các khoản đã thu trước khi huỷ hoá đơn."`.
  - Đảm bảo tiền thực thu không bị treo trên hóa đơn bị hủy, tránh việc tạo lại toàn bộ khoản phải thu gây trùng lặp công nợ.

### [P2.6] Khấu trừ Hợp đồng, Reset Form Checklist và Đối chiếu Biên bản Trả phòng
- **Frontend Files:**
  - `frontend/src/QuanLyTaiSanPhong.tsx`
  - `frontend/src/HopDongThaoTac.tsx`
- **Hành vi sau sửa:**
  - `QuanLyTaiSanPhong.tsx`: Callback `onKhauTruThayDoi` được gọi ngay cả khi `tongKhauTruBienBan === 0` để reset tiền khấu trừ trên phiếu quyết toán về 0; thêm cờ `active` trong `useEffect` để ngăn chặn stale responses khi người dùng đổi hợp đồng liên tục; reset sạch `chiTietKiemKe`, `ghiChuBienBan`, `loaiBienBan` khi đổi `hopDongId`.
  - `HopDongThaoTac.tsx`: Tự động reset state thanh lý `settle` và danh sách biên bản `bienBans` khi đổi hợp đồng chọn; hiển thị banner đối chiếu biên bản trả phòng (`📋 Đối chiếu biên bản trả phòng`) kèm nút 1-chạm `⚡ Áp dụng số liệu biên bản` giúp tự động điền khấu trừ thiệt hại tài sản vào form thanh lý.

### [P2.7 & P2.8] Tải Độc lập Bảng giá và Đồng bộ Ranh giới Bậc thang Dịch vụ
- **Files:**
  - `frontend/src/DichVuVaKy.tsx`
  - `backend/src/main/java/com/prj1/ccm/toanha/BangGiaDichVuService.java`
- **Hành vi sau sửa:**
  - `DichVuVaKy.tsx`: Thay `Promise.all` bằng `Promise.allSettled` khi tải bảng giá cố định và bảng giá bậc thang, đảm bảo lỗi của API bậc thang không làm gián đoạn tải bảng giá cố định.
  - Đồng bộ ranh giới bậc thang: Trước đây frontend sinh `50` sau bậc `0-50`, trong khi backend yêu cầu `diemBatDauKyVong = 51`. Frontend đã được sửa thành `nextTu = String(Number(prevDen) + 1)`, khớp 100% với kiểm tra liên tục của backend.

### [P2.9] Hỗ trợ Dịch vụ Chỉ có Giá Bậc thang khi Tạo Hợp đồng
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/main/java/com/prj1/ccm/toanha/CheDoGia.java` (được chuyển sang `public`)
  - `backend/src/test/java/com/prj1/ccm/hopdong/HopDongServiceTest.java`
- **Hành vi sau sửa:**
  - Khi tạo hợp đồng kèm dịch vụ có `cheDoGia == CheDoGia.BAC_THANG`, backend gán `donGiaApDung = BigDecimal.ZERO` và không bắt buộc phải tìm thấy đơn giá cố định trong bảng `BANG_GIA`.
  - Người dùng bấm "Chọn tất cả" trên giao diện khi có dịch vụ điện/nước bậc thang sẽ không còn bị lỗi từ chối tạo hợp đồng.

### [P2.10] Trả đúng Chế độ Giá và Bậc thang trên Cổng Công khai (Public Portal)
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/publicportal/DichVuCongKhaiDto.java`
  - `backend/src/main/java/com/prj1/ccm/publicportal/PublicPortalRepository.java`
  - `frontend/src/api.ts`
  - `frontend/src/KhamPhaPhong.tsx`
- **Hành vi sau sửa:**
  - `PublicPortalRepository`: Trả về đúng `che_do_gia` và đơn giá gốc từ cơ sở dữ liệu, loại bỏ việc ép giá thiếu thành `0`.
  - `DichVuCongKhaiDto`: Bổ sung trường `String cheDoGia`.
  - Frontend: Hiển thị nhãn `"Bậc thang"` đối với dịch vụ `BAC_THANG`, `"Chưa có giá"` khi giá null, và định dạng tiền tệ khi có đơn giá cố định.

### [P2.11] Cập nhật Fixture Kiểm thử Hợp lệ với Ràng buộc V52 & Nhóm PCCC
- **Files:**
  - `backend/src/test/java/com/prj1/ccm/auth/AuthMigrationRegressionTest.java`
  - `backend/src/test/java/com/prj1/ccm/thongbao/BangViecVanHanhIntegrationTest.java`
- **Hành vi sau sửa:**
  - `AuthMigrationRegressionTest`: Sửa fixture người thuê từ `'DANG_THUE'` thành `'DA_DANG_KY_TAM_TRU'`, tuân thủ check constraint `ck_nguoi_thue_luu_tru` được khai báo trong migration `V52`.
  - `BangViecVanHanhIntegrationTest`: Cập nhật assertion cho nhóm PCCC thành `trangThai: "DA_XONG"`, `tenTrangThai: "Đã xong"`, `lienKet: "/an-toan?toaNhaId=1"` tương ứng với triển khai thực tế của `PcccService`.

---

## 2. CHI TIẾT CÁC ENDPOINT, METHOD & TRẠNG THÁI LỊCH HẸN (`FR-PUB`)

- **Controller:** `PublicPortalController.java`
  - `POST /api/public/dat-lich-hen`: Đặt lịch hẹn xem phòng công khai (Public, không yêu cầu đăng nhập).
  - `GET /api/public/lich-hen`: Danh sách lịch hẹn theo tòa nhà hoặc toàn bộ quyền quản lý (Quyền: `CHU`, `QUAN_LY`).
  - `PUT /api/public/lich-hen/{id}/trang-thai`: Cập nhật trạng thái lịch hẹn xem phòng (Quyền: `CHU`, `QUAN_LY`).
- **Tập trạng thái hợp lệ của Lịch hẹn xem phòng (`LICH_HEN_XEM_PHONG`):**
  - `CHO_XAC_NHAN`: Chờ xác nhận (Trạng thái khởi tạo mặc định khi khách gửi yêu cầu)
  - `DA_XAC_NHAN`: Đã xác nhận (Quản lý/Chủ nhà liên hệ và xác nhận thời gian)
  - `DA_XEM`: Đã xem phòng (Khách đã đến khảo sát thực tế)
  - `HUY`: Hủy lịch hẹn

---

## 3. THÔNG TIN COMMIT GIT & KIỂM THỬ

### Git Commits
- **Commit gốc (Khởi đầu đợt bàn giao):** `046d45a` (`feat: complete public portal, room assets, contract pdf, pro ui overhaul, smart presets and handover report`)
- **Commit kết thúc (Hoàn thành 12 phát hiện review):** `90f0d2c` (hoặc commit HEAD hiện tại: `git rev-parse --short HEAD`)

### Phạm vi & Bằng chứng kiểm thử
1. **Kiểm tra ĐÃ CHẠY thành công:**
   - **Frontend Test Suite:** Chạy lệnh `npm run test -- --run` tại `frontend/`.  
     *Kết quả:* **31 passed (31 files), 215 passed (215 tests)**.
   - **Frontend Production Build:** Chạy lệnh `npm run build` tại `frontend/`.  
     *Kết quả:* Build thành công với `tsc -b && vite build` (0 lỗi TypeScript, 0 lỗi cú pháp).
   - **Backend Unit Tests:**
     - `TaiSanServiceTest` (6 tests: Phân quyền vai trò `CHU`/`QUAN_LY`/`NGUOI_THUE`, phạm vi tòa/phòng, cấm số lượng âm, cấm khấu trừ âm, snapshot DB, bỏ fallback ID 1).
     - `HuyHoaDonNhapServiceTest` (2 tests: Chặn hủy hóa đơn nháp có tiền thực thu > 0 báo HTTP 409, cho phép hủy hóa đơn chưa thu).
     - `HopDongServiceTest` (6 tests: Dịch vụ bậc thang gán đơn giá 0 không bắt buộc có trong `BANG_GIA`).
     - `PublicPortalServiceTest` (4 tests: Chặn khách xem trái phép, chặn đặt chéo phòng, đồng bộ trạng thái phòng).
     - `BillingCalc*` (11 suites, 114 tests passed).
     - `DatLaiMatKhauServiceTest`, `XacThucServiceTest`.
2. **Kiểm tra CHƯA THỂ CHẠY (Phân biệt rõ ràng):**
   - Các Integration Test sử dụng thư viện Testcontainers (`AuthMigrationRegressionTest`, `BangViecVanHanhIntegrationTest`, `HoaDonHangLoatIntegrationTest`,...):  
     *Nguyên nhân:* Các test này cấu hình `@Testcontainers` yêu cầu Docker daemon (`postgres:17-alpine`) để khởi tạo container cô lập. Môi trường máy trạm Windows này hiện chạy PostgreSQL portable trực tiếp trên cổng 5432 và chưa cài đặt/kích hoạt Docker Desktop, do đó các test này bị dừng ở tầng `DockerClientProviderStrategy`. Code fixture đã được đối soát và sửa chuẩn xác theo DB schema `V52` và `V54`.
