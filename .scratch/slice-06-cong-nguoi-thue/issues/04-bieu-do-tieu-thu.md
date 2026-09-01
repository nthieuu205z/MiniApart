# 04: Biểu đồ tiêu thụ 12 kỳ · FR-POR-05

**What to build:** Màn `#35` — biểu đồ tiêu thụ điện và nước theo 12 kỳ gần nhất.

**Blocked by:** 02

**Status:** ready-for-agent

## Hai quy tắc từ đặc tả UX, cả hai đều dễ làm sai

**1. Điện và nước phải tách riêng.** `Doc/UX/03-nguoi-thue.md` nói lý do trong một câu:

> *"12 kỳ gần nhất, điện và nước **tách riêng** — gộp chung hai đơn vị khác nhau là vô nghĩa"*

kWh và m³ không cộng được, không so được, không chồng lên một trục được.

**2. Biểu đồ **và** bảng, không chỉ biểu đồ.** Đặc tả ghi *"Biểu đồ **và** bảng; chạm hiện số"*.

Biểu đồ trả lời *"tháng này có bất thường không"*. Bảng trả lời *"chính xác bao nhiêu"*. Người thuê mở màn này khi nghi ngờ hoá đơn cao — họ cần con số, không chỉ hình dạng.

Bảng cũng là đường thoát cho khả năng tiếp cận: biểu đồ thuần đồ hoạ thì trình đọc màn hình không đọc được.

## Ca ít hơn 12 kỳ

Như ticket 03: hiện đúng số kỳ đang có. Biểu đồ hai cột vẫn là biểu đồ hợp lệ — **không** vẽ 10 cột rỗng cho đủ 12.

## Không tự suy luận hộ người dùng

Cám dỗ ở màn này là thêm câu kiểu *"tháng này bạn dùng nhiều hơn 30%"*. **Đừng.**

`FR-POR-05` chỉ đòi **hiển thị**. Cảnh báo tiêu thụ bất thường là `BR-09` và `FR-MTR-04`, đã cài ở Slice 03 cho **phía quản lý** với ngưỡng cấu hình được (`app.toa-nha.canh-bao-tieu-thu-nguong`). Dựng một luật cảnh báo thứ hai ở phía người thuê, với ngưỡng khác, là tạo ra hai nguồn sự thật về cùng một khái niệm.

Nếu sau này muốn cho người thuê thấy cảnh báo thì **dùng lại luật đã có**, và đó là ticket khác.

## Hoàn thành khi

- [ ] Biểu đồ 12 kỳ gần nhất, **điện và nước tách riêng**, không chung trục
- [ ] Có **cả bảng số**, không chỉ biểu đồ
- [ ] Chạm/di vào một cột → hiện số chính xác của kỳ đó
- [ ] Ít hơn 12 kỳ → hiện đúng số có, **không cột rỗng độn thêm**
- [ ] Không kỳ nào → màn rỗng nói rõ vì sao
- [ ] **Không tự sinh cảnh báo hay so sánh phần trăm**
- [ ] Đơn vị hiện rõ trên mỗi biểu đồ (kWh, m³)
- [ ] Chạy được ở **360 px** (`NFR-USA-01`), không cuộn ngang
- [ ] Chỉ dữ liệu của chính mình → kế thừa ticket 01
- [ ] Tên test mang mã `FR-POR-05`

## Comments
