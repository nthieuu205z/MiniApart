# HƯỚNG DẪN RÁP QUYỂN BÁO CÁO

**Dự án:** PRJ1-CCM — Hệ thống Quản lý và Vận hành Chung cư mini
**Lập ngày:** 23/08/2026

Tài liệu này không phải một chương của báo cáo. Nó là bản chỉ dẫn: quyển báo cáo gồm những gì, phần nào đã có, phần nào còn thiếu, và ráp lại theo thứ tự nào.

---

## 1. Cấu trúc quyển và trạng thái từng phần

| Phần | Nguồn nội dung | Trạng thái |
|---|---|---|
| Bìa, lời cảm ơn | — | ❌ Chưa có |
| Mục lục | Sinh tự động khi xuất Word | ❌ Chưa có |
| **Danh mục hình** | Đánh số lại toàn bộ hình | ❌ Chưa có |
| **Danh mục bảng** | Đánh số lại toàn bộ bảng | ❌ Chưa có |
| Danh mục từ viết tắt | Mục 1.4 của tài liệu phân tích | ✅ Có sẵn |
| **Chương 1. Tổng quan đề tài** | `PRJ1_Bao-cao_Chuong-1_Tong-quan.md` | ✅ **Đã ráp xong 23/08** — 6 mục, 7 bảng, mục 1.6 đã viết lại cho bảy chương |
| **Chương 2. Khảo sát và phân tích yêu cầu** | `PRJ1_Bao-cao_Chuong-2_Khao-sat-phan-tich.md` | ✅ **Đã ráp xong 23/08** — 6 mục (gồm cả mục 7 và 8 của tài liệu gốc), 43 bảng |
| **Chương 3. Phân tích và thiết kế hệ thống** | `PRJ1_Bao-cao_Chuong-3_Phan-tich-thiet-ke.md` | ✅ **Đã ráp xong 23/08** — 11 mục, 21 hình, 8 bảng, đã đánh số |
| **Chương 4. Công nghệ sử dụng** | `PRJ1_Bao-cao_Chuong-4_Cong-nghe.md` | ✅ Gần trọn vẹn, chờ điền phiên bản |
| **Chương 5. Xây dựng và triển khai** | `PRJ1_Bao-cao_Chuong-5_Xay-dung-trien-khai.md` | ⚠️ Mới có khung, cần sản phẩm |
| **Chương 6. Kiểm thử và đánh giá** | `PRJ1_Bao-cao_Chuong-6_Kiem-thu.md` | ✅ Chiến lược xong, chờ kết quả thật |
| **Chương 7. Kết luận** | `PRJ1_Bao-cao_Chuong-7_Ket-luan.md` | ⚠️ Mới có khung |
| **Tài liệu tham khảo** | Mục 1.5 | ✅ Đã chuẩn hoá — còn R1, R4 chờ bổ sung số hiệu |
| Phụ lục | Phụ lục A–E + ma trận truy vết | ✅ Có sẵn |
| Bảng phân công | Phụ lục C — **cần điền tên thật** | ⚠️ Đang để trống |

## 1b. Chương 1 và Chương 2 ráp thế nào — ✅ ĐÃ RÁP XONG NGÀY 23/08/2026

**Chương 1** = mục 1 của tài liệu phân tích, giữ nguyên số hiệu 1.1–1.6. Bảy bảng đã đánh số Bảng 1.1 → 1.7. Mục 1.6 **đã viết lại** để mô tả bảy chương của báo cáo thay vì chín mục của tài liệu phân tích.

**Chương 2** = mục 2, 3, 4, 5, **7 và 8** của tài liệu phân tích, ánh xạ như sau:

| Mục Chương 2 | Lấy từ mục | Nội dung |
|---|---|---|
| 2.1 | 2 | Xác định các bên liên quan |
| 2.2 | 3 | Thu thập yêu cầu |
| 2.3 | 4 | User story và tiêu chí chấp nhận |
| 2.4 | 5 | Đặc tả yêu cầu phần mềm |
| 2.5 | **7** | Xác minh yêu cầu |
| 2.6 | **8** | Quản lý yêu cầu |

