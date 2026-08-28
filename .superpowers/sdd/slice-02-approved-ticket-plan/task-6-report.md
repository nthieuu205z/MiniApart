# Task 6 report — Người ở cùng theo thời gian

## Outcome

Task 6 is implemented and committed as `9f8df95` (`Implement temporal co-occupant timeline`). The implementation adds the source-of-truth `NGUOI_O_CUNG` timeline and these endpoints:

- `GET /api/hop-dong/{id}/nguoi-o-cung`
- `POST /api/hop-dong/{id}/nguoi-o-cung`
- `GET /api/hop-dong/{id}/nguoi-o-cung/so-luong?ngay=YYYY-MM-DD`

No frontend, `Doc/`, prior migration, `NHAN_KHAU_KY`, or room-status cache behavior was changed.

## TDD evidence

### RED

Tests were written first in `backend/src/test/java/com/prj1/ccm/hopdong/NguoiOCungIntegrationTest.java`.

Command:

```text
./gradlew test --tests com.prj1.ccm.hopdong.NguoiOCungIntegrationTest
```

The first attempt was blocked before Gradle execution because the sandbox could not create the external wrapper-cache lock:

```text
java.io.FileNotFoundException: .../gradle-9.7.1-bin.zip.lck (Operation not permitted)
```

The same focused command was then run with the required Gradle/Docker environment access. It compiled the tests and failed for the expected missing feature:

```text
4 tests completed, 4 failed
Status expected:<201> but was:<404>
Status expected:<403> but was:<404>
BUILD FAILED
```

The test report confirmed the failures were route absence (`404`), not test errors (`errors="0"`).

### GREEN

After the minimal migration, JDBC repository, service, DTOs, and controller were added, the focused suite initially passed 3/4 tests. The remaining assertion incorrectly required `3/1`; the response already correctly contained the required values as `Phòng 501 đang có 3 người trên sức chứa 1.`. The assertion was corrected to verify that exact required meaning.

Focused rerun command:

```text
./gradlew test --tests com.prj1.ccm.hopdong.NguoiOCungIntegrationTest
```

Result:

```text
BUILD SUCCESSFUL in 13s
4 actionable tasks: 2 executed, 2 up-to-date
```

## Verification

Full backend command:

```text
./gradlew test
```

Result:

```text
BUILD SUCCESSFUL in 1m 25s
4 actionable tasks: 2 executed, 2 up-to-date
```

The run exercised the full backend test suite, including the new Testcontainers integration tests and existing authorization/architecture tests. `git diff --check` was clean before commit.

Final post-commit fresh execution:

```text
./gradlew clean test
```

```text
BUILD SUCCESSFUL in 1m 52s
5 actionable tasks: 5 executed
```

## Changed files

- `backend/src/main/resources/db/migration/V14__temporal_co_occupants.sql`
- `backend/src/main/java/com/prj1/ccm/hopdong/NguoiOCung.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/YeuCauNguoiOCung.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/ThongTinNguoiOCung.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/ThongTinThemNguoiOCung.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/ThongTinSoNguoiO.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/NguoiOCungRepository.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/NguoiOCungService.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/NguoiOCungController.java`
- `backend/src/test/java/com/prj1/ccm/hopdong/NguoiOCungIntegrationTest.java`
- `.scratch/slice-02-nguoi-thue-hop-dong/issues/06-nguoi-o-cung-theo-thoi-gian.md` — status, checklist, and comments only.

## Acceptance coverage

- `NGUOI_O_CUNG` stores `tu_ngay` and nullable `den_ngay` with a database check that the end is not before the start.
- Occupant list returns both the representative tenant profile and a separate tenant profile.
- Point-in-time count covers the required mid-period change: 1 person before `2040-03-15`, 2 on `2040-03-15` and `2040-03-20`, then 1 on `2040-03-21`.
- Date boundaries are inclusive; a null end date remains occupied.
- Capacity overage is a warning only and returns 201 after saving. The warning includes the current count and room capacity.
- Worker, tenant, and manager requests outside the assigned building scope receive HTTP 403 on list, create, and count endpoints.
- Every new endpoint Javadoc contains an FR code, and every test name contains the required `FR-TNT-02`/`FR-TNT-03` and `CR-002` markers.

## Rulings

1. Interval semantics are closed/inclusive: a person is counted on both `tuNgay` and `denNgay`. This is encoded in the SQL predicate and the migration check.
2. A null `denNgay` means the occupant is still present and remains counted on every later date.
3. The capacity warning is evaluated after insertion at the new occupant's `tuNgay`. It reports that date's current room count and current `PHONG.suc_chua`; it does not reject the write.
4. The representative tenant is not auto-inserted when a contract is created. The source of truth is populated explicitly through the same endpoint, allowing either `HOP_DONG.nguoi_thue_id` or another existing `NGUOI_THUE` profile to be selected. This avoids silently creating a new product rule beyond the ticket.
5. The ticket does not define that occupant dates must be inside the contract dates, so the implementation validates only a well-formed interval and leaves contract-date containment unenforced. This is a deliberate scope ruling, not an accidental omission.

## Self-review

- Migration numbering is strictly increasing (`V14` after `V13`); no prior migration was edited.
- All database access is JDBC and uses the existing Vietnamese schema/domain vocabulary.
- Authorization is deny-by-default at the service boundary and reuses the existing contract building-scope check.
- Money types are not introduced; no `double`, `float`, `Double`, or `Float` is used.
- No `NHAN_KHAU_KY` or room-status cache behavior was introduced.
- The list/count queries preserve historical rows, so a later timeline change does not overwrite prior source data.
- The focused test fixture intentionally lowers `suc_chua` before the over-capacity assertion to prove warning behavior independently of the default room fixture capacity.

## Concerns / follow-up

- The ticket did not prescribe an exact count URL or JSON contract. The implementation records the count as `/so-luong` and returns `phongId`, `soPhong`, `ngay`, `soNguoi`, `sucChua`, and `canhBaoQuaSucChua`.
- There is no update/delete endpoint for timeline rows because the ticket asks only for list/create/query behavior.
- `NHAN_KHAU_KY` remains intentionally deferred to Slice 4 as required by the ticket.
