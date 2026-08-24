# LÔ PHIẾU YÊU CẦU THAY ĐỔI SỐ 01

**Dự án:** PRJ1-CCM — Hệ thống Quản lý và Vận hành Chung cư mini
**Tài liệu nguồn:** `PRJ1_Phan-tich-yeu-cau_Chung-cu-mini.md` phiên bản 1.0
**Ngày lập lô:** 23/08/2026
**Căn cứ:** Quy trình quản lý thay đổi, mục 2.6.3 của tài liệu phân tích yêu cầu

---

## Bối cảnh của lô thay đổi này

Sau khi hoàn tất tài liệu phân tích yêu cầu phiên bản 1.0, nhóm tiến hành một đợt **rà soát chéo giữa mô hình dữ liệu (mục 3.5) và các quy tắc nghiệp vụ (mục 2.4.4)**. Mục tiêu của đợt rà soát là trả lời một câu hỏi duy nhất:

> Với sơ đồ thực thể quan hệ hiện tại, có thực hiện được **từng quy tắc nghiệp vụ** đã đặc tả hay không?

Phương pháp: duyệt lần lượt 23 quy tắc nghiệp vụ, với mỗi quy tắc xác định những trường dữ liệu mà công thức của nó cần đọc, rồi đối chiếu xem các trường đó có tồn tại trong ERD không.

**Kết quả: 15 vấn đề, trong đó 10 vấn đề khiến quy tắc nghiệp vụ không thể thực hiện được.** Phiếu thứ 15 phát sinh sau đó, khi nhóm chuẩn hoá danh mục tài liệu tham khảo — xem CR-015. Đợt rà soát này diễn ra **trước khi tài liệu được thông qua làm baseline**, nên theo mục 2.6.1 các thay đổi dưới đây chưa phải thay đổi baseline. Nhóm vẫn chủ động lập phiếu đầy đủ, vì hai lý do:

1. Ghi lại được **lý do đằng sau mỗi quyết định thiết kế** — thứ sẽ thất lạc nếu chỉ lặng lẽ sửa sơ đồ
2. Kiểm chứng chính quy trình ở mục 2.6.3 bằng một tình huống thật, thay vì để nó là quy trình chỉ tồn tại trên giấy

**Phân loại mức độ:**

| Mức | Ý nghĩa | Số phiếu |
|---|---|---|
| **Chặn** | Quy tắc nghiệp vụ đã đặc tả không thể thực hiện với mô hình hiện tại | 10 |
| **Mâu thuẫn** | Hai phần của tài liệu nói ngược nhau, phải chọn một | 3 |
| **Cập nhật** | Thay đổi bối cảnh, không phải lỗi | 1 |
| **Sai dữ kiện** | Dữ kiện pháp lý trích dẫn trong tài liệu đã bị thay thế | 1 |

**Bảng tổng hợp:**

| Mã CR | Vấn đề | Mức | Ảnh hưởng nặng nhất | Công thêm |
|---|---|---|---|---|
| CR-001 | Không có liên kết tài khoản ↔ người thuê | Chặn | Sập toàn bộ EP-08 (9 FR) | 4 giờ |
| CR-002 | Không lưu được số người ở theo kỳ | Chặn | BR-02c, BR-03 | 8 giờ |
| CR-003 | Không lưu được biểu giá điện bậc thang | Chặn | BR-02b, FR-BLD-08 | 6 giờ |
| CR-004 | Không đủ chỉ số để tính thay công tơ | Chặn | BR-09, FR-MTR-09 | 3 giờ |
| CR-005 | Trạng thái hợp đồng thiếu giá trị "đã cọc" | Chặn | BR-11 | 2 giờ |
| CR-006 | Không có nơi lưu số dư khả dụng | Chặn | BR-13, FR-INV-16 | 3 giờ |
| CR-007 | Không có thực thể công tơ tổng | Chặn | BR-19, FR-RPT-06 | 3 giờ |
| CR-008 | Không có thực thể khoản phát sinh chờ | Chặn | FR-MNT-06, rủi ro tính tiền hai lần | 5 giờ |
| CR-009 | Không có bản ghi thu tiền cọc | Chặn | BR-07, US-09 | 4 giờ |
| CR-010 | Thanh toán thiếu trường cho bút toán đối ứng | Chặn | BR-18, FR-INV-14 | 2 giờ |
| CR-011 | Thuế GTGT xuất hiện rồi biến mất | Mâu thuẫn | BR-02b | 1 giờ |
| CR-012 | Trạng thái suy ra hay trạng thái lưu | Mâu thuẫn | BR-11, BR-14 | 4 giờ |
| CR-013 | Lưu URL ảnh đi ngược NFR-SEC-04 | Mâu thuẫn | NFR-SEC-04 | 3 giờ |
| CR-014 | Ràng buộc ngân sách không còn đúng | Cập nhật | C-02, NFR-SEC-01 | 1 giờ |
| **CR-015** | **Cơ cấu biểu giá điện đã đổi từ 6 bậc sang 5 bậc** | **Sai dữ kiện** | **BR-02b, BR-02c, D4, R2** | **3 giờ** |
| | | | **Tổng** | **52 giờ** |

