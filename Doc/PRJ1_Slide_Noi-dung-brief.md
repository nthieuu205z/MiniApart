# BRIEF NỘI DUNG — SLIDE GIỚI THIỆU ĐỀ TÀI TRÊN LỚP

**Dự án:** PRJ1-CCM — Hệ thống Quản lý và Vận hành Chung cư mini (MiniApart)
**Tệp này dùng để làm gì:** đây **không phải slide**. Đây là bản mô tả nội dung và số liệu cần đưa vào từng slide, để công cụ dựng slide làm việc mà không phải tự bịa dữ kiện.

**Bản 5 — 24/08/2026.** Sửa ba việc so với bản 2: mở rộng phần lý lẽ *vì sao đề tài đáng làm* (bản trước dồn gần hết vào tính tiền điện, trong khi đề tài phủ mười mảng nghiệp vụ), đổi thuật ngữ **lát cắt → Vertical Slice**; và **thay bảng đối sánh ẩn danh bằng bốn sản phẩm có tên thật** — việc này làm lộ ra rằng hai trong số các "điểm khác biệt" nhóm từng tự nhận thì thị trường đã có, nên slide 9 và slide 5 đã sửa theo.

**Bản 5 sửa tiếp hai việc theo yêu cầu:** slide 9 chuyển từ *đối sánh* sang **liệt kê thị trường có gì** (không so sánh, không kết luận ai thiếu gì); và **bỏ slide đợt tự rà soát** khỏi phần chính — nội dung chuyển xuống slide dự phòng **D7**, vì giảng viên nhiều khả năng hỏi tới còn các bạn cùng lớp thì không.

---

## 0. Ràng buộc quyết định mọi thứ trong tệp này

| Mục | Thực tế |
|---|---|
| Người nghe | **Các bạn cùng lớp** (đa số) và giảng viên |
| Họ đã biết gì về đề tài | **Không gì cả.** Báo cáo chưa in, chưa nộp, chưa ai đọc |
| Họ có tài liệu trong tay không | **Không** |
| Sản phẩm | Chưa code xong — **không có ảnh chụp màn hình nào** |
| Thời lượng giả định | 12–15 phút. Xem mục 5 để co giãn |
| Số slide | **12 slide chính + 7 slide dự phòng** |

**Hai hệ quả bắt buộc:**

**Hệ quả 1 — Bộ slide phải tự chứa.** Mọi thứ cần để hiểu phải nằm trên slide hoặc trong lời nói. **Không dẫn chiếu tới báo cáo** kiểu "chi tiết xem Bảng 1.1" — người nghe không có gì để xem.

**Hệ quả 2 — Bỏ hết mã yêu cầu khỏi slide.** Không đưa `FR-INV-02`, `BR-02b`, `CR-008`, `US-16` lên màn hình. Với người chưa đọc đặc tả, những mã này **không mang thông tin nào** — chúng chỉ tạo vẻ ngoài kỹ thuật rồi làm người nghe phân tâm vì tưởng mình bỏ lỡ điều gì. Nói **nội dung** quy tắc, đừng nói **tên** nó.

> Đừng viết *"Áp dụng BR-02c: định mức theo số người"*. Hãy viết *"Cứ 4 người ở được tính là 1 hộ"*.

---

## 1. Thông điệp lõi

Nếu cả lớp chỉ nhớ được **một câu**:

> **Vận hành một chung cư mini không phải bài toán quản lý danh sách. Mỗi mảng trong đó đều bị ràng buộc bởi một thứ có thật — pháp luật, tiền bạc, hoặc quyền lợi của người đang thuê.**

**Lưu ý về trọng tâm.** Tính tiền điện bậc thang là phần **khó nhất về kỹ thuật**, nhưng nó là **một trong mười mảng**, không phải toàn bộ đề tài. Nếu bộ slide làm người nghe tưởng nhóm chỉ viết một cái máy tính tiền điện thì đó là lỗi trình bày. Slide 5 tồn tại để chống đúng chuyện đó.

---

## 2. Trả lời thẳng: có nên chiếu các sơ đồ không?

**Phần lớn là không.**

