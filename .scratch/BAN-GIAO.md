# BIÊN BẢN BÀN GIAO TIẾP QUẢN DỰ ÁN (DÀNH CHO CODEX REVIEW)

> **Thời điểm bàn giao:** Sau khi hoàn tất khắc phục lỗi P2 cuối cùng về tương thích đa schema (multi-tenant / multi-schema) cho cột khấu trừ tài sản trên mốc `825d938`.  
> **Trạng thái hệ thống:**  
> - **PostgreSQL 17 Portable:** Đang chạy tại port `5432` (`miniapart_db`)  
> - **Spring Boot Backend:** Đang chạy tại `http://localhost:8080/`  
> - **Vite Frontend Dev Server:** Đang chạy tại `http://localhost:5173/`  
> - **Frontend Test Suite:** `vitest run --run` đạt **31/31 suites passed (219/219 tests passed 100%)**  
> - **Frontend Build:** `npm run build` (`tsc -b && vite build`) thành công 100% (0 lỗi TypeScript, 0 lỗi bundle)  
> - **Backend Test Suites (chạy trên PostgreSQL cô lập, 65/65 passed 100%):**
>   - `MigrationUpgradeHistoryIntegrationTest`: **17/17 passed** (bao quát toàn diện 17 kịch bản: clean DB, pre-V49, 046d45a, d2e3d69, e1 pending canonical, e2 pending canonical, f checksum lạ fail-fast, g khởi động lần hai idempotent, h tương thích V58 tương lai, i nghiệp vụ biên bản tài sản sau nâng cấp, j defaultSchema khác public, k custom history table name, l bảng lịch sử tồn tại nhưng đọc lỗi fail-fast, m đa schema A chuẩn B lỗi bảo toàn dữ liệu & repo đọc/ghi, n đảo thứ tự nâng cấp B trước A sau, o cả 2 cột cùng tồn tại không xung đột hợp nhất dữ liệu, p cả 2 cột cùng tồn tại có xung đột giá trị fail-fast)
>   - `DemoDataSeederIntegrationTest`: **6/6 passed** (kiểm chứng Spring Bean Proxy thật, @ConditionalOnProperty qua ApplicationContextRunner, @Transactional rollback toàn bộ dữ liệu nghiệp vụ qua trigger lỗi PostgreSQL, idempotency, bảo toàn 100% dịch vụ thật trùng tên có giá quá khứ/tương lai/chưa có giá/trùng nhiều tên, candidate reconciliation read-only)
>   - `HuyVaThanhToanConcurrencyIntegrationTest`: **5/5 passed**
>   - `BangViecVanHanhIntegrationTest`: **8/8 passed**
>   - `MoneySchemaRegressionTest`: **2/2 passed**
>   - `HopDongServiceTest`: **10/10 passed**
>   - `TaiSanServiceTest`: **7/7 passed**
>   - `HuyHoaDonNhapServiceTest`: **3/3 passed**
>   - `PublicPortalServiceTest`: **4/4 passed**
>   - `HopDongPdfServiceTest`: **3/3 passed**
> - **Mốc commit trước đợt sửa:** `046d45a`  
> - **Commit sửa trung gian:** `d2e3d69` $\rightarrow$ `cceb3a0` $\rightarrow$ `f533e88` $\rightarrow$ `e6976cc` $\rightarrow$ `208cd93` $\rightarrow$ `825d938`  
> - **Commit hoàn tất khắc phục:** `HEAD` (`git log -1`)

---

## 1. PHƯƠNG ÁN NÂNG CẤP MIGRATION & SEED DỮ LIỆU PRODUCTION (ROOT CAUSE FIX)

### 1.1. Ma trận lịch sử cơ sở dữ liệu thực tế & Cơ chế `FlywayUpgradeStrategy`:
Hệ thống triển khai `FlywayUpgradeStrategy` (`com.prj1.ccm.config.FlywayUpgradeStrategy` thực thi `FlywayMigrationStrategy` của Spring Boot) nhằm tự động kiểm tra lịch sử schema hiện tại qua bảng lịch sử Flyway và áp dụng chiến lược nâng cấp động an toàn:

