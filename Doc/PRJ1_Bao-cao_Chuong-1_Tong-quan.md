# CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI


## 1.1. Bối cảnh và phát biểu bài toán

Chung cư mini (nhà trọ cao tầng khép kín) là loại hình nhà ở phổ biến tại các đô thị lớn ở Việt Nam, đặc biệt quanh các khu vực trường đại học và khu công nghiệp. Một toà chung cư mini điển hình có 3–7 tầng, 15–50 phòng khép kín, do một chủ sở hữu tự vận hành hoặc thuê một người quản lý trông coi.

Qua khảo sát sơ bộ, công tác vận hành hiện nay chủ yếu làm thủ công và bộc lộ các vấn đề sau:

**Bảng 1.1 — Các vấn đề của công tác vận hành thủ công**

| # | Vấn đề hiện tại | Hệ quả |
|---|---|---|
| P1 | Ghi chỉ số công tơ điện, nước bằng sổ tay hoặc chụp ảnh điện thoại, cuối tháng nhập lại vào Excel | Sai sót khi nhập liệu, ghi nhầm phòng, khó tra cứu lại chỉ số cũ khi có tranh chấp |
| P2 | Tính tiền từng phòng thủ công trên máy tính cầm tay hoặc file Excel tự chế | Mất 3–5 giờ mỗi kỳ cho một toà 30 phòng; dễ tính sai, đặc biệt với phòng có người vào/ra giữa tháng |
| P3 | Gửi hoá đơn qua tin nhắn Zalo, mỗi phòng một tin nhắn soạn tay | Tốn thời gian, người thuê không có bằng chứng lưu trữ, hay thắc mắc "sao tháng này cao thế" |
| P4 | Theo dõi công nợ bằng trí nhớ hoặc gạch sổ | Bỏ sót phòng chưa đóng tiền, khó biết tổng công nợ tại một thời điểm |
| P5 | Người thuê báo hỏng hóc qua gọi điện/nhắn tin rời rạc | Quên xử lý, không có lịch sử sửa chữa, không biết chi phí bảo trì thực tế |
| P6 | Hồ sơ hợp đồng, giấy tờ tuỳ thân, hồ sơ PCCC lưu bản giấy | Khó tìm khi cần, khó biết hợp đồng nào sắp hết hạn, rủi ro khi cơ quan chức năng kiểm tra |
| P7 | Chủ có nhiều toà phải mở nhiều file Excel riêng | Không có bức tranh tổng doanh thu, không so sánh được hiệu quả giữa các toà |

**Phát biểu bài toán:** Cần xây dựng một hệ thống thông tin giúp chủ sở hữu và người quản lý số hoá toàn bộ vòng đời vận hành chung cư mini — từ quản lý phòng, hợp đồng thuê, ghi chỉ số dịch vụ, lập và thu hoá đơn, xử lý sự cố, đến báo cáo kinh doanh — đồng thời cung cấp cho người thuê một kênh minh bạch để tra cứu hoá đơn và tương tác với ban quản lý.

## 1.2. Mục tiêu

**Bảng 1.2 — Mục tiêu nghiệp vụ và chỉ số đo lường**

| Mã | Mục tiêu | Chỉ số đo lường mong muốn |
|---|---|---|
| BG-01 | Rút ngắn thời gian chốt sổ và phát hành hoá đơn hàng tháng | Từ ~4 giờ/toà 30 phòng xuống dưới 30 phút |
| BG-02 | Giảm sai sót trong tính tiền dịch vụ | Số khiếu nại về hoá đơn giảm ≥ 70% |
| BG-03 | Tăng tỷ lệ thu tiền đúng hạn | ≥ 90% hoá đơn được thanh toán trong hạn |
| BG-04 | Minh bạch hoá chỉ số điện nước với người thuê | 100% hoá đơn có kèm chỉ số đầu kỳ – cuối kỳ và ảnh công tơ |
| BG-05 | Rút ngắn thời gian xử lý sự cố | Thời gian trung bình từ lúc báo đến lúc hoàn thành < 48 giờ |
| BG-06 | Cung cấp báo cáo tổng hợp nhiều toà cho chủ sở hữu | Xem được doanh thu, công nợ, tỷ lệ lấp đầy theo thời gian thực |

