# Phân hệ Quản lý toà nhà (QL)

Đọc `00-nen-tang-ux.md` trước. File này không lặp lại các quy tắc chung ở đó.

**Người đại diện:** chị Lan, sống tại tầng 1, quản lý một toà. Kỹ năng công nghệ cơ bản. **Ngại quy trình nhiều bước, sợ bấm nhầm làm mất dữ liệu.**

**Đây là phân hệ nặng nhất hệ thống** — 30/53 màn hình, và là nơi diễn ra toàn bộ chu kỳ tiền bạc. Nếu chỉ có ngân sách làm tốt một phân hệ, làm phân hệ này.

---

## 1. Bối cảnh dùng — hai mặt bằng, hai kiểu công việc

| | Việc bàn giấy | Việc hiện trường |
|---|---|---|
| **Thiết bị** | Máy tính để bàn, ngồi tại phòng làm việc tầng 1 | Điện thoại, đi bộ dọc hành lang |
| **Việc gì** | Khai báo giá, chốt kỳ, tạo hoá đơn, đối soát thu tiền, phân công sửa chữa | **Ghi chỉ số công tơ**, khai báo thay công tơ, thu tiền mặt tại phòng |
| **Điều kiện** | Yên tĩnh, có thời gian, hai tay rảnh | **Tối, sóng yếu, một tay cầm điện thoại một tay soi đèn**, làm liên tục 20–30 phòng |
| **Rủi ro chính** | Bấm nhầm nút không đảo ngược được | Gõ nhầm số phòng, gõ nhầm chỉ số |

Hai bối cảnh này đòi hỏi hai kiểu thiết kế khác hẳn nhau. **Đừng dùng một khuôn cho cả hai.**

> **Sự cố có thật trong khảo sát:** *"nhầm 302 với 305 khiến người ta cãi nhau cả tuần"*. Đây là lý do số phòng ở màn ghi chỉ số phải rất to.

---

## 2. Bản đồ tác vụ

| Tác vụ | Tần suất | Mức nghiêm trọng nếu sai | Mặt bằng |
|---|---|---|---|
| Ghi chỉ số công tơ | **Mỗi tháng, 20–30 lần liên tiếp** | Cao — sai là hoá đơn sai | Điện thoại |
| Chốt kỳ + tạo hoá đơn | Mỗi tháng, 1 lần | **Rất cao — không đảo ngược được** | Máy tính |
| Ghi nhận thu tiền | Vài lần/tuần | Cao — liên quan tiền thật | Cả hai |
| Đối soát công nợ | Vài lần/tuần | Trung bình | Máy tính |
| Phân công sửa chữa | Vài lần/tháng | Thấp | Máy tính |
| Ký hợp đồng mới | 1–2 lần/tháng | Cao — dữ liệu gốc cho mọi tính toán sau | Máy tính |
| Khai báo dịch vụ, bảng giá | **Vài lần/năm** | **Rất cao — sai là sai toàn bộ hoá đơn của kỳ** | Máy tính |

**Điều rút ra:** hai đầu bảng ngược nhau. Ghi chỉ số làm rất nhiều lần → tối ưu cho **tốc độ lặp**. Khai báo giá làm rất hiếm → tối ưu cho **không sai**, chấp nhận chậm, có bước xem lại.

---

## 3. Trang chủ = Bảng nhắc việc (`#42`)

`#3` bản của QL **chính là** `#42`. Không phải hai màn.

Đây là màn hình trả lời một câu duy nhất: **hôm nay tôi phải làm gì?**

### 3.1. Năm nhóm việc, xếp theo mức cấp bách