1. **Kiến trúc Single Source of Truth:**
   - Không duy trì thư mục `migration_common` song song để tránh nguy cơ drift mã nguồn.
   - Toàn bộ 57 migration chính tắc được lưu trữ duy nhất tại `classpath:db/migration/` (`V1`..`V57`). Cả `V49` và `V55` chính tắc đều là **Pure DDL**, không chứa bất kỳ câu lệnh chèn dữ liệu mẫu/demo nào.
   - Các biến thể lịch sử xác thực được trích xuất trực tiếp từ Git blobs gốc vào `classpath:db/migration_variants/`:
     - `v046d45a`: `V49` (CRC32: `-1020674094`), `V55` (CRC32: `-1007063486`)
     - `vd2e3d69`: `V49` (CRC32: `676094527`), `V55` (CRC32: `52954075`)

2. **Đọc đúng schema và bảng history theo cấu hình Flyway (Quote Identifier):**
   - Tự động trích xuất `defaultSchema`, `schemas`, và `table` từ `Configuration` của Flyway (mặc định schema connection hoặc `public`, bảng `flyway_schema_history`).
   - Quote identifier chuẩn theo cú pháp SQL: `"schema"."table"` (ví dụ: `"custom_tenant"."flyway_schema_history"` hoặc `"public"."my_custom_history"`).
   - **Phân biệt rõ ràng:**
     - Nếu bảng history chưa tồn tại (kiểm tra qua `information_schema.tables`): trả về kết quả rỗng để database mới thực thi trực tiếp bộ migration canonical.
     - Nếu bảng history ĐÃ tồn tại nhưng truy vấn đọc thất bại: ném ngay `IllegalStateException` rõ ràng kèm thông điệp lỗi gốc, **tuyệt đối không nuốt lỗi hoặc che giấu thành database mới**.

3. **Quy tắc phân biệt APPLIED Migration vs PENDING Migration:**
   - **Đã áp dụng (Applied):** Nếu DB đã từng chạy V49/V55 của `046d45a` hoặc `d2e3d69`, `FlywayUpgradeStrategy` tạo thư mục tạm thời, sao chép toàn bộ bộ migration chính tắc từ `classpath:db/migration/`, nhưng **chỉ ghi đè những phiên bản ĐÃ ÁP DỤNG** bằng tệp biến thể tương ứng để Flyway xác thực checksum khớp 100%.
   - **Chưa áp dụng (Pending):** Bất kỳ migration nào chưa chạy (ví dụ hệ thống dừng ở V50 hoặc V54 thì V55 là pending) **BẮT BUỘC giữ nguyên bản chính tắc (Pure DDL)**. Tuyệt đối không nạp tệp biến thể cũ cho migration pending, đảm bảo không bao giờ vô tình kích hoạt lại seed demo của phiên bản cũ vào database production.
   - **Migration tương lai (Forward Compatibility):** Bất kỳ migration mới nào trong tương lai (ví dụ `V58`) được đặt trong `classpath:db/migration/` đều tự động được phát hiện và áp dụng tiếp tục một cách trơn tru.

4. **Từ chối checksum không được hỗ trợ (Fail-Fast Validation):**
   - Nếu bảng lịch sử chứa checksum lạ không khớp bất kỳ bản chính tắc hay biến thể hợp lệ nào của `046d45a`/`d2e3d69`, hệ thống ném ngay `IllegalStateException` rõ ràng kèm mã phiên bản và giá trị checksum để ngăn chặn việc chạy sai lệch trên môi trường không xác định.
   - Tuyệt đối không can thiệp, không sửa đổi `flyway_schema_history`, không chạy `repair` và không tắt validation của Flyway.