---

# PHẦN A — NHÓM CHẶN

## CR-001

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-001 |
| **Ngày đề xuất** | 23/08/2026 |
| **Người đề xuất** | *(điền tên)* |
| **Mô tả thay đổi** | Bổ sung liên kết giữa thực thể `NGUOI_DUNG` (tài khoản đăng nhập) và thực thể `NGUOI_THUE` (hồ sơ nhân thân). Thêm trường `nguoi_thue_id` (khoá ngoại, cho phép rỗng, duy nhất) vào bảng `NGUOI_DUNG`. |
| **Lý do** | ERD phiên bản 1.0 tách `NGUOI_DUNG` và `NGUOI_THUE` thành hai thực thể độc lập, không có bất kỳ quan hệ nào nối chúng. Quyết định tách là **đúng** — không phải người thuê nào cũng có tài khoản, và một người thuê có thể ký nhiều hợp đồng qua thời gian. Nhưng khi thiếu liên kết, hệ thống **không có cách nào xác định một tài khoản vừa đăng nhập tương ứng với người thuê nào**, do đó không truy ra được hợp đồng, không ra được phòng, không ra được hoá đơn. |
| **Yêu cầu bị ảnh hưởng** | Toàn bộ EP-08: FR-POR-01 → FR-POR-09 (9 yêu cầu, trong đó 5 mức Must have). Đặc biệt FR-POR-04 "người thuê chỉ truy cập được dữ liệu của phòng mình" là yêu cầu **an ninh** mà nếu không có liên kết này thì không thể thực hiện, cũng không thể kiểm thử. Kéo theo US-28, US-29, US-30, US-31 và NFR-SEC-03. |
| **Ước lượng công thêm** | 4 giờ |
| **Quyết định** | Chấp nhận |
| **Ngày cập nhật tài liệu** | *(điền khi sửa xong)* |

**Ghi chú thiết kế.** Trường `nguoi_thue_id` phải **cho phép rỗng**, vì tài khoản của Chủ sở hữu, Quản lý, Thợ và Quản trị hệ thống không gắn với hồ sơ người thuê nào. Đồng thời phải đặt **ràng buộc duy nhất**, để một hồ sơ người thuê không bị hai tài khoản cùng nhận là mình. Quy tắc phân quyền ở tầng ứng dụng: khi vai trò là `NGUOI_THUE` thì `nguoi_thue_id` bắt buộc phải có giá trị.

---

## CR-002

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-002 |
| **Ngày đề xuất** | 23/08/2026 |
| **Người đề xuất** | *(điền tên)* |
| **Mô tả thay đổi** | Bổ sung chiều thời gian cho dữ liệu nhân khẩu, gồm hai phần: (a) thêm `tu_ngay` và `den_ngay` vào bảng `NGUOI_O_CUNG`; (b) thêm bảng mới `NHAN_KHAU_KY(ky_id, phong_id, so_nguoi, thoi_diem_chot)` lưu số người ở đã chốt của từng phòng trong từng kỳ. |
| **Lý do** | BR-02c quy định nguyên văn rằng hệ thống **phải lưu số người ở thực tế của từng phòng theo từng kỳ, vì con số này thay đổi theo thời gian**. ERD phiên bản 1.0 không có chỗ nào chứa thông tin này: bảng `NGUOI_O_CUNG` gắn với `HOP_DONG` và hoàn toàn không có chiều thời gian, nên chỉ trả lời được "hiện giờ phòng có mấy người", không trả lời được "tháng 3 phòng có mấy người". |
| **Yêu cầu bị ảnh hưởng** | BR-02c (định mức 4 người mỗi hộ theo quy định giá điện), BR-03 (tiền nước tính theo đầu người), NFR-CMP-02 (in lại hoá đơn cũ phải ra đúng số cũ), FR-INV-02, US-16. |
| **Ước lượng công thêm** | 8 giờ |
| **Quyết định** | Chấp nhận |
| **Ngày cập nhật tài liệu** | *(điền khi sửa xong)* |

**Ghi chú thiết kế — vì sao cần cả hai phần.** Đây là phiếu tốn công nhất trong lô, nên cần nói rõ lý do không chọn phương án đơn giản hơn.