| Nhóm | Điều kiện xuất hiện | Bấm vào → | Nhãn ví dụ |
|---|---|---|---|
| **Kỳ sẵn sàng chốt** | Đã ghi đủ chỉ số | `#20` | *"Kỳ 08/2026 đã ghi đủ 24/24 phòng — sẵn sàng chốt"* |
| **Phòng thiếu chỉ số** | Gần tới ngày chốt số mà còn thiếu | `#18` lọc sẵn phòng thiếu | *"Còn 3 phòng chưa ghi chỉ số, ngày chốt còn 2 ngày"* |
| **Hoá đơn quá hạn** | Có hoá đơn quá hạn thanh toán | `#30` lọc quá hạn | *"5 hoá đơn quá hạn — tổng 8.450.000 đ"* |
| **Sự cố mới** | Có yêu cầu chưa phân công | `#38` lọc mới | *"2 yêu cầu sửa chữa chưa phân công"* |
| **Hợp đồng sắp hết hạn** | Còn < 30 ngày (`FR-POR-07`) | `#14` lọc sắp hết hạn | *"Hợp đồng phòng 302 còn 12 ngày"* |

### 3.2. Bốn quy tắc của màn này

1. **Nhóm không có việc thì không hiện.** Không hiện *"0 sự cố mới"* — dòng đó chiếm chỗ mà không mang tin. Hết việc thì hiện trạng thái rỗng tử tế: *"Không có việc nào cần làm hôm nay."*
2. **Mỗi nhóm có con số cụ thể**, không phải chấm tròn báo hiệu. *"3 phòng"* hành động được; một chấm đỏ thì không.
3. **Bấm vào nhóm là tới màn đã lọc sẵn**, không phải tới danh sách đầy đủ rồi tự lọc lại.
4. **Thứ tự nhóm cố định**, không nhảy chỗ giữa các lần tải. Người dùng nhớ vị trí bằng cơ bắp.

---

## 4. Luồng lõi — Chu kỳ tính tiền hàng tháng

Đây là lý do tồn tại của cả sản phẩm. Chín bước, hai mặt bằng.

### 4.1. Sơ đồ tổng thể

```
       ── ĐIỆN THOẠI, NGOÀI HÀNH LANG ──      ── MÁY TÍNH, BÀN LÀM VIỆC ──

#17 Kỳ ──▶ #18 Ghi chỉ số ──▶ #17  ──▶  #20 Chốt kỳ ──▶ #21 Tạo hoá đơn
              │  ▲                            │  │                │
              ▼  │                     thiếu ─┘  └─ thiếu giá     ▼
        #19 Thay công tơ                 ▼            ▼      #22 Danh sách
                                      về #18       #10/#11        │
                                                                  ▼
                                                            #23 Chi tiết ──▶ #24 Sửa nháp
                                                                  │
                                                            phát hành
                                                                  ▼
                                                        (người thuê thấy)
```

### 4.2. Bước 1–5: Ghi chỉ số (`#17` → `#18` → `#19`)

**Điều kiện vào:** kỳ đang mở, có hợp đồng hiệu lực.

| Bước | Ở đâu | Người dùng làm gì | Hệ thống làm gì |
|---|---|---|---|
| 1 | `#17` Danh sách kỳ | Bấm kỳ đang mở | Mở `#18`, cuộn tới phòng chưa ghi đầu tiên |
| 2 | `#18` | Gõ chỉ số phòng 201 | **Hiện ngay** `= 58 kWh` dưới ô (`FR-MTR-02`) |
| 3 | `#18` | Bấm Enter (máy tính) hoặc nút Lưu (điện thoại) | Lưu, dòng nhấp nháy xanh 400ms, **tự cuộn tới phòng 202**, thanh tiến độ `12/24` |
| 4 | `#18` | Lặp lại cho 20–30 phòng | — |
| 5 | `#18` | Ghi xong phòng cuối | Hiện *"Đã ghi đủ 24/24 phòng"* + nút **Về danh sách kỳ** |

**Nhánh 3b — thay công tơ:** ở dòng phòng bất kỳ, bấm *"Công tơ đã thay"* → `#19` với **4 ô** (chỉ số đầu kỳ, chỉ số cuối công tơ cũ, chỉ số đầu công tơ mới, chỉ số cuối kỳ). Lưu xong ⟲ về `#18` **đúng vị trí phòng đó**, tiếp tục phòng kế. Công thức `BR-09` phải hiện ra cho người dùng thấy, không tính ngầm.

### 4.3. Màn `#18` — đặc tả chi tiết

Đây là màn quan trọng nhất hệ thống. `NFR-USA-02` đặt ra tiêu chí đo được: **người quản lý mới, sau 15 phút hướng dẫn, ghi xong 30 phòng mà không cần trợ giúp.**

