# CHƯƠNG 2. KHẢO SÁT VÀ PHÂN TÍCH YÊU CẦU

Chương 1 đã phát biểu bài toán và khoanh phạm vi. Chương này đi qua trọn vẹn **quy trình kỹ nghệ yêu cầu** để biến bài toán đó thành một bản đặc tả đủ chặt để đem đi thiết kế.

Sáu mục của chương ứng với sáu bước của quy trình, mỗi bước lấy đầu ra của bước trước làm đầu vào:

| Mục | Bước | Đầu vào | Đầu ra |
|---|---|---|---|
| 2.1 | Xác định các bên liên quan | Phát biểu bài toán | Danh sách bên liên quan, ma trận quyền lực, bốn chân dung người dùng |
| 2.2 | Thu thập yêu cầu | Danh sách bên liên quan | Các phát hiện từ phỏng vấn, khảo sát, quan sát, phân tích tài liệu |
| 2.3 | User story | Các phát hiện | 37 user story kèm tiêu chí chấp nhận, đã xếp ưu tiên |
| 2.4 | Đặc tả yêu cầu phần mềm | User story | 93 yêu cầu chức năng, 36 phi chức năng, 23 quy tắc nghiệp vụ |
| 2.5 | Xác minh yêu cầu | Bản đặc tả | Kết quả kiểm chất lượng, các mâu thuẫn phát hiện được, ma trận truy vết |
| 2.6 | Quản lý yêu cầu | Bản đặc tả đã xác minh | Baseline, quy trình xử lý thay đổi |

Mục **2.4** là phần dài nhất và cũng là phần được dùng nhiều nhất ở các chương sau: mọi mã `FR-`, `NFR-`, `BR-` xuất hiện trong Chương 3 và Chương 6 đều truy về mục này.

> **Hai quy ước trình bày của chương.**
>
> **Thứ nhất, về đánh số bảng.** Chương này dùng hai loại khung khác nhau. Loại thứ nhất là **bảng** đúng nghĩa — bảng liệt kê, bảng tổng hợp, bảng đối chiếu — và được đánh số Bảng 2.1 đến Bảng 2.43. Loại thứ hai là **biểu mẫu**: thẻ user story, bộ câu hỏi phỏng vấn, mẫu phiếu thay đổi. Chúng có hình thức giống bảng nhưng bản chất là một mẫu điền, nên không đánh số. Cùng quy ước này áp dụng cho đặc tả use case ở Chương 3.
>
> **Thứ hai, về nguồn dữ liệu khảo sát.** Trong khuôn khổ đồ án môn học, nhóm không tiếp cận được người dùng thật để phỏng vấn. Số liệu phỏng vấn và khảo sát ở mục 2.2 là **dữ liệu mô phỏng** do nhóm dựng dựa trên tài liệu và quan sát gián tiếp. Điều này được ghi rõ ngay tại chỗ, ở đầu mục 2.2 và mục 2.2.6, để không ai đọc nhầm thành số liệu thực địa. Phần **phương pháp** — kịch bản phỏng vấn, thiết kế bảng hỏi, phiếu quan sát — thì được xây dựng nghiêm túc và dùng lại được nguyên vẹn nếu có cơ hội khảo sát thật.

---

## 2.1. Xác định các bên liên quan


### 2.1.1. Danh sách các bên liên quan

Nhóm phân loại stakeholder theo ba lớp: **lớp trong** (trực tiếp thao tác trên hệ thống), **lớp ngoài** (bị ảnh hưởng nhưng không dùng trực tiếp), và **lớp ràng buộc** (đặt ra luật lệ mà hệ thống phải tuân theo).

#### 2.1.1.1. Lớp trong — người dùng trực tiếp

**Bảng 2.1 — Các bên liên quan lớp trong — người dùng trực tiếp**

| Mã | Bên liên quan | Mô tả | Là actor của hệ thống? |
|---|---|---|---|
| SH-01 | **Chủ sở hữu (Owner)** | Người đầu tư và sở hữu một hoặc nhiều toà chung cư mini. Quan tâm dòng tiền, công nợ, hiệu quả từng toà | Có |
| SH-02 | **Quản lý toà nhà (Manager)** | Người được chủ thuê để trông coi vận hành hằng ngày một hoặc vài toà: ghi số, thu tiền, xử lý sự cố. Có thể chính là chủ ở toà nhỏ | Có |
| SH-03 | **Người thuê (Tenant)** | Người đứng tên hợp đồng thuê phòng. Quan tâm tiền phải trả có đúng không, sự cố có được sửa không | Có |
| SH-04 | **Người ở cùng (Co-resident)** | Người sống chung phòng nhưng không đứng tên hợp đồng. Có thể được cấp quyền xem hạn chế | Có (quyền hạn chế) |
| SH-05 | **Nhân viên kỹ thuật / thợ sửa chữa (Technician)** | Người tiếp nhận và xử lý yêu cầu sửa chữa, có thể là thợ thuê ngoài | Có |
| SH-06 | **Quản trị hệ thống (System Admin)** | Thành viên nhóm phát triển hoặc người được uỷ quyền, quản lý tài khoản và cấu hình hệ thống | Có |

#### 2.1.1.2. Lớp ngoài — bị ảnh hưởng, không thao tác trực tiếp

**Bảng 2.2 — Các bên liên quan lớp ngoài — bị ảnh hưởng nhưng không thao tác**

| Mã | Bên liên quan | Mối quan tâm | Ảnh hưởng đến yêu cầu |
|---|---|---|---|
| SH-07 | Người đi tìm phòng | Muốn biết còn phòng trống, giá bao nhiêu | Yêu cầu trang công khai danh sách phòng trống (mức ưu tiên thấp) |
| SH-08 | Công ty điện lực, cấp nước | Là bên phát hành hoá đơn tổng cho cả toà | Hệ thống cần đối chiếu tổng tiêu thụ từng phòng với hoá đơn tổng để phát hiện thất thoát |
| SH-09 | Ngân hàng | Là nơi nhận tiền chuyển khoản | Cần chuẩn hoá nội dung chuyển khoản và hỗ trợ nhập/đọc sao kê để đối soát |
| SH-10 | Nhà cung cấp dịch vụ internet, thu gom rác | Cung cấp dịch vụ tính vào hoá đơn | Cần lưu thông tin nhà cung cấp và chu kỳ thanh toán |
| SH-11 | Hàng xóm, tổ dân phố | Quan tâm an ninh trật tự | Ảnh hưởng gián tiếp: nhu cầu quản lý khách ra vào, khách ở lại qua đêm |

#### 2.1.1.3. Lớp ràng buộc — đặt ra quy định

**Bảng 2.3 — Các bên liên quan lớp ràng buộc — đặt ra quy định**

| Mã | Bên liên quan | Quy định áp đặt lên hệ thống |
|---|---|---|
| SH-12 | Cơ quan Công an (quản lý cư trú) | Chủ nhà phải nắm và khai báo thông tin lưu trú của người thuê → hệ thống phải lưu hồ sơ nhân thân và xuất được danh sách cư trú |
| SH-13 | Cơ quan Cảnh sát PCCC | Cơ sở cho thuê trọ phải có hồ sơ PCCC, tự kiểm tra định kỳ và báo cáo hằng năm → hệ thống cần phân hệ nhắc và lưu biên bản kiểm tra |
| SH-14 | Cơ quan quản lý giá điện | Chủ nhà không được thu tiền điện cao hơn giá quy định; phải áp định mức theo số người thuê → hệ thống phải hỗ trợ cả hai chế độ tính giá và lưu vết đơn giá đã áp dụng |
| SH-15 | Giảng viên hướng dẫn | Là "khách hàng" nghiệm thu sản phẩm học tập → tài liệu phải bám đúng cấu trúc quy trình phân tích yêu cầu |

### 2.1.2. Ma trận Quyền lực – Quan tâm (Power/Interest Grid)

**Bảng 2.4 — Ma trận Quyền lực – Quan tâm**

| | **Quan tâm thấp** | **Quan tâm cao** |
|---|---|---|
| **Quyền lực cao** | Cơ quan quản lý giá điện (SH-14), Cảnh sát PCCC (SH-13), Công an cư trú (SH-12) — *Giữ hài lòng: tuân thủ quy định, không cần lấy ý kiến thường xuyên* | **Chủ sở hữu (SH-01)**, **Quản lý toà nhà (SH-02)**, Giảng viên (SH-15) — *Quản lý sát sao: phỏng vấn sâu, review từng bản nháp* |
| **Quyền lực thấp** | Hàng xóm (SH-11), Nhà cung cấp dịch vụ (SH-10) — *Theo dõi tối thiểu* | **Người thuê (SH-03)**, Người ở cùng (SH-04), Nhân viên kỹ thuật (SH-05), Người tìm phòng (SH-07) — *Giữ thông tin đầy đủ: khảo sát bằng bảng hỏi diện rộng* |

**Kết luận từ ma trận:** hai nhóm SH-01 và SH-02 là nguồn yêu cầu chính, cần **phỏng vấn sâu**. Nhóm SH-03 đông đảo nhưng quyền quyết định thấp, phù hợp thu thập bằng **bảng hỏi**. Các cơ quan quản lý không phỏng vấn được, thu thập bằng **phân tích tài liệu pháp quy**.

### 2.1.3. Chân dung người dùng (Persona)

#### Persona 1 — Anh Minh, 45 tuổi, Chủ sở hữu

> *"Tôi có 3 toà, tổng 78 phòng. Cuối tháng nào tôi cũng phải ngồi ghép 3 file Excel để biết tháng này thu được bao nhiêu, ai còn nợ. Nhiều lúc đến giữa tháng sau mới phát hiện có phòng chưa đóng tiền."*

- **Bối cảnh:** không sống tại toà nhà, thuê 2 người quản lý trông coi. Đi lại nhiều, chủ yếu dùng điện thoại.
- **Kỹ năng công nghệ:** trung bình. Dùng thành thạo Zalo, Excel cơ bản, ngân hàng số.
- **Mục tiêu:** nhìn thấy tổng doanh thu và công nợ mọi lúc; biết quản lý có thu đủ tiền không; phát hiện thất thoát điện nước.
- **Nỗi đau:** số liệu rời rạc; không kiểm soát được người quản lý; không biết phòng nào sắp hết hợp đồng để tìm khách mới.
- **Kỳ vọng ở hệ thống:** một màn hình tổng quan duy nhất cho cả 3 toà, xem tốt trên điện thoại.

#### Persona 2 — Chị Lan, 38 tuổi, Quản lý toà nhà

> *"Ngày 28 hằng tháng tôi đi từng tầng ghi số công tơ, chụp lại rồi tối về nhập Excel. Nhập 30 phòng mất cả buổi tối, có hôm nhầm số phòng 302 với 305, người ta cãi nhau cả tuần."*

- **Bối cảnh:** sống tại tầng 1 toà nhà, làm việc chủ yếu trên điện thoại, thỉnh thoảng dùng laptop cũ.
- **Kỹ năng công nghệ:** cơ bản. Ngại ứng dụng nhiều bước, sợ bấm nhầm làm mất dữ liệu.
- **Mục tiêu:** ghi số nhanh ngay tại chỗ; hoá đơn tự tính ra; gửi hàng loạt cho người thuê; biết ai đã trả tiền.
- **Nỗi đau:** nhập liệu hai lần; soạn tin nhắn thủ công cho từng phòng; bị hỏi đi hỏi lại "tháng này bao nhiêu tiền".
- **Kỳ vọng ở hệ thống:** giao diện ghi số theo danh sách phòng, nút bấm to, có cảnh báo khi số nhập bất thường.

#### Persona 3 — Bạn Hùng, 21 tuổi, Người thuê (sinh viên)

> *"Tháng trước tiền điện tự nhiên gấp rưỡi, tôi hỏi thì chị quản lý bảo 'công tơ nó thế'. Tôi cũng không biết đường nào mà kiểm tra."*

- **Bối cảnh:** ở ghép 2 người, ngân sách hạn chế, dùng điện thoại là chính.
- **Kỹ năng công nghệ:** thành thạo. Quen dùng app, ngại cài thêm ứng dụng chỉ để xem tiền phòng.
- **Mục tiêu:** biết tháng này phải trả bao nhiêu và vì sao; chuyển khoản nhanh gọn; báo hỏng vòi nước mà không phải gọi điện.
- **Nỗi đau:** không minh bạch chỉ số; không có biên lai; báo hỏng xong bị quên.
- **Kỳ vọng ở hệ thống:** vào bằng link, xem được ảnh công tơ, có mã QR chuyển khoản, báo sự cố kèm ảnh.

#### Persona 4 — Chú Tuấn, 52 tuổi, Thợ sửa chữa

- **Bối cảnh:** thợ điện nước tự do, nhận việc từ 4–5 toà nhà khác nhau.
- **Mục tiêu:** biết việc cần làm ở đâu, phòng nào, lỗi gì, có ảnh không, liên hệ ai.
- **Kỳ vọng ở hệ thống:** danh sách việc được giao, bấm nhận việc và báo hoàn thành kèm chi phí; không cần chức năng gì phức tạp hơn.

## 2.2. Thu thập yêu cầu


### 2.2.1. Kế hoạch thu thập

**Bảng 2.5 — Kế hoạch thu thập yêu cầu**

| Phương pháp | Đối tượng | Số lượng dự kiến | Mục tiêu cần đạt | Kết quả đầu ra |
|---|---|---|---|---|
| Phỏng vấn sâu | Chủ sở hữu (SH-01) | 2 người | Hiểu mô hình kinh doanh, nhu cầu báo cáo, cách quản lý nhiều toà | Biên bản phỏng vấn |
| Phỏng vấn sâu | Quản lý toà nhà (SH-02) | 3 người | Nắm quy trình vận hành thực tế theo ngày/tháng, nút thắt | Biên bản + sơ đồ quy trình hiện tại |
| Phỏng vấn ngắn | Thợ sửa chữa (SH-05) | 1 người | Hiểu luồng xử lý sự cố | Ghi chú |
| Bảng hỏi | Người thuê (SH-03, SH-04) | 60–100 phiếu | Đo mức độ quan trọng của từng tính năng, thói quen thanh toán | Bảng thống kê kết quả |
| Quan sát trực tiếp | Buổi chốt số cuối tháng | 1 buổi × 2 toà | Đo thời gian thực tế từng bước, phát hiện thao tác thừa | Bảng đo thời gian |
| Phân tích tài liệu | Hợp đồng mẫu, sổ ghi số, file Excel, quy định pháp luật | 8 tài liệu | Rút ra trường dữ liệu và quy tắc nghiệp vụ | Từ điển dữ liệu sơ bộ, danh sách BR |
| Đối sánh sản phẩm | 3 phần mềm quản lý nhà trọ đang có trên thị trường | 3 sản phẩm | Tránh bỏ sót chức năng, xác định điểm khác biệt | Bảng so sánh tính năng |

> **Ghi chú về nguồn dữ liệu:** Trong khuôn khổ đồ án, nhóm **không tiếp cận được người dùng thật để phỏng vấn**. Toàn bộ dữ liệu tại mục 2.2.6 là **kịch bản giả định do nhóm xây dựng** dựa trên: (a) quan sát thực tế mô hình nhà trọ tại khu vực quanh trường, (b) phân tích tài liệu pháp quy và mẫu biểu có thật, (c) đối sánh các phần mềm cùng loại đang bán trên thị trường. Các con số thống kê ở mục 2.2.6.3 là **số liệu mô phỏng**, được đánh dấu rõ và **không dùng làm căn cứ định lượng chính thức**. Bộ câu hỏi ở mục 2.2.2 và 3.3 được thiết kế ở dạng sẵn sàng sử dụng, để nhóm có thể triển khai thu thập dữ liệu thật khi có điều kiện.

### 2.2.2. Kịch bản phỏng vấn

#### 2.2.2.1. Nguyên tắc thực hiện

- **Chuẩn bị:** gửi trước nội dung và thời lượng dự kiến (30–45 phút); xin phép ghi âm.
- **Không khí:** trò chuyện tự nhiên, bắt đầu bằng câu hỏi mở về công việc hằng ngày, tránh hỏi dồn như hỏi cung.
- **Lắng nghe chủ động:** khi người trả lời nói "cũng bình thường thôi", hỏi tiếp "anh/chị mô tả giúp em một ngày cụ thể gần nhất được không?" để lấy dữ kiện thay vì cảm nhận.
- **Tránh câu hỏi gợi ý:** hỏi "Anh đang tính tiền điện thế nào?" thay vì "Anh có thấy tính tiền điện bằng Excel là bất tiện không?".
- **Kết thúc:** tóm tắt lại 3–5 ý chính đã hiểu để người trả lời xác nhận; hỏi "còn điều gì em chưa hỏi mà anh/chị thấy quan trọng không?".
- **Sau phỏng vấn:** hoàn thiện biên bản trong vòng 24 giờ theo mẫu ở Phụ lục A, gửi lại cho người được phỏng vấn xác nhận.

#### 2.2.2.2. Bộ câu hỏi cho Chủ sở hữu (SH-01)

**Nhóm A — Bối cảnh và mô hình kinh doanh**

1. Anh/chị đang sở hữu bao nhiêu toà, mỗi toà bao nhiêu phòng, ở khu vực nào?
2. Đối tượng thuê chủ yếu là ai (sinh viên, công nhân, gia đình trẻ, người đi làm)?
3. Anh/chị trực tiếp vận hành hay thuê người quản lý? Phân chia công việc thế nào?
4. Doanh thu và chi phí hằng tháng của một toà gồm những khoản gì?

**Nhóm B — Quy trình hiện tại**

5. Mô tả giúp em toàn bộ quy trình từ lúc có khách hỏi thuê đến lúc họ dọn vào ở.
6. Từ lúc chốt số công tơ đến lúc thu đủ tiền của cả toà thường mất bao nhiêu ngày?
7. Anh/chị đang dùng công cụ gì để quản lý (sổ, Excel, Zalo, phần mềm)? Cái gì được, cái gì chưa được?
8. Khi người thuê chậm đóng tiền thì xử lý ra sao? Có quy định phạt không?

**Nhóm C — Vấn đề và nhu cầu**

9. Ba việc tốn thời gian nhất của anh/chị trong một tháng là gì?
10. Có lần nào tính sai tiền hoặc thất thoát tiền không? Nguyên nhân do đâu?
11. Anh/chị làm sao để biết một toà đang lãi hay lỗ?
12. Có bao giờ tổng tiền điện thu của các phòng thấp hơn hoá đơn điện lực gửi về không? Khi đó xử lý thế nào?

**Nhóm D — Báo cáo và ra quyết định**

13. Anh/chị cần xem những con số nào, vào lúc nào, để ra quyết định?
14. Nếu chỉ được xem đúng một màn hình mỗi sáng, anh/chị muốn nó hiển thị gì?
15. Anh/chị có muốn giới hạn quyền của người quản lý không (ví dụ không cho sửa hoá đơn đã phát hành)?