Các sơ đồ ERD, lớp, tuần tự, use case đều vẽ cho **khổ A4, đọc gần, đọc chậm, bởi người đã biết ngữ cảnh**. Chiếu lên màn hình lớp học thì gây hại thật: người nghe nheo mắt, đọc không nổi, rồi **thôi không nghe nữa**. Bạn mất khán giả để đổi lấy một hình không ai hiểu.

| Sơ đồ | Chiếu? | Lý do |
|---|---|---|
| ERD — 29 thực thể | **Không** | Từ hàng ghế thứ ba không đọc được tên bảng |
| Sơ đồ lớp gói tính tiền | **Không** | Chỉ có nghĩa với người đã đọc đặc tả |
| Sơ đồ tuần tự tạo hoá đơn — 36 thông điệp | **Không** | Cần 5 phút để đi hết. Bạn không có 5 phút |
| Biểu đồ use case — 28 use case | **Không** | Thành một đám hình bầu dục, không truyền đạt gì trong 20 giây |
| Biểu đồ luồng dữ liệu, hoạt động, trạng thái | **Không** | Cùng lý do |
| Phân rã module (`17-phan-ra-module.png`) | **Có thể** | Vẽ bằng Excalidraw, hộp to chữ to. Chỉ dùng nếu còn thời gian |
| 13 Vertical Slice (`18-lat-cat-doc.png`) | **Có** | Đơn giản, đọc được |
| **Vòng đời vận hành** | **Có — bắt buộc, vẽ mới** | Slide 4 |
| **Biểu đồ 5 bậc giá điện** | **Có — bắt buộc, vẽ mới** | Slide 7 |
| **So sánh hai phòng cùng 350 kWh** | **Có — bắt buộc, vẽ mới** | Slide 8 |

**Nguyên tắc:** sơ đồ UML là **tài liệu để tra cứu**, không phải **hình để thuyết trình**. Hai thứ này gần như không dùng chung được.

---

## 3. Dàn slide

### Slide 1 — Bìa

**MiniApart — Hệ thống Quản lý và Vận hành Chung cư mini** · Môn Project 1 · 4 thành viên · Giảng viên hướng dẫn · 8/2026.

*Cần điền: tên trường, khoa, giảng viên, 4 thành viên + MSSV.*

---

### Slide 2 — Một buổi chiều cuối tháng ★

| | |
|---|---|
| **Thông điệp** | Việc này đang tốn 4 tiếng mỗi tháng, và phần lớn là làm lại thứ máy nên làm |
| **Nội dung** | Kể theo trình tự: đi từng phòng ghi chỉ số vào **sổ tay** → về nhà **nhập lại** vào Excel → tính tiền **từng phòng** bằng máy tính cầm tay → soạn **30 tin nhắn Zalo** gửi từng người |
| **Số liệu** | **~4 giờ** cho một toà 30 phòng · **30** tin nhắn soạn tay · dữ liệu nhập tay **2 lần** |
| **Hình** | Dòng thời gian ngang 4 chặng. Chặng "nhập lại vào Excel" tô màu cảnh báo — công việc thừa hoàn toàn |
| **Người nói** | Nhiều bạn trong lớp đang **đi thuê trọ**. Hỏi thẳng: *"Có ai từng thắc mắc sao tháng này tiền điện cao thế mà không có cách nào kiểm lại không?"* |

---

### Slide 3 — Vấn đề không chỉ là chậm

| | |
|---|---|
| **Thông điệp** | Chậm chỉ là bề mặt. Bên dưới là **sai số, mất dấu vết, và những nghĩa vụ bị quên** |
| **Bốn hệ quả** | **Nhập tay hai lần** → sai số, ghi nhầm phòng · **Tính tay** → sai, nhất là phòng có người dọn vào giữa tháng · **Không lưu vết** → người thuê thắc mắc mà không có gì đối chiếu; chủ quên phòng nào chưa đóng tiền · **Quên nghĩa vụ có thời hạn** → hạn kiểm định bình chữa cháy, hạn đăng ký tạm trú, lịch tự kiểm tra an toàn hằng năm |
| **Hình** | 4 thẻ ngang: nguyên nhân → mũi tên → hệ quả |
| **Người nói** | Hệ quả thứ tư là thứ ít ai nghĩ tới nhưng **hậu quả pháp lý nặng nhất** — dẫn sang slide 5 |