> **Lỗi đã sửa của chính bản hướng dẫn này.** Bảng cấu trúc ở mục 1 trước đây ghi Chương 2 chỉ lấy "mục 2, 3, 4, 5", **bỏ sót mục 7 và mục 8**. Nếu để rơi, quyển báo cáo mất hẳn phần cho thấy nhóm *kiểm soát* yêu cầu chứ không chỉ liệt kê yêu cầu — và mục 3.10 của Chương 3 sẽ dẫn chiếu vào chỗ trống, vì nó viện dẫn đúng quy trình quản lý thay đổi ở mục 8.3.

Hai việc đã làm kèm theo:

- **43 bảng của Chương 2 đã đánh số** Bảng 2.1 → 2.43, theo quy ước: chỉ đánh số bảng liệt kê và bảng tổng hợp; **biểu mẫu** (thẻ user story, bộ câu hỏi phỏng vấn, mẫu phiếu thay đổi) không đánh số. Quy ước này được nêu ngay đầu Chương 2 và dùng chung với Chương 3.
- **Toàn bộ dẫn chiếu chéo đã cập nhật** sang số hiệu bảy chương, ở cả bảy tệp chương lẫn phụ lục lô phiếu thay đổi. Ví dụ "mục 5.4 của tài liệu phân tích" → "mục 2.4.4"; "mục 8.4" → "mục 2.6.4"; "mục 6.5" → "mục 3.5".

Kiểm tra toàn vẹn sau khi chuyển: 37 user story, 93 FR, 36 NFR, 23 BR, 4 persona, 10 epic — **không mất mã nào**.

## 2. Chương 3 ráp thế nào — ✅ ĐÃ RÁP XONG NGÀY 23/08/2026

> **Kết quả:** `PRJ1_Bao-cao_Chuong-3_Phan-tich-thiet-ke.md` — 627 dòng, 11 mục, **21 hình đánh số liên tục Hình 3.1 → Hình 3.21**, **8 bảng đánh số liên tục Bảng 3.1 → Bảng 3.8**. Toàn bộ đường dẫn ảnh đã kiểm chứng là tồn tại.
>
> Ảnh của các sơ đồ phiên bản 1 đã được **giải nén từ `PRJ1_So-do-nguon.zip` ra thư mục `Doc/diagrams/`** để liên kết ảnh trong Markdown hiển thị được. Trước đó chỉ có tệp nén, nên mọi liên kết `diagrams/*.png` trong tài liệu phân tích đều gãy.

Bảng dưới đây giữ lại làm bản ghi kế hoạch ban đầu. Đây là chương thay đổi nhiều nhất, vì mục 6 của tài liệu phân tích chỉ phủ được nửa đầu.

| Mục | Nội dung | Nguồn |
|---|---|---|
| 3.1 | Biểu đồ use case | Mục 6.1 — giữ nguyên |
| 3.2 | Đặc tả use case chi tiết | Mục 6.2 — giữ nguyên |
| 3.3 | Biểu đồ hoạt động | Mục 6.3 — giữ nguyên |
| 3.4 | Biểu đồ luồng dữ liệu | Mục 6.4 — giữ nguyên, **xem lưu ý bên dưới** |
| 3.5 | Biểu đồ thực thể quan hệ | **Thay bằng `07-erd-v2.png`** |
| 3.6 | Biểu đồ trạng thái | Mục 6.6 — giữ nguyên |
| **3.7** | **Sơ đồ lớp** | **Mới:** `10-class-domain.png`, `11-class-billing-calc.png` |
| **3.8** | **Sơ đồ tuần tự** | **Mới:** `12`, `13`, `14`, `15` |
| **3.9** | **Kiến trúc phần mềm** | **Mới:** `17-phan-ra-module.png` — xem lưu ý về sơ đồ 16 bên dưới |
| **3.10** | **Rà soát và hiệu chỉnh mô hình** | **Mới:** tóm tắt `PRJ1_Phieu-thay-doi_Lo-01.md` |

**Lưu ý về mục 3.4.** Tài liệu hiện dùng cả biểu đồ luồng dữ liệu (thuộc hướng cấu trúc) lẫn biểu đồ use case (thuộc hướng đối tượng). Việc này **hợp lệ**, nhưng phải có **một đoạn ngắn giải thích lý do**, nếu không rất dễ bị hỏi vặn "sao lại trộn hai phương pháp luận". Gợi ý cách trả lời: biểu đồ luồng dữ liệu dùng ở mức tổng quan để thấy dòng dữ liệu vào ra giữa hệ thống với các bên ngoài, còn use case và sơ đồ lớp dùng cho thiết kế chi tiết.