**Nhóm E — Yêu cầu phi chức năng**

16. Anh/chị dùng máy tính hay điện thoại nhiều hơn khi làm việc này?
17. Dữ liệu người thuê (ảnh CCCD, hợp đồng) anh/chị lo ngại điều gì về bảo mật?
18. Nếu hệ thống hỏng mất một ngày thì hậu quả với anh/chị thế nào?
19. Anh/chị sẵn sàng trả bao nhiêu một tháng cho một phần mềm như vậy? (dùng để đánh giá tính khả thi kinh tế)

#### 2.2.2.3. Bộ câu hỏi cho Quản lý toà nhà (SH-02)

**Nhóm A — Công việc hằng ngày**

1. Một ngày làm việc điển hình của anh/chị gồm những việc gì, theo thứ tự nào?
2. Ngày bận nhất trong tháng là ngày nào, vì sao?

**Nhóm B — Ghi chỉ số và tính tiền** *(trọng tâm)*

3. Anh/chị ghi chỉ số điện nước vào ngày nào, ghi bằng gì, mất bao lâu cho cả toà?
4. Sau khi ghi xong thì làm gì tiếp theo? Nhập vào đâu?
5. Công thức tính tiền điện, tiền nước ở đây cụ thể như thế nào? Đơn giá bao nhiêu?
6. Ngoài tiền phòng, điện, nước còn thu những khoản nào nữa? Khoản nào cố định, khoản nào thay đổi?
7. Nếu có người dọn vào hoặc dọn đi giữa tháng thì tính tiền phòng và tiền dịch vụ ra sao?
8. Có trường hợp nào công tơ hỏng, thay công tơ mới, hoặc số bị nhảy bất thường không? Khi đó xử lý thế nào?
9. Anh/chị có kiểm tra lại chỉ số trước khi gửi hoá đơn không? Đã bao giờ gửi nhầm chưa?

**Nhóm C — Thu tiền và công nợ**

10. Người thuê trả tiền bằng cách nào (mặt / chuyển khoản)? Tỷ lệ khoảng bao nhiêu?
11. Với chuyển khoản, anh/chị đối chiếu thế nào để biết ai đã trả?
12. Có cho trả góp/trả một phần không? Ghi nhận ở đâu?
13. Anh/chị nhắc người chưa đóng tiền bằng cách nào, nhắc mấy lần?

**Nhóm D — Hợp đồng và người thuê**

14. Khi có khách mới, anh/chị làm những thủ tục gì? Cần giấy tờ nào?
15. Hợp đồng thường ký bao lâu? Có tự động gia hạn không?
16. Tiền cọc bao nhiêu, khi trả phòng thì trừ những gì?
17. Anh/chị quản lý danh sách người ở cùng và xe cộ như thế nào?
18. Việc khai báo tạm trú cho người thuê hiện làm ra sao?

**Nhóm E — Sự cố và bảo trì**

19. Người thuê báo hỏng hóc bằng cách nào? Trung bình một tháng bao nhiêu vụ?
20. Từ lúc báo đến lúc sửa xong thường mất bao lâu? Ai chịu chi phí?
21. Anh/chị có ghi lại lịch sử sửa chữa của từng phòng không?

**Nhóm F — Kỳ vọng với phần mềm**

22. Nếu có phần mềm, anh/chị muốn nó làm giúp việc gì đầu tiên?
23. Anh/chị lo ngại gì khi chuyển từ sổ/Excel sang phần mềm?
24. Anh/chị thao tác trên điện thoại hay máy tính? Mạng ở toà nhà có ổn định không?

#### 2.2.2.4. Bộ câu hỏi cho Người thuê (SH-03) — phỏng vấn ngắn 15 phút

1. Bạn đang thuê phòng ở đây bao lâu rồi? Ở một mình hay ở ghép?
2. Hằng tháng bạn nhận thông tin tiền phòng bằng cách nào? Vào ngày nào?
3. Bạn có kiểm tra lại các khoản trong đó không? Bằng cách nào?
4. Đã bao giờ bạn thắc mắc về hoá đơn chưa? Chuyện đó được giải quyết thế nào?
5. Bạn trả tiền bằng hình thức nào? Có nhận được biên lai không?
6. Khi phòng hỏng hóc bạn báo cho ai, bằng cách nào? Kết quả ra sao?
7. Nếu có một trang web để bạn tự xem hoá đơn và chỉ số điện nước, bạn có dùng không? Bạn muốn xem thêm gì?
8. Bạn có ngại đăng nhập bằng tài khoản riêng, hay muốn xem qua link gửi Zalo là được?
9. Thông tin cá nhân nào bạn không muốn hiển thị trên hệ thống?

#### 2.2.2.5. Bộ câu hỏi cho Thợ sửa chữa (SH-05)

1. Anh nhận thông tin công việc từ ai, qua kênh nào?
2. Thông tin anh cần biết trước khi đến là gì?
3. Anh báo lại kết quả và chi phí như thế nào?
4. Anh có cần xem lại lịch sử đã sửa gì ở phòng đó không?

### 2.2.3. Bảng hỏi khảo sát người thuê (Questionnaire)

**Mục tiêu khảo sát:** đo mức độ quan trọng của từng nhóm tính năng đối với người thuê, xác định thói quen thanh toán và mức độ sẵn sàng dùng cổng người thuê — làm căn cứ xếp ưu tiên MoSCoW.
**Đối tượng:** người đang thuê phòng trọ/chung cư mini, độ tuổi 18–40.
**Hình thức:** Google Form, 12 câu, thời gian trả lời ~4 phút. Phát qua nhóm Zalo cư dân và các hội nhóm tìm phòng trọ.
**Cỡ mẫu mục tiêu:** tối thiểu 60 phiếu hợp lệ.

---

**Phần giới thiệu**
> Chào bạn, nhóm mình là sinh viên đang thực hiện đồ án xây dựng phần mềm quản lý nhà trọ / chung cư mini. Khảo sát này giúp nhóm hiểu nhu cầu thực tế của người thuê phòng. Bạn chỉ mất khoảng 4 phút, và mọi câu trả lời đều **ẩn danh**, chỉ dùng cho mục đích học tập. Cảm ơn bạn rất nhiều!

**Phần I — Câu hỏi sàng lọc**

**Câu 1.** Hiện tại bạn có đang thuê phòng trọ / chung cư mini không?

- [ ] Có, đang thuê → *tiếp tục*
- [ ] Đã từng thuê trong 12 tháng qua → *tiếp tục*
- [ ] Chưa bao giờ thuê → *kết thúc khảo sát*

**Câu 2.** Bạn thuộc nhóm nào? *(một lựa chọn)*

- [ ] Sinh viên  [ ] Người đi làm  [ ] Công nhân  [ ] Gia đình trẻ  [ ] Khác: ..........

**Phần II — Hiện trạng nhận hoá đơn và thanh toán**

**Câu 3.** Hằng tháng bạn nhận thông tin tiền phòng bằng cách nào? *(chọn nhiều)*

- [ ] Chủ nhà nhắn tin Zalo/Messenger
- [ ] Giấy dán ở cửa hoặc bảng tin
- [ ] Chủ nhà gọi điện hoặc nói trực tiếp
- [ ] Ảnh chụp bảng tính viết tay
- [ ] Phần mềm/ứng dụng
- [ ] Khác: ..........

**Câu 4.** Hoá đơn bạn nhận có ghi rõ chỉ số công tơ điện đầu kỳ và cuối kỳ không?

- [ ] Có, ghi đầy đủ  [ ] Chỉ ghi số điện tiêu thụ, không ghi chỉ số  [ ] Chỉ ghi tổng tiền  [ ] Không nhớ

**Câu 5.** Bạn đã bao giờ thắc mắc hoặc nghi ngờ về số tiền trong hoá đơn chưa?

- [ ] Thường xuyên  [ ] Vài lần  [ ] Một lần  [ ] Chưa bao giờ

**Câu 6.** Bạn thường thanh toán bằng hình thức nào? *(một lựa chọn)*

- [ ] Chuyển khoản ngân hàng  [ ] Ví điện tử (MoMo, ZaloPay…)  [ ] Tiền mặt  [ ] Tuỳ tháng

**Câu 7.** Sau khi trả tiền, bạn có nhận được biên lai/xác nhận không?

- [ ] Luôn có  [ ] Thỉnh thoảng  [ ] Không bao giờ  [ ] Tôi không quan tâm

**Phần III — Nhu cầu về chức năng**

**Câu 8.** Nếu có một trang web dành riêng cho người thuê, mức độ quan trọng của từng tính năng với bạn là bao nhiêu? *(thang 1 = không cần thiết → 5 = rất cần thiết)*

**Bảng 2.6 — Mẫu câu hỏi thang đo mức quan trọng của các tính năng cổng người thuê**

| Tính năng | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Xem hoá đơn tháng hiện tại và các tháng trước | [  ] | [  ] | [  ] | [  ] | [  ] |
| Xem chỉ số điện – nước kèm ảnh chụp công tơ | [  ] | [  ] | [  ] | [  ] | [  ] |
| Xem biểu đồ tiêu thụ điện nước các tháng để tự so sánh | [  ] | [  ] | [  ] | [  ] | [  ] |
| Mã QR chuyển khoản có sẵn nội dung, không phải gõ tay | [  ] | [  ] | [  ] | [  ] | [  ] |
| Nhận thông báo khi có hoá đơn mới / sắp đến hạn | [  ] | [  ] | [  ] | [  ] | [  ] |
| Báo sự cố hỏng hóc kèm ảnh và theo dõi tiến độ sửa | [  ] | [  ] | [  ] | [  ] | [  ] |
| Xem hợp đồng và ngày hết hạn của mình | [  ] | [  ] | [  ] | [  ] | [  ] |
| Xem thông báo chung của toà nhà (cắt nước, nội quy) | [  ] | [  ] | [  ] | [  ] | [  ] |
| Đăng ký xe, đăng ký người ở cùng | [  ] | [  ] | [  ] | [  ] | [  ] |
| Gửi yêu cầu trả phòng / gia hạn hợp đồng trực tuyến | [  ] | [  ] | [  ] | [  ] | [  ] |

**Câu 9.** Trong các tính năng trên, hãy chọn **3 tính năng quan trọng nhất** với bạn:

- [ ] .......... [ ] .......... [ ] ..........

**Câu 10.** Bạn muốn truy cập bằng cách nào? *(một lựa chọn)*

- [ ] Đăng nhập bằng số điện thoại + mật khẩu
- [ ] Bấm vào link chủ nhà gửi Zalo, không cần đăng nhập
- [ ] Cài một ứng dụng riêng trên điện thoại
- [ ] Cách nào cũng được

**Phần IV — Sự cố và thông tin cá nhân**

**Câu 11.** Trong 6 tháng qua, phòng bạn có sự cố cần sửa chữa không? Nếu có, sau bao lâu thì được xử lý?

- [ ] Không có sự cố nào
- [ ] Có, xử lý trong ngày
- [ ] Có, xử lý sau 2–3 ngày
- [ ] Có, sau hơn 1 tuần
- [ ] Có, nhưng đến giờ vẫn chưa được sửa

**Câu 12.** Bạn có lo ngại gì khi thông tin cá nhân (ảnh CCCD, số điện thoại) được lưu trên phần mềm của chủ nhà? *(câu hỏi mở)*
> ..................................................................................

**Phần kết thúc**
> Cảm ơn bạn đã dành thời gian! Nếu bạn muốn dùng thử sản phẩm khi hoàn thành, để lại email (không bắt buộc): ..........

### 2.2.4. Quan sát trực tiếp (Observation) — Phiếu ghi nhận

Nhóm dự kiến quan sát một buổi chốt số cuối tháng, ghi nhận theo mẫu:

**Bảng 2.7 — Mẫu phiếu ghi nhận quan sát buổi chốt số cuối tháng**

| Bước công việc | Người thực hiện | Công cụ đang dùng | Thời gian đo được | Lỗi/thao tác thừa quan sát được |
|---|---|---|---|---|
| Đi ghi chỉ số từng phòng | Quản lý | Sổ tay + điện thoại | ...... phút | Ví dụ: phải quay lại tầng 2 vì bỏ sót phòng 205 |
| Nhập số vào Excel | Quản lý | Laptop | ...... phút | Nhập lại toàn bộ từ sổ — dữ liệu bị nhập 2 lần |
| Tính tiền từng phòng | Quản lý | Excel | ...... phút | Công thức phải sửa tay cho phòng mới vào ở |
| Soạn và gửi tin nhắn | Quản lý | Zalo | ...... phút | Copy–paste từng phòng, dễ gửi nhầm |
| Nhận và đối chiếu chuyển khoản | Quản lý | App ngân hàng | ...... phút | Nội dung chuyển khoản không thống nhất, phải đoán |
| **Tổng thời gian một kỳ** | | | **...... phút** | |

### 2.2.5. Phân tích tài liệu (Document Analysis)

#### 2.2.5.1. Tài liệu nghiệp vụ và pháp quy

**Bảng 2.8 — Tài liệu nghiệp vụ và pháp quy đã phân tích**

| # | Tài liệu | Thông tin rút ra | Ảnh hưởng đến yêu cầu |
|---|---|---|---|
| D1 | **Hợp đồng thuê phòng mẫu** | Các trường: bên cho thuê, bên thuê, địa chỉ phòng, diện tích, giá thuê, tiền cọc, thời hạn, ngày thanh toán, đơn giá điện/nước, các khoản phí khác, điều khoản chấm dứt | Xác định thuộc tính thực thể `HopDong`; sinh FR về tạo/gia hạn/thanh lý hợp đồng |
| D2 | **Sổ ghi chỉ số công tơ viết tay** | Mỗi dòng: ngày ghi, số phòng, chỉ số điện, chỉ số nước, người ghi | Xác định thực thể `ChiSoDichVu`; sinh yêu cầu lưu ảnh công tơ để đối chứng |
| D3 | **File Excel tính tiền của chủ trọ** | Công thức: `Tổng = Tiền phòng + (Điện mới - Điện cũ)×Đơn giá điện + (Nước mới - Nước cũ)×Đơn giá nước + Rác + Internet + Gửi xe` | Cơ sở cho BR-02 → BR-06 và thuật toán tính hoá đơn |
| D4 | **Cơ cấu biểu giá bán lẻ điện sinh hoạt 5 bậc** (Quyết định 14/2025/QĐ-TTg, ngày 29/5/2025) | Mỗi bậc quy định bằng **tỷ lệ phần trăm của giá bán lẻ điện bình quân**: Bậc 1 (0–100 kWh) 90 %; Bậc 2 (101–200) 108 %; Bậc 3 (201–400) 136 %; Bậc 4 (401–700) 162 %; Bậc 5 (từ 701) 180 %. Quy đổi theo giá bình quân 2.204,0655 đ/kWh (QĐ 1279/QĐ-BCT) được: 1.984 / 2.380 / 2.998 / 3.571 / 3.967 đ *(chưa gồm VAT)* | Sinh BR-02b: hệ thống phải hỗ trợ chế độ tính bậc thang, biểu giá phải **cấu hình được theo thời điểm hiệu lực**. Việc bậc giá được quy định theo tỷ lệ chứ không theo số tiền cố định là phát hiện quan trọng — nó quyết định cách thiết kế bảng giá |
| D5 | **Quy định giá điện cho người thuê nhà** | Áp định mức theo nguyên tắc **4 người tính là 1 hộ**; nếu không xác định được số người thực tế thì áp giá bậc 3 cho toàn bộ sản lượng. Thu sai giá có thể bị xử phạt | Sinh BR-02c và yêu cầu lưu số người ở thực tế của từng phòng theo từng kỳ |
| D6 | **Luật PCCC & CNCH 2024, Nghị định 105/2025/NĐ-CP** | Cơ sở cho thuê trọ phải: có hồ sơ quản lý PCCC, phương án thoát nạn, trang bị bình chữa cháy và báo cháy, lối thoát nạn thông thoáng, **tự kiểm tra và báo cáo định kỳ hằng năm**; công trình từ 7 tầng hoặc trên 5.000 m³ phải thẩm duyệt thiết kế | Sinh nhóm FR về quản lý hồ sơ và lịch kiểm tra an toàn PCCC, nhắc việc theo chu kỳ |
| D7 | **Luật Cư trú 2020 và quy định thông báo lưu trú** | Chủ nhà/người quản lý cơ sở cho thuê phải nắm thông tin và thông báo lưu trú cho người đến ở; người thuê từ 30 ngày trở lên cần đăng ký tạm trú | Sinh FR lưu hồ sơ nhân thân người thuê + người ở cùng, xuất danh sách cư trú theo mẫu, nhắc hạn tạm trú |
| D8 | **Hoá đơn tiền điện tổng của cả toà từ điện lực** | Tổng sản lượng và tổng tiền của cả công tơ tổng | Sinh FR đối chiếu tổng tiêu thụ các phòng với công tơ tổng để phát hiện thất thoát/rò rỉ |

#### 2.2.5.2. Đối sánh sản phẩm cùng loại

**Phạm vi và phương pháp.** Thị trường phần mềm quản lý nhà trọ tại Việt Nam khá đông: qua các bài tổng hợp và tra cứu trực tiếp, nhóm ghi nhận trên **mười lăm sản phẩm** đang hoạt động, gồm AppNhà, eNha, Mona House, TrọCare, Trọ Mới Pro, Simple House, Landsoft, LaLaHome, DigiStay, Smartos, iTro, Lozido, NhaTro24h, Khutro, SmartMotel.

Nhóm chọn **bốn sản phẩm** để đối sánh chi tiết, theo tiêu chí: có trang giới thiệu tính năng công khai đủ chi tiết để đối chiếu, và mỗi sản phẩm đại diện một hướng tiếp cận khác nhau.

> ⚠️ **Giới hạn của đợt đối sánh này — cần đọc trước khi dùng bảng dưới.** Nguồn dữ liệu là **trang giới thiệu công khai của nhà cung cấp**, không phải dùng thử thực tế. Vì vậy bảng chỉ ghi **"Có"** khi nhà cung cấp nêu rõ tính năng, và ghi **"Không rõ"** khi trang giới thiệu không đề cập. **Nhóm không ghi "Không" cho bất kỳ ô nào** — không tìm thấy thông tin quảng bá về một tính năng không đồng nghĩa với việc sản phẩm thiếu tính năng đó. Muốn kết luận chắc chắn thì phải đăng ký dùng thử; xem đề xuất ở cuối mục.

**Bảng 2.9 — Đối sánh bốn sản phẩm cùng loại trên thị trường**

