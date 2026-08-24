# Vertical Slice 1 — Danh mục toà nhà, phòng, dịch vụ

**Nguồn:** `Doc/PRJ1_Ke-hoach-trien-khai.md`, mục 6, Vertical Slice 1.

## Problem Statement

Slice 0 tạo ra hai toà nhà và sáu tài khoản bằng một tệp migration. Không ai **khai báo** được gì qua giao diện, và chưa có phòng, chưa có dịch vụ, chưa có giá. Mọi slice sau đều cần những thứ đó mới có cái mà làm việc: không có phòng thì không ký được hợp đồng, không có dịch vụ và giá thì không tính được hoá đơn.

## Solution

Dựng đủ danh mục nền để một người quản lý ngồi xuống là khai báo được toàn bộ một chung cư thật: toà nhà, tầng, phòng, dịch vụ, và giá của từng dịch vụ.

## Đóng những yêu cầu nào

FR-BLD-01 [M], FR-BLD-02 [M], FR-BLD-03 [M], FR-BLD-05 [M], FR-BLD-06 [M], FR-BLD-07 [M], FR-BLD-08 [S]

**Áp phiếu thay đổi:** CR-003 (bảng giá bậc thang)

## Điều đắt nhất nếu làm sai

**Bảng giá phải lưu được nhiều phiên bản theo ngày hiệu lực ngay từ slice này**, không phải chỉ một mức giá hiện hành.

Làm đúng ngay từ đầu thì rẻ. Sửa về sau thì phải chuyển đổi toàn bộ dữ liệu giá đã có, và mọi hoá đơn đã phát hành sẽ đổi số tiền khi giá thay đổi — vi phạm NFR-CMP-02.

Quy tắc tra giá, chép nguyên từ CR-003: lấy bản có `ngay_hieu_luc` **lớn nhất nhưng không vượt quá ngày kết thúc kỳ đang tính**. Không phải "bản mới nhất".

## Hoàn thành khi

1. Khai báo được một toà 3 tầng 20 phòng, toàn bộ qua giao diện
2. Khai báo được dịch vụ điện ở **cả hai** chế độ giá
3. Nhập được biểu giá năm bậc theo cơ cấu hiện hành
4. Sửa giá có ngày hiệu lực mới mà **giá cũ vẫn tra được**
