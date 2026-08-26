# 08: Chạy kiểm thử rồi mới dựng ảnh · tự động hoá

**What to build:** Mỗi lần đẩy mã lên là máy tự build backend, build frontend, chạy toàn bộ kiểm thử, rồi **chỉ khi tất cả xanh** mới dựng ảnh Docker. Commit làm gãy luật ArchUnit hay làm hỏng test thì quy trình dừng ở đó, không có ảnh nào được dựng.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] Quy trình chạy được trên GitHub Actions, cấu hình nằm trong repo
- [x] Có bước chạy kiểm thử **trước** bước dựng ảnh, và bước sau phụ thuộc bước trước
- [ ] Kiểm thử tích hợp cần PostgreSQL thật thì chạy được trên máy CI
- [ ] **Chứng minh nó chặn được:** đẩy một nhánh cố tình vi phạm luật ArchUnit, xem CI đỏ và không dựng ảnh. Chụp màn hình, để dành cho Chương 5. Rồi xoá nhánh đó
- [x] Không có mật khẩu, khoá, hay chuỗi kết nối nào viết thẳng trong file cấu hình quy trình
- [ ] Thời gian chạy đủ nhanh để nhóm chịu chờ — nếu quá chậm thì tách kiểm thử nhanh và kiểm thử tích hợp thành hai việc song song

## Comments

- Workflow file is present in the repo and statically checked locally, but this fix round did not complete a backend GitHub run or the required deliberately broken remote-branch proof.
- External live proof on a deliberately broken remote branch remains deferred. This task dispatch explicitly forbids creating, pushing, screenshotting, or deleting that branch from the agent session, so the proof must be completed later by a human-approved GitHub follow-up.