| Tính năng | AppNhà | eNha | Mona House | TrọCare | **MiniApart (đề xuất)** |
|---|---|---|---|---|---|
| Quản lý phòng, khách thuê, hợp đồng, hoá đơn | Có | Có | Có | Có | Có |
| Ghi chỉ số trên điện thoại | Có | Có | Có | Không rõ | Có |
| **Lưu ảnh công tơ kèm chỉ số** | **Có** | **Có** | **Có** (kèm tự quét số liệu) | Không rõ | Có |
| **Người thuê tự xem hoá đơn và ảnh công tơ** | **Có** | Không rõ | Không rõ | **Có** (xem chi tiết từng khoản) | Có |
| Mã QR thanh toán | Không rõ | Có (VietQR) | Không rõ | Có (QR riêng từng hoá đơn) | Có |
| **Tính tiền điện theo giá bậc thang** | Không rõ | **Có** | Không rõ | Không rõ | Có |
| Quản lý sự cố có phân công xử lý | Không rõ | **Có** (báo hỏng → phiếu → phân công) | Không rõ | Không rõ | Có |
| Nhắc nợ tự động | Không rõ | Có (qua Zalo) | Có | Không rõ | Có |
| **Bậc thang theo định mức đầu người (4 người = 1 hộ)** | Không rõ | Không rõ | Không rõ | Không rõ | **Có** |
| **Chia tiền phòng theo ngày khi vào/ra giữa kỳ** | Không rõ | Không rõ | Không rõ | Không rõ | **Có** |
| **Nhắc hạn kiểm định PCCC và hạn tạm trú** | Không rõ | Không rõ | Không rõ | Không rõ | **Có** |
| **Đối chiếu công tơ tổng, phát hiện thất thoát** | Không rõ | Không rõ | Không rõ | Không rõ | **Có** |
| **Không sửa, không xoá bản ghi tiền; nhật ký kiểm toán** | Không rõ | Không rõ | Không rõ | Không rõ | **Có** |

*Nguồn: trang giới thiệu chính thức của từng sản phẩm, truy cập ngày 24/08/2026.*

**Phát hiện quan trọng, và điều nhóm phải điều chỉnh.**

Đợt đối sánh này **bác bỏ một giả định ban đầu của nhóm**. Phiên bản đầu của tài liệu xếp *"lưu ảnh công tơ kèm chỉ số"* và *"cổng cho người thuê tự xem"* vào nhóm điểm khác biệt. Tra cứu thực tế cho thấy **ít nhất ba sản phẩm đã có ảnh công tơ**, trong đó Mona House còn đi xa hơn phạm vi của đồ án — họ quảng bá khả năng **tự quét số liệu từ ảnh chụp**, tức nhận dạng ký tự quang học, đúng thứ nhóm đã loại khỏi phạm vi ở mục O2 vì cho là quá sức một học kỳ. AppNhà thì nêu rõ người thuê mở ứng dụng là thấy chỉ số cũ và mới, ảnh công tơ hai tháng gần nhất, cùng biên lai thanh toán.

Tương tự, *"tính tiền điện theo giá bậc thang"* cũng không còn là điểm riêng: eNha nêu rõ tính năng này trên trang giới thiệu.

**Đây là kết quả đáng giữ lại nguyên vẹn trong báo cáo, không nên giấu.** Một đợt khảo sát đối thủ mà kết luận "sản phẩm của chúng tôi hơn ở mọi mặt" thường là dấu hiệu khảo sát chưa đủ kỹ. Kết quả ở đây buộc nhóm **thu hẹp và định vị lại** phần giá trị khác biệt.

**Kết luận sau điều chỉnh.** Những gì thị trường đã làm tốt — ảnh công tơ, cổng người thuê, mã QR, nhắc nợ, bậc thang cơ bản — nhóm vẫn làm, nhưng **không coi là điểm khác biệt** mà coi là **mức sàn phải đạt**. Phần giá trị riêng của MiniApart thu về ba cụm, đều xoay quanh *tính đúng theo quy định* thay vì *tiện lợi*:

1. **Tính tiền đúng luật cho phòng trọ, không chỉ đúng bậc thang.** Định mức 4 người tính 1 hộ, nới rộng ngưỡng bậc theo số người ở thực tế của từng kỳ, và chia tiền phòng theo ngày khi khách vào hoặc ra giữa kỳ. Không sản phẩm nào trong bốn sản phẩm khảo sát nêu hai tính năng này.
2. **Nhắc nghĩa vụ pháp lý có thời hạn.** Hạn kiểm định thiết bị phòng cháy chữa cháy, lịch tự kiểm tra an toàn định kỳ, hạn đăng ký tạm trú. Đây là nghĩa vụ mà chủ trọ bị xử phạt nếu bỏ sót, và không sản phẩm nào khảo sát được nhắc tới.
3. **Dữ liệu tiền kiểm toán được.** Bản ghi thanh toán không sửa không xoá, điều chỉnh bằng bút toán đối ứng có lý do; nhật ký thao tác chỉ ghi thêm. Cùng nhóm này là việc đối chiếu công tơ tổng để phát hiện thất thoát.

**Việc còn phải làm.** Bảng trên dựa trên tài liệu quảng bá, nên độ tin cậy có hạn. Trước khi bảo vệ, nhóm nên **đăng ký dùng thử ít nhất hai sản phẩm miễn phí** — TrọCare và AppNhà đều có bản dùng thử không cần thẻ — tạo một toà nhà mẫu với hai phòng, một phòng ba người và một phòng sáu người, rồi kiểm đúng ba việc: phần mềm tính tiền điện của hai phòng đó ra bao nhiêu, có chỗ nhập số người ở không, và có mục nào liên quan tới hồ sơ phòng cháy chữa cháy hoặc tạm trú không. Một buổi làm việc đổi lấy một bảng đối sánh **kiểm chứng được**, thay cho bảng dựa trên quảng cáo.

### 2.2.6. Tổng hợp kết quả thu thập

> **LƯU Ý — Toàn bộ nội dung mục 2.2.6 là dữ liệu giả định (mô phỏng)** do nhóm xây dựng, không phải kết quả khảo sát thực tế. Xem ghi chú ở mục 2.2.1.

#### 2.2.6.1. Phát hiện chính từ phỏng vấn chủ sở hữu và quản lý

**Bảng 2.10 — Phát hiện chính từ phỏng vấn chủ sở hữu và quản lý**

| # | Phát hiện | Yêu cầu phát sinh |
|---|---|---|
| F1 | Chốt số và tính tiền cho 30 phòng mất trung bình 4 giờ, trong đó 1,5 giờ là nhập lại dữ liệu từ sổ vào Excel | Phải nhập trực tiếp tại chỗ trên điện thoại, không nhập hai lần |
| F2 | Nguyên nhân sai sót phổ biến nhất là ghi nhầm chỉ số sang phòng khác | Màn hình ghi số phải theo thứ tự tầng–phòng, hiển thị chỉ số kỳ trước ngay cạnh ô nhập |
| F3 | Tranh chấp về tiền điện xảy ra 1–2 lần mỗi tháng, không có bằng chứng để đối chất | Bắt buộc/khuyến khích chụp ảnh công tơ khi ghi số, người thuê xem được ảnh |
| F4 | Phòng có người vào hoặc ra giữa tháng luôn phải tính tay, hay bị sai | Hệ thống phải tự chia tiền phòng theo số ngày ở thực tế |
| F5 | Chủ không tin tưởng hoàn toàn người quản lý về khoản tiền mặt | Cần nhật ký thao tác (audit log) và giới hạn quyền sửa hoá đơn đã phát hành |
| F6 | Đối chiếu chuyển khoản mất thời gian vì nội dung chuyển tiền mỗi người ghi một kiểu | Sinh mã hoá đơn chuẩn và mã QR có sẵn nội dung chuyển khoản |
| F7 | Không ai theo dõi hợp đồng sắp hết hạn, thường đến sát ngày mới biết | Bảng nhắc việc: hợp đồng hết hạn trong 30 ngày |
| F8 | Có tháng tổng tiền điện các phòng thấp hơn hoá đơn điện lực khoảng 8–12% | Chức năng đối chiếu công tơ tổng, cảnh báo chênh lệch vượt ngưỡng |
| F9 | Sau các đợt kiểm tra PCCC, chủ trọ lúng túng vì hồ sơ giấy thất lạc | Lưu hồ sơ PCCC dạng số, nhắc lịch tự kiểm tra định kỳ |

#### 2.2.6.2. Phát hiện chính từ phía người thuê

**Bảng 2.11 — Phát hiện chính từ phía người thuê**

| # | Phát hiện | Yêu cầu phát sinh |
|---|---|---|
| F10 | Người thuê thường chỉ nhận được con số tổng, không thấy chỉ số công tơ | Hoá đơn phải hiển thị chi tiết từng khoản và chỉ số đầu–cuối kỳ |
| F11 | Người thuê ngại cài thêm ứng dụng chỉ để xem tiền phòng | Cổng người thuê là web, mở được bằng link, đăng nhập nhẹ nhàng bằng số điện thoại + OTP hoặc mật khẩu |
| F12 | Báo hỏng qua tin nhắn hay bị trôi và bị quên | Yêu cầu sửa chữa phải có mã, có trạng thái, người thuê theo dõi được |
| F13 | Nhiều người muốn xem lại tiêu thụ điện các tháng để biết mình dùng nhiều hay ít | Biểu đồ tiêu thụ theo tháng ở cổng người thuê |
| F14 | Có lo ngại về việc ảnh CCCD bị lộ | Ảnh giấy tờ phải được kiểm soát truy cập, chỉ chủ và quản lý toà đó xem được, có ghi log truy cập |

#### 2.2.6.3. Kết quả bảng hỏi *(số liệu mô phỏng, n = 72)*

**Bảng 2.12 — Kết quả bảng hỏi khảo sát người thuê (số liệu mô phỏng, n = 72)**

| Tính năng | Điểm trung bình (thang 5) | % chọn vào top 3 |
|---|---|---|
| Xem hoá đơn chi tiết theo tháng | 4,7 | 81% |
| Xem chỉ số điện nước kèm ảnh công tơ | 4,6 | 74% |
| Mã QR chuyển khoản có sẵn nội dung | 4,3 | 58% |
| Nhận thông báo khi có hoá đơn mới | 4,2 | 47% |
| Báo sự cố kèm ảnh và theo dõi tiến độ | 4,1 | 44% |
| Xem thông báo chung của toà nhà | 3,6 | 19% |
| Biểu đồ tiêu thụ điện nước theo tháng | 3,5 | 17% |
| Xem hợp đồng và ngày hết hạn | 3,4 | 15% |
| Đăng ký xe / người ở cùng trực tuyến | 2,9 | 8% |
| Gửi yêu cầu trả phòng / gia hạn trực tuyến | 2,7 | 6% |

**Cách sử dụng kết quả:** các tính năng có điểm ≥ 4,0 được xếp **Must have**; từ 3,0 đến 3,9 xếp **Should have**; dưới 3,0 xếp **Could have**. Đây là căn cứ định lượng cho cột ưu tiên MoSCoW ở mục 2.3 và 5.

### 2.2.7. Danh sách yêu cầu sơ bộ

Sau bước thu thập, nhóm rút ra 10 nhóm yêu cầu sơ bộ, làm đầu vào cho bước đặc tả:

1. Quản lý danh mục toà nhà – tầng – phòng – loại phòng – dịch vụ – biểu giá.
2. Quản lý người thuê, người ở cùng, phương tiện, hồ sơ giấy tờ.
3. Quản lý vòng đời hợp đồng thuê và tiền cọc.
4. Ghi chỉ số dịch vụ theo kỳ, có ảnh chứng minh và kiểm tra hợp lệ.
5. Tính, phát hành và gửi hoá đơn kỳ; hỗ trợ nhiều cách tính giá điện.
6. Ghi nhận thanh toán, theo dõi công nợ, đối soát chuyển khoản.
7. Tiếp nhận và xử lý yêu cầu sửa chữa theo vòng đời trạng thái.
8. Thông báo và nhắc việc tự động.
9. Cổng thông tin dành cho người thuê.
10. Báo cáo vận hành – tài chính và phân quyền theo vai trò, theo toà nhà.

## 2.3. User story và tiêu chí chấp nhận


### 2.3.1. Quy ước

- **Cấu trúc user story:** *Với tư cách là một [vai trò], tôi muốn [tính năng], để [giá trị đạt được].*
- **Mã hoá:** `US-<số thứ tự>`, thuộc epic `EP-<số>`.
- **Tiêu chí chấp nhận (AC)** viết theo mẫu **"Khi … thì …"**, bao gồm cả **tình huống thành công** và **tình huống thất bại/ngoại lệ**.
- **Ưu tiên MoSCoW:** M = Must have (bắt buộc có ở bản 1.0), S = Should have, C = Could have, W = Won't have (lần này chưa làm).
- **Điểm ước lượng (SP):** thang Fibonacci 1–13, dùng để lập kế hoạch sprint.

**Bảng 2.13 — Tổng quan mười epic**

| Epic | Tên | Số US | Ưu tiên chung |
|---|---|---|---|
| EP-01 | Quản trị người dùng và phân quyền | 3 | M |
| EP-02 | Danh mục toà nhà, phòng, dịch vụ | 4 | M |
| EP-03 | Người thuê và hợp đồng thuê | 5 | M |
| EP-04 | Ghi chỉ số dịch vụ | 3 | M |
| EP-05 | Hoá đơn và thanh toán | 6 | M |
| EP-06 | Sự cố và bảo trì | 3 | M/S |
| EP-07 | Thông báo và nhắc việc | 3 | S |
| EP-08 | Cổng người thuê | 4 | M/S |
| EP-09 | Báo cáo và thống kê | 3 | S |
| EP-10 | An toàn, tuân thủ và nhật ký | 3 | S/C |
| | **Tổng** | **37** | |

---

### 2.3.2. EP-01 — Quản trị người dùng và phân quyền

#### US-01 · Đăng nhập hệ thống · M · 3 SP
> Với tư cách là **người dùng đã có tài khoản**, tôi muốn **đăng nhập bằng số điện thoại và mật khẩu**, để **truy cập đúng phần dữ liệu mà tôi được phép xem**.

**Tiêu chí chấp nhận**

- Khi người dùng nhập đúng số điện thoại và mật khẩu, thì hệ thống chuyển đến màn hình chính tương ứng với vai trò của họ (chủ → tổng quan nhiều toà; quản lý → toà được giao; người thuê → cổng người thuê).
- Khi người dùng nhập sai mật khẩu, thì hệ thống báo "Số điện thoại hoặc mật khẩu không đúng" mà **không tiết lộ** trường nào sai.
- Khi người dùng nhập sai 5 lần liên tiếp trong 15 phút, thì hệ thống tạm khoá đăng nhập trong 15 phút và ghi nhật ký.
- Khi tài khoản đang ở trạng thái "Ngừng hoạt động", thì hệ thống từ chối đăng nhập và hiển thị hướng dẫn liên hệ quản lý.
- Khi người dùng bấm "Quên mật khẩu", thì hệ thống gửi mã xác thực dùng một lần, hiệu lực 5 phút.
- Mật khẩu phải được lưu dưới dạng băm (hash), không lưu bản rõ.

#### US-02 · Phân quyền theo vai trò và theo toà nhà · M · 8 SP
> Với tư cách là **chủ sở hữu**, tôi muốn **giao cho mỗi người quản lý quyền truy cập đúng những toà nhà họ phụ trách**, để **không ai xem hoặc sửa được dữ liệu toà nhà không thuộc trách nhiệm của mình**.

**Tiêu chí chấp nhận**

- Khi chủ tạo tài khoản quản lý và chọn toà A, thì tài khoản đó chỉ nhìn thấy dữ liệu của toà A trong mọi màn hình danh sách, tìm kiếm và báo cáo.
- Khi người quản lý cố truy cập trực tiếp đường dẫn tới dữ liệu của toà B, thì hệ thống trả về lỗi "Không có quyền truy cập" và ghi nhật ký lần truy cập đó.
- Khi chủ thu hồi quyền của một quản lý, thì phiên đăng nhập hiện tại của người đó mất quyền chậm nhất sau 5 phút.
- Khi chủ gán một quản lý cho nhiều toà, thì người đó chuyển đổi giữa các toà bằng một bộ chọn ở đầu màn hình.
- Chỉ vai trò Chủ sở hữu và Quản trị hệ thống được phép tạo, sửa, khoá tài khoản.

#### US-03 · Quản lý danh sách tài khoản · S · 3 SP
> Với tư cách là **chủ sở hữu**, tôi muốn **xem, tạo, khoá tài khoản người dùng**, để **kiểm soát ai đang có quyền vào hệ thống**.

**Tiêu chí chấp nhận**

- Khi chủ mở màn hình tài khoản, thì hệ thống hiển thị danh sách gồm: họ tên, số điện thoại, vai trò, toà được giao, trạng thái, lần đăng nhập gần nhất.
- Khi chủ tạo tài khoản với số điện thoại đã tồn tại, thì hệ thống báo lỗi "Số điện thoại đã được sử dụng".
- Khi chủ khoá một tài khoản, thì tài khoản đó bị đăng xuất khỏi mọi thiết bị ngay lập tức.
- Hệ thống không cho phép xoá vĩnh viễn tài khoản đã phát sinh dữ liệu, chỉ cho chuyển sang trạng thái "Ngừng hoạt động".

---

### 2.3.3. EP-02 — Danh mục toà nhà, phòng, dịch vụ

#### US-04 · Quản lý toà nhà · M · 5 SP
> Với tư cách là **chủ sở hữu**, tôi muốn **khai báo các toà nhà của mình cùng cấu hình riêng của từng toà**, để **mỗi toà vận hành theo đúng quy định của nó**.

**Tiêu chí chấp nhận**

- Khi chủ thêm một toà nhà, thì hệ thống yêu cầu tối thiểu: tên toà, địa chỉ, số tầng, ngày chốt số mặc định, hạn thanh toán mặc định.
- Khi chủ đặt ngày chốt số là 28, thì mọi kỳ hoá đơn của toà đó mặc định lấy mốc ngày 28 hằng tháng.
- Khi chủ nhập số tầng lớn hơn 20 hoặc nhỏ hơn 1, thì hệ thống báo lỗi giá trị không hợp lệ.
- Khi chủ xoá một toà nhà đã có phòng, thì hệ thống từ chối và gợi ý chuyển toà sang trạng thái "Ngừng hoạt động".

#### US-05 · Quản lý phòng và sơ đồ phòng · M · 8 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **xem sơ đồ tất cả các phòng với trạng thái trực quan**, để **biết ngay phòng nào trống, phòng nào đã thuê, phòng nào đang sửa**.

**Tiêu chí chấp nhận**

- Khi quản lý mở màn hình sơ đồ, thì các phòng được nhóm theo tầng, mỗi ô hiển thị: số phòng, trạng thái bằng màu, tên người thuê hiện tại, tình trạng đóng tiền kỳ hiện tại.
- Khi quản lý bấm vào một phòng, thì hệ thống hiển thị chi tiết: diện tích, giá thuê, sức chứa, hợp đồng hiện tại, lịch sử chỉ số 6 kỳ gần nhất, lịch sử sự cố.
- Khi một phòng có hợp đồng hiệu lực, thì trạng thái tự động chuyển thành "Đang thuê", không cho sửa tay.
- Khi quản lý tạo phòng có số phòng trùng trong cùng một toà, thì hệ thống báo lỗi trùng.
- Trạng thái phòng gồm: Trống · Đang thuê · Đã đặt cọc · Đang sửa chữa · Ngừng cho thuê.

