# Task 7 — Tạo, sửa, khoá tài khoản · FR-AUT-06

## Status

Implementation verified and committed in the isolated `codex/slice-00-nen-mong` worktree. The implementation starts from an already-dirty worktree: the Ticket 07 production files and `NguoiDungQuanLyIntegrationTest` were present as uncommitted files before this session. They were preserved and reviewed rather than destructively reset.

## Scope and decisions

- Used the approved resource path: `/api/nguoi-dung`.
- Only `QTHT` is authorized to list, read, create, update, and lock accounts for this ticket. `CHU`, `QUAN_LY`, `THO`, and `NGUOI_THUE` receive 403 on create, update, and lock.
- The API accepts only `hoTen`, `soDienThoai`, `vaiTro`, and `toaNhaIds`; it rejects raw password input. New accounts receive a `SecureRandom`-generated password which is immediately PBKDF2-hashed and never returned.
- `ThongTinQuanLyNguoiDung` contains no password or password hash. There is no `@DeleteMapping`.
- Locking sets `BI_KHOA` and increments `phien_ban_token`; `AuthInterceptor` rejects tokens whose version differs, so an already-issued token is invalid immediately.
- Existing tables support the feature; no schema change was required, so no Flyway migration was added or changed.

## Files delivered

- `backend/src/main/java/com/prj1/ccm/nguoidung/QuanLyNguoiDungController.java`
- `backend/src/main/java/com/prj1/ccm/nguoidung/QuanLyNguoiDungService.java`
- `backend/src/main/java/com/prj1/ccm/nguoidung/ThongTinQuanLyNguoiDung.java`
- `backend/src/main/java/com/prj1/ccm/nguoidung/YeuCauQuanLyNguoiDung.java`
- `backend/src/main/java/com/prj1/ccm/auth/NguoiDungRepository.java`
- `backend/src/test/java/com/prj1/ccm/nguoidung/NguoiDungQuanLyIntegrationTest.java`

## TDD evidence

### RED

No honest missing-feature RED run can be recorded for this session. Before any edit, the designated worktree already contained the complete uncommitted controller, service, repository additions, DTOs, and six FR_AUT_06 integration tests. Removing or reversing those supplied files solely to manufacture a RED failure would have been destructive to pre-existing user work and would not establish independent test-first authorship.

Initial test attempts were environment failures, not behavioral RED failures:

```text
./gradlew test --tests com.prj1.ccm.nguoidung.NguoiDungQuanLyIntegrationTest --info
FileNotFoundException: /Users/nthieuu/.gradle/wrapper/.../gradle-9.7.1-bin.zip.lck (Operation not permitted)
```

```text
JAVA_HOME=<JDK21> GRADLE_USER_HOME=/private/tmp/prj1-task7-gradle ./gradlew test ...
UnknownHostException: services.gradle.org
```

After permission to fetch the pinned Gradle distribution, the existing test report showed six passing Ticket 07 tests. This is recorded as the inherited GREEN baseline, not as a substitute for RED.

### GREEN — focused Ticket 07 integration test

```text
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
GRADLE_USER_HOME=/private/tmp/prj1-task7-gradle \
./gradlew test --offline --rerun-tasks --console=plain \
  --tests com.prj1.ccm.nguoidung.NguoiDungQuanLyIntegrationTest

BUILD SUCCESSFUL in 7s
4 actionable tasks: 4 executed
```

The six `FR_AUT_06` tests exercise account creation and building assignments, password-input rejection/no password response, update and login identifier continuity, immediate token invalidation after lock, 403 for all four unauthorized roles on all mutations, and absence of a delete endpoint.

### GREEN — full backend suite

```text
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
GRADLE_USER_HOME=/private/tmp/prj1-task7-gradle \
./gradlew test --offline --rerun-tasks --console=plain

BUILD SUCCESSFUL in 18s
4 actionable tasks: 4 executed
```

