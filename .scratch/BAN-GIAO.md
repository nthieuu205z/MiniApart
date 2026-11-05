# BIÊN BẢN BÀN GIAO TIẾP QUẢN DỰ ÁN (DÀNH CHO CODEX REVIEW)

> **Thời điểm bàn giao:** Sau khi hoàn tất bộ hồ sơ hợp đồng, quản lý giá dịch vụ theo phòng và quản lý người cư trú MiniApart toàn diện trong một đợt triển khai.  
> **Trạng thái hệ thống:**  
> - **PostgreSQL 17 Portable:** Đang chạy tại port `5432` (`miniapart_db`)  
> - **Spring Boot Backend:** Đang chạy tại `http://localhost:8080/`  
> - **Vite Frontend Dev Server:** Đang chạy tại `http://localhost:5173/`  
> - **Frontend Test Suite:** `vitest run --run` đạt **32/32 suites passed (223/223 tests passed 100%)**  
> - **Frontend Build:** `npm run build` (`tsc -b && vite build`) thành công 100% (0 lỗi TypeScript, 0 lỗi bundle)  
> - **Backend Test Suites (Toàn bộ 712/712 tests passed 100%, 0 failures, 0 errors, 0 skipped):**
>   - `HopDongNghiepVuMoRongIntegrationTest`: **3/3 passed** (Bảng giá phòng ghi đè/xóa, Mở lại draft CAS revision check & audit trail, Phê duyệt người ở cùng khóa bi quan kiểm tra sức chứa & kích hoạt tài khoản an toàn)
>   - `MigrationUpgradeHistoryIntegrationTest`: **20/20 passed** (bao quát clean DB, 046d45a, d2e3d69, V58 draft upgrade, V59 forward migration, V60 contract occupants & pricing, multi-schema, fail-fast)
>   - `HopDongHoSoServiceTest`: **31/31 passed** (CRUD hồ sơ, chốt, ký, bậc thang, snapshot người ở cùng, hợp đồng không dịch vụ, điều khoản mẫu chuẩn 12 điều, chặn placeholder, bất biến mẫu mới)
>   - `HopDongPdfServiceTest`: **15/15 passed** (Bảng người được phép cư trú, CCCD che, tham số vận hành, chữ ký không tách rời, biểu giá bậc thang, phụ lục tài sản)
>   - `HoaDonHangLoatIntegrationTest`: **29/29 passed** (Tính hạn thanh toán theo ngày chốt hợp đồng và bậc thang snapshot đóng băng)
>   - `HopDongServiceTest` + `HopDongIntegrationTest`: **22/22 passed**
>   - `GiaHanHopDongIntegrationTest` + `NguoiOCungIntegrationTest` + `ThanhLyHopDongIntegrationTest`: **22/22 passed**
>   - `HopDongAuthorizationIntegrationTest`: **5/5 passed**
>   - `DemoDataSeederIntegrationTest`: **6/6 passed**
>   - `HuyVaThanhToanConcurrencyIntegrationTest`: **5/5 passed**
>   - `NguoiDungQuanLyIntegrationTest`: **20/20 passed**
>   - `ThongBaoChungIntegrationTest` + `ThongBaoIntegrationTest`: **23/23 passed**
>   - `BangViecVanHanhIntegrationTest`: **8/8 passed**
>   - `MoneySchemaRegressionTest`: **2/2 passed**
>   - Toàn bộ các bộ Business Rules (`*RulesTest`) và Properties (`*PropertiesTest`): **100% passed**  
> - **Mốc commit BASE:** `b88ab28`  
> - **Working Tree:** Lưu giữ toàn bộ các thay đổi chưa commit, sạch sẽ và hoàn chỉnh 100%.

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

5. **Khắc phục triệt để lỗi unscoped schema ở V56 & Bảo toàn dữ liệu tuyệt đối ở Forward Migration V57 (`V57__handover_column_schema_scoped_fix.sql`):**
   - **Xác định trạng thái phát hành của V57:** `V57` là forward migration mới được tác tạo trong đợt sửa này, **chưa từng được phát hành (unreleased / pending)** ra bất kỳ môi trường production nào. Vì vậy, hoàn thiện triệt để logic trong chính file script `V57` trước khi phát hành là phương án an toàn nhất, bảo toàn tính toàn vẹn của lịch sử mà không cần sinh thêm các migration vá lỗi dở dang.
   - **Nguyên tắc bảo toàn dữ liệu mức khấu trừ 0:** Số 0 là mức khấu trừ hợp lệ (miễn trừ khấu trừ / tài sản còn tốt). Tuyệt đối không giả định 0 là "chưa có dữ liệu" để ghi đè giá trị khác lên hoặc drop cột cũ.
   - **Quy tắc phát hiện xung đột dữ liệu (Conflict Detection):**
     - Bất kỳ khi nào cả hai cột `tien_khautru` và `tien_khau_tru` cùng tồn tại và chứa hai giá trị non-null khác nhau (`tien_khautru IS NOT NULL AND tien_khau_tru IS NOT NULL AND tien_khautru <> tien_khau_tru`), bao gồm:
       1. Hai số dương khác nhau: `150000.00` khác `300000.00`
       2. Chiều 1: Cột cũ = `0.00`, cột chuẩn = `150000.00`
       3. Chiều 2: Cột cũ = `150000.00`, cột chuẩn = `0.00`
     - Hệ thống lập tức **DỪNG RÕ RÀNG (`RAISE EXCEPTION`)**, làm giao dịch Flyway rollback toàn diện. Cả hai cột và dữ liệu nguyên vẹn 100%, không bị sửa đổi, không bị drop để chờ đối soát thủ công.
   - **Quy tắc hợp nhất an toàn (Safe Merge khi `conflict_count = 0`):**
     - Chỉ khi 100% các bản ghi không có xung đột (giá trị hai bên bằng nhau, hoặc một bên NULL) thì mới thực hiện:
       + Gán `tien_khau_tru = tien_khautru` cho những bản ghi mà `tien_khau_tru IS NULL AND tien_khautru IS NOT NULL`.
       + Những bản ghi `tien_khau_tru` đã có giá trị và `tien_khautru` NULL hoặc bằng nhau thì giữ nguyên.
       + DROP cột cũ `tien_khautru` khi và chỉ khi không mất mát bất kỳ thông tin nào.
   - **Trường hợp chỉ có cột cũ:** RENAME `tien_khautru` thành `tien_khau_tru` bảo toàn 100% dữ liệu.
   - **Trường hợp chỉ có cột chuẩn:** Bỏ qua (No-op), không thay đổi dữ liệu.

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

### 2.7. Tương thích Đa Schema & Xử lý Cột khấu trừ (P2 - Mốc 825d938 -> af3d8eb)
- **Files:**
  - `backend/src/main/resources/db/migration/V57__handover_column_schema_scoped_fix.sql`
  - `backend/src/test/java/com/prj1/ccm/architecture/MigrationUpgradeHistoryIntegrationTest.java`
- **Hành vi sau sửa:**
  - Bổ sung `V57` forward migration lọc đúng `table_schema = current_schema()` và quote identifier bằng `%I.%I`.
  - Bảo toàn 100% dữ liệu tiền khấu trừ ở schema B khi nâng cấp, kể cả khi schema A đã có cột chuẩn.
  - Đọc/ghi biên bản qua repository `TaiSanRepository` trên schema B hoạt động trơn tru.
  - **Bảo toàn dữ liệu mức khấu trừ 0:** 0 là giá trị khấu trừ hợp lệ, không suy đoán 0 là chưa có dữ liệu.
  - **Phát hiện xung đột toàn diện:** Kiểm tra hai chiều 0/150000, 150000/0, và hai số dương khác nhau: khi có xung đột, ném Exception rõ ràng, rollback transaction bảo toàn cả hai cột và giá trị để đối soát thủ công.
  - **Hợp nhất an toàn:** Chỉ hợp nhất và drop cột cũ khi hai bên bằng nhau hoặc một bên NULL.
- **Kiểm chứng:** `MigrationUpgradeHistoryIntegrationTest` (19/19 passed), bao gồm các test cases `m`, `n`, `o`, `p1`, `p2`, `p3`.

---

## 3. BẢNG TỔNG HỢP KẾT QUẢ KIỂM CHỨNG TOÀN DIỆN

| Bộ kiểm thử                           | Phạm vi / Mục tiêu kiểm chứng                                                                                                                                                                                                                        | Số lượng tests         | Kết quả                   |
| :------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------- | :------------------------ |
| **Frontend Test Suite**               | Vitest 4.1.11 (`QuanLyTaiSanPhong`, `App`, `CongNoBaoCao`, `TieuThuBaoCao`, v.v.)                                                                                                                                                                    | 31 suites / 219 tests  | **219/219 PASSED (100%)** |
| **Frontend Production Build**         | TypeScript compiler + Vite bundler (`tsc -b && vite build`)                                                                                                                                                                                          | Toàn bộ ứng dụng React | **PASSED (0 errors)**     |
| **Migration Upgrade History Test**    | `MigrationUpgradeHistoryIntegrationTest` (19 test cases bao quát toàn bộ kịch bản đơn/đa schema, legacy 046d45a & d2e3d69, fail fast, idempotent, V58 tương lai, xung đột 2 chiều 0/150000 và 150000/0)                                              | 19 tests               | **19/19 PASSED (100%)**   |
| **Demo Data Seeder Integration Test** | `DemoDataSeederIntegrationTest` (Spring AOP proxy bean, ConditionalOnProperty, Transactional Rollback thực tế qua trigger lỗi PostgreSQL, idempotency, bảo toàn 100% dịch vụ thật cùng tên có giá quá khứ/chưa có giá/giá tương lai/trùng nhiều tên) | 6 tests                | **6/6 PASSED (100%)**     |
| **Concurrency Integration Test**      | `HuyVaThanhToanConcurrencyIntegrationTest` (Đa luồng hủy/thanh toán hóa đơn, đối ứng tiền)                                                                                                                                                           | 5 tests                | **5/5 PASSED (100%)**     |
| **Operational Tasks (PCCC)**          | `BangViecVanHanhIntegrationTest`                                                                                                                                                                                                                     | 8 tests                | **8/8 PASSED (100%)**     |
| **Money Schema ArchUnit**             | `MoneySchemaRegressionTest`                                                                                                                                                                                                                          | 2 tests                | **2/2 PASSED (100%)**     |
| **HopDongService Test**               | Hợp đồng, dịch vụ bậc thang, căn cứ quyết toán và audit trail                                                                                                                                                                                        | 10 tests               | **10/10 PASSED (100%)**   |
| **HopDongHoSoService Test**           | Đề xuất dự thảo hồ sơ, kiểm tra thiếu thông tin Bên A/Bên B, khóa bất biến hồ sơ đã chốt (409 Conflict), chặn ghi nhận ký khi chưa chốt, quy trình phụ lục                                                                                           | 5 tests                | **5/5 PASSED (100%)**     |
| **TaiSanService Test**                | Phân quyền tài sản theo tòa/phòng, snapshot từ database, khấu trừ                                                                                                                                                                                    | 7 tests                | **7/7 PASSED (100%)**     |
| **HuyHoaDonNhapService Test**         | Quy tắc hủy hóa đơn và kiểm soát số tiền đã thu                                                                                                                                                                                                      | 3 tests                | **3/3 PASSED (100%)**     |
| **PublicPortalService Test**          | Scope phân quyền tòa nhà cho lịch hẹn xem phòng                                                                                                                                                                                                      | 4 tests                | **4/4 PASSED (100%)**     |
| **HopDongPdfService Test**            | Xuất văn bản hợp đồng PDF chính xác, bố cục Quốc hiệu - Tiêu ngữ, 10 điều khoản chuẩn mực, bảng giá dịch vụ bậc thang                                                                                                                                | 3 tests                | **3/3 PASSED (100%)**     |

