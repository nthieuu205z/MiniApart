# Vertical Slice 2 — Người thuê và hợp đồng

**Nguồn:** `Doc/PRJ1_Ke-hoach-trien-khai.md`, mục 6, Vertical Slice 2.

## Problem Statement

Có phòng rồi nhưng chưa có ai thuê. Chưa lưu được hồ sơ người thuê, chưa ký được hợp đồng, và chưa biết phòng nào đang có người. Hoá đơn ở Slice 4 tính tiền cho **một hợp đồng**, nên không có hợp đồng thì không có gì để tính.

## Solution

Ký được hợp đồng thuê trọn vẹn: hồ sơ người thuê kèm ảnh giấy tờ, danh sách người ở cùng theo thời gian, hợp đồng có điều khoản đầy đủ, và trạng thái phòng tự cập nhật theo hợp đồng.

## Đóng những yêu cầu nào

FR-TNT-01 [M], FR-TNT-02 [M], FR-TNT-03 [S], FR-TNT-04 [M], FR-TNT-05 [M], FR-TNT-07 [S], FR-BLD-04 [M]

**Áp phiếu thay đổi:** CR-001, CR-002 phần (a), CR-005, CR-012, CR-013

## Ba điều đắt nhất nếu làm sai

**1. FR-TNT-05 phải ép ở tầng cơ sở dữ liệu.** Cấm hai hợp đồng cùng hiệu lực trên một phòng. Kiểm ở tầng ứng dụng sẽ **hở khi hai người thao tác cùng lúc**: cả hai cùng đọc thấy phòng trống, cả hai cùng ghi. PostgreSQL có kiểu khoảng và ràng buộc loại trừ làm được việc này chính xác.

**2. CR-002 phần (a) — người ở cùng phải có chiều thời gian.** Không có `tu_ngay`/`den_ngay` thì hệ thống chỉ trả lời được "hiện giờ phòng có mấy người", không trả lời được "tháng 3 phòng có mấy người". BR-02c và BR-03 đều cần con số theo kỳ.

**3. CR-013 — ảnh giấy tờ không bao giờ có URL cố định.** Lưu sẵn một đường dẫn trong cơ sở dữ liệu là đi ngược NFR-SEC-04, vì URL cố định thì không có hạn dùng. Tên trường là `khoa_luu_tru`, không phải `duong_dan` — đặt tên đúng để người viết mã sau không vô tình trả thẳng giá trị đó ra giao diện.

## Hoàn thành khi

1. Ký được hợp đồng, phòng **tự** chuyển trạng thái
2. Thử ký hợp đồng thứ hai chồng ngày lên cùng phòng thì **bị từ chối**
3. Ảnh căn cước tải lên xem được qua liên kết hết hạn sau 15 phút; dán liên kết đó vào cửa sổ ẩn danh **sau 15 phút** thì không xem được
