# BIÊN BẢN BÀN GIAO TIẾP QUẢN DỰ ÁN (DÀNH CHO CODEX REVIEW)

> **Thời điểm bàn giao:** Sau khi hoàn thành toàn diện các phát hiện review độc lập (P1, P2, P3).  
> **Trạng thái hệ thống:**  
> - **PostgreSQL 17 Portable:** Đang chạy tại port `5432` (`miniapart_db`)  
> - **Spring Boot Backend:** Đang chạy tại `http://localhost:8080/`  
> - **Vite Frontend Dev Server:** Đang chạy tại `http://localhost:5173/`  
> - **Frontend Test Suite:** `vitest run --run` đạt **31/31 suites passed (219/219 tests passed 100%)**  
> - **Frontend Build:** `npm run build` thành công 100% (0 lỗi TypeScript, 0 lỗi bundle)  
> - **Backend Test Suites (chạy trên PostgreSQL cô lập):**
>   - `MigrationUpgradeHistoryIntegrationTest`: **4/4 passed (cả 4 đường nâng cấp database)**
>   - `HuyVaThanhToanConcurrencyIntegrationTest`: **5/5 passed**
>   - `BangViecVanHanhIntegrationTest`: **8/8 passed**
>   - `MoneySchemaRegressionTest`: **2/2 passed**
>   - `HopDongServiceTest`: **10/10 passed**
>   - `TaiSanServiceTest`: **7/7 passed**
>   - `HuyHoaDonNhapServiceTest`: **3/3 passed**
>   - `PublicPortalServiceTest`: **4/4 passed**
>   - `HopDongPdfServiceTest`: **3/3 passed**
> - **Mốc commit trước đợt sửa:** `046d45a`  
> - **Commit sửa trung gian:** `d2e3d69`  
> - **Commit hoàn tất khắc phục:** `7cae884` (hoặc commit HEAD hiện tại: `git rev-parse --short HEAD`)

---

## 1. PHƯƠNG ÁN NÂNG CẤP MIGRATION & SEED DỮ LIỆU PRODUCTION (4 ĐƯỜNG LỊCH SỬ)

### 1.1. Ma trận 4 lịch sử cơ sở dữ liệu thực tế & Cơ chế `FlywayUpgradeStrategy`:
Hệ thống triển khai `FlywayUpgradeStrategy` (`com.prj1.ccm.config.FlywayUpgradeStrategy` kế thừa `FlywayMigrationStrategy` của Spring Boot) nhằm tự động phát hiện lịch sử schema hiện tại qua `flyway_schema_history` và định tuyến bộ migration tương thích phù hợp:

1. **Lịch sử 1: Cơ sở dữ liệu có dữ liệu thực trước V49 (V01..V48):**
   - *Rủi ro nếu chạy V49 gốc:* `INSERT INTO PHONG (id, ...)` dùng `ON CONFLICT (id) DO NOTHING`. Nếu phòng đã tồn tại trong DB với `(toa_nha_id, so_phong)` trùng nhau nhưng ID khác nhau, Flyway sẽ dừng và fail ngay tại `V49` do vi phạm ràng buộc unique `(toa_nha_id, so_phong)`. Đồng thời `V49` chèn `BANG_GIA` với `dich_vu_id` cố định 1..5, có nguy cơ gắn biểu giá cố định vào dịch vụ nghiệp vụ thực tế mang ID 1..5 của khách hàng.
   - *Giải pháp nâng cấp:* File migration chuẩn production `V49__public_lead_and_viewing_appointments.sql` và `V55__room_assets_and_handover.sql` là Pure DDL, đã tách hoàn toàn các câu lệnh INSERT dữ liệu demo cứng. Nhờ vậy, khi chạy nâng cấp từ pre-V49, migration tạo bảng `lich_hen_xem_phong`, `tai_san_phong`, `bien_ban_tai_san` hoàn toàn thành công, không phát sinh xung đột unique `(toa_nha_id, so_phong)` và không can thiệp dịch vụ thật.
2. **Lịch sử 2: Cơ sở dữ liệu đã áp dụng bản `046d45a`:**
   - *Trạng thái:* `flyway_schema_history` đã ghi nhận `V49` và `V55` của mốc `046d45a`.
   - *Giải pháp tương thích:* `FlywayUpgradeStrategy` tự động phát hiện checksum `V49` của mốc `046d45a`, chuyển sang nạp cấu hình `classpath:db/migration_common` kết hợp `classpath:db/migration_variants/v046d45a`. Flyway xác thực checksum khớp 100%, không báo lỗi validation, và áp dụng tiếp forward migration `V56__handover_schema_compatibility.sql`. Tuyệt đối không can thiệp hay sửa đổi `flyway_schema_history`, không chạy `repair`.