---

## 4. BÀN GIAO CHỨC NĂNG HỒ SƠ HỢP ĐỒNG THUÊ PHÒNG THỰC TẾ & CHUYÊN NGHIỆP

### 4.1. Kiến trúc & Migration V58 (`V58__contract_dossier_snapshot_and_templates.sql`)
1. **Mở rộng bảng `NGUOI_THUE`:**
   - Bổ sung các trường pháp lý chuẩn: `dia_chi_thuong_tru`, `dia_chi_lien_he`, `ngay_sinh`, `loai_giay_to` (mặc định 'CCCD'), `ngay_cap_giay_to`, `noi_cap_giay_to`, `email`.
   - **Bảo toàn dữ liệu:** Giữ nguyên cột `que_quan` hiện hữu; tự động khởi tạo `dia_chi_thuong_tru` từ `que_quan` nếu chưa có; không nhầm lẫn giữa quê quán và thường trú.
2. **Bảng cấu hình Bên A theo toà nhà (`CAU_HINH_BEN_A_TOA_NHA`):**
   - Lưu trữ thông tin bên cho thuê độc lập theo từng toà nhà: `chu_the` ('CA_NHAN' / 'DOANH_NGHIEP'), `ten_don_vi_hoac_chu_nha`, `ma_so_dinh_danh` (CCCD/MST), `ngay_cap`, `noi_cap`, `dia_chi_lien_he`, `so_dien_thoai`, `email`, `ho_ten_nguoi_ky`, `chuc_vu_nguoi_ky`, `vai_tro_ky` ('CHU_SO_HUU', 'DAI_DIEN_PHAP_LUAT', 'NGUOI_DUOC_UY_QUYEN'), `van_ban_uy_quyen_so`, `ngay_uy_quyen`, `so_tai_khoan`, `ngan_hang`, `chu_tai_khoan`.
3. **Mẫu điều khoản hợp đồng (`MAU_HOP_DONG`):**
   - Hỗ trợ quản lý mẫu hợp đồng phiên bản hóa theo tòa (`phien_ban`, `trang_thai` = 'PUBLISHED'/'DRAFT', `tieu_de`, `noi_dung_dieu_khoan`).
4. **Hồ sơ hợp đồng và Snapshot bất biến (`HOP_DONG_HO_SO`):**
   - Quản lý trạng thái hồ sơ văn bản độc lập với trạng thái vận hành: `trang_thai_tai_lieu` (`DRAFT` $\rightarrow$ `DA_CHOT` $\rightarrow$ `DA_GHI_NHAN_KY`).
   - Đóng băng toàn bộ thông tin tại thời điểm chốt hợp đồng: snapshot Bên A, snapshot Bên B, snapshot phòng/toà, `snapshot_dich_vu_json` (bao gồm từng mốc bậc thang giá dịch vụ), `snapshot_tai_san_json` (danh mục tài sản bàn giao), `chot_boi_nguoi_dung_id`, `thoi_diem_chot`.
   - Ghi nhận ký giấy thực tế: `ngay_ky`, `ghi_nhan_ky_boi_id`, `thoi_diem_ghi_nhan_ky`, `ghi_chu_ky`, `file_scan_dinh_kem`.
5. **Phụ lục hợp đồng (`HOP_DONG_PHU_LUC`):**
   - Bảng `HOP_DONG_PHU_LUC` ghi nhận các điều chỉnh về giá, thời hạn, người ở cùng sau khi hồ sơ đã chốt (`so_phu_luc`, `tieu_de`, `ngay_lap`, `ngay_hieu_luc`, `noi_dung_thay_doi`).

### 4.2. Các bất biến nghiệp vụ và tính toàn vẹn dữ liệu
- **Phân biệt rạch ròi Bên A:** Cá nhân chủ nhà và doanh nghiệp / pháp nhân quản lý; tách biệt người ký và tư cách ký (`CHU_SO_HUU`, `DAI_DIEN_PHAP_LUAT`, `NGUOI_DUOC_UY_QUYEN`); bắt buộc số văn bản và ngày ủy quyền nếu là người được ủy quyền.
- **Phân biệt rạch ròi Bên B:** Thường trú (`dia_chi_thuong_tru`) là trường pháp lý bắt buộc trên hợp đồng thuê nhà, tuyệt đối không dùng `que_quan` thay thế.
- **Đối chiếu tiền cọc:** Hệ thống phân biệt rõ:
  - `tienCocThoaThuan`: Mức cọc thỏa thuận ghi nhận trong hợp đồng.
  - `tienCocThucThu`: Số tiền cọc thực tế đã thu vào sổ quỹ (`layTongThuCoc(hopDongId)` từ bảng `GIAO_DICH_COC`).
  - Hợp đồng cảnh báo rõ ràng nếu tiền cọc thực thu chưa đủ mức thỏa thuận và không tự ý tuyên bố "Bên thuê đã nộp đủ tiền cọc" khi sổ quỹ chưa ghi nhận thu đủ.
- **Khóa bất biến sau khi chốt (Sealing & Immutability):**
  - Sau khi chốt hồ sơ (`DA_CHOT` / `DA_GHI_NHAN_KY`), mọi yêu cầu sửa đổi trực tiếp đều bị chặn với mã lỗi HTTP **409 Conflict**.
  - Bắt buộc tạo **Phụ lục hợp đồng (`HOP_DONG_PHU_LUC`)** để ghi nhận thay đổi về giá, thời hạn hoặc người ở cùng.
- **Chặn ghi nhận ký giấy khi chưa chốt:** Chỉ hồ sơ đã chốt (`DA_CHOT`) mới được phép ghi nhận ngày ký giấy, nhân sự chứng kiến và file scan.

### 4.3. Thiết kế văn bản PDF Chuyên nghiệp (`HopDongPdfService`)
- Bố cục trang A4 chuẩn hành chính: Quốc hiệu, Tiêu ngữ, Căn cứ pháp lý (Bộ luật Dân sự 2015, Luật Nhà ở 2023).
- Trình bày thông tin Bên A và Bên B đầy đủ tính pháp lý.
- Bảng tài chính rõ ràng: Giá thuê, phương thức thanh toán, kỳ thanh toán, ngày đến hạn thanh toán, thông tin tài khoản thụ hưởng.
- Đối chiếu tiền cọc minh bạch: Mức cọc thỏa thuận và trạng thái thu tiền cọc theo sổ quỹ hệ thống.
- Chi tiết dịch vụ và bảng giá: Liệt kê chi tiết giá cố định hoặc giá bậc thang (ví dụ điện sinh hoạt bậc 1, 2, 3...) theo đúng biểu giá cấu hình của tòa nhà.
- 10 Điều khoản chuẩn mực pháp lý về: Bàn giao sử dụng, Giá thuê & thanh toán, Tiền đặt cọc, Quyền & nghĩa vụ các bên, Sửa chữa & bảo trì, Chấm dứt & thanh lý, Phạt vi phạm, Cam kết chung.
- Khối chữ ký cân đối 2 cột: Bên cho thuê (Bên A) và Bên thuê (Bên B) kèm ghi chú họ tên và tư cách ký.
- Đánh dấu trạng thái tài liệu: Dòng watermark / biểu ngữ "BẢN DỰ THẢO - CHƯA CÓ HIỆU LỰC PHÁP LÝ" trên mọi trang khi hồ sơ ở trạng thái `DRAFT`; tự động gỡ bỏ khi hồ sơ đã chốt / đã ký.
- Header & Footer chuẩn tài liệu pháp lý: Đánh số trang tự động (`Trang X / Y`), mã tra cứu hồ sơ và thời điểm kết xuất.

### 4.4. Giao diện người dùng (`HopDongThaoTac.tsx` & `HopDongNguoiThue.tsx`)
- Quy trình 5 bước trực quan:
  1. **Thông tin cơ bản & Thời hạn:** Chọn phòng, thời hạn, mục đích thuê, phạm vi sử dụng.
  2. **Bên A & Bên B:** Tải nhanh cấu hình Bên A từ toà nhà; cập nhật đầy đủ thông tin pháp lý Bên B (CCCD, ngày cấp, nơi cấp, thường trú, liên hệ) và danh sách người ở cùng.
  3. **Tài chính & Dịch vụ:** Xem giá thuê, đối soát tiền cọc thỏa thuận vs thực thu sổ quỹ, kỳ hạn thanh toán, thông tin chuyển khoản ngân hàng.
  4. **Điều khoản mẫu & Biên bản bàn giao:** Chọn mẫu điều khoản theo phiên bản tòa nhà; liên kết biên bản bàn giao nhận phòng.
  5. **Kiểm tra, Tải PDF, Chốt & Ghi nhận ký:** Bảng cảnh báo thiếu thông tin tự động, tải PDF xem trước, nút "Chốt hồ sơ" có xác nhận an toàn, ghi nhận ký hợp đồng giấy và quản lý phụ lục.
- Thẻ người thuê (`HopDongNguoiThue.tsx`): Hiển thị huy hiệu trạng thái hồ sơ văn bản chuẩn xác (`Đã ký giấy`, `Đã chốt hồ sơ`, `Bản dự thảo`).

---

## 3. HOÀN THIỆN BỘ HỒ SƠ HỢP ĐỒNG THUÊ PHÒNG MINIAPART (8 YÊU CẦU THEO THỨ TỰ)

Dựa trên chỉ đạo hoàn tất bộ hồ sơ hợp đồng trên working tree, hệ thống đã triển khai đầy đủ và kiểm thử tự động toàn bộ 8 yêu cầu:

### 3.1. Compile và Hợp đồng API Revision (Optimistic Concurrency Control)
- **Files:** `HopDongHoSoRepository.java`, `HopDongService.java`, `YeuCauLuuDraftHoSo.java`, `YeuCauChotHoSo.java`, `HopDongThaoTac.tsx`, `api.ts`.
- **Hành vi:**
  - Sửa lỗi cú pháp so sánh kiểu nguyên thủy `int != null` bằng cách chuẩn hóa `revision` sang `Integer` và hàm `getEffectiveRevision()`.
  - Bắt buộc truyền `expectedRevision` khi cập nhật hoặc chốt hồ sơ đã tồn tại.
  - Câu lệnh UPDATE kiểm tra đồng thời `id = ? AND revision = ? AND trang_thai_tai_lieu = 'DRAFT'`, tăng `revision = revision + 1`.
  - Service kiểm tra số dòng bị ảnh hưởng (`affectedRows == 0`), ném `StaleRevisionException` (409 Conflict) khi phiên bản bị ghi đè hoặc hồ sơ đã đổi trạng thái.
  - Ngăn chặn ghi đè (mutation) hồ sơ bên thuê khi kiểm tra khóa lạc quan thất bại.

