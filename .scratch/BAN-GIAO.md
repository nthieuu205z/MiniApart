# BIÊN BẢN BÀN GIAO TIẾP QUẢN DỰ ÁN (DÀNH CHO CODEX REVIEW)

> **Thời điểm bàn giao:** Sau khi hoàn thành toàn diện các phát hiện review độc lập (P1, P2, P3).  
> **Trạng thái hệ thống:**  
> - **PostgreSQL 17 Portable:** Đang chạy tại port `5432` (`miniapart_db`)  
> - **Spring Boot Backend:** Đang chạy tại `http://localhost:8080/`  
> - **Vite Frontend Dev Server:** Đang chạy tại `http://localhost:5173/`  
> - **Frontend Test Suite:** `vitest run --run` đạt **31/31 suites passed (219/219 tests passed 100%)**  
> - **Frontend Build:** `npm run build` (`tsc -b && vite build`) thành công 100% (0 lỗi TypeScript, 0 lỗi bundle)  
> - **Backend Test Suites (chạy trên PostgreSQL cô lập, 55/55 passed 100%):**
>   - `MigrationUpgradeHistoryIntegrationTest`: **10/10 passed** (bao quát toàn diện 10 kịch bản: clean DB, pre-V49, 046d45a, d2e3d69, e1 pending canonical, e2 pending canonical, f checksum lạ fail, g khởi động lần hai idempotent, h tương thích V57 tương lai, i nghiệp vụ biên bản tài sản sau nâng cấp)
>   - `DemoDataSeederIntegrationTest`: **3/3 passed** (chạy lần 1 và 2 idempotent không nhân bản, tắt demo hoàn toàn sạch, transaction rollback an toàn khi lỗi giữa chừng)
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
> - **Commit reviewer đã kiểm tra:** `e6976cc`  
> - **Commit hoàn tất khắc phục:** `git rev-parse --short HEAD`

---

## 1. PHƯƠNG ÁN NÂNG CẤP MIGRATION & SEED DỮ LIỆU PRODUCTION (ROOT CAUSE FIX)

### 1.1. Ma trận 4 lịch sử cơ sở dữ liệu thực tế & Cơ chế `FlywayUpgradeStrategy`:
Hệ thống triển khai `FlywayUpgradeStrategy` (`com.prj1.ccm.config.FlywayUpgradeStrategy` thực thi `FlywayMigrationStrategy` của Spring Boot) nhằm tự động kiểm tra lịch sử schema hiện tại qua bảng `flyway_schema_history` và áp dụng chiến lược nâng cấp động an toàn:

1. **Kiến trúc Single Source of Truth (Xóa bỏ thư mục trùng lặp `migration_common`):**
   - Không duy trì thư mục `migration_common` song song để tránh nguy cơ drift mã nguồn.
   - Toàn bộ 56 migration chính tắc được lưu trữ duy nhất tại `classpath:db/migration/` (`V1`..`V56`). Cả `V49` và `V55` chính tắc đều là **Pure DDL**, không chứa bất kỳ câu lệnh chèn dữ liệu mẫu/demo nào.
   - Các biến thể lịch sử xác thực được trích xuất trực tiếp từ Git blobs gốc vào `classpath:db/migration_variants/`:
     - `v046d45a`: `V49` (CRC32: `-1020674094`), `V55` (CRC32: `-1007063486`)
     - `vd2e3d69`: `V49` (CRC32: `676094527`), `V55` (CRC32: `52954075`)

2. **Quy tắc phân biệt APPLIED Migration vs PENDING Migration:**
   - **Đã áp dụng (Applied):** Nếu DB đã từng chạy V49/V55 của `046d45a` hoặc `d2e3d69`, `FlywayUpgradeStrategy` tạo thư mục tạm thời, sao chép toàn bộ bộ migration chính tắc từ `classpath:db/migration/`, nhưng **chỉ ghi đè những phiên bản ĐÃ ÁP DỤNG** bằng tệp biến thể tương ứng để Flyway xác thực checksum khớp 100%.
   - **Chưa áp dụng (Pending):** Bất kỳ migration nào chưa chạy (ví dụ hệ thống dừng ở V50 hoặc V54 thì V55 là pending) **BẮT BUỘC giữ nguyên bản chính tắc (Pure DDL)**. Tuyệt đối không nạp tệp biến thể cũ cho migration pending, đảm bảo không bao giờ vô tình kích hoạt lại seed demo của phiên bản cũ vào database production.
   - **Migration tương lai (Forward Compatibility):** Bất kỳ migration mới nào trong tương lai (ví dụ `V57`) được đặt trong `classpath:db/migration/` đều tự động được phát hiện và áp dụng tiếp tục một cách trơn tru.