Nếu **chỉ có (a)**, số người ở mỗi kỳ phải suy ra bằng truy vấn khoảng ngày mỗi lần cần dùng. Hệ quả: chỉ cần ai đó sửa lại ngày chuyển đến của một người ở cùng, **toàn bộ hoá đơn cũ sẽ tự đổi số tiền** — vi phạm trực tiếp NFR-CMP-02.

Nếu **chỉ có (b)**, hệ thống mất khả năng biết ai ở cùng trong khoảng nào, không xử lý được trường hợp người chuyển đến giữa kỳ.

Do đó: **(a) là nguồn sự thật**, phản ánh thực tế người ra vào; **(b) là bản kết tinh bất biến**, ghi một lần tại thời điểm chốt kỳ rồi không bao giờ đổi. Đây đúng là mẫu hình mà tài liệu phiên bản 1.0 **đã áp dụng** cho `CHI_TIET_HOA_DON.don_gia` — lưu lại đơn giá tại thời điểm phát hành thay vì tra ngược sang bảng giá. Phiếu này chỉ mở rộng mẫu hình sẵn có sang dữ liệu nhân khẩu, nên không làm tăng độ phức tạp khái niệm của hệ thống.

---

## CR-003

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-003 |
| **Ngày đề xuất** | 23/08/2026 |
| **Người đề xuất** | *(điền tên)* |
| **Mô tả thay đổi** | Bổ sung bảng `BANG_GIA_BAC_THANG(id, dich_vu_id, bac, tu_so_luong, den_so_luong, ty_le, don_gia, ngay_hieu_luc)`. Bảng `BANG_GIA` hiện tại giữ nguyên, dùng cho dịch vụ tính theo đơn giá cố định. |
| **Lý do** | BR-02b đặc tả biểu giá điện sinh hoạt nhiều bậc, mỗi bậc có khoảng số lượng riêng và đơn giá riêng. Bảng `BANG_GIA` phiên bản 1.0 chỉ có một trường `don_gia` duy nhất kèm `ngay_hieu_luc`, tức **chỉ biểu diễn được một mức giá phẳng**, không có chỗ nào lưu ranh giới bậc. FR-BLD-08 còn yêu cầu cập nhật được biểu giá khi Nhà nước điều chỉnh, kèm ngày hiệu lực — nghĩa là phải lưu được **nhiều phiên bản** của cả bộ bậc thang. |
| **Yêu cầu bị ảnh hưởng** | BR-02b, BR-02c, FR-BLD-08, FR-INV-02, US-16, giả định A-06. |
| **Ước lượng công thêm** | 6 giờ |
| **Quyết định** | Chấp nhận |
| **Ngày cập nhật tài liệu** | *(điền khi sửa xong)* |

**Ghi chú thiết kế.** Bậc cuối cùng không có giới hạn trên, nên `den_so_luong` phải cho phép rỗng và được hiểu là vô cực. Khi tra giá cho một kỳ, phải lấy bộ bậc thang có `ngay_hieu_luc` **lớn nhất nhưng không vượt quá ngày kết thúc kỳ** — không được lấy bộ mới nhất, vì làm vậy sẽ tính lại sai hoá đơn cũ mỗi khi Nhà nước tăng giá điện.

**Vì sao lưu mỗi bậc một dòng, không phải mỗi bậc một cột.** Đây là quyết định quan trọng hơn vẻ ngoài của nó, và phiếu CR-015 về sau đã chứng minh điều đó: cơ cấu biểu giá đổi từ 6 bậc xuống 5 bậc, mà cấu trúc bảng **không phải sửa một dòng nào**. Nếu thiết kế theo kiểu mỗi bậc một cột — `don_gia_bac_1` đến `don_gia_bac_6` — thì thay đổi đó sẽ kéo theo sửa bảng, sửa tệp di trú, sửa mã nguồn và sửa cả dữ liệu đã có.

**Vì sao có cả `ty_le` lẫn `don_gia`.** Bổ sung theo phiếu CR-015. Nhà nước quy định mỗi bậc bằng **tỷ lệ phần trăm của giá bán lẻ điện bình quân**, không phải bằng số tiền cố định; khi điều chỉnh giá điện, thông thường chỉ giá bình quân đổi còn tỷ lệ giữ nguyên. Lưu `ty_le` cho phép cập nhật toàn bộ biểu giá chỉ bằng một thao tác; lưu `don_gia` đã quy đổi bảo đảm hoá đơn cũ in lại vẫn ra đúng số cũ theo NFR-CMP-02.

---