5. **Khắc phục triệt để lỗi unscoped schema ở V56 qua Forward Migration V57 (`V57__handover_column_schema_scoped_fix.sql`):**
   - **Bối cảnh & Vấn đề gốc:** `V56__handover_schema_compatibility.sql:5–12` kiểm tra `information_schema.columns` nhưng không lọc `table_schema = CURRENT_SCHEMA`. Trong môi trường đa tenant / đa schema (multi-schema): nếu Schema A đã có cột chuẩn `tien_khau_tru`, trong khi Schema B còn cột lỗi `tien_khautru` từ `d2e3d69`, khi V56 chạy trên Schema B, nó tìm thấy cột `tien_khau_tru` ở Schema A nên bỏ qua việc rename ở Schema B. Flyway ghi nhận success nhưng Schema B vẫn giữ cột cũ, làm hỏng các truy vấn của `TaiSanRepository` trên Schema B.
   - **Nguyên tắc giải quyết:**
     - Không chỉnh sửa file `V56` đã phát hành để giữ nguyên checksum và lịch sử Flyway.
     - Tạo forward migration `V57__handover_column_schema_scoped_fix.sql`:
       - Chỉ kiểm tra và thao tác trên đúng schema đích (`cur_schema text := current_schema()`).
       - Dùng `format('%I.%I', cur_schema, 'chi_tiet_bien_ban_tai_san')` để quote identifier chính xác, bảo đảm tính an toàn SQL injection và tên schema/bảng đặc thù.
       - **Trường hợp 1 (Cả 2 cột cùng tồn tại):** Kiểm tra xung đột giá trị giữa 2 cột (`tien_khautru IS NOT NULL AND tien_khau_tru IS NOT NULL AND tien_khautru <> 0 AND tien_khau_tru <> 0 AND tien_khautru <> tien_khau_tru`). Nếu có xung đột -> ném `RAISE EXCEPTION` rõ ràng ngăn chặn ghi đè/mất mát dữ liệu. Nếu không xung đột -> hợp nhất dữ liệu từ `tien_khautru` sang `tien_khau_tru` (nơi `tien_khau_tru IS NULL OR tien_khau_tru = 0`) rồi DROP cột cũ `tien_khautru`.
       - **Trường hợp 2 (Cột cũ có, cột chuẩn chưa có):** RENAME `tien_khautru` thành `tien_khau_tru` bảo toàn 100% dữ liệu.
       - **Trường hợp 3 (Cột chuẩn đã có):** Giữ nguyên, không làm gì.

### 1.2. Cơ chế Seed Demo & Audit đối soát an toàn:
- **Tách biệt vào component độc lập (`DemoDataSeeder.java`):**
  - Mặc định TẮT (`app.seed-demo=false`). Chỉ kích hoạt khi người dùng cấu hình tường minh `app.seed-demo=true` (`@ConditionalOnProperty`).
  - **Tách biệt hoàn toàn dịch vụ demo khỏi dịch vụ thật:**
    - Không suy diễn nguồn demo từ tên, ID hay việc thiếu bảng giá ngày 2026-01-01.
    - Khi kiểm tra dịch vụ theo tên trên toà nhà: nếu đã tồn tại bất kỳ dịch vụ nào cùng tên (`SELECT id FROM DICH_VU WHERE toa_nha_id = ... AND ten = ?`), hệ thống **BỎ QUA HOÀN TOÀN**. Tuyệt đối không sửa thuộc tính của dịch vụ thật, không gán giá demo vào dịch vụ thật (kể cả dịch vụ đã có giá từ quá khứ 2025-12-01, dịch vụ chưa có bảng giá, dịch vụ có giá tương lai 2026-06-01, hay dịch vụ bị trùng nhiều tên).
    - Chỉ khi chưa tồn tại dịch vụ cùng tên mới tạo dịch vụ demo mới và chèn bảng giá ban đầu cho ID tự sinh đó.
  - **Bảo vệ phòng thật của khách hàng:** Dữ liệu phòng demo được gắn tiền tố `[DEMO]` trong trường `mo_ta` và kiểm tra `NOT EXISTS (SELECT 1 FROM PHONG WHERE toa_nha_id = ... AND so_phong = ...)`.
  - **Bảo vệ tài sản thật:** Chỉ gắn tài sản demo vào phòng có `mo_ta LIKE '[DEMO]%'` và có kiểm tra `NOT EXISTS (SELECT 1 FROM TAI_SAN_PHONG WHERE phong_id = p.id AND ten_tai_san = ...)`. Tuyệt đối không gắn vào phòng thật của khách hàng.
  - **Tính Idempotent (Chạy lại không nhân bản):** Chạy seeder 1 lần hay nhiều lần đều cho ra cùng một số lượng bản ghi duy nhất, không tạo bản ghi trùng lặp.
  - **Biên giới Giao dịch (@Transactional):** Toàn bộ quá trình seed được bao bọc trong một transaction duy nhất (`@Transactional(rollbackFor = Exception.class)`). Bất kỳ lỗi nào phát sinh giữa chừng sẽ rollback toàn bộ dữ liệu nghiệp vụ (toà nhà, phòng, dịch vụ, bảng giá, tài sản), không để lại dữ liệu rác dở dang.
- **Audit đối soát an toàn dữ liệu mẫu đã chèn (`DemoDataReconciliationService.java`):**
  - Dịch vụ **Read-Only**: Chỉ thực hiện truy vấn và trả về danh sách ứng viên đối soát `List<UngVienDoiSoat>` kèm đầy đủ ngữ cảnh nghiệp vụ (số hợp đồng, chỉ số dịch vụ, yêu cầu sửa chữa).
  - Tuyệt đối không tự ý xóa hay lưu trữ (archive) dữ liệu của khách hàng dựa trên suy đoán hoặc tên phòng.