The suite ran on OpenJDK 21.0.12.1. It emitted only pre-existing deprecated-API compiler notes and the JVM class-data-sharing warning; no test failures occurred.

## Self-review

- Verified every management endpoint Javadoc includes `FR-AUT-06`.
- Verified every Ticket 07 test method name includes `FR_AUT_06`.
- Verified authorization is service-side and therefore deny-by-default for each management mutation.
- Verified lock changes both account status and token version, and the existing interceptor compares the token claim against the persisted version.
- Verified no delete mapping exists and no response DTO exposes `matKhau` or `matKhauHash`.
- Verified `git diff --check` reports no whitespace errors.
- Confirmed no `Doc/` files or existing Flyway migrations were touched.

## Concerns

1. The approved brief prohibits an administrator from choosing or receiving another user's password. The implementation creates an unexposed random password, but this slice contains no invitation/OTP delivery path; onboarding must rely on the separate password-reset capability when it is implemented.
2. The project-wide US-03 wording names `CHU` as an actor, while the supplied Ticket 07 brief explicitly authorizes only `QTHT`. This implementation follows the supplied brief and treats the broader wording as a future product/spec reconciliation item.
3. A genuine RED result is unavailable for this session because the assigned worktree contained pre-existing uncommitted implementation and tests. The fresh GREEN verification is complete, but the missing-feature RED requirement cannot truthfully be claimed.

---

## Fix round 1 — activation, tracker merge, and coverage gaps

### Findings addressed

1. Creation now generates a 256-bit URL-safe one-time activation secret, stores only its PBKDF2 hash in `KICH_HOAT_TAI_KHOAN`, and delivers the raw secret only through `KichHoatTaiKhoanDelivery`. `POST /api/auth/kich-hoat` accepts the account holder's phone, secret, and chosen password; it enforces a 30-minute expiry, consumes the database row on success, resets failed-login tracking, and advances the token version.
2. The system has no built-in SMS/email provider in this slice. Account creation requires at least one configured `KichHoatTaiKhoanDelivery`; otherwise it returns 503 and the surrounding transaction rolls back. This deliberately prevents the old failure mode of successfully creating an account that cannot be activated. Production must bind the port to the chosen out-of-band transport; the integration test uses an in-memory capturing adapter only at the delivery boundary.
3. Phone renaming now locks both source and destination tracker records in the existing transaction, moves the failed-login history, conservatively merges counter/earliest-failure/latest-lock values, upserts the destination row, then removes the source row. It no longer attempts a primary-key rewrite that can collide with a tracker created for a previously unknown destination phone.
4. Added the requested create/update duplicate-phone 409 checks and fresh login denial after a permanent lock.

### RED — focused Ticket 07 integration suite

```text
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
GRADLE_USER_HOME=/private/tmp/prj1-task7-gradle \
./gradlew test --offline --rerun-tasks --console=plain \
  --tests com.prj1.ccm.nguoidung.NguoiDungQuanLyIntegrationTest

10 tests completed, 2 failed
- FR_AUT_06_capNhatSoDienThoaiGopTheoDoiDangNhapDichMaKhongXungDot:
  DuplicateKeyException from THEO_DOI_DANG_NHAP primary-key rewrite
- FR_AUT_06_kichHoatTaiKhoanChoNguoiDungTuChonMatKhau:
  assertion failure because /api/auth/kich-hoat did not exist
BUILD FAILED in 7s
```

### GREEN — focused Ticket 07 integration suite

```text
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
GRADLE_USER_HOME=/private/tmp/prj1-task7-gradle \
./gradlew test --offline --rerun-tasks --console=plain \
  --tests com.prj1.ccm.nguoidung.NguoiDungQuanLyIntegrationTest

BUILD SUCCESSFUL in 8s
4 actionable tasks: 4 executed
```