---

### Slide 4 — MiniApart quản lý những gì

| | |
|---|---|
| **Thông điệp** | Hệ thống phủ **trọn vòng đời vận hành**, không phải một chức năng lẻ |
| **Vòng đời** | **Phòng trống → Ký hợp đồng (cọc, người ở cùng, phương tiện) → Ở (ghi chỉ số hằng tháng kèm ảnh, báo sự cố) → Lập hoá đơn → Thu tiền, theo dõi công nợ → Gia hạn *hoặc* trả phòng → Quyết toán cọc → Phòng trống** |
| **Chạy song song vòng đời** | **Nghĩa vụ pháp lý** — hồ sơ và lịch kiểm tra PCCC, hồ sơ tạm trú · **Thông báo & nhắc việc** · **Báo cáo** cho chủ trọ: doanh thu, công nợ, tỷ lệ lấp đầy |
| **Năm vai trò** | **Chủ trọ** — nhiều toà, cần bức tranh tổng · **Quản lý toà nhà** — dùng nhiều nhất, thao tác **trên điện thoại, giữa hành lang, sóng yếu** · **Người thuê** — chỉ đọc, chỉ thấy phòng mình · **Thợ sửa chữa** — dùng rất ít nên giao diện phải đơn giản nhất · **Quản trị hệ thống** |
| **Hình** | **Vòng tròn vòng đời** — 7 chặng nối thành vòng khép kín, ở giữa là "Báo cáo", bên ngoài là dải "Nghĩa vụ pháp lý" chạy song song. Đây là hình quan trọng: nó cho thấy **bề rộng** của đề tài chỉ trong một cái nhìn |
| **Người nói** | Đây là slide chống hiểu lầm "đề tài chỉ là tính tiền". Đi hết vòng tròn một lượt, mỗi chặng một câu |

---

### Slide 5 — Vì sao đề tài này đáng làm ★★

Slide mới, và là slide gánh toàn bộ phần lý lẽ. **Đừng cắt slide này kể cả khi thiếu thời gian.**

| | |
|---|---|
| **Thông điệp** | Ba lý do, và **không lý do nào trong ba lý do này là chuyện tính tiền điện** |
| **Lý do 1 — Chủ trọ có nghĩa vụ pháp lý và đang quên** | Ba nghĩa vụ đều **có thời hạn**: hồ sơ và thiết bị PCCC phải còn hạn kiểm định, phải **tự kiểm tra và báo cáo hằng năm** · người ở từ **30 ngày** phải đăng ký tạm trú, chủ nhà phải thông báo lưu trú · thu sai giá điện của người thuê **có thể bị xử phạt**. Cả ba đều bị quên vì **không có ai nhắc** — và nhắc đúng hạn là việc phần mềm làm tốt hơn người |
| **Lý do 2 — Hai bên dùng chung hệ thống nhưng lợi ích ngược nhau** | Chủ trọ muốn **thu đủ, thu đúng hạn**. Người thuê muốn **biết mình trả tiền cho cái gì**. MiniApart có **cổng riêng cho người thuê** và **lưu ảnh công tơ kèm chỉ số** — bằng chứng kiểm lại được, không phải lời hứa. Một vài sản phẩm trên thị trường cũng đã đi hướng này; nhóm coi đây là **mức sàn phải đạt**, không nhận là điểm riêng |
| **Lý do 3 — Dữ liệu tiền phải kiểm toán được** | Bản ghi thu tiền **không sửa, không xoá**. Muốn điều chỉnh thì lập một bút toán ngược có ghi lý do, bản gốc giữ nguyên. Nhật ký thao tác chỉ ghi thêm, **không ai sửa được, kể cả quản trị viên**. Đây là ràng buộc mà một bài tập quản lý danh sách thông thường không có |
| **Câu nối sang phần sau** | *"Trong mười mảng nghiệp vụ, có một mảng khó hơn hẳn về mặt kỹ thuật — và đó là chỗ nhóm đầu tư nhiều nhất."* |
| **Hình** | 3 khối dọc, mỗi khối một biểu tượng và một câu. Khối 1 dùng màu cảnh báo (pháp lý), khối 2 hai chiều mũi tên đối nhau, khối 3 biểu tượng khoá hoặc sổ cái |

