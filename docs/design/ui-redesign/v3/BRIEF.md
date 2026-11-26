# Brief V3 — Thiết kế lại UI/UX MiniApart từ góc nhìn người dùng thật (bản để Chủ tịch duyệt, CHƯA code app)

Bạn là **Principal Product Designer** (UI/UX B2B/PropTech, 15 năm kinh nghiệm), được thuê để làm lại MiniApart cho đúng. Chủ tịch (khách hàng của bạn) đã xem hai vòng thiết kế trước (v1 hệ thiết kế, v2 cấu trúc) và kết luận: **"hiện tại rất tệ, kể cả font chữ và bố trí"**. Đừng bảo vệ bản cũ. Được phép đập đi làm lại nếu bản cũ sai; không bị ràng buộc bởi token/font/component cũ. Việc của bạn: một **bộ thiết kế hoàn chỉnh, có chính kiến** để Chủ tịch duyệt trước khi ai đụng code.

## Sản phẩm là gì
MiniApart: phần mềm quản lý nhà cho thuê / căn hộ dịch vụ ở Việt Nam. 3 toà, ~36 phòng trong dữ liệu demo. Tiếng Việt, tiền VND (3.200.000 ₫), điện nước theo công tơ, hợp đồng, hoá đơn tháng, sự cố sửa chữa có thợ, PCCC.
5 vai trò: **Chủ nhà**, **Quản lý toà**, **Thợ**, **Người thuê**, **Quản trị hệ thống**.

## Người dùng thật (thiết kế cho họ, không cho "persona đẹp")
1. **Chủ nhà thực thụ**, 45–60 tuổi, nhiều toà, khó tính, ít kiên nhẫn, thường dùng cả máy tính và điện thoại. Hỏi 3 câu mỗi sáng: *Tháng này thu được bao nhiêu / ai đang nợ / có gì cháy cần tôi quyết?* Ghét: bảng dài, chữ nhỏ, màn nào cũng phải chọn toà lại, thuật ngữ kỹ thuật, nút lung tung. Cần: tin con số, thấy ngay việc phải quyết, 2 chạm là gọi/nhắc người nợ.
2. **Quản lý toà**, 28–40 tuổi, làm cả ngày trên máy tính, ghi điện nước, phát hành hoá đơn, thu tiền, xử lý sự cố, trả lời khách. Cần: chu kỳ tháng rõ từng bước, thao tác hàng loạt nhanh, ít click, phím tắt.
3. **Người thuê**, 20–40 tuổi, **chỉ dùng điện thoại**, vào app 1–2 lần/tháng: xem phải trả bao nhiêu, trả thế nào, báo hỏng, xem hợp đồng. Cần: một màn là xong, chữ to, không lạc.
4. **Thợ**, dùng điện thoại, tay có thể bẩn/ngoài trời, nắng: nhận việc, báo giá, xong việc, nhận tiền. Cần: nút to, tương phản mạnh, ít chữ.
5. **Quản trị hệ thống**: tài khoản, toà, nhật ký. Ít quan trọng, đơn giản.

