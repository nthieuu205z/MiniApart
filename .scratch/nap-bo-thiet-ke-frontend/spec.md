# Nạp bộ thiết kế MiniApart vào `frontend/`

**Nguồn:** `Fontend Design/Thiết kế UI tổng quan/` — bộ thiết kế do Claude Design dựng, chuẩn hoá từ màn `#42` Bảng nhắc việc đã duyệt cùng người dùng ngày 29/08/2026.

## Vấn đề

Trong repo đang có **hai** thứ đều gọi là frontend, và chúng chưa biết nhau:

| | Ở đâu | Tình trạng |
|---|---|---|
| **Ứng dụng thật** | `frontend/` | 19 tệp nguồn, `api.ts` 613 dòng gọi 18 endpoint, có test. Năm màn nghiệp vụ chạy được. **CSS tự viết 1.292 dòng**, bảng màu xanh `#14322f` / `#f3f8f6` |
| **Bộ thiết kế** | `Fontend Design/Thiết kế UI tổng quan/` | 21 component JSX, 6 tệp token CSS, 23 glyph, 15 trang guideline, 9 canvas `.dc.html`. **Chưa ai import** |

Kiểm chứng: `grep` toàn bộ `frontend/src/`, `package.json`, `vite.config.ts` tìm tham chiếu tới thư mục thiết kế → **rỗng**.

## Vì sao làm bây giờ, và vì sao không làm hết một lần

Việc nối này chạm **mọi màn đã có**, nên nó không phải một lát cắt dọc và không thuộc slice nghiệp vụ nào. Nhét vào Slice 05 sẽ phá tính chất *"dừng ở đâu cũng còn sản phẩm chạy được"* mà cả kế hoạch 13 slice dựa vào.

Nhưng để tới sau Slice 06 thì càng nhiều màn phải sửa lại — Slice 05 và 06 cộng lại đẻ thêm khoảng chục màn nữa, và chúng sẽ được viết bằng CSS cũ.

**Chiến lược đã chọn: nạp hạ tầng trước, chuyển màn dần.** Sau khi bốn ticket dưới đây xong, quy ước có hiệu lực:

> **Từ Slice 05 trở đi, màn mới viết bằng bộ component; màn cũ chuyển dần khi có việc động vào.**

Không có đợt refactor lớn nào. Mỗi slice mới tự động đúng thiết kế.

## Bộ thiết kế **không** định nghĩa hành vi

`readme.md` của bộ thiết kế nói rõ điều này, và nó phải được tôn trọng khi nạp:

> *"Bộ tài liệu UX của dự án … là nguồn duy nhất cho hành vi; file bạn đang đọc chỉ quy định hình thức."*

Nghĩa là: gặp chỗ component gợi ý một hành vi khác `Doc/UX/`, thì `Doc/UX/` thắng. Gặp chỗ `Doc/UX/` mâu thuẫn `Doc/PRJ1_Phan-tich-yeu-cau...md`, thì tài liệu phân tích thắng, và phải báo cho người dùng chứ không tự sửa bên nào (`.scratch/BAN-GIAO.md` mục 5.1).

## Hai ràng buộc kỹ thuật đã tìm ra trước

**1. `allowJs` đang tắt.** `frontend/tsconfig.app.json` có `"allowJs": false`, còn bộ component là `.jsx` kèm `.d.ts` sidecar. Import thẳng sẽ gãy `tsc -b`. Ticket 03 xử lý.

**2. Phông tải qua CDN.** `tokens/fonts.css` có `@import url("https://fonts.googleapis.com/…")` cho Archivo và IBM Plex Mono. Ba vấn đề: phụ thuộc mạng ngoài lúc tải trang; mỗi lượt truy cập gọi sang Google; và **`FR-MTR-05` đòi ghi chỉ số ngoại tuyến** — mất mạng thì phông không tải được. Ticket 01 xử lý.

## Bốn ticket

| # | Ticket | Blocked by |
|---|---|---|
| 01 | Nạp token và tự chứa phông | — |
| 02 | Nạp bộ glyph | 01 |
| 03 | Chuyển 21 component sang `.tsx` | 01, 02 |
| 04 | Chuyển màn `#18` Ghi chỉ số làm màn mẫu | 03 |

Ticket 04 tồn tại để **chứng minh bộ kit dùng được thật**. Ba ticket đầu chỉ nạp tài sản vào repo — chúng không chứng minh được gì cho tới khi có một màn thật chạy bằng chúng.

## Không thuộc phạm vi

- Chuyển bốn màn còn lại (`DanhMucToaNha`, `DanhMucPhong`, `HoaDon`, `QuanLyTaiKhoan`). Chúng chuyển dần theo quy ước ở trên.
- Xoá `frontend/src/styles.css`. Nó còn phục vụ các màn chưa chuyển; xoá sớm là làm gãy màn đang chạy.
- Dựng thêm màn mới trong số 53 màn. Đó là việc của các slice nghiệp vụ.