3. **Lịch sử 3: Cơ sở dữ liệu đã áp dụng bản trung gian `d2e3d69`:**
   - *Trạng thái:* `flyway_schema_history` đã ghi nhận `V49` và `V55` của mốc `d2e3d69` (chứa cột `tien_khautru`).
   - *Giải pháp tương thích:* `FlywayUpgradeStrategy` tự động phát hiện checksum `V49` của mốc `d2e3d69`, chuyển sang nạp cấu hình `classpath:db/migration_common` kết hợp `classpath:db/migration_variants/vd2e3d69`. Flyway xác thực checksum khớp 100%, sau đó áp dụng `V56__handover_schema_compatibility.sql` để đổi tên an toàn `tien_khautru` -> `tien_khau_tru`.
4. **Lịch sử 4: Database tạo mới hoàn toàn (Clean DB):**
   - `FlywayUpgradeStrategy` chọn nhánh canonical chuẩn (`classpath:db/migration`), chạy tuần tự từ `V01` đến `V56` thành công 100% trong trạng thái sạch, không sinh bất kỳ bản ghi demo nào vào bảng nghiệp vụ.

### 1.2. Cơ chế tách dữ liệu Demo chủ động (Active Seed Mechanism):
- **Tách biệt khỏi Migration:** Dữ liệu demo được tách hoàn toàn ra khỏi các migration script và chuyển vào component riêng `DemoDataSeeder.java` (`com.prj1.ccm.toanha.DemoDataSeeder`), được bảo vệ bởi cờ cấu hình `@ConditionalOnProperty(name = "app.seed-demo", havingValue = "true")`. Trong môi trường production (`app.seed-demo=false` hoặc mặc định), seeder hoàn toàn không được nạp hay kích hoạt.
- **Đối soát an toàn dữ liệu mẫu đã chèn (`DemoDataReconciliationService.java`):**
  - Tuyệt đối không xoá dữ liệu theo tên phòng (`DELETE FROM PHONG WHERE so_phong LIKE 'P.%'`) vì khách hàng có thể đặt tên phòng thực tế trùng tên demo.
  - Service cung cấp quy trình audit an toàn: kiểm tra chéo foreign key (phòng không có hợp đồng `HOP_DONG`, không có chỉ số `CHI_SO_DICH_VU`, không có yêu cầu sửa chữa `YEU_CAU_SUA_CHUA`), so khớp ID mẫu đã định nghĩa trước khi gắn cờ hoặc đưa vào diện cô lập an toàn.

---

## 2. CHI TIẾT CÁC PHÁT HIỆN REVIEW ĐÃ KHẮC PHỤC (P1 & P2)

### 2.1. Concurrency Race: Hủy hoá đơn & Thu tiền đồng thời (P1.4)
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/billing/TinhHoaDonRepository.java`
  - `backend/src/main/java/com/prj1/ccm/billing/ThanhToanRepository.java`
  - `backend/src/main/java/com/prj1/ccm/billing/HuyHoaDonNhapService.java`
  - `backend/src/main/java/com/prj1/ccm/billing/ThayTheHoaDonController.java`
  - `backend/src/main/java/com/prj1/ccm/billing/calc/QuyTacTrangThaiHoaDon.java`
- **Nguyên nhân:** Trước đây, câu lệnh khoá và tính toán `da_thu` kết hợp trong cùng 1 statement SQL (`SUM(tt.so_tien)` và `FOR UPDATE OF hd`). Trong cơ chế Read Committed của PostgreSQL, statement bắt đầu trước khi giao dịch thu tiền commit có thể đọc snapshot cũ của ledger dù hàng hoá đơn đã được khoá sau đó. Đồng thời, `ThanhToanRepository` khoá toàn bộ các bảng tham gia join (`FOR UPDATE`) dẫn đến nguy cơ deadlock khi giao dịch khác khoá hợp đồng/phòng.
- **Hành vi sau sửa:**
  - `TinhHoaDonRepository.khoaHoaDonTrongPhamVi`: Tách statement khoá hoá đơn riêng biệt (`FOR UPDATE OF hd`). Sau khi khoá thành công, mở một statement đọc mới để tính toán chính xác tổng tiền đã thu `da_thu` trên snapshot mới nhất trong transaction.
  - `ThanhToanRepository`: Đồng bộ cú pháp khoá chỉ trên hàng hoá đơn `FOR UPDATE OF hd`, tránh lock lan truyền sang `HOP_DONG` hay `PHONG`.
  - `QuyTacTrangThaiHoaDon`: Khi có bút toán đối ứng đưa số tiền thực thu về `<= 0`, cho phép hoàn trạng thái hoá đơn về `DA_PHAT_HANH` (hoặc `QUA_HAN` nếu quá hạn thanh toán) thông qua `ghiNhanThanhToanDoiUng`. Từ đó hoá đơn được phép chuyển tiếp sang `DA_HUY`. Đồng thời bảo toàn bảng chuyển trạng thái chuẩn trong `taoBangChuyenHopLe()`.
- **Kiểm chứng:** Test suite `HuyVaThanhToanConcurrencyIntegrationTest` chạy trên PostgreSQL cô lập, mô phỏng đa luồng có `CountDownLatch` kiểm chứng 5 kịch bản:
  1. `thuTienTruoc_huySau_biChanBangConflictVaBaoToanTienThu`: **PASS**
  2. `huyTruoc_thuTienSau_biChanBangConflict`: **PASS**
  3. `doiUngXong_choPhepChuyenDaHuy`: **PASS**
  4. `thayTheHoaDon_daThuTien_nemLoiConflict`: **PASS**
  5. `thayTheHoaDon_chuaThuTien_thayTheThanhCongVaKhongLapKhoanPhaiThu`: **PASS**

### 2.2. Căn cứ quyết toán hợp đồng & Audit Trail khấu trừ (P2.5 & P2.6)
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongRepository.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/YeuCauThanhLy.java`
  - `backend/src/main/java/com/prj1/ccm/nguoithue/NhatKyThaoTacRepository.java`
  - `frontend/src/HopDongThaoTac.tsx`
