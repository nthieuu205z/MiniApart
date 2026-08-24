# Bàn giao cho session code

Đọc tệp này trước, rồi đọc `../AGENTS_old.md`. Sau đó lấy ticket và làm.

> **Reset ngày 2026-08-25:** toàn bộ mã nguồn (`backend/`, `frontend/`, `docker-compose.yml`) đã bị xoá để bắt đầu lại sạch. Ba ticket 01–03 của Slice 0 quay về `ready-for-agent` — xem ghi chú đầu mỗi ticket. Kế hoạch, ADR, và các bài học ở mục `## Comments` của từng ticket **vẫn giữ nguyên giá trị**, không phải làm lại từ số 0 về tư duy, chỉ làm lại về mã.

---

## 1. Máy phải có gì

| Thứ | Bản | Cài bằng |
|---|---|---|
| JDK | **21 LTS** | `brew install openjdk@21` |
| Node | 20+ | có sẵn |
| Docker | qua **Colima** | `brew install colima docker docker-compose` |
| Gradle | không cần cài | dùng `./gradlew` trong repo |

Khởi động Docker mỗi lần bật máy:

```bash
colima start
```

Nếu `docker compose version` báo không có lệnh, thêm dòng này vào `~/.docker/config.json`:

```json
{ "cliPluginsExtraDirs": ["/opt/homebrew/lib/docker/cli-plugins"] }
```

**Đừng nâng JDK lên 25 hay 26.** Lý do ở mục 3 bên dưới, và nó không phải chuyện sở thích.

## 2. Ba lệnh hay dùng

```bash
docker compose up -d --build
```

```bash
cd backend && ./gradlew test
```

```bash
docker compose logs -f backend
```

Đăng nhập bằng `0900000003` / `MatKhau@123`. Danh sách đủ sáu tài khoản mẫu ở `README.md`.

---

## 3. Bốn cái bẫy đã gặp — đừng mất công dò lại

### 3.1. ArchUnit hỏng im lặng nếu JDK quá mới

ASM mà ArchUnit 1.4.1 đóng gói chỉ đọc được tệp lớp **tới Java 25**. Gặp tệp lớp mới hơn nó **bỏ qua, không báo gì**. Hậu quả: ArchUnit nhập vào 0 lớp và **mọi luật kiến trúc báo xanh** dù không soi vào đâu cả.

Đây là lý do dự án chạy Java 21 chứ không phải bản mới nhất.

Chốt chặn: `ArchitectureRulesTest.rulesActuallySeeTheProductionCode()` gãy build nếu số lớp nhập được bằng 0. **Đừng xoá hay nới lỏng phép kiểm đó.**

### 3.2. Spring Boot 4 dời gói lung tung so với Boot 3

Ba chỗ đã đụng phải. Mọi hướng dẫn trên mạng viết cho Boot 3 đều dẫn sai:

| Thứ | Boot 3 | Boot 4 |
|---|---|---|
| `@AutoConfigureMockMvc` | `spring-boot-test-autoconfigure` | tạo tác riêng **`spring-boot-webmvc-test`**, gói `org.springframework.boot.webmvc.test.autoconfigure` |
| Tự cấu hình Flyway | có trong autoconfigure chung | tạo tác riêng **`spring-boot-flyway`**. Chỉ có `flyway-core` thì Flyway nằm trên classpath mà **không bao giờ chạy** |
| Jackson | `com.fasterxml.jackson` | **`tools.jackson`** (Jackson 3) |

**Cách tìm khi gặp chỗ thứ tư:** đừng tìm trên mạng, hãy liệt kê nội dung tệp jar xem lớp thực sự nằm ở đâu.

```bash
unzip -l $(find ~/.gradle/caches -name "spring-boot-*.jar" | head -1) | grep TenLopCanTim
```

### 3.3. Testcontainers không tự thấy Docker của Colima

Hai lỗi chồng nhau: Colima để socket trong thư mục nhà, và thư viện client mặc định thương lượng API 1.32 trong khi Docker Engine 29 từ chối mọi bản dưới 1.40.

**Đã xử lý sẵn trong `backend/build.gradle`** — nó tự hỏi `docker` xem engine ở đâu và nói API bản nào. Người dùng Docker Desktop lẫn Colima đều không phải cấu hình gì.

Khoá cấu hình đúng là `api.version`, **không phải** `DOCKER_API_VERSION` như nhiều bài viết nói.

### 3.4. Spring Initializr đang hỏng với Gradle

Mọi yêu cầu sinh dự án kiểu Gradle trả lỗi 500; Maven thì bình thường. Nếu cần dựng module mới, viết `build.gradle` bằng tay thay vì trông vào Initializr.

---

## 4. Cách lấy ticket

