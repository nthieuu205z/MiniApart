# 06: Mã QR chuyển khoản · FR-INV-10

**What to build:** Sinh mã QR chuyển khoản cho một hoá đơn, chứa sẵn số tài khoản, số tiền, và nội dung là mã hoá đơn.

**Blocked by:** 02

**Status:** done

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
| Mã ngân hàng | `TOA_NHA.ma_ngan_hang` — BIN đúng 6 chữ số, thêm ở `V28` |
| Số tài khoản | `TOA_NHA.tk_ngan_hang` — số tài khoản dài 1–19 chữ số |
| Số tiền | `HOA_DON.tong_tien − HOA_DON.da_thu` |
| Nội dung chuyển khoản | `HOA_DON.ma_hoa_don` |

**Số tiền phải là phần còn lại, không phải tổng.** Người thuê đã trả một phần thì quét QR ra số cũ là sai — và đây là lỗi im lặng, người dùng chỉ phát hiện sau khi đã chuyển tiền.

## Ba điều cần cẩn thận

1. **Không ghi ảnh hoặc payload QR vào cơ sở dữ liệu.** Nó suy ra được hoàn toàn từ dữ liệu toà nhà và hoá đơn. Lưu lại là tạo ra một giá trị đệm thứ ba phải canh — dự án đã có hai (`PHONG.trang_thai`, `HOA_DON.da_thu`), đủ rồi.
2. **QR đổi theo số tiền còn lại**, nên ảnh phải được sinh lại khi endpoint signed-link được gọi, không cache.
3. **Không dùng số tiền dạng `double` ở bất kỳ khâu nào** — kể cả khi ghép chuỗi. ArchUnit đã canh `billing`, nhưng chuỗi định dạng thì nó không soi được.
4. **Không tự chế payload.** Dùng cấu trúc VietQR/NAPAS EMVCo TLV và CRC16-CCITT; ZXing chỉ chịu trách nhiệm vẽ payload thành PNG.

## Hoàn thành khi

- [x] Thư viện QR thêm vào `build.gradle` **trước** khi viết mã
- [x] Migration `V28__viet_qr_bank_identifier.sql` thêm BIN 6 chữ số và chuẩn hoá dữ liệu tài khoản cũ
- [x] Luồng cấu hình toà nhà đọc/ghi `ma_ngan_hang` và `tk_ngan_hang`, kiểm tra BIN/tài khoản hợp lệ
- [x] Endpoint cấp signed link cho một hoá đơn, có mã `FR-INV-10` trong Javadoc; link hết hạn sau 900 giây
- [x] Endpoint ảnh kiểm chữ ký/hạn rồi sinh PNG từ dữ liệu hiện tại, có content type rõ ràng
- [x] Payload giải mã được theo chuẩn VietQR/NAPAS EMVCo, có đúng BIN, số tài khoản của toà chứa hoá đơn, số tiền còn lại và mã hoá đơn
- [x] Hoá đơn đã thanh toán đủ hoặc trả thừa → không sinh QR, trả lời rõ lý do
- [x] Ảnh và payload QR **không** lưu vào cơ sở dữ liệu; ảnh được sinh lại khi số tiền còn lại thay đổi
- [x] Test hết hạn/chữ ký sai, overpaid, owner success, manager success, QTHT 403 và manager sai toà 403

## Comments

- Added ZXing before production QR code in the first attempt. The review reopened the ticket because `account=...&amount=...&content=...` is not bank-scannable VietQR/EMVCo and `TOA_NHA.tk_ngan_hang` alone lacks the BIN/acquirer identifier required by the official payment format.
- Contract decision: add `TOA_NHA.ma_ngan_hang` as a required 6-digit BIN in `V28`; keep `tk_ngan_hang` as the 1–19 digit account number, and update building configuration read/write DTOs and repository queries for both fields.
- The revised endpoint issues a 900-second HMAC-signed link. The signed image endpoint validates path-bound parameters and expiry, then regenerates the current PNG; it never stores an image or payload.
- Fix round completed: `V28` removes the legacy `9704` prefix before stripping separators, so the seeded `9704-0000-0000-0101/0202` values become `000000000101/000000000202`; VietQR TLV uses the backfilled BIN and CRC16-CCITT.
- Verification covers scoped owner and manager success, QTHT and out-of-scope manager 403, overpaid/paid-in-full rejection, current-data regeneration, invalid/expired signatures, building BIN/account validation, and absence of QR storage.