**Mục tiêu học tập của nhóm:** thực hành đầy đủ quy trình phân tích yêu cầu (thu thập – đặc tả – xác minh – quản lý), tạo ra bộ tài liệu SRS làm đầu vào cho giai đoạn thiết kế và lập trình ở các bài sau.

## 1.3. Phạm vi hệ thống

Hệ thống có tên là **MiniApart** — ứng dụng web quản lý và vận hành chung cư mini, hỗ trợ **một chủ sở hữu quản lý nhiều toà nhà**, có **cổng riêng dành cho người thuê**.

**Bảng 1.3 — Các nhóm chức năng trong phạm vi**

| # | Nhóm chức năng |
|---|---|
| S1 | Quản lý danh mục: toà nhà, tầng, phòng, loại phòng, dịch vụ, biểu giá |
| S2 | Quản lý người thuê, người ở cùng, phương tiện, hồ sơ giấy tờ |
| S3 | Quản lý hợp đồng thuê: ký mới, gia hạn, thanh lý, tiền cọc |
| S4 | Ghi chỉ số điện – nước theo kỳ, kèm ảnh chụp công tơ |
| S5 | Tính và phát hành hoá đơn kỳ, gửi thông báo cho người thuê |
| S6 | Ghi nhận thanh toán (tiền mặt / chuyển khoản), theo dõi công nợ |
| S7 | Tiếp nhận và xử lý yêu cầu sửa chữa, quản lý tài sản trong phòng |
| S8 | Thông báo chung của toà nhà (cắt điện nước, nội quy, tăng giá) |
| S9 | Cổng người thuê: xem hoá đơn, lịch sử chỉ số, báo sự cố, gửi yêu cầu |
| S10 | Báo cáo: doanh thu, công nợ, tỷ lệ lấp đầy, chi phí bảo trì, tiêu thụ dịch vụ |
| S11 | Quản lý người dùng và phân quyền theo vai trò, theo toà nhà |
| S12 | Nhắc việc: hợp đồng sắp hết hạn, hoá đơn quá hạn, đến kỳ chốt số, đến hạn kiểm tra PCCC |

**Bảng 1.4 — Nội dung ngoài phạm vi phiên bản 1.0 và lý do loại trừ**

| # | Nội dung | Lý do loại trừ |
|---|---|---|
| O1 | Tích hợp cổng thanh toán trực tuyến (VNPay, MoMo) để trừ tiền tự động | Cần hợp đồng doanh nghiệp với nhà cung cấp, vượt khả năng của đồ án. Thay thế: hiển thị **mã QR chuyển khoản** kèm nội dung chuyển tiền chuẩn hoá, quản lý xác nhận thủ công |
| O2 | Đọc chỉ số công tơ tự động bằng IoT / nhận dạng ảnh | Yêu cầu phần cứng và mô hình AI, rủi ro cao cho một kỳ học |
| O3 | Ứng dụng di động native (Android/iOS) | Thay thế bằng giao diện web responsive dùng tốt trên điện thoại |
| O4 | Tích hợp trực tiếp với hệ thống VNeID / cổng dịch vụ công để khai báo lưu trú | Không có API mở cho bên thứ ba. Hệ thống chỉ **quản lý hồ sơ và xuất danh sách** phục vụ khai báo |
| O5 | Mô hình đa chủ sở hữu (SaaS multi-tenant), gói cước, hoá đơn VAT điện tử | Vượt phạm vi một học kỳ; kiến trúc dữ liệu vẫn để ngỏ đường mở rộng |
| O6 | Chấm công, tính lương nhân viên vận hành | Không thuộc nghiệp vụ cốt lõi |

## 1.4. Thuật ngữ và từ viết tắt

**Bảng 1.5 — Thuật ngữ và từ viết tắt**

