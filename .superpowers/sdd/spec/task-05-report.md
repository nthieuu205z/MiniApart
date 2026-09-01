# Ticket 05 Report

Date: 2026-09-01
Worktree: `/Users/nthieuu/Documents/Codex/Code/PRJ1/.worktrees/codex-nap-bo-thiet-ke-frontend-implement`

## Changed files

- `frontend/src/App.tsx`
- `frontend/src/App.test.tsx`
- `frontend/index.html`
- `.scratch/nap-bo-thiet-ke-frontend/issues/05-chuyen-khung-ung-dung.md`

## Implementation summary

- Replaced the legacy `App.tsx` class-based page shell with the typed design-kit components under `frontend/src/design`.
- Preserved the existing login/session/API behavior and left `frontend/src/roleNavigation.ts` unchanged.
- Kept menu labels and default routing behavior identical while introducing grouped `NavPanel` sections and a `TopBar`/`Breadcrumb` shell for logged-in routes.
- Suppressed the global `TopBar` for `/ghi-chi-so` so the already-migrated screen from Ticket 04 does not render a duplicated header.
- Updated `frontend/index.html` to use the warm paper background color `#F9F7F6` for `theme-color`.

## TDD evidence

1. Added `FR-AUT-04 shows the manager shell with grouped navigation and top-bar context` to `frontend/src/App.test.tsx`.
2. Ran `cd frontend && npm test -- src/App.test.tsx` before implementation.
3. Observed the expected red failure on the legacy shell:
   - `expected ... to contain 'Hàng ngày'`
4. Rewrote `App.tsx` and reran the focused test until it passed.

## Verification output

### Focused safety net

`cd frontend && npm test -- src/App.test.tsx`

- 17 tests passed in `src/App.test.tsx`

### Full frontend suite

`cd frontend && npm test`

- `Test Files  9 passed (9)`
- `Tests  55 passed (55)`

### Build

`cd frontend && npm run build`

- `tsc -b && vite build` succeeded
- Vite output included:
  - `dist/index.html 0.44 kB`
  - `dist/assets/index-CkyS8UIk.css 20.53 kB`
  - `dist/assets/index-BRpiML8c.js 279.77 kB`

### Additional ticket checks

- `rg -n "#[0-9a-fA-F]{3,8}" frontend/src/App.tsx` returned no matches.
- Local browser verification at `http://127.0.0.1:4173/`:
  - 360px viewport: `scrollWidth === innerWidth === 360`
  - 1920px viewport: `scrollWidth === innerWidth === 1920`
  - No horizontal overflow observed on the unauthenticated shell.

## Self-review

- `roleNavigation.ts`, auth token storage, login submission, logout flow, and existing API calls were left intact.
- `App.test.tsx` was extended only to cover the new shell contract; no existing assertions were weakened or removed.
- `App.tsx` uses design tokens/components and contains no hard-coded hex colors.
- The manager navigation grouping was adjusted to preserve the original menu order exactly after an initial regression surfaced in the focused test run.

## Concerns

- Live visual verification of the authenticated shell was not possible against the local browser run because the local backend was not serving valid JSON for `/api/health`; authenticated shell behavior is therefore covered by the Vitest suite rather than an end-to-end browser session.
- `GhiChiSo` still owns its own screen-level shell from Ticket 04, so `App.tsx` now contains a route-specific exception for `/ghi-chi-so`. This is intentional for Ticket 05, but it is worth revisiting once the remaining screens are migrated and Ticket 08 removes the legacy shell glue.

---

# Fix round 1 — 2026-09-01

## Scope

Resolved the four Important review findings for Ticket 05 without changing login, session, API, or role-navigation behavior. No backend or `Doc/` file was changed.

## Changed files

- `frontend/src/App.tsx`
- `frontend/src/design/shell/NavPanel.tsx`
- `frontend/src/App.test.tsx`
- `.superpowers/sdd/spec/task-05-report.md`

## Root causes and fixes

1. The unauthenticated layout always used a two-column grid with a 320px minimum second column. At 360px, page padding plus the 24px grid gap made that impossible to fit. The login grid now switches to one flexible column below the existing 768px breakpoint.
2. `NavPanel` used `--ma-hit-desktop` (32px) for links. It now uses the required `--ma-hit-mobile` token (44px), including under global `border-box` sizing.
3. The `/ghi-chi-so` exception was used to conditionally omit the system-status section as well as the duplicate top bar. The top-bar exception remains, while system status now renders for every authenticated route.
4. Added focused behavior checks that exercise the 360px layout branch, every navigation-link hit target, and system status on `/ghi-chi-so`.

## TDD evidence

Added the three regression tests first, then ran:

```text
cd frontend && npm test -- src/App.test.tsx
Test Files  1 failed (1)
Tests  3 failed | 17 passed (20)

NFR-USA-01: expected two-column grid to be one column at 360px
NFR-USA-03: expected var(--ma-hit-mobile), received var(--ma-hit-desktop)
FR-MTR-01: expected Trạng thái hệ thống, received undefined
```

After the production changes, reran:

```text
cd frontend && npm test -- src/App.test.tsx
Test Files  1 passed (1)
Tests  20 passed (20)
```

## Verification commands and output

```text
cd frontend && npm test
Test Files  9 passed (9)
Tests  58 passed (58)

cd frontend && npm run build
tsc -b && vite build
✓ built in 106ms

git diff --check
(no output; exit 0)

rg -n "#[0-9a-fA-F]{3,8}" frontend/src/App.tsx
(no matches; exit 1)
```

Browser verification on `http://127.0.0.1:5174/` at a 360×800 viewport returned:

```text
{"bodyScrollWidth":360,"innerWidth":360,"loginGrid":"328px","scrollWidth":360}
```

This proves the login page has no horizontal overflow at 360px. The temporary viewport override and browser tab were reset/closed after the check.

## Self-review

- The focused tests are regression tests rather than label-presence tests: reverting each respective production fix makes one fail.
- `App.tsx` remains free of hard-coded hex colors.
- The existing `/ghi-chi-so` top-bar exception was retained only to avoid the pre-existing duplicate header; status availability is no longer coupled to it.
- Only the four files above will be committed; pre-existing changes to `.scratch/nap-bo-thiet-ke-frontend/spec.md` and untracked tickets 06/07 remain untouched.

## Remaining concerns

- Authenticated browser layout was not exercised against a running backend because no valid local credentials/backend session were available. The route behavior and hit-target contract are covered by the focused Vitest checks.