### 3.2. Phân quyền Biên bản Bàn giao (`kiemTraBienBanNhanPhong`)
- **Files:** `TaiSanRepository.java`, `HopDongService.java`.
- **Hành vi:**
  - Phương thức `layThongTinKiemTraBienBan` truy vấn trực tiếp thông tin kiểm tra gồm: `bien_ban_id`, `hop_dong_id`, `phong_id`, `toa_nha_id`, `loai_bien_ban`.
  - `kiemTraBienBanNhanPhong` xác thực nhân viên có quyền truy cập toà nhà qua `phanQuyenToaService.layToaNhaNeuNhanVienDuocXem`.
  - Kiểm tra tính toàn vẹn nghiệp vụ: Biên bản phải thuộc đúng hợp đồng, phòng, toà nhà và có `loai_bien_ban == 'NHAN_PHONG'`.
  - Trả về mã lỗi 403 Forbidden nếu trái quyền toà nhà, 400 Bad Request nếu thông tin phòng/hợp đồng/loại biên bản không khớp.

### 3.3. Snapshot Bất biến và Trình bày PDF Chuyên nghiệp
- **Files:** `HopDongPdfService.java`, `HopDongService.java`.
- **Hành vi:**
  - Khi hợp đồng ở trạng thái `DA_CHOT` hoặc `DA_GHI_NHAN_KY`, PDF xuất bản đọc dữ liệu dịch vụ, bảng giá bậc thang, tài sản và các điều khoản hoàn toàn từ snapshot JSON bất biến (`snapshot_dich_vu_json`, `snapshot_tai_san_json`), không truy vấn lại danh mục động đang hoạt động.
  - Loại bỏ hoàn toàn khối `catch (Exception ignored)` nuốt lỗi; ném ngoại lệ rõ ràng khi sinh PDF lỗi.
  - Phụ lục bàn giao tài sản trong PDF kết xuất bảng chuyên nghiệp gồm 4 cột: STT, Tên tài sản, Số lượng, Tình trạng bàn giao.
  - Hiển thị ngày ký hợp đồng thực tế đã được ghi nhận.
  - Bản hợp đồng nháp (`DRAFT`) luôn có biểu ngữ rõ ràng: `[DỰ THẢO - CHƯA CÓ GIÁ TRỊ PHÁP LÝ]`.

### 3.4. Migration V58 và Tách biệt Dữ liệu Mẫu (Pure DDL & Variant Loader)
- **Files:** `V58__contract_dossier_snapshot_and_templates.sql`, `FlywayUpgradeStrategy.java`, `DemoDataSeeder.java`.
- **Hành vi:**
  - `V58` là Pure DDL 100%, không chứa bất kỳ lệnh INSERT dữ liệu mẫu nào. Bổ sung trường `ngay_ky DATE` vào bảng `HOP_DONG_HO_SO`.
  - Toàn bộ dữ liệu mẫu Bên A và mẫu hợp đồng chuẩn mực được chuyển sang hàm `seedCauHinhBenAVaMauHopDongNeuChuaCo()` trong `DemoDataSeeder.java`, bảo vệ bởi cờ `app.seed-demo=true`.
  - Loại bỏ hành vi fallback từ `queQuan` sang `diaChiThuongTru` (hai trường có ý nghĩa pháp lý khác nhau theo Luật Cư trú).
  - Đăng ký variant `draft_v58` (checksum `-1463358195`) trong `FlywayUpgradeStrategy` cho các database đã từng chạy bản draft V58.

### 3.5. Bảng giá Dịch vụ Bậc thang (Tiered Rates)
- **Files:** `HopDongService.java`, `HopDongPdfService.java`.
- **Hành vi:**
  - Sửa lỗi so sánh enum chuỗi `"BAC_THANG".equals(entity.cheDoGia())` thành so sánh enum trực tiếp `entity.cheDoGia() == CheDoGia.BAC_THANG`.
  - Sử dụng Jackson `ObjectMapper` (`tools.jackson.*`) tuần tự hóa snapshot dịch vụ bậc thang có cấu trúc: định mức từ/đến (`tuChiSo`, `denChiSo`, `tuSoLuong`, `denSoLuong`), đơn giá, số thứ tự bậc, tỷ lệ, đơn vị tính, cách tính và ngày hiệu lực.
  - PDF hiển thị đầy đủ bảng phụ lục bậc thang cho dịch vụ điện/nước bậc thang, xử lý định dạng đúng cho mức đơn giá 0.

### 3.6. Frontend Scope & Bảo vệ Phản hồi Chậm (Stale Response Guard)
- **Files:** `HopDongThaoTac.tsx`, `HopDongThaoTac.test.tsx`.
- **Hành vi:**
  - Sử dụng `useRef` lưu trữ Generation ID và tham chiếu hợp đồng đang chọn.
  - Khi người dùng chuyển chọn hợp đồng (Contract A $\rightarrow$ Contract B), state giao diện (`hoSo`, `phuLucList`, `dossierForm`) được reset ngay lập tức.
  - Bỏ qua toàn bộ dữ liệu trả về chậm của hợp đồng trước đó (kịch bản switch A $\rightarrow$ B $\rightarrow$ A ngoài thứ tự), tránh ghi đè nhầm dữ liệu giữa các hợp đồng.

### 3.7. Ghi nhận Ký Hợp đồng (Actual Signing Date & Traversal Guard)
- **Files:** `HopDongHoSoRepository.java`, `HopDongService.java`, `YeuCauGhiNhanKy.java`.
- **Hành vi:**
  - Phân tách rõ ràng giữa ngày ký thực tế do người dùng nhập (`ngay_ky DATE`) và dấu thời gian hệ thống ghi nhận (`thoi_diem_ghi_nhan_ky TIMESTAMP`).
  - Kiểm tra ngày ký: Không được ở tương lai, không trước ngày lập hoặc ngày bắt đầu hợp đồng; trạng thái hồ sơ bắt buộc phải là `DA_CHOT`.
  - Ngăn chặn ghi đè bản ghi ký đã tồn tại mà không qua quy trình đối soát (trả 409 Conflict).
  - Làm sạch tên tệp scan đính kèm (Sanitize path traversal), loại bỏ mọi đường dẫn chứa `../` hoặc ký tự đặc biệt.

### 3.8. Chốt Hồ sơ và Kiểm tra Tính Toàn vẹn Pháp lý
- **Files:** `HopDongService.java`.
- **Hành vi:**
  - Kiểm tra Bên A: Đầy đủ tên chủ thể, mã định danh, địa chỉ, số điện thoại; người ký hợp lệ theo tư cách (`CHU_SO_HUU`, `DAI_DIEN_PHAP_LUAT`, hoặc `NGUOI_DUOC_UY_QUYEN` bắt buộc có căn cứ ủy quyền).
  - Kiểm tra Bên B: Bắt buộc có thông tin `diaChiThuongTru`.
  - Kiểm tra chu kỳ thanh toán: `kyThanhToanThang > 0`, `hanThanhToanNgay` từ ngày 1 đến ngày 28 hàng tháng.
  - Kiểm tra mẫu hợp đồng: Phải thuộc đúng toà nhà của hợp đồng và ở trạng thái `PUBLISHED`.

---

## 4. KẾT QUẢ KIỂM CHỨNG TOÀN DIỆN

### 4.1. Frontend Suites (Vitest)
- **32/32 test files PASSED (220/220 tests passed 100%)**
- Bao gồm:
  - `src/HopDongThaoTac.test.tsx`: Kiểm chứng bảo vệ phản hồi chậm (stale response drop) khi chuyển A $\rightarrow$ B $\rightarrow$ A ngoài thứ tự.
  - `src/HopDongNguoiThue.test.tsx`, `src/DanhMucToaNha.test.tsx`, `src/QuanLyTaiSanPhong.test.tsx`, `src/App.test.tsx`, v.v.
- Frontend Production Build: `npm run build` thành công, 0 lỗi TypeScript, 0 lỗi cú pháp.

### 4.2. Backend Suites (Gradle Test trên PostgreSQL Cô lập)
- **214/214 tests PASSED 100% (0 Failed, 0 Errors, 0 Skipped)**
- Danh sách các suite trọng yếu đã chạy thành công:
  - `MigrationUpgradeHistoryIntegrationTest` (19/19 passed)
  - `MoneySchemaRegressionTest` (2/2 passed)
  - `DemoDataSeederIntegrationTest` (6/6 passed)
  - `HuyVaThanhToanConcurrencyIntegrationTest` (5/5 passed)
  - `BangViecVanHanhIntegrationTest` (8/8 passed)
  - `HopDongHoSoServiceTest` (15/15 passed)
  - `HopDongPdfServiceTest` (2/2 passed)
  - `HopDongServiceTest` (10/10 passed)
  - `TaiSanServiceTest` (7/7 passed)
  - `HuyHoaDonNhapServiceTest` (3/3 passed)
  - `PublicPortalServiceTest` (4/4 passed)
  - `YeuCauSuaChuaLifecycleRulesTest` (62/62 passed)
  - `HoaDonLifecycleRulesTest` (29/29 passed)
  - `PhiVaNuocBillingRulesTest` (12/12 passed)
  - `GiaDichVuRulesTest` (9/9 passed)
  - `HopDongBillingRulesTest` (9/9 passed)
  - `BillingCalcPropertiesTest` (6/6 passed)
  - `ArchitectureRulesTest` (3/3 passed)
  - `ChiSoValidationRulesTest` (3/3 passed)
  - `QuyTacLamTronRulesTest` (3/3 passed)
  - `ThanhToanLedgerPropertiesTest` (2/2 passed)

## 5. HOÀN THIỆN 4 PHÁT HIỆN REVIEW VỀ BỘ HỒ SƠ HỢP ĐỒNG (P1 & P2)

### 5.1. P1 — Upgrade từ V58 Draft thiếu `ngay_ky` & Forward Migration V59
- **Files:**
  - `backend/src/main/resources/db/migration/V59__contract_dossier_signing_date_compatibility.sql`
  - `backend/src/main/java/com/prj1/ccm/config/FlywayUpgradeStrategy.java`
  - `backend/src/test/java/com/prj1/ccm/architecture/MigrationUpgradeHistoryIntegrationTest.java`
- **Nguyên nhân gốc & Giải pháp:**
  - `FlywayUpgradeStrategy` chọn artifact `draft_v58` để validate cho các database đã từng áp dụng bản draft V58 (checksum `-1463358195`), nhưng artifact đó chưa có cột `ngay_ky` và `snapshot_nguoi_o_cung_json`, trong khi `HopDongHoSoRepository` luôn SELECT các cột này.
  - Thêm forward migration `V59__contract_dossier_signing_date_compatibility.sql` (Pure DDL) tự động bổ sung cột `ngay_ky DATE` và `snapshot_nguoi_o_cung_json TEXT` có scope đúng `CURRENT_SCHEMA`.
  - Giữ nguyên lịch sử, không sửa checksum hay sửa file lịch sử V58.
  - Viết test integration chuyên sâu `p1_upgradeTuV58Draft_chuanHoaNgayKyVaSnapshotNguoiOCung_crudHopDongHoSoThanhCong`: tạo DB thật từ bản `draft_v58` $\rightarrow$ upgrade qua `FlywayUpgradeStrategy` $\rightarrow$ thực hiện toàn bộ CRUD đọc/lưu nháp/chốt/ghi nhận ký qua repository thật.

