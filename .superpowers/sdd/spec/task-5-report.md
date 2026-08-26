# Task 5 Report — FR-AUT-04

## Status

Blocked on missing approved menu matrix for the five roles.

## Scope checked

- Worktree: `/Users/nthieuu/Documents/Codex/Code/PRJ1/.worktrees/codex-slice-00-nen-mong`
- Required brief: `.superpowers/sdd/spec/task-5-brief.md`
- Approved ticket: `.scratch/slice-00-nen-mong/issues/05-nam-vai-tro-nam-menu.md`
- Approved slice spec: `.scratch/slice-00-nen-mong/spec.md`

## What the approved artifacts do say

- The five roles are `QTHT`, `CHU`, `QUAN_LY`, `THO`, `NGUOI_THUE`.
- Their display labels are `Quản trị hệ thống`, `Chủ sở hữu`, `Quản lý toà nhà`, `Thợ sửa chữa`, `Người thuê`.
- The frontend must use the server-provided role from Task 3 and must not infer it locally.
- This ticket is usability/navigation only; it must not pretend hidden menus are authorization.
- Manually entering a route outside the visible menu must show a friendly unauthorized state instead of crashing.
- New and changed test names must include `FR-AUT-04`.

## Blocker

The approved artifacts above do not enumerate the per-role menu entries or route matrix.

The user instruction for this task is explicit: use the exact role codes, labels, and menu differences from the approved brief, and do not infer them locally. I searched the in-scope approved artifacts and found only the behavioral statement that five different roles must see five different menus, without the actual menu contents.

Because the missing matrix would materially change product behavior, implementing any menu set now would be guesswork and would violate the planning boundary in `AGENTS.md`.

## Evidence gathered

### Command

```bash
sed -n '1,220p' .superpowers/sdd/spec/task-5-brief.md
```

### Result

The brief contains the ticket summary and acceptance bullets, but no per-role menu entries.

### Command

```bash
sed -n '1,260p' .superpowers/sdd/spec/task-5-source.md
sed -n '1,220p' .scratch/slice-00-nen-mong/spec.md
sed -n '1,220p' .scratch/slice-00-nen-mong/issues/05-nam-vai-tro-nam-menu.md
```

### Result

These files confirm the five roles and the navigation-versus-security split, but still do not provide a menu matrix.

### Command

```bash
rg -n "menu|năm menu|QTHT|CHU|QUAN_LY|THO|NGUOI_THUE|không có quyền" .superpowers .scratch docs frontend backend
```

### Result

Search results point back to the same ticket/spec statements and the backend role enum, not to a verbatim list of menu items per role.

## TDD status

No production code or tests were changed.

Reason: the missing menu matrix blocks writing correct failing tests. Writing tests before that would still require inventing the missing product behavior.

## Verification status

- No frontend tests were run.
- No frontend build was run.
- No backend regression tests were run.

Reason: no implementation was possible without product clarification.

## Self-review

- I verified the blocker is product-level ambiguity, not implementation ambiguity.
- I confirmed the missing information is not present in the required brief, the approved ticket, the approved slice spec, or nearby in-scope planning artifacts.
- I did not modify root checkout files, `Doc/`, unrelated tickets, or application code.

## Needed to proceed

Provide the approved per-role menu matrix for Task 5: the exact menu items and route targets each of `QTHT`, `CHU`, `QUAN_LY`, `THO`, and `NGUOI_THUE` should see.

---

## Resume after blocker resolution

The blocker was resolved by the approved domain/design document at `Doc/PRJ1_Thiet-ke-giao-dien_Brief.md`.

- Section 5, `Điều hướng theo vai trò`, provides the official menu matrix for all five roles.
- Section 8, `Ba trạng thái mà thiết kế hay quên`, explicitly calls out the `Không có quyền` state for manually typed routes outside the current role.

That source is part of the approved project domain/design documents referenced by `AGENTS.md`, so implementation resumed without inventing menu contents locally.

## Implemented behavior

- Frontend reads the server-returned role from the authenticated user session and maps it to the approved menu entries.
- Five roles now render five distinct menus:
  - `QTHT`: `Tài khoản`, `Toà nhà`, `Nhật ký thao tác`
  - `CHU`: `Tổng quan`, `Toà nhà`, `Hoá đơn`, `Công nợ`, `Báo cáo`, `Sự cố`, `An toàn`
  - `QUAN_LY`: `Nhắc việc`, `Ghi chỉ số`, `Hoá đơn`, `Thu tiền`, `Phòng`, `Hợp đồng`, `Sự cố`, `Thông báo`
  - `THO`: `Việc của tôi`
  - `NGUOI_THUE`: `Hoá đơn của tôi`, `Lịch sử`, `Hợp đồng`, `Báo hỏng`
- Manual entry of a path outside the current role menu now shows a friendly `Không có quyền` state instead of crashing.
- This remains a usability/navigation change only. No server-side authorization logic was added here.

## TDD evidence

### RED

Command:

```bash
cd frontend
npm test -- src/App.test.tsx
```

Observed failure before production changes:

- `6` tests failed.
- The new role-menu assertions received `[]` because no navigation menu existed yet.
- The typed-route case did not show `Không có quyền`; it still rendered the old welcome panel.

### GREEN

Command:

```bash
cd frontend
npm test -- src/App.test.tsx
```

Observed result after implementation:

- `1` test file passed.
- `6` tests passed.

## Changed files

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/src/App.tsx`
- `frontend/src/App.test.tsx`
- `frontend/src/roleNavigation.ts`
- `frontend/src/styles.css`

## Verification

### Frontend tests

Command:

```bash
cd frontend
npm test
```

Result:

- `3` test files passed.
- `11` tests passed.

### Frontend production build

Command:

```bash
cd frontend
npm run build
```

Result:

- TypeScript build passed.
- Vite production build passed.

### Backend regression

No backend files were changed for Task 5, so backend regression tests were not run.

## Self-review

- Kept the role source authoritative: menu selection is driven by `ThongTinNguoiDung.vaiTro` from the server, not by phone number or local inference.
- Preserved the existing auth/session flow from Task 3 and did not alter the lock behavior from Task 4.
- Kept the route handling intentionally lightweight: frontend navigation helps users find the right work area, while real permission enforcement remains a server concern for Task 6.
- Added `jsdom` as a dev dependency so the new tests exercise rendered menu and route behavior rather than only configuration helpers.

## Concerns

- The frontend test run on Node `26.7.0` emits an experimental `localStorage` warning in Vitest/jsdom. It did not affect test outcomes, and the suite still passed cleanly.
