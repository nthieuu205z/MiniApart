# PRJ1-CCM — MiniApart

Hệ thống Quản lý và Vận hành Chung cư mini. Đồ án môn Project 1.

**Stack:** Java 21 LTS + Spring Boot 4.1 + PostgreSQL 17 + React 19 · Docker Compose · Flyway · JUnit 5 + jqwik + Testcontainers + ArchUnit

## Nguồn sự thật

Đọc trước khi làm bất cứ việc gì:

| File | Nội dung |
|---|---|
| `Doc/PRJ1_Ke-hoach-trien-khai.md` | Kế hoạch 13 vertical slice, thứ tự làm, tiêu chí hoàn thành |
| `Doc/PRJ1_Phan-tich-yeu-cau_Chung-cu-mini.md` | 37 US · 93 FR · 36 NFR · 23 BR · 29 thực thể |
| `Doc/PRJ1_Bao-cao_Chuong-3_Phan-tich-thiet-ke.md` | Sơ đồ lớp, ERD, sơ đồ tuần tự |
| `Doc/PRJ1_Bao-cao_Chuong-4_Cong-nghe.md` | Quyết định công nghệ và lý do |

Tài liệu viết bằng tiếng Việt. **Không sửa file trong `Doc/` khi đang code** trừ khi ticket yêu cầu.

## Quy trình phối hợp agent — Matt Pocock Skills vs Superpowers

Repo này dùng hai bộ skill cho hai việc khác nhau: **Matt Pocock Skills quyết định LÀM GÌ** (khám phá yêu cầu, viết spec, chẻ ticket — chính là cách `.scratch/` đã được dựng), **Superpowers quyết định LÀM NHƯ THẾ NÀO** (thực thi, TDD, review, xác minh trước khi coi là xong). Nội dung gốc dưới đây giữ nguyên tiếng Anh vì là quy tắc quy trình, không phải sự kiện riêng của PRJ1.

### 1. Ownership

**Matt Pocock Skills owns WHAT to build.** Use Matt skills for: requirement discovery, product and domain clarification, research, domain modeling, architectural exploration, specification creation, ticket decomposition.

The normal planning flow is: `grill-with-docs` → optional research / domain-modeling / codebase-design → `to-spec` → `to-tickets` → human approval.

Approved Matt specs and tickets are the authoritative source of truth for product behavior and implementation scope.

**Superpowers owns HOW to build it.** After a Matt spec and its tickets have been approved, use Superpowers for: git worktree isolation, implementation execution, test-driven development, subagent-driven development, systematic debugging, specification compliance review, code-quality review, verification before completion, finishing the development branch.

### 2. Planning Boundary

When an approved Matt spec and ticket set already exist:

- DO NOT rerun Superpowers brainstorming merely to rediscover the requirements.
- DO NOT invoke Superpowers writing-plans merely to recreate the approved Matt planning artifacts.
- DO NOT create a second competing specification.
- DO NOT create a second competing ticket/task breakdown.

The approved Matt artifacts satisfy the feature discovery, design, and planning gate. Treat the approved Matt ticket set as the implementation plan for Superpowers execution.

### 3. Matt Execution Skills

Do not use Matt Pocock execution workflows for approved feature implementation. Do not use: Matt implement, Matt tdd, Matt code-review, Matt diagnosing-bugs — when Superpowers owns the current implementation session. Superpowers execution skills take precedence for implementation, testing, debugging, and review.

### 4. Source of Truth

For product behavior, authority order is: (1) approved Matt specification, (2) approved ticket acceptance criteria, (3) project domain documentation / `CONTEXT.md`, (4) implementation code. Code does not redefine the specification.

### 5. Ambiguity Rules

Distinguish product ambiguity from implementation ambiguity.

**Product or domain ambiguity** — unclear business behavior, conflicting acceptance criteria, missing user-facing behavior, unclear domain rule, architecture decision that materially changes the approved design. Do NOT silently invent a requirement. Return the issue to the Matt planning layer and update the relevant spec/ticket before continuing the affected work.

**Implementation ambiguity** — private helper placement, internal naming, local refactoring, equivalent implementation detail, non-user-visible structural choice. Superpowers may make a reasonable engineering ruling and continue, provided it does not contradict the approved spec or ticket.

### 6. Ticket Execution

Each approved Matt ticket is an execution unit. Prefer tickets that are vertical slices and independently verifiable (đúng cách `.scratch/` đã cắt theo 13 vertical slice).

For each ticket: (1) identify acceptance criteria and relevant spec sections, (2) use the appropriate Superpowers execution workflow, (3) implement with TDD when behavior is changing, (4) run required tests, (5) perform specification-compliance review, (6) perform code-quality review, (7) only then mark the ticket complete (đổi `Status:` thành `done` theo `docs/agents/issue-tracker.md`). Do not silently expand ticket scope.

### 7. Worktrees

For substantial feature implementation, use an isolated git worktree. Never implement substantial feature work directly on main/master unless explicitly instructed by the human.

### 8. Debugging

Implementation defect → Superpowers systematic-debugging. Missing or ambiguous expected behavior → return to Matt planning/specification layer.

### 9. Review

