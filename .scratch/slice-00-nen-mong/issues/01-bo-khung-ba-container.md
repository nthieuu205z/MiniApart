# 01: Bộ khung ba container chạy được đầu-cuối

**What to build:** Chạy `docker compose up` ở gốc repo là có đủ ba thứ cùng lên: PostgreSQL, backend Spring Boot, frontend React. Mở trình duyệt vào cổng của frontend thì thấy một trang mang tên MiniApart, và trang đó hiển thị được một dòng trạng thái mà nó **lấy về từ backend**, còn backend chỉ trả lời được sau khi **hỏi thật cơ sở dữ liệu**. Đây là viên đạn vạch đường: nó chứng minh cả ba tầng nối được với nhau, chưa cần chức năng nghiệp vụ nào.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Repo có hai thư mục `backend/` và `frontend/`, mỗi thư mục build được độc lập
- [ ] Backend là Spring Boot dựng bằng **Gradle**, có wrapper `gradlew` cam kết vào repo — máy chưa cài Gradle vẫn build được
- [ ] Có `docker-compose.yml` ở gốc; `docker compose up` từ máy sạch là ba container lên và khoẻ
- [ ] Container PostgreSQL **không có khoá `ports`** — quy ước số 6, cổng 5432 không thò ra ngoài mạng Docker
- [ ] Backend có endpoint kiểm tra sức khoẻ, và endpoint đó thực sự chạm cơ sở dữ liệu chứ không trả về hằng số
- [ ] Frontend gọi backend qua đường dẫn tương đối `/api`, không nhúng cứng `localhost:8080` — để Slice 11 dựng Nginx không phải sửa mã
- [ ] Flyway đã bật và chạy được, dù migration đầu tiên còn rỗng
- [ ] `README.md` ghi đúng ba lệnh để một người mới clone về chạy được