3. **Từ chối checksum không được hỗ trợ (Fail-Fast Validation):**
   - Nếu `flyway_schema_history` chứa checksum lạ không khớp bất kỳ bản chính tắc hay biến thể hợp lệ nào của `046d45a`/`d2e3d69`, hệ thống ném ngay `IllegalStateException` rõ ràng kèm mã phiên bản và giá trị checksum để ngăn chặn việc chạy sai lệch trên môi trường không xác định.
   - Tuyệt đối không can thiệp, không sửa đổi `flyway_schema_history`, không chạy `repair` và không tắt validation của Flyway.

4. **Ma trận xử lý 4 trạng thái DB:**
   - **Lịch sử 1 (Pre-V49 có dữ liệu thật):** Chạy `V49` và `V55` chính tắc (Pure DDL). Không xung đột unique `(toa_nha_id, so_phong)`, không gán sai giá vào ID dịch vụ thật, nâng cấp thành công lên `V56`.
   - **Lịch sử 2 (Đã áp dụng bản `046d45a` đến V55):** Khớp checksum biến thể `046d45a`, chạy tiếp `V56` thành công.
   - **Lịch sử 3 (Đã áp dụng bản `d2e3d69` đến V55):** Khớp checksum biến thể `d2e3d69`, chạy `V56` chuẩn hóa cột `tien_khautru` -> `tien_khau_tru` thành công.
   - **Lịch sử 4 (Clean DB):** Chạy trực tiếp từ `classpath:db/migration/` từ `V1` đến `V56`, hoàn toàn sạch dữ liệu demo.

### 1.2. Cơ chế Seed Demo & Audit đối soát an toàn:
- **Tách biệt vào component độc lập (`DemoDataSeeder.java`):**
  - Mặc định TẮT (`app.seed-demo=false`). Chỉ kích hoạt khi người dùng cấu hình tường minh `app.seed-demo=true`.
  - **Tạo dịch vụ và bảng giá an toàn:** Không bao giờ gán ID cứng 1..5. Truy vấn dịch vụ theo tên trên tòa nhà, tạo mới không ép ID nếu chưa có, và liên kết bảng giá vào ID tự sinh thực tế.
  - **Bảo vệ phòng thật của khách hàng:** Dữ liệu phòng demo được gắn tiền tố `[DEMO]` trong trường `mo_ta` và kiểm tra `NOT EXISTS (SELECT 1 FROM PHONG WHERE toa_nha_id = ... AND so_phong = ...)`.
  - **Bảo vệ tài sản thật:** Chỉ gắn tài sản demo vào phòng có `mo_ta LIKE '[DEMO]%'` và có kiểm tra `NOT EXISTS (SELECT 1 FROM TAI_SAN_PHONG WHERE phong_id = p.id AND ten_tai_san = ...)`. Tuyệt đối không gắn vào phòng thật của khách hàng.
  - **Tính Idempotent (Chạy lại không nhân bản):** Chạy seeder 1 lần hay nhiều lần đều cho ra cùng một số lượng bản ghi duy nhất, không tạo bản ghi trùng lặp.
  - **Biên giới Giao dịch (@Transactional):** Toàn bộ quá trình seed được bao bọc trong một transaction duy nhất. Bất kỳ lỗi nào phát sinh giữa chừng sẽ rollback toàn bộ, không để lại dữ liệu rác dở dang.
- **Audit đối soát an toàn dữ liệu mẫu đã chèn (`DemoDataReconciliationService.java`):**
  - Dịch vụ **Read-Only**: Chỉ thực hiện truy vấn và trả về danh sách ứng viên đối soát `List<UngVienDoiSoat>` kèm đầy đủ ngữ cảnh nghiệp vụ (số hợp đồng, chỉ số dịch vụ, yêu cầu sửa chữa).
  - Tuyệt đối không tự ý xóa hay lưu trữ (archive) dữ liệu của khách hàng dựa trên suy đoán hoặc tên phòng.

---

## 2. CHI TIẾT CÁC PHÁT HIỆN REVIEW ĐÃ KHẮC PHỤC (P1 & P2)