#### US-06 · Quản lý danh mục dịch vụ và biểu giá · M · 8 SP
> Với tư cách là **chủ sở hữu**, tôi muốn **khai báo các loại dịch vụ và đơn giá kèm ngày hiệu lực**, để **khi tăng giá dịch vụ thì các hoá đơn cũ vẫn giữ nguyên đơn giá tại thời điểm phát hành**.

**Tiêu chí chấp nhận**

- Khi chủ tạo một dịch vụ, thì phải chọn cách tính: **theo chỉ số** (điện, nước), **cố định theo phòng** (rác, internet, quản lý), **theo đầu người** (nước tính theo người), hoặc **theo số lượng** (gửi xe).
- Khi chủ đổi đơn giá điện từ 3.500 đ lên 3.800 đ với ngày hiệu lực 01/09, thì mọi hoá đơn kỳ tháng 8 vẫn dùng 3.500 đ, kỳ tháng 9 dùng 3.800 đ.
- Khi chủ chọn chế độ tính điện "bậc thang theo giá Nhà nước", thì hệ thống áp biểu giá 5 bậc và cho nhập định mức theo số người ở của phòng.
- Khi chủ nhập đơn giá âm hoặc bằng 0 cho dịch vụ tính theo chỉ số, thì hệ thống báo lỗi.
- Hệ thống lưu lại toàn bộ lịch sử thay đổi giá (giá cũ, giá mới, người sửa, thời điểm).

#### US-07 · Quản lý tài sản trong phòng · C · 3 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **ghi lại tài sản bàn giao trong từng phòng và tình trạng của chúng**, để **khi người thuê trả phòng có căn cứ đối chiếu và khấu trừ tiền cọc**.

**Tiêu chí chấp nhận**

- Khi quản lý lập biên bản bàn giao, thì có thể chọn tài sản từ danh mục (điều hoà, nóng lạnh, giường, tủ…) và ghi tình trạng kèm ảnh.
- Khi người thuê trả phòng, thì hệ thống hiển thị lại danh sách tài sản đã bàn giao để đối chiếu và ghi nhận hư hỏng.
- Khi có hư hỏng, thì hệ thống cho nhập số tiền khấu trừ và tự trừ vào tiền cọc hoàn lại.

---

### 2.3.4. EP-03 — Người thuê và hợp đồng thuê

#### US-08 · Quản lý hồ sơ người thuê · M · 5 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **lưu hồ sơ người thuê kèm ảnh giấy tờ tuỳ thân**, để **có đủ thông tin phục vụ hợp đồng và khai báo lưu trú**.

**Tiêu chí chấp nhận**

- Khi quản lý tạo hồ sơ, thì bắt buộc nhập: họ tên, số điện thoại, số giấy tờ tuỳ thân, quê quán, ngày bắt đầu ở.
- Khi số điện thoại đã tồn tại trong hệ thống, thì hệ thống cảnh báo và gợi ý dùng lại hồ sơ cũ thay vì tạo trùng.
- Khi quản lý tải lên ảnh giấy tờ, thì ảnh chỉ hiển thị được cho vai trò Chủ và Quản lý của chính toà đó; mọi lượt xem đều được ghi nhật ký.
- Khi quản lý thêm người ở cùng vượt quá sức chứa của phòng, thì hệ thống cảnh báo nhưng vẫn cho lưu kèm lý do.
- Người thuê được đánh dấu là "người đại diện hợp đồng" hoặc "người ở cùng".

#### US-09 · Tạo hợp đồng thuê · M · 8 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **tạo hợp đồng thuê cho một phòng**, để **ghi nhận đầy đủ điều khoản và làm căn cứ tính tiền hằng tháng**.

**Tiêu chí chấp nhận**

- Khi quản lý tạo hợp đồng, thì phải chọn: phòng, người đại diện, ngày bắt đầu, thời hạn, giá thuê, tiền cọc, chu kỳ thanh toán, danh sách dịch vụ áp dụng kèm đơn giá.
- Khi phòng đã có hợp đồng còn hiệu lực trong khoảng thời gian đó, thì hệ thống **từ chối** tạo và báo "Phòng đang có hợp đồng hiệu lực đến ngày ...".
- Khi hợp đồng được lưu, thì trạng thái phòng tự chuyển sang "Đang thuê" và hệ thống ghi nhận khoản thu tiền cọc chờ xác nhận.
- Khi ngày bắt đầu nằm sau ngày kết thúc, thì hệ thống báo lỗi.
- Khi hợp đồng được tạo, thì hệ thống sinh bản hợp đồng dạng PDF theo mẫu để in và ký.
- Khi ngày bắt đầu không trùng ngày chốt số, thì kỳ hoá đơn đầu tiên được tính tiền phòng theo số ngày ở thực tế (xem BR-06).

#### US-10 · Gia hạn hợp đồng · S · 3 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **gia hạn hợp đồng sắp hết hạn chỉ với vài thao tác**, để **không phải nhập lại toàn bộ thông tin**.

**Tiêu chí chấp nhận**

- Khi quản lý bấm "Gia hạn", thì hệ thống tạo hợp đồng mới kế thừa toàn bộ điều khoản cũ, chỉ yêu cầu nhập thời hạn mới và giá thuê mới (nếu thay đổi).
- Khi giá thuê mới khác giá cũ, thì hệ thống hiển thị cảnh báo cần thông báo cho người thuê trước ngày áp dụng.
- Khi hợp đồng cũ chưa hết hạn, thì hợp đồng mới có hiệu lực ngay sau ngày kết thúc hợp đồng cũ, không tạo khoảng chồng lấn.

#### US-11 · Thanh lý hợp đồng và trả phòng · M · 8 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **thực hiện thủ tục trả phòng và quyết toán tiền cọc**, để **kết thúc quan hệ thuê một cách rõ ràng, không tranh chấp**.

**Tiêu chí chấp nhận**

- Khi quản lý bắt đầu thủ tục trả phòng, thì hệ thống yêu cầu nhập chỉ số điện, nước cuối cùng tại ngày trả phòng.
- Khi nhập xong, thì hệ thống tự tính hoá đơn kỳ cuối gồm: tiền phòng theo số ngày ở thực tế, tiền dịch vụ theo chỉ số, phí cố định, các khoản khấu trừ hư hỏng.
- Khi quyết toán, thì hệ thống hiển thị rõ: tiền cọc đã thu - công nợ còn lại - khấu trừ hư hỏng = **số tiền hoàn lại** (hoặc số tiền người thuê còn phải nộp thêm).
- Khi người thuê còn công nợ lớn hơn tiền cọc, thì hệ thống tạo một khoản phải thu và không cho đóng hợp đồng cho đến khi đánh dấu đã xử lý.
- Khi hợp đồng được thanh lý, thì trạng thái phòng chuyển về "Trống" (hoặc "Đang sửa chữa" nếu quản lý chọn) và tài khoản cổng người thuê chuyển sang chế độ chỉ đọc trong 90 ngày.

#### US-12 · Quản lý phương tiện của người thuê · C · 2 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **đăng ký xe của từng phòng**, để **tính phí gửi xe đúng và kiểm soát an ninh nhà xe**.

**Tiêu chí chấp nhận**

- Khi quản lý đăng ký xe, thì nhập: loại xe (máy/điện/ô tô/xe đạp), biển số, chủ xe, ngày đăng ký.
- Khi biển số đã được đăng ký ở phòng khác trong cùng toà, thì hệ thống cảnh báo trùng.
- Khi tạo hoá đơn, thì phí gửi xe được tính theo số xe đang đăng ký của phòng tại thời điểm chốt kỳ.

---

### 2.3.5. EP-04 — Ghi chỉ số dịch vụ

#### US-13 · Ghi chỉ số công tơ theo danh sách phòng · M · 8 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **nhập chỉ số điện nước của cả toà trên điện thoại theo danh sách phòng**, để **ghi số ngay tại chỗ mà không phải chép lại từ sổ tay**.

**Tiêu chí chấp nhận**

- Khi quản lý mở màn hình ghi chỉ số của kỳ, thì hệ thống liệt kê tất cả phòng đang có hợp đồng, **sắp xếp theo tầng rồi theo số phòng**, mỗi dòng hiển thị chỉ số kỳ trước ngay cạnh ô nhập chỉ số mới.
- Khi quản lý nhập chỉ số mới, thì hệ thống hiển thị ngay số tiêu thụ được tính ra để người nhập tự kiểm tra.
- Khi quản lý nhập chỉ số mới **nhỏ hơn** chỉ số kỳ trước, thì hệ thống chặn lưu và hiển thị "Chỉ số mới không được nhỏ hơn chỉ số cũ (…). Nếu vừa thay công tơ, hãy chọn 'Thay công tơ'".
- Khi mức tiêu thụ vượt **150% trung bình ba kỳ gần nhất** của chính phòng đó, thì hệ thống hiển thị cảnh báo màu vàng và yêu cầu xác nhận trước khi lưu.
- Khi quản lý bấm lưu mà mất kết nối mạng, thì dữ liệu đã nhập được giữ lại trên thiết bị và tự gửi lại khi có mạng, không mất dữ liệu.
- Khi quản lý đã ghi xong toàn bộ phòng, thì hệ thống hiển thị số phòng còn thiếu (nếu có) trước khi cho phép chốt kỳ.

#### US-14 · Đính kèm ảnh công tơ · M · 5 SP
> Với tư cách là **người thuê**, tôi muốn **nhìn thấy ảnh chụp công tơ tương ứng với chỉ số trên hoá đơn**, để **tin rằng số tiền điện của mình được tính đúng**.

**Tiêu chí chấp nhận**

- Khi quản lý nhập chỉ số, thì có thể chụp hoặc chọn ảnh đính kèm cho từng phòng.
- Khi toà nhà bật tuỳ chọn "bắt buộc ảnh công tơ", thì hệ thống không cho lưu chỉ số nếu thiếu ảnh.
- Khi người thuê mở hoá đơn, thì thấy được ảnh công tơ của kỳ đó ở kích thước đủ đọc số.
- Ảnh được nén xuống dưới 500 KB trước khi lưu, giữ nguyên phần hiển thị số.
- Khi ảnh đã gắn với một chỉ số đã dùng để phát hành hoá đơn, thì không cho phép xoá, chỉ cho bổ sung ảnh mới.

#### US-15 · Xử lý thay công tơ · S · 3 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **ghi nhận việc thay công tơ giữa kỳ**, để **tiền dịch vụ vẫn được tính đúng khi chỉ số quay về 0**.

**Tiêu chí chấp nhận**

- Khi quản lý chọn "Thay công tơ", thì nhập: chỉ số cuối của công tơ cũ, chỉ số đầu của công tơ mới, ngày thay, ảnh cả hai công tơ.
- Khi tính hoá đơn kỳ đó, thì mức tiêu thụ = (chỉ số cuối công tơ cũ - chỉ số đầu kỳ) + (chỉ số cuối kỳ - chỉ số đầu công tơ mới).
- Khi xem lịch sử chỉ số, thì kỳ có thay công tơ được đánh dấu rõ kèm ghi chú.

---

### 2.3.6. EP-05 — Hoá đơn và thanh toán

#### US-16 · Tạo hoá đơn hàng loạt cho cả toà · M · 13 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **hệ thống tự tính và tạo hoá đơn cho toàn bộ phòng của một kỳ chỉ bằng một thao tác**, để **rút thời gian chốt sổ từ vài giờ xuống vài phút**.

**Tiêu chí chấp nhận**

- Khi quản lý bấm "Tạo hoá đơn kỳ tháng 8/2026", thì hệ thống tạo hoá đơn nháp cho mọi phòng có hợp đồng hiệu lực trong kỳ, áp dụng đúng các quy tắc BR-01 đến BR-07.
- Khi có phòng chưa ghi chỉ số, thì hệ thống liệt kê rõ các phòng đó và **không tạo hoá đơn cho chúng**, các phòng còn lại vẫn được tạo bình thường.
- Khi một phòng có người vào ở giữa kỳ, thì tiền phòng được chia theo số ngày ở thực tế và hoá đơn ghi rõ dòng "Tiền phòng (12/31 ngày)".
- Khi kỳ đó đã tồn tại hoá đơn cho phòng, thì hệ thống **không tạo trùng** mà báo "Đã có hoá đơn cho phòng này trong kỳ".
- Khi tạo xong, thì hệ thống hiển thị bảng tổng hợp: số hoá đơn đã tạo, tổng tiền, số phòng bị bỏ qua và lý do.
- Toàn bộ hoá đơn được tạo ở trạng thái **Nháp**, chưa gửi cho người thuê.
- Thời gian xử lý cho một toà 50 phòng không quá 10 giây.

#### US-17 · Xem và chỉnh sửa hoá đơn nháp · M · 5 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **kiểm tra và điều chỉnh hoá đơn trước khi gửi đi**, để **không gửi nhầm số liệu cho người thuê**.

**Tiêu chí chấp nhận**

- Khi quản lý mở một hoá đơn nháp, thì thấy đầy đủ: kỳ, phòng, người thuê, từng dòng khoản mục (tên khoản, chỉ số đầu–cuối, số lượng, đơn giá, thành tiền), tổng cộng, hạn thanh toán.
- Khi quản lý thêm một dòng thủ công (ví dụ "Phí sửa vòi nước"), thì phải nhập lý do; dòng đó được đánh dấu là khoản phát sinh.
- Khi quản lý thêm dòng giảm trừ, thì số tiền giảm trừ không được vượt quá tổng các khoản phải thu.
- Khi hoá đơn đã ở trạng thái "Đã phát hành", thì **không cho sửa trực tiếp**; chỉ được huỷ có ghi lý do rồi phát hành hoá đơn thay thế, và cả hai đều lưu trong nhật ký.

#### US-18 · Phát hành và gửi hoá đơn cho người thuê · M · 5 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **phát hành và gửi hoá đơn cho tất cả người thuê cùng lúc**, để **không phải soạn tin nhắn thủ công cho từng phòng**.

**Tiêu chí chấp nhận**

- Khi quản lý bấm "Phát hành", thì toàn bộ hoá đơn nháp đã kiểm tra chuyển sang trạng thái "Đã phát hành" và hiển thị ngay trên cổng người thuê.
- Khi phát hành, thì hệ thống gửi thông báo cho từng người thuê kèm liên kết xem hoá đơn.
- Khi một người thuê không có số điện thoại hợp lệ, thì hệ thống vẫn phát hành nhưng liệt kê phòng đó vào danh sách "chưa gửi được thông báo".
- Khi hoá đơn được phát hành, thì hệ thống sinh **mã hoá đơn duy nhất** theo định dạng `<Mã toà>-<Số phòng>-<YYYYMM>` để dùng làm nội dung chuyển khoản.
- Người dùng có thể tải hoá đơn dạng PDF hoặc ảnh để gửi lại qua Zalo.

#### US-19 · Hiển thị mã QR chuyển khoản · S · 5 SP
> Với tư cách là **người thuê**, tôi muốn **quét mã QR để chuyển khoản với nội dung đã điền sẵn**, để **không gõ nhầm số tài khoản hay nội dung chuyển tiền**.

**Tiêu chí chấp nhận**

- Khi người thuê mở hoá đơn chưa thanh toán, thì thấy mã QR chứa: số tài khoản của chủ, số tiền còn phải trả, và nội dung là mã hoá đơn.
- Khi hoá đơn đã thanh toán đủ, thì mã QR không hiển thị nữa.
- Khi chủ chưa khai báo tài khoản ngân hàng cho toà nhà, thì phần QR hiển thị hướng dẫn liên hệ quản lý thay vì mã lỗi.
- Mã QR được sinh theo chuẩn thanh toán ngân hàng phổ biến tại Việt Nam để mọi ứng dụng ngân hàng đều quét được.

#### US-20 · Ghi nhận thanh toán và công nợ · M · 8 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **ghi nhận từng lần người thuê trả tiền, kể cả trả một phần**, để **biết chính xác ai còn nợ bao nhiêu**.

**Tiêu chí chấp nhận**

- Khi quản lý ghi nhận một khoản thu, thì nhập: hoá đơn, số tiền, hình thức (tiền mặt/chuyển khoản), ngày thu, ghi chú.
- Khi số tiền thu **nhỏ hơn** số phải trả, thì hoá đơn chuyển trạng thái "Đã thu một phần" và hiển thị số còn lại.
- Khi tổng các lần thu **bằng hoặc lớn hơn** số phải trả, thì hoá đơn chuyển sang "Đã thanh toán" và ghi nhận phần dư thành số dư khả dụng của phòng để trừ vào kỳ sau.
- Khi số tiền thu là số âm hoặc bằng 0, thì hệ thống báo lỗi.
- Khi quá hạn thanh toán mà hoá đơn chưa được trả đủ, thì trạng thái tự chuyển thành "Quá hạn" và xuất hiện trên bảng công nợ.
- Khi ghi nhận thanh toán, thì hệ thống sinh biên lai có mã, người thuê xem được trên cổng.
- Người quản lý **không được phép xoá** một lần ghi nhận thanh toán; chỉ được lập bút toán điều chỉnh có lý do.

#### US-21 · Đối soát chuyển khoản từ sao kê · C · 8 SP
> Với tư cách là **chủ sở hữu**, tôi muốn **tải lên file sao kê ngân hàng để hệ thống tự khớp với hoá đơn**, để **không phải dò từng giao dịch bằng mắt**.

**Tiêu chí chấp nhận**

- Khi chủ tải lên file sao kê (CSV/Excel), thì hệ thống đọc các cột ngày, số tiền, nội dung.
- Khi nội dung giao dịch chứa mã hoá đơn hợp lệ và số tiền khớp, thì hệ thống đề xuất khớp tự động; việc ghi nhận chỉ thực hiện sau khi người dùng **xác nhận**.
- Khi có giao dịch không khớp được, thì hệ thống đưa vào danh sách "Chờ xử lý thủ công" kèm gợi ý hoá đơn có số tiền gần đúng.
- Khi cùng một giao dịch đã được khớp trước đó, thì hệ thống không khớp lại lần hai.

---

### 2.3.7. EP-06 — Sự cố và bảo trì

#### US-22 · Người thuê gửi yêu cầu sửa chữa · M · 5 SP
> Với tư cách là **người thuê**, tôi muốn **báo sự cố kèm ảnh ngay trên hệ thống**, để **yêu cầu của tôi không bị trôi mất như khi nhắn tin**.

**Tiêu chí chấp nhận**