**Sai lệch so với kế hoạch, ở mục 3.9.** Kế hoạch ban đầu đưa cả hai sơ đồ `16-kien-truc-trien-khai` và `17-phan-ra-module` vào mục 3.9. Khi ráp, Chương 3 chỉ giữ sơ đồ 17 (phân rã module — kiến trúc **logic**, tức một quyết định thiết kế). Sơ đồ 16 (máy chủ, container, mạng, tường lửa — kiến trúc **vật lý**) **đã có sẵn ở mục 4.5 của Chương 4** từ trước. Bù lại, mục 3.9.3 nêu **hai ràng buộc mà kiến trúc triển khai áp ngược trở lại thiết kế phần mềm** — cơ sở dữ liệu không mở cổng ra ngoài, và ảnh không được phục vụ trực tiếp — kèm dẫn chiếu sang mục 4.5, để hai chương không nói ngược nhau.

**Ba hình bị trùng đã gỡ.** Rà lại toàn bộ bảy chương phát hiện cùng một ảnh xuất hiện ở hai chỗ:
>
> - `17-phan-ra-module.png` có ở cả mục 3.9.2 và mục 4.6 → **giữ ở Chương 3**, mục 4.6 đổi thành dẫn chiếu.
> - `15-seq-uc19-cong-nguoithue.png` có ở cả mục 3.8.4 và mục 6.3 → **giữ ở Chương 3**, mục 6.3 đổi thành dẫn chiếu.
>
> Đặt cùng một ảnh ở hai chương làm danh mục hình có hai số hiệu cho một hình, và người đọc không biết chỗ nào là chỗ chính.

**Về mục 3.10.** Đây là mục đáng đầu tư. Không chép cả 15 phiếu vào báo cáo — dài quá. Viết một đến hai trang gồm: mục đích đợt rà soát, phương pháp đối chiếu quy tắc với mô hình, bảng tổng hợp 15 vấn đề, phân tích sâu **ba phiếu tiêu biểu**, rồi dẫn chiếu phụ lục cho phần còn lại.

Đề xuất ba phiếu, mỗi phiếu minh hoạ một loại vấn đề khác nhau:

- **CR-001** — lỗi thiếu liên kết, hậu quả sập trọn một epic 9 yêu cầu
- **CR-008** — lỗi im lặng có hậu quả tiền bạc: hệ thống thu tiền lặp mỗi kỳ mà không báo lỗi
- **CR-015** — lỗi dữ kiện pháp lý, lộ ra hoàn toàn tình cờ khi nhóm đi tra số hiệu văn bản

✅ Đã viết theo đúng đề xuất này: mục 3.10 gồm sáu mục con — mục đích và phương pháp, bảng tổng hợp 15 phiếu (Bảng 3.8), ba mục phân tích sâu CR-001 / CR-008 / CR-015, và một mục nhận xét về phương pháp.

Riêng CR-015 nên nhấn **hai bài học**: trích dẫn đầy đủ số hiệu văn bản không chỉ là hình thức học thuật mà là cơ chế phát hiện dữ kiện lỗi thời; và quyết định lưu mỗi bậc giá một dòng thay vì một cột (CR-003) khiến việc đổi từ 6 bậc xuống 5 bậc **không phải sửa một dòng cấu trúc bảng nào** — ví dụ cụ thể cho thấy thiết kế tốt trả cổ tức về sau.

## 3. Danh sách lỗi cấp báo cáo — ĐÃ XỬ LÝ NGÀY 23/08/2026

> ✅ **Toàn bộ mục 3 đã được thực hiện.** Tài liệu phân tích yêu cầu đã lên **phiên bản 1.1**. Bản gốc lưu tại `PRJ1_Phan-tich-yeu-cau_Chung-cu-mini_v1.0-BACKUP.md`.
>
> Kiểm tra toàn vẹn sau khi sửa: 37 user story, 93 yêu cầu chức năng (48 Must / 33 Should / 12 Could), 36 yêu cầu phi chức năng, 23 quy tắc nghiệp vụ — **không mất mã nào**.
>
> Phần dưới đây giữ lại để ghi nhận đã sửa những gì và vì sao.