#### Bố cục thông tin mỗi dòng phòng

```
┌──────────────────────────────────────────────────┐
│  302              ← số phòng RẤT TO             │
│  Kỳ trước: 1.240                                 │
│  ┌──────────────────┐                            │
│  │ 1298             │  = 58 kWh                  │  ← hiện ngay khi gõ
│  └──────────────────┘                            │
│  [📷 Chụp ảnh công tơ]        ● Chưa gửi         │
└──────────────────────────────────────────────────┘
```

#### Mười yêu cầu bắt buộc

| # | Yêu cầu | Vì sao |
|---|---|---|
| 1 | Phòng xếp **theo tầng rồi theo số phòng**, không xáo trộn giữa các lần mở | Chị Lan đi theo thứ tự vật lý của hành lang (`FR-MTR-01`) |
| 2 | **Số phòng rất to** | Sự cố nhầm 302/305 có thật |
| 3 | Chỉ số kỳ trước **hiện sẵn cạnh ô nhập**, không phải bấm mới thấy | `FR-MTR-01` |
| 4 | Ô nhập to, **mở bàn phím số** | Một tay, trời tối |
| 5 | **Tính tiêu thụ ngay khi gõ** | `FR-MTR-02` — bắt lỗi khi còn đứng trước công tơ |
| 6 | Lưu xong **tự nhảy phòng kế** | Bỏ được một thao tác × 30 lần |
| 7 | **Thanh tiến độ có số thật** `12/24` | Biết còn bao xa |
| 8 | Nút chụp ảnh **ngay trên dòng đó** | `FR-MTR-06`. Nếu toà bật bắt buộc ảnh (`FR-MTR-07`) thì thiếu ảnh **không lưu được**, và phải nói rõ ngay |
| 9 | **Hoạt động khi mất mạng** | `FR-MTR-05` — xem mục 7 của file nền tảng |
| 10 | **Không cuộn ngang, không hộp thoại nhiều bước, không nút sát mép màn hình** | Ngón cái, một tay |

#### Ba trạng thái của mỗi dòng

| Trạng thái | Dấu hiệu | Hành vi |
|---|---|---|
| **Chưa ghi** | Ô trống, nhãn chữ *"Chưa ghi"* | Cho gõ |
| **Đã ghi** | Số + mức tiêu thụ + nhãn *"Đã ghi"* | Cho sửa lại, trừ khi kỳ đã chốt |
| **Cảnh báo tiêu thụ bất thường** | Nhãn *"Cao bất thường"* + giải thích | **Không chặn** — cho xác nhận và đi tiếp |

**Cảnh báo bất thường (`FR-MTR-04`, `BR-09`)** phải nói đủ ba số, không chỉ nói "bất thường":

> *"Kỳ này 180 kWh. Trung bình 3 kỳ gần nhất: 62 kWh. **Gấp 2,9 lần.** Kiểm tra lại chỉ số hoặc xác nhận nếu đúng."*
> `[Sửa lại]` `[Đúng, ghi nhận]`

Vì sao không chặn: có thể đúng thật — nhà mới lắp điều hoà, hoặc đông người hơn. Chặn cứng sẽ khiến chị Lan bỏ qua cả màn hình. Cảnh báo có số cụ thể thì chị tự quyết được.

#### Lỗi và cách xử lý

| Lỗi | Câu chữ | Hành động |
|---|---|---|
| Chỉ số mới < kỳ trước (`BR-09`, `FR-MTR-03`) | *"Chỉ số mới (1.180) nhỏ hơn kỳ trước (1.240). Nếu vừa thay công tơ, chọn 'Công tơ đã thay'."* | **Chặn lưu** + nút mở `#19` |
| Thiếu ảnh khi toà bật bắt buộc | *"Toà này yêu cầu ảnh công tơ. Chụp ảnh trước khi lưu."* | Chặn lưu + nút mở máy ảnh |
| Kỳ đã phát hành hoá đơn (`FR-MTR-10`) | *"Kỳ này đã phát hành hoá đơn. Chỉ Chủ sở hữu sửa được chỉ số, và thao tác sẽ được ghi nhật ký."* | Ô nhập **khoá**, không phải hiện rồi báo lỗi |
| Mất mạng | Dải chữ *"Đang ngoại tuyến — đã lưu 7 phòng trên máy"* | **Vẫn cho gõ tiếp** |