---

### Slide 6 — Làm gì, và cố ý không làm gì

| | |
|---|---|
| **Thông điệp** | Biết loại trừ cái gì, và nói được lý do, cũng quan trọng như biết làm cái gì |
| **Cố ý không làm** | **Thanh toán online tự động** — cần hợp đồng doanh nghiệp với nhà cung cấp, ngoài tầm một đồ án → thay bằng **mã QR chuyển khoản**, xác nhận thủ công · **Đọc công tơ tự động bằng AI** — cần phần cứng và mô hình nhận dạng, rủi ro quá cao cho một học kỳ · **Nối thẳng vào VNeID** — không có API mở cho bên thứ ba → chỉ quản lý hồ sơ và xuất danh sách |
| **Hình** | Ba mục, mỗi mục kèm một dòng "thay bằng gì" |
| **Người nói** | Mỗi thứ bỏ đi đều có **lý do kỹ thuật cụ thể và một phương án thay thế**, không phải bỏ vì ngại làm |

---

### Slide 7 — Mảng khó nhất: tiền điện không phải phép nhân ★★

| | |
|---|---|
| **Mở đầu bằng câu đóng khung** | *"Đây là một trong mười mảng — nhưng là mảng tốn công nhất."* Nói câu này trước khi vào nội dung, để người nghe không hiểu nhầm tỷ trọng |
| **Thông điệp** | Ai cũng tưởng tiền điện = số kWh × đơn giá. Thực tế có **ba lớp** chồng lên nhau |
| **Ba lớp** | **(1) Giá bậc thang 5 bậc** — càng dùng nhiều, phần vượt càng đắt · **(2) Cứ 4 người ở được tính là 1 hộ** — phòng đông người được nới rộng ngưỡng từng bậc · **(3) Người dọn vào giữa tháng** — số người thay đổi trong kỳ, phải chốt lại từng kỳ |
| **Bảng giá — dùng đúng số này** | Đến 100 kWh: **1.984 đ** · 101–200: **2.380 đ** · 201–400: **2.998 đ** · 401–700: **3.571 đ** · từ 701: **3.967 đ** *(chưa VAT)* |
| **Hình** | Biểu đồ bậc thang: trục ngang là kWh, năm khối cột cao dần |
| **Người nói** | Không đọc số hiệu văn bản trên slide. Nếu giảng viên hỏi căn cứ: Quyết định 14/2025/QĐ-TTg về cơ cấu biểu giá, Quyết định 1279/QĐ-BCT về giá bình quân |

---

### Slide 8 — Cùng 350 kWh, hai phòng trả khác nhau ★★

Slide thay thế cho toàn bộ đống sơ đồ UML. **Một ví dụ tính bằng số thật dạy được nhiều hơn năm sơ đồ cộng lại.**

| | |
|---|---|
| **Thông điệp** | Hai phòng dùng **đúng bằng nhau** vẫn trả tiền khác nhau — và đó là **đúng luật**, không phải lỗi |
| **Phòng A — 3 người** | Cứ 4 người là 1 hộ → 3 người vẫn tính **1 hộ**, dùng ngưỡng gốc<br>100 kWh × 1.984 = **198.400**<br>100 kWh × 2.380 = **238.000**<br>150 kWh × 2.998 = **449.700**<br>**Tổng = 886.100 đ** |
| **Phòng B — 6 người** | 6 người → quy đổi thành **2 hộ** → ngưỡng mỗi bậc **nhân đôi**<br>200 kWh × 1.984 = **396.800**<br>150 kWh × 2.380 = **357.000**<br>**Tổng = 753.800 đ** |
| **Chênh lệch** | **132.300 đ** — phòng đông người hơn lại trả **ít hơn**, vì được nhiều định mức giá rẻ hơn |
| **Hình** | Hai cột cạnh nhau, cùng tổng 350 kWh nhưng chia bậc khác nhau. Phòng B có phần "giá rẻ" dài gấp đôi. Dưới cùng: hai con số tổng và mũi tên chênh lệch |
| **Người nói** | *"Nếu tính sai chỗ này, mỗi tháng mỗi phòng lệch hơn trăm nghìn. Nhân với 30 phòng, nhân với 12 tháng. Đó là lý do phần tính tiền được tách riêng và kiểm thử kỹ hơn mọi phần khác."* |
| **⚠ Kiểm lại** | Các phép tính trên đã kiểm bằng máy. Nếu công cụ dựng slide sửa số nào thì **phải tính lại** — có người trong phòng sẽ nhẩm theo |