### 3.1. Tài liệu tham khảo chưa đủ chuẩn trích dẫn

Mục 1.5 hiện liệt kê R1–R7 theo kiểu ghi chú nội bộ, không phải danh mục tham khảo học thuật. Đây là chỗ **mất điểm rẻ nhất và dễ sửa nhất**.

Định dạng cần đạt:

- **Văn bản pháp luật:** `Cơ quan ban hành. (Năm). Tên đầy đủ văn bản. Số hiệu văn bản, ngày ban hành.`
- **Slide bài giảng:** `Tác giả. (Năm). Tên bài giảng. Tên môn học, Tên trường.`
- **Sách, giáo trình:** `Tác giả. (Năm). Tên sách (lần xuất bản). Nhà xuất bản.`
- **Trang web:** `Tên tổ chức. (Năm). Tên trang. Truy cập ngày dd/mm/yyyy, từ <địa chỉ>.`

> ✅ **Đã tra và đã sửa. Kết quả: tài liệu phiên bản 1.0 dùng biểu giá đã bị thay thế.**
>
> Nhóm đi tra số hiệu văn bản cho mục R2 thì phát hiện **cơ cấu biểu giá bán lẻ điện sinh hoạt đã đổi từ 6 bậc xuống 5 bậc** theo **Quyết định 14/2025/QĐ-TTg ngày 29/5/2025**. Biểu 6 bậc trong tài liệu phiên bản 1.0 không còn hiệu lực.
>
> Phát hiện thêm, ảnh hưởng tới thiết kế: quyết định này **không quy định đơn giá từng bậc bằng số tiền cố định, mà bằng tỷ lệ phần trăm của giá bán lẻ điện bình quân**. Đơn giá cụ thể quy đổi từ mức bình quân 2.204,0655 đ/kWh theo **Quyết định 1279/QĐ-BCT ngày 09/5/2025** của Bộ Công Thương.
>
> Việc này đã được lập thành **phiếu CR-015**, và các mục BR-02b, phát hiện D4, danh mục tài liệu tham khảo đều đã cập nhật. Bảng `BANG_GIA_BAC_THANG` bổ sung trường `ty_le`.
>
> ⚠️ **Vẫn còn hai việc nhóm phải tự làm trước khi nộp:**
> 1. **Kiểm tra lại mức giá bình quân còn hiệu lực không.** Giá được điều chỉnh theo chu kỳ; nếu đã có quyết định thay thế QĐ 1279/QĐ-BCT thì phải cập nhật cột đơn giá ở BR-02b.
> 2. **Bổ sung số hiệu cho R1 và R4** — slide bài giảng cần tên giảng viên và năm học; quy định định mức 4 người một hộ cần số hiệu văn bản.

### 3.2. BR-15 đặt sai vị trí — ✅ đã sửa

Đã chuyển BR-15 về đúng vị trí giữa BR-14 và BR-16. Kiểm tra lại: BR-01 → BR-02 → 02a → 02b → 02c → BR-03 … → BR-20, thứ tự liên tục, không còn chỗ nhảy cóc.

Nhân tiện đã bổ sung một lưu ý quan trọng cho người cài đặt: **"làm tròn đến 1.000 đồng theo quy tắc nửa lên" khác với "làm tròn lên đến 1.000 đồng"**. Ví dụ 1.887.200 đồng — nửa lên cho 1.887.000, làm tròn lên cho 1.888.000. Hệ quả: dòng chênh lệch có thể **mang dấu âm**, nên trường số tiền của dòng chi tiết không được đặt ràng buộc phải dương.

### 3.3. Số lượng quy tắc nghiệp vụ ghi lệch — ✅ đã sửa

Phụ lục E đã sửa từ 22 thành **23 BR**, khớp với số đếm thực tế.

### 3.4. Chương 1 thiếu đoạn bố cục quyển — ✅ đã sửa