### 2.1. Concurrency Race: Hủy hoá đơn & Thu tiền đồng thời (P1.4)
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/billing/TinhHoaDonRepository.java`
  - `backend/src/main/java/com/prj1/ccm/billing/ThanhToanRepository.java`
  - `backend/src/main/java/com/prj1/ccm/billing/HuyHoaDonNhapService.java`
  - `backend/src/main/java/com/prj1/ccm/billing/ThayTheHoaDonController.java`
  - `backend/src/main/java/com/prj1/ccm/billing/calc/QuyTacTrangThaiHoaDon.java`
- **Hành vi sau sửa:**
  - `TinhHoaDonRepository.khoaHoaDonTrongPhamVi`: Tách statement khoá hoá đơn riêng biệt (`FOR UPDATE OF hd`). Sau khi khoá thành công, mở một statement đọc mới để tính toán chính xác tổng tiền đã thu `da_thu` trên snapshot mới nhất trong transaction.
  - `ThanhToanRepository`: Đồng bộ cú pháp khoá chỉ trên hàng hoá đơn `FOR UPDATE OF hd`, tránh lock lan truyền sang `HOP_DONG` hay `PHONG`.
  - `QuyTacTrangThaiHoaDon`: Khi có bút toán đối ứng đưa số tiền thực thu về `<= 0`, cho phép hoàn trạng thái hoá đơn về `DA_PHAT_HANH` (hoặc `QUA_HAN` nếu quá hạn thanh toán) thông qua `ghiNhanThanhToanDoiUng`. Từ đó hoá đơn được phép chuyển tiếp sang `DA_HUY`.
- **Kiểm chứng:** Test suite `HuyVaThanhToanConcurrencyIntegrationTest` chạy trên PostgreSQL cô lập (**5/5 passed**).

### 2.2. Căn cứ quyết toán hợp đồng & Audit Trail khấu trừ (P2.5 & P2.6)
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongRepository.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/YeuCauThanhLy.java`
  - `backend/src/main/java/com/prj1/ccm/nguoithue/NhatKyThaoTacRepository.java`
  - `frontend/src/HopDongThaoTac.tsx`
- **Hành vi sau sửa:**
  - `HopDongService.thanhLy`:
    1. Xác thực `bienBanId` phải thuộc đúng hợp đồng và đúng phòng (`phongId`).
    2. Bắt buộc loại biên bản phải là `TRA_PHONG` (ném `400 BAD_REQUEST` nếu gửi biên bản `NHAN_PHONG`).
    3. Nếu không truyền `bienBanId` nhưng trong database đã tồn tại biên bản `TRA_PHONG` của hợp đồng đó, từ chối thanh lý và yêu cầu cung cấp căn cứ biên bản.
    4. Nếu số tiền khấu trừ trong yêu cầu thanh lý lệch với `tong_tien_khau_tru` trong biên bản (kể cả biên bản > 0 và quyết toán = 0), bắt buộc client phải gửi `xacNhanChenhLech = true` và `lyDo` không được để trống.
    5. Ghi nhận audit trail kiên cố vào `NHAT_KY_THAO_TAC` (`hanh_dong = 'THANH_LY'`, lưu toàn diện `bienBanId`, `bbKhauTru`, `khauTruQuyetToan`, `chenhLech`, `xacNhanChenhLech`, `lyDo`, `hoaDonCuoiId`, `thoiDiem`). Thao tác ghi log thất bại sẽ ném exception làm rollback toàn bộ transaction thanh lý.
  - `HopDongThaoTac.tsx`: Form thanh lý đối chiếu số tiền khấu trừ với biên bản trả phòng đã lưu. Nếu khác nhau, yêu cầu người dùng tích chọn checkbox "Xác nhận số tiền khấu trừ khác biên bản bàn giao" và nhập lý do mới kích hoạt nút "Thanh lý hợp đồng".
- **Kiểm chứng:** `HopDongServiceTest` (**10/10 passed**).

### 2.3. Khắc phục Race / Stale Response & Trạng thái Mutation Loading trong Quản lý tài sản (P2.6)
- **Files:**
  - `frontend/src/QuanLyTaiSanPhong.tsx`
  - `frontend/src/QuanLyTaiSanPhong.test.tsx`
- **Hành vi sau sửa:**
  - Áp dụng token thế hệ mutation `mutationIdRef` kết hợp với `requestIdRef` và cờ huỷ `isMountedRef`.
  - Khi phòng hoặc hợp đồng thay đổi (`phongId`, `hopDongId`), `mutationIdRef.current++` được tăng ngay lập tức và `dangLuu` được reset về `false`.
  - Mọi thao tác thêm tài sản, xóa tài sản, lập biên bản đều gắn liền với thế hệ mutation hiện tại: nếu người dùng chuyển phòng trong lúc mutation đang gửi lên server, mutation cũ bị cô lập hoàn toàn, không hiển thị lỗi rò rỉ sang phòng mới và không làm đơ nút bấm của phòng mới.
- **Kiểm chứng:** `QuanLyTaiSanPhong.test.tsx` (**6/6 passed**).

