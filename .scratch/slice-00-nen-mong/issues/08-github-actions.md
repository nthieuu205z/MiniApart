# 08: Chạy kiểm thử rồi mới dựng ảnh · tự động hoá

**What to build:** Mỗi lần đẩy mã lên là máy tự build backend, build frontend, chạy toàn bộ kiểm thử, rồi **chỉ khi tất cả xanh** mới dựng ảnh Docker. Commit làm gãy luật ArchUnit hay làm hỏng test thì quy trình dừng ở đó, không có ảnh nào được dựng.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] Quy trình chạy được trên GitHub Actions, cấu hình nằm trong repo
- [x] Có bước chạy kiểm thử **trước** bước dựng ảnh, và bước sau phụ thuộc bước trước
- [x] Kiểm thử tích hợp cần PostgreSQL thật thì chạy được trên máy CI — run [33060416098](https://github.com/nthieuu205z/MiniApart/actions/runs/33060416098) chạy xanh job backend trên runner GitHub; bộ test dùng `@Testcontainers` với PostgreSQL 17
- [ ] **Chứng minh nó chặn được:** đẩy một nhánh cố tình vi phạm luật ArchUnit, xem CI đỏ và không dựng ảnh. Chụp màn hình, để dành cho Chương 5. Rồi xoá nhánh đó
- [x] Không có mật khẩu, khoá, hay chuỗi kết nối nào viết thẳng trong file cấu hình quy trình
- [x] Thời gian chạy đủ nhanh để nhóm chịu chờ — run [33060416098](https://github.com/nthieuu205z/MiniApart/actions/runs/33060416098) hoàn tất trong khoảng 2 phút 40 giây; chưa cần tách job

## Comments

- Workflow file is present in the repo and statically checked locally. GitHub run [33060416098](https://github.com/nthieuu205z/MiniApart/actions/runs/33060416098) completed green for frontend tests/build, backend tests, and Docker image builds.
- The backend job ran `./gradlew test --no-daemon` successfully on GitHub-hosted Ubuntu with Temurin JDK 21. The suite includes PostgreSQL 17 Testcontainers integration tests, so this run verifies the real-PostgreSQL test path on CI.
- The run took approximately 2 minutes 40 seconds end-to-end (backend job: about 1 minute 37 seconds; Docker build job: about 57 seconds).
- External live proof on a deliberately broken remote branch remains deferred. This task dispatch explicitly forbids creating, pushing, screenshotting, or deleting that branch from the agent session, so the proof must be completed later by a human-approved GitHub follow-up.