- **Nguyên nhân:** Trước đây hệ thống chỉ kiểm tra `kiemTraBienBanThuocHopDong` mà không kiểm tra biên bản có đúng phòng hay không, không bắt buộc loại biên bản phải là `TRA_PHONG`, và cho phép bỏ qua biên bản trả phòng khi quyết toán tiền khấu trừ mà không có sự xác nhận chênh lệch. Đồng thời, trường hợp biên bản có khấu trừ nhưng quyết toán về 0 chỉ ghi log cọc khi khấu trừ > 0, thiếu audit log kiên cố khi khấu trừ = 0.
- **Hành vi sau sửa:**
  - `HopDongService.thanhLy`:
    1. Xác thực `bienBanId` phải thuộc đúng hợp đồng và đúng phòng (`phongId`).
    2. Bắt buộc loại biên bản phải là `TRA_PHONG` (ném `400 BAD_REQUEST` nếu gửi biên bản `NHAN_PHONG`).
    3. Nếu không truyền `bienBanId` nhưng trong database đã tồn tại biên bản `TRA_PHONG` của hợp đồng đó, từ chối thanh lý yêu cầu cung cấp căn cứ biên bản.
    4. Nếu số tiền khấu trừ trong yêu cầu thanh lý lệch với `tong_tien_khau_tru` trong biên bản (kể cả biên bản > 0 và quyết toán = 0), bắt buộc client phải gửi `xacNhanChenhLech = true` và `lyDo` không được để trống.
    5. Ghi nhận audit trail kiên cố vào `NHAT_KY_THAO_TAC` (`hanh_dong = 'THANH_LY'`, lưu toàn diện `bienBanId`, `bbKhauTru`, `khauTruQuyetToan`, `chenhLech`, `xacNhanChenhLech`, `lyDo`, `hoaDonCuoiId`, `thoiDiem`). Thao tác ghi log thất bại sẽ ném exception làm rollback toàn bộ transaction thanh lý.
  - `HopDongThaoTac.tsx`: Form thanh lý đối chiếu số tiền khấu trừ với biên bản trả phòng đã lưu. Nếu khác nhau, yêu cầu người dùng tích chọn checkbox "Xác nhận số tiền khấu trừ khác biên bản bàn giao" và nhập lý do mới kích hoạt nút "Thanh lý hợp đồng".
- **Kiểm chứng:** `HopDongServiceTest` kiểm thử đầy đủ các nhánh: biên bản sai hợp đồng, biên bản sai loại, bỏ qua biên bản khi đã có biên bản trả phòng, khấu trừ lệch mà chưa xác nhận, khấu trừ biên bản 500k nhưng quyết toán 0 đồng có lý do và audit log, rollback khi ghi log lỗi (**10/10 passed**).

