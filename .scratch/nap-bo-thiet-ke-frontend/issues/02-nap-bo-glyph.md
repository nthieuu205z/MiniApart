# 02: Nạp bộ glyph · NFR-USA-03

**What to build:** Chép bộ 23 glyph của bộ thiết kế vào `frontend/`, dạng dùng được từ mã.

**Blocked by:** 01

**Status:** done

## Nguồn

`Fontend Design/Thiết kế UI tổng quan/assets/icons/` — hai tệp:

- `miniapart-glyphs.svg` (6,9 KB) — sprite chứa toàn bộ hình
- `glyphs.json` (3,6 KB) — **23** khoá, đặt tên theo nghiệp vụ chứ không theo hình dáng: `da-ghi`, `thieu-so`, `con-no`, `cho-tho`, `phong-trong`, `bi-chan`, `hop-dong`, `cong-to`, `nhac-viec`, `so-do-phong`, `hoa-don`, `cong-no`, …

Cách đặt tên này là **có chủ ý và phải giữ**: `thieu-so` cho biết glyph dùng cho việc gì, `icon-warning-triangle` thì không. Đổi sang tên theo hình dáng là làm mất thông tin.

## Vì sao tách thành ticket riêng

Component `Glyph.jsx` ở ticket 03 phụ thuộc bộ glyph này, và `Button.d.ts` khai báo `glyph?: GlyphName` — tức kiểu `GlyphName` phải tồn tại **trước** khi chuyển component. Làm chung một ticket thì hai việc khác bản chất (chép tài sản tĩnh · viết lại mã) trộn vào nhau, khó soát.

## Hoàn thành khi

- [x] Sprite và tệp mô tả nằm trong `frontend/src/assets/icons/`
- [x] Có kiểu `GlyphName` sinh ra từ 23 khoá, để `tsc` bắt được lỗi gõ sai tên glyph
- [x] **Tên khoá giữ nguyên tiếng Việt không dấu theo nghiệp vụ.** Không đổi sang tên tiếng Anh theo hình dáng
- [x] Glyph hiển thị được ở kích thước `--ma-icon-size` với nét `--ma-icon-stroke` từ token ticket 01
- [x] Sprite nạp cục bộ, không qua mạng ngoài
- [x] Một test khẳng định đủ 23 khoá — để nếu ai đó chép thiếu thì gãy ngay, không phải phát hiện khi màn hiện ô trống

## Comments

- `GlyphName` lấy trực tiếp từ `glyphs.json` bằng `keyof typeof glyphs`, nên thêm hoặc gõ sai khoá sẽ bị TypeScript bắt.
- Kiểm thử dùng đúng thứ tự 23 khoá trong tài sản nguồn; sprite SVG và JSON được nạp cục bộ.
- Phần render glyph và kiểm tra kích thước/nét sẽ hoàn thiện cùng component `Glyph` ở Ticket 03.
- `Glyph.tsx` đã render sprite cục bộ theo đúng kích thước và nét truyền vào; test component khẳng định các thuộc tính SVG này.