### 5.2. P1 — Đóng ranh giới Snapshot cho PDF Chính thức (Tránh rò rỉ dữ liệu sống & Fallback ngầm)
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongPdfService.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/test/java/com/prj1/ccm/hopdong/HopDongPdfServiceTest.java`
- **Nguyên nhân gốc & Giải pháp:**
  - PDF văn bản đã chốt/ký từng sử dụng một số trường dữ liệu sống (người ở cùng từ bảng vận hành, số phòng hiện tại, tiền cọc thực thu hiện tại) hoặc fallback ngầm về danh mục khi thiếu snapshot.
  - Đóng ranh giới bất biến:
    - Khi hồ sơ ở trạng thái `DA_CHOT` hoặc `DA_GHI_NHAN_KY`, PDF đọc 100% từ snapshot đóng băng (`bdsSoPhong()`, `snapshotNguoiOCungJson`, `snapshotDichVuJson`, `snapshotTaiSanJson`, `dieuKhoanTuyBien`).
    - Tiền cọc trên hợp đồng hiển thị mức cọc thỏa thuận pháp lý cam kết, tách biệt khỏi biến động thu/chi tiền cọc thực tế trong sổ quỹ.
    - Loại bỏ toàn bộ hành vi silent fallback: Ném ngay `IllegalStateException` rõ ràng khi snapshot dịch vụ rỗng/thiếu/hỏng JSON, điều khoản tùy biến bị rỗng, hoặc snapshot tài sản hỏng JSON.
    - Kiểm chứng tính bất biến: Khi thay đổi số phòng vận hành, thêm/sửa người ở cùng trong bảng `NGUOI_O_CUNG`, thay đổi số tiền cọc thực thu, PDF đã chốt vẫn giữ nguyên 100% nội dung gốc.

### 5.3. P1 — Bảo vệ Mutation Stale Response & Race Condition trong Giao diện
- **Files:**
  - `frontend/src/HopDongThaoTac.tsx`
  - `frontend/src/ManagementShared.tsx`
  - `frontend/src/HopDongThaoTac.test.tsx`
- **Nguyên nhân gốc & Giải pháp:**
  - Khi người dùng bấm mutation (Lưu nháp, Chốt hồ sơ, Ghi nhận ký, Tạo phụ lục) rồi nhanh tay chuyển sang hợp đồng khác, phản hồi bất đồng bộ (resolve/reject) của mutation hợp đồng cũ có thể ghi đè form, revision, trạng thái hoặc thông báo lỗi/thành công của hợp đồng mới.
  - Xây dựng cơ chế `runScopedMutation(targetHopDongId, mutationFn, successMessage)`:
    - Bắt giữ `targetHopDongId` và thế hệ `expectedGen = requestGenRef.current` trước khi thực hiện mutation.
    - Kiểm tra tính hợp lệ của scope và generation trước và sau mỗi điểm `await`.
    - Nếu người dùng đã chuyển sang hợp đồng khác hoặc generation đã tăng, ngay lập tức cô lập kết quả, không cho phép cập nhật state, form, thông báo, hoặc kích hoạt `loadDossier` cho hợp đồng khác.
  - Viết suite kiểm thử `HopDongThaoTac.test.tsx` với 4 kịch bản race condition dùng Deferred Promise:
    1. Bấm lưu nháp Hợp đồng A $\rightarrow$ chuyển ngay sang Hợp đồng B $\rightarrow$ A hoàn thành muộn: form B và thông báo B không bị ảnh hưởng.
    2. Bấm lưu nháp Hợp đồng A $\rightarrow$ chuyển sang B $\rightarrow$ A thất bại (500 Error): thông báo lỗi của A không hiển thị trên B.
    3. Bấm chốt Hợp đồng A (xử lý chậm) $\rightarrow$ chuyển sang B: trạng thái và form của B không bị chuyển thành ĐÃ CHỐT.
    4. Thao tác A $\rightarrow$ chuyển B $\rightarrow$ quay lại A: mutation cũ của A không ghi đè dữ liệu mới nhất của A.

### 5.4. P2 — Ngăn chặn Giá bậc thang thiếu dữ liệu biến thành Miễn phí
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongPdfService.java`
  - `backend/src/test/java/com/prj1/ccm/hopdong/HopDongHoSoServiceTest.java`
  - `backend/src/test/java/com/prj1/ccm/hopdong/HopDongPdfServiceTest.java`
- **Nguyên nhân gốc & Giải pháp:**
  - Trước đây, khi dịch vụ bậc thang thiếu bảng giá hiệu lực tại ngày bắt đầu hợp đồng hoặc danh sách bậc thang rỗng, hệ thống có thể tạo snapshot với giá 0 và kết xuất PDF là "Miễn phí (0 đ)".
  - Giải pháp triệt để:
    - `HopDongService.chotHoSo`: Thực hiện tiền kiểm tra `kiemTraSnapshotDichVuTruocKhiChot`. Nếu bất kỳ dịch vụ bậc thang nào thiếu bảng giá hiệu lực tại ngày bắt đầu hợp đồng hoặc danh sách bậc thang rỗng, lập tức từ chối và ném `ResponseStatusException(BAD_REQUEST)` (400).
    - `HopDongPdfService`: Ném `IllegalStateException` rõ ràng khi dịch vụ `BAC_THANG` có danh sách bậc thang rỗng hoặc thiếu đơn giá từng bậc, tuyệt đối không rơi vào nhánh giá 0 / "Miễn phí (0 đ)".
    - Mức giá 0 cố định hợp lệ (ví dụ: wifi/rác miễn phí đã thỏa thuận) tiếp tục hiển thị chuẩn xác là "Miễn phí (0 đ)".

---

## 6. KHÉP KÍN BẤT BIẾN HỒ SƠ & HỢP ĐỒNG KHÔNG DỊCH VỤ (P1 & P2 - MỐC HOÀN THIỆN)

### 6.1. P1 — Snapshot Người ở cùng (`snapshotNguoiOCungJson`)
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongPdfService.java`
  - `backend/src/test/java/com/prj1/ccm/hopdong/HopDongHoSoServiceTest.java`
  - `backend/src/test/java/com/prj1/ccm/hopdong/HopDongPdfServiceTest.java`
- **Nguyên nhân gốc & Hành vi sau sửa:**
  - `HopDongService.layHoSoHopDong`:
    - `DRAFT`: Được phép đọc danh sách người ở cùng vận hành từ `nguoiOCungRepository`.
    - `DA_CHOT` / `DA_GHI_NHAN_KY`: Chỉ đọc snapshot đã lưu từ `snapshotNguoiOCungJson`.
    - `"[]"` là snapshot hợp lệ biểu thị hợp đồng không có người ở cùng; **tuyệt đối không truy vấn repo `NGUOI_O_CUNG` sống**.
    - Snapshot bị thiếu (`null`), rỗng (`isBlank`), hỏng cú pháp JSON, hoặc sai cấu trúc (không phải JSON Array): ném lỗi `400 BAD_REQUEST` rõ ràng (`ResponseStatusException`), không fallback về dữ liệu hiện tại, không tự chế danh sách rỗng `[]` để pass test.
    - Hồ sơ lịch sử nâng cấp sau V59 thiếu snapshot: ghi nhận rõ dữ liệu lịch sử chưa trọn vẹn, từ chối xuất bản chính thức an toàn; không tự chế snapshot giả.
  - `HopDongService.chotHoSo`:
    - Tuần tự hóa danh sách người ở cùng sang JSON. Nếu serialization gặp lỗi: lập tức ném `500 INTERNAL_SERVER_ERROR` làm rollback giao dịch, không chốt hồ sơ bằng snapshot thay thế `"[]"`, không thay đổi trạng thái hoặc revision.
  - `HopDongPdfService.xuat`:
    - Khi xuất bản chính thức (`!isDraft`), kiểm tra bắt buộc `snapshotNguoiOCungJson` phải tồn tại và là JSON Array hợp lệ. Ném `IllegalStateException` nếu snapshot thiếu hoặc hỏng định dạng.
- **Kiểm chứng tự động:**
  - `layHoSoHopDong_daChot_baoToanSnapshotNguoiOCung_khongBiAnhHuongBoiDuLieuSong`: Snapshot hợp lệ giữ nguyên khi repo sống thay đổi.
  - `layHoSoHopDong_daChot_snapshotNguoiOCungRong_khongTruyVanDuLieuSong`: Snapshot `"[]"` không bao giờ truy vấn `nguoiOCungRepository`.
  - `layHoSoHopDong_daChot_snapshotNguoiOCungNull_nemBadRequest`: Snapshot null bị từ chối rõ ràng, không fallback.
  - `layHoSoHopDong_daChot_snapshotNguoiOCungBlank_nemBadRequest`: Snapshot blank bị từ chối rõ ràng.
  - `layHoSoHopDong_daChot_snapshotNguoiOCungHongJson_nemBadRequest`: JSON hỏng bị từ chối rõ ràng.
  - `layHoSoHopDong_daChot_snapshotNguoiOCungKhongPhaiMang_nemBadRequest`: JSON Object bị từ chối rõ ràng.

### 6.2. P2 — Hợp đồng không chọn dịch vụ & Trình bày PDF
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongPdfService.java`
  - `backend/src/test/java/com/prj1/ccm/hopdong/HopDongHoSoServiceTest.java`
  - `backend/src/test/java/com/prj1/ccm/hopdong/HopDongPdfServiceTest.java`
- **Nguyên nhân gốc & Hành vi sau sửa:**
  - `HopDongService.chuanHoa`: Cho phép tạo hợp đồng không có dịch vụ nào kèm theo (`dichVuApDung == null` hoặc rỗng), mặc định danh sách dịch vụ rỗng thay vì ném lỗi `BAD_REQUEST`.
  - `HopDongService.chotHoSo`: Lưu `snapshotDichVuJson = "[]"` khi hợp đồng không có dịch vụ. Hàm `kiemTraSnapshotDichVuTruocKhiChot` chấp nhận `"[]"` là snapshot hợp lệ.
  - `HopDongPdfService`: Cho phép `arrayNode.isEmpty()` trong snapshot dịch vụ, xuất PDF thành công và hiển thị rõ ràng:
    `"Không có dịch vụ tính phí riêng theo hợp đồng."`
  - Phân biệt rạch ròi: `"[]"` là không có dịch vụ; `null`/blank/corrupted JSON/non-array là lỗi snapshot thiếu hoặc hỏng, bị từ chối bằng `IllegalStateException`.
  - Không tự sửa/fallback giá bị thiếu thành 0 (dịch vụ cố định thiếu đơn giá ném `IllegalStateException`); giá cố định 0 đ hợp lệ vẫn hiển thị chuẩn `"Miễn phí (0 đ)"`.
  - Dịch vụ bậc thang thiếu bậc hoặc thiếu đơn giá vẫn bị chặn ngay từ lúc chốt.

### 6.3. Kiểm tra Trực quan File PDF Thực tế (Visual Inspection Deliverables)
Đã sinh và lưu 2 file PDF thực tế vào thư mục `backend/build/` để kiểm tra trực quan:
1. `backend/build/hop-dong-khong-dich-vu.pdf` (27.885 bytes):
   - Số trang: $\ge 2$ trang (2 trang chuẩn hành chính).
   - Phần dịch vụ hiển thị rõ ràng: `"Không có dịch vụ tính phí riêng theo hợp đồng."`.
   - Bố cục Quốc hiệu, Tiêu ngữ, Điều khoản hợp đồng, Phụ lục bàn giao tài sản 5 thiết bị, Khối chữ ký 2 cột cân đối.
   - Số trang hiển thị chuẩn mực ở footer: `"Hợp đồng HD-200"`, `"Trang 1"`, `"Trang 2"`.
   - Phông chữ tiếng Việt (`LiberationSans-Regular`) hiển thị sắc nét 100%, không lỗi font, không có ký tự "?" hoặc ô vuông.
