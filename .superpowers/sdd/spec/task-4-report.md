# Task 4 Report — FR-AUT-02 Temporary Login Lock

## Scope

- Ticket: `.scratch/slice-00-nen-mong/issues/04-khoa-tam-sau-5-lan-sai.md`
- Branch: `codex/slice-00-nen-mong`
- Commit: `fb1a38d` (`Implement FR-AUT-02 temporary login lock`)

Implemented behavior:

- Count wrong-password attempts in a true sliding 15-minute window.
- Lock login for 15 minutes after the 5th wrong password in-window; the 6th attempt is denied even if the password is correct.
- Reset failure state on successful login.
- Revoke existing tokens immediately when the lock is activated by incrementing `phien_ban_token`.
- Keep the generic non-enumerating failure for unknown phone vs wrong password.
- Return a lock message that tells the user when login becomes available again.

## Why A Forward Migration Was Added

The pre-existing columns `so_lan_sai`, `lan_sai_dau_tien`, and `khoa_den` are not enough to represent an exact sliding window in all cases. A counter plus the oldest timestamp cannot distinguish cases like:

- wrong attempts at `07:00`, `07:10`, `07:11`, `07:12`, `07:16`, `07:17`

At `07:18`, the last 15 minutes still contain five wrong attempts (`07:10`, `07:11`, `07:12`, `07:16`, `07:17`), so login must still be locked. That cannot be computed exactly from only `so_lan_sai` + `lan_sai_dau_tien`.

To preserve the approved semantics exactly, I added:

- `backend/src/main/resources/db/migration/V3__login_lock_tracking.sql`

This creates `LAN_DANG_NHAP_SAI` for server-side failed-attempt timestamps. The existing `NGUOI_DUNG.so_lan_sai`, `lan_sai_dau_tien`, and `khoa_den` are still updated as derived current state.

## Implementation Summary

Backend changes:

- Added `AuthClockConfig` to inject a `Clock` instead of using wall-clock calls directly.
- Changed `JwtTokenService` to accept injected `Clock`.
- Extended auth flow with `NguoiDungDangNhap` to read lock metadata and attempt counters for login.
- Added repository operations for:
  - `SELECT ... FOR UPDATE` during login
  - pruning old failed-attempt rows
  - inserting a failed-attempt timestamp
  - counting and finding the oldest in-window failure
  - activating lock + incrementing `phien_ban_token`
  - resetting login-failure state on success / lock expiry
- Added `DangNhapTamKhoaException` and handler response.
- Updated login endpoint Javadoc to mention `FR-AUT-02`.

Concurrency / atomicity:

- `XacThucService.dangNhap()` is transactional.
- The login user row is loaded with `FOR UPDATE`, so updates for one account serialize correctly.
- `noRollbackFor = {DangNhapThatBaiException.class, DangNhapTamKhoaException.class}` is required so failed-attempt state persists even when login is rejected.

Ticket state:

- Marked `.scratch/slice-00-nen-mong/issues/04-khoa-tam-sau-5-lan-sai.md` as `done`.

## TDD Evidence

### RED 1 — Integration contract first

Command:

```bash
env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test --tests com.prj1.ccm.auth.AuthenticationIntegrationTest
```

Observed failure:

```text
AuthenticationIntegrationTest > FR_AUT_02_lockingAnAccountRevokesPreviouslyIssuedTokensImmediately() FAILED
    java.lang.AssertionError at AuthenticationIntegrationTest.java:170

AuthenticationIntegrationTest > FR_AUT_02_loginRejectsTheSixthAttemptEvenWhenThePasswordBecomesCorrectAfterFiveWrongAttempts() FAILED
    java.lang.AssertionError at AuthenticationIntegrationTest.java:151

9 tests completed, 2 failed
```

Failure detail:

- expected `401` but got `200` for the 6th login attempt
- expected `401` but got `200` for `/api/auth/me` with a token issued before the lock

### GREEN 1 — Contract after implementation

Command:

```bash
env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test --tests com.prj1.ccm.auth.AuthenticationIntegrationTest
```

Output:

