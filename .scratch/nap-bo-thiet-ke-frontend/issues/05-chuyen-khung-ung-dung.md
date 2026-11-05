# 05: Chuyển khung ứng dụng — `App.tsx` và `index.html` · NFR-USA-01 · NFR-USA-03

**What to build:** Viết lại `App.tsx` bằng bộ component thiết kế — màn đăng nhập, thanh đầu, menu điều hướng theo vai trò — và sửa `index.html`. Giữ nguyên toàn bộ hành vi.

**Blocked by:** 04

**Status:** done

## Ticket này đổi diện mạo cả ứng dụng, không chỉ một màn

`App.tsx` (382 dòng) vẽ **hai thứ** mà mọi màn khác nằm trong:

1. **Màn đăng nhập** — thứ đầu tiên người dùng thấy
2. **Khung ứng dụng** — thanh đầu, menu theo vai trò, vùng nội dung

Nên đây là ticket rẻ nhất để bộ thiết kế **thật sự nhìn thấy được**. Sau nó, bốn màn chưa chuyển vẫn nằm trong khung mới — trông đã khác hẳn dù nội dung bên trong còn CSS cũ.

Ticket 04 làm `#18` trước là đúng về kiểm chứng kỹ thuật nhưng sai về thứ tự nhìn thấy. Ticket này sửa điều đó.

## `index.html` còn dấu vết bảng màu cũ

```html
<meta name="theme-color" content="#0f766e">
```

`#0f766e` là xanh lục của `styles.css` cũ, không phải tông giấy ấm của bộ kit. Thanh trình duyệt trên điện thoại lấy màu này — nên nó là thứ người dùng thấy trước cả nội dung.

Đổi sang token nền tương ứng. **Ghi giá trị thật**, không viết `var(--ma-*)` — `theme-color` không đọc được biến CSS.

## Component nên dùng

| Phần | Component |
|---|---|
| Thanh đầu | `shell/TopBar` |
| Menu dọc theo vai trò | `shell/NavPanel` — **chưa dùng ở đâu**, ticket này là lần đầu |
| Nút đăng nhập, đăng xuất | `core/Button` |
| Lỗi đăng nhập | `feedback/Toast` hoặc `building/BlockedNotice` |
| Nhãn mã yêu cầu (`FR-AUT-01`) | `core/SysLabel` |

`Doc/UX/00-nen-tang-ux.md` mục 4 đặc tả khung máy tính: menu dọc trái luôn hiện, thanh đầu có chọn toà và chọn kỳ, đường dẫn phân cấp, rồi vùng nội dung. `NavPanel` dựng ra để làm đúng việc đó.

## Ranh giới nghiêm ngặt: đổi hình thức, **không** đổi hành vi

Đây là chỗ ticket dễ trượt nhất, vì viết lại giao diện thì rất dễ "tiện tay" sửa logic.

- **Không** đổi luồng đăng nhập, không đổi cách lưu phiên (`authSession.ts`)
- **Không** đổi `roleNavigation.ts` — luật màn mặc định và menu theo vai trò giữ nguyên
- **Không** đổi lời gọi API
- **Không sửa `App.test.tsx` để nó xanh.** Test hiện tại mô tả hành vi đã duyệt; test đỏ nghĩa là bản viết lại sai, không phải test sai

Nếu buộc phải sửa một khẳng định vì nó bám vào **tên lớp CSS cũ** chứ không bám vào hành vi, thì sửa được — nhưng **liệt kê từng chỗ vào `## Comments`** kèm lý do.

## Hoàn thành khi

- [ ] Màn đăng nhập dựng bằng component từ `src/design/`, không còn lớp CSS riêng
- [ ] Thanh đầu và menu theo vai trò dùng `TopBar` và `NavPanel`
- [ ] `index.html` đổi `theme-color` sang màu của bộ kit, ghi giá trị thật
- [ ] `App.test.tsx` **xanh, không sửa** — hoặc mọi sửa đổi được liệt kê kèm lý do
- [ ] Năm vai trò vẫn vào đúng màn mặc định của mình (`roleNavigation.ts` không đổi)
- [ ] Vùng bấm nút chính **≥ 44×44 px** (`NFR-USA-03`)
- [ ] Chạy được ở **360 px** và **1920 px** (`NFR-USA-01`), không cuộn ngang ở 360 px
- [ ] Bốn màn chưa chuyển **vẫn chạy bình thường** trong khung mới — không gãy bố cục
- [ ] `npm run build` và `npm test` xanh
- [ ] Không mã màu ghi cứng: `grep -nE "#[0-9a-fA-F]{3,8}" src/App.tsx` → rỗng

## Comments
- 2026-09-01: Rewrote `frontend/src/App.tsx` to use `Button`, `SysLabel`, `BlockedNotice`, `Toast`, `TopBar`, `NavPanel`, and `Breadcrumb` from `src/design/` while preserving `authSession.ts`, API calls, and `roleNavigation.ts` unchanged.
- 2026-09-01: Updated `frontend/index.html` `theme-color` from the legacy teal to `#F9F7F6`, matching the design token background used by the new shell.
- 2026-09-01: Added `FR-AUT-04 shows the manager shell with grouped navigation and top-bar context` to `frontend/src/App.test.tsx`, verified it failed on the legacy shell, then passed after the rewrite.
- 2026-09-01: Verification evidence:
  - `cd frontend && npm test` → 9 test files, 55 tests passed.
  - `cd frontend && npm run build` → success (`tsc -b && vite build`).
  - `rg -n "#[0-9a-fA-F]{3,8}" frontend/src/App.tsx` → no matches.
  - Local browser check at 360px and 1920px on 2026-09-01 showed `scrollWidth === innerWidth` on the login shell, so no horizontal overflow at those widths.
- 2026-09-01: `GhiChiSo` keeps its own previously migrated shell from Ticket 04, so `App.tsx` suppresses the global top bar on `/ghi-chi-so` to avoid a duplicated header while the rest of the application now renders inside the new app frame.
