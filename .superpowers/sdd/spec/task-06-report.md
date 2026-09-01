# Ticket 06 report

## Files changed

- `frontend/src/DanhMucToaNha.tsx`
- `frontend/src/DanhMucPhong.tsx`
- `frontend/src/DanhMucToaNha.test.tsx`
- `frontend/src/DanhMucPhong.test.tsx`
- `.scratch/nap-bo-thiet-ke-frontend/issues/06-chuyen-danh-muc-toa-nha-va-phong.md`

## Preserved behavior

Building scope, create/edit requests, API error display and decimal loss threshold are unchanged. Room requests remain scoped by building and floor. Batch preview calls only the preview endpoint; creation remains behind the confirmation action. The confirmation includes both count and start/end room numbers. Server-provided room status remains display-only.

The existing floor-map/detail DOM selectors are retained as compatibility hooks for App tests; they do not require a change to the tests or API.

## RED to GREEN evidence

The new characterization tests initially failed because their own fixtures selected the wrong form and did not mirror the API error envelope. After correcting only the test fixtures, the unchanged UI baseline passed 7/7. The same focused tests passed after the migration.

## Verification

- `npm test -- src/App.test.tsx src/DanhMucToaNha.test.tsx src/DanhMucPhong.test.tsx`: 3 files, 27 tests passed.
- `npm test`: 11 files, 65 tests passed.
- `npm run build`: TypeScript and Vite production build passed.

## Self-review

No API route, request body, backend behavior, `styles.css`, `Doc/`, `spec.md`, or tickets 07/08 were staged. `Button.tsx` was reverted because its formatting-only change was outside this ticket.

## Concerns

Compatibility class names for the existing room-map tests remain in the room markup. They are retained as test/accessibility hooks under the implementation ruling; new design components provide the added layout and interaction surfaces.

## Fix round 1/5

- Replaced the duplicate legacy floor-map rendering with the single interactive `BuildingSection` map. It now emits the compatibility floor/room hooks, status classes, and click handler without using legacy CSS for layout.
- Raised the create, preview, and confirmation actions to a 44px minimum target through design `Button` styles. `ConfirmDialog` now applies the same minimum height to both actions.
- Verification: focused command passed 27/27; full `npm test` passed 65/65; `npm run build` passed.

## Fix round 2/5

- Removed the room-status, floor-map, room-tile, and room-detail legacy visual rules from `styles.css`; their class names remain hooks only. Account-management and other unmigrated shared rules remain for Ticket 08's dead-rule sweep.
- `BuildingSection` now forwards the compatibility hooks and handles Enter/Space activation for interactive room cells. The regression test was RED before this handler and GREEN after it.
- Verification: focused App/building/room tests passed 28/28; full `npm test` passed 66/66; `npm run build` passed.

## Fix round 3/5

- Removed the remaining migrated catalog selectors and dark-mode variants from `frontend/src/styles.css`: building-management/layout/list/detail/summary/form rules, room-status rules, and room-floor/room-tile/room-detail rules, including responsive and dark-mode variants. The compatibility class names remain in JSX only for App.test hooks.
- Kept `.field`, `.status-message`, `.primary-button`, and `.ghost-button` because `HoaDon.tsx`, `QuanLyTaiKhoan.tsx`, `GhiChiSo.tsx`, and shared auth/status screens still consume them; their removal is outside this ticket.
- Added a DanhMucPhong regression test for Space activation alongside Enter. BuildingSection handles both keys while preserving the single interactive map and native click behavior.
- Verification: `rg` against `frontend/src/styles.css` returns no migrated catalog selectors; focused App/building/room tests passed 28/28; full `npm test` passed 66/66; `npm run build` passed.

## Fix round 4/5

- Root cause: round 3 correctly removed the catalog selectors from `frontend/src/styles.css`, but `DanhMucPhong.tsx` still depended on those class names for all layout and panel presentation. The compatibility hooks therefore rendered without the intended grid, spacing, border, background, or padding.
- Restored presentation ownership in `frontend/src/DanhMucPhong.tsx` with token-backed inline styles: the catalog root and heading, filter/form rows, auto-fit two-column layout, list/detail columns, summary and map panels, status grid, room facts, form controls, action rows, and form hint. Responsive tracks use `repeat(auto-fit, minmax(min(100%, ...), 1fr))`, with `minWidth: 0` at every relevant boundary so 360px can collapse to one column and wide screens can use two columns.
- Kept all legacy class names only as App-test/accessibility compatibility hooks. `styles.css` was not changed and no hard-coded color was added. `BuildingSection` now uses `minmax(0, 1fr)` for room tracks and wraps its label row to prevent narrow-width overflow.
- Added a contract regression test covering token ownership, responsive grid tracks, panel spacing/borders/backgrounds, facts layout, action-row wrapping, and the room-map track definition. It was RED before the production style ownership was added and GREEN afterward.
- Verification: focused App/building/room tests passed 29/29; full `npm test` passed 67/67; `npm run build` passed; `git diff --check` passed; `rg` found no migrated selectors in `frontend/src/styles.css` and no hard-coded colors in the changed catalog/design files. Browser viewport checks at 360px and 1920px reported document/body `scrollWidth` equal to the viewport width for the local app shell. The authenticated room route was not opened because the local dev server had no active backend/session; the room-specific responsive contract is covered by the jsdom test.