```text
> Task :test

BUILD SUCCESSFUL in 6s
4 actionable tasks: 3 executed, 1 up-to-date
```

### RED/GREEN 2 — Time semantics without sleeping

Added `backend/src/test/java/com/prj1/ccm/auth/XacThucServiceTest.java` with:

- `FR_AUT_02_lockExpiresAndAllowsLoginAgainWithoutSleeping`
- `FR_AUT_02_countsWrongPasswordsInTheSlidingWindowInsteadOfAcrossTheWholeAccountLifetime`
- `FR_AUT_02_successfulLoginResetsTheFailureCounter`

These tests use a mutable injected `Clock`; no real waiting is used.

Command:

```bash
env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test --tests com.prj1.ccm.auth.AuthenticationIntegrationTest --tests com.prj1.ccm.auth.XacThucServiceTest
```

Output:

```text
> Task :test

BUILD SUCCESSFUL in 7s
4 actionable tasks: 2 executed, 2 up-to-date
```

## Full Verification

### Backend

Command:

```bash
env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test
```

Output:

```text
> Task :test

BUILD SUCCESSFUL in 9s
4 actionable tasks: 1 executed, 3 up-to-date
```

### Frontend tests

Command:

```bash
npm test
```

Output:

```text
Test Files  2 passed (2)
Tests       5 passed (5)
Duration    178ms
```

### Frontend build

Command:

```bash
npm run build
```

Output:

```text
✓ built in 96ms
```

## Files Changed

- `.scratch/slice-00-nen-mong/issues/04-khoa-tam-sau-5-lan-sai.md`
- `backend/src/main/java/com/prj1/ccm/auth/AuthClockConfig.java`
- `backend/src/main/java/com/prj1/ccm/auth/AuthController.java`
- `backend/src/main/java/com/prj1/ccm/auth/AuthExceptionHandler.java`
- `backend/src/main/java/com/prj1/ccm/auth/DangNhapTamKhoaException.java`
- `backend/src/main/java/com/prj1/ccm/auth/JwtTokenService.java`
- `backend/src/main/java/com/prj1/ccm/auth/NguoiDungDangNhap.java`
- `backend/src/main/java/com/prj1/ccm/auth/NguoiDungRepository.java`
- `backend/src/main/java/com/prj1/ccm/auth/XacThucService.java`
- `backend/src/main/resources/db/migration/V3__login_lock_tracking.sql`
- `backend/src/test/java/com/prj1/ccm/auth/AuthenticationIntegrationTest.java`
- `backend/src/test/java/com/prj1/ccm/auth/XacThucServiceTest.java`

## Self-Review

- The lock is enforced on the server, not in client state.
- Existing tokens are invalidated at lock activation, not only on the next successful login.
- The sixth-attempt-correct case is covered in integration tests.
- The exact sliding-window edge case that the old schema could not represent is covered in unit tests.
- Successful login and expired-lock recovery both reset state.
- The login lock message is generic and does not explicitly reveal whether a phone number exists.

## Concerns

No unresolved functional concerns after verification.

The only notable design decision is the new technical table `LAN_DANG_NHAP_SAI`, which was added because the approved sliding-window requirement cannot be implemented exactly with only the three existing columns.

## Fix Round 1 — Non-Enumeration Repair

### Reviewer Finding Verified

The review was correct: the previous implementation only loaded and persisted temporary-lock state for an existing `NGUOI_DUNG` row. Unknown phones returned the generic failure immediately, while known phones could return the lock-until message after repeated failures. That leaked account existence.

### Fix Summary

- Added normalized phone-key tracking with `SoDienThoaiKey`.
- Added `THEO_DOI_DANG_NHAP` as the server-side per-phone lock state row used for `SELECT ... FOR UPDATE`.
- Evolved `LAN_DANG_NHAP_SAI` in forward-only migration `V4__phone_key_login_tracking.sql` so failed attempts are keyed by `so_dien_thoai_key`, with `nguoi_dung_id` becoming optional for unknown phones.
- Changed `XacThucService` so known and unknown phones both go through the same persisted failed-attempt and temporary-lock path.
- Kept `NGUOI_DUNG.so_lan_sai`, `lan_sai_dau_tien`, `khoa_den`, and `phien_ban_token` updates for real accounts so token revocation still happens.
- Updated `AuthInterceptor` to reject users whose `khoa_den` is still active, in addition to token-version checks.
- Marked every FR-AUT-02 checklist item complete in `.scratch/slice-00-nen-mong/issues/04-khoa-tam-sau-5-lan-sai.md`.