- Khi người thuê tạo yêu cầu, thì nhập: hạng mục (điện/nước/nội thất/internet/an ninh/khác), mô tả, mức độ (Khẩn cấp / Bình thường / Có thể chờ), tối đa 5 ảnh.
- Khi gửi thành công, thì hệ thống sinh mã yêu cầu và trạng thái "Mới tiếp nhận", đồng thời thông báo cho quản lý toà đó.
- Khi mức độ là "Khẩn cấp", thì thông báo tới quản lý được đánh dấu ưu tiên và hiển thị nổi bật trên màn hình chính của quản lý.
- Khi người thuê chưa nhập mô tả, thì hệ thống không cho gửi.
- Khi người thuê mở lại yêu cầu, thì thấy toàn bộ lịch sử trạng thái kèm thời điểm và người xử lý.

#### US-23 · Xử lý và phân công yêu cầu sửa chữa · M · 5 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **phân công thợ và cập nhật tiến độ xử lý**, để **theo dõi được việc nào đang tồn đọng**.

**Tiêu chí chấp nhận**

- Khi quản lý mở danh sách yêu cầu, thì có thể lọc theo toà, trạng thái, mức độ, hạng mục và sắp xếp theo thời gian chờ lâu nhất.
- Khi quản lý phân công cho một thợ, thì trạng thái chuyển sang "Đã phân công" và thợ nhận được thông báo.
- Khi thợ báo hoàn thành, thì nhập chi phí thực tế, bên chịu chi phí (chủ nhà / người thuê), ảnh sau khi sửa; trạng thái chuyển "Chờ xác nhận".
- Khi bên chịu chi phí là người thuê, thì hệ thống tạo sẵn một khoản phát sinh gắn vào hoá đơn kỳ tiếp theo của phòng đó.
- Khi người thuê xác nhận đã xong (hoặc sau 72 giờ không phản hồi), thì trạng thái chuyển "Đã đóng".
- Vòng đời trạng thái: Mới tiếp nhận → Đã tiếp nhận → Đã phân công → Đang xử lý → Chờ xác nhận → Đã đóng; có thể chuyển sang "Đã huỷ" kèm lý do ở bất kỳ bước nào trước "Đã đóng".

#### US-24 · Lịch sử bảo trì và chi phí theo phòng · S · 3 SP
> Với tư cách là **chủ sở hữu**, tôi muốn **xem lịch sử sửa chữa và tổng chi phí bảo trì của từng phòng**, để **biết phòng nào hay hỏng và cân nhắc thay thiết bị**.

**Tiêu chí chấp nhận**

- Khi chủ mở chi tiết một phòng, thì thấy danh sách sự cố đã xảy ra kèm ngày, hạng mục, chi phí.
- Khi chủ mở báo cáo bảo trì, thì thấy tổng chi phí theo toà, theo hạng mục, theo tháng.
- Khi một phòng có từ 3 sự cố cùng hạng mục trong 6 tháng, thì hệ thống đánh dấu cảnh báo "hỏng lặp lại".

---

### 2.3.8. EP-07 — Thông báo và nhắc việc

#### US-25 · Bảng nhắc việc cho quản lý · S · 5 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **thấy ngay những việc cần làm khi mở hệ thống**, để **không bỏ sót đầu việc quan trọng trong tháng**.

**Tiêu chí chấp nhận**

- Khi quản lý đăng nhập, thì màn hình chính hiển thị các nhóm nhắc việc: hoá đơn quá hạn, phòng chưa ghi chỉ số khi đã đến ngày chốt số, hợp đồng hết hạn trong 30 ngày, yêu cầu sửa chữa tồn quá 48 giờ, đến hạn kiểm tra PCCC.
- Khi bấm vào một mục nhắc việc, thì hệ thống mở thẳng danh sách chi tiết đã lọc sẵn.
- Khi không còn việc nào trong một nhóm, thì nhóm đó hiển thị trạng thái "Đã xong" thay vì biến mất, để người dùng biết hệ thống đã kiểm tra.

#### US-26 · Gửi thông báo chung của toà nhà · S · 3 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **gửi thông báo tới toàn bộ người thuê của một toà**, để **truyền đạt thông tin như lịch cắt nước, nội quy mới đến mọi người cùng lúc**.

**Tiêu chí chấp nhận**

- Khi quản lý soạn thông báo, thì chọn phạm vi (toàn toà / một số tầng / một số phòng), tiêu đề, nội dung, ảnh đính kèm, thời gian hiệu lực.
- Khi gửi, thì thông báo xuất hiện trên cổng người thuê của các phòng được chọn.
- Khi người thuê đã xem, thì quản lý thấy được số lượng và danh sách phòng đã xem.
- Khi thông báo hết thời gian hiệu lực, thì tự động chuyển xuống mục lưu trữ.

#### US-27 · Nhắc hạn thanh toán tự động · S · 3 SP
> Với tư cách là **chủ sở hữu**, tôi muốn **hệ thống tự nhắc người thuê sắp đến hạn và đã quá hạn**, để **tăng tỷ lệ thu tiền đúng hạn mà không cần nhắc thủ công**.

**Tiêu chí chấp nhận**

- Khi còn 3 ngày đến hạn thanh toán, thì hệ thống gửi nhắc lần 1 cho các hoá đơn chưa thanh toán đủ.
- Khi quá hạn 1 ngày, thì gửi nhắc lần 2; quá hạn 5 ngày thì gửi nhắc lần 3 và đồng thời báo cho quản lý.
- Khi hoá đơn đã được thanh toán đủ, thì mọi nhắc nhở còn lại của hoá đơn đó bị huỷ.
- Chủ có thể bật/tắt nhắc tự động và chỉnh mốc thời gian nhắc theo từng toà.

---

### 2.3.9. EP-08 — Cổng người thuê

#### US-28 · Xem hoá đơn của tôi · M · 5 SP
> Với tư cách là **người thuê**, tôi muốn **xem hoá đơn tháng này và các tháng trước với đầy đủ chi tiết**, để **biết mình phải trả bao nhiêu và vì sao**.

**Tiêu chí chấp nhận**

- Khi người thuê mở cổng, thì thấy ngay hoá đơn kỳ gần nhất: tổng tiền, hạn thanh toán, trạng thái, và nút xem chi tiết.
- Khi xem chi tiết, thì thấy từng khoản mục kèm chỉ số đầu kỳ – cuối kỳ – số tiêu thụ – đơn giá – thành tiền.
- Khi người thuê mở lịch sử, thì xem được hoá đơn của tối thiểu 12 kỳ gần nhất.
- Khi người thuê đăng nhập, thì **chỉ** thấy dữ liệu của phòng mình, không thấy phòng khác trong bất kỳ màn hình nào.
- Khi hợp đồng đã thanh lý, thì người thuê vẫn xem được hoá đơn cũ ở chế độ chỉ đọc trong 90 ngày.

#### US-29 · Xem lịch sử tiêu thụ điện nước · S · 3 SP
> Với tư cách là **người thuê**, tôi muốn **xem biểu đồ tiêu thụ điện nước theo tháng**, để **tự đánh giá mình đang dùng nhiều hay ít và điều chỉnh**.

**Tiêu chí chấp nhận**

- Khi người thuê mở mục "Tiêu thụ", thì thấy biểu đồ cột số kWh và m³ của 12 kỳ gần nhất.
- Khi một kỳ có mức tiêu thụ cao hơn 150% trung bình, thì cột đó được làm nổi bật kèm chú thích.
- Khi bấm vào một cột, thì hiển thị chỉ số đầu–cuối và ảnh công tơ của kỳ đó.

#### US-30 · Xem hợp đồng và thông tin phòng · S · 2 SP
> Với tư cách là **người thuê**, tôi muốn **xem lại hợp đồng, ngày hết hạn và các điều khoản giá**, để **chủ động chuẩn bị gia hạn hoặc tìm chỗ mới**.

**Tiêu chí chấp nhận**

- Khi người thuê mở mục hợp đồng, thì thấy: ngày bắt đầu, ngày hết hạn, giá thuê, tiền cọc đã đóng, danh sách dịch vụ và đơn giá đang áp dụng.
- Khi còn dưới 30 ngày đến hạn, thì hiển thị nhắc "Hợp đồng sắp hết hạn" kèm nút gửi yêu cầu gia hạn.
- Khi người thuê tải hợp đồng, thì nhận được bản PDF đã ký (nếu quản lý đã tải lên).

#### US-31 · Gửi yêu cầu gia hạn hoặc trả phòng · C · 3 SP
> Với tư cách là **người thuê**, tôi muốn **gửi ý định gia hạn hoặc trả phòng qua hệ thống**, để **hai bên có ghi nhận rõ ràng về thời điểm báo trước**.

**Tiêu chí chấp nhận**

- Khi người thuê gửi yêu cầu trả phòng, thì chọn ngày dự kiến trả và hệ thống ghi lại thời điểm gửi làm mốc báo trước.
- Khi ngày dự kiến trả cách ngày gửi ít hơn số ngày báo trước ghi trong hợp đồng, thì hệ thống cảnh báo có thể bị mất một phần tiền cọc theo điều khoản.
- Khi quản lý duyệt yêu cầu, thì hệ thống tạo sẵn quy trình trả phòng ở US-11.

---

### 2.3.10. EP-09 — Báo cáo và thống kê

#### US-32 · Màn hình tổng quan cho chủ sở hữu · M · 8 SP
> Với tư cách là **chủ sở hữu nhiều toà**, tôi muốn **một màn hình duy nhất tổng hợp tình hình tất cả các toà**, để **nắm được sức khoẻ kinh doanh chỉ trong một phút mỗi sáng**.

**Tiêu chí chấp nhận**

- Khi chủ đăng nhập, thì thấy các chỉ số của kỳ hiện tại: tổng doanh thu đã phát hành, tổng đã thu, tổng công nợ, tỷ lệ lấp đầy, số phòng trống, số sự cố đang mở — **tổng hợp trên tất cả các toà**.
- Khi chủ chọn một toà cụ thể, thì mọi chỉ số được lọc lại theo toà đó.
- Khi chủ chọn khoảng thời gian, thì biểu đồ doanh thu – công nợ theo tháng cập nhật tương ứng.
- Khi mở trên điện thoại, thì các chỉ số xếp theo chiều dọc và vẫn đọc được đầy đủ.
- Thời gian tải màn hình không quá 3 giây với dữ liệu 5 toà × 50 phòng × 24 kỳ.

#### US-33 · Báo cáo công nợ · M · 5 SP
> Với tư cách là **chủ sở hữu**, tôi muốn **xem danh sách phòng còn nợ và số ngày quá hạn**, để **biết cần đôn đốc ai trước**.

**Tiêu chí chấp nhận**

- Khi chủ mở báo cáo công nợ, thì thấy danh sách: toà, phòng, người thuê, số tiền còn nợ, số ngày quá hạn, sắp xếp giảm dần theo số ngày quá hạn.
- Khi bấm vào một dòng, thì mở chi tiết các hoá đơn chưa trả đủ của phòng đó.
- Khi chủ xuất báo cáo, thì tải được file Excel với đúng dữ liệu đang lọc.

#### US-34 · Đối chiếu công tơ tổng, phát hiện thất thoát · C · 5 SP
> Với tư cách là **chủ sở hữu**, tôi muốn **so sánh tổng tiêu thụ của các phòng với chỉ số công tơ tổng**, để **phát hiện rò rỉ, câu trộm điện hoặc ghi sót**.

**Tiêu chí chấp nhận**

- Khi chủ nhập chỉ số công tơ tổng của kỳ, thì hệ thống hiển thị: tổng tiêu thụ các phòng, tiêu thụ khu vực chung, phần chênh lệch và tỷ lệ phần trăm.
- Khi tỷ lệ chênh lệch vượt ngưỡng cấu hình (mặc định 10%), thì hệ thống cảnh báo và gợi ý kiểm tra lại các phòng có mức tiêu thụ giảm bất thường.
- Khi chưa nhập chỉ số công tơ tổng, thì báo cáo hiển thị trạng thái "Chưa có dữ liệu" thay vì báo lỗi.

---

### 2.3.11. EP-10 — An toàn, tuân thủ và nhật ký

#### US-35 · Quản lý hồ sơ và lịch kiểm tra PCCC · S · 5 SP
> Với tư cách là **chủ sở hữu**, tôi muốn **lưu hồ sơ PCCC của từng toà và được nhắc lịch tự kiểm tra định kỳ**, để **luôn sẵn sàng khi cơ quan chức năng kiểm tra**.

**Tiêu chí chấp nhận**

- Khi chủ mở hồ sơ an toàn của một toà, thì tải lên và lưu được: phiếu thông tin cơ sở về PCCC, phương án thoát nạn, biên bản kiểm tra, ảnh vị trí thiết bị chữa cháy, giấy chứng nhận bảo hiểm cháy nổ.
- Khi chủ khai báo danh mục thiết bị PCCC (bình chữa cháy, đầu báo khói, đèn thoát hiểm) kèm hạn kiểm định, thì hệ thống nhắc trước 30 ngày khi đến hạn.
- Khi đến kỳ tự kiểm tra định kỳ theo cấu hình, thì hệ thống tạo một việc cần làm trên bảng nhắc việc và cho ghi nhận kết quả kiểm tra theo danh mục kiểm tra.
- Khi có hạng mục kiểm tra bị đánh dấu "Không đạt", thì hệ thống tạo tự động một yêu cầu xử lý mức "Khẩn cấp".

#### US-36 · Quản lý hồ sơ cư trú của người thuê · S · 3 SP
> Với tư cách là **quản lý toà nhà**, tôi muốn **theo dõi tình trạng khai báo lưu trú/tạm trú của người thuê và xuất được danh sách cư trú**, để **thực hiện đúng trách nhiệm của cơ sở cho thuê**.

**Tiêu chí chấp nhận**

- Khi thêm một người thuê hoặc người ở cùng, thì hệ thống ghi nhận trạng thái khai báo: Chưa khai báo / Đã thông báo lưu trú / Đã đăng ký tạm trú, kèm ngày thực hiện.
- Khi một người ở quá 30 ngày mà trạng thái vẫn là "Chưa khai báo", thì hệ thống đưa vào bảng nhắc việc.
- Khi quản lý bấm "Xuất danh sách cư trú", thì tải được file Excel gồm: họ tên, ngày sinh, số giấy tờ, quê quán, phòng, ngày bắt đầu ở — theo thứ tự phòng.
- Hệ thống **không** tự gửi dữ liệu tới bất kỳ cơ quan nào; việc khai báo do người dùng tự thực hiện trên kênh chính thức.

#### US-37 · Nhật ký thao tác (Audit log) · S · 5 SP
> Với tư cách là **chủ sở hữu**, tôi muốn **xem lại ai đã thay đổi dữ liệu quan trọng và thay đổi cái gì**, để **kiểm soát rủi ro gian lận và truy vết khi có tranh chấp**.

**Tiêu chí chấp nhận**

- Khi có thao tác thuộc nhóm nhạy cảm (sửa/huỷ hoá đơn, ghi nhận thanh toán, đổi đơn giá dịch vụ, sửa chỉ số đã chốt, xem ảnh giấy tờ, đổi quyền tài khoản), thì hệ thống ghi lại: người thực hiện, thời điểm, đối tượng, giá trị trước và sau.
- Khi chủ mở nhật ký, thì lọc được theo người dùng, loại thao tác, khoảng thời gian, đối tượng.
- Nhật ký chỉ đọc, không ai được sửa hay xoá, kể cả quản trị hệ thống.
- Nhật ký được giữ tối thiểu 24 tháng.

## 2.4. Đặc tả yêu cầu phần mềm


### 2.4.1. Tổng quan hệ thống

**MiniApart** là ứng dụng web (responsive, dùng tốt trên điện thoại), phục vụ một chủ sở hữu quản lý nhiều toà chung cư mini, gồm hai khu vực:

**Bảng 2.14 — Phân chia khu vực người dùng của hệ thống**

| Khu vực | Người dùng | Đặc điểm |
|---|---|---|
| **Khu vực quản trị** | Chủ sở hữu, Quản lý toà nhà, Thợ sửa chữa, Quản trị hệ thống | Chức năng đầy đủ, dữ liệu giới hạn theo toà được giao |
| **Cổng người thuê** | Người thuê, Người ở cùng | Chỉ đọc là chính, chỉ thấy dữ liệu phòng mình, giao diện tối giản cho điện thoại |

**Sơ đồ ngữ cảnh (mức khái niệm)**

```
   [Chủ sở hữu]          [Quản lý toà nhà]        [Thợ sửa chữa]
         \                      |                      /
          +--------->  +-------------------+  <--------+
                       |     MiniApart     |
          +--------->  +-------------------+  --------->  [Dịch vụ gửi thông báo]
         /                      |      \
   [Người thuê]                 |       +--------------->  [File sao kê ngân hàng]
                                |
                        [Lưu trữ dữ liệu]
```

### 2.4.2. Vai trò và ma trận phân quyền

**Bảng 2.15 — Vai trò và ma trận phân quyền**

| Chức năng | Quản trị HT | Chủ sở hữu | Quản lý toà | Thợ sửa chữa | Người thuê |
|---|:---:|:---:|:---:|:---:|:---:|
| Quản lý tài khoản, phân quyền | Có | Có | Không | Không | Không |
| Khai báo toà nhà, phòng | Có | Có | Sửa (toà được giao) | Không | Không |
| Khai báo dịch vụ và đơn giá | Có | Có | Không | Không | Không |
| Quản lý người thuê, hợp đồng | Có | Có | Có (toà được giao) | Không | Xem của mình |
| Ghi chỉ số dịch vụ | Có | Có | Có | Không | Xem của mình |
| Tạo và phát hành hoá đơn | Có | Có | Có | Không | Xem của mình |
| Huỷ hoá đơn đã phát hành | Có | Có | Không | Không | Không |
| Ghi nhận thanh toán | Có | Có | Có | Không | Không |
| Tạo yêu cầu sửa chữa | Có | Có | Có | Không | Có |
| Xử lý yêu cầu sửa chữa | Có | Có | Có | Có (việc được giao) | Xác nhận của mình |
| Xem báo cáo tổng hợp nhiều toà | Có | Có | Không | Không | Không |
| Xem ảnh giấy tờ tuỳ thân | Không | Có | Có (toà được giao) | Không | Của mình |
| Xem nhật ký thao tác | Có | Có | Không | Không | Không |

### 2.4.3. Yêu cầu chức năng (Functional Requirements)

> **Quy ước:** `FR-<Mã module>-<số>`; cột "US" chỉ ra user story nguồn; cột "Ưu tiên" theo MoSCoW.

#### 2.4.3.1. Module AUT — Xác thực và phân quyền

**Bảng 2.16 — Yêu cầu chức năng module AUT — Xác thực và phân quyền**