2. `backend/build/hop-dong-chinh-thuc.pdf` (27.877 bytes):
   - Số trang: $\ge 2$ trang (2 trang).
   - Biểu giá bậc thang đầy đủ: Bậc 1, 2, 3 kèm định mức và đơn giá (`1.800 đ / kWh`, `2.100 đ / kWh`, `2.500 đ / kWh`).
   - Dịch vụ 0 đ hiển thị: `"Internet wifi tốc độ cao: Miễn phí (0 đ)"`.
   - Phí quản lý: `"150.000 đ / người"`.
   - Người ở cùng trong snapshot: `"Lê Thị Cùng Phòng (Em gái)"`.
   - Phụ lục bàn giao trang thiết bị kèm phòng: Điều hoà, Bình nóng lạnh, Tủ quần áo.

---

## 7. BẢNG TỔNG HỢP KẾT QUẢ KIỂM CHỨNG TOÀN HỆ THỐNG

| Bộ kiểm thử                               | Phạm vi / Mục tiêu kiểm chứng                                                                                                                                               | Số lượng tests            | Kết quả                                              |
| :---------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------ | :--------------------------------------------------- |
| **Backend Test Suite (Toàn bộ ứng dụng)** | Gradle test runner trên PostgreSQL cô lập (tất cả integration tests, migration, rules, properties, controllers, services)                                                   | **705 tests**             | **705/705 PASSED (100%, 0 failed, 0 error, 0 skip)** |
| **Frontend Test Suite (Vitest)**          | Vitest 4.1.11 (`HopDongThaoTac`, `HopDongNguoiThue`, `App`, `QuanLyTaiSanPhong`, `GhiChiSo`, `BaoCaoTongQuan`, v.v.)                                                        | **32 suites / 223 tests** | **223/223 PASSED (100%)**                            |
| **Frontend Production Build**             | TypeScript compiler + Vite bundler (`tsc -b && vite build`)                                                                                                                 | Toàn bộ ứng dụng React    | **PASSED (0 errors, 0 warnings compile)**            |
| **Migration Upgrade Suite**               | `MigrationUpgradeHistoryIntegrationTest` (20 test cases: clean DB, 046d45a, d2e3d69, V58 draft upgrade, V59 forward migration, V60 future feature, multi-schema, fail-fast) | **20 tests**              | **20/20 PASSED (100%)**                              |
| **Contract Dossier & PDF Suites**         | `HopDongHoSoServiceTest` + `HopDongPdfServiceTest` (CRUD hồ sơ, chốt, ký, bậc thang, snapshot bất biến, người ở cùng snapshot, không dịch vụ, trực quan PDF)                | **42 tests**              | **42/42 PASSED (100%)**                              |
| **Handover & Settlement Concurrency**     | `HuyVaThanhToanConcurrencyIntegrationTest` + `ThanhLyHopDongIntegrationTest`                                                                                                | **18 tests**              | **18/18 PASSED (100%)**                              |
| **User & Tenant Management**              | `NguoiDungQuanLyIntegrationTest`                                                                                                                                            | **20 tests**              | **20/20 PASSED (100%)**                              |

---

## 8. CÁC LỆNH KIỂM CHỨNG ĐỘC LẬP DÀNH CHO REVIEWER

Để kiểm chứng toàn bộ hệ thống trên môi trường local:

```powershell
# 1. Khởi động PostgreSQL Daemon (nếu chưa chạy)
& "d:\vscode\miniapart\pgsql\pgsql\bin\postgres.exe" -D "d:\vscode\miniapart\pgsql\data"

# 2. Chạy toàn bộ các test suite Backend (Tất cả 705+ tests):
$env:MINIAPART_TEST_JDBC_URL = "jdbc:postgresql://localhost:5432/postgres"
$env:MINIAPART_TEST_USERNAME = "miniapart"
$env:MINIAPART_TEST_PASSWORD = "miniapart"
Set-Location D:\vscode\miniapart\MiniApart-main\backend
.\gradlew.bat test

# 3. Chạy toàn bộ bộ kiểm thử Frontend (Vitest 32 files / 223 tests):
Set-Location D:\vscode\miniapart\MiniApart-main\frontend
npm run test -- --run

# 4. Kiểm tra Frontend Build (Production build):
npm run build
```

---

## 9. HOÀN THIỆN NỘI DUNG MẪU HỢP ĐỒNG 12 ĐIỀU KHOẢN VẬN HÀNH THỰC TẾ

### 9.1. Kiến trúc đối chiếu & Phân định ranh giới trách nhiệm (System Boundaries)
Nội dung hợp đồng thuê phòng được hoàn thiện toàn diện với 12 điều khoản chi tiết, có đánh số khoản (Khoản 1, 2, 3...) và xác định rõ quyền, nghĩa vụ, điều kiện thực hiện, căn cứ đối chiếu:
1. **Điều 1. Đối tượng thuê, mục đích, phạm vi sử dụng và nhận bàn giao:**
   - Đối chiếu với: Dữ liệu Bên A (`CauHinhBenA`), Bên B (`NguoiThue`), Bất động sản (`ToaNha`, `Phong`), mục đích sử dụng và ngày nhận phòng.
   - Căn cứ bàn giao: Ràng buộc rõ ràng với **Biên bản bàn giao nhận phòng (loại NHẬN PHÒNG)** trên hệ thống `TaiSanService`.
2. **Điều 2. Thời hạn thuê, giá thuê, kỳ hạn và phương thức thanh toán:**
   - Đối chiếu với: `ngayBatDau`, `ngayKetThuc`, `giaThueThoaThuan`, `kyThanhToanThang`, `hanDongTienNgay`, `hinhThucThanhToan`, `taiKhoanNhanTien`.
   - Vận hành: Hợp lệ trên sổ quỹ công nợ toà nhà `GiaoDichCoc` / `HoaDon`.
3. **Điều 3. Tiền đặt cọc, điều kiện hoàn cọc và căn cứ khấu trừ:**
   - Đối chiếu với: `tienCocThoaThuan` (mức cam kết pháp lý) và `tienCocThucThu` (chứng từ thực thu từ sổ quỹ `GiaoDichCoc`).
   - Căn cứ khấu trừ: Chỉ được khấu trừ căn cứ theo **Biên bản bàn giao trả phòng (loại TRẢ PHÒNG)** được ký xác nhận trên hệ thống và công nợ thực tế. Mọi khoản phát sinh khác phải giải trình bằng văn bản.
4. **Điều 4. Chi phí dịch vụ, cơ chế tính phí và chốt chỉ số định kỳ:**
   - Đối chiếu với: `snapshotDichVuJson` (đơn giá cố định, bậc thang đóng băng tại thời điểm chốt).
   - Vận hành: Quy trình chốt chỉ số công tơ định kỳ, lưu ảnh minh chứng và phát hành hoá đơn (`ChiSoDichVu`, `TinhHoaDonService`). Dịch vụ 0đ hiển thị rõ ràng là miễn phí. Hợp đồng không đăng ký dịch vụ thì miễn trừ các chi phí dịch vụ riêng.
5. **Điều 5. Quyền và nghĩa vụ của Bên cho thuê (Bên A):**
   - Cam kết bảo đảm quyền riêng tư, an toàn; giới hạn chỉ vào phòng khi khẩn cấp (chập điện, cháy nổ, ngập nước) kèm thông báo ngay.
   - Duy trì hạ tầng thiết yếu, cung cấp hồ sơ thuộc quyền sở hữu toà nhà cho người thuê.
6. **Điều 6. Quyền và nghĩa vụ của Bên thuê (Bên B):**
   - Tiếp nhận và ký biên bản bàn giao; thanh toán đúng kỳ hạn; sử dụng đúng mục đích để ở.
   - Giữ gìn an ninh, cung cấp giấy tờ tùy thân của bản thân và người ở cùng hợp lệ.
7. **Điều 7. Quản lý tài sản, trang thiết bị và giá trị pháp lý của Biên bản bàn giao:**
   - Danh mục, số lượng, hiện trạng gắn liền với Phụ lục tài sản (`snapshotTaiSanJson`) và Biên bản bàn giao nhận/trả phòng.
   - Khẳng định giá trị pháp lý ràng buộc duy nhất của Biên bản bàn giao hệ thống MiniApart.
8. **Điều 8. Sửa chữa, bảo trì và phân định trách nhiệm hao mòn tài sản:**
   - Phân định rõ ràng: Bên A chịu trách nhiệm hạ tầng ngầm, kết cấu toà nhà và **hao mòn tự nhiên**; Bên B chịu trách nhiệm hư hỏng do lỗi chủ quan, sử dụng bất cẩn.
   - Vận hành: Quy trình gửi và tiếp nhận thông qua module `YeuCauSuaChua` của hệ thống.
9. **Điều 9. An toàn phòng cháy chữa cháy, an ninh trật tự và quy định cư trú:**
   - Tuân thủ an toàn PCCC (`PcccService`): không tích trữ chất cháy nổ, không dùng bình gas mini, không câu móc điện trái phép.
   - Khung giờ yên tĩnh (22h00 - 06h00).
   - **Ranh giới trách nhiệm cư trú:** Hệ thống lưu trữ, trích xuất dữ liệu tùy thân (CCCD, hộ khẩu thường trú, người ở cùng) phục vụ đối soát, **không thay thế thủ tục hành chính trực tiếp với cơ quan Công an có thẩm quyền theo Luật Cư trú**.
10. **Điều 10. Gia hạn hợp đồng, chấm dứt trước thời hạn và thủ tục trả phòng:**
    - Quy định báo trước tối thiểu theo số ngày cam kết (`soNgayBaoTruocKhiTraPhong`).
    - Quy trình dọn dẹp, vệ sinh và bàn giao lại phòng.
11. **Điều 11. Đối chiếu công nợ, kiểm kê tài sản, quyết toán và thanh lý hợp đồng:**
    - Kiểm kê hiện trạng trả phòng, chốt chỉ số dịch vụ cuối kỳ, bảng tổng hợp quyết toán công nợ và hoàn trả tiền cọc trong tối đa 07 ngày làm việc.
12. **Điều 12. Điều khoản thi hành, sửa đổi phụ lục, giải quyết tranh chấp và ký kết:**
    - Hiệu lực pháp lý; mọi sửa đổi bổ sung sau khi chốt bắt buộc lập bằng **Phụ lục hợp đồng** (`HopDongPhuLucService`).
    - Số bản phát hành và lưu trữ bản scan ký kết đính kèm hồ sơ.

### 9.2. Cơ chế Fail-Safe & Bất biến hồ sơ
- **Cảnh báo và Chặn nội dung chưa thỏa thuận (`coNoiDungChuaThoaThuan`):**
  - Nhận diện các placeholder: `[CHƯA THỎA THUẬN]`, `[CẦN BỔ SUNG]`, `[ĐANG CẬP NHẬT]`, `[TRỐNG]`, `[TODO]`, `[CHƯA XÁC ĐỊNH]`.
  - Ở bước dự thảo (`DRAFT`): Cảnh báo rõ trong `canhBaoThieuThongTin`.
  - Ở bước chốt hồ sơ (`chotHoSo`): Lập tức từ chối với lỗi `400 BAD_REQUEST`, yêu cầu hoàn thiện thỏa thuận trước khi đóng băng.
- **Tính bất biến của Hồ sơ đã chốt (`DA_CHOT`/`DA_GHI_NHAN_KY`):**
  - Mẫu hợp đồng mới sửa đổi tại toà nhà hoặc chạy seed demo `ON CONFLICT DO NOTHING` **tuyệt đối không làm thay đổi nội dung điều khoản đã chốt** (`dieu_khoan_tuy_bien`) của các hồ sơ trước đó.