### TDD Evidence For The Fix Round

#### RED — expose the enumeration leak

Command:

```bash
env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test --tests com.prj1.ccm.auth.AuthenticationIntegrationTest
```

Observed failure:

```text
AuthenticationIntegrationTest > FR_AUT_02_knownAndUnknownPhonesShareTheSameLockedResponseAfterRepeatedFailures() FAILED
    java.lang.AssertionError at AuthenticationIntegrationTest.java:223

10 tests completed, 1 failed
```

Failure detail:

- unknown phone still returned `Số điện thoại hoặc mật khẩu không đúng`
- known phone entered the lock response path

#### GREEN — focused auth suite after the repair

Command:

```bash
env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test --tests com.prj1.ccm.auth.AuthenticationIntegrationTest --tests com.prj1.ccm.auth.XacThucServiceTest
```

Output:

```text
> Task :test

BUILD SUCCESSFUL in 9s
4 actionable tasks: 2 executed, 2 up-to-date
```

Additional coverage retained and expanded:

- `FR_AUT_02_loginRejectsTheSixthAttemptEvenWhenThePasswordBecomesCorrectAfterFiveWrongAttempts`
- `FR_AUT_02_lockingAnAccountRevokesPreviouslyIssuedTokensImmediately`
- `FR_AUT_02_knownAndUnknownPhonesShareTheSameLockedResponseAfterRepeatedFailures`
- `FR_AUT_02_unknownPhoneSharesTheSameLockedMessageAsKnownPhoneAfterRepeatedFailures`
- `FR_AUT_02_lockExpiresAndAllowsLoginAgainWithoutSleeping`
- `FR_AUT_02_countsWrongPasswordsInTheSlidingWindowInsteadOfAcrossTheWholeAccountLifetime`
- `FR_AUT_02_successfulLoginResetsTheFailureCounter`

### Fresh Verification After The Fix Round

#### Backend

Command:

```bash
env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test
```

Output:

```text
> Task :test

BUILD SUCCESSFUL in 10s
4 actionable tasks: 1 executed, 3 up-to-date
```

#### Frontend tests

Command:

```bash
npm test
```

Output:

```text
Test Files  2 passed (2)
Tests       5 passed (5)
Duration    165ms
```

#### Frontend build

Command:

```bash
npm run build
```

Output:

```text
✓ built in 90ms
```

### Files Changed In Fix Round 1

- `.scratch/slice-00-nen-mong/issues/04-khoa-tam-sau-5-lan-sai.md`
- `.superpowers/sdd/spec/task-4-report.md`
- `backend/src/main/java/com/prj1/ccm/auth/AuthInterceptor.java`
- `backend/src/main/java/com/prj1/ccm/auth/NguoiDungDangNhap.java`
- `backend/src/main/java/com/prj1/ccm/auth/NguoiDungRepository.java`
- `backend/src/main/java/com/prj1/ccm/auth/SoDienThoaiKey.java`
- `backend/src/main/java/com/prj1/ccm/auth/TheoDoiDangNhap.java`
- `backend/src/main/java/com/prj1/ccm/auth/XacThucService.java`
- `backend/src/main/resources/db/migration/V4__phone_key_login_tracking.sql`
- `backend/src/test/java/com/prj1/ccm/auth/AuthenticationIntegrationTest.java`
- `backend/src/test/java/com/prj1/ccm/auth/XacThucServiceTest.java`

### Self-Review After Fix Round 1

- Unknown phones now accumulate failed-attempt and temporary-lock state on the server with the same semantics as known phones.
- The temporary-lock message no longer distinguishes account existence after repeated failures.
- Exact sliding-window behavior remains backed by persisted timestamps, not approximated counters.
- Existing token revocation for real accounts remains intact, and locked users are also rejected by `AuthInterceptor`.
- No unresolved concerns remain after the fresh focused and full verification runs.

