# 01: Bộ khung ba container chạy được đầu-cuối

**What to build:** Chạy `docker compose up` ở gốc repo là có đủ ba thứ cùng lên: PostgreSQL, backend Spring Boot, frontend React. Mở trình duyệt vào cổng của frontend thì thấy một trang mang tên MiniApart, và trang đó hiển thị được một dòng trạng thái mà nó **lấy về từ backend**, còn backend chỉ trả lời được sau khi **hỏi thật cơ sở dữ liệu**. Đây là viên đạn vạch đường: nó chứng minh cả ba tầng nối được với nhau, chưa cần chức năng nghiệp vụ nào.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Repo có hai thư mục `backend/` và `frontend/`, mỗi thư mục build được độc lập
- [x] Backend là Spring Boot dựng bằng **Gradle**, có wrapper `gradlew` cam kết vào repo — máy chưa cài Gradle vẫn build được
- [x] Có `docker-compose.yml` ở gốc; `docker compose up` từ máy sạch là ba container lên và khoẻ
- [x] Container PostgreSQL **không có khoá `ports`** — quy ước số 6, cổng 5432 không thò ra ngoài mạng Docker
- [x] Backend có endpoint kiểm tra sức khoẻ, và endpoint đó thực sự chạm cơ sở dữ liệu chứ không trả về hằng số
- [x] Frontend gọi backend qua đường dẫn tương đối `/api`, không nhúng cứng `localhost:8080` — để Slice 11 dựng Nginx không phải sửa mã
- [x] Flyway đã bật và chạy được, dù migration đầu tiên còn rỗng
- [x] `README.md` ghi đúng ba lệnh để một người mới clone về chạy được

## Comments

### Ba trục trặc môi trường gặp phải khi làm ticket này

Ghi lại vì cả ba đều là chuyện thật, và mục 4.7 của Chương 4 ("Những khó khăn kỹ thuật gặp phải") chỉ nên viết nếu có chuyện thật.

**1. Spring Initializr hỏng phía máy chủ đối với Gradle.** Mọi yêu cầu sinh dự án kiểu Gradle đều trả về lỗi 500, trong khi kiểu Maven vẫn bình thường. Không phải lỗi tham số. Cách xử lý: tự viết `settings.gradle` và `build.gradle`, rồi dùng `gradle wrapper` sinh wrapper. Hệ quả tốt ngoài dự kiến: nhóm hiểu từng dòng trong tệp build thay vì nhận một tệp sinh sẵn không ai đọc.

**2. Spring Boot 4 đã tách nhỏ các gói kiểm thử.** `@AutoConfigureMockMvc` không còn nằm trong `spring-boot-test-autoconfigure` như các bản 3.x, mà chuyển sang một tạo tác riêng `spring-boot-webmvc-test`, và đổi luôn tên gói thành `org.springframework.boot.webmvc.test.autoconfigure`. Mọi hướng dẫn trên mạng viết cho Boot 3 đều dẫn sai chỗ. Cách tìm ra: liệt kê nội dung tệp jar để xem lớp thực sự nằm ở đâu, thay vì đoán.

**3. Testcontainers không tự tìm ra Docker khi dùng Colima.** Hai lỗi chồng lên nhau. Thứ nhất, Testcontainers chỉ dò các đường dẫn socket quen thuộc, còn Colima đặt socket trong thư mục nhà của người dùng. Thứ hai, sau khi chỉ đúng socket thì thư viện client vẫn thương lượng phiên bản API 1.32, trong khi Docker Engine 29 từ chối mọi phiên bản dưới 1.40.

Cách xử lý **không** phải là bảo mỗi người tự đặt biến môi trường — làm vậy là máy người này chạy máy người kia hỏng. Thay vào đó `build.gradle` tự hỏi `docker` xem engine đang nằm ở đâu và nói phiên bản API nào, rồi truyền lại cho Testcontainers. Người dùng Docker Desktop hay Colima đều không phải cấu hình gì. Biến `DOCKER_HOST` nếu ai đó đã đặt sẵn thì vẫn được tôn trọng.

Khoá cấu hình đúng là `api.version` chứ không phải `DOCKER_API_VERSION` như nhiều bài viết nói — tìm ra bằng cách đọc chuỗi hằng trong tệp lớp `DefaultDockerClientConfig` của thư viện.