### 4.4. Bước 6–7: Chốt kỳ (`#20`)

**Đây là điểm không quay lại đầu tiên.** Sau khi chốt, chỉ số bị khoá.

| Bước | Người dùng làm gì | Hệ thống làm gì |
|---|---|---|
| 6 | Ở `#17`, bấm *"Chốt kỳ"* | Mở `#20`, **liệt kê phòng còn thiếu dữ liệu** (`FR-MTR-08`) |
| 7a | Còn thiếu → bấm vào một phòng | ⟲ `#18` đúng phòng đó |
| 7b | Đủ rồi → bấm *"Xác nhận chốt"* | **Hộp thoại nêu hậu quả** (mục 8.3 file nền tảng) → chốt → mở `#21` |

`#20` phải chia phòng thiếu thành **ba nhóm có cách sửa khác nhau**, không gộp thành một danh sách chung:

| Nhóm thiếu | Ví dụ | Bấm vào dẫn tới |
|---|---|---|
| Thiếu chỉ số | 3 phòng chưa ghi | `#18` |
| Thiếu bảng giá cho kỳ | Dịch vụ "Nước" chưa có giá hiệu lực tháng 08 | `#10` |
| Không xác định được số người ở | Phòng 305 chưa khai người ở cùng | `#16` |

Đây là điểm mà brief cũ để trống và khiến `#20`/`#21` bị thiết kế tách rời khỏi `#9`/`#10`/`#11`. **Ba nhóm này chính là đường găng** — không có dữ liệu giá thì không có hoá đơn.

### 4.5. Bước 8–9: Tạo hoá đơn hàng loạt (`#21`)

**Điểm không quay lại thứ hai.**

Đặc thù: đây là tác vụ **chạy lâu trên nhiều bản ghi**, và **một số bản ghi sẽ thất bại trong khi số khác thành công** (`FR-INV-03` — bỏ qua phòng thiếu dữ liệu, không làm gián đoạn phòng khác). Thiết kế phải phản ánh đúng bản chất đó:

```
Đang tạo hoá đơn kỳ 08/2026 — toà A

████████████░░░░░░░░  12/24 phòng

✓ Đã tạo      10 hoá đơn
⚠ Bỏ qua       2 phòng
```

**Sau khi xong, hiện báo cáo hai phần:**

| Phần | Nội dung | Hành động |
|---|---|---|
| **Đã tạo** | 22 hoá đơn, tổng 41.536.000 đ | Nút *"Xem danh sách"* → `#22` |
| **Bỏ qua** | Từng phòng + **lý do cụ thể** | Mỗi dòng có nút *"Sửa"* dẫn tới đúng màn khắc phục |

Ví dụ dòng bỏ qua:

> `Phòng 305 — Chưa xác định số người ở trong kỳ` `[Khai báo người ở]`
> `Phòng 410 — Dịch vụ "Nước" chưa có bảng giá hiệu lực từ 01/08/2026` `[Mở bảng giá]`

**Sau khi sửa xong, cho chạy lại chỉ với các phòng bỏ qua** — không bắt chạy lại toàn bộ 24 phòng. `FR-INV-04` đã cấm tạo hai hoá đơn cùng phòng cùng kỳ, nên chạy lại phải an toàn.

### 4.6. Ba đặc tính của luồng này không được đánh mất

1. **Có thể bỏ dở và quay lại.** Ghi chỉ số 12/24 phòng rồi hết giờ → đóng trình duyệt → hôm sau mở lại đúng chỗ. Không có "phiên làm việc" nào bị mất.
2. **Đường lùi luôn rõ.** Ở mỗi bước, người dùng biết mình đang ở đâu trong 9 bước và lùi được bước nào.
3. **Hai điểm không quay lại được đánh dấu rõ ràng** và chỉ có hai — chốt kỳ và phát hành. Mọi bước khác đều sửa được.

---

## 5. Luồng thiết lập giá (`#9` → `#10`/`#11`)