| Thuật ngữ | Giải thích |
|---|---|
| Chung cư mini | Nhà ở nhiều tầng, nhiều căn hộ/phòng khép kín do cá nhân hoặc hộ gia đình xây dựng để cho thuê |
| Kỳ (chu kỳ tính phí) | Khoảng thời gian giữa hai lần chốt chỉ số, mặc định là một tháng |
| Ngày chốt số | Ngày trong tháng mà người quản lý ghi lại chỉ số công tơ, mặc định ngày 28 |
| Chỉ số đầu kỳ / cuối kỳ | Số hiển thị trên công tơ tại thời điểm chốt của kỳ trước / kỳ hiện tại |
| Tiền cọc | Khoản tiền người thuê đặt trước khi ký hợp đồng, thường bằng 1 tháng tiền phòng |
| Công nợ | Tổng số tiền người thuê còn phải trả tính đến thời điểm xét |
| Tỷ lệ lấp đầy | Tỷ lệ phòng đang có hợp đồng hiệu lực trên tổng số phòng |
| Hoá đơn kỳ | Bảng kê các khoản phải thu của một phòng trong một kỳ |
| Actor | Tác nhân — người hoặc hệ thống bên ngoài tương tác với hệ thống |
| FR / NFR | Functional Requirement / Non-Functional Requirement — Yêu cầu chức năng / phi chức năng |
| BR | Business Rule — Quy tắc nghiệp vụ |
| US | User Story |
| AC | Acceptance Criteria — Tiêu chí chấp nhận |
| SRS | Software Requirement Specification |
| MoSCoW | Phương pháp xếp ưu tiên: Must / Should / Could / Won't have |
| PCCC | Phòng cháy chữa cháy |
| RBAC | Role-Based Access Control — phân quyền theo vai trò |

## 1.5. Tài liệu tham chiếu

**Bảng 1.6 — Tài liệu tham chiếu và vai trò với dự án**

| # | Tài liệu | Vai trò với dự án |
|---|---|---|
| R1 | Slide bài giảng "Project 1 — Phân tích yêu cầu". *(Bổ sung tên giảng viên và năm học khi hoàn thiện danh mục tham khảo.)* | Khung phương pháp và cấu trúc tài liệu |
| R2 | Thủ tướng Chính phủ. (2025). *Quyết định quy định về cơ cấu biểu giá bán lẻ điện.* Số 14/2025/QĐ-TTg, ngày 29/5/2025. | Cơ sở cho cơ cấu **5 bậc** của quy tắc tính tiền điện bậc thang (BR-02b) |
| R3 | Bộ Công Thương. (2025). *Quyết định về giá bán điện.* Số 1279/QĐ-BCT, ngày 09/5/2025, hiệu lực từ 10/5/2025. | Nguồn của giá bán lẻ điện bình quân 2.204,0655 đ/kWh — căn cứ quy đổi đơn giá từng bậc |
| R4 | Quy định về giá điện cho người thuê nhà — định mức 4 người tính là 1 hộ. *(Bổ sung số hiệu văn bản khi hoàn thiện.)* | Ràng buộc pháp lý khi tính tiền điện cho phòng trọ (BR-02c) |
| R5 | Quốc hội. (2024). *Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ*; Chính phủ. (2025). *Nghị định số 105/2025/NĐ-CP.* | Cơ sở cho phân hệ quản lý hồ sơ và kiểm tra PCCC định kỳ |
| R6 | Quốc hội. (2020). *Luật Cư trú* và các quy định về thông báo lưu trú. | Cơ sở cho chức năng quản lý hồ sơ tạm trú người thuê |
| R7 | Mẫu hợp đồng thuê nhà ở phổ biến trên thị trường. | Nguồn xác định các trường dữ liệu của thực thể Hợp đồng |
| R8 | Khảo sát 3 ứng dụng tương tự trên thị trường (xem mục 2.2.5.2). | Đối sánh tính năng, tránh bỏ sót yêu cầu |

