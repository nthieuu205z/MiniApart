# PRJ1-CCM — MiniApart

Hệ thống Quản lý và Vận hành Chung cư mini. Đồ án môn Project 1.

**Stack:** Spring Boot + PostgreSQL + React · Docker Compose · Flyway · JUnit 5 + jqwik + Testcontainers + ArchUnit

## Nguồn sự thật

Đọc trước khi làm bất cứ việc gì:

| File | Nội dung |
|---|---|
| `Doc/PRJ1_Ke-hoach-trien-khai.md` | Kế hoạch 13 vertical slice, thứ tự làm, tiêu chí hoàn thành |
| `Doc/PRJ1_Phan-tich-yeu-cau_Chung-cu-mini.md` | 37 US · 93 FR · 36 NFR · 23 BR · 29 thực thể |
| `Doc/PRJ1_Bao-cao_Chuong-3_Phan-tich-thiet-ke.md` | Sơ đồ lớp, ERD, sơ đồ tuần tự |
| `Doc/PRJ1_Bao-cao_Chuong-4_Cong-nghe.md` | Quyết định công nghệ và lý do |

Tài liệu viết bằng tiếng Việt. **Không sửa file trong `Doc/` khi đang code** trừ khi ticket yêu cầu.

## Sáu quy ước ép bằng máy

Mục 4 của kế hoạch triển khai. Vi phạm là gãy build, không phải là góp ý.

1. Tiền dùng `BigDecimal` (Java) và `NUMERIC(15,2)` (Postgres). **Cấm `double`, `float`** — ArchUnit kiểm.
2. Mọi thay đổi lược đồ đi qua migration Flyway đánh số tăng dần. **Không sửa file đã chạy.**
3. Mặc định từ chối truy cập. Mọi endpoint có test gọi bằng vai trò sai và khẳng định 403.
4. Mọi endpoint có mã FR trong Javadoc. Mọi test có mã FR trong tên.
5. Ảnh không phục vụ trực tiếp — luôn qua liên kết ký hạn 15 phút.
6. Cổng 5432 không publish ra ngoài mạng Docker.

## Ranh giới `billing/calc`

Gói `com.prj1.ccm.billing.calc` cài đặt BR-01 → BR-19 và **không được phụ thuộc vào Spring, JPA, hay cơ sở dữ liệu**. Nhận tham số vào, trả kết quả ra, không đọc ghi. ArchUnit ép ràng buộc này.

Hệ quả: test cho gói này chạy trong mili giây, không dựng context. Viết test **trước** phần cài đặt — đây là điều kiện bắt buộc của Vertical Slice 4, không phải khuyến nghị.

## Ngôn ngữ

- Mã nguồn, tên biến, tên test, commit message: **tiếng Anh**
- Ticket, tài liệu, chuỗi hiển thị cho người dùng: **tiếng Việt**
- Tên bảng và cột trong cơ sở dữ liệu: **tiếng Việt không dấu, viết hoa** (`NGUOI_DUNG`, `HOA_DON`) — khớp với ERD ở Chương 3

## Agent skills

### Issue tracker

Ticket là file markdown trong `.scratch/`, được commit vào repo. Xem `docs/agents/issue-tracker.md`.

### Triage labels

Dùng năm nhãn mặc định. Xem `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` ở gốc repo, ADR trong `docs/adr/`. Xem `docs/agents/domain.md`.