---

## 2. CHI TIẾT CÁC PHÁT HIỆN REVIEW ĐÃ KHẮC PHỤC (P1, P2 & P3)

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

### 2.7. Tương thích Đa Schema & Xử lý Cột khấu trừ (P2 - Mốc 825d938)
- **Files:**
  - `backend/src/main/resources/db/migration/V57__handover_column_schema_scoped_fix.sql`
  - `backend/src/test/java/com/prj1/ccm/architecture/MigrationUpgradeHistoryIntegrationTest.java`
- **Hành vi sau sửa:**
  - Bổ sung `V57` forward migration lọc đúng `table_schema = current_schema()` và quote identifier bằng `%I.%I`.
  - Bảo toàn 100% dữ liệu tiền khấu trừ ở schema B khi nâng cấp, kể cả khi schema A đã có cột chuẩn.
  - Đọc/ghi biên bản qua repository `TaiSanRepository` trên schema B hoạt động trơn tru.
  - Tự động hợp nhất dữ liệu an toàn khi cả hai cột cùng tồn tại mà không xung đột; fail-fast rõ ràng khi có xung đột giá trị.
- **Kiểm chứng:** `MigrationUpgradeHistoryIntegrationTest` (17/17 passed), gồm các test cases `m`, `n`, `o`, `p`.

---

## 3. BẢNG TỔNG HỢP KẾT QUẢ KIỂM CHỨNG TOÀN DIỆN

| Bộ kiểm thử | Phạm vi / Mục tiêu kiểm chứng | Số lượng tests | Kết quả |
| :--- | :--- | :--- | :--- |
| **Frontend Test Suite** | Vitest 4.1.11 (`QuanLyTaiSanPhong`, `App`, `CongNoBaoCao`, `TieuThuBaoCao`, v.v.) | 31 suites / 219 tests | **219/219 PASSED (100%)** |
| **Frontend Production Build** | TypeScript compiler + Vite bundler (`tsc -b && vite build`) | Toàn bộ ứng dụng React | **PASSED (0 errors)** |
| **Migration Upgrade History Test** | `MigrationUpgradeHistoryIntegrationTest` (17 test cases a -> p bao quát toàn bộ kịch bản đơn/đa schema, legacy 046d45a & d2e3d69, fail fast, idempotent, V58 tương lai) | 17 tests | **17/17 PASSED (100%)** |
| **Demo Data Seeder Integration Test** | `DemoDataSeederIntegrationTest` (Spring AOP proxy bean, ConditionalOnProperty, Transactional Rollback thực tế qua trigger lỗi PostgreSQL, idempotency, bảo toàn 100% dịch vụ thật cùng tên có giá quá khứ/chưa có giá/giá tương lai/trùng nhiều tên) | 6 tests | **6/6 PASSED (100%)** |
| **Concurrency Integration Test** | `HuyVaThanhToanConcurrencyIntegrationTest` (Đa luồng hủy/thanh toán hóa đơn, đối ứng tiền) | 5 tests | **5/5 PASSED (100%)** |
| **Operational Tasks (PCCC)** | `BangViecVanHanhIntegrationTest` | 8 tests | **8/8 PASSED (100%)** |
| **Money Schema ArchUnit** | `MoneySchemaRegressionTest` | 2 tests | **2/2 PASSED (100%)** |
| **HopDongService Test** | Hợp đồng, dịch vụ bậc thang, căn cứ quyết toán và audit trail | 10 tests | **10/10 PASSED (100%)** |
| **TaiSanService Test** | Phân quyền tài sản theo tòa/phòng, snapshot từ database, khấu trừ | 7 tests | **7/7 PASSED (100%)** |
| **HuyHoaDonNhapService Test** | Quy tắc hủy hóa đơn và kiểm soát số tiền đã thu | 3 tests | **3/3 PASSED (100%)** |
| **PublicPortalService Test** | Scope phân quyền tòa nhà cho lịch hẹn xem phòng | 4 tests | **4/4 PASSED (100%)** |
| **HopDongPdfService Test** | Xuất văn bản hợp đồng PDF chính xác | 3 tests | **3/3 PASSED (100%)** |

**Tổng cộng kiểm thử Backend: 65/65 tests PASSED 100% (0 failures, 0 errors, 0 skipped).**

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