**Tần suất: vài lần/năm. Hậu quả nếu sai: toàn bộ hoá đơn của kỳ sai.**

Vì hiếm và nguy hiểm, luồng này tối ưu ngược với luồng ghi chỉ số: **chậm, có bước xem lại, hiện hậu quả trước khi lưu.**

| Bước | Ở đâu | Chi tiết |
|---|---|---|
| 1 | `#9` Khai báo dịch vụ | Chọn một trong **4 cách tính**: theo chỉ số công tơ · theo đầu người · cố định theo phòng · bậc thang |
| 2 | `#9` | **Nút dẫn sang màn giá đổi theo cách tính vừa chọn** — không hiện cả hai nút cố định |
| 3a | `#11` Biểu giá bậc thang | 5 bậc. Nhập theo tỷ lệ so với giá trung bình |
| 3b | `#10` Bảng giá theo ngày hiệu lực | Thêm mức giá mới → giá cũ **tự đóng ngày hiệu lực**, hiện cả lịch sử |

### 5.1. Ba yêu cầu UX riêng của luồng này

**1. Hiện trước hậu quả bằng một ví dụ có thật.** Trước khi lưu bảng giá mới, hiện:

> *"Áp dụng từ 01/09/2026. Với mức tiêu thụ trung bình kỳ trước, phòng 302 sẽ trả **248.000 đ** thay vì 203.000 đ (**+22%**)."*

Đây là cách rẻ nhất để chị Lan phát hiện mình gõ nhầm `35.000` thành `3.500`.

**2. Không bao giờ sửa đè giá cũ.** Giá là dữ liệu có hiệu lực theo thời gian. Thêm mức mới, giá cũ đóng lại — hoá đơn kỳ trước phải tính lại được đúng như lúc phát hành (`NFR-CMP-02` về tính bất biến).

**3. Lịch sử giá luôn thấy được** trên cùng màn `#10`, không giấu sau tab riêng. Khi người thuê thắc mắc *"tháng trước sao rẻ hơn"*, chị Lan cần mở ra được ngay.

---

## 6. Luồng người thuê và hợp đồng (`#12`–`#16`, `#31`)

| Bước | Ở đâu | Người dùng làm gì | Ghi chú UX |
|---|---|---|---|
| 1 | `#14` | Bấm *"Hợp đồng mới"* | Mở `#15` |
| 2 | `#15` bước 1 | Chọn phòng | Chỉ hiện phòng **Trống** — không hiện phòng đang thuê rồi báo lỗi |
| 3 | `#15` bước 2 | Chọn người thuê | Có sẵn → chọn từ `#12`. Chưa có → nút *"Thêm người thuê"* mở `#13` |
| 4 | `#13` | Nhập hồ sơ + ảnh giấy tờ | Lưu xong **⟲ đúng bước 2 của `#15`**, dữ liệu bước 1 còn nguyên |
| 5 | `#15` bước 3 | Thời hạn, giá thuê, cọc | Tự tính ngày kết thúc từ thời hạn |
| 6 | `#15` bước 4 | Người ở cùng, dịch vụ áp dụng | **Số người ở là đầu vào bắt buộc của `BR-02c`** — thiếu là hoá đơn không tính được |
| 7 | `#15` | Xem lại + Ký | → `#16` |
| 8 | `#16` | (sau này) Bấm *"Thanh lý"* | → `#31` |

### 6.1. Chống bỏ dở — điều kiện bắt buộc

Brief đã cảnh báo `#15` *"nhiều bước, dễ bỏ dở"*. Ba cơ chế:

1. **Lưu nháp sau mỗi bước.** Đóng trình duyệt giữa chừng → mở `#14` thấy dòng *"Hợp đồng nháp phòng 302 — bước 3/4, lưu lúc 14:20"*.
2. **Rẽ nhánh không phá tiến trình.** Đi tạo hồ sơ người thuê rồi quay lại đúng chỗ (bước 4 ở trên).
3. **Xem lại trước khi ký.** Bước cuối hiện toàn bộ thông tin đã nhập trên một màn, mỗi phần có nút *"Sửa"* nhảy về đúng bước.

