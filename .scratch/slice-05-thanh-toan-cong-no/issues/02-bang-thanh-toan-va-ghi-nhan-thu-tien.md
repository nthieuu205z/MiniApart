# 02: Bảng `THANH_TOAN` và ghi nhận thu tiền · FR-INV-11 · FR-INV-12 · FR-INV-13 · CR-010 · BR-08 · BR-12

**What to build:** Bảng `THANH_TOAN`, API ghi nhận thanh toán nhiều lần trên một hoá đơn, và cập nhật trạng thái hoá đơn theo BR-08.

**Blocked by:** 01

**Status:** done

## Lược đồ

Theo `Doc/diagrams-v2/07-erd-v2.mmd` dòng 213. Chép đúng tên cột, đừng dịch:

| Cột | Ghi chú |
|---|---|
| `hoa_don_id` | FK |
| `so_tien` | `NUMERIC(15,2)`. **Không** đặt ràng buộc phải dương — CR-010, bút toán đối ứng mang số âm |
| `loai` | `THU` \| `DOI_UNG` — CR-010 |
| `dieu_chinh_cho_id` | FK tự trỏ, nullable — CR-010 |
| `ly_do` | Bắt buộc khi `loai = DOI_UNG` — CR-010 |
| `hinh_thuc` | `TIEN_MAT` \| `CHUYEN_KHOAN` |
| `ngay_thu` | Ngày thu tiền, **do người dùng nhập, có thể lùi về quá khứ** |
| `nguoi_thu_id` | FK người dùng |
| `ma_bien_lai` | FR-INV-13 |
| **`thoi_diem_tao`** | **Không có trong ERD gốc.** Thêm theo ruling 4 — xem dưới |

### `thoi_diem_tao`: vì sao phải thêm cột không có trong ERD

Ruling 4 cho Quản lý lập bút toán đối ứng trong **24 giờ** kể từ bút toán gốc. Nếu đếm từ `ngay_thu` thì một bút toán nhập ngày lùi 3 hôm sẽ **hết hạn sửa ngay lúc vừa tạo**, và người dùng không hiểu vì sao.

Nên phải đếm từ **thời điểm ghi bản ghi vào hệ thống** — thứ ERD chưa có. Ticket 03 dùng cột này; ticket 02 tạo ra nó.

Cột này là **hệ quả của một ruling**, không phải ý thích của người cài đặt. Ghi lý do vào chú thích migration.

## `da_thu` là giá trị đệm — bắt buộc có test đối chiếu

Sơ đồ tuần tự viết: *"Tinh lai da thu = tong dai so cac but toan"*. Nghĩa là `HOA_DON.da_thu` **dẫn xuất**, không phải nguồn sự thật.

Đây đúng mẫu hình mà **CR-012 đã bắt buộc** phải có kiểm thử đối chiếu cho `PHONG.trang_thai`:

> *"Cần có kiểm thử đối chiếu giá trị đệm với giá trị tính lại từ dữ liệu gốc."*

Slice này tạo cái đệm thứ hai cùng loại, lần này là **tiền**.

## Sửa luôn nguồn hạn thanh toán — ruling 2

`TinhHoaDonRepository.java:281` đang tính quá hạn bằng `?::date > kt.ngay_ket_thuc + tn.so_ngay_han_tt` — dùng **ngày kết thúc kỳ**, bỏ qua cột `han_thanh_toan` nằm ngay trong cùng bảng.

Ruling 2 chốt: **cột `HOA_DON.han_thanh_toan` là nguồn sự thật duy nhất.** Lý do là bất biến lịch sử — đổi `so_ngay_han_tt` của toà sau này **không được** làm đổi hạn của hoá đơn cũ, nếu không hoá đơn đang quá hạn bỗng hết quá hạn (`NFR-CMP-02`, cùng loại lỗi CR-002/CR-003 đã bắt).

## Ranh giới: trạng thái tính ở `billing/calc`, không tính trong SQL

