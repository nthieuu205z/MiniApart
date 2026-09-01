# 06: Mã QR chuyển khoản · FR-INV-10

**What to build:** Sinh mã QR chuyển khoản cho một hoá đơn, chứa sẵn số tài khoản, số tiền, và nội dung là mã hoá đơn.

**Blocked by:** 02

**Status:** ready-for-agent

## Vì sao làm sớm

Kế hoạch mục 6 khuyến nghị thẳng:

> *"Mã QR chuyển khoản ở FR-INV-10 gây ấn tượng tốt khi demo mà công sức bỏ ra ít — mã QR ngân hàng theo chuẩn hiện hành sinh được hoàn toàn ở phía máy chủ, **không cần tích hợp với ngân hàng nào**. Nên làm sớm trong vertical slice này."*

Không có API ngân hàng, không có khoá bí mật, không có đối tác. Chỉ là mã hoá một chuỗi theo chuẩn rồi vẽ ra ảnh.

## Thiếu thư viện — thêm trước khi viết mã

`backend/build.gradle` hiện **không có thư viện QR nào**. Đây đúng hình dạng lỗ hổng jqwik trước Slice 04: ticket gọi tên công cụ, công cụ không có trong build, agent khởi động rồi tắc ngay câu đầu.

Thêm phụ thuộc là **việc đầu tiên** của ticket này.

## Dữ liệu đã có sẵn

| Cần | Lấy ở đâu |
|---|---|
| Số tài khoản | `TOA_NHA.tk_ngan_hang` — đã có từ `V2` |
| Số tiền | `HOA_DON.tong_tien − HOA_DON.da_thu` |
| Nội dung chuyển khoản | `HOA_DON.ma_hoa_don` |

**Số tiền phải là phần còn lại, không phải tổng.** Người thuê đã trả một phần thì quét QR ra số cũ là sai — và đây là lỗi im lặng, người dùng chỉ phát hiện sau khi đã chuyển tiền.

## Ba điều cần cẩn thận

1. **Không ghi ảnh QR vào cơ sở dữ liệu.** Nó suy ra được hoàn toàn từ ba trường trên. Lưu lại là tạo ra một giá trị đệm thứ ba phải canh — dự án đã có hai (`PHONG.trang_thai`, `HOA_DON.da_thu`), đủ rồi.
2. **QR đổi theo số tiền còn lại**, nên phải sinh lúc yêu cầu, không cache.
3. **Không dùng số tiền dạng `double` ở bất kỳ khâu nào** — kể cả khi ghép chuỗi. ArchUnit đã canh `billing`, nhưng chuỗi định dạng thì nó không soi được.

## Hoàn thành khi

- [ ] Thư viện QR thêm vào `build.gradle` **trước** khi viết mã
- [ ] Endpoint trả mã QR cho một hoá đơn, có mã `FR-INV-10` trong Javadoc
- [ ] Nội dung QR chứa đúng số tài khoản của **toà chứa hoá đơn đó**, không phải toà bất kỳ
- [ ] Số tiền trong QR là **phần còn phải thu**, không phải tổng hoá đơn
- [ ] Nội dung chuyển khoản là `ma_hoa_don`
- [ ] Hoá đơn đã thanh toán đủ → không sinh QR, trả lời rõ lý do
- [ ] Ảnh QR **không** lưu vào cơ sở dữ liệu
- [ ] Test giải mã lại chuỗi trong QR và khẳng định ba trường đúng — **không chỉ khẳng định "có trả về ảnh"**
- [ ] Test 403 cho QTHT và Quản lý sai toà

## Comments