### 6.2. Ảnh giấy tờ — `BR-17`

Ảnh giấy tờ tuỳ thân là dữ liệu nhạy cảm nhất trong hệ thống.

| Yêu cầu | Thể hiện ở giao diện |
|---|---|
| Chỉ Chủ và QL của **chính toà đó** xem được | Người khác mở URL ảnh → 403 |
| Mọi lượt xem **ghi nhật ký** | Hiện dòng nhắc: *"Lượt xem này được ghi nhật ký"* — không giấu, để người xem có ý thức |
| Ảnh qua liên kết ký hạn **15 phút** | Cần **trạng thái đang lấy liên kết** và **trạng thái liên kết hết hạn** kèm nút *"Lấy lại"* |
| Số giấy tờ **che bớt** ở danh sách | `0790xxxxx456`. Bấm mới hiện đủ, và lượt hiện cũng ghi nhật ký |

---

## 7. Luồng thu tiền (`#30` → `#23` → `#26`/`#27`/`#28`)

| Bước | Ở đâu | Chi tiết |
|---|---|---|
| 1 | `#30` Công nợ | Sắp xếp **theo số ngày quá hạn giảm dần** — nợ lâu nhất lên đầu |
| 2 | `#30` | Bấm một dòng → `#23` |
| 3 | `#23` | Bấm *"Ghi nhận thu tiền"* → `#26` |
| 4 | `#26` | Nhập số tiền (có thể **thu một phần**, `FR-INV-11`) | Lưu → ⟲ `#23`, còn nợ giảm |
| 5 | `#23` | Đã thu đủ → *"In biên lai"* → `#28` (`FR-INV-13`) |
| 6 | `#23` | Ghi nhầm → *"Bút toán đối ứng"* → `#27` |

### 7.1. Không có nút xoá — `FR-INV-14`, `BR-18`

Đây là chỗ người dùng **mong đợi** có nút xoá và sẽ đi tìm. Nên phải xử lý chủ động:

- Chỗ thường đặt nút thùng rác → đặt nút **"Điều chỉnh"**.
- Bấm vào hiện giải thích ngắn: *"Bản ghi thu tiền không xoá được. Ghi nhầm thì lập bút toán đối ứng — số tiền vẫn đúng, và lịch sử vẫn đầy đủ."*
- `#27` hiện **cả hai dòng cạnh nhau**: dòng gốc và dòng đối ứng, để chị Lan thấy kết quả cuối cùng bằng mắt.

### 7.2. Thu tiền tại phòng — mặt bằng điện thoại

`#26` là màn duy nhất trong nhóm thu tiền được dùng trên điện thoại (thu tiền mặt tại cửa phòng). Yêu cầu riêng:

- Ô nhập số tiền **to**, bàn phím số.
- Nút gợi ý nhanh: `[Thu đủ 1.888.000]` — một chạm cho trường hợp phổ biến nhất.
- Sau khi lưu, hiện ngay **mã QR biên lai** để người thuê chụp lại.

### 7.3. Tiền thừa — `FR-INV-16`

Thu thừa thì phần dư chuyển thành số dư khả dụng trừ vào kỳ sau. Phải nói rõ tại chỗ, không âm thầm:

> *"Đã thu 2.000.000 đ / cần 1.888.000 đ. Thừa **112.000 đ** sẽ trừ vào hoá đơn kỳ sau."*

---

## 8. Luồng sự cố (`#38` → `#39` → `#48`)

| Bước | Ở đâu | Chi tiết |
|---|---|---|
| 1 | `#38` | Danh sách yêu cầu, nhóm theo trạng thái `BR-16` |
| 2 | `#38` | Bấm một yêu cầu → `#39` |
| 3 | `#39` | Xem mô tả + tối đa 5 ảnh người thuê gửi (`FR-MNT-01`) |
| 4 | `#39` | Chọn thợ → lưu | Thợ nhận việc ngay (xem `06-luong-xuyen-vai-tro.md`) |
| 5 | `#39` | Sau khi thợ báo xong → ghi chi phí + **bên chịu chi phí** (`FR-MNT-05`) |
| 6 | `#7`/`#8` | Bấm *"Lịch sử sửa chữa"* → `#48` lọc theo phòng |