## CR-004

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-004 |
| **Ngày đề xuất** | 23/08/2026 |
| **Người đề xuất** | *(điền tên)* |
| **Mô tả thay đổi** | Bổ sung hai trường vào bảng `CHI_SO_DICH_VU`: `chi_so_cuoi_cong_to_cu` và `chi_so_dau_cong_to_moi`, cả hai cho phép rỗng và chỉ có giá trị khi cờ `co_thay_cong_to` được bật. |
| **Lý do** | BR-09 quy định khi thay công tơ giữa kỳ, mức tiêu thụ bằng tổng của hai đoạn: phần chạy trên công tơ cũ, cộng phần chạy trên công tơ mới. Công thức này cần **bốn chỉ số**. Bảng `CHI_SO_DICH_VU` phiên bản 1.0 chỉ có `chi_so_dau`, `chi_so_cuoi` và một cờ luận lý `co_thay_cong_to` — tức hệ thống biết rằng đã có việc thay công tơ, nhưng **không có dữ liệu để tính ra con số**. Cờ này hiện chỉ có tác dụng cho FR-MTR-03 bỏ qua kiểm tra "chỉ số mới phải lớn hơn chỉ số cũ". |
| **Yêu cầu bị ảnh hưởng** | BR-09, FR-MTR-09, FR-MTR-03, US-15. |
| **Ước lượng công thêm** | 3 giờ |
| **Quyết định** | Chấp nhận |
| **Ngày cập nhật tài liệu** | *(điền khi sửa xong)* |

---

## CR-005

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-005 |
| **Mô tả thay đổi** | Mở rộng tập giá trị của `HOP_DONG.trang_thai`, bổ sung `DA_COC` (đã nhận cọc, chưa tới ngày bắt đầu) và `CHO_KY` (đã tạo, chưa nhận cọc). |
| **Lý do** | BR-11 định nghĩa trạng thái phòng **Đã đặt cọc** là "phòng có hợp đồng đã nhận cọc nhưng chưa đến ngày bắt đầu". Tập giá trị hiện tại của `HOP_DONG.trang_thai` chỉ gồm `HIEU_LUC`, `SAP_HET`, `DA_THANH_LY` — **không có giá trị nào biểu diễn được tình trạng đã cọc chưa bắt đầu**. Hệ quả: trạng thái phòng `DA_COC` mà chính ERD đã khai báo trong `PHONG.trang_thai` là **không thể suy ra được**. |
| **Yêu cầu bị ảnh hưởng** | BR-11, FR-BLD-05, US-09, US-06. |
| **Ước lượng công thêm** | 2 giờ |
| **Quyết định** | Chấp nhận |

---

## CR-006

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-006 |
| **Mô tả thay đổi** | Bổ sung bảng `SO_DU_KHA_DUNG(id, hop_dong_id, so_tien, nguon_hoa_don_id, ngay_phat_sinh, ngay_su_dung, hoa_don_su_dung_id)`. |
| **Lý do** | BR-13 quy định phần tiền người thuê trả thừa được chuyển thành **số dư khả dụng**, trừ vào hoá đơn kỳ sau. FR-INV-16 nhắc lại yêu cầu này. ERD phiên bản 1.0 **không có trường hay bảng nào lưu số dư**, nên khoản tiền thừa sau khi ghi nhận sẽ biến mất khỏi hệ thống. |
| **Yêu cầu bị ảnh hưởng** | BR-13, FR-INV-16, FR-INV-11, US-20. |
| **Ước lượng công thêm** | 3 giờ |
| **Quyết định** | Chấp nhận |

**Ghi chú thiết kế.** Chọn dạng **bảng nhiều dòng** thay vì một trường số dư trên hợp đồng, để mỗi khoản dư truy được về hoá đơn đã sinh ra nó và hoá đơn đã tiêu nó. Một trường số dư đơn thuần sẽ cho ra con số đúng nhưng **không giải thích được vì sao**, và khi người thuê thắc mắc thì không tra ra lịch sử — đi ngược nguyên tắc minh bạch ở mục 1.2.

---

## CR-007

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-007 |
| **Mô tả thay đổi** | Bổ sung bảng `CHI_SO_TONG(id, ky_id, toa_nha_id, dich_vu_id, chi_so_dau, chi_so_cuoi, nguoi_ghi_id, thoi_diem_ghi)`. |
| **Lý do** | BR-19 quy định cách tính tỷ lệ thất thoát bằng cách so sánh **chỉ số công tơ tổng của toà nhà** với tổng chỉ số các phòng. FR-RPT-06 yêu cầu nhập chỉ số công tơ tổng theo kỳ. `TOA_NHA` có sẵn trường `nguong_that_thoat` để đặt ngưỡng cảnh báo, nhưng **không có nơi nào lưu chính con số công tơ tổng** để so sánh với ngưỡng đó. |
| **Yêu cầu bị ảnh hưởng** | BR-19, FR-RPT-06, US-34. |
| **Ước lượng công thêm** | 3 giờ |
| **Quyết định** | Chấp nhận |