Đã thêm **mục 1.6 — Bố cục tài liệu**, dạng bảng, mỗi mục kèm câu hỏi mà mục đó trả lời. Có thêm một đoạn phân biệt rõ mục 7 (xác minh *bản đặc tả*) với chương kiểm thử (kiểm tra *phần mềm*) — đây là chỗ hay bị hỏi vặn.

> ⚠️ **Khi hợp nhất thành quyển báo cáo hoàn chỉnh, mục 1.6 phải viết lại** để mô tả bảy chương thay vì chín mục như hiện nay.

### 3.5. Ràng buộc C-02 — ✅ đã sửa

Đã sửa theo phiếu CR-014, kèm ghi chú giải thích ba nhược điểm của gói miễn phí khiến nhóm đổi phương án. Bổ sung giả định **A-07** về việc duy trì máy chủ tới khi bảo vệ.

### 3.6. Phụ lục C còn để trống tên — ⚠️ CHƯA XỬ LÝ ĐƯỢC

Đây là việc duy nhất trong mục 3 mà tôi không làm thay được: **cần tên thật của bốn thành viên**. Phân công theo vai trò dọc đã đề xuất ở mục 8 của kế hoạch triển khai — bốn vai trò là nghiệp vụ và kiểm thử, giao diện, hạ tầng, tài liệu và truy vết. Bảng ở đầu tài liệu phân tích cũng còn để trống tên.

## 4. Thứ tự công việc đề xuất

| Thứ tự | Việc | Phụ thuộc |
|---|---|---|
| ~~1~~ | ~~Sửa 3.2, 3.3, 3.4, 3.5~~ ✅ **xong 23/08** | Không |
| ~~2~~ | ~~Tra và chuẩn hoá tài liệu tham khảo (3.1)~~ ✅ **xong 23/08, phát sinh CR-015** | Cần tra văn bản |
| 2b | Điền tên thật vào Phụ lục C (3.6) | **Cần nhóm quyết** |
| ~~3~~ | ~~Ráp Chương 3 theo mục 2 ở trên~~ ✅ **xong 23/08** | Sơ đồ đã có đủ |
| ~~4~~ | ~~Viết mục 3.10 rà soát mô hình~~ ✅ **xong 23/08** | Lô CR đã có |
| ~~4b~~ | ~~Ráp Chương 1 và Chương 2, đánh số bảng, sửa dẫn chiếu chéo~~ ✅ **xong 23/08** | Không |
| 5 | Điền phiên bản vào Chương 4 | Sau Vertical Slice 0 |
| 6 | Viết Chương 5 dần theo từng Vertical Slice | Theo tiến độ code |
| 7 | Điền kết quả Chương 6 | Sau khi chạy kiểm thử thật |
| 8 | Viết Chương 7 | Sau cùng |
| 9 | Hợp nhất, đánh số hình bảng, sinh mục lục | Sau cùng |

## 5. Về việc hợp nhất file

**Chỉ hợp nhất ở bước cuối.** Lý do: tài liệu phân tích đã gần 2.000 dòng, cộng thêm bốn chương mới sẽ thành một tệp rất khó sửa và dễ hỏng định dạng khi xuất sang Word.

Khi hợp nhất, ba việc phải làm cùng lúc:

1. **Đánh số lại toàn bộ hình và bảng theo chương.** **Chương 1, 2, 3 đã đánh số xong**: Chương 1 có 7 bảng, Chương 2 có 43 bảng, Chương 3 có 21 hình và 8 bảng, tất cả liên tục. Các chương 4, 5, 6, 7 vẫn chưa — chờ có nội dung thật.
2. **Lập danh mục hình và danh mục bảng** từ số đã đánh.
3. ~~**Rà lại mọi tham chiếu chéo.**~~ ✅ **Đã làm ngày 23/08.** Toàn bộ dẫn chiếu ở bảy tệp chương và phụ lục lô phiếu thay đổi đã chuyển sang số hiệu bảy chương. Khi viết thêm nội dung mới cho Chương 5, 6, 7 thì phải giữ đúng hệ số hiệu này, đừng dẫn theo số mục của tài liệu phân tích nữa.

Việc số 3 là việc dễ sót nhất. Nên rà bằng cách tìm kiếm các chuỗi `mục `, `Hình `, `Bảng `, `Chương ` trên toàn văn bản sau khi ráp xong.