---

### Slide 9 — Thị trường hiện có gì

| | |
|---|---|
| **Thông điệp** | Đây là bài toán **có thật và đã có người làm** — nhóm khảo sát để biết mặt bằng, không để chê ai |
| **Cách trình bày** | **Liệt kê, không so sánh.** Nêu bốn sản phẩm và **những gì họ làm được**. Không có cột "MiniApart", không có dấu tích/dấu gạch, không có câu nào dạng "họ không có X" |
| **Bốn sản phẩm và tính năng họ nêu** | **AppNhà** — đính ảnh công tơ, người thuê mở ứng dụng xem được chỉ số cũ và mới, ảnh công tơ hai tháng gần nhất, biên lai · **eNha** — tự tính tiền điện theo bậc thang, hoá đơn PDF kèm mã QR, nhắc nợ qua Zalo, phiếu báo hỏng có phân công thợ · **Mona House** — chụp công tơ và **tự quét số liệu từ ảnh** · **TrọCare** — người thuê xem chi tiết từng khoản, mỗi hoá đơn một mã QR riêng, miễn phí |
| **Một câu định vị** | Sau khi liệt kê xong, một câu duy nhất: *"Những việc này nhóm cũng làm, và coi là mức sàn. Phần nhóm tập trung thêm là ba cụm ở slide trước — tính tiền đúng luật cho phòng trọ, nhắc nghĩa vụ pháp lý có thời hạn, và dữ liệu tiền kiểm toán được."* |
| **Hình** | 4 thẻ ngang, mỗi thẻ một tên sản phẩm và 2–3 dòng tính năng. Nền giống nhau, **không thẻ nào được làm nổi hơn thẻ nào** |
| **⚠ Tuyệt đối tránh** | Mọi câu dạng "không sản phẩm nào làm được…". Nhóm mới đọc trang giới thiệu, chưa dùng thử — không đủ căn cứ để nói ai thiếu gì. Chỉ nói **họ có gì** |
| **Người nói** | Slide này làm hai việc: chứng minh bài toán có thật (có thị trường), và cho thấy nhóm **biết mặt bằng** trước khi làm. Cả hai đều không cần chê ai |

---

### Slide 10 — Cách nhóm làm và công nghệ dùng

| | |
|---|---|
| **Thông điệp** | Đi theo quy trình phân tích yêu cầu chuẩn, và ép các quy ước quan trọng thành thứ **máy tự kiểm** |
| **Quy trình** | **Xác định người dùng → Thu thập (phỏng vấn, bảng hỏi, quan sát, phân tích tài liệu) → Viết yêu cầu → Tự rà soát**. Dải số nhỏ: **37** user story · **93** yêu cầu chức năng · **23** quy tắc nghiệp vụ · **10** module |
| **Công nghệ** | Spring Boot · PostgreSQL · React · Docker |
| **Bảo đảm tiền tính đúng** | **(1)** Mọi số tiền dùng kiểu số thập phân chính xác, **cấm số thực dấu phẩy động** — trong máy tính `0,1 + 0,2` ra `0,30000000000000004`, sai số tích luỹ làm lệch tổng hoá đơn · **(2)** Có luật tự động quét mã nguồn, ai dùng sai kiểu số thì **build gãy ngay** · **(3)** Phần tính tiền tách riêng, không đụng cơ sở dữ liệu, nên kiểm thử chạy trong **mili giây** — nhờ vậy viết được hàng trăm ca kiểm thử |
| **⚠ Số khảo sát** | **Khuyến nghị: đừng đưa số khảo sát lên slide** — chỉ nói phương pháp. Nếu có đưa thì phải nói rõ **đây là dữ liệu mô phỏng**, nhóm không tiếp cận được người dùng thật |
| **Người nói** | *"Quy ước ghi trong tài liệu thì người ta quên. Quy ước làm gãy build thì không quên được."* |