---

## CR-008

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-008 |
| **Mô tả thay đổi** | Bổ sung bảng `KHOAN_PHAT_SINH(id, hop_dong_id, nguon_loai, nguon_id, ten_khoan, so_tien, loai, trang_thai, hoa_don_id)` với `trang_thai` nhận giá trị `CHO_TINH` hoặc `DA_TINH`. |
| **Lý do** | Use case UC-10 bước 4 và FR-MNT-06 mô tả việc cộng **các khoản phát sinh đang chờ** vào hoá đơn, ví dụ chi phí sửa chữa mà người thuê phải chịu. ERD phiên bản 1.0 có trường `YEU_CAU_SUA_CHUA.chi_phi` và `ben_chiu_chi_phi`, nhưng **không có gì đánh dấu khoản đó đã được tính vào hoá đơn nào chưa**. Đây không chỉ là thiếu dữ liệu mà là **lỗi nghiệp vụ có hậu quả tiền bạc**: quy trình tạo hoá đơn sẽ quét lại các yêu cầu sửa chữa mỗi kỳ và tính lại cùng một khoản chi phí, khiến người thuê **bị thu tiền lặp mỗi tháng** cho một lần sửa chữa duy nhất. |
| **Yêu cầu bị ảnh hưởng** | FR-MNT-06, FR-INV-05, UC-10, BR-06, US-16, US-25. |
| **Ước lượng công thêm** | 5 giờ |
| **Quyết định** | Chấp nhận |

**Ghi chú thiết kế.** Cặp `nguon_loai` và `nguon_id` cho phép khoản phát sinh đến từ nhiều nguồn khác nhau — sửa chữa, đền bù tài sản hỏng, phạt vi phạm nội quy — mà không phải thêm bảng mới cho từng loại. Đổi lại, ràng buộc khoá ngoại không kiểm được ở tầng cơ sở dữ liệu, nên **phải kiểm ở tầng ứng dụng và phải có kiểm thử riêng cho việc này**. Nêu rõ đánh đổi ở đây để người đọc báo cáo hiểu đây là lựa chọn có cân nhắc, không phải sơ suất.

---

## CR-009

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-009 |
| **Mô tả thay đổi** | Bổ sung bảng `GIAO_DICH_COC(id, hop_dong_id, loai, so_tien, ngay, nguoi_thu_id, ma_bien_lai, ly_do)` với `loai` nhận giá trị `THU_COC`, `HOAN_COC`, `KHAU_TRU_COC`. |
| **Lý do** | BR-07 quy định tiền cọc **không phải là một dòng của hoá đơn** mà là khoản mục riêng. `HOP_DONG.tien_coc` chỉ lưu **số tiền phải cọc theo thoả thuận**, không phải bản ghi rằng khoản đó đã thu hay chưa, thu ngày nào, ai thu. Tiêu chí chấp nhận của US-09 yêu cầu "hệ thống ghi nhận khoản thu tiền cọc chờ xác nhận", còn US-11 yêu cầu khi thanh lý hợp đồng phải đối trừ cọc với công nợ và các khoản đền bù — cả hai đều **không có dữ liệu để thực hiện**. |
| **Yêu cầu bị ảnh hưởng** | BR-07, BR-17, US-09, US-11, FR-TNT-08, FR-TNT-09. |
| **Ước lượng công thêm** | 4 giờ |
| **Quyết định** | Chấp nhận |

---

## CR-010

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-010 |
| **Mô tả thay đổi** | Bổ sung ba trường vào bảng `THANH_TOAN`: `loai` (nhận `THU` hoặc `DOI_UNG`), `dieu_chinh_cho_id` (khoá ngoại tự trỏ, cho phép rỗng), `ly_do` (chuỗi, bắt buộc khi `loai` là `DOI_UNG`). |
| **Lý do** | BR-18 và FR-INV-14 cấm xoá bản ghi thanh toán, chỉ cho phép điều chỉnh bằng **bút toán đối ứng kèm lý do**. Bảng `THANH_TOAN` phiên bản 1.0 không có trường nào phân biệt bút toán thu với bút toán đối ứng, không có trường nào trỏ về bản ghi bị điều chỉnh, và **không có trường lý do** — trong khi lý do là thứ chính quy tắc BR-18 đòi hỏi. |
| **Yêu cầu bị ảnh hưởng** | BR-18, FR-INV-14, FR-INV-12, NFR-CMP-01, US-20. |
| **Ước lượng công thêm** | 2 giờ |
| **Quyết định** | Chấp nhận |

**Ghi chú thiết kế.** Bút toán đối ứng mang số tiền **âm**, nên `THANH_TOAN.so_tien` không được đặt ràng buộc phải dương. Công thức tính "đã thu" của BR-08 là tổng đại số toàn bộ bản ghi, nhờ đó vẫn đúng mà không cần sửa quy tắc.