## Fix Round 2 — Preserve Existing Locks Across Tracker Backfill

### Reviewer Finding Verified

The scoped re-review was correct: `V4__phone_key_login_tracking.sql` populated `THEO_DOI_DANG_NHAP` without carrying forward `NGUOI_DUNG.khoa_den`, and `XacThucService` now reads temporary lock state from `TheoDoiDangNhap` first. A user already locked before the tracker migration could therefore lose that lock after V4/V5 migration history replay unless tracker state was backfilled from `NGUOI_DUNG`.

### Fix Summary

- Added forward-only migration `V5__backfill_tracker_lock_from_nguoi_dung.sql`.
- Backfilled `THEO_DOI_DANG_NHAP` from every `NGUOI_DUNG` phone key, carrying over:
  - `so_lan_sai`
  - `lan_sai_dau_tien`
  - `khoa_den` only when it is still in the future at migration time
- Merged backfilled values with any tracker rows already created by V4, preserving the larger failure count and earliest failure timestamp.
- Added a focused migration regression test that migrates to V3, seeds a future `NGUOI_DUNG.khoa_den`, migrates to latest, and proves login still throws `DangNhapTamKhoaException` without sleeping.

### TDD Evidence For The Fix Round

#### RED — expose the lock-loss regression

Command:

```bash
env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test --tests com.prj1.ccm.auth.AuthMigrationRegressionTest
```

Observed failure:

```text
AuthMigrationRegressionTest > FR_AUT_02_existingNguoiDungLockRemainsActiveAfterTrackerMigrationBackfill() FAILED
    org.springframework.dao.EmptyResultDataAccessException at AuthMigrationRegressionTest.java:68

1 test completed, 1 failed
```

Failure detail:

- after migrating from V3 to latest, no tracker row existed with the locked phone key state required for the login guard

Note:

- the regression test uses a mutable clock and a future `khoa_den`; after the first red run I moved the fixed clock one day ahead so the migration's `CURRENT_TIMESTAMP` comparison exercised an actually active lock instead of a timestamp that had already expired during test execution

#### GREEN — focused migration regression after V5

Command:

```bash
env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test --tests com.prj1.ccm.auth.AuthMigrationRegressionTest
```

Output:

```text
> Task :test

BUILD SUCCESSFUL in 5s
4 actionable tasks: 2 executed, 2 up-to-date
```

#### GREEN — focused auth suite with the new migration regression included

Command:

```bash
env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test --tests com.prj1.ccm.auth.AuthenticationIntegrationTest --tests com.prj1.ccm.auth.XacThucServiceTest --tests com.prj1.ccm.auth.AuthMigrationRegressionTest
```

Output:

```text
> Task :test

BUILD SUCCESSFUL in 12s
4 actionable tasks: 1 executed, 3 up-to-date
```

### Fresh Verification After Fix Round 2

#### Backend

Command:

```bash
env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test
```

Output:

```text
> Task :test

BUILD SUCCESSFUL in 13s
4 actionable tasks: 1 executed, 3 up-to-date
```

#### Frontend tests

Command:

```bash
npm test
```

Output:

```text
Test Files  2 passed (2)
Tests       5 passed (5)
Duration    172ms
```

#### Frontend build

Command:

```bash
npm run build
```

Output:

```text
✓ built in 92ms
```

### Files Changed In Fix Round 2

- `.superpowers/sdd/spec/task-4-report.md`
- `backend/src/main/resources/db/migration/V5__backfill_tracker_lock_from_nguoi_dung.sql`
- `backend/src/test/java/com/prj1/ccm/auth/AuthMigrationRegressionTest.java`

### Self-Review After Fix Round 2

- Existing account locks now survive the V3 -> V4/V5 migration path instead of being dropped at tracker creation time.
- The fix is forward-only and leaves V3/V4 untouched.
- The new regression test covers both backfilled DB state and runtime login rejection with a mutable clock.
- No unresolved concerns remain after the focused and full verification runs.