**Điểm dễ bỏ sót — `FR-MNT-06`:** nếu bên chịu chi phí là **người thuê**, hệ thống tự tạo khoản phát sinh vào hoá đơn kỳ sau. Giao diện phải nói rõ tại lúc chọn:

> *"Chi phí 350.000 đ do người thuê chịu → sẽ tự thêm vào hoá đơn kỳ 09/2026 của phòng 302."*

Không nói thì tháng sau người thuê thấy khoản lạ trên hoá đơn và đó lại là một cuộc tranh cãi.

**`FR-MNT-09`:** phòng có từ 3 sự cố cùng hạng mục trong 6 tháng → cảnh báo. Hiện ngay trên `#39` khi mở yêu cầu thứ 3: *"Phòng 302 đã có 3 sự cố về điện trong 6 tháng. Có thể cần kiểm tra tổng thể."*

---

## 9. Luồng thông báo và an toàn (`#43`, `#51`)

| Bước | Ở đâu | Chi tiết |
|---|---|---|
| 1 | `#43` | Soạn thông báo, **chọn phạm vi**: cả toà / một tầng / một số phòng |
| 2 | `#43` | Trước khi gửi hiện: *"Gửi tới **18 người thuê** thuộc tầng 3 và tầng 4."* — con số cụ thể |
| 3 | `#43` | Gửi → xuất hiện ở `#44` của đúng những người đó |
| 4 | `#51` | Danh mục tự kiểm tra an toàn — có chu kỳ theo `BR-20` |

**Gửi thông báo là thao tác không thu hồi được.** Nhưng thay vì hộp thoại xác nhận, dùng cách nhẹ hơn: hiện số người nhận ngay cạnh nút gửi. Người dùng thấy `18 người` là đủ để dừng lại nếu chọn nhầm phạm vi.

---

## 10. Thiết lập toà và phòng (`#5`–`#8`)

| Bước | Ở đâu | Chi tiết |
|---|---|---|
| 1 | `#5` | Danh sách toà được phân công. **QL không tạo toà mới** — đó là quyền Chủ (`02-chu-so-huu.md`) |
| 2 | `#7` | Danh sách phòng + nút *"Tạo hàng loạt"* |
| 3 | `#7` | Tạo dãy `201–208` một lần | Xem 10.1 |
| 4 | `#8` | Sơ đồ phòng theo tầng | Xem 10.2 |

### 10.1. Tạo phòng hàng loạt — xem trước trước khi tạo

Nhập `201–208` rồi bấm tạo mà không xem trước là công thức gây ra 8 phòng sai tên. Bắt buộc có bước xem trước:

> Sẽ tạo **8 phòng**: 201, 202, 203, 204, 205, 206, 207, 208
> `[Sửa dải]` `[Tạo 8 phòng]`

### 10.2. Sơ đồ phòng (`#8`) — màn quét nhanh

Đây là màn để **nhìn một cái biết ngay tình hình cả toà**, không phải màn để thao tác.

- Mỗi ô phòng có **màu và nhãn chữ** (nguyên tắc 5, file nền tảng).
- Bấm một ô → mở bảng thông tin **ngay trong màn**, không rời `#8`. Vì người dùng thường xem 4–5 phòng liên tiếp; chuyển màn 5 lần rồi quay lại 5 lần là lãng phí.
- Trên máy tính: rê chuột lên ô hiện tóm tắt nhanh. Trên điện thoại: không có rê chuột, nên **thông tin quan trọng nhất phải nằm sẵn trên ô**, không giấu sau tương tác.

---

## 11. Danh sách màn hình của phân hệ này

