# BIÊN BẢN BÀN GIAO TIẾP QUẢN DỰ ÁN (DÀNH CHO CODEX REVIEW)

> **Thời điểm bàn giao:** Sau khi hoàn thành toàn diện các phát hiện review độc lập (P1, P2, P3).  
> **Trạng thái hệ thống:**  
> - **PostgreSQL 17 Portable:** Đang chạy tại port `5432` (`miniapart_db`)  
> - **Spring Boot Backend:** Đang chạy tại `http://localhost:8080/`  
> - **Vite Frontend Dev Server:** Đang chạy tại `http://localhost:5173/`  
> - **Frontend Test Suite:** `vitest run --run` đạt **31/31 suites passed (216/216 tests passed 100%)**  
> - **Frontend Build:** `npm run build` thành công 100% (0 lỗi TypeScript, 0 lỗi bundle)  
> - **Backend Test Suites (chạy trên PostgreSQL cô lập):**
>   - `HuyVaThanhToanConcurrencyIntegrationTest`: **5/5 passed**
>   - `BangViecVanHanhIntegrationTest`: **8/8 passed**
>   - `MoneySchemaRegressionTest`: **2/2 passed**
>   - `HoaDonLifecycleRulesTest`: **29/29 passed**
>   - `HopDongServiceTest`: **8/8 passed**
>   - `TaiSanServiceTest`: **6/6 passed**
>   - `HuyHoaDonNhapServiceTest`: **3/3 passed**
>   - `PublicPortalServiceTest`: **4/4 passed**
>   - `HopDongPdfServiceTest`: **3/3 passed**
> - **Mốc commit trước đợt sửa:** `046d45a`  
> - **Commit sửa trung gian:** `d2e3d69`  
> - **Commit checkpoint:** `cceb3a0`  
> - **Commit hoàn tất khắc phục:** `6b95ab0`  
> - **Trạng thái working tree:** Đã hoàn tất toàn bộ mã nguồn và test kiểm chứng (clean).

---

## 1. PHƯƠNG ÁN NÂNG CẤP MIGRATION & SEED DỮ LIỆU PRODUCTION (4 ĐƯỜNG LỊCH SỬ)

### 1.1. Ma trận 4 lịch sử cơ sở dữ liệu thực tế:
1. **Lịch sử 1: Cơ sở dữ liệu có dữ liệu thực trước V49 (V01..V48):**
   - *Rủi ro nếu chạy V49 gốc:* `INSERT INTO PHONG (id, ...)` dùng `ON CONFLICT (id) DO NOTHING`. Nếu phòng đã tồn tại trong DB với `(toa_nha_id, so_phong)` trùng nhau nhưng ID khác nhau, Flyway sẽ dừng và fail ngay tại `V49` do vi phạm ràng buộc unique `(toa_nha_id, so_phong)`.
   - *Rủi ro dịch vụ:* `V49` chèn `BANG_GIA` với `dich_vu_id` cố định 1..5, có nguy cơ gắn biểu giá cố định vào dịch vụ nghiệp vụ thực tế mang ID 1..5 của khách hàng.
   - *Giải pháp nâng cấp:* Đối với các môi trường pre-V49 có dữ liệu thực, trước khi chạy `flyway:migrate`, áp dụng script tiền kiểm tra (pre-migration check): nếu bảng `PHONG` đã có dữ liệu, chuyển hướng seed phòng demo sang bảng staging hoặc bỏ qua seed; không để migration sau V49 làm cứu cánh vì Flyway dừng ngay tại V49 khi có lỗi.
2. **Lịch sử 2: Cơ sở dữ liệu đã áp dụng bản `046d45a`:**
   - *Trạng thái:* `flyway_schema_history` đã ghi nhận `V49` (checksum `-1020674094`) và `V55` (checksum `-1007063486`).
   - *Giải pháp tương thích:* Giữ nguyên byte-for-byte nội dung `V49` và `V55` gốc của `046d45a`. Các điều chỉnh tương thích schema được thực hiện qua forward migration `V56__handover_schema_compatibility.sql` (chuẩn hoá tên cột `tien_khautru` sang `tien_khau_tru`). Tuyệt đối không can thiệp hay sửa đổi `flyway_schema_history`.