---

# PHẦN B — NHÓM MÂU THUẪN

## CR-011

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-011 |
| **Mô tả thay đổi** | Bỏ vế "cộng thuế giá trị gia tăng theo thuế suất cấu hình" khỏi BR-02b. Hệ thống **không tính thuế GTGT**. |
| **Lý do** | Đây là mâu thuẫn nội tại giữa ba chỗ trong tài liệu phiên bản 1.0: BR-02b nói có cộng thuế GTGT; ví dụ tính hoá đơn ở mục 2.4.4.5 **không có dòng thuế nào**; và tập giá trị của `CHI_TIET_HOA_DON.loai_khoan` gồm `DICH_VU`, `PHAT_SINH`, `GIAM_TRU`, `LAM_TRON` — **không có loại khoản nào dành cho thuế**. Ngoài ra không có trường nào trong toàn bộ ERD lưu thuế suất. Về mặt nghiệp vụ, chủ nhà trọ cá nhân không phát hành hoá đơn giá trị gia tăng, nên giữ lại vế này vừa làm mô hình phức tạp thêm vừa sai bản chất. |
| **Yêu cầu bị ảnh hưởng** | BR-02b, mục 2.4.4.5, FR-INV-02. |
| **Ước lượng công thêm** | 1 giờ |
| **Quyết định** | Chấp nhận |

---

## CR-012

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-012 |
| **Mô tả thay đổi** | Thống nhất nguyên tắc xử lý trạng thái suy ra được. Cụ thể: (a) `PHONG.trang_thai` và `HOP_DONG.trang_thai` được giữ lại nhưng **khai báo rõ là giá trị đệm**, chỉ hệ thống được ghi, người dùng không sửa tay; (b) **bỏ giá trị `SAP_HET`** khỏi `HOP_DONG.trang_thai`; (c) bổ sung mục quy định thời điểm tính lại giá trị đệm. |
| **Lý do** | Tài liệu phiên bản 1.0 không nhất quán ở điểm này. BR-11 tuyên bố trạng thái phòng được **suy ra tự động từ dữ liệu và không cho sửa tay**, nhưng ERD vẫn để `trang_thai` là một cột lưu bình thường, không có ghi chú nào. Nghiêm trọng hơn là `SAP_HET`: BR-14 định nghĩa "sắp hết hạn" bằng **một công thức ngày** — còn dưới 30 ngày đến ngày kết thúc — nghĩa là giá trị này thay đổi theo thời gian ngay cả khi **không ai động vào dữ liệu**. Lưu nó thành một trạng thái đòi hỏi phải có tác vụ chạy hằng ngày quét lại toàn bộ hợp đồng, và nếu tác vụ đó lỗi một hôm thì dữ liệu sai mà không ai biết. |
| **Yêu cầu bị ảnh hưởng** | BR-11, BR-14, FR-TNT-10, FR-BLD-05, US-06, US-10. |
| **Ước lượng công thêm** | 4 giờ |
| **Quyết định** | Chấp nhận |

**Ghi chú thiết kế.** "Sắp hết hạn" không phải trạng thái của hợp đồng mà là **một cách nhìn hợp đồng đang hiệu lực dưới góc độ thời gian**. Đúng chỗ của nó là điều kiện truy vấn hoặc một khung nhìn, không phải một giá trị lưu trong cột. Giữ lại `PHONG.trang_thai` làm giá trị đệm là chấp nhận được vì màn hình sơ đồ phòng ở FR-BLD-05 cần hiển thị nhanh hàng chục phòng cùng lúc; nhưng phải ghi rõ đó là đệm, và phải có kiểm thử đối chiếu giá trị đệm với giá trị tính lại từ dữ liệu gốc.

---

## CR-013

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-013 |
| **Mô tả thay đổi** | Thay trường `NGUOI_THUE.anh_giay_to_url` bằng quan hệ tới bảng `ANH_DINH_KEM` đã có sẵn, dùng cặp `doi_tuong_loai` = `NGUOI_THUE` và `doi_tuong_id`. Đổi trường `ANH_DINH_KEM.duong_dan` thành `khoa_luu_tru`. |
| **Lý do** | Hai vấn đề. Thứ nhất, NFR-SEC-04 yêu cầu ảnh giấy tờ tuỳ thân phải nằm ngoài vùng truy cập công khai và **chỉ phát qua liên kết có hạn không quá 15 phút** — trong khi việc lưu sẵn một địa chỉ URL trong cơ sở dữ liệu đi ngược lại nguyên tắc đó, vì URL cố định thì không có hạn dùng. Thứ hai, thẻ căn cước công dân **có hai mặt**, nên một trường chuỗi đơn không đủ chỗ. |
| **Yêu cầu bị ảnh hưởng** | NFR-SEC-04, FR-TNT-03, US-07, mục 2.4.5. |
| **Ước lượng công thêm** | 3 giờ |
| **Quyết định** | Chấp nhận |