---

### Slide 11 — Kế hoạch và đang ở đâu

| | |
|---|---|
| **Thông điệp** | Chia việc thành **13 Vertical Slice**, không phải làm xong tầng này mới sang tầng khác |
| **Thuật ngữ** | Lần đầu nói thì giải thích một câu: *"Vertical Slice — mỗi phần việc đi trọn từ cơ sở dữ liệu, qua xử lý, lên tới giao diện, và chạy thật được khi xong."* Sau đó dùng thẳng "Vertical Slice" |
| **Nội dung** | Vertical Slice 4 — tính hoá đơn — là phần lõi. Trạng thái thật: **xong** phân tích yêu cầu, thiết kế, kế hoạch; **sắp tới** Vertical Slice 0 — dựng nền |
| **Hình** | Thanh 13 ô ngang, tô đậm phần đã xong, đánh dấu ★ ở Vertical Slice 4. Có sẵn: `diagrams-v2/18-lat-cat-doc.png` |
| **Người nói** | Vì sao cắt dọc: cắt ngang thì tới cuối kỳ mới có thứ chạy được, và rủi ro dồn hết về cuối |

---

### Slide 12 — Kết

Nhắc lại **thông điệp lõi**, ba điều đáng kể nhất, cảm ơn, mời hỏi.

**Ba điều — cố ý không lấy cả ba từ mảng tính tiền:**
1. Đề tài phủ **trọn vòng đời vận hành**, kể cả những nghĩa vụ pháp lý mà chủ trọ hay quên
2. Phân tích và thiết kế đã xong tới mức **bắt tay code được ngay**, không phải vừa code vừa nghĩ
3. Khảo sát thị trường **trung thực tới mức tự bỏ bớt điểm mạnh mình từng nhận**, rồi định vị lại phần giá trị riêng quanh *tính đúng theo quy định*

---

## 4. Slide dự phòng — chỉ mở khi bị hỏi

| # | Nội dung | Mở khi bị hỏi |
|---|---|---|
| D1 | Mô hình dữ liệu (ERD) | "Dữ liệu tổ chức thế nào?" — nói trước là hình dày, chỉ vào vùng liên quan |
| D2 | Phân rã 10 module | "Mã nguồn chia thế nào?" |
| D3 | Kiến trúc triển khai — máy chủ, container, tường lửa | "Triển khai ở đâu?" |
| D4 | Bảng đầy đủ 15 vấn đề đã rà soát | "Cụ thể 15 lỗi là gì?" |
| D5 | Ví dụ hoá đơn đầy đủ một phòng | "Một hoá đơn thật trông thế nào?" |
| D6 | Bảng phân công 4 vai trò | "Nhóm chia việc thế nào?" |
| **D7** | **Đợt tự rà soát mô hình — 15 vấn đề, 10 lỗi chặn** | *"Làm sao biết thiết kế đúng?"* hoặc *"Chưa code thì đã làm được gì?"* — **giảng viên nhiều khả năng hỏi**, các bạn cùng lớp thì không |

**Nội dung cho D7** — trước khi viết dòng mã nào, nhóm đối chiếu ngược mô hình dữ liệu với từng quy tắc nghiệp vụ: liệt kê dữ liệu mà công thức cần đọc → kiểm mô hình có lưu không → có đường đi tới không. Kết quả **15 vấn đề, 10 lỗi chặn**, phát sinh ~52 giờ công. Ví dụ tiêu biểu: mô hình ban đầu lưu được chi phí sửa chữa nhưng **không đánh dấu khoản đó đã tính vào hoá đơn hay chưa** → mỗi kỳ hệ thống lại cộng khoản cũ, người thuê **bị thu lặp mỗi tháng**, mà **chương trình không hề báo lỗi**.

**Số liệu cho D5** — phòng 305, kỳ 31 ngày, dọn vào ngày 17 nên ở 12 ngày: tiền phòng 3.500.000 ÷ 31 × 12 = **1.354.839** · điện 58 kWh = **203.000** · nước 4 m³ = **100.000** · rác **30.000** · internet **100.000** · gửi xe **100.000** → cộng **1.887.839** → làm tròn nghìn → **1.888.000 đ**.