| Mã | Mô tả yêu cầu | US | Ưu tiên |
|---|---|---|---|
| FR-AUT-01 | Hệ thống phải cho phép người dùng đăng nhập bằng số điện thoại và mật khẩu | US-01 | M |
| FR-AUT-02 | Hệ thống phải khoá tạm thời việc đăng nhập sau 5 lần thất bại liên tiếp trong 15 phút | US-01 | M |
| FR-AUT-03 | Hệ thống phải cho phép đặt lại mật khẩu qua mã xác thực một lần có hiệu lực 5 phút | US-01 | M |
| FR-AUT-04 | Hệ thống phải hỗ trợ 5 vai trò: Quản trị hệ thống, Chủ sở hữu, Quản lý toà nhà, Thợ sửa chữa, Người thuê | US-02 | M |
| FR-AUT-05 | Hệ thống phải giới hạn dữ liệu mà người dùng truy cập được theo danh sách toà nhà được gán cho họ | US-02 | M |
| FR-AUT-06 | Hệ thống phải cho phép tạo, sửa, khoá tài khoản; không cho xoá tài khoản đã phát sinh dữ liệu | US-03 | M |
| FR-AUT-07 | Hệ thống phải chấm dứt hiệu lực phiên đăng nhập của người dùng bị thu hồi quyền trong tối đa 5 phút | US-02 | S |

#### 2.4.3.2. Module BLD — Toà nhà, phòng, dịch vụ

**Bảng 2.17 — Yêu cầu chức năng module BLD — Toà nhà, phòng, dịch vụ**

| Mã | Mô tả yêu cầu | US | Ưu tiên |
|---|---|---|---|
| FR-BLD-01 | Hệ thống phải cho phép khai báo nhiều toà nhà, mỗi toà có: tên, địa chỉ, số tầng, ngày chốt số, hạn thanh toán, thông tin tài khoản ngân hàng nhận tiền | US-04 | M |
| FR-BLD-02 | Hệ thống phải cho phép khai báo tầng và phòng, mỗi phòng có: số phòng, diện tích, sức chứa tối đa, giá thuê mặc định, loại phòng, trạng thái | US-05 | M |
| FR-BLD-03 | Hệ thống phải hiển thị sơ đồ phòng theo tầng, phân biệt trạng thái bằng màu sắc và nhãn chữ | US-05 | M |
| FR-BLD-04 | Hệ thống phải tự động cập nhật trạng thái phòng theo hợp đồng hiệu lực | US-05 | M |
| FR-BLD-05 | Hệ thống phải cho phép khai báo dịch vụ với 4 cách tính: theo chỉ số, cố định theo phòng, theo đầu người, theo số lượng | US-06 | M |
| FR-BLD-06 | Hệ thống phải lưu đơn giá dịch vụ kèm ngày hiệu lực và giữ nguyên đơn giá đã dùng trên hoá đơn đã phát hành | US-06 | M |
| FR-BLD-07 | Hệ thống phải hỗ trợ hai chế độ tính tiền điện: đơn giá cố định theo hợp đồng và biểu giá bậc thang theo quy định Nhà nước | US-06 | M |
| FR-BLD-08 | Hệ thống phải cho phép cập nhật biểu giá điện bậc thang khi Nhà nước điều chỉnh, có ngày hiệu lực | US-06 | S |
| FR-BLD-09 | Hệ thống phải cho phép quản lý tài sản bàn giao trong phòng kèm tình trạng và ảnh | US-07 | C |

#### 2.4.3.3. Module TNT — Người thuê và hợp đồng

**Bảng 2.18 — Yêu cầu chức năng module TNT — Người thuê và hợp đồng**

| Mã | Mô tả yêu cầu | US | Ưu tiên |
|---|---|---|---|
| FR-TNT-01 | Hệ thống phải lưu hồ sơ người thuê gồm: họ tên, ngày sinh, số điện thoại, số giấy tờ tuỳ thân, quê quán, ảnh giấy tờ | US-08 | M |
| FR-TNT-02 | Hệ thống phải cho phép khai báo danh sách người ở cùng của mỗi hợp đồng | US-08 | M |
| FR-TNT-03 | Hệ thống phải cảnh báo khi tổng số người ở vượt sức chứa tối đa của phòng | US-08 | S |
| FR-TNT-04 | Hệ thống phải cho phép tạo hợp đồng thuê với đầy đủ điều khoản: thời hạn, giá thuê, tiền cọc, chu kỳ thanh toán, danh sách dịch vụ áp dụng | US-09 | M |
| FR-TNT-05 | Hệ thống phải ngăn việc tạo hai hợp đồng có hiệu lực chồng lấn trên cùng một phòng | US-09 | M |
| FR-TNT-06 | Hệ thống phải sinh bản hợp đồng dạng PDF theo mẫu cấu hình sẵn | US-09 | S |
| FR-TNT-07 | Hệ thống phải cho phép gia hạn hợp đồng, kế thừa điều khoản của hợp đồng cũ | US-10 | S |
| FR-TNT-08 | Hệ thống phải hỗ trợ quy trình thanh lý hợp đồng gồm: chốt chỉ số cuối, tính hoá đơn kỳ cuối, quyết toán tiền cọc | US-11 | M |
| FR-TNT-09 | Hệ thống phải tính và hiển thị số tiền cọc hoàn lại theo BR-07 | US-11 | M |
| FR-TNT-10 | Hệ thống phải cho phép đăng ký phương tiện của phòng để tính phí gửi xe | US-12 | C |
| FR-TNT-11 | Hệ thống phải theo dõi trạng thái khai báo lưu trú của từng người ở và xuất được danh sách cư trú | US-36 | S |

#### 2.4.3.4. Module MTR — Ghi chỉ số dịch vụ

**Bảng 2.19 — Yêu cầu chức năng module MTR — Ghi chỉ số dịch vụ**

| Mã | Mô tả yêu cầu | US | Ưu tiên |
|---|---|---|---|
| FR-MTR-01 | Hệ thống phải hiển thị màn hình nhập chỉ số theo danh sách phòng, sắp xếp theo tầng và số phòng, hiển thị chỉ số kỳ trước bên cạnh ô nhập | US-13 | M |
| FR-MTR-02 | Hệ thống phải tính và hiển thị ngay mức tiêu thụ khi người dùng nhập chỉ số mới | US-13 | M |
| FR-MTR-03 | Hệ thống phải từ chối lưu khi chỉ số mới nhỏ hơn chỉ số kỳ trước, trừ trường hợp khai báo thay công tơ | US-13 | M |
| FR-MTR-04 | Hệ thống phải cảnh báo khi mức tiêu thụ vượt 150% trung bình ba kỳ gần nhất của cùng phòng | US-13 | S |
| FR-MTR-05 | Hệ thống phải giữ dữ liệu đã nhập trên thiết bị khi mất kết nối và tự đồng bộ khi có mạng trở lại | US-13 | S |
| FR-MTR-06 | Hệ thống phải cho phép đính kèm ảnh công tơ cho mỗi lần ghi chỉ số | US-14 | M |
| FR-MTR-07 | Hệ thống phải cho phép bật tuỳ chọn bắt buộc ảnh công tơ theo từng toà nhà | US-14 | S |
| FR-MTR-08 | Hệ thống phải hiển thị danh sách phòng chưa ghi chỉ số trước khi cho phép chốt kỳ | US-13 | M |
| FR-MTR-09 | Hệ thống phải hỗ trợ khai báo thay công tơ và tính tiêu thụ theo BR-09 | US-15 | S |
| FR-MTR-10 | Hệ thống phải khoá không cho sửa chỉ số của kỳ đã phát hành hoá đơn, trừ vai trò Chủ sở hữu và phải ghi nhật ký | US-13 | M |

#### 2.4.3.5. Module INV — Hoá đơn và thanh toán

**Bảng 2.20 — Yêu cầu chức năng module INV — Hoá đơn và thanh toán**

| Mã | Mô tả yêu cầu | US | Ưu tiên |
|---|---|---|---|
| FR-INV-01 | Hệ thống phải tạo hoá đơn hàng loạt cho toàn bộ phòng có hợp đồng hiệu lực trong một kỳ | US-16 | M |
| FR-INV-02 | Hệ thống phải tính hoá đơn theo các quy tắc nghiệp vụ BR-01 đến BR-08 | US-16 | M |
| FR-INV-03 | Hệ thống phải bỏ qua và báo rõ các phòng chưa đủ dữ liệu chỉ số, không làm gián đoạn việc tạo hoá đơn cho phòng khác | US-16 | M |
| FR-INV-04 | Hệ thống phải ngăn việc tạo hai hoá đơn cho cùng một phòng trong cùng một kỳ | US-16 | M |
| FR-INV-05 | Hệ thống phải cho phép sửa hoá đơn ở trạng thái Nháp, gồm thêm khoản phát sinh và khoản giảm trừ kèm lý do | US-17 | M |
| FR-INV-06 | Hệ thống phải cấm sửa trực tiếp hoá đơn đã phát hành; chỉ cho huỷ có lý do và phát hành hoá đơn thay thế | US-17 | M |
| FR-INV-07 | Hệ thống phải sinh mã hoá đơn duy nhất theo định dạng `<Mã toà>-<Số phòng>-<YYYYMM>` | US-18 | M |
| FR-INV-08 | Hệ thống phải phát hành hoá đơn hàng loạt và gửi thông báo tới người thuê | US-18 | M |
| FR-INV-09 | Hệ thống phải xuất hoá đơn dạng PDF/ảnh để in hoặc gửi qua kênh chat | US-18 | S |
| FR-INV-10 | Hệ thống phải hiển thị mã QR chuyển khoản chứa sẵn số tài khoản, số tiền và nội dung là mã hoá đơn | US-19 | S |
| FR-INV-11 | Hệ thống phải cho phép ghi nhận nhiều lần thanh toán trên một hoá đơn, hỗ trợ thanh toán một phần | US-20 | M |
| FR-INV-12 | Hệ thống phải tự cập nhật trạng thái hoá đơn theo BR-08 | US-20 | M |
| FR-INV-13 | Hệ thống phải sinh biên lai có mã cho mỗi lần ghi nhận thanh toán | US-20 | S |
| FR-INV-14 | Hệ thống phải cấm xoá bản ghi thanh toán; điều chỉnh chỉ thực hiện bằng bút toán đối ứng có lý do | US-20 | M |
| FR-INV-15 | Hệ thống phải cho phép tải lên file sao kê và đề xuất khớp giao dịch với hoá đơn, việc ghi nhận cần người dùng xác nhận | US-21 | C |
| FR-INV-16 | Hệ thống phải chuyển phần tiền thừa của một hoá đơn thành số dư khả dụng trừ vào kỳ sau | US-20 | S |

#### 2.4.3.6. Module MNT — Sự cố và bảo trì

**Bảng 2.21 — Yêu cầu chức năng module MNT — Sự cố và bảo trì**

| Mã | Mô tả yêu cầu | US | Ưu tiên |
|---|---|---|---|
| FR-MNT-01 | Hệ thống phải cho phép người thuê tạo yêu cầu sửa chữa kèm hạng mục, mô tả, mức độ và tối đa 5 ảnh | US-22 | M |
| FR-MNT-02 | Hệ thống phải sinh mã yêu cầu và thông báo tới quản lý toà nhà tương ứng | US-22 | M |
| FR-MNT-03 | Hệ thống phải quản lý yêu cầu theo vòng đời trạng thái quy định tại BR-16 | US-23 | M |
| FR-MNT-04 | Hệ thống phải cho phép phân công yêu cầu cho thợ sửa chữa và gửi thông báo cho người được phân công | US-23 | M |
| FR-MNT-05 | Hệ thống phải cho phép ghi nhận chi phí sửa chữa và bên chịu chi phí | US-23 | S |
| FR-MNT-06 | Hệ thống phải tự tạo khoản phát sinh vào hoá đơn kỳ kế tiếp khi bên chịu chi phí là người thuê | US-23 | S |
| FR-MNT-07 | Hệ thống phải tự đóng yêu cầu sau 72 giờ nếu người thuê không phản hồi ở trạng thái Chờ xác nhận | US-23 | C |
| FR-MNT-08 | Hệ thống phải cung cấp lịch sử sửa chữa và tổng chi phí bảo trì theo phòng, theo toà, theo hạng mục | US-24 | S |
| FR-MNT-09 | Hệ thống phải cảnh báo khi một phòng có từ 3 sự cố cùng hạng mục trong 6 tháng | US-24 | C |

#### 2.4.3.7. Module NTF — Thông báo và nhắc việc

**Bảng 2.22 — Yêu cầu chức năng module NTF — Thông báo và nhắc việc**

| Mã | Mô tả yêu cầu | US | Ưu tiên |
|---|---|---|---|
| FR-NTF-01 | Hệ thống phải hiển thị bảng nhắc việc trên màn hình chính của quản lý gồm ít nhất 5 nhóm việc | US-25 | S |
| FR-NTF-02 | Hệ thống phải cho phép soạn và gửi thông báo chung theo phạm vi toà / tầng / phòng được chọn | US-26 | S |
| FR-NTF-03 | Hệ thống phải ghi nhận và hiển thị danh sách phòng đã xem thông báo | US-26 | C |
| FR-NTF-04 | Hệ thống phải tự gửi nhắc thanh toán ở các mốc: trước hạn 3 ngày, quá hạn 1 ngày, quá hạn 5 ngày | US-27 | S |
| FR-NTF-05 | Hệ thống phải huỷ các nhắc nhở còn lại khi hoá đơn đã được thanh toán đủ | US-27 | S |
| FR-NTF-06 | Hệ thống phải cho phép bật/tắt và cấu hình mốc nhắc theo từng toà nhà | US-27 | C |
| FR-NTF-07 | Hệ thống phải gửi thông báo trong ứng dụng; kênh ngoài (email/chat) là tuỳ chọn mở rộng | US-18, US-27 | S |

#### 2.4.3.8. Module POR — Cổng người thuê

**Bảng 2.23 — Yêu cầu chức năng module POR — Cổng người thuê**

| Mã | Mô tả yêu cầu | US | Ưu tiên |
|---|---|---|---|
| FR-POR-01 | Hệ thống phải hiển thị hoá đơn kỳ gần nhất ngay khi người thuê đăng nhập | US-28 | M |
| FR-POR-02 | Hệ thống phải hiển thị chi tiết từng khoản mục kèm chỉ số đầu kỳ, cuối kỳ, mức tiêu thụ, đơn giá, thành tiền | US-28 | M |
| FR-POR-03 | Hệ thống phải cho phép người thuê tra cứu tối thiểu 12 kỳ hoá đơn gần nhất | US-28 | M |
| FR-POR-04 | Hệ thống phải bảo đảm người thuê chỉ truy cập được dữ liệu của phòng mình | US-28 | M |
| FR-POR-05 | Hệ thống phải hiển thị biểu đồ tiêu thụ điện, nước theo 12 kỳ gần nhất | US-29 | S |
| FR-POR-06 | Hệ thống phải cho người thuê xem ảnh công tơ tương ứng từng kỳ | US-14, US-29 | M |
| FR-POR-07 | Hệ thống phải hiển thị thông tin hợp đồng và cảnh báo khi còn dưới 30 ngày đến hạn | US-30 | S |
| FR-POR-08 | Hệ thống phải cho phép người thuê gửi yêu cầu gia hạn hoặc trả phòng, ghi nhận thời điểm gửi | US-31 | C |
| FR-POR-09 | Hệ thống phải duy trì quyền xem chỉ đọc trong 90 ngày sau khi hợp đồng thanh lý | US-11, US-28 | C |

#### 2.4.3.9. Module RPT — Báo cáo

**Bảng 2.24 — Yêu cầu chức năng module RPT — Báo cáo**

| Mã | Mô tả yêu cầu | US | Ưu tiên |
|---|---|---|---|
| FR-RPT-01 | Hệ thống phải cung cấp màn hình tổng quan tổng hợp mọi toà: doanh thu phát hành, đã thu, công nợ, tỷ lệ lấp đầy, số phòng trống, số sự cố đang mở | US-32 | M |
| FR-RPT-02 | Hệ thống phải cho phép lọc mọi báo cáo theo toà nhà và khoảng thời gian | US-32 | M |
| FR-RPT-03 | Hệ thống phải cung cấp báo cáo công nợ sắp xếp theo số ngày quá hạn giảm dần | US-33 | M |
| FR-RPT-04 | Hệ thống phải cho phép xuất báo cáo ra file Excel đúng với dữ liệu đang lọc | US-33 | S |
| FR-RPT-05 | Hệ thống phải cung cấp báo cáo tiêu thụ điện nước theo toà và theo phòng | US-29, US-34 | S |
| FR-RPT-06 | Hệ thống phải cho phép nhập chỉ số công tơ tổng và tính chênh lệch với tổng tiêu thụ các phòng | US-34 | C |
| FR-RPT-07 | Hệ thống phải cảnh báo khi tỷ lệ chênh lệch công tơ tổng vượt ngưỡng cấu hình (mặc định 10%) | US-34 | C |
| FR-RPT-08 | Hệ thống phải cung cấp báo cáo chi phí bảo trì theo toà, hạng mục và thời gian | US-24 | S |

#### 2.4.3.10. Module SEC — An toàn, tuân thủ, nhật ký

**Bảng 2.25 — Yêu cầu chức năng module SEC — An toàn, tuân thủ, nhật ký**

| Mã | Mô tả yêu cầu | US | Ưu tiên |
|---|---|---|---|
| FR-SEC-01 | Hệ thống phải cho phép lưu trữ hồ sơ PCCC của từng toà nhà dưới dạng tệp đính kèm có phân loại | US-35 | S |
| FR-SEC-02 | Hệ thống phải quản lý danh mục thiết bị PCCC kèm hạn kiểm định và nhắc trước 30 ngày | US-35 | S |
| FR-SEC-03 | Hệ thống phải tạo việc cần làm khi đến kỳ tự kiểm tra an toàn định kỳ và cho ghi nhận kết quả theo danh mục kiểm tra | US-35 | S |
| FR-SEC-04 | Hệ thống phải tự tạo yêu cầu xử lý mức Khẩn cấp khi có hạng mục kiểm tra không đạt | US-35 | C |
| FR-SEC-05 | Hệ thống phải ghi nhật ký mọi thao tác thuộc nhóm nhạy cảm, lưu giá trị trước và sau | US-37 | S |
| FR-SEC-06 | Hệ thống phải cho phép tra cứu nhật ký theo người dùng, loại thao tác, thời gian, đối tượng | US-37 | S |
| FR-SEC-07 | Hệ thống phải bảo đảm nhật ký là chỉ đọc, không thể sửa hoặc xoá bởi bất kỳ vai trò nào | US-37 | S |

**Tổng cộng: 93 yêu cầu chức năng** — trong đó 48 Must have, 33 Should have, 12 Could have.

### 2.4.4. Quy tắc nghiệp vụ (Business Rules)

> Đây là phần **quan trọng nhất** của tài liệu, vì mọi sai sót trong tính tiền đều bắt nguồn từ đây. Các quy tắc dưới đây là đầu vào trực tiếp cho việc lập trình và viết ca kiểm thử.

