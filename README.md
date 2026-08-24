# MiniApart — PRJ1-CCM

Hệ thống Quản lý và Vận hành Chung cư mini. Đồ án môn **Project 1**.

Spring Boot · PostgreSQL · React · Docker Compose

---

## Chạy toàn bộ hệ thống

Cần **Docker** đang chạy. Ba lệnh:

```bash
docker compose up -d --build
```

Rồi mở <http://localhost:5173> và đăng nhập.

### Tài khoản mẫu

Mật khẩu của **tất cả** tài khoản dưới đây: `MatKhau@123`

| Số điện thoại | Vai trò | Phạm vi |
|---|---|---|
| `0900000001` | Quản trị hệ thống | Toàn hệ thống |
| `0900000002` | Chủ sở hữu | Cả hai toà |
| `0900000003` | Quản lý toà nhà | Chỉ toà A |
| `0900000004` | Quản lý toà nhà | Chỉ toà B |
| `0900000005` | Thợ sửa chữa | Toà A |
| `0900000006` | Người thuê | Toà A |

Toàn bộ là **dữ liệu bịa** — không có tên, số điện thoại, hay địa chỉ của người thật. Đây là biện pháp giảm rủi ro R-13 trong kế hoạch triển khai.

Hai quản lý ở hai toà khác nhau là cố ý: ticket 06 cần đúng cấu hình đó để thử phép tấn công "đăng nhập bằng quản lý toà A rồi gọi thẳng dữ liệu toà B".

Xem log khi có gì đó không lên:

```bash
docker compose logs -f
```

Dừng lại, giữ nguyên dữ liệu:

```bash
docker compose down
```

Thêm `-v` vào lệnh trên là **xoá luôn cơ sở dữ liệu**. Chỉ dùng khi muốn làm lại từ đầu.

## Chạy riêng từng phần khi phát triển

Backend cần một PostgreSQL đang chạy. Cách nhanh nhất là để Compose lo phần đó:

```bash
docker compose up -d postgres
```

Rồi ở một cửa sổ khác:

```bash
cd backend && ./gradlew bootRun
```

Và frontend ở cửa sổ thứ ba:

```bash
cd frontend && npm install && npm run dev
```

Frontend luôn gọi backend qua đường dẫn tương đối `/api`. Lúc phát triển thì Vite chuyển tiếp, lúc triển khai thật thì Nginx chuyển tiếp — **không chỗ nào trong mã ghi cứng địa chỉ máy chủ**.

## Chạy kiểm thử

```bash
cd backend && ./gradlew test
```

Kiểm thử tích hợp dựng một PostgreSQL thật bằng Testcontainers, nên **Docker phải đang chạy**. Máy dùng Colima hay Rancher Desktop thì không cần đặt biến môi trường gì — `build.gradle` tự hỏi `docker` xem engine đang ở đâu.

## Cấu trúc

```
backend/     Spring Boot, chia theo module nghiệp vụ (xem AGENTS.md)
frontend/    React + Vite + TypeScript
Doc/         Tài liệu phân tích, thiết kế, báo cáo
docs/        Cấu hình cho công cụ hỗ trợ, ADR
.scratch/    Ticket theo từng vertical slice
```

## Trước khi viết dòng mã nào

Đọc `AGENTS.md`. Có sáu quy ước **ép bằng máy** ở đó, vi phạm là gãy build chứ không phải bị nhắc nhở.

Kế hoạch làm việc nằm ở `Doc/PRJ1_Ke-hoach-trien-khai.md`, cắt thành 13 vertical slice. Ticket của slice đang làm nằm ở `.scratch/`.