3. **Lịch sử 3: Cơ sở dữ liệu đã áp dụng bản trung gian `d2e3d69`:**
   - *Trạng thái:* `flyway_schema_history` đã lưu checksum của `d2e3d69` (`1635338167` cho V49 và `1501460394` cho V55).
   - *Giải pháp tương thích:* Cấu hình Spring Boot Flyway:
     `spring.flyway.ignore-migration-patterns="49:checksum,55:checksum"`
     giúp Flyway bỏ qua kiểm tra checksum của 2 phiên bản này mà không cần reset database, không cần `flyway repair` và không xoá volume. Cột `tien_khautru` được `V56` tự động đổi tên an toàn.
4. **Lịch sử 4: Database tạo mới hoàn toàn (Clean DB):**
   - Flyway chạy tuần tự từ `V01` đến `V56` thành công 100%. `V56` chạy idempotent và đảm bảo cấu trúc cột đồng nhất `tien_khau_tru`.

### 1.2. Cơ chế tách dữ liệu Demo chủ động (Active Seed Mechanism):
- **Nguyên tắc:** Dữ liệu mẫu (demo seed) không được nhúng cứng vào file DDL migration production. Dữ liệu mẫu cần được đưa vào script riêng (ví dụ `db/demo/R__seed_demo.sql` hoặc Spring `@Profile("demo")` CommandLineRunner).
- **Đối soát dữ liệu mẫu đã chèn:** Tuyệt đối không xoá dữ liệu theo tên phòng (`DELETE FROM PHONG WHERE so_phong LIKE 'P.%'`) vì người dùng thật có thể tự đặt tên phòng trùng với tên mẫu. Quy trình đối soát sử dụng footprint kết hợp (khoá ngoại chưa có giao dịch phát sinh + ID cố định theo batch + nhật ký hệ thống chưa có hợp đồng thật gắn kèm) để cô lập hoặc gắn cờ lưu trữ (`is_demo = true`).

---

## 2. CHI TIẾT CÁC PHÁT HIỆN REVIEW ĐÃ KHẮC PHỤC (P1 & P2)

### 2.1. Concurrency Race: Hủy hoá đơn & Thu tiền đồng thời (P1.5 & P1.2)
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
- **Kiểm chứng:** Test suite mới `HuyVaThanhToanConcurrencyIntegrationTest` chạy trên PostgreSQL cô lập, mô phỏng đa luồng có `CountDownLatch` kiểm chứng 5 kịch bản:
  1. `thuTienTruoc_huySau_biChanBangConflictVaBaoToanTienThu`: **PASS**
  2. `huyTruoc_thuTienSau_biChanBangConflict`: **PASS**
  3. `doiUngXong_choPhepChuyenDaHuy`: **PASS**
  4. `thayTheHoaDon_daThuTien_nemLoiConflict`: **PASS**
  5. `thayTheHoaDon_chuaThuTien_thayTheThanhCongVaKhongLapKhoanPhaiThu`: **PASS**

