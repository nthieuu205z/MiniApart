# 02: Ghi nhật ký mọi lượt xem ảnh giấy tờ · BR-17 · FR-SEC

**What to build:** Ghi một dòng nhật ký mỗi khi có người xin liên kết xem ảnh giấy tờ tuỳ thân. Hiện tại **không ghi gì cả**.

**Status:** done

**Blocked by:** None. Độc lập với ticket 01, làm song song được — nhưng nếu làm sau 01 thì rẻ hơn, vì cả hai đụng cùng một hàm.

## Lỗi hiện tại

BR-17 có ba vế, vế thứ hai là:

> Mọi lượt xem đều **ghi nhật ký**.

`AnhDinhKemService` **không hề tham chiếu** `NhatKyThaoTacRepository`. Kiểm chứng:

```bash
grep -rln "NhatKyThaoTacRepository" backend/src/main/java/
```

Trả về đúng bốn tệp: `NhatKyThaoTacRepository` (chính nó), `NguoiThueService`, `HuyHoaDonNhapService`, `ChiSoDichVuService`. Không có `AnhDinhKemService`.

Nghĩa là sửa hồ sơ người thuê có ghi nhật ký, huỷ hoá đơn có, sửa chỉ số có — nhưng **xem ảnh căn cước thì không**. Đúng cái hành vi nhạy cảm nhất lại là cái duy nhất không để lại dấu vết.

## Vì sao vế này bị rơi

Checklist của `.scratch/slice-02-nguoi-thue-hop-dong/issues/02-anh-giay-to.md` có bảy gạch đầu dòng, **không dòng nào nhắc tới nhật ký**. Ticket chép được hai vế của BR-17 (liên kết ký hạn, đường dẫn không đoán được) và bỏ sót vế thứ ba. Kiểm thử bám theo checklist nên cũng không bắt được.

Đây là lý do ticket này tồn tại riêng thay vì sửa lén: cần một dòng trong lịch sử repo nói rằng vế đó **từng bị bỏ sót và đã được vá**.

## Ghi ở đâu

Điểm ghi đúng là `AnhDinhKemService.taoLienKet` (`backend/src/main/java/com/prj1/ccm/nguoithue/AnhDinhKemService.java:73`), **sau** khi kiểm quyền xong và **trước** khi trả liên kết.

**Không ghi ở `layAnhDaKy`.** Hàm tải tệp đó không có người dùng — nó xác thực bằng chữ ký HMAC, `nguoiDung` là `null`. Ghi ở đó sẽ cho ra dòng nhật ký không có chủ thể, đúng loại dòng vô dụng mà `Doc/UX/05-quan-tri-he-thong.md` mục 5.2 lấy làm ví dụ phản diện. Một liên kết ký cũng có thể bị trình duyệt gọi lại nhiều lần, làm phồng nhật ký mà không thêm thông tin.

**Điểm cần ghi là lúc *xin quyền xem*, không phải lúc *byte đi qua dây*.**

## Nội dung dòng nhật ký

Bảng `NHAT_KY_THAO_TAC` (`V9__tenant_profiles.sql:15`, mở rộng ở `V20`) có sẵn các cột cần dùng. Dùng hàm `ghi(nguoiDungId, hanhDong, doiTuong, giaTriTruoc, giaTriSau)` — bản ngắn năm tham số là đủ, không cần `phongId`/`dichVuId`.

Dòng ghi ra phải trả lời đủ **bốn câu: ai · làm gì · với cái gì · lúc nào** — tiêu chí ở `Doc/UX/05-quan-tri-he-thong.md` mục 5.1. Cụ thể:

| Cột | Giá trị |
|---|---|
| `nguoi_dung_id` | id người xin liên kết |
| `hanh_dong` | `XEM_ANH_GIAY_TO` |
| `doi_tuong` | định danh người thuê bị xem, **không phải** id của ảnh — người tra nhật ký hỏi "ai xem hồ sơ của anh Hùng", không hỏi "ai xem ảnh số 1842" |
| `gia_tri_truoc` / `gia_tri_sau` | `null` — đây là thao tác đọc, không có trước-sau |
| `thoi_diem` | mặc định `CURRENT_TIMESTAMP` |

## Hoàn thành khi

- [x] `taoLienKet` ghi đúng **một** dòng nhật ký cho mỗi lần xin liên kết ảnh giấy tờ thành công
- [x] **Không** ghi khi lời gọi bị từ chối 403 — nhật ký này ghi lượt xem, không phải lượt thử. Nếu sau này cần ghi cả lượt bị chặn thì là `hanh_dong` khác, ticket khác
- [x] **Không** ghi ở `layAnhDaKy`
- [x] Xin liên kết cho ảnh **công tơ** thì **không** ghi vào nhật ký này — BR-17 chỉ nói về giấy tờ tuỳ thân; ảnh công tơ không phải dữ liệu định danh cá nhân
- [x] `doi_tuong` cho biết **người thuê nào**, không phải id ảnh
- [x] **Ca kiểm thử:** xin liên kết bằng tài khoản `CHU`, rồi đọc `NHAT_KY_THAO_TAC` khẳng định có đúng một dòng với đúng `nguoi_dung_id` và `hanh_dong`
- [x] **Ca kiểm thử:** lời gọi bị 403 thì **không** sinh dòng nào
- [x] Tên test mang mã `BR-17`

## Comments

- Đã ghi `XEM_ANH_GIAY_TO` ngay sau kiểm tra quyền trong `AnhDinhKemService.taoLienKet`; đối tượng dùng `NGUOI_THUE:<id>`, hai giá trị trước/sau để `null`.
- Dùng giao dịch `REQUIRES_NEW` vì đường cấp liên kết có thể được gọi từ một luồng đọc chỉ-đọc; audit vẫn phải ghi được và không ghi ở lúc tải byte qua `layAnhDaKy`.
- Đã thêm test BR-17 cho đường thành công bằng `CHU`, đường 403, và xác nhận ảnh công tơ không tạo audit giấy tờ. Integration tests liên quan và full backend suite đều xanh.
