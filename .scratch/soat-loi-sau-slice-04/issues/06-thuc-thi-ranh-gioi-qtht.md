# 06: Thực thi ranh giới quyền của QTHT · BR-17 · FR-AUT-04

**What to build:** Cài đặt ruling B của ticket 03: `QTHT` chỉ được quản lý tài khoản, xem danh sách toàn bộ toà nhà và xem nhật ký thao tác. `QTHT` không được xem hoặc sửa dữ liệu nghiệp vụ của toà nhà.

**Status:** done

**Blocked by:** 03 (đã giải quyết)

## Phạm vi

- Bỏ `QTHT` khỏi các guard nghiệp vụ trong danh mục toà, phòng, dịch vụ, bảng giá, kỳ thanh toán, chỉ số, hợp đồng, người ở cùng, hồ sơ người thuê, ảnh giấy tờ và toàn bộ billing.
- Giữ quyền `QTHT` trong `QuanLyNguoiDungService`, danh sách toàn bộ toà nhà ở `ToaNhaRepository`, và màn nhật ký thao tác.
- Bỏ nhánh bypass `QTHT` trong `PhanQuyenToaService`, để mọi truy cập dữ liệu nghiệp vụ chi tiết vẫn phải có phân công toà.
- Kiểm tra ảnh giấy tờ theo quan hệ `NGUOI_THUE ← HOP_DONG → PHONG → TOA_NHA`, cho phép `CHU`/`QUAN_LY` nếu có ít nhất một hợp đồng của người thuê tại một toà được phân công, kể cả hợp đồng đã hết hạn.
- Giới hạn danh sách, chi tiết, cập nhật hồ sơ và upload ảnh của `QUAN_LY` theo cùng quan hệ người thuê–hợp đồng–phòng–toà; hồ sơ chưa có hợp đồng vẫn được coi là đang onboarding để hoàn tất bước ký hợp đồng.

## Hoàn thành khi

- [x] `QTHT` xem được danh sách toàn bộ toà nhưng nhận 403 khi mở chi tiết hoặc thao tác dữ liệu nghiệp vụ.
- [x] `QTHT` vẫn quản lý được tài khoản và xem được nhật ký.
- [x] `CHU`/`QUAN_LY` vẫn dùng các nghiệp vụ ở toà được phân công.
- [x] `QUAN_LY` nhận 403 khi xin liên kết ảnh giấy tờ của người thuê chỉ thuộc toà khác; truy vấn không lọc mất hợp đồng lịch sử.
- [x] Các test 403 mang mã FR/BR, dữ liệu mẫu hoàn toàn bịa.
- [x] Test focused, full backend suite, specification review, code-quality review và verification đã hoàn tất.

## Comments

- Đã thực thi ruling B: bỏ QTHT khỏi guard nghiệp vụ và bỏ bypass QTHT trong `PhanQuyenToaService`; giữ quyền danh sách toàn bộ toà, quản lý tài khoản và nhật ký.
- Đã bổ sung kiểm tra vai trò cho endpoint tạo hoá đơn hàng loạt để `THO`/`NGUOI_THUE` vẫn nhận 403 ngay cả khi có phân công toà.
- Đã cập nhật fixture ảnh giấy tờ để tạo hợp đồng lịch sử, chứng minh phạm vi hợp lệ không phụ thuộc trạng thái/ngày hợp đồng.
- Guard `PhanQuyenToaService` từ chối `QTHT` tuyệt đối kể cả khi dữ liệu phân công tồn tại; attachment mồ côi cũng bị từ chối khi xin liên kết.
- Hồ sơ onboarding chưa có hợp đồng được phép nhập và upload để hoàn tất bước ký, nhưng chưa được cấp link xem ảnh cho tới khi có hợp đồng nối với tòa được phân công.
- Đã bổ sung guard vai trò cho endpoint tính thử hoá đơn sau review và thêm test khi THO/NGUOI_THUE có phân công toà.
- Nhóm focused xanh và full backend suite xanh: 333/333 test.