- **Frontend & PDF:**
  - Giao diện: Cung cấp nút tiện ích `⚡ Nạp điều khoản mẫu chuẩn MiniApart (12 điều khoản)` gọi API `GET /api/toa-nha/{toaNhaId}/mau-hop-dong/chuan`.
  - Trình bày PDF: Tiêu đề Điều được in đậm (`fBodyBold`) với khoảng cách dòng hợp lý, các khoản được thụt lề 10pt rõ ràng, chia trang tự nhiên, đánh số trang liên tục. File `build/hop-dong-chinh-thuc.pdf` đạt 37KB và $\ge 3$ trang.

---

## 10. HOÀN THIỆN NGHIỆP VỤ HỢP ĐỒNG, GIÁ DỊCH VỤ VÀ QUẢN LÝ NGƯỜI CƯ TRÚ MINIAPART

### 10.1. Mô hình Thuê Cả Phòng & Nguyên tắc Quản lý Người Cư trú
1. **Thuê Cả Phòng (Whole-Room Lease):**
   - Hợp đồng thuê MiniApart xác lập quan hệ cho thuê cả phòng giữa Bên cho thuê và **một Bên thuê chính duy nhất** (`nguoi_thue_id`).
   - Người ở cùng (`NGUOI_O_CUNG`) là những cá nhân được cấp quyền cư trú cùng người thuê chính trong phạm vi phòng thuê.
   - **Tách biệt nghĩa vụ tài chính:** Người ở cùng không phải là bên đồng ký kết hợp đồng và không chịu nghĩa vụ nợ thay cho người thuê chính. Mọi công nợ, tiền thuê, tiền cọc và hoá đơn đều quy về người thuê chính đứng tên hợp đồng.
   - Quan hệ gia đình (`quan_he`) là tùy chọn (`NULLABLE`), không bắt buộc có quan hệ gia đình mới được ở cùng.

2. **Bảo vệ Định danh & Thông tin Nhạy cảm (CCCD / CMND):**
   - **Tuyệt đối không dùng CCCD làm tên đăng nhập (`ten_dang_nhap`), mật khẩu, hoặc khoá công khai.**
   - Tên đăng nhập của tài khoản người dùng (`NGUOI_DUNG`) luôn sử dụng số điện thoại chuẩn hóa (`so_dien_thoai`).
   - CCCD/số giấy tờ luôn được che mờ tự động trên toàn bộ giao diện và trích xuất PDF thông qua `SoGiayToFormatter.che(soGiayTo)` (ví dụ: `0012******99` hoặc `********7890`), chỉ hiển thị đầy đủ trong form chi tiết có kiểm soát quyền truy cập và ghi audit trail.
   - Không log số CCCD trong query parameter URL, tiêu đề thông báo hay nhật ký hoạt động.

3. **Vòng đời Cư trú & Kiểm soát Sức chứa Khóa Bi quan (Pessimistic Locking):**
   - **Quy trình trạng thái:** `CHO_DUYET` (người thuê đề nghị) $\to$ `DA_DUYET` (quản lý phê duyệt) $\to$ `DA_ROI_DI` (ghi nhận rời phòng) hoặc `TU_CHOI` (từ chối kèm lý do bắt buộc).
   - **Kiểm soát sức chứa thời gian thực:**
     - Trước khi phê duyệt cư trú, hệ thống kích hoạt khóa bi quan trên bản ghi phòng: `SELECT suc_chua FROM PHONG WHERE id = ? FOR UPDATE`.
     - Đếm tổng số người đang cư trú trong khoảng thời gian hiệu lực: 1 người thuê chính + số người ở cùng đã duyệt giao thoa thời gian (`countApprovedOccupantsInInterval`).
     - So sánh với ngưỡng sức chứa: $\min(\text{suc\_chua}_{\text{phong}}, \text{so\_nguoi\_toi\_da}_{\text{hop\_dong}})$.
     - Nếu vượt quá giới hạn: lập tức từ chối với lỗi `400 BAD_REQUEST`, ngăn chặn triệt để tình trạng 2 quản lý đồng thời duyệt làm vượt quá sức chứa phòng.
   - **Kích hoạt tài khoản người dùng cho người cư trú:**
     - Quản lý có thể kích hoạt tài khoản hệ thống cho người ở cùng qua API `POST /api/hop-dong/{hopDongId}/nguoi-o-cung/{id}/kich-hoat-tai-khoan`.
     - Hệ thống sinh mật khẩu ngẫu nhiên an toàn, tạo tài khoản `NGUOI_DUNG` với vai trò `NGUOI_THUE`, liên kết với hồ sơ người thuê và không để lộ thông tin mật.

---

### 10.2. Bảng Giá Dịch Vụ Theo Phòng & Đồng Bộ Hóa Đơn (Pricing & Billing Sync)
1. **Kế thừa & Ghi đè Bảng Giá Dịch Vụ Phòng (`BANG_GIA_PHONG`):**
   - Toà nhà có biểu giá chuẩn cho từng dịch vụ (ví dụ: Điện 3.500đ/kWh).
   - Từng phòng cụ thể có thể được thiết lập đơn giá riêng thông qua bảng `BANG_GIA_PHONG` (ví dụ: phòng 501 có điều hòa công suất lớn tính 4.000đ/kWh).
   - API quản lý:
     - `GET /api/phong/{phongId}/bang-gia-dich-vu`: trả về danh sách giá dịch vụ, phân định rõ nguồn giá (`KE_THUA`, `GHI_DE`, `THIEU_BANG_GIA`).
     - `POST /api/phong/{phongId}/dich-vu/{dichVuId}/bang-gia`: thiết lập giá ghi đè cho phòng.
     - `DELETE /api/phong/{phongId}/bang-gia/{bangGiaPhongId}`: xóa giá ghi đè, hoàn nguyên về giá toà nhà.
   - **Phân biệt rõ ràng:** Đơn giá 0đ (miễn phí theo thỏa thuận) khác với trạng thái chưa có bảng giá (`THIEU_BANG_GIA`).

2. **Bảo toàn Tính Bất Biến khi Đóng Băng Hợp Đồng & Đồng Bộ Hóa Đơn:**
   - Khi hợp đồng được chốt (`DA_CHOT` / `DA_GHI_NHAN_KY`), toàn bộ bảng giá dịch vụ áp dụng và các bậc thang giá tại thời điểm chốt được lưu vĩnh viễn vào `snapshot_dich_vu_json`.
   - **Đồng bộ tính hoá đơn:**
     - Module tính hoá đơn hàng loạt (`TaoHoaDonHangLoatService`, `TinhHoaDonRepository`) ưu tiên đọc biểu giá và bậc thang đã đóng băng từ `snapshot_dich_vu_json` của hợp đồng đã chốt trước khi đọc bảng giá sống `BANG_GIA_BAC_THANG`.
     - Hạn thanh toán hoá đơn (`hanThanhToan`) được tính tự động dựa trên ngày hẹn thanh toán đã thỏa thuận trong hợp đồng (`han_thanh_toan_ngay`), đồng thời bảo toàn cơ chế ngày ân hạn mặc định của toà nhà cho các hợp đồng cũ chưa có hồ sơ chốt.

---

### 10.3. Mở Lại Bản Nháp (CAS Reopening) & Bất Biến Hợp Đồng Đã Ký
1. **Quy tắc Chống Ghi Đè (CAS Revision Check):**
   - Cho phép mở lại hồ sơ từ `DA_CHOT` về `DRAFT` qua API `POST /api/hop-dong/{hopDongId}/ho-so/mo-lai-draft`.
   - Bắt buộc truyền `expectedRevision`. Nếu phiên bản không khớp với revision hiện tại trong cơ sở dữ liệu, hệ thống trả về lỗi `409 CONFLICT` và không cho phép thực hiện.
   - Khi mở lại thành công, trạng thái chuyển về `DRAFT` và `revision` tăng lên 1 đơn vị, vô hiệu hóa hoàn toàn khả năng ghi nhận ký trên revision cũ.
   - Toàn bộ hành động mở lại được ghi nhật ký hoạt động `MO_LAI_DRAFT_HO_SO` kèm lý do và số revision trước/sau.

2. **Bảo vệ Tuyệt Đối Hợp Đồng Đã Ký:**
   - Hồ sơ ở trạng thái `DA_GHI_NHAN_KY` là bất biến vĩnh viễn, **tuyệt đối không thể mở lại draft** bằng API này.
   - Mọi thay đổi sau khi đã ký bắt buộc phải thông qua thủ tục lập **Phụ lục hợp đồng** (`HopDongPhuLuc`).

---

### 10.4. Trình Bày PDF Danh Sách Cư Trú & Chữ Ký An Toàn
1. **Bảng "DANH SÁCH NGƯỜI ĐƯỢC PHÉP CƯ TRÚ":**
   - Trình bày trang trọng trong tài liệu hợp đồng, phân biệt rõ:
     - Đại diện đứng tên thuê (Bên B): Đầy đủ họ tên, SĐT, CCCD đã che mờ.
     - Người ở cùng: Họ tên, quan hệ (nếu có), SĐT, CCCD đã che mờ.
   - Chỉ in những người cư trú đã được phê duyệt hợp lệ trong snapshot đóng băng.

2. **Chính Sách Vận Hành Thỏa Thuận:**
   - Trình bày đầy đủ tại Điều 6, 9 và 10:
     - Sức chứa tối đa: `soNguoiToiDa` người.
     - Thời gian báo trước gia hạn/trả phòng: `soNgayBaoTruocGiaHan` ngày.
     - Thời hạn hoàn cọc quyết toán: `soNgayHoanCoc` ngày.
     - Khung giờ yên tĩnh: `khungGioYenTinh` (mặc định 22h00 - 06h00).

3. **Chống Tách Rời Khối Chữ Ký (Orphaned Signatures Prevention):**
   - Bảng ký kết hai bên được thiết lập thuộc tính `setKeepTogether(true)` trên iText 7.
   - Đảm bảo toàn bộ tiêu đề điều khoản cuối cùng, lời cam đoan và chữ ký Bên A / Bên B luôn nằm liền kề nhau trên cùng một trang, không bao giờ bị tách rời sang trang trắng đơn độc.

---

### 10.5. Ma Trận Kiểm Thử Tự Động (Verification Matrix)

| Hạng mục kiểm thử | Công cụ / Test Suite | Số ca kiểm thử | Kết quả | Ghi chú |
|---|---|:---:|:---:|---|
| **Bộ kiểm thử toàn diện Backend** | `./gradlew.bat test` | **712** | **712/712 PASSED (100%)** | 0 failures, 0 errors, 0 skipped. Chạy trên PostgreSQL thật. |
| **Nghiệp vụ mở rộng hợp đồng & cư trú** | `HopDongNghiepVuMoRongIntegrationTest` | **3** | **3/3 PASSED (100%)** | Bảng giá phòng, CAS moLaiDraft, Lock bi quan sức chứa, Kích hoạt tài khoản an toàn |
| **Hồ sơ, snapshot & điều khoản hợp đồng** | `HopDongHoSoServiceTest` | **31** | **31/31 PASSED (100%)** | CAS revision, snapshot người ở cùng, chặn placeholder, hợp đồng không dịch vụ |
| **Xuất PDF hợp đồng đa trang** | `HopDongPdfServiceTest` | **15** | **15/15 PASSED (100%)** | Bảng người cư trú, CCCD che, chính sách vận hành, chữ ký liền trang, visual check |
| **Đồng bộ hóa đơn & kỳ hạn hợp đồng** | `HoaDonHangLoatIntegrationTest` | **29** | **29/29 PASSED (100%)** | Tính hạn thanh toán theo hợp đồng chốt, snapshot bậc thang đóng băng |
| **Gia hạn, người ở cùng & thanh lý** | `GiaHanHopDongIntegrationTest`, `NguoiOCungIntegrationTest`, `ThanhLyHopDongIntegrationTest` | **22** | **22/22 PASSED (100%)** | Chuẩn hóa vai trò người ở, bảo toàn lịch sử cư trú khi gia hạn hợp đồng |
| **Bảo vệ định danh CCCD** | `NguoiThueIntegrationTest` | **2** | **2/2 PASSED (100%)** | Che mờ CCCD chuẩn mực, không rò rỉ trong log hay audit |
| **Bộ kiểm thử toàn diện Frontend** | `npm run test -- --run` (Vitest) | **223** (32 files) | **223/223 PASSED (100%)** | Không lỗi render, không lỗi async state, bao phủ toàn bộ giao diện |
| **Kiểm tra biên dịch Frontend** | `npm run build` (`tsc -b && vite build`) | **75 modules** | **SUCCESS (100%)** | 0 lỗi TypeScript, 0 lỗi bundle lint |