#### 2.4.4.1. Kỳ và chu kỳ tính phí

**BR-01 — Xác định kỳ hoá đơn**
Kỳ hoá đơn của toà nhà B tháng M là khoảng thời gian từ **ngày chốt số của tháng M-1** đến **ngày chốt số của tháng M**. Ngày chốt số mặc định là ngày 28, cấu hình được theo từng toà. Nếu tháng không có ngày chốt số đã cấu hình (ví dụ ngày 30 trong tháng 2), lấy ngày cuối cùng của tháng.

#### 2.4.4.2. Tính tiền dịch vụ theo chỉ số

**BR-02 — Mức tiêu thụ**
```
Mức tiêu thụ = Chỉ số cuối kỳ - Chỉ số đầu kỳ
```
Chỉ số đầu kỳ luôn bằng chỉ số cuối kỳ của kỳ liền trước. Với kỳ đầu tiên của một hợp đồng, chỉ số đầu kỳ lấy từ biên bản bàn giao phòng.

**BR-02a — Chế độ đơn giá cố định** (áp dụng mặc định)
```
Tiền dịch vụ = Mức tiêu thụ × Đơn giá theo hợp đồng
```

**BR-02b — Chế độ bậc thang theo giá Nhà nước**

Cơ cấu biểu giá bán lẻ điện sinh hoạt gồm **5 bậc**, theo Quyết định 14/2025/QĐ-TTg ngày 29/5/2025 của Thủ tướng Chính phủ. Điểm cần lưu ý về cách quy định: **mỗi bậc được định nghĩa bằng một tỷ lệ phần trăm của giá bán lẻ điện bình quân, không phải bằng một số tiền cố định.** Đơn giá thực tế của từng bậc do đó thay đổi mỗi khi giá bình quân được điều chỉnh, trong khi tỷ lệ phần trăm giữ nguyên.

*Đơn giá dưới đây đã kiểm chứng lại ngày 23/08/2026 — vẫn là mức hiện hành theo Quyết định 1279/QĐ-BCT.*

**Bảng 2.26 — Cơ cấu biểu giá bán lẻ điện sinh hoạt 5 bậc (BR-02b)**

| Bậc | Sản lượng (kWh) | Tỷ lệ so với giá bình quân | Đơn giá hiện hành (đ/kWh, chưa VAT) |
|---|---|---|---|
| 1 | 0 – 100 | 90 % | 1.984 |
| 2 | 101 – 200 | 108 % | 2.380 |
| 3 | 201 – 400 | 136 % | 2.998 |
| 4 | 401 – 700 | 162 % | 3.571 |
| 5 | từ 701 trở lên | 180 % | 3.967 |

Cột đơn giá trong bảng được tính từ giá bán lẻ điện bình quân **2.204,0655 đ/kWh** theo Quyết định 1279/QĐ-BCT ngày 09/5/2025 của Bộ Công Thương, hiệu lực từ 10/5/2025.

```
Tiền điện = Σ (sản lượng thuộc bậc i × đơn giá bậc i)
Đơn giá bậc i = Giá bán lẻ điện bình quân × Tỷ lệ bậc i
```

Biểu giá phải được lưu kèm ngày hiệu lực vì Nhà nước điều chỉnh giá bình quân theo chu kỳ; hoá đơn đã phát hành giữ nguyên biểu giá tại thời điểm phát hành (xem NFR-CMP-02).

> **Ghi chú thực hiện.** Do bậc giá được quy định theo tỷ lệ, hệ thống nên lưu **cả tỷ lệ lẫn đơn giá đã quy đổi** cho mỗi bậc. Lưu tỷ lệ cho phép cập nhật toàn bộ biểu giá chỉ bằng một thao tác khi giá bình quân đổi; lưu đơn giá đã quy đổi bảo đảm hoá đơn cũ in lại vẫn ra đúng số cũ.

**BR-02c — Định mức theo số người thuê**
Khi áp dụng chế độ bậc thang cho phòng cho thuê: cứ **4 người được tính là 1 hộ**, tức là định mức của mỗi bậc được nhân với số hộ quy đổi:
```
Số hộ quy đổi = làm tròn lên (Số người ở thực tế ÷ 4)
Định mức bậc i (cho phòng) = Định mức bậc i (chuẩn) × Số hộ quy đổi
```
Nếu không xác định được số người ở thực tế, áp dụng đơn giá của **bậc 3** cho toàn bộ sản lượng. Hệ thống phải lưu số người ở thực tế của từng phòng **theo từng kỳ**, vì con số này thay đổi theo thời gian.

**BR-03 — Tiền nước**
Hỗ trợ hai cách tính, chọn theo hợp đồng:

- *Theo chỉ số:* `Tiền nước = (Chỉ số cuối - Chỉ số đầu) × Đơn giá m³`
- *Theo đầu người:* `Tiền nước = Số người ở × Đơn giá/người/tháng`

#### 2.4.4.3. Các khoản phí khác

**BR-04 — Phí cố định**
Các khoản như rác, internet, phí quản lý, thang máy được tính **trọn kỳ**, không chia theo ngày, kể cả khi người thuê chỉ ở một phần kỳ — trừ khi hợp đồng ghi rõ khác.

**BR-05 — Phí gửi xe**
```
Phí gửi xe = Σ (Số xe loại k đang đăng ký tại thời điểm chốt kỳ × Đơn giá loại k)
```
Xe đăng ký thêm giữa kỳ được tính tròn kỳ kể từ kỳ đăng ký.

**BR-06 — Chia tiền phòng theo ngày (pro-rata)**
Khi người thuê vào ở hoặc trả phòng giữa kỳ:
```
Tiền phòng = Giá thuê tháng ÷ Số ngày của kỳ × Số ngày ở thực tế
```
Trong đó *Số ngày của kỳ* là số ngày thực tế giữa hai mốc chốt số. Ngày vào ở được tính là một ngày ở; ngày trả phòng không tính. Dòng khoản mục trên hoá đơn phải ghi rõ tỷ lệ, ví dụ `Tiền phòng (12/31 ngày)`.

**BR-07 — Tiền cọc và quyết toán**

- Tiền cọc thu một lần khi ký hợp đồng, **không** là một dòng trong hoá đơn kỳ, mà là một khoản mục riêng.
- Khi thanh lý hợp đồng:
```
Số tiền hoàn lại = Tiền cọc đã thu - Công nợ còn lại - Khấu trừ hư hỏng
```

- Nếu kết quả âm, hệ thống tạo một khoản phải thu bổ sung thay vì hoàn tiền.

#### 2.4.4.4. Ràng buộc dữ liệu và vòng đời

**BR-08 — Vòng đời trạng thái hoá đơn**
```
Nháp --phát hành--> Đã phát hành --thu một phần--> Đã thu một phần --thu đủ--> Đã thanh toán
                          |                              |
                          +------ quá hạn thanh toán ----+------> Quá hạn
                          |
                          +---- huỷ (có lý do) ----> Đã huỷ
```

- Chỉ hoá đơn ở trạng thái **Nháp** mới được sửa nội dung.
- Chỉ vai trò Chủ sở hữu mới được huỷ hoá đơn đã phát hành, bắt buộc nhập lý do, thao tác được ghi nhật ký.
- Hoá đơn ở trạng thái **Đã thanh toán** không thể quay lại trạng thái trước đó.

**BR-09 — Kiểm tra tính hợp lệ của chỉ số**

- Chỉ số mới **≥** chỉ số kỳ trước. Vi phạm → chặn lưu.
- Trường hợp thay công tơ: `Mức tiêu thụ = (Chỉ số cuối công tơ cũ - Chỉ số đầu kỳ) + (Chỉ số cuối kỳ - Chỉ số đầu công tơ mới)`.
- Cảnh báo (không chặn) khi `Mức tiêu thụ > 1,5 × trung bình 3 kỳ gần nhất` của cùng phòng.

**BR-10 — Ràng buộc hợp đồng**

- Một phòng tại một thời điểm chỉ có tối đa **một** hợp đồng ở trạng thái hiệu lực.
- Ngày bắt đầu < ngày kết thúc.
- Số người ở (kể cả người ở cùng) không vượt sức chứa tối đa của phòng; vượt thì cảnh báo và yêu cầu ghi lý do.

**BR-11 — Trạng thái phòng**
Trạng thái phòng được suy ra tự động từ dữ liệu, không cho sửa tay:

- Có hợp đồng hiệu lực → *Đang thuê*
- Có hợp đồng đã đặt cọc nhưng chưa đến ngày bắt đầu → *Đã đặt cọc*
- Có yêu cầu sửa chữa mức Khẩn cấp đang mở và quản lý đánh dấu ngừng cho thuê → *Đang sửa chữa*
- Còn lại → *Trống*

> **Ghi chú theo phiếu CR-005.** Để suy ra được trạng thái *Đã đặt cọc*, tập giá trị trạng thái của **hợp đồng** phải có giá trị biểu diễn tình trạng đã nhận cọc mà chưa tới ngày bắt đầu. Mô hình dữ liệu phiên bản 1.0 không có giá trị đó, khiến quy tắc này không thực hiện được; phiếu CR-005 bổ sung hai giá trị `Chờ ký` và `Đã cọc`.
>
> **Ghi chú theo phiếu CR-012.** Trạng thái phòng vẫn được **lưu thành một cột** trong cơ sở dữ liệu, nhưng cột đó là **giá trị đệm** phục vụ hiển thị nhanh sơ đồ phòng ở FR-BLD-05, chỉ hệ thống được ghi, người dùng không sửa tay. Nguồn sự thật vẫn là dữ liệu hợp đồng và yêu cầu sửa chữa. Cần có kiểm thử đối chiếu giá trị đệm với giá trị tính lại từ dữ liệu gốc.

**BR-12 — Xác định quá hạn**
Hoá đơn chuyển sang *Quá hạn* khi `Ngày hiện tại > Hạn thanh toán` và `Số tiền đã thu < Tổng phải thu`. Hạn thanh toán mặc định = ngày phát hành + số ngày cấu hình theo toà (mặc định 5 ngày).

**BR-13 — Số dư khả dụng**
Phần tiền thu vượt quá hoá đơn được ghi nhận thành số dư khả dụng của phòng và **tự động trừ vào hoá đơn kỳ kế tiếp** trước khi tính số phải thu.

**BR-14 — Nhắc hợp đồng hết hạn**
Hợp đồng có `Ngày kết thúc - Ngày hiện tại ≤ 30 ngày` xuất hiện trên bảng nhắc việc của quản lý và trên cổng người thuê.

> **Ghi chú theo phiếu CR-012.** "Sắp hết hạn" **không phải một trạng thái của hợp đồng** mà là một cách nhìn hợp đồng đang hiệu lực dưới góc độ thời gian: giá trị của nó thay đổi theo ngày ngay cả khi không ai động vào dữ liệu. Vì vậy nó được thực hiện bằng điều kiện truy vấn, **không lưu thành một giá trị trong cột trạng thái**. Nếu lưu, hệ thống sẽ cần một tác vụ chạy hằng ngày quét lại toàn bộ hợp đồng, và tác vụ đó lỗi một hôm thì dữ liệu sai mà không ai biết.

**BR-15 — Làm tròn**
Mọi khoản mục được tính chính xác đến đồng, tổng cộng hoá đơn được **làm tròn đến 1.000 đồng** theo quy tắc làm tròn nửa lên. Phần chênh lệch do làm tròn ghi vào dòng "Làm tròn".

> **Lưu ý khi cài đặt.** "Làm tròn đến 1.000 đồng theo quy tắc nửa lên" **khác với** "làm tròn lên đến 1.000 đồng". Ví dụ 1.887.200 đồng: quy tắc nửa lên cho 1.887.000 đồng, còn làm tròn lên cho 1.888.000 đồng. Quy tắc áp dụng ở đây là **nửa lên**. Phần chênh lệch ở dòng "Làm tròn" do đó có thể **mang dấu âm**, nên trường số tiền của dòng chi tiết không được đặt ràng buộc phải dương.

**BR-16 — Vòng đời yêu cầu sửa chữa**
```
Mới tiếp nhận -> Đã tiếp nhận -> Đã phân công -> Đang xử lý -> Chờ xác nhận -> Đã đóng
      |                                                              |
      +--- Đã huỷ (từ bất kỳ trạng thái nào trước Đã đóng, kèm lý do) +
```
Tự động chuyển từ *Chờ xác nhận* sang *Đã đóng* sau 72 giờ không phản hồi.

**BR-17 — Bảo mật dữ liệu cá nhân**
Ảnh giấy tờ tuỳ thân chỉ hiển thị cho Chủ sở hữu và Quản lý của chính toà nhà đó. Mọi lượt xem đều ghi nhật ký. Ảnh không được đặt ở đường dẫn công khai đoán được.

**BR-18 — Không xoá dữ liệu tài chính**
Hoá đơn đã phát hành, bản ghi thanh toán và nhật ký thao tác **không bao giờ bị xoá vật lý**, chỉ đánh dấu trạng thái hoặc bù trừ bằng bút toán đối ứng.

**BR-19 — Ngưỡng thất thoát điện nước**
```
Tỷ lệ chênh lệch = (Chỉ số công tơ tổng - Σ tiêu thụ các phòng - Tiêu thụ khu vực chung) ÷ Chỉ số công tơ tổng
```
Vượt ngưỡng cấu hình (mặc định 10%) → cảnh báo trên báo cáo.

**BR-20 — Chu kỳ tuân thủ an toàn**
Toà nhà có lịch tự kiểm tra an toàn PCCC theo chu kỳ cấu hình (mặc định 6 tháng), báo cáo định kỳ hằng năm. Thiết bị PCCC có hạn kiểm định; hệ thống nhắc trước 30 ngày.

#### 2.4.4.5. Ví dụ minh hoạ tính hoá đơn

*Phòng 305, toà A. Kỳ 28/07 – 28/08/2026 (31 ngày). Giá thuê 3.500.000 đ/tháng. Người thuê dọn vào ngày 17/08 → ở 12 ngày. Điện: chỉ số 1.240 → 1.298 (58 kWh), đơn giá cố định 3.500 đ. Nước: 210 → 214 (4 m³), đơn giá 25.000 đ. Rác 30.000 đ. Internet 100.000 đ. Gửi xe 1 xe máy 100.000 đ.*

**Bảng 2.27 — Ví dụ minh hoạ tính hoá đơn một phòng**

| Khoản mục | Diễn giải | Thành tiền |
|---|---|---|
| Tiền phòng | 3.500.000 ÷ 31 × 12 ngày | 1.354.839 |
| Tiền điện | (1.298 - 1.240) × 3.500 | 203.000 |
| Tiền nước | (214 - 210) × 25.000 | 100.000 |
| Phí rác | trọn kỳ (BR-04) | 30.000 |
| Internet | trọn kỳ (BR-04) | 100.000 |
| Gửi xe | 1 xe × 100.000 | 100.000 |
| **Cộng** | | **1.887.839** |
| Làm tròn | đến 1.000 đ (BR-15) | +161 |
| **Tổng phải thu** | | **1.888.000** |

### 2.4.5. Yêu cầu phi chức năng (Non-Functional Requirements)

#### 2.4.5.1. Hiệu năng (Performance)

**Bảng 2.28 — Yêu cầu phi chức năng — Hiệu năng**

| Mã | Yêu cầu | Cách đo |
|---|---|---|
| NFR-PER-01 | Thời gian phản hồi của các thao tác tra cứu thông thường ≤ 2 giây với 95% số lần gọi | Đo bằng công cụ kiểm thử tải, tập dữ liệu 5 toà × 50 phòng × 24 kỳ |
| NFR-PER-02 | Tạo hoá đơn hàng loạt cho một toà 50 phòng hoàn tất trong ≤ 10 giây | Bấm giờ trên tập dữ liệu mẫu |
| NFR-PER-03 | Màn hình tổng quan tải xong trong ≤ 3 giây trên mạng 4G | Đo bằng công cụ đo hiệu năng trình duyệt |
| NFR-PER-04 | Hệ thống phục vụ đồng thời tối thiểu 50 người dùng mà thời gian phản hồi không tăng quá 50% | Kiểm thử tải 50 người dùng ảo |
| NFR-PER-05 | Ảnh công tơ được nén xuống ≤ 500 KB trước khi lưu, vẫn đọc rõ chỉ số | Kiểm tra thủ công trên 20 ảnh mẫu |

#### 2.4.5.2. Khả dụng và trải nghiệm (Usability)

**Bảng 2.29 — Yêu cầu phi chức năng — Khả dụng và trải nghiệm**

| Mã | Yêu cầu | Cách đo |
|---|---|---|
| NFR-USA-01 | Toàn bộ giao diện hiển thị đúng trên màn hình rộng từ 360 px (điện thoại) đến 1920 px | Kiểm tra trên 5 kích thước màn hình |
| NFR-USA-02 | Người quản lý mới, sau 15 phút hướng dẫn, phải ghi xong chỉ số cho 30 phòng mà không cần trợ giúp | Kiểm thử khả dụng với 3 người dùng thử |
| NFR-USA-03 | Mọi nút thao tác chính trên giao diện điện thoại có kích thước tối thiểu 44×44 px | Kiểm tra thiết kế |
| NFR-USA-04 | Toàn bộ nhãn, thông báo lỗi bằng tiếng Việt có dấu, diễn đạt theo ngôn ngữ nghiệp vụ của người dùng, không hiển thị mã lỗi kỹ thuật | Rà soát danh sách thông báo |
| NFR-USA-05 | Mọi thao tác xoá hoặc không thể hoàn tác phải có bước xác nhận nêu rõ hậu quả | Rà soát thiết kế |
| NFR-USA-06 | Định dạng số tiền theo chuẩn Việt Nam (dấu chấm phân cách hàng nghìn, hậu tố đ) và ngày theo dd/MM/yyyy | Rà soát giao diện |

#### 2.4.5.3. Bảo mật (Security)

**Bảng 2.30 — Yêu cầu phi chức năng — Bảo mật**

| Mã | Yêu cầu | Cách đo |
|---|---|---|
| NFR-SEC-01 | Mật khẩu lưu dưới dạng băm có muối bằng thuật toán chuyên dụng (bcrypt/Argon2), không lưu bản rõ | Kiểm tra cơ sở dữ liệu |
| NFR-SEC-02 | Toàn bộ kết nối dùng HTTPS; không truyền dữ liệu nhạy cảm qua HTTP | Kiểm tra cấu hình |
| NFR-SEC-03 | Kiểm soát truy cập theo vai trò được thực thi ở **phía máy chủ**, không chỉ ẩn nút trên giao diện | Kiểm thử bằng cách gọi trực tiếp API với tài khoản không đủ quyền |
| NFR-SEC-04 | Ảnh giấy tờ tuỳ thân lưu ở vùng không truy cập công khai, chỉ phát qua liên kết có thời hạn ≤ 15 phút | Kiểm thử truy cập trực tiếp |
| NFR-SEC-05 | Hệ thống chống được các lỗ hổng phổ biến: chèn câu lệnh SQL, XSS, giả mạo yêu cầu (CSRF), tham chiếu đối tượng trực tiếp không kiểm soát | Kiểm thử theo danh mục OWASP Top 10 |
| NFR-SEC-06 | Phiên đăng nhập tự hết hạn sau 30 phút không hoạt động trên khu vực quản trị | Kiểm thử thủ công |
| NFR-SEC-07 | Dữ liệu cá nhân chỉ thu thập ở mức cần thiết cho mục đích quản lý cư trú và hợp đồng; có thông báo rõ cho người thuê | Rà soát chính sách |

