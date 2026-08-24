# Vertical Slice 4 — Tính hoá đơn ★

**Nguồn:** `Doc/PRJ1_Ke-hoach-trien-khai.md`, mục 6, Vertical Slice 4.

> **Đây là slice quan trọng nhất của toàn bộ đồ án.** Làm chậm cũng được, nhưng phải đúng tuyệt đối.

## Problem Statement

Có hợp đồng, có bảng giá, có chỉ số. Chưa có hoá đơn — tức là chưa có cái mà cả hệ thống sinh ra để làm.

Sai sót ở phần này có ba đặc điểm khiến nó nguy hiểm hơn lỗi thường:

- **Không làm chương trình báo lỗi.** Một hoá đơn ghi 1.887.999 đồng thay vì 1.888.000 đồng trông vẫn hoàn toàn bình thường.
- **Ảnh hưởng trực tiếp tới tiền của người thật.**
- **Chỉ lộ ra sau nhiều kỳ**, khi việc sửa đã kéo theo phải tính lại dữ liệu lịch sử.

## Solution

Cài đặt BR-01 → BR-09 và BR-15 trong gói `billing/calc` **thuần tuý**, không phụ thuộc Spring, JPA hay cơ sở dữ liệu, và **viết toàn bộ kiểm thử trước khi có dòng cài đặt nào**.

## Đóng những yêu cầu nào

FR-INV-01 [M], FR-INV-02 [M], FR-INV-03 [M], FR-INV-04 [M], FR-INV-05 [S], FR-INV-06 [M], FR-INV-07 [M]

**Áp phiếu thay đổi:** CR-002 phần (b) — kết tinh nhân khẩu khi chốt kỳ · CR-008 — khoản phát sinh chờ · CR-011 — bỏ thuế GTGT

**Quy tắc nghiệp vụ:** BR-01 → BR-09, BR-15

> ⚠️ **Một điểm cần người phụ trách xác nhận.** Kế hoạch triển khai ghi phạm vi quy tắc của slice này là *"BR-01 → BR-09, BR-15, **BR-16**"*. Nhưng BR-16 là **vòng đời yêu cầu sửa chữa**, thuộc Vertical Slice 7, không liên quan tới tính hoá đơn. Nhiều khả năng đây là lỗi gõ trong kế hoạch. Các ticket dưới đây làm theo **BR-01 → BR-09 và BR-15**; nếu xác nhận là lỗi gõ thì sửa lại kế hoạch, đừng sửa ticket.

## Thứ tự bắt buộc — đảo là hỏng

Kế hoạch nói rõ ba bước và **không cho đảo**:

1. Viết **toàn bộ** kiểm thử cho `billing/calc` — cả ba tầng — trong khi chưa có dòng cài đặt nào
2. Cài đặt cho tới khi mọi kiểm thử xanh
3. **Chỉ khi đó** mới nối vào cơ sở dữ liệu và giao diện

**Vì sao thứ tự này quan trọng đến thế.** Khi viết kiểm thử trước, những câu hỏi kiểu *"kỳ đầu tiên của một hợp đồng ký giữa tháng thì tính tiền phòng thế nào"* sẽ **bật ra ngay**, lúc chưa tốn công cài đặt gì. Viết mã trước thì những câu đó chỉ lộ ra khi đã muộn — và câu trả lời lúc đó thường là "làm sao cho khớp với mã đã viết" thay vì "làm sao cho đúng".

Đây cũng là lý do ticket 02 dưới đây **cố tình là một ticket chỉ có kiểm thử, chưa demo được gì**. Nó là ngoại lệ có chủ ý với nguyên tắc lát cắt dọc, và ngoại lệ đó chính là điểm đáng bảo vệ nhất của đồ án.

## Ba tầng kiểm thử

**Tầng 1 — Ca ví dụ.** Mỗi quy tắc tối thiểu ba ca: thông thường, ở biên, ngoại lệ. Ví dụ ở mục 5.4.5 tài liệu phân tích là **ca số một**, chép nguyên số liệu, kỳ vọng đúng **1.888.000 đồng**.

**Tầng 2 — Kiểm thử theo tính chất.** Phát biểu những tính chất phải luôn đúng rồi để máy sinh hàng nghìn bộ dữ liệu ngẫu nhiên thử phá. Tầng này tìm ra loại lỗi mà con người không nghĩ tới khi ngồi liệt kê ca — đặc biệt là lỗi làm tròn ở biên các bậc thang.

**Tầng 3 — Bất biến lịch sử.** Tạo hoá đơn, chốt kỳ, rồi **cố ý thay đổi bảng giá, số người ở, đơn giá dịch vụ**, in lại hoá đơn cũ và khẳng định con số **không đổi**. Đây là tầng chứng minh CR-002 và CR-003 đã được giải quyết đúng, và là thứ đáp ứng NFR-CMP-02.

## Hoàn thành khi

1. Ca kiểm thử chép từ mục 5.4.5 ra **đúng 1.888.000 đồng**
2. Tạo hàng loạt hoá đơn cho 20 phòng trong một thao tác
3. Phòng thiếu chỉ số **bị bỏ qua có báo rõ**, không làm gián đoạn phần còn lại
4. Thử tạo lần hai cho cùng kỳ thì **bị chặn**
5. **Kiểm thử bất biến lịch sử ở tầng 3 xanh**
