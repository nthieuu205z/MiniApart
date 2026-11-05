# 03: Chuyển 21 component sang `.tsx` · NFR-USA-01 · NFR-USA-03

**What to build:** Đưa 21 component của bộ thiết kế vào `frontend/src/`, chuyển từ `.jsx` sang `.tsx` bằng cách dùng tệp `.d.ts` đi kèm làm hợp đồng kiểu.

**Blocked by:** 01, 02

**Status:** done

## Nguồn

`Fontend Design/Thiết kế UI tổng quan/components/` — 21 component chia năm nhóm:

| Nhóm | Component |
|---|---|
| `core` | `Button`, `Figure`, `Glyph`, `StatusTag`, `SysLabel` |
| `shell` | `TopBar`, `NavPanel`, `Breadcrumb`, `StatStrip`, `GlyphLegend` |
| `building` | `BuildingSection`, `RoomCell`, `TaskRow`, `PrimaryTaskBlock`, `BlockedNotice` |
| `forms` | `MeterInput`, `FilterChip` |
| `feedback` | `ConfirmDialog`, `EmptyState`, `Toast`, `SyncBanner` |

Mỗi component có ba tệp: `X.jsx` (cài đặt), `X.d.ts` (kiểu + chú thích), `X.prompt.md` (ý đồ thiết kế).

## Ràng buộc: `allowJs` đang tắt

`frontend/tsconfig.app.json` có `"allowJs": false`. Import thẳng `.jsx` sẽ gãy `tsc -b`.

**Hai đường, chọn đường thứ hai:**

| | Cách | Đánh giá |
|---|---|---|
| A | Bật `allowJs: true`, giữ nguyên `.jsx` + `.d.ts` sidecar | Nhanh. Nhưng nới lỏng kiểm tra kiểu cho **toàn bộ** dự án chỉ để phục vụ một thư mục, và bộ đôi `.jsx`/`.d.ts` sẽ lệch nhau dần vì không có gì ép chúng khớp |
| **B** | **Chuyển `.jsx` → `.tsx`, gộp `.d.ts` vào làm kiểu tại chỗ** | Tốn công hơn một lần. Đổi lại `tsc` kiểm được thân hàm đúng với kiểu đã khai, và không còn hai tệp phải giữ đồng bộ bằng tay |

Chọn **B**. Giữ `allowJs: false`.

## Cách chuyển

`.d.ts` đã viết sẵn kiểu đầy đủ và chú thích tiếng Việt — dùng chúng, đừng viết lại kiểu từ đầu. Ví dụ `Button.d.ts`:

```ts
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
  variant?: "primary" | "secondary" | "text" | "onInverse" | "onInverseGhost";
  size?: "md" | "sm";
  glyph?: GlyphName;
  /** Chặn thay cho disabled: nút vẫn thấy, vẫn đọc được, chỉ không bấm được. */
  blocked?: boolean;
  blockedReason?: string;
}
```

Chuyển thành `Button.tsx` mang đúng interface đó, **giữ nguyên chú thích tiếng Việt** — chúng chứa lý do thiết kế, không phải chú thích trang trí.

## Ba quyết định thiết kế phải giữ nguyên, đừng "sửa cho chuẩn"

Đọc `X.prompt.md` trước khi động vào bất kỳ component nào. Ba chỗ nhìn qua tưởng sai:

1. **`blocked` thay cho `disabled`.** Nút bị chặn **vẫn hiện, vẫn đọc được**, kèm câu nói rõ thiếu điều kiện gì — không bị ẩn và không xám mờ không giải thích. Khớp `NFR-USA-05` và mục 8 của `Doc/UX/00-nen-tang-ux.md`. Đổi sang `disabled` là làm hỏng chủ đích. Chú ý `ButtonProps` **cố ý `Omit` mất `disabled`** để không ai dùng nhầm.
2. **`--ma-radius: 0`** — góc vuông tuyệt đối, không bo tròn ở bất kỳ đâu trong nội dung.
3. **Không bóng đổ trong nội dung**, chỉ hai ngoại lệ đã khai trong `borders.css` (vòng lấy nét và khung nổi).

## Ranh giới: component quy định hình thức, không quy định hành vi

`readme.md` của bộ thiết kế nói rõ:

> *"Bộ tài liệu UX của dự án … là nguồn duy nhất cho hành vi; file bạn đang đọc chỉ quy định hình thức."*

Gặp chỗ component gợi ý hành vi khác `Doc/UX/` thì **`Doc/UX/` thắng**. Gặp chỗ `Doc/UX/` mâu thuẫn tài liệu phân tích thì **báo cho người dùng**, không tự sửa bên nào — `.scratch/BAN-GIAO.md` mục 5.1.

## Hoàn thành khi

- [x] 21 component nằm ở `frontend/src/design/`, dạng `.tsx`, giữ nguyên cấu trúc năm nhóm
- [x] `tsconfig.app.json` **vẫn** `"allowJs": false`
- [x] Không còn tệp `.d.ts` sidecar cho các component đã chuyển — kiểu nằm trong `.tsx`
- [x] Chú thích tiếng Việt trong `.d.ts` được mang sang, không bị lược
- [x] `X.prompt.md` chép theo cùng thư mục — đây là tài liệu lý do, người sửa sau cần đọc
- [x] `npm run build` và `npm test` xanh
- [x] Component chỉ dùng biến `--ma-*`, **không có mã màu ghi cứng**. Kiểm bằng `grep -nE "#[0-9a-fA-F]{3,8}" frontend/src/design/` → rỗng
- [x] Màn `GhiChiSo.tsx` import các component cần thiết ở Ticket 04; không có sidecar `.d.ts` hoặc `.jsx` còn lại.