### 2.4. Chặn gian lận/bỏ qua đơn giá dịch vụ bậc thang (P2.9)
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/test/java/com/prj1/ccm/hopdong/HopDongServiceTest.java`
- **Hành vi sau sửa:** Đưa nhánh `dichVu.cheDoGia() == BAC_THANG` lên kiểm tra đầu tiên. Bắt buộc dịch vụ bậc thang phải có bảng giá bậc thang hiệu lực tại thời điểm tạo hợp đồng, ném `400 BAD_REQUEST` nếu thiếu bảng giá, kể cả khi client truyền `donGiaApDung`.
- **Kiểm chứng:** `HopDongServiceTest` (**10/10 passed**).

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
- **Hành vi sau sửa:** Đồng bộ câu lệnh SQL insert vào `PCCC_THIET_BI` với schema chuẩn (`ten, vi_tri, han_kiem_dinh`). Bổ sung xoá bảng con PCCC trước khi reset bảng cha toà nhà.
- **Kiểm chứng:** Chạy trực tiếp trên PostgreSQL cô lập (**8/8 passed**).

---

## 3. BẢNG TỔNG HỢP KẾT QUẢ KIỂM CHỨNG TOÀN DIỆN

| Bộ kiểm thử | Phạm vi / Mục tiêu kiểm chứng | Số lượng tests | Kết quả |
| :--- | :--- | :--- | :--- |
| **Frontend Test Suite** | Vitest 4.1.11 (`QuanLyTaiSanPhong`, `App`, `CongNoBaoCao`, `TieuThuBaoCao`, v.v.) | 31 suites / 219 tests | **219/219 PASSED (100%)** |
| **Frontend Production Build** | TypeScript compiler + Vite bundler (`tsc -b && vite build`) | Toàn bộ ứng dụng React | **PASSED (0 errors)** |
| **Migration Upgrade History Test** | `MigrationUpgradeHistoryIntegrationTest` (10 test cases a -> i bao quát 4 kịch bản DB, pending canonical, fail fast checksum lạ, V57 tương lai) | 10 tests | **10/10 PASSED (100%)** |
| **Demo Data Seeder Integration Test** | `DemoDataSeederIntegrationTest` (Idempotent lần 1 & 2, demo tắt không tạo rác, rollback giao dịch an toàn) | 3 tests | **3/3 PASSED (100%)** |
| **Concurrency Integration Test** | `HuyVaThanhToanConcurrencyIntegrationTest` (Đa luồng hủy/thanh toán hóa đơn, đối ứng tiền) | 5 tests | **5/5 PASSED (100%)** |
| **Operational Tasks (PCCC)** | `BangViecVanHanhIntegrationTest` | 8 tests | **8/8 PASSED (100%)** |
| **Money Schema ArchUnit** | `MoneySchemaRegressionTest` | 2 tests | **2/2 PASSED (100%)** |
| **HopDongService Test** | Hợp đồng, dịch vụ bậc thang, căn cứ quyết toán và audit trail | 10 tests | **10/10 PASSED (100%)** |
| **TaiSanService Test** | Phân quyền tài sản theo tòa/phòng, snapshot từ database, khấu trừ | 7 tests | **7/7 PASSED (100%)** |
| **HuyHoaDonNhapService Test** | Quy tắc hủy hóa đơn và kiểm soát số tiền đã thu | 3 tests | **3/3 PASSED (100%)** |
| **PublicPortalService Test** | Scope phân quyền tòa nhà cho lịch hẹn xem phòng | 4 tests | **4/4 PASSED (100%)** |
| **HopDongPdfService Test** | Xuất văn bản hợp đồng PDF chính xác | 3 tests | **3/3 PASSED (100%)** |

---

## 4. CÁC LỆNH KIỂM CHỨNG ĐỘC LẬP DÀNH CHO REVIEWER

Để kiểm chứng toàn bộ hệ thống trên môi trường local:

```powershell
# 1. Khởi động PostgreSQL Daemon (nếu chưa chạy)
& "d:\vscode\miniapart\pgsql\pgsql\bin\postgres.exe" -D "d:\vscode\miniapart\pgsql\data"

# 2. Chạy toàn bộ bộ kiểm thử Backend (bao gồm cả integration và unit tests):
Set-Location D:\vscode\miniapart\MiniApart-main\backend
$env:MINIAPART_TEST_JDBC_URL = "jdbc:postgresql://localhost:5432/miniapart"
.\gradlew.bat test --tests "*MoneySchemaRegressionTest" --tests "*HopDongServiceTest" --tests "*TaiSanServiceTest" --tests "*HuyHoaDonNhapServiceTest" --tests "*PublicPortalServiceTest" --tests "*HopDongPdfServiceTest" --tests "*BangViecVanHanhIntegrationTest" --tests "*HuyVaThanhToanConcurrencyIntegrationTest" --tests "*MigrationUpgradeHistoryIntegrationTest" --tests "*DemoDataSeederIntegrationTest" --rerun-tasks

# 3. Chạy toàn bộ bộ kiểm thử Frontend:
Set-Location D:\vscode\miniapart\MiniApart-main\frontend
npm run test -- --run

# 4. Kiểm tra Frontend Build:
npm run build
```