---

## 11. CHỐT BẢN DEMO - KHẮC PHỤC 3 LỖI NGHIỆP VỤ & RANH GIỚI GIỚI HẠN

### 11.1. Chi Tiết Khắc Phục 3 Lỗi Nghiệp Vụ Đã Xác Minh

#### 1. Lỗi 1: Bảo Toàn 4 Trường Chính Sách Vận Hành Thỏa Thuận
- **Hiện tượng:** Trước khi sửa, `HopDongService` gọi constructor 57 tham số làm reset 4 trường chính sách (`soNguoiToiDa`, `soNgayBaoTruocGiaHan`, `soNgayHoanCoc`, `khungGioYenTinh`) về giá trị mặc định khi tạo mới hoặc cập nhật draft. Đồng thời, câu lệnh SQL SELECT trong `findLatestByHopDongId` và `findByHopDongIdAndRevision` của `HopDongHoSoRepository` bỏ sót 4 cột này, dẫn đến việc đọc lại luôn nhận giá trị default.
- **Khắc phục:**
  - `HopDongService.java`:
    - Khi khởi tạo draft (`layHoSoHopDong`): gọi constructor 61 tham số, thiết lập `soNguoiToiDa = phong.sucChua()`, `soNgayBaoTruocGiaHan = 30`, `soNgayHoanCoc = 7`, `khungGioYenTinh = "22h00 - 06h00"`.
    - Khi lưu mới draft (`luuDraftHoSo` với `existing == null`): truyền trực tiếp 4 giá trị từ request, fallback về sức chứa phòng và mặc định nếu thiếu.
    - Khi cập nhật draft (`luuDraftHoSo` với `existing != null`): ưu tiên giá trị từ request, nếu request không truyền trường nào thì giữ nguyên giá trị đã có từ `existing` (không reset).
  - `HopDongHoSoRepository.java`:
    - Bổ sung 4 cột `so_nguoi_toi_da, so_ngay_bao_truoc_gia_han, so_ngay_hoan_coc, khung_gio_yen_tinh` vào câu lệnh SELECT của `findLatestByHopDongId` và `findByHopDongIdAndRevision`.
  - **Kiểm chứng:** Test `chinhSachVanHanh_luuDraft_getLai_xuatPdf_khopGiaTri` xác nhận quy trình Lưu draft (tùy biến) $\to$ GET lại $\to$ Xuất PDF khớp nhau 100%.

#### 2. Lỗi 2: Kiểm Tra Sức Chứa Đồng Nhất Dưới Khóa Bi Quan Cho Mọi Đường Tạo Người `DA_DUYET`
- **Hiện tượng:** Trước khi sửa, khi quản lý thêm trực tiếp người ở cùng qua `POST /api/hop-dong/{id}/nguoi-o-cung`, bản ghi được lưu ngay với trạng thái `DA_DUYET` và chỉ trả về thông báo cảnh báo mà không từ chối, vi phạm ràng buộc sức chứa.
- **Khắc phục:**
  - `NguoiOCungService.java`:
    - Hợp nhất logic kiểm tra sức chứa thành phương thức dùng chung `kiemTraSucChuaVaKhoaPhong(Long hopDongId, Long phongId, LocalDate tuNgay, LocalDate denNgay, Long excludeNocId, String thaoTac)`.
    - Cả hai đường: Quản lý thêm trực tiếp (`tao` với `trangThai = "DA_DUYET"`) và Quản lý phê duyệt (`duyet`) đều bắt buộc thực thi khóa bi quan `lockPhongForUpdate(phongId)` trong transaction.
    - Kiểm tra `totalOccupants = 1 (người thuê chính) + approvedCoOccupants + 1 (người mới)`. Nếu `totalOccupants > limit (min(phong.sucChua(), hoSo.soNguoiToiDa()))`: ném ngay `ResponseStatusException(HttpStatus.BAD_REQUEST)` và **tuyệt đối không lưu bản ghi**.
  - **Kiểm chứng:** Test `quanLyThemNguoiOCungTrucTiep_vuotSucChua_biTuChoiVaKhongLuuBanGhi` và `NguoiOCungIntegrationTest` xác nhận trả về 400 Bad Request và `SELECT count(*)` trong CSDL giữ nguyên không tăng.

#### 3. Lỗi 3: Snapshot & PDF Danh Sách Cư Trú Chỉ Lấy Người Đã Duyệt và Thời Gian Phù Hợp
- **Hiện tượng:** Trước khi sửa, khi chốt hồ sơ, toàn bộ bản ghi người ở cùng (bao gồm cả `CHO_DUYET`, `TU_CHOI` hoặc người đã hết hạn cư trú) bị serialize vào snapshot và in ra PDF.
- **Khắc phục:**
  - `HopDongService.java: chotHoSo`: Lọc `dsNguoiOCungList` đưa vào snapshot chỉ gồm:
    - Trạng thái: `DA_DUYET` (loại bỏ `CHO_DUYET`, `TU_CHOI`).
    - Thời gian cư trú: giao thoa với thời hạn hợp đồng (`denNgay == null || !denNgay.isBefore(ngayBatDauHd)` và `tuNgay == null || !tuNgay.isAfter(ngayKetThucHd)`).
  - `HopDongService.java: layHoSoHopDong`: Lọc khi đọc draft hoặc từ snapshot đã đóng băng.
  - `HopDongPdfService.java`: Bảng "DANH SÁCH NGƯỜI ĐƯỢC PHÉP CƯ TRÚ" chỉ in người thuê chính (Bên B) và danh sách người ở cùng thỏa mãn cả trạng thái `DA_DUYET` lẫn thời hạn cư trú hợp lệ.
  - **Bảo toàn hợp đồng đã ký:** Hợp đồng ở trạng thái `DA_GHI_NHAN_KY` giữ nguyên snapshot lịch sử đã ký kết, không bị cập nhật hay thay đổi.
  - **Kiểm chứng:** Test `snapshotVaPdf_chiChuaNguoiDaDuyetVaThoiGianPhuHop_khongChuaChoDuyetTuChoi` xác nhận snapshot CSDL và văn bản PDF chỉ chứa người được duyệt, không chứa người chờ duyệt, bị từ chối hoặc hết hạn trước hợp đồng.

---

### 11.2. Giới Hạn Phạm Vi Hệ Thống (Boundary & Limitations Notice)

> **CẢNH BÁO MINH BẠCH NGHIỆP VỤ (KHÔNG TUYÊN BỐ HOÀN THÀNH TOÀN DIỆN):**  
> Bản demo hiện tại tập trung cốt lõi vào tính toàn vẹn và bất biến của bộ hồ sơ hợp đồng MiniApart. Hai phân hệ sau đã sẵn sàng toàn bộ ở tầng Backend API nhưng **chưa hoàn thiện trọn vẹn luồng giao diện người dùng (UI Flow)** trên Frontend:
>
> 1. **Tài khoản người cư trú (Resident Accounts):**
>    - *Backend:* Đã hoàn tất API kích hoạt tài khoản an toàn (`POST /api/hop-dong/{id}/nguoi-o-cung/{id}/kich-hoat-tai-khoan`), cơ chế phân quyền `NGUOI_THUE`, đăng nhập bằng SĐT, bảo vệ che mờ CCCD và quản lý trạng thái hoạt động/khóa.
>    - *Giới hạn Frontend:* Chưa có cổng thông tin riêng (Resident Portal) cho từng người ở cùng tự đăng nhập để khai báo tạm trú trực tuyến hoặc xem thông báo cá nhân. Hiện tại việc kích hoạt và quản lý tài khoản người ở cùng thực hiện qua API quản trị.
>
> 2. **Giá phòng riêng biệt (Room-level Pricing Override):**
>    - *Backend:* Đã hoàn tất bảng `BANG_GIA_PHONG`, repository, service và REST controller (`GET/POST/DELETE /api/phong/{id}/bang-gia-dich-vu`). Đã tích hợp module tính hoá đơn hàng loạt tự động kế thừa giá toà hoặc áp dụng giá phòng riêng biệt.
>    - *Giới hạn Frontend:* Giao diện quản lý hiện tại tập trung vào biểu giá toà nhà chung (`QuanLyToaNha`). Màn hình popup/modal thiết lập ghi đè giá riêng cho từng phòng trực quan trên lưới phòng chưa được tích hợp hoàn chỉnh thành luồng thao tác người dùng độc lập.
>
> Hai hạng mục trên được khoanh vùng ranh giới rõ ràng cho các giai đoạn thiết kế giao diện tiếp theo.

---

## 12. REDESIGN TOÀN BỘ GIAO DIỆN BẰNG IMPECCABLE VÀ UI UX PRO MAX (B2B SAAS MODERNIZATION)

### 12.1. Định Hướng & Nguyên Tắc Thiết Kế Cốt Lõi
Toàn bộ giao diện người dùng của MiniApart được chuẩn hóa theo chuẩn mực thiết kế sản phẩm **B2B SaaS Property Management** kết hợp giữa hai bộ kỹ năng **Impeccable** và **UI UX Pro Max**:

1. **Chế độ Operate Mode (Thao tác vận hành chuyên sâu):**
   - MiniApart là công cụ làm việc thực tế hàng ngày của Chủ nhà, Quản lý, Thợ sửa chữa và Khách thuê. Thiết kế ưu tiên sự rõ ràng, bố cục phân khu theo nhịp công việc, mật độ thông tin tối ưu (high data density), căn lề thẳng hàng, giảm thiểu số bước thao tác.
   - Giữ nguyên tiếng Việt chuẩn mực, định dạng tiền tệ Việt Nam Đồng (`₫`) và múi giờ `Asia/Ho_Chi_Minh`.

2. **Hệ Thống Bảng Màu Token Nhất Quán (Unified Palette):**
   - **Màu chủ đạo (Primary & Brand):** Deep Navy Slate `#0F172A` (`--ma-brand-primary`) kết hợp điểm nhấn Teal `#0D9488` (`--ma-brand-accent`).
   - **Mặt nền & Thẻ (Surfaces):** Nền trang sáng dịu `#F8FAFC` (`--ma-bg-page`), thẻ nền trắng `#FFFFFF` (`--ma-bg-card`), vùng phụ trợ `#F1F5F9` (`--ma-bg-sunken`).
   - **Đường viền & Phân cách:** Viền nhẹ `#E2E8F0` (`--ma-border-default`), viền đậm `#CBD5E1` (`--ma-border-strong`).
   - **Trạng thái nghiệp vụ (Semantic Statuses):**
     - Hoàn tất / Hiệu lực / Đã thu: Xanh lá `#059669` (`--ma-done`), nền `#ECFDF5`.
     - Cảnh báo / Chờ duyệt / Quá hạn nhẹ: Cam hổ phách `#D97706` (`--ma-waiting`), nền `#FFFBEB`.
     - Khẩn cấp / Nợ xấu / Lỗi: Đỏ `#DC2626` (`--ma-urgent`), nền `#FEF2F2`.
     - Phòng trống / Thông tin: Xanh dịu `#0284C7` / `#0D9488`.