Ticket nằm ở `.scratch/<slice>/issues/NN-<ten>.md`. Mỗi tệp có hai dòng đáng đọc trước tiên:

```
**Blocked by:** 04, `slice-01 · 02` (phòng)
**Status:** ready-for-agent
```

**Quy tắc:** làm ticket nào có mọi thứ trong `Blocked by` đã `done`. Ticket cùng slice ghi bằng số; ticket ở slice khác ghi kiểu `slice-01 · 02`.

Làm xong thì đổi `Status:` thành `done`, tích các ô, và **viết vào mục `## Comments` những gì đã học được** — nhất là những chỗ làm khác ticket và lý do. Ba ticket đầu của Slice 0 là ví dụ về độ chi tiết mong đợi.

### Bảng ticket hiện tại

| Slice | Ticket | Xong |
|---|---|---|
| 0 — Nền móng | 8 | **0** (reset 2026-08-25, xem ghi chú đầu file) |
| 1 — Danh mục | 6 | 0 |
| 2 — Người thuê, hợp đồng | 8 | 0 |
| 3 — Ghi chỉ số | 8 | 0 |
| 4 — Tính hoá đơn ★ | 8 | 0 |

**Slice 4 có một luật riêng, đọc `spec.md` của nó trước khi động vào.** Ticket 02 là bộ kiểm thử viết trước khi có dòng cài đặt nào, và nó **cố ý không demo được gì**. Đảo thứ tự 02 và 03 là mất phần lớn giá trị của cả slice — kế hoạch triển khai nói rõ điều này và giải thích vì sao.

**Làm tiếp:** `slice-00 · 01` (bộ khung ba container). Mã nguồn đã bị xoá nên quay lại từ đầu, nhưng đọc mục `## Comments` của ticket 01, 02, 03 trước — ba cái bẫy môi trường (Spring Initializr, gói kiểm thử Boot 4, Testcontainers/Colima) và quyết định phiên đăng nhập (ADR-0001) đều đã tìm ra, không cần dò lại.

`slice-00 · 08` (GitHub Actions) **hoãn** tới khi có repo GitHub thật, vì tiêu chí hoàn thành đòi phải thấy CI đỏ khi đẩy mã sai.

---

## 5. Sáu điều đừng làm

1. **Đừng sửa tệp trong `Doc/`** khi đang code. Đó là báo cáo, sửa nó là việc riêng và phải cân nhắc. Nếu mã nguồn mâu thuẫn với báo cáo thì **báo cho người dùng**, đừng tự sửa bên nào.

2. **Đừng sửa tệp migration Flyway đã chạy.** Flyway lưu mã băm và sẽ từ chối khởi động. Mọi thay đổi đi qua một tệp `V<n+1>` mới.

3. **Đừng đặt tên lớp miền bằng tiếng Anh.** Sơ đồ lớp Chương 3 dùng tiếng Việt — `NguoiDung`, `ToaNha`, `VaiTro`. Trước khi đặt tên, tìm nó trong `Doc/diagrams-v2/10-class-domain.mmd`.

4. **Đừng cài đặt phép tính tiền ở ngoài `billing/calc`,** và trong `billing/calc` thì **viết kiểm thử trước**. Đây là điều kiện bắt buộc của Slice 4, không phải khuyến nghị.

5. **Đừng thêm `ports` cho `postgres` trong `docker-compose.yml`.** Quy ước 6.

6. **Đừng đưa dữ liệu cá nhân thật của người thật vào bất cứ đâu.** Rủi ro R-13. Mọi dữ liệu mẫu phải bịa.

---

## 6. Việc còn treo, không thuộc ticket nào

- **`JWT_SECRET` đang có giá trị mặc định trong `application.yml`.** Chỉ dùng khi phát triển. Slice 11 bắt buộc truyền giá trị thật qua biến môi trường — để nguyên chuỗi đó trên Internet nghĩa là ai đọc được repo cũng tự ký được token quản trị.
- **Chưa có refresh token.** Hết 30 phút phải đăng nhập lại. Hoãn được mà không phải làm lại phần xác thực, vì cơ chế thu hồi đã có (ADR-0001).
- **Bảng 4.3 của Chương 4 còn `[ĐIỀN]`.** Số thực tế: Java 21 · Spring Boot 4.1.1 · Gradle 9.7.1 · PostgreSQL 17.11 · Flyway 12.4.0 · Hibernate 7.4.5 · ArchUnit 1.4.1 · Testcontainers 1.21.3 · React 19.2 · Vite 8.2. Điền là việc của người viết báo cáo, không phải của session code.
- **Chưa có ai điền tên bốn thành viên** vào Phụ lục C, bìa báo cáo, và bảng phân công ở mục 8 kế hoạch triển khai.
