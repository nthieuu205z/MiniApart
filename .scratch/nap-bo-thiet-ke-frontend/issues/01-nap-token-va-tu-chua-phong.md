# 01: Nạp token và tự chứa phông · NFR-USA-01 · FR-MTR-05

**What to build:** Chép 6 tệp token CSS của bộ thiết kế vào `frontend/src/`, nạp chúng vào ứng dụng, và **thay `@import` CDN bằng phông tự chứa**.

**Blocked by:** None

**Status:** done

## Nguồn

`Fontend Design/Thiết kế UI tổng quan/tokens/` — sáu tệp: `borders.css`, `colors.css`, `fonts.css`, `motion.css`, `spacing.css`, `typography.css`. Toàn bộ biến mang tiền tố `--ma-`.

## Vì sao token vào trước, không gây xung đột

`frontend/src/styles.css` hiện dài 1.292 dòng và dùng **màu ghi cứng** theo bảng màu xanh (`#14322f`, `#f3f8f6`), khác hẳn tông giấy ấm của bộ thiết kế (`#F9F7F6`, mực nâu).

Hai thứ này **không đụng nhau**, vì token chỉ khai báo biến `--ma-*` mà CSS cũ không tham chiếu. Nạp token vào là thao tác cộng thêm, không phải thao tác thay thế — các màn đang chạy giữ nguyên hình thức cho tới khi từng màn được chuyển.

**Đừng sửa `styles.css` ở ticket này.** Nó còn phục vụ năm màn đang chạy.

## Phông: bỏ CDN, tự chứa

`tokens/fonts.css` hiện có:

```css
@import url("https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap");
```

Ba lý do phải bỏ, theo thứ tự nghiêm trọng giảm dần:

1. **`FR-MTR-05` đòi ghi chỉ số hoạt động khi mất mạng.** Chị Lan gõ chỉ số 24 phòng ngoài hành lang, chỗ sóng yếu. Phông tải qua CDN thì mất mạng là rơi về phông hệ thống — chữ số nhảy cỡ, cột số liệu lệch, và đây đúng là màn cần đọc số chính xác nhất.
2. **Mỗi lượt truy cập gọi sang máy chủ Google**, kèm địa chỉ IP của người dùng. Dự án có `BR-17` và rủi ro `R-13` về dữ liệu cá nhân; gửi dấu vết truy cập sang bên thứ ba không cần thiết là đi ngược tinh thần đó.
3. Thêm một điểm hỏng khi demo bảo vệ.

Cách làm: tải bốn trọng lượng của **Archivo** và bốn của **IBM Plex Mono** ở định dạng `woff2`, đặt trong `frontend/src/assets/fonts/`, thay `@import` bằng các khối `@font-face` trỏ vào tệp cục bộ. Chính chú thích trong `fonts.css` đã chỉ đúng đường này:

> *"nếu sau này có, thay `@import` bằng `@font-face` trỏ vào `assets/fonts/`"*

Đặt `font-display: swap` để chữ hiện ngay bằng phông dự phòng trong lúc tải.

## Hoàn thành khi

- [x] Sáu tệp token nằm ở `frontend/src/tokens/`, giữ nguyên tên và nội dung, **trừ** `fonts.css` đã đổi sang `@font-face`
- [x] Tám tệp `woff2` nằm trong repo, **không** gọi ra mạng ngoài. Kiểm bằng `grep -rn "fonts.googleapis\|fonts.gstatic" frontend/src/` → rỗng
- [x] Token được nạp một lần ở điểm vào ứng dụng, trước `styles.css`
- [x] Năm màn hiện có **hình thức không đổi** — chụp lại hoặc chạy `npm test` để chứng minh không hồi quy
- [x] `npm run build` xanh
- [x] Mọi biến `--ma-*` đọc được từ `document.documentElement` khi ứng dụng chạy — một test ngắn khẳng định `--ma-paper-1` và `--ma-font-ui` có giá trị, để bắt trường hợp token bị nạp sai thứ tự và im lặng thành rỗng

## Comments

- Nạp toàn bộ token qua `tokens/index.css`, rồi import một lần trước `styles.css` ở `main.tsx`.
- Thay CDN bằng tám tệp WOFF2 cục bộ với `font-display: swap`; không thay đổi `styles.css` cũ nên năm màn hiện có không bị đổi hình thức.
- Bổ sung kiểm thử DOM cho hai token đại diện và đã xác minh full frontend test/build.
