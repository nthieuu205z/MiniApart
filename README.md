# MiniApart — PRJ1-CCM

Hệ thống Quản lý và Vận hành Chung cư mini. Đồ án môn **Project 1**.

Spring Boot · PostgreSQL · React · Docker Compose

---

## Chạy toàn bộ hệ thống

Cần **Docker** đang chạy. Từ gốc repo, chạy đúng ba bước:

```bash
docker compose up -d --build
```

Mở <http://localhost:5173> để xem smoke screen MiniApart.

```bash
docker compose ps
```

Khi làm xong, dừng các container nhưng giữ dữ liệu:

```bash
docker compose down
```

Ticket hiện tại mới dựng đường nối frontend → backend → PostgreSQL. Đăng nhập và dữ liệu nghiệp vụ sẽ được triển khai ở các ticket tiếp theo.

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
cd frontend && npm ci && VITE_BACKEND_URL=http://localhost:8080 npm run dev
```

Frontend luôn gọi backend qua đường dẫn tương đối `/api`. Lúc phát triển, Vite nhận địa chỉ proxy từ `VITE_BACKEND_URL`; lúc triển khai bằng Compose, Nginx chuyển tiếp — **không chỗ nào trong mã giao diện ghi cứng địa chỉ máy chủ**.

## Chạy kiểm thử

Backend:

```bash
cd backend && ./gradlew test
```

Frontend:

```bash
cd frontend && npm ci && npm test
```

Kiểm thử tích hợp backend dựng một PostgreSQL thật bằng Testcontainers, nên **Docker phải đang chạy**. Máy dùng Colima hay Rancher Desktop thì không cần đặt biến môi trường gì — `build.gradle` tự hỏi `docker` xem engine đang ở đâu.

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