### 2.3. Khắc phục Race / Stale Response & Trạng thái Mutation Loading trong Quản lý tài sản (P2.6)
- **Files:**
  - `frontend/src/QuanLyTaiSanPhong.tsx`
  - `frontend/src/QuanLyTaiSanPhong.test.tsx`
- **Nguyên nhân:**
  1. Khi chuyển đổi nhanh giữa các phòng (ví dụ A -> B -> A), các request fetch dữ liệu phòng cũ hoàn thành muộn có thể ghi đè dữ liệu của phòng mới được chọn.
  2. Biến trạng thái `dangLuu` không được reset khi chuyển phòng / hợp đồng mới, và khối `finally` của các thao tác thêm/xóa/lập biên bản bỏ qua lệnh `setDangLuu(false)` nếu request không thuộc phòng hiện tại, khiến giao diện phòng mới có nguy cơ bị treo vô thời hạn ở trạng thái "Đang lưu...".
- **Hành vi sau sửa:**
  - Áp dụng token thế hệ mutation `mutationIdRef` kết hợp với `requestIdRef` và cờ huỷ `isMountedRef`.
  - Khi phòng hoặc hợp đồng thay đổi (`phongId`, `hopDongId`), `mutationIdRef.current++` được tăng ngay lập tức và `dangLuu` được reset về `false`.
  - Mọi thao tác thêm tài sản, xóa tài sản, lập biên bản đều gắn liền với thế hệ mutation hiện tại: nếu người dùng chuyển phòng trong lúc mutation đang gửi lên server, mutation cũ bị cô lập hoàn toàn, không hiển thị lỗi rò rỉ sang phòng mới và không làm đơ nút bấm của phòng mới.
- **Kiểm chứng:** `QuanLyTaiSanPhong.test.tsx` bổ sung 3 test cases chuyên sâu với deferred promise mô phỏng độ trễ mạng: thêm tài sản phòng A bị trễ rồi chuyển sang phòng B (phòng B không bị kẹt `dangLuu`, vẫn thao tác bình thường khi request phòng A hoàn tất); mutation lỗi ở phòng A không rò rỉ thông báo sang phòng B (**6/6 passed**).

### 2.4. Chặn gian lận/bỏ qua đơn giá dịch vụ bậc thang (P2.9)
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/test/java/com/prj1/ccm/hopdong/HopDongServiceTest.java`
- **Nguyên nhân:** Khi tạo hợp đồng, kiểm tra `item.donGiaApDung() != null` đứng trước kiểm tra `dichVu.cheDoGia() == BAC_THANG`. Người dùng có thể truyền `donGiaApDung` để lách dịch vụ bậc thang chưa có biểu giá hiệu lực.
- **Hành vi sau sửa:** Đưa nhánh `dichVu.cheDoGia() == BAC_THANG` lên kiểm tra đầu tiên. Bắt buộc dịch vụ bậc thang phải có bảng giá bậc thang hiệu lực tại thời điểm tạo hợp đồng, ném `400 BAD_REQUEST` nếu thiếu bảng giá, kể cả khi client truyền `donGiaApDung`.
- **Kiểm chứng:** `HopDongServiceTest.taoHopDong_dichVuBacThangThieuBangGia_ngayCaKhiCoDonGiaApDung_nemLoiBadRequest` (**passed**).

### 2.5. Phân quyền Lịch hẹn theo Toà nhà & Scope (P1.1)
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/publicportal/PublicPortalRepository.java`
  - `backend/src/main/java/com/prj1/ccm/publicportal/PublicPortalService.java`
  - `backend/src/main/java/com/prj1/ccm/publicportal/LichHenQuanLyController.java`
- **Hành vi sau sửa:**
  - Khôi phục tính nhất quán giữa Repository và Service.
  - Phân quyền chặt chẽ qua bảng `PHAN_QUYEN_TOA`: Khi tài khoản quản lý gọi `GET /api/lich-hen` mà không truyền `toaNhaId`, hệ thống chỉ trả về danh sách lịch hẹn của các toà nhà mà tài khoản đó được phân quyền quản lý.
  - Khi cập nhật trạng thái lịch hẹn `PATCH /api/lich-hen/{id}/trang-thai`, hệ thống xác thực toà nhà của lịch hẹn thuộc phạm vi quản lý của người dùng, ném `403 FORBIDDEN` nếu can thiệp vào toà nhà khác.
- **Kiểm chứng:** `PublicPortalServiceTest` (**4/4 passed**).

### 2.6. Chuẩn hoá Fixture PCCC & Bảng việc vận hành (P2.11)
- **Files:**
  - `backend/src/test/java/com/prj1/ccm/thongbao/BangViecVanHanhIntegrationTest.java`
