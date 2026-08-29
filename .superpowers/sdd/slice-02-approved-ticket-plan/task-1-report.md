# Task 1 Report — Hồ sơ người thuê

## Verification outcome

Verified the existing handoff implementation for `FR-TNT-01` in the Slice 02 worktree. No functional code changes were required after inspection.

The delivered backend behavior in scope is:

- Flyway-backed tenant profile storage via `NGUOI_THUE`
- `POST /api/nguoi-thue` to create a tenant profile
- `PUT /api/nguoi-thue/{id}` to update a tenant profile
- `GET /api/nguoi-thue?q=...` to list/search by tenant name or phone number
- `GET /api/nguoi-thue/{id}` to explicitly reveal the full document number
- audit logging of explicit reveal actions in `NHAT_KY_THAO_TAC`

## Scope confirmed

The worktree diff stays within Task 1:

- tenant profile backend code under `backend/src/main/java/com/prj1/ccm/nguoithue/`
- Task 1 integration and authorization tests under `backend/src/test/java/com/prj1/ccm/nguoithue/`
- Flyway migration `backend/src/main/resources/db/migration/V9__tenant_profiles.sql`
- Task 1 ticket status/comment update in `.scratch/slice-02-nguoi-thue-hop-dong/issues/01-ho-so-nguoi-thue.md`

No attachment links, account linking, contract behavior, occupancy behavior, room status changes, renewal behavior, frontend changes, or `Doc/` edits were included.

## Verified behavior

- Full document numbers are not used in URLs.
- Validation failures return the generic `Yêu cầu không hợp lệ` message and the response body does not echo the submitted document number.
- List/search and create/update responses expose only `soGiayToChe`.
- Detail reveal returns the raw document number in the response body only after explicit `GET /api/nguoi-thue/{id}` access.
- The reveal action writes one audit row in `NHAT_KY_THAO_TAC`, and the stored `gia_tri_sau` contains only the masked suffix.
- Wrong-role access is covered with `403` tests for `THO` and `NGUOI_THUE`.
- Allowed roles in this slice are `QTHT`, `CHU`, and `QUAN_LY`.
- Duplicate document numbers produce a warning and do not block create or update.

## Fresh verification evidence

Focused FR-TNT-01 suite:

```bash
cd backend && ./gradlew cleanTest test --rerun-tasks --tests com.prj1.ccm.nguoithue.NguoiThueIntegrationTest --tests com.prj1.ccm.nguoithue.NguoiThueAuthorizationIntegrationTest
```

Result: passed on August 28, 2026

Full backend suite:

```bash
cd backend && ./gradlew cleanTest test --rerun-tasks
```

Result: passed on August 28, 2026

## Notes

- `NGUOI_DUNG` remains untouched so Task 3 can add `nguoi_thue_id` separately.
- Authorization is role-based at this slice point because tenant profiles are not yet related to buildings or contracts.