#### 2.4.5.4. Tin cậy và an toàn dữ liệu (Reliability)

**Bảng 2.31 — Yêu cầu phi chức năng — Tin cậy và an toàn dữ liệu**

| Mã | Yêu cầu | Cách đo |
|---|---|---|
| NFR-REL-01 | Sao lưu cơ sở dữ liệu tự động hằng ngày, giữ tối thiểu 30 bản gần nhất | Kiểm tra lịch sao lưu |
| NFR-REL-02 | Khôi phục dữ liệu từ bản sao lưu trong vòng 4 giờ (RTO), mất mát dữ liệu tối đa 24 giờ (RPO) | Diễn tập khôi phục 1 lần |
| NFR-REL-03 | Tỷ lệ sẵn sàng ≥ 99% trong khung giờ 6h–23h | Nhật ký giám sát |
| NFR-REL-04 | Thao tác tạo hoá đơn hàng loạt phải mang tính toàn vẹn: hoặc thành công cho một phòng, hoặc không tạo gì cho phòng đó — không để lại hoá đơn dở dang | Kiểm thử ngắt giữa chừng |
| NFR-REL-05 | Dữ liệu ghi chỉ số nhập khi mất mạng không được mất, tự đồng bộ khi có mạng | Kiểm thử ngắt mạng |

#### 2.4.5.5. Khả năng bảo trì và mở rộng (Maintainability & Scalability)

**Bảng 2.32 — Yêu cầu phi chức năng — Khả năng bảo trì và mở rộng**

| Mã | Yêu cầu |
|---|---|
| NFR-MNT-01 | Mã nguồn tổ chức theo module tương ứng các module chức năng ở mục 2.4.3, có tài liệu README hướng dẫn cài đặt |
| NFR-MNT-02 | Toàn bộ tham số nghiệp vụ (ngày chốt số, ngưỡng cảnh báo, số ngày hạn thanh toán, biểu giá) phải cấu hình được qua giao diện, **không** viết cứng trong mã |
| NFR-MNT-03 | Kiến trúc dữ liệu phải cho phép mở rộng sang mô hình nhiều chủ sở hữu về sau mà không phải thiết kế lại (mọi bảng nghiệp vụ đều truy về được `toa_nha`) |
| NFR-MNT-04 | Độ bao phủ kiểm thử tự động cho các hàm tính tiền đạt tối thiểu 80% |
| NFR-MNT-05 | Hệ thống chịu được quy mô 20 toà nhà × 50 phòng × 5 năm dữ liệu mà không phải thay đổi kiến trúc |

#### 2.4.5.6. Tương thích (Compatibility)

**Bảng 2.33 — Yêu cầu phi chức năng — Tương thích**

| Mã | Yêu cầu |
|---|---|
| NFR-COM-01 | Hoạt động đúng trên Chrome, Edge, Safari, Firefox phiên bản mới nhất và một phiên bản liền trước |
| NFR-COM-02 | Hoạt động tốt trên trình duyệt di động Android 10+ và iOS 15+ |
| NFR-COM-03 | Xuất được file Excel (.xlsx) và PDF mở được bằng phần mềm phổ thông |
| NFR-COM-04 | Hỗ trợ tiếng Việt có dấu ở mọi nơi, kể cả trong tên file xuất ra và mã QR |

#### 2.4.5.7. Tuân thủ pháp lý (Compliance)

**Bảng 2.34 — Yêu cầu phi chức năng — Tuân thủ pháp lý**

| Mã | Yêu cầu |
|---|---|
| NFR-CMP-01 | Chức năng tính tiền điện phải hỗ trợ đúng biểu giá Nhà nước và nguyên tắc định mức 4 người/hộ đối với nhà cho thuê |
| NFR-CMP-02 | Hệ thống lưu vết đơn giá và biểu giá đã áp dụng cho từng hoá đơn để phục vụ giải trình khi bị kiểm tra |
| NFR-CMP-03 | Việc lưu trữ thông tin nhân thân người thuê phải có sự đồng ý của người thuê, có cơ chế xoá theo yêu cầu sau khi hết nghĩa vụ lưu trữ |
| NFR-CMP-04 | Hệ thống không tự động gửi dữ liệu cá nhân tới bên thứ ba |

### 2.4.6. Ràng buộc và giả định

**Bảng 2.35 — Ràng buộc của dự án (Constraints)**

| Mã | Nội dung |
|---|---|
| C-01 | Thời gian thực hiện đồ án: một học kỳ; nhóm 4 người, đều là sinh viên chưa có kinh nghiệm dự án thực tế |
| C-02 | Nhóm tự chi trả một máy chủ riêng ảo để triển khai và một tên miền phục vụ chứng chỉ bảo mật. Không sử dụng dịch vụ đám mây tính phí theo lưu lượng. *(Sửa theo phiếu CR-014 — xem ghi chú bên dưới.)* |
| C-03 | Không tích hợp được cổng thanh toán và VNeID do yêu cầu pháp nhân doanh nghiệp |
| C-04 | Không tiếp cận được người dùng thật để phỏng vấn trong giai đoạn này |
| C-05 | Sản phẩm là ứng dụng web, không phát triển ứng dụng di động native |
| C-06 | Ngôn ngữ giao diện: tiếng Việt |

**Bảng 2.36 — Giả định của dự án (Assumptions)**

| Mã | Nội dung | Rủi ro nếu sai |
|---|---|---|
| A-01 | Mỗi phòng có công tơ điện và đồng hồ nước riêng | Nếu dùng chung công tơ, mô hình tính tiền theo chỉ số không áp dụng được → cần bổ sung cách chia theo đầu người |
| A-02 | Người quản lý có điện thoại thông minh và mạng tại toà nhà | Nếu không, phải bổ sung chức năng nhập liệu ngoại tuyến đầy đủ hơn |
| A-03 | Người thuê có số điện thoại và dùng được trình duyệt web | Nếu không, cổng người thuê giảm giá trị → vẫn giữ kênh gửi ảnh hoá đơn |
| A-04 | Chủ sở hữu chấp nhận nhập liệu ban đầu (danh sách phòng, hợp đồng đang có) | Nếu không, cần chức năng nhập hàng loạt từ Excel |
| A-05 | Mỗi hệ thống chỉ phục vụ một chủ sở hữu | Nếu cần nhiều chủ, phải mở rộng theo NFR-MNT-03 |
| A-06 | Biểu giá điện Nhà nước có thể thay đổi trong thời gian dự án | Đã xử lý bằng cơ chế biểu giá theo ngày hiệu lực. **Giả định này đã xảy ra trên thực tế** — xem phiếu CR-015 |
| A-07 | Nhóm duy trì được máy chủ riêng ảo trong suốt thời gian đồ án và tới khi bảo vệ | Nếu máy chủ ngừng hoạt động, vẫn còn phương án chạy tại máy bằng Docker Compose (rủi ro R-12) |

> **Ghi chú về C-02.** Ràng buộc này ban đầu ghi *"không có ngân sách mua dịch vụ trả phí; phải dùng nền tảng miễn phí hoặc gói dùng thử"*. Nhóm đã sửa theo phiếu CR-014 sau khi khảo sát các phương án triển khai và phát hiện ba nhược điểm không chấp nhận được của gói miễn phí: cơ sở dữ liệu miễn phí thường bị thu hồi sau một số ngày cố định; máy chủ ứng dụng tự ngủ khi không có truy cập, gây chờ lâu ở lần truy cập đầu tiên; và **đĩa lưu trữ là đĩa tạm, mất toàn bộ tệp đã tải lên sau mỗi lần khởi động lại** — điều này phá vỡ trực tiếp yêu cầu lưu ảnh công tơ ở FR-MTR-06.

### 2.4.7. Giao diện với hệ thống ngoài

**Bảng 2.37 — Giao diện với hệ thống ngoài**

| Mã | Hệ thống ngoài | Hình thức | Mức ưu tiên |
|---|---|---|---|
| EXT-01 | Ứng dụng ngân hàng của người thuê | Mã QR theo chuẩn thanh toán phổ biến tại Việt Nam, chiều một chiều (hệ thống sinh mã) | S |
| EXT-02 | File sao kê ngân hàng | Nhập file CSV/Excel do người dùng tải lên | C |
| EXT-03 | Dịch vụ gửi thông báo (email hoặc chat) | Gọi API bên thứ ba, có thể tắt | S |
| EXT-04 | Máy in / thiết bị di động | Xuất PDF, ảnh | S |

## 2.5. Xác minh yêu cầu


### 2.5.1. Tiêu chí kiểm tra chất lượng yêu cầu

**Bảng 2.38 — Tiêu chí kiểm tra chất lượng yêu cầu**

| Tiêu chí | Câu hỏi kiểm tra | Kết quả tự đánh giá |
|---|---|---|
| **Đúng** | Yêu cầu có phản ánh đúng nhu cầu đã thu thập không? Mỗi FR có truy về được một phát hiện F1–F14 hoặc một tài liệu D1–D8 không? | Đạt — xem ma trận 7.3 |
| **Đầy đủ** | Có nhóm chức năng nào trong danh sách sơ bộ (mục 2.2.7) chưa được đặc tả không? | Đạt — 10/10 nhóm đều có FR tương ứng |
| **Nhất quán** | Có hai yêu cầu nào mâu thuẫn nhau không? | Đã phát hiện và xử lý 3 mâu thuẫn, xem 7.2 |
| **Rõ ràng, không nhập nhằng** | Có từ ngữ mơ hồ như "nhanh", "thân thiện", "dễ dùng" mà không kèm số đo không? | Đã thay bằng số đo trong NFR |
| **Khả thi** | Nhóm 4 sinh viên có làm được trong một học kỳ không? | Đạt với tập Must have; các mục Could have là dự phòng |
| **Có thể kiểm thử** | Mỗi yêu cầu có ít nhất một cách kiểm chứng khách quan không? | Đạt — mỗi US có AC, mỗi NFR có cột "Cách đo" |
| **Có thể truy vết** | Mỗi FR có mã, có liên kết ngược về US và xuôi tới ca kiểm thử không? | Đạt — xem 7.3 |

### 2.5.2. Mâu thuẫn và nhập nhằng đã phát hiện

**Bảng 2.39 — Mâu thuẫn và nhập nhằng đã phát hiện**

| # | Mâu thuẫn / nhập nhằng | Cách giải quyết |
|---|---|---|
| V1 | Chủ sở hữu muốn **khoá không cho sửa hoá đơn đã phát hành**, trong khi quản lý muốn **sửa được khi phát hiện nhầm chỉ số** | Giữ nguyên nguyên tắc khoá; bổ sung cơ chế **huỷ có lý do + phát hành hoá đơn thay thế**, chỉ Chủ sở hữu thực hiện, mọi thao tác ghi nhật ký (FR-INV-06, US-17) |
| V2 | Người thuê muốn **không phải đăng nhập**, còn yêu cầu bảo mật đòi **kiểm soát truy cập chặt** | Dùng đăng nhập một lần bằng số điện thoại + mã xác thực, ghi nhớ thiết bị 30 ngày — vừa nhẹ nhàng vừa có kiểm soát (US-01, FR-POR-04) |
| V3 | "Tính tiền điện theo giá Nhà nước" (yêu cầu tuân thủ) mâu thuẫn với thực tế **nhiều chủ trọ thu theo đơn giá cố định** | Không chọn một; hệ thống hỗ trợ **cả hai chế độ**, cấu hình theo hợp đồng, và lưu vết đơn giá đã áp dụng để giải trình (FR-BLD-07, BR-02a/b/c) |
| V4 | Yêu cầu "phí cố định tính trọn kỳ" (BR-04) mâu thuẫn cảm tính với "chia tiền theo ngày" (BR-06) | Làm rõ phạm vi: chỉ **tiền phòng** chia theo ngày; các phí cố định tính trọn kỳ, trừ khi hợp đồng ghi khác |
| V5 | Từ "hệ thống phải nhanh" trong ghi chép phỏng vấn | Thay bằng NFR-PER-01 đến NFR-PER-05 có số đo cụ thể |

### 2.5.3. Ma trận truy vết yêu cầu (Traceability Matrix — trích)

Ma trận đầy đủ được cung cấp ở file Excel kèm theo. Dưới đây là phần trích minh hoạ:

**Bảng 2.40 — Trích ma trận truy vết yêu cầu**

| Mục tiêu NV | Phát hiện | User Story | FR | BR | Ca kiểm thử dự kiến |
|---|---|---|---|---|---|
| BG-01 | F1, F2 | US-13 | FR-MTR-01, 02, 08 | BR-01 | TC-013-01: ghi chỉ số 30 phòng trong ≤ 15 phút |
| BG-02 | F2, F4 | US-13, US-16 | FR-MTR-03, FR-INV-02 | BR-02, BR-06, BR-09 | TC-016-03: phòng vào ở ngày 17 → tiền phòng = giá÷31×12 |
| BG-02 | F8 | US-34 | FR-RPT-06, 07 | BR-19 | TC-034-01: chênh lệch 12% → hiện cảnh báo |
| BG-03 | F6, F7 | US-19, US-27 | FR-INV-10, FR-NTF-04 | BR-12 | TC-027-02: quá hạn 1 ngày → gửi nhắc lần 2 |
| BG-04 | F3, F10 | US-14, US-28 | FR-MTR-06, FR-POR-02, 06 | BR-17 | TC-014-02: bật bắt buộc ảnh → thiếu ảnh thì không lưu được |
| BG-05 | F12 | US-22, US-23 | FR-MNT-01 → 07 | BR-16 | TC-023-04: chờ xác nhận quá 72h → tự đóng |
| BG-06 | F5 | US-02, US-32, US-37 | FR-AUT-05, FR-RPT-01, FR-SEC-05 | — | TC-002-02: quản lý toà A gọi dữ liệu toà B → bị từ chối |

### 2.5.4. Kế hoạch xác minh

**Bảng 2.41 — Kế hoạch xác minh yêu cầu**

| Kỹ thuật | Cách nhóm thực hiện | Thời điểm |
|---|---|---|
| **Review chéo trong nhóm** | Mỗi thành viên đọc phần của người khác, đánh dấu chỗ mơ hồ theo checklist ở 7.1 | Sau khi hoàn thành bản nháp 0.5 |
| **Walkthrough với giảng viên** | Trình bày 15 phút: bối cảnh, stakeholder, 5 user story trọng tâm, ERD; ghi nhận góp ý | Trước hạn nộp 3 ngày |
| **Prototyping** | Dựng bản mẫu giao diện (wireframe) cho 3 màn hình khó nhất: ghi chỉ số, chi tiết hoá đơn, tổng quan nhiều toà — để kiểm chứng cách hiểu về luồng thao tác | Song song với mục 2.4 |
| **Kiểm thử bằng dữ liệu ví dụ** | Tự tính tay hoá đơn của 5 tình huống mẫu (ở giữa kỳ, thay công tơ, thu một phần, quyết toán cọc, điện bậc thang) rồi đối chiếu với đặc tả | Sau khi hoàn thành mục 2.4.4 |
| **Đối chiếu quy định** | Kiểm tra lại các yêu cầu tuân thủ với văn bản pháp quy đã nêu ở D4–D7 | Trước khi baseline |

## 2.6. Quản lý yêu cầu


### 2.6.1. Baseline

Phiên bản **1.0** của tài liệu này, sau khi được giảng viên thông qua, trở thành **baseline**. Mọi thay đổi sau đó phải đi qua quy trình quản lý thay đổi ở mục 2.6.3.

Tập yêu cầu baseline của bản 1.0 gồm **toàn bộ 48 yêu cầu Must have**. Các yêu cầu Should have là mục tiêu phấn đấu; Could have chỉ thực hiện nếu còn thời gian.

### 2.6.2. Quản lý phiên bản

- Tài liệu và các tệp mô hình được lưu trên kho Git chung của nhóm, thư mục `/docs`.
- Quy ước đặt tên: `SRS_ChungCuMini_v<major>.<minor>.md`.
- Mỗi lần sửa phải ghi vào bảng Lịch sử phiên bản ở đầu tài liệu.
- Sơ đồ lưu ở dạng mã nguồn (`.mmd`) song song với ảnh, để sửa được về sau mà không phải vẽ lại.

### 2.6.3. Quy trình quản lý thay đổi

**Bảng 2.42 — Quy trình quản lý thay đổi yêu cầu**

| Bước | Nội dung | Người chịu trách nhiệm |
|---|---|---|
| 1 | Người đề xuất điền **Phiếu yêu cầu thay đổi (CR)**: mô tả, lý do, yêu cầu bị ảnh hưởng | Bất kỳ thành viên |
| 2 | **Phân tích tác động**: liệt kê US/FR/BR/mô hình/ca kiểm thử bị ảnh hưởng, ước lượng thêm bao nhiêu công | Nhóm trưởng + người phụ trách phần liên quan |
| 3 | **Quyết định**: chấp nhận / từ chối / hoãn sang phiên bản sau | Cả nhóm, tham vấn giảng viên nếu ảnh hưởng phạm vi |
| 4 | **Cập nhật**: sửa tài liệu, tăng số phiên bản, cập nhật ma trận truy vết | Người phụ trách |
| 5 | **Thông báo**: ghi vào nhật ký thay đổi, báo cho cả nhóm | Nhóm trưởng |

**Bảng 2.43 — Mẫu phiếu yêu cầu thay đổi**

| Trường | Nội dung |
|---|---|
| Mã CR | CR-001 |
| Ngày đề xuất | |
| Người đề xuất | |
| Mô tả thay đổi | |
| Lý do | |
| Yêu cầu bị ảnh hưởng | US-…, FR-…, BR-… |
| Ước lượng công thêm | … giờ |
| Quyết định | Chấp nhận / Từ chối / Hoãn |
| Ngày cập nhật tài liệu | |

### 2.6.4. Duy trì truy vết

Truy vết được duy trì hai chiều trong file Excel kèm theo:

- **Xuôi:** Mục tiêu nghiệp vụ → Phát hiện → User Story → FR → Ca kiểm thử → Mã nguồn (bổ sung ở giai đoạn sau)
- **Ngược:** Từ một lỗi hoặc một dòng mã tìm ngược về yêu cầu gốc để biết "vì sao có chức năng này"

Nguyên tắc: **không thêm chức năng nào vào sản phẩm nếu không truy được về một yêu cầu có mã.**