**Ghi chú thiết kế.** Đổi tên trường không phải chuyện hình thức. `duong_dan` gợi ý rằng giá trị lưu là thứ có thể đưa thẳng cho trình duyệt; `khoa_luu_tru` nói rõ đây chỉ là **định danh nội bộ**, muốn xem ảnh thì phải xin hệ thống cấp một liên kết ký có hạn. Tên trường đặt đúng sẽ ngăn được lỗi cài đặt về sau — người viết mã sẽ không vô tình trả thẳng giá trị này ra giao diện.

---

# PHẦN C — NHÓM CẬP NHẬT

## CR-014

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-014 |
| **Mô tả thay đổi** | Sửa ràng buộc C-02 ở mục 2.4.6. Nội dung mới: nhóm sử dụng một máy chủ riêng ảo tự thuê, chi phí do nhóm tự chi trả; không sử dụng dịch vụ đám mây tính phí theo lưu lượng. Bổ sung giả định về tên miền riêng phục vụ chứng chỉ bảo mật. |
| **Lý do** | Ràng buộc C-02 phiên bản 1.0 ghi nhóm **không có ngân sách mua dịch vụ trả phí**. Sau khi cân nhắc phương án triển khai, nhóm quyết định thuê máy chủ riêng ảo, vì các gói lưu trữ miễn phí có ba nhược điểm không chấp nhận được: cơ sở dữ liệu miễn phí thường bị thu hồi sau một số ngày cố định; máy chủ ứng dụng tự ngủ khi không có truy cập, gây chờ lâu ở lần truy cập đầu; và đĩa lưu trữ là đĩa tạm, mất toàn bộ tệp đã tải lên sau mỗi lần khởi động lại — điều này **trực tiếp phá vỡ** yêu cầu lưu ảnh công tơ ở FR-MTR-06. Giữ nguyên C-02 sẽ khiến chương triển khai mâu thuẫn với chương ràng buộc. |
| **Yêu cầu bị ảnh hưởng** | C-02, NFR-SEC-01 (bắt buộc mã hoá đường truyền, cần tên miền để cấp chứng chỉ), FR-MTR-06, NFR-SEC-04, NFR-REL-01, NFR-REL-02. |
| **Ước lượng công thêm** | 1 giờ |
| **Quyết định** | Chấp nhận |

---

## CR-015

| Trường | Nội dung |
|---|---|
| **Mã CR** | CR-015 |
| **Ngày đề xuất** | 23/08/2026 |
| **Người đề xuất** | *(điền tên)* |
| **Mô tả thay đổi** | Sửa BR-02b: cơ cấu biểu giá bán lẻ điện sinh hoạt là **5 bậc**, không phải 6 bậc. Sửa lại khoảng sản lượng và đơn giá của từng bậc. Bổ sung cách quy định giá theo **tỷ lệ phần trăm của giá bán lẻ điện bình quân**. Cập nhật phát hiện D4 ở mục 2.2.5 và danh mục tài liệu tham khảo. |
| **Lý do** | Khi chuẩn hoá danh mục tài liệu tham khảo, nhóm phát hiện mục R2 phiên bản 1.0 chỉ ghi *"Quyết định về giá bán lẻ điện sinh hoạt 6 bậc, áp dụng từ 10/5/2025"* mà **không có số hiệu văn bản**. Tra cứu để bổ sung số hiệu thì phát hiện cơ cấu biểu giá đã thay đổi: **Quyết định 14/2025/QĐ-TTg ngày 29/5/2025** rút biểu giá điện sinh hoạt từ 6 bậc xuống **5 bậc**. Biểu 6 bậc mà tài liệu phiên bản 1.0 dùng đã bị thay thế. |
| **Yêu cầu bị ảnh hưởng** | BR-02b, BR-02c, FR-BLD-07, FR-BLD-08, FR-INV-02, phát hiện D4 ở mục 2.2.5, tài liệu tham chiếu R2, giả định A-06, US-06, US-16. |
| **Ước lượng công thêm** | 3 giờ |
| **Quyết định** | Chấp nhận |
| **Ngày cập nhật tài liệu** | 23/08/2026 |

**Cơ cấu mới:**