3. **Chuẩn Hóa Browser Surfaces (Theming từ Token, Không Dùng Default Trình Duyệt):**
   - Bôi đen văn bản (`::selection`): Nền `--ma-brand-accent-light`, chữ `--ma-brand-primary`.
   - Vòng tiêu điểm bàn phím (`:focus-visible`): Viền nét đôi rõ ràng `2px solid var(--ma-focus-ring)`.
   - Con trỏ gõ chữ (`caret-color`): Đồng bộ theo `--ma-brand-accent`.
   - Thanh cuộn tùy biến (`::-webkit-scrollbar`): Siêu mảnh 6px bo tròn, màu viền `--ma-line-300`, hover `--ma-line-600`, không chiếm dụng không gian hiển thị.
   - Số liệu tài chính, chỉ số công tơ, tiền tệ: Sử dụng font `IBM Plex Mono` và thuộc tính `font-variant-numeric: tabular-nums` căn lề phải, giúp việc cộng trừ và đối soát cột số liệu thẳng hàng tuyệt đối.

4. **Loại Bỏ Triệt Để Anti-Patterns Theo Impeccable Craft Floor:**
   - Xóa bỏ toàn bộ hard block shadow kiểu neobrutalist (`4px 4px 0`) và viền màu dày `border-left: 4px` trên thẻ thông báo; thay bằng viền tinh tế 1px và đa tầng bóng đổ mềm (`--ma-shadow-sm`, `--ma-shadow-md`).
   - Loại bỏ chữ chuyển màu (gradient text) và các hiệu ứng mờ nhân tạo không có mục đích.
   - Thay thế toàn bộ hộp thoại trình duyệt nguyên thủy (`window.prompt()` và `window.confirm()`) bằng các Accessible React Modal Dialogs (`ConfirmModal`, `PromptModal`) có bẫy tiêu điểm (focus trap), nền mờ backdrop, lắng nghe phím Enter/Escape và chuẩn ARIA dialog.

---

### 12.2. Chi Tiết Các Màn Hình Đã Hoàn Thiện

#### 1. Khung Ứng Dụng & Điều Hướng (`App.tsx`, `TopBar.tsx`, `NavPanel.tsx`)
- **TopBar:** Hiển thị tên toà nhà đang thao tác, kỳ kế toán đang mở kèm badge trạng thái xanh, ô tìm kiếm nhanh, chuông thông báo có số đếm chưa đọc (`data-testid="topbar-unread-count"`) và nút đăng xuất với viền nét rõ.
- **NavPanel (Menu 3 Nhóm Công Việc):**
  - Desktop: Sidebar chia theo nhịp công việc thật: *Hàng ngày* (Nhắc việc, Chỉ số, Thu tiền) $\to$ *Tiền* (Hoá đơn, Công nợ, Báo cáo) $\to$ *Toà nhà* (Toà nhà, Phòng, Hợp đồng, Khách thuê, Thợ).
  - Mobile (360px - 768px): Thanh đáy 5 vị trí cố định theo chuẩn `NFR-USA-01`, mục mở rộng "Thêm" mở danh mục phụ trực quan, không bị tràn màn hình.

#### 2. Màn Hình Hồ Sơ & Thao Tác Hợp Đồng (`HopDongThaoTac.tsx` & `HopDongQuanLy.tsx`)
- **Thanh điều hướng 5 bước (Segmented Step Progress Bar):**
  - Bước 1: *Phòng & Thời hạn* (Tiêu đề, ngày lập, địa điểm, mục đích, thời hạn thuê, báo trước gia hạn).
  - Bước 2: *Bên A & Bên B* (Chủ thể cho thuê & Người thuê với đầy đủ CCCD/Hộ chiếu, ngày cấp, nơi cấp, thường trú).
  - Bước 3: *Giá thuê & Cọc* (Hiển thị 3 chỉ số tài chính: Giá thuê thỏa thuận, Tiền cọc cam kết, Tiền cọc thực thu trên sổ cái kế toán; cảnh báo tức thì nếu cọc thiếu).
  - Bước 4: *Điều khoản & Bàn giao* (Nạp nhanh 12 điều khoản chuẩn mực MiniApart, áp dụng mẫu toà nhà có hộp thoại xác nhận chuyên nghiệp, liên kết biên bản nhận phòng).
  - Bước 5: *Chốt & Ký giấy* (Bảng cảnh báo thiếu dữ liệu theo thời gian thực, Tải PDF dự thảo, Chốt hồ sơ bất biến CAS Revision, Ghi nhận ngày ký và file scan hợp đồng giấy, Quản lý phụ lục sửa đổi bổ sung).
- **Hộp thoại tương tác Accessible:**
  - Thay thế `window.confirm()` khi nạp mẫu điều khoản bằng `ConfirmModal`.
  - Thay thế `window.prompt()` khi mở lại bản nháp, từ chối người ở cùng, hoặc ghi nhận rời phòng bằng `PromptModal` có ô nhập lý do và phím tắt Enter/Esc.
- **Thẻ tóm tắt Hợp đồng trực quan (Summary Card):** Đồng bộ hoàn toàn theo hệ thống tokens, hiển thị thông tin phòng, khách thuê, thời hạn và tổng tiền đầu kỳ (thuê + cọc) căn lề sắc nét.
- **Danh sách Hợp đồng theo toà nhà (`HopDongQuanLy.tsx`):** Thẻ hợp đồng dạng bảng co giãn, lọc hợp đồng sắp hết hạn (30 ngày), nhãn trạng thái và ngày hết hạn nổi bật.

#### 3. Phân Hệ Kế Toán & Thu Tiền (`FinancePaymentPanel.tsx`, `HoaDonQuanLy.tsx`, `ThuTien.tsx`)
- **Sổ giao dịch & Thu tiền (`FinancePaymentPanel.tsx`):**
  - Biểu mẫu thu tiền hỗ trợ số tiền thập phân chính xác, ngày thu, hình thức Tiền mặt / Chuyển khoản, checkbox xác nhận thu thêm đưa vào số dư.
  - Tạo mã QR chuyển khoản ngân hàng động cho hoá đơn đang mở.
  - Lịch sử giao dịch dạng thẻ dòng với mã biên lai, số tiền `tabular-nums`, nút tải biên lai PDF và chức năng Lập bút toán đối ứng âm bảo toàn sổ cái.
- **Quản lý Hoá đơn (`HoaDonQuanLy.tsx`):**
  - Bảng lọc toà nhà, trạng thái vận hành (Nợ quá hạn, Bản nháp, Đã phát hành, Đã thanh toán, Quá hạn) và kỳ kế toán.
  - Nút thao tác hàng loạt: *Tạo hoá đơn nháp hàng loạt* và *Phát hành hoá đơn trong kỳ*.
  - Lưới hiển thị hoá đơn có link truy cập chi tiết, phòng, người thuê và số tiền còn lại.

#### 4. Hồ Sơ Người Thuê & Danh Mục Phòng (`HoSoNguoiThue.tsx`, `DanhMucPhong.tsx`)
- **Hồ sơ người thuê (`HoSoNguoiThue.tsx`):**
  - Thanh tìm kiếm tức thì theo tên/SĐT. Lưới thẻ hồ sơ khách thuê với CCCD được che mờ bảo vệ riêng tư.
  - Biểu mẫu 2 cột nhập liệu hồ sơ có gắn cờ cảnh báo thông tin thiếu.
  - Phân vùng tải và xem trước ảnh giấy tờ tùy thân (CCCD/Hộ chiếu).
- **Danh mục phòng (`DanhMucPhong.tsx`):**
  - Bộ lọc toà nhà và tầng trực quan.
  - Thống kê nhanh số phòng: Trống, Đang thuê, Đang sửa, Đã cọc.
  - Biểu mẫu tạo phòng đơn lẻ kèm mẫu gợi ý (Studio, 1PN, Gác lửng) và công cụ xem trước/tạo dãy phòng hàng loạt có hộp thoại xác nhận.

#### 5. Cổng Dịch Vụ Cư Dân & Khách Thuê (`HopDongNguoiThue.tsx`, `LichSuHoaDon.tsx`, `BieuDoTieuThu.tsx`, `KhamPhaPhong.tsx`)
- **Hợp đồng của tôi:** Hiển thị hợp đồng dưới dạng Card trên màn hình di động và Table trên máy tính, tích hợp nút tải PDF hợp đồng chính thức.
- **Lịch sử hoá đơn:** Danh sách các kỳ hoá đơn kèm số tiền to rõ, trạng thái thanh toán và liên kết mở chi tiết hoá đơn.
- **Biểu đồ tiêu thụ:** Trực quan hoá lượng điện (kWh) và nước (m³) qua các kỳ hoá đơn có cảnh báo tiêu thụ bất thường.
- **Khám phá phòng công khai (`KhamPhaPhong.tsx`):** Trang đích dành cho khách xem phòng trống, lọc theo toà nhà, khoảng giá và tiện ích; hỗ trợ gửi yêu cầu đặt lịch hẹn xem phòng trực tuyến.

---

### 12.3. Kiểm Chứng & Đo Lường Chất Lượng

| Hạng mục kiểm tra | Phương thức & Lệnh | Quy mô | Kết quả xác minh | Ghi chú chất lượng |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Test Suite** | `npm run test -- --run` (Vitest) | **223 tests** (32 suites) | **223/223 PASSED (100%)** | 0 failures, 0 errors. Tất cả flows điều hướng, hợp đồng, kế toán, báo cáo đều pass. |
| **Frontend Production Build** | `npm run build` (`tsc -b && vite build`) | **75 modules** | **SUCCESS (382ms)** | 0 TypeScript errors, 0 bundling errors. Bundle gọn gàng, tối ưu. |
| **Stylesheet Integrity Check** | `vitest run src/stylesCleanup.test.ts` | **6 tests** | **6/6 PASSED (100%)** | Không có mã màu hex hardcoded trong `styles.css`. Đạt chuẩn biến CSS tokens. |
| **Design Tokens Integration** | `vitest run src/designTokens.test.ts` | **1 test** | **1/1 PASSED (100%)** | Đúng token `--ma-paper-1` và font `Archivo` tại document root. |
| **Visual Style Comparator** | `vitest run evidence/ticket-08/compare-styles.test.mjs` | **10 tests** | **10/10 PASSED (100%)** | Cơ chế so sánh pixel và viewport 360px/1920px được bảo toàn toàn vẹn. |
| **Backend Integration Suite** | `HopDongHoSoServiceTest`, `HopDongNghiepVuMoRongIntegrationTest` | **712 tests** | **100% PASSED** | Backend logic, APIs, migrations và CSDL được giữ nguyên vẹn 100%. |
| **Tính tương thích phản hồi** | Responsive Breakpoints | **360px, 768px, 1440px** | **PASS** | Không tràn ngang viewport, chiều cao touch target $\ge 44$px. |