Superpowers review is the default and mandatory implementation review. Do not additionally run Matt code-review by default. An independent Matt review may only be used when explicitly requested for high-risk or major changes.

### 10. Verification

Do not claim a feature or ticket is complete based only on inspection. Before completion, run fresh verification appropriate to the project, such as: unit tests, integration tests, type checking, linting, build, end-to-end tests where applicable. Use Superpowers verification-before-completion before declaring the implementation finished.

### 11. Human Approval Gate

Matt planning and Superpowers execution are separated by an approval gate. Do not begin feature implementation until the human has approved the specification and ticket breakdown.

Once approved, execute the approved work continuously unless blocked by: destructive or irreversible action, security-sensitive action requiring approval, external side effects requiring approval, or a product/specification ambiguity that makes implementation materially guesswork.

### 12. Core Rule

Matt decides WHAT to build and how the work is sliced. Superpowers decides HOW approved slices are implemented. Neither system recreates the other system's artifacts.

## Sáu quy ước ép bằng máy

Mục 4 của kế hoạch triển khai. Vi phạm là gãy build, không phải là góp ý.

1. Tiền dùng `BigDecimal` (Java) và `NUMERIC(15,2)` (Postgres). **Cấm `double`, `float`, `Double`, `Float`** — ArchUnit kiểm.
2. Mọi thay đổi lược đồ đi qua migration Flyway đánh số tăng dần. **Không sửa file đã chạy.**
3. Mặc định từ chối truy cập. Mọi endpoint có test gọi bằng vai trò sai và khẳng định 403.
4. Mọi endpoint có mã FR trong Javadoc. Mọi test có mã FR trong tên.
5. Ảnh không phục vụ trực tiếp — luôn qua liên kết ký hạn 15 phút.
6. Cổng 5432 không publish ra ngoài mạng Docker.

## Ranh giới `billing/calc`

Gói `com.prj1.ccm.billing.calc` cài đặt BR-01 → BR-19 và **không được phụ thuộc vào Spring, JPA, hay cơ sở dữ liệu**. Nhận tham số vào, trả kết quả ra, không đọc ghi. ArchUnit ép ràng buộc này.

Hệ quả: test cho gói này chạy trong mili giây, không dựng context. Viết test **trước** phần cài đặt — đây là điều kiện bắt buộc của Vertical Slice 4, không phải khuyến nghị.

## Không nâng Java quá 21 nếu chưa kiểm tra ArchUnit

ASM mà ArchUnit đóng gói chỉ đọc được tệp lớp tới một phiên bản Java nhất định. Gặp tệp lớp mới hơn nó **bỏ qua trong im lặng**, và mọi luật kiến trúc báo xanh trong khi không soi vào lớp nào. Dự án đã dính đúng lỗi này với Java 26.

`ArchitectureRulesTest.rulesActuallySeeTheProductionCode()` là chốt chặn: nó gãy build nếu ArchUnit nhập được 0 lớp. Đừng xoá hay nới lỏng phép kiểm đó.

## Ngôn ngữ trong mã nguồn

Chia theo **thứ có mặt trong báo cáo hay không**, không chia theo sở thích.

| Loại | Ngôn ngữ | Vì sao |
|---|---|---|
| Lớp miền, thuộc tính, enum — thứ xuất hiện trong sơ đồ lớp Chương 3 và ERD | **Tiếng Việt** không dấu: `NguoiDung`, `ToaNha`, `VaiTro`, `nguongThatThoat` | Sơ đồ lớp ở Chương 3 dùng đúng những tên này. Đặt tên khác là biến sơ đồ trong báo cáo thành sai |
| Bảng và cột cơ sở dữ liệu | **Tiếng Việt** không dấu, viết hoa: `NGUOI_DUNG`, `phien_ban_token` | Khớp ERD |
| Hạ tầng kỹ thuật không có trong báo cáo: cấu hình, bộ lọc, tiện ích | Tiếng Anh: `SecurityConfig`, `JwtService` | Không nằm trong sơ đồ nào, và là từ vựng chuẩn của khung ứng dụng |
| Chú thích trong mã, commit message | Tiếng Anh | Ngắn, và khớp thuật ngữ của thư viện |
| Ticket, tài liệu, chuỗi hiển thị cho người dùng | Tiếng Việt | |

**Quy tắc quyết định:** trước khi đặt tên một lớp, tìm nó trong `Doc/diagrams-v2/10-class-domain.mmd` và `07-erd-v2.mmd`. Có ở đó thì **chép đúng tên**, đừng dịch.

## Agent skills

### Bắt đầu ở đâu

Session code mới: đọc **`.scratch/BAN-GIAO.md`** trước tiên. Nó có môi trường cần gì, các bẫy kỹ thuật đã gặp, và cách lấy ticket tiếp theo. Đọc luôn mục "Quy trình phối hợp agent" ở trên để biết ranh giới giữa lập kế hoạch (Matt) và thực thi (Superpowers).

### Issue tracker

Ticket là file markdown trong `.scratch/`, được commit vào repo. Xem `docs/agents/issue-tracker.md`.

### Triage labels

Dùng năm nhãn mặc định. Xem `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` ở gốc repo, ADR trong `docs/adr/`. Xem `docs/agents/domain.md`.