### 2.2. Căn cứ quyết toán hợp đồng & Kiểm tra biên bản bàn giao (P2.3)
- **Files:**
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/HopDongRepository.java`
  - `backend/src/main/java/com/prj1/ccm/hopdong/YeuCauThanhLy.java`
  - `frontend/src/HopDongThaoTac.tsx`
- **Nguyên nhân:** Trước đây hệ thống chỉ kiểm tra `kiemTraBienBanThuocHopDong` mà không kiểm tra biên bản có đúng phòng hay không, không bắt buộc loại biên bản phải là `TRA_PHONG`, và cho phép bỏ qua biên bản trả phòng khi quyết toán tiền khấu trừ mà không có sự xác nhận chênh lệch.
- **Hành vi sau sửa:**
  - `HopDongService.thanhLy`:
    1. Xác thực `bienBanId` phải thuộc đúng hợp đồng và đúng phòng (`phongId`).
    2. Bắt buộc loại biên bản phải là `TRA_PHONG` (ném `400 BAD_REQUEST` nếu gửi biên bản `NHAN_PHONG`).
    3. Nếu không truyền `bienBanId` nhưng trong database đã tồn tại biên bản `TRA_PHONG` của hợp đồng đó, từ chối thanh lý yêu cầu cung cấp căn cứ biên bản.
    4. Nếu số tiền khấu trừ trong yêu cầu thanh lý lệch với `tong_tien_khau_tru` trong biên bản, bắt buộc client phải gửi `xacNhanChenhLech = true` và `lyDo` không được rỗng.
    5. Ghi nhận nhật ký thao tác `NHAT_KY_THAO_TAC` bất biến lưu rõ `bienBanId` và `bbKhauTru`.
  - `HopDongThaoTac.tsx`: Form thanh lý đối chiếu số tiền khấu trừ với biên bản trả phòng đã lưu. Nếu khác nhau, yêu cầu người dùng tích chọn checkbox "Xác nhận số tiền khấu trừ khác biên bản bàn giao" và nhập lý do mới kích hoạt nút "Thanh lý hợp đồng".
- **Kiểm chứng:** `HopDongServiceTest` đã bổ sung và vượt qua các test cases kiểm tra biên bản sai hợp đồng, biên bản sai loại, bỏ qua biên bản khi đã có biên bản trả phòng, và chênh lệch khấu trừ chưa xác nhận (**8/8 passed**).

### 2.3. Chặn Stale Response trong Quản lý tài sản (P2.4)
- **Files:**
  - `frontend/src/QuanLyTaiSanPhong.tsx`
  - `frontend/src/QuanLyTaiSanPhong.test.tsx`
- **Nguyên nhân:** Khi chuyển đổi nhanh giữa các phòng (ví dụ A -> B -> A), các request fetch dữ liệu phòng cũ hoàn thành muộn có thể ghi đè dữ liệu của phòng mới được chọn.
- **Hành vi sau sửa:** Áp dụng cơ chế token phiên `requestIdRef` và cờ huỷ `isMountedRef`. Mọi response bất đồng bộ trả về từ `loadData`, `handleThemTaiSan`, `handleXoaTaiSan`, `handleLapBienBan` đều kiểm tra `requestIdRef.current === reqId`. Nếu người dùng đã chuyển phòng, response cũ bị huỷ bỏ ngay lập tức.
- **Kiểm chứng:** `QuanLyTaiSanPhong.test.tsx` bổ sung bài test mô phỏng request phòng A bị trễ (deferred promise), phòng B tải nhanh, sau đó chuyển lại phòng A. Kết quả kiểm chứng dữ liệu phòng mới nhất được giữ nguyên, không bị response cũ ghi đè (**passed**).

### 2.4. Chặn gian lận/bỏ qua đơn giá dịch vụ bậc thang (P2.5)
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

### 2.6. Chuẩn hoá Fixture PCCC & Bảng việc vận hành (P2.6)
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
| **Frontend Test Suite** | Vitest 4.1.11 | 31 suites / 216 tests | **216/216 PASSED (100%)** |
| **Frontend Production Build** | Vite + TypeScript (`tsc -b && vite build`) | Toàn bộ ứng dụng | **0 lỗi TypeScript, 0 lỗi bundle** |
| **Concurrency Integration Test** | JUnit 5 + PostgreSQL 17 Portable | 5 tests đa luồng (Latch) | **5/5 PASSED (100%)** |
| **Operational Tasks (PCCC)** | JUnit 5 + PostgreSQL 17 Portable | 8 tests integration | **8/8 PASSED (100%)** |
| **Money Schema ArchUnit** | JUnit 5 + PostgreSQL 17 Portable | 2 tests schema | **2/2 PASSED (100%)** |
| **Invoice Lifecycle Rules** | JUnit 5 | 29 tests parameterized | **29/29 PASSED (100%)** |
| **HopDongService Test** | Mockito / JUnit 5 | 8 tests | **8/8 PASSED (100%)** |
| **TaiSanService Test** | Mockito / JUnit 5 | 6 tests | **6/6 PASSED (100%)** |
| **HuyHoaDonNhapService Test**| Mockito / JUnit 5 | 3 tests | **3/3 PASSED (100%)** |
| **PublicPortalService Test** | Mockito / JUnit 5 | 4 tests | **4/4 PASSED (100%)** |
| **HopDongPdfService Test** | iText / JUnit 5 | 3 tests | **3/3 PASSED (100%)** |

### 4.2. Lưu ý kiểm thử chưa thực hiện:
- Kiểm tra trực quan layout đồ hoạ trang in PDF (Visual layout QA) của tệp xuất PDF hợp đồng chưa được kiểm tra bằng mắt người dùng; mới chỉ kiểm tra qua nội dung text trích xuất tự động bằng thư viện `PdfTextExtractor`.
