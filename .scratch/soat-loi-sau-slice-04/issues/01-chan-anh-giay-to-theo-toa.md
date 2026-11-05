# 01: Chặn ảnh giấy tờ theo toà · BR-17 · NFR-SEC-04

**What to build:** Thêm kiểm tra phạm vi toà nhà vào đường xin liên kết xem **ảnh giấy tờ tuỳ thân**. Hiện tại chỉ có kiểm tra vai trò, không có kiểm tra toà — nên một Quản lý toà A xin được liên kết xem ảnh căn cước của người thuê ở toà B.

**Status:** done

**Blocked by:** 03 (đã giải quyết). Ruling B áp dụng; ticket này cài đặt kiểm tra phạm vi theo đúng BR-17.

## Lỗi hiện tại

`backend/src/main/java/com/prj1/ccm/nguoithue/AnhDinhKemService.java:158` — hàm `kiemTraQuyenXemAnh`, nhánh ảnh giấy tờ (`DOI_TUONG_NGUOI_THUE`):

```java
if (DOI_TUONG_NGUOI_THUE.equals(anh.doiTuongLoai())) {
    if (nguoiDung != null && nguoiDung.vaiTro() == VaiTro.NGUOI_THUE) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    layAnhNguoiThue(anhId);
    return;
}
```

Nhánh này **chỉ chặn `NGUOI_THUE`**. Không có lời gọi `phanQuyenToaService` nào. Hệ quả: mọi tài khoản `QUAN_LY` — bất kể được phân công toà nào — đều xin được liên kết ký cho ảnh giấy tờ của **bất kỳ người thuê nào trong hệ thống**.

So sánh với nhánh ngay bên dưới, xử lý ảnh công tơ (`DOI_TUONG_CHI_SO_DICH_VU`), **có** gọi:

```java
phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
```

Nghĩa là mẫu hình đúng đã có sẵn trong chính hàm này, chỉ là nhánh ảnh giấy tờ không dùng. Ảnh công tơ được chặn theo toà; ảnh căn cước thì không — ngược hoàn toàn với thứ tự nhạy cảm.

## BR-17 nói gì

> Ảnh giấy tờ tuỳ thân **chỉ hiển thị cho Chủ sở hữu và Quản lý của chính toà nhà đó**. Mọi lượt xem đều ghi nhật ký. Ảnh không được đặt ở đường dẫn công khai đoán được.

Ba vế. Vế "đường dẫn không đoán được" đã làm đúng ở Slice 02 (liên kết ký HMAC, hạn 15 phút, khoá lưu trữ là UUID). Vế "của chính toà nhà đó" **chưa làm**. Vế "ghi nhật ký" là ticket 02.

## Vì sao ticket Slice 02 không bắt được

`.scratch/slice-02-nguoi-thue-hop-dong/issues/02-anh-giay-to.md` có tiêu chí:

> Người không có quyền xem hồ sơ đó thì **không xin được liên kết**, nhận 403

Câu này bị hiểu thành "sai vai trò thì 403", và test viết đúng theo cách hiểu đó — mục Comments ghi rõ test phủ *"forbidden `THO` and `NGUOI_THUE` requests"*. Không có ca nào cho một `QUAN_LY` hợp lệ nhưng **sai toà**. Đây là loại lỗi mà chỉ đọc checklist thì thấy xanh.

## Đường nối từ người thuê sang toà nhà

Không có cột `toa_nha_id` trên `NGUOI_THUE`. Phải đi qua hợp đồng:

```
NGUOI_THUE.id  ←  HOP_DONG.nguoi_thue_id
HOP_DONG.phong_id  →  PHONG.toa_nha_id
```

**Quyết định cần nêu rõ trong mã:** một người thuê có thể có **nhiều hợp đồng, ở nhiều toà, qua nhiều thời kỳ**. Quy tắc chọn là: người xem được phép nếu họ quản lý **ít nhất một toà mà người thuê này có hợp đồng** — kể cả hợp đồng đã hết hạn. Lý do: quản lý cũ vẫn cần tra lại hồ sơ để đối chiếu công nợ sau khi người thuê đã dọn đi. Ghi lựa chọn này thành comment trong mã, đừng để người sau đoán.

## Hoàn thành khi

- [x] Nhánh `DOI_TUONG_NGUOI_THUE` trong `kiemTraQuyenXemAnh` gọi kiểm tra phạm vi toà, không chỉ kiểm tra vai trò
- [x] `CHU` xem được ảnh giấy tờ của người thuê trong các toà thuộc quyền
- [x] `QUAN_LY` **chỉ** xem được ảnh giấy tờ của người thuê có hợp đồng ở toà mình được phân công; sai toà nhận **403**, không phải 404 hay 500
- [x] `NGUOI_THUE` và `THO` vẫn 403 như cũ — không làm hồi quy hành vi đã có
- [x] Truy vấn mới đặt trong `NguoiThueRepository`, không viết SQL thẳng trong service
- [x] Ca kiểm thử hai toà, hai người thuê, quản lý chỉ được phân công toà A; xin link ảnh của người thuê toà B nhận **403**
- [x] Tên test mang mã `BR-17`
- [x] Dữ liệu mẫu trong test là **bịa hoàn toàn** — không số giấy tờ của người thật, theo rủi ro R-13

## Comments

- Đã thêm truy vấn từ `NGUOI_THUE` qua `HOP_DONG` và `PHONG` để kiểm tra người thuê thuộc ít nhất một toà mà tài khoản được phân công; hợp đồng lịch sử vẫn được tính.
- Đã thêm ca thành công cho `CHU`, ca sai toà cho `QUAN_LY`, và ca từ chối cho `THO`/`NGUOI_THUE` trong `NguoiThueAnhGiayToIntegrationTest`.
- Test lớp ảnh giấy tờ và full backend suite đều xanh: 333/333 test.