| # | Màn | Mặt bằng chính | Trạng thái đặc biệt cần thiết kế |
|---|---|---|---|
| 5 | Danh sách toà nhà | 🖥 | Rỗng: *"Bạn chưa được phân công toà nào"* |
| 7 | Danh sách phòng + tạo hàng loạt | 🖥 | Rỗng lần đầu, xem trước dải phòng |
| 8 | Sơ đồ phòng theo tầng ★ | 🖥📱 | 5 trạng thái phòng, có nhãn chữ |
| 9 | Khai báo dịch vụ | 🖥 | Nút giá đổi theo cách tính |
| 10 | Bảng giá theo ngày hiệu lực | 🖥 | Lịch sử giá, xem trước tác động |
| 11 | Biểu giá điện bậc thang | 🖥 | 5 bậc, bậc cuối không giới hạn trên |
| 12 | Danh sách người thuê | 🖥 | Số giấy tờ che bớt |
| 13 | Hồ sơ người thuê + ảnh | 🖥 | Ảnh: đang lấy liên kết / hết hạn |
| 14 | Danh sách hợp đồng | 🖥 | Có dòng "hợp đồng nháp dở" |
| 15 | Ký hợp đồng | 🖥 | 4 bước, lưu nháp, xem lại |
| 16 | Chi tiết hợp đồng + người ở cùng | 🖥 | |
| 17 | Danh sách kỳ thanh toán | 🖥📱 | Kỳ đang mở lên đầu |
| 18 | **Ghi chỉ số ★★★** | **📱** | 3 trạng thái dòng + ngoại tuyến |
| 19 | Khai báo thay công tơ | 📱 | 4 ô, hiện công thức |
| 20 | Chốt kỳ + phòng còn thiếu | 🖥 | **3 nhóm thiếu khác nhau** |
| 21 | Tạo hoá đơn hàng loạt | 🖥 | Tiến độ thật + báo cáo bỏ qua |
| 22 | Danh sách hoá đơn | 🖥 | Rỗng-do-lọc ≠ rỗng lần đầu |
| 23 | **Chi tiết hoá đơn ★★★** | 🖥📱🖨 | Nút theo trạng thái `BR-08` |
| 24 | Sửa hoá đơn nháp | 🖥 | Chỉ hiện khi trạng thái Nháp |
| 26 | Ghi nhận thanh toán | 📱🖥 | Nút "Thu đủ", cảnh báo tiền thừa |
| 27 | Bút toán đối ứng | 🖥 | Hiện cả hai dòng cạnh nhau |
| 28 | Biên lai | 🖨 | |
| 29 | Mã QR chuyển khoản | 📱 | Lớp phủ, không rời màn |
| 30 | Công nợ | 🖥 | Sắp theo ngày quá hạn giảm dần |
| 31 | Thanh lý + quyết toán cọc | 🖥 | Hộp thoại nêu hậu quả |
| 38 | Danh sách yêu cầu sửa chữa | 🖥 | Nhóm theo `BR-16` |
| 39 | Chi tiết + phân công thợ | 🖥 | Cảnh báo 3 sự cố/6 tháng |
| 42 | **Bảng nhắc việc = trang chủ** | 🖥📱 | Nhóm rỗng thì ẩn |
| 43 | Soạn thông báo | 🖥 | Hiện số người nhận |
| 48 | Lịch sử sửa chữa theo phòng | 🖥 | |
| 51 | Danh mục tự kiểm tra an toàn | 🖥 | |

---

## 12. Sáu bẫy UX của phân hệ này

1. **Dùng một khuôn cho cả việc bàn giấy và việc hiện trường.** Ghi chỉ số cần tốc độ lặp; khai báo giá cần chậm và chắc. Thiết kế giống nhau là hỏng cả hai.
2. **Gộp ba nhóm "phòng còn thiếu" ở `#20` thành một danh sách.** Ba nhóm có ba cách sửa khác nhau; gộp lại là người dùng không biết làm gì tiếp.
3. **Chạy lại toàn bộ 24 phòng** sau khi sửa 2 phòng bỏ qua ở `#21`.
4. **Hiện nút Sửa trên hoá đơn đã phát hành rồi báo lỗi khi bấm.** Trạng thái `BR-08` phải quyết định nút nào **hiện**, không phải nút nào **báo lỗi**.
5. **Ẩn nút xoá mà không giải thích.** Người dùng sẽ đi tìm, không thấy, rồi kết luận phần mềm thiếu tính năng. Phải chủ động giải thích tại chỗ.
6. **Bắt chọn lại toà nhà ở từng màn.** Toà đã chọn ở thanh đầu là ngữ cảnh dùng chung cho toàn phiên làm việc.
