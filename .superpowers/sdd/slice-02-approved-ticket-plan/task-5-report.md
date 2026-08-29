# Task 5 Report · FR-TNT-05

## Result

DONE

## RED

Command:

```bash
./gradlew test --tests com.prj1.ccm.hopdong.HopDongIntegrationTest
```

Output:

```text
HopDongIntegrationTest > FR_TNT_05_CR_001_haiNguoiCungLucChiChoMotNguoiThanhCong() FAILED
HopDongIntegrationTest > FR_TNT_05_CR_001_choPhepHopDongMoiKhiHopDongCuDaThanhLy() FAILED
HopDongIntegrationTest > FR_TNT_05_CR_001_tuChoiCacKhoangNgayChongLenHopDongDangHieuLuc(...) FAILED
12 tests completed, 6 failed
BUILD FAILED
```

After fixing the liquidation test date, the same focused command still failed only on the four overlap cases:

```text
12 tests completed, 4 failed
BUILD FAILED
```

## GREEN

Changed:

- `backend/src/main/resources/db/migration/V13__exclude_overlapping_rental_contracts.sql`
- `backend/src/main/java/com/prj1/ccm/hopdong/HopDongRepository.java`
- `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
- `backend/src/test/java/com/prj1/ccm/hopdong/HopDongIntegrationTest.java`
- `.scratch/slice-02-nguoi-thue-hop-dong/issues/05-cam-hop-dong-chong-ngay.md`

Focused verification:

```bash
./gradlew test --tests com.prj1.ccm.hopdong.HopDongIntegrationTest
```

Output:

```text
BUILD SUCCESSFUL in 9s
```

Full backend verification:

```bash
./gradlew test
```

Output:

```text
BUILD SUCCESSFUL in 54s
```

## Self-review

- DB source of truth preserved with a PostgreSQL `EXCLUDE USING gist` constraint on `HOP_DONG`.
- `btree_gist` enabled in migration, not manually on the host.
- `DA_THANH_LY` contracts are excluded from the overlap constraint.
- Database violations now become a readable 409 message that names the blocking contract and end date.
- The concurrency test confirms exactly one success and one conflict under race.

## Rulings / Concerns

- Gradle wrapper needed cache access outside the sandbox (`~/.gradle`), so the first focused test run had to be rerun with escalated permission.
- None remaining.

## Fix Round 1

### RED

Command:

```bash
./gradlew test --tests com.prj1.ccm.hopdong.HopDongServiceTest
```

Output:

```text
HopDongServiceTest > FR_TNT_05_CR_002_khongDoiDataIntegrityKhacThanhXungDotChongNgay() FAILED
1 test completed, 1 failed
BUILD FAILED
```

### GREEN

Changed files:

- `backend/src/main/java/com/prj1/ccm/hopdong/HopDongService.java`
- `backend/src/test/java/com/prj1/ccm/hopdong/HopDongServiceTest.java`

Focused verification:

```bash
./gradlew test --tests com.prj1.ccm.hopdong.HopDongServiceTest
./gradlew test --tests com.prj1.ccm.hopdong.HopDongIntegrationTest
./gradlew test
```

Output:

```text
BUILD SUCCESSFUL in 2s
BUILD SUCCESSFUL in 11s
BUILD SUCCESSFUL in 1m 7s
```

### Self-review

- The overlap 409 path now requires both SQLSTATE `23P01` and the migration's constraint name.
- Non-overlap integrity failures keep their original exception path and no longer trigger overlap lookup.
- Existing overlap, adjacency, liquidation, and concurrency behaviors still pass.

### Concerns

- None.