> **Ghi chú về R2 và R3.** Hai văn bản này giữ vai trò khác nhau và **không thay thế cho nhau**: R2 quy định *cơ cấu* biểu giá — số bậc, khoảng sản lượng, và tỷ lệ phần trăm của từng bậc so với giá bình quân; R3 quy định *mức* giá bán lẻ điện bình quân dùng để quy đổi các tỷ lệ đó thành đơn giá cụ thể. Khi Nhà nước điều chỉnh giá điện, thông thường chỉ R3 thay đổi còn cơ cấu ở R2 giữ nguyên. Đây là lý do BR-02b lưu cả tỷ lệ lẫn đơn giá đã quy đổi.
>
> ✅ **Đã kiểm chứng ngày 23/08/2026.** Quyết định 1279/QĐ-BCT vẫn là văn bản hiện hành; giá bán lẻ điện bình quân **chưa thay đổi kể từ 10/5/2025**, tức đã giữ nguyên hơn 15 tháng. Trong năm 2026 chỉ có thay đổi về **cơ chế** điều chỉnh giá, không phải về mức giá: **Nghị định 278/2026/NĐ-CP** ngày 09/7/2026 sửa đổi Nghị định 72/2025/NĐ-CP, theo đó giá bán lẻ điện bình quân được xét điều chỉnh **ba tháng một lần** khi chi phí đầu vào biến động từ 2% trở lên — tối đa bốn đợt mỗi năm.
>
> ⚠️ **Vẫn phải kiểm lại sát ngày bảo vệ.** Chu kỳ xét ba tháng một lần nghĩa là một quyết định điều chỉnh có thể ban hành bất cứ lúc nào, kể cả trong khoảng thời gian từ nay tới lúc nộp. Nếu giá bình quân đổi thì **chỉ cột đơn giá ở BR-02b phải cập nhật**; cơ cấu 5 bậc và các tỷ lệ phần trăm giữ nguyên — đây đúng là tình huống mà thiết kế lưu cả `ty_le` lẫn đơn giá đã quy đổi được dựng ra để hấp thụ.

## 1.6. Bố cục báo cáo

Báo cáo gồm bảy chương. Ba chương đầu đi theo trình tự của quy trình phát triển phần mềm — hiểu bài toán, phân tích yêu cầu, thiết kế lời giải — bốn chương sau nói về việc hiện thực hoá thiết kế đó thành sản phẩm chạy được.

**Bảng 1.7 — Bố cục báo cáo**

| Chương | Nội dung | Câu hỏi mà chương này trả lời |
|---|---|---|
| 1 | Tổng quan đề tài | Bài toán là gì, làm cho ai, phạm vi tới đâu |
| 2 | Khảo sát và phân tích yêu cầu | Ai có tiếng nói với hệ thống, yêu cầu thu thập bằng cách nào, hệ thống **phải** làm gì, và bản đặc tả có đủ tốt để đem đi lập trình không |
| 3 | Phân tích và thiết kế hệ thống | Những yêu cầu đó được tổ chức thành hình hài nào để lập trình được |
| 4 | Công nghệ sử dụng | Sản phẩm được dựng bằng công nghệ gì, và vì sao chọn như vậy |
| 5 | Xây dựng và triển khai | Phần mềm được xây dựng theo trình tự nào và đưa lên máy chủ ra sao |
| 6 | Kiểm thử và đánh giá | Làm sao biết phần mềm chạy đúng, nhất là ở phần tính tiền |
| 7 | Kết luận | Làm được gì, chưa làm được gì, hướng phát triển tiếp |

Hai phần dễ bị nhầm với nhau là **mục 2.5** và **Chương 6**. Mục 2.5 kiểm tra chất lượng của **bản đặc tả** — yêu cầu có rõ ràng không, có đo được không, có truy vết được không, có mâu thuẫn với nhau ở đâu không. Chương 6 kiểm tra chất lượng của **phần mềm đã xây dựng** — chạy có ra đúng kết quả không. Hai việc khác nhau, làm ở hai giai đoạn khác nhau, bằng hai phương pháp khác nhau.