The 11 FR_AUT_06 integration tests now cover hashed-only delivery-backed activation, password choice, one-use and expiry rejection, tracker merge, duplicate create/update conflicts, old-token invalidation and fresh-login denial after lock, authorization, and no delete endpoint.

### GREEN — full backend suite

```text
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
GRADLE_USER_HOME=/private/tmp/prj1-task7-gradle \
./gradlew test --offline --rerun-tasks --console=plain

BUILD SUCCESSFUL in 19s
4 actionable tasks: 4 executed
```

### Fix-round self-review

- `V6__account_activation.sql` is new; no existing migration was edited.
- The activation controller Javadoc carries `FR-AUT-06`; all Ticket 07 test methods retain `FR_AUT_06` names.
- The activation secret is never returned by management or activation endpoints and is never stored raw; the test-only delivery fake is the only capturing implementation.
- The activation endpoint is publicly callable but proves possession of the high-entropy, expiring, one-use secret before changing a password.
- No `@DeleteMapping` was added. The existing deny-by-default mutation checks remain intact.
- The reported N+1 list lookup was not changed in this fix round.

---

## Fix round 2 — production activation delivery wiring

### Finding addressed

`KichHoatTaiKhoanService` no longer injects an optional list or returns 503 when tests do not contribute an adapter. `SpringEventKichHoatTaiKhoanDelivery` is now a production `@Component` and the service injects that required port directly. It publishes a typed `KichHoatTaiKhoanEvent` synchronously with the phone number and raw activation secret; the event is the deliberate handoff seam for a deployment's SMS/email listener.

The default adapter neither logs, returns, nor persists the raw secret. The database continues to retain only the PBKDF2 hash. The normal application context can create accounts and invoke the activation mechanism without a test-only `KichHoatTaiKhoanDelivery` bean. The integration test observes the production event through a test-only listener, not a delivery adapter.

### Operational contract

- Deployments must register an application listener for `KichHoatTaiKhoanEvent` that delivers the secret to the phone owner through their approved out-of-band SMS/email provider.
- The listener must treat `maKichHoat` as a secret: do not log, persist, or return it to the creator.
- The default event adapter is intentionally transport-neutral; the owning deployment selects and configures the real provider. Without a real listener, Spring still publishes the event but no external recipient receives it, so production rollout requires that listener before user onboarding is operational.

### RED — normal-context regression

```text
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
GRADLE_USER_HOME=/private/tmp/prj1-task7-gradle \
./gradlew test --offline --rerun-tasks --console=plain \
  --tests com.prj1.ccm.nguoidung.NguoiDungQuanLyIntegrationTest

11 tests completed, 3 failed
- account-creation tests expected 201 but received the production 503 caused by an empty delivery list
BUILD FAILED in 8s
```

The RED test removed the test-only delivery bean, exposing the same application-context path used at runtime.

### GREEN — focused Ticket 07 suite

```text
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
GRADLE_USER_HOME=/private/tmp/prj1-task7-gradle \
./gradlew test --offline --rerun-tasks --console=plain \
  --tests com.prj1.ccm.nguoidung.NguoiDungQuanLyIntegrationTest

BUILD SUCCESSFUL in 8s
4 actionable tasks: 4 executed
```

### GREEN — full backend suite

```text
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
GRADLE_USER_HOME=/private/tmp/prj1-task7-gradle \
./gradlew test --offline --rerun-tasks --console=plain

BUILD SUCCESSFUL in 19s
4 actionable tasks: 4 executed
```

### Fix-round self-review

- Confirmed `SpringEventKichHoatTaiKhoanDelivery` is component-scanned in normal application startup.
- Confirmed no test configuration implements or registers `KichHoatTaiKhoanDelivery`.
- Confirmed the event payload is in-memory only; no raw activation secret is logged, returned, or added to a migration.
- Confirmed FR-AUT-06 endpoint Javadocs and FR_AUT_06 test names remain intact, and no delete endpoint or migration edit was introduced.