| Bậc | Sản lượng (kWh) | Tỷ lệ so với giá bình quân | Đơn giá quy đổi (đ/kWh, chưa VAT) |
|---|---|---|---|
| 1 | 0 – 100 | 90 % | 1.984 |
| 2 | 101 – 200 | 108 % | 2.380 |
| 3 | 201 – 400 | 136 % | 2.998 |
| 4 | 401 – 700 | 162 % | 3.571 |
| 5 | từ 701 trở lên | 180 % | 3.967 |

Quy đổi từ giá bán lẻ điện bình quân **2.204,0655 đ/kWh** theo Quyết định 1279/QĐ-BCT ngày 09/5/2025 của Bộ Công Thương.

**Ghi chú thiết kế — vì sao phiếu này không làm sập mô hình dữ liệu.**

Đây là điểm đáng chú ý nhất của phiếu. Một thay đổi pháp lý làm đổi **số bậc** của biểu giá lẽ ra là thay đổi lớn, nhưng bảng `BANG_GIA_BAC_THANG` do phiếu CR-003 đề xuất lưu **mỗi bậc một dòng** thay vì mỗi bậc một cột. Nhờ đó cơ cấu 5 bậc hay 6 bậc đều chứa được mà **không phải sửa cấu trúc bảng**, cũng không phải viết tệp di trú dữ liệu nào.

Ngoài ra, vì mỗi dòng mang `ngay_hieu_luc` riêng, biểu 6 bậc cũ và biểu 5 bậc mới **cùng tồn tại trong một bảng**: hoá đơn của kỳ trước ngày 29/5/2025 vẫn tra ra biểu cũ và in lại đúng số cũ, đúng như NFR-CMP-02 yêu cầu.

**Một phát hiện bổ sung, ảnh hưởng tới cách thiết kế bảng giá.** Quyết định 14/2025/QĐ-TTg không quy định đơn giá từng bậc bằng số tiền cố định, mà bằng **tỷ lệ phần trăm của giá bán lẻ điện bình quân**. Khi Nhà nước điều chỉnh giá điện, thông thường chỉ giá bình quân thay đổi còn các tỷ lệ giữ nguyên. Do đó bảng `BANG_GIA_BAC_THANG` nên lưu **cả hai**: tỷ lệ phần trăm để cập nhật toàn bộ biểu giá chỉ bằng một thao tác khi giá bình quân đổi, và đơn giá đã quy đổi để hoá đơn cũ in lại vẫn ra đúng số cũ.

**Bài học rút ra.** Phiếu này khác 14 phiếu trước ở chỗ: nó **không phải lỗi thiết kế mà là lỗi dữ kiện**, và nó không được tìm ra bằng phép đối chiếu quy tắc với mô hình. Nó lộ ra vì một lý do rất tình cờ — nhóm đi tra số hiệu văn bản để chuẩn hoá danh mục tài liệu tham khảo. Điều này cho thấy việc **trích dẫn đầy đủ số hiệu văn bản** không chỉ là hình thức học thuật: nếu phiên bản 1.0 đã ghi số hiệu ngay từ đầu, sai lệch này có thể được phát hiện sớm hơn nhiều.

---

## Kết luận đợt rà soát

Mười lăm phiếu trên phát sinh thêm khoảng **52 giờ công**, tương đương khoảng **8 điểm ước lượng**, tức chừng 4,7% so với tổng 171 điểm của phạm vi Must have cộng Should have.

Điều đáng chú ý không nằm ở con số đó, mà ở chỗ **10 trong 15 vấn đề là lỗi chặn**: nếu không phát hiện ở giai đoạn thiết kế, chúng sẽ chỉ lộ ra khi lập trình viên bắt tay viết đúng chức năng liên quan — thời điểm mà việc sửa cấu trúc bảng đã kéo theo sửa mã nguồn, sửa dữ liệu thử và sửa cả kiểm thử. Riêng CR-008 còn thuộc loại nguy hiểm hơn: nó **không làm chương trình báo lỗi**, chỉ âm thầm thu tiền người thuê lặp lại mỗi kỳ, và có thể không ai phát hiện cho tới khi có người khiếu nại.

Một nhận xét về phương pháp, đáng ghi lại cho các đợt rà soát sau. Mười bốn vấn đề đầu đều được tìm ra bằng **một thao tác cơ học duy nhất**: với mỗi quy tắc nghiệp vụ, liệt kê những trường dữ liệu mà công thức của nó cần đọc, rồi kiểm xem từng trường có tồn tại trong mô hình không. Không cần kinh nghiệm đặc biệt, chỉ cần làm đủ và làm có hệ thống. Điều này cho thấy giá trị của việc **viết quy tắc nghiệp vụ thành công thức tường minh** ở mục 2.4.4 — nếu quy tắc chỉ được mô tả bằng lời chung chung, phép đối chiếu này sẽ không thực hiện được, và các lỗi trên sẽ đi thẳng vào giai đoạn lập trình.