- **Nguyên nhân:** Fixture test cũ insert cột không khớp schema V51 của bảng `PCCC_THIET_BI`, và `resetDatabase()` vi phạm ràng buộc khoá ngoại khi xoá `PHONG` và `DICH_VU`.
- **Hành vi sau sửa:** Đồng bộ câu lệnh SQL insert vào `PCCC_THIET_BI` với schema chuẩn (`ten, vi_tri, han_kiem_dinh`). Bổ sung xoá bảng con PCCC trước khi reset bảng cha toà nhà.
- **Kiểm chứng:** Chạy trực tiếp trên PostgreSQL cô lập: **8/8 tests passed**.

---

## 3. THỐNG KÊ CHI TIẾT ENDPOINTS, HTTP METHODS & TẬP TRẠNG THÁI

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
- `DELETE /api/tai-san/{id}`: Xóa tài sản theo ID tài sản (`tai_san_id`) khỏi phòng (Quyền: `CHU`, `QUAN_LY`).
- `GET /api/hop-dong/{hopDongId}/bien-ban-tai-san`: Danh sách biên bản bàn giao (Quyền: `CHU`, `QUAN_LY`, `NGUOI_THUE` của hợp đồng).
- `POST /api/hop-dong/{hopDongId}/bien-ban-tai-san`: Lập biên bản nhận phòng / trả phòng (Quyền: `CHU`, `QUAN_LY`).
- **Cơ chế Snapshot tài sản:**
  - `ten_tai_san`: Được snapshot trực tiếp từ cơ sở dữ liệu (`TAI_SAN_PHONG`).
  - `tinh_trang_luc_giao`, `tinh_trang_luc_tra`: Được ghi nhận theo đánh giá hiện trạng thực tế do client gửi lên tại thời điểm lập biên bản.

### Huỷ & Thay thế Hoá đơn
- `POST /api/hoa-don/{id}/huy`: Huỷ hoá đơn (khoá `FOR UPDATE OF hd`, chặn khi có tiền thu thực tế `daThu.signum() != 0`).
- `POST /api/hoa-don/{id}/thay-the`: Thay thế hoá đơn (khoá `FOR UPDATE OF h,hd`, chặn khi hoá đơn cũ đã có thanh toán).

---

## 4. KẾT QUẢ KIỂM CHỨNG TOÀN DIỆN

### 4.1. Kiểm thử ĐÃ CHẠY VÀ ĐẠT TRÊN MÔI TRƯỜNG THỰC TẾ:
| Hạng mục kiểm thử | Công cụ / Môi trường | Số lượng test | Kết quả |
| :--- | :--- | :--- | :--- |
| **Frontend Test Suite** | Vitest 4.1.11 | 31 suites / 219 tests | **219/219 PASSED (100%)** |
| **Frontend Production Build** | Vite + TypeScript (`tsc -b && vite build`) | Toàn bộ ứng dụng | **0 lỗi TypeScript, 0 lỗi bundle** |
| **Migration Upgrade History Test** | JUnit 5 + PostgreSQL 17 Portable | 4 tests nâng cấp (4 lịch sử) | **4/4 PASSED (100%)** |
| **Concurrency Integration Test** | JUnit 5 + PostgreSQL 17 Portable | 5 tests đa luồng (Latch) | **5/5 PASSED (100%)** |
| **Operational Tasks (PCCC)** | JUnit 5 + PostgreSQL 17 Portable | 8 tests integration | **8/8 PASSED (100%)** |
| **Money Schema ArchUnit** | JUnit 5 + PostgreSQL 17 Portable | 2 tests schema | **2/2 PASSED (100%)** |
| **HopDongService Test** | Mockito / JUnit 5 | 10 tests | **10/10 PASSED (100%)** |
| **TaiSanService Test** | Mockito / JUnit 5 | 7 tests | **7/7 PASSED (100%)** |
| **HuyHoaDonNhapService Test**| Mockito / JUnit 5 | 3 tests | **3/3 PASSED (100%)** |
| **PublicPortalService Test** | Mockito / JUnit 5 | 4 tests | **4/4 PASSED (100%)** |
| **HopDongPdfService Test** | iText / JUnit 5 | 3 tests | **3/3 PASSED (100%)** |

### 4.2. Lưu ý kiểm thử chưa thực hiện:
- Kiểm tra trực quan layout đồ hoạ trang in PDF (Visual layout QA) của tệp xuất PDF hợp đồng chưa được kiểm tra bằng mắt người dùng; mới chỉ kiểm tra qua nội dung text trích xuất tự động bằng thư viện `PdfTextExtractor`.
