# 08: Chạy kiểm thử rồi mới dựng ảnh · tự động hoá

**What to build:** Mỗi lần đẩy mã lên là máy tự build backend, build frontend, chạy toàn bộ kiểm thử, rồi **chỉ khi tất cả xanh** mới dựng ảnh Docker. Commit làm gãy luật ArchUnit hay làm hỏng test thì quy trình dừng ở đó, không có ảnh nào được dựng.

**Blocked by:** 02

**Status:** done

- [x] Quy trình chạy được trên GitHub Actions, cấu hình nằm trong repo
- [x] Có bước chạy kiểm thử **trước** bước dựng ảnh, và bước sau phụ thuộc bước trước
- [x] Kiểm thử tích hợp cần PostgreSQL thật thì chạy được trên máy CI — run [33060416098](https://github.com/nthieuu205z/MiniApart/actions/runs/33060416098) chạy xanh job backend trên runner GitHub; bộ test dùng `@Testcontainers` với PostgreSQL 17
- [x] **Chứng minh nó chặn được:** run [33478197915](https://github.com/nthieuu205z/MiniApart/actions/runs/33478197915) — `Backend tests` **failure**, `Frontend tests and build` **success**, `Docker image builds` **skipped**. Nhánh `codex/ci-proof-archunit` đã xoá cả ở máy lẫn trên `origin`
- [x] Không có mật khẩu, khoá, hay chuỗi kết nối nào viết thẳng trong file cấu hình quy trình
- [x] Thời gian chạy đủ nhanh để nhóm chịu chờ — run [33060416098](https://github.com/nthieuu205z/MiniApart/actions/runs/33060416098) hoàn tất trong khoảng 2 phút 40 giây; chưa cần tách job

## Comments

- Workflow file is present in the repo and statically checked locally. GitHub run [33060416098](https://github.com/nthieuu205z/MiniApart/actions/runs/33060416098) completed green for frontend tests/build, backend tests, and Docker image builds.
- The backend job ran `./gradlew test --no-daemon` successfully on GitHub-hosted Ubuntu with Temurin JDK 21. The suite includes PostgreSQL 17 Testcontainers integration tests, so this run verifies the real-PostgreSQL test path on CI.
- The run took approximately 2 minutes 40 seconds end-to-end (backend job: about 1 minute 37 seconds; Docker build job: about 57 seconds).
- External live proof on a deliberately broken remote branch remains deferred. This task dispatch explicitly forbids creating, pushing, screenshotting, or deleting that branch from the agent session, so the proof must be completed later by a human-approved GitHub follow-up.

### Hoàn tất tiêu chí cuối — 01/09/2026

Tiêu chí *"chứng minh nó chặn được"* bị hoãn từ phiên trước vì phiên đó bị cấm tạo, đẩy và xoá nhánh. Nay đã làm xong, có người duyệt.

**Cách làm.** Dựng worktree riêng `.worktrees/codex-ci-proof-archunit` trên nhánh `codex/ci-proof-archunit`, **không** đổi nhánh của thư mục làm việc chính — lúc đó đang có agent khác làm việc ở worktree `codex-nap-bo-thiet-ke-frontend`. Đổi nhánh tại chỗ sẽ kéo thư mục chung sang nhánh khác giữa lúc người khác đang sửa.

**Vi phạm cố ý.** Thêm một lớp dùng `double` trong gói `com.prj1.ccm.billing`:

```java
public double tinhSai(double donGia, double soLuong) {
    return donGia * soLuong;
}
```

Chọn **phương thức** chứ không phải trường là có chủ đích: luật `noFloatingPointFieldsInBilling` trước đợt soát lỗi sau Slice 04 **chỉ soi trường**, nên đoạn này sẽ **lọt**. Phép thử vì thế chứng minh luôn bản vá ở ticket `soat-loi-sau-slice-04 · 04` có tác dụng thật.

**Kết quả — đúng ba trạng thái khác nhau trong một run:**

| Job | Kết quả |
|---|---|
| `Frontend tests and build` | ✅ success |
| `Backend tests` | ❌ failure — `frInv02ProductionCodeMustRejectFloatingPointMembersInBilling` |
| `Docker image builds` | ⊘ **skipped** |

Ba trạng thái khác nhau là bằng chứng mạnh hơn một màn đỏ toàn tập: nó cho thấy CI chặn **có chọn lọc**, đúng chỗ. `docker-build` khai `needs: [backend-test, frontend-test-build]` nên backend đỏ là nó không chạy — **không có ảnh Docker nào được dựng**.

**Về ảnh chụp cho Chương 5.** Nhánh đã xoá nhưng **trang run tồn tại vĩnh viễn**, chụp lại lúc nào cũng được:
`https://github.com/nthieuu205z/MiniApart/actions/runs/33478197915`

Bằng chứng dạng liên kết bền hơn ảnh chụp — không sợ mất tệp, và người chấm tự mở kiểm chứng được.

**Dọn dẹp.** Nhánh xoá ở cả `origin` lẫn máy, worktree gỡ. `main` vẫn ở `c5377e3`, không bị chạm.