---

## 5. Co giãn theo thời lượng

| Thời lượng | Giữ slide |
|---|---|
| **5–7 phút** | 1, 2, 4, **5**, **8**, 11, 12 — giữ bằng được slide 5 (lý lẽ) và slide 8 (ví dụ số) |
| **12–15 phút** | Cả 12 slide |
| **20 phút** | 12 slide + kéo **D7** (đợt rà soát) và D5 lên thành slide chính |

> Nếu buộc phải cắt, **cắt slide 7 trước slide 5**. Slide 7 làm đề tài trông sâu; slide 5 làm đề tài trông **đáng làm**. Thiếu cái sau thì cái trước không cứu được.

---

## 6. Câu hỏi có thể bị hỏi

| Câu hỏi | Hướng trả lời |
|---|---|
| **"Đề tài này có gì khó ngoài tính tiền?"** | Ba thứ ở slide 5: nghĩa vụ pháp lý có thời hạn, hai nhóm người dùng lợi ích ngược nhau, và ràng buộc kiểm toán dữ liệu tiền. Thêm: hợp đồng, hoá đơn và sự cố đều có **vòng đời trạng thái riêng**, không phải bảng dữ liệu phẳng |
| **"Số khảo sát ở đâu ra?"** | Nói thẳng: dữ liệu mô phỏng, nhóm không tiếp cận được người dùng thật. Nhưng **phương pháp là thật** — kịch bản phỏng vấn, bảng hỏi, phiếu quan sát đều dựng nghiêm túc và dùng lại được nguyên vẹn nếu có cơ hội khảo sát thật. Đã khai báo rõ trong báo cáo |
| **"Chưa có sản phẩm thì trình bày gì?"** | Đây là buổi giới thiệu đề tài. Phần xong là phân tích, thiết kế, kế hoạch — và đợt rà soát đã tìm ra 10 lỗi chặn **trước khi** viết dòng mã nào |
| **"Sao không dùng phần mềm có sẵn?"** | Slide 9. Thị trường đã làm tốt phần tiện lợi; ba cụm còn lại của nhóm xoay quanh **tính đúng theo quy định**: tính tiền đúng luật cho phòng trọ, nhắc nghĩa vụ pháp lý có thời hạn, và dữ liệu tiền kiểm toán được |
| **"App X đã làm được cái đó rồi mà?"** | Thừa nhận ngay nếu đúng — nhóm đã tự phát hiện và ghi vào báo cáo. Trả lời: *"Đúng ạ, nên nhóm không còn nhận đó là điểm khác biệt nữa. Phần còn lại chúng em thấy chưa sản phẩm nào nêu là..."* Đừng cãi |
| **"Bảo mật cổng người thuê thế nào?"** | Chặn ở **phía máy chủ**, không phải bằng cách ẩn nút trên giao diện. Phạm vi dữ liệu lấy từ danh tính trong phiên đăng nhập, không lấy từ tham số URL — nếu lấy từ URL thì người dùng chỉ cần đổi một con số là xem được hoá đơn phòng khác. Có ca kiểm thử theo hướng tấn công cho đúng tình huống này |
| **"Nhóm 4 người chia việc thế nào?"** | Chia theo **vai trò dọc**, không theo module — để mỗi người đều chạm vào toàn hệ thống. Slide D6 |

---

## 7. Kho số liệu — dùng đúng, đừng làm tròn hay đoán

| Hạng mục | Con số |
|---|---|
| User story | **37** |
| Yêu cầu chức năng | **93**, chia **10** module |
| Quy tắc nghiệp vụ | **23** |
| Thực thể dữ liệu | **29** |
| Vấn đề tìm được khi tự rà soát | **15**, trong đó **10 lỗi chặn**, ~**52 giờ** công phát sinh |
| Vertical Slice | **13** |
| Thời gian chốt sổ hiện nay | **~4 giờ** / toà 30 phòng |
| Mục tiêu | **dưới 30 phút** |
| Biểu giá điện sinh hoạt | 5 bậc: **1.984 / 2.380 / 2.998 / 3.571 / 3.967** đ/kWh (chưa VAT) |
| Ví dụ 350 kWh | 3 người → **886.100 đ** · 6 người → **753.800 đ** · chênh **132.300 đ** |
| Công nghệ | Spring Boot · PostgreSQL · React · Docker |