## Việc bạn phải làm (theo thứ tự)
**A. Chẩn đoán trung thực.** Mở app thật ở http://localhost:5190 (đăng nhập 5 vai trò; chỉ GET, không bấm nút ghi) và xem ảnh `docs/design/ui-redesign/evidence/dot-03/`, `ux-v2/screens/png/`, `ux-v2/shots/x*/`. Viết `01-chan-doan.md`: tối đa 12 lỗi **thật sự làm người dùng mất tiền/mất thời gian**, xếp theo mức nặng, mỗi lỗi kèm ảnh/vị trí + nó hại ai. Phải gồm đánh giá thẳng về: **font chữ** (Inter/Archivo có hợp không, cỡ chữ, độ đậm, dấu tiếng Việt, số tiền), **thang cỡ chữ & khoảng cách**, **mật độ**, **phân cấp thông tin**, **màu** (teal + nền kem có ổn không), **điều hướng**.
**B. Hành trình & workflow tối ưu** (`02-workflow.md`): cho mỗi vai trò, 5–6 việc quan trọng nhất theo tần suất. Mỗi việc: sơ đồ luồng (mermaid hoặc ASCII) từ "mở app" tới "xong", số bước/chạm hiện tại (đo từ app thật) vs đề xuất, các trạng thái lỗi/rỗng/ngoại lệ (nợ nhiều kỳ, công tơ thiếu, thợ từ chối, hợp đồng hết hạn…). Các vòng đời cốt lõi bắt buộc có: **chu kỳ tháng** (ghi chỉ số → chốt → phát hành → thu → nhắc nợ), **vòng đời hợp đồng** (tạo → ký → gia hạn → thanh lý/hoàn cọc), **vòng đời sự cố** (báo → tiếp nhận → thợ → báo giá → duyệt → sửa → nghiệm thu → thanh toán), **người thuê trả tiền**.
**C. Hệ thiết kế mới, có lý do** (`03-he-thiet-ke.md`): chọn **font** (kèm so sánh thật ≥ 3 ứng viên render trên cùng nội dung tiếng Việt + số tiền, chọn dựa trên đọc được ở 13–16px, dấu, số tabular; ghi giấy phép và cách đóng gói tự host), thang chữ, thang khoảng cách, lưới, màu (ngữ nghĩa: nợ/cảnh báo/ok/đang xử lý; kiểm tương phản ≥ 4,5:1), bo góc/bóng, icon, hành vi component (nút, bảng, form, chip, ngăn bên, hộp thoại, toast, trạng thái rỗng/lỗi/tải), quy tắc **tiền/ngày/số**, quy tắc **mật độ** (desktop dày thông tin cho Quản lý; thoáng và chữ to cho Người thuê/Thợ), quy tắc **một nút chính mỗi màn**, tiếng nói của giao diện (câu chữ tiếng Việt tự nhiên, không thuật ngữ dev, không chữ IN HOA hét).
**D. Màn hình** (HTML tĩnh bấm thử được + PNG): tối thiểu
 - Chủ nhà (desktop 1440 **và** điện thoại 390): Trang đầu "việc hôm nay + tiền", Tiền/công nợ theo toà, Hồ sơ người thuê, Hồ sơ phòng/toà, Hợp đồng, Sự cố cần duyệt, Báo cáo.
 - Quản lý (desktop): Chu kỳ tháng đủ 4 bước (vẽ đủ cả 4 bước), Ghi chỉ số, Hoá đơn hàng loạt, Thu tiền, Sự cố, Tạo hợp đồng.
 - Người thuê (390): Cần trả (kèm trả tiền / QR như thiết kế mong muốn, đánh dấu là cần backend), Báo hỏng, Hợp đồng, Lịch sử.
 - Thợ (390): Việc của tôi, chi tiết việc, báo giá.
 - Khung: đăng nhập, điều hướng, chọn toà, tìm nhanh, thông báo, trạng thái rỗng/lỗi/mất mạng, màn "không có quyền".
 Dùng **dữ liệu thật** (GET từ 5190) cho chữ và số, tiếng Việt có dấu thật.
**E. Đầu ra** trong `docs/design/ui-redesign/v3/`: `README.md` (≤ 2 trang: hướng thiết kế, 5 quyết định lớn, vì sao bản này tốt hơn v2, bảng trước/sau số bước, **câu hỏi cho Chủ tịch, đánh số, mỗi câu có đề xuất**), `01-chan-doan.md`, `02-workflow.md`, `03-he-thiet-ke.md`, `prototype/index.html` (chạy bằng cách mở file, không cần mạng; chuyển vai trò; điều hướng thật giữa màn), `screens/png/` (1440 và 390), `compare/` (ảnh cũ cạnh mới cho ≥ 6 màn), `QA.md`.
**F. Tự kiểm khắt khe trước khi nộp:** mở từng ảnh bằng công cụ xem ảnh; làm lại cái nào trông giống app cũ hoặc "template AI" (thẻ rỗng, hộp lồng hộp, gradient vô nghĩa, quá nhiều nút chính, chữ xám nhạt khó đọc, khoảng trắng thừa). Đo: không cuộn ngang, vùng chạm ≥ 44px ở điện thoại / 36px desktop, chữ ≥ 13px (Người thuê/Thợ ≥ 16px chữ thân), tương phản ≥ 4,5:1, mỗi màn ≤ 1 nút chính. Thử "mắt khách khó tính": hỏi từng màn *người này mở lên có biết việc tiếp theo trong 3 giây không?*

## Ràng buộc
- **Không sửa `frontend/src`, backend, compose; không commit; không đổi nhánh.** Chỉ ghi trong `docs/design/ui-redesign/v3/`.
- App demo chỉ GET (đăng nhập là ngoại lệ duy nhất). Mật khẩu demo ở dòng 8 `docker-compose.demo.yml`; **không in ra output**, không ghi vào file.
- Môi trường macOS; dùng Chrome/Chromium headless hoặc công cụ browser có sẵn để chụp. Thiết kế phải **khả thi với dữ liệu/API hiện có**; thứ cần API mới (QR chuyển khoản, nhắc nợ tự động, lịch sử liên hệ…) ghi vào bảng "Phụ thuộc backend" kèm cách làm tạm.
- Quyết định bạn tự đặt ghi rõ "Tôi chọn" + lý do. Không hỏi lại Chủ tịch giữa chừng; có cách nào hợp lý thì tự chọn.
- Báo cuối: bảng đầu ra, 5 quyết định lớn, câu hỏi đánh số, phụ thuộc backend, điều chưa kiểm. Ngắn.
