# Vertical Slice 0 — Nền móng

**Nguồn:** `Doc/PRJ1_Ke-hoach-trien-khai.md`, mục 6, Vertical Slice 0. Đọc ở đó, không chép lại vào đây.

## Problem Statement

Chưa có một dòng mã nào. Chưa ai trong nhóm chứng minh được rằng ba tầng — cơ sở dữ liệu, máy chủ, giao diện — nối được với nhau trên máy của mình, và chưa có gì canh giữ hai quy ước mà cả đồ án dựa vào: tiền không bao giờ đi qua `double`, và phần tính tiền không dính vào Spring.

## Solution

Dựng bộ khung chạy được đầu-cuối với đúng một chức năng nghiệp vụ thật là đăng nhập, cộng với hai luật kiến trúc cắn được và một quy trình tự động chặn mã sai.

Ba tầng phải nối được với nhau **trước** khi có chức năng nào đáng kể, vì nếu để phát hiện muộn thì mọi thứ xây bên trên đều phải sửa.

## Đóng những yêu cầu nào

FR-AUT-01, FR-AUT-02, FR-AUT-04, FR-AUT-05, FR-AUT-06 — tất cả mức Must have.

## Hoàn thành khi

Ba điều, chép từ kế hoạch:

1. Đăng nhập được bằng năm vai trò khác nhau, mỗi vai trò thấy một menu khác nhau
2. Sai mật khẩu năm lần thì bị khoá tạm
3. Luật ArchUnit chạy và **gãy build khi cố tình vi phạm**

## Tickets

Tám ticket trong `issues/`, cắt theo lối tracer bullet. `02` và `03` không chặn nhau nên chạy song song được ngay sau `01`.