> ✅ **Số liệu giá điện đã kiểm chứng ngày 23/08/2026** — vẫn là mức hiện hành.
>
> ⚠️ Theo quy định mới năm 2026, giá bán lẻ điện bình quân được xét điều chỉnh **ba tháng một lần**. Nếu buổi trình bày còn cách vài tháng thì tra lại; khi đó **chỉ cột đơn giá** ở slide 7 và các con số ở slide 8 phải tính lại, cơ cấu 5 bậc giữ nguyên.

---

## 8. Hình phải vẽ mới và hình có sẵn

**Vẽ mới — không có sẵn:**

| Hình | Cho slide |
|---|---|
| Dòng thời gian buổi chốt số thủ công | 2 |
| **Vòng tròn vòng đời vận hành** | **4** — hình gánh phần "bề rộng của đề tài" |
| Ba khối lý do | 5 |
| Biểu đồ 5 bậc giá điện | 7 |
| **So sánh hai phòng cùng 350 kWh** | **8** |
| Dòng thời gian khoản tiền bị thu lặp 3 tháng | 10 |

**Có sẵn trong `Doc/`:**

| Tệp | Cho slide |
|---|---|
| `diagrams-v2/18-lat-cat-doc.png` | 12 |
| `diagrams-v2/17-phan-ra-module.png` | Dự phòng D2 |
| `diagrams-v2/16-kien-truc-trien-khai.png` | Dự phòng D3 |
| `diagrams-v2/07-erd-v2.png` | Dự phòng D1 — **hình rất dày, cảnh báo trước khi mở** |

---

## 9. Định hướng thiết kế

| Mục | Gợi ý |
|---|---|
| **Giọng** | Nghiêm túc nhưng dễ vào. Người nghe là sinh viên cùng lớp, không phải hội đồng thẩm định — tránh giọng quá học thuật, cũng tránh giọng quảng cáo khởi nghiệp |
| **Mật độ chữ** | **Tối đa ~25 chữ mỗi slide.** Chữ trên slide là **nhãn**; phần giải thích thuộc về lời nói |
| **Không có trên slide** | Mã yêu cầu (`FR-…`, `BR-…`, `CR-…`, `US-…`) · số hiệu văn bản pháp luật · tên bảng cơ sở dữ liệu · dẫn chiếu tới báo cáo |
| **Cân đối trọng tâm** | Hai slide về tiền điện (7 và 8) trên tổng 12. **Đừng để phần thiết kế vô tình làm hai slide đó nổi hơn phần còn lại** — slide 4 và 5 phải được đầu tư ngang bằng, vì chúng gánh phần "đề tài rộng và đáng làm" |
| **Số liệu** | Số là nhân vật chính. Cỡ chữ số lớn gấp 3–4 lần chữ giải thích |
| **Màu** | Một màu chủ đạo + một màu nhấn dành riêng cho **số và cảnh báo**. Slide 5 khối pháp lý và slide 3 phần hệ quả dùng màu cảnh báo |
| **Chữ** | Font đủ dấu tiếng Việt. Kiểm kỹ **ế, ộ, ữ, ợ, ằ** — nhiều font trình chiếu dựng sai chỗ này |
| **Cỡ chữ nhỏ nhất** | Không nhỏ hơn 20pt. Nếu nội dung buộc phải nhỏ hơn thì nó **không thuộc về slide này** |

---

## 10. Còn phải tự làm

1. **Tên trường, khoa, giảng viên** — slide 1
2. **Tên và mã số 4 thành viên** — slide 1 và D6
3. **Xác nhận thời lượng được phân** — để chọn phương án ở mục 5
4. **Tập nói thử một lần bấm giờ** theo kịch bản ở tệp `PRJ1_Slide_Kich-ban-thuyet-trinh.md`. Slide 4, 5, 7, 8 là bốn slide nặng nhất