Khối `CASE` ở `TinhHoaDonRepository:278-284` đang tái hiện BR-08/BR-12 **bằng SQL**, nơi ArchUnit không soi tới được. Ticket này thêm nhiều truy vấn công nợ nữa — nếu không chốt nguyên tắc bây giờ thì logic trạng thái sẽ rải khắp SQL.

**Nguyên tắc:** SQL đọc dữ liệu, `QuyTacTrangThaiHoaDon` quyết định trạng thái.

## Hoàn thành khi

- [x] Migration tạo `THANH_TOAN` đúng ERD + cột `thoi_diem_tao`, mọi cột tiền là `NUMERIC(15,2)`
- [x] Ghi nhận **nhiều lần** thu trên một hoá đơn; trạng thái tự đổi đúng BR-08
- [x] **Trả đủ trong một lần** từ `DA_PHAT_HANH` cho ra `DA_THANH_TOAN` — ca ticket 01 vừa mở
- [x] Số tiền `<= 0` bị từ chối ở đường `THU` (E1 của sơ đồ tuần tự)
- [x] Trả cho hoá đơn đã đủ thì **cảnh báo trước**, nói rõ phần thu thêm sẽ thành số dư (E2). Số dư thật do ticket 04 làm
- [x] `ma_bien_lai` sinh tự động, **có ràng buộc duy nhất** ở cơ sở dữ liệu
- [x] Quá hạn xác định theo **cột `han_thanh_toan`**, không tính lại từ kỳ — ruling 2
- [x] `TinhHoaDonRepository:278-284` không còn quyết định trạng thái bằng SQL
- [x] **Test đối chiếu:** sau mọi dãy thao tác, `HOA_DON.da_thu == SUM(THANH_TOAN.so_tien)` — tổng **đại số**
- [x] **Tính chất tầng 2 (jqwik):** *"với mọi dãy thanh toán, đã thu luôn bằng tổng đại số các bút toán"* — kế hoạch mục 5
- [x] Test 403: QTHT bị chặn; Quản lý sai toà bị chặn — quy ước 3, CR-016
- [x] Ghi `NHAT_KY_THAO_TAC` cho mỗi lần ghi nhận

## Comments

- Đã thêm migration `V26__payments.sql`: `THANH_TOAN` giữ nguyên lịch sử, cho phép bút toán âm, có `thoi_diem_tao` theo ruling 4, mã biên lai sinh tự động từ sequence và ràng buộc duy nhất.
- Endpoint ghi nhận thu tiền dùng đường dẫn có phạm vi toà/kỳ: `POST /api/toa-nha/{toaNhaId}/ky-thanh-toan/{kyId}/hoa-don/{hoaDonId}/thanh-toan`. Dịch vụ khoá dòng hoá đơn, ghi bút toán `THU`, tính lại tổng đại số, cập nhật `da_thu`/trạng thái trong cùng transaction và ghi nhật ký.
- Luồng thu thêm sau khi đã đủ trả `409` kèm cảnh báo; chỉ ghi khi request xác nhận. Phần số dư chỉ được trả về trong kết quả, chưa tạo bảng số dư theo đúng ranh giới ticket 04.
- SQL chỉ đọc dữ liệu; trạng thái được quyết định bởi `QuyTacTrangThaiHoaDon`, hạn dùng `HOA_DON.han_thanh_toan`, không còn tính từ ngày kết thúc kỳ và cấu hình toà.
- Migration có nhánh tương thích: nếu cơ sở dữ liệu đã có `HOA_DON.da_thu` trước khi có ledger, tạo một dòng `THU` legacy để không làm mất tổng đã thu; người thu, hình thức và ngày thu đều để rỗng vì dữ liệu cũ không lưu các thông tin đó, không giả mạo dữ liệu audit.
- Số dư còn lại trên chi tiết hoá đơn được chặn ở `0.00` khi phát sinh thu dư; phần vượt vẫn được trả riêng trong kết quả ghi nhận.
- API từ chối số tiền vượt giới hạn `NUMERIC(15,2)` bằng `400` trước khi chạm cơ sở dữ liệu.
- Đã cập nhật test cũ đang kiểm tra hành vi theo ruling cũ. Xác minh: `./gradlew clean test` — `BUILD SUCCESSFUL`.
