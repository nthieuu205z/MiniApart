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
