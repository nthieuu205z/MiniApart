# 02: Bảng `YEU_CAU_SUA_CHUA` và tạo yêu cầu kèm ảnh · FR-MNT-01 · BR-17 · CR-013

**What to build:** Bảng `YEU_CAU_SUA_CHUA` và chức năng người thuê gửi yêu cầu kèm tối đa 5 ảnh.

**Blocked by:** 01

**Status:** ready-for-agent

**Migration:** `V36` — xem `.scratch/dai-so-hieu-migration.md`.

## Slice 02 đã chừa sẵn chỗ cho ticket này

`V10__attachment_images.sql:3`:

```sql
doi_tuong_loai VARCHAR(50) NOT NULL CHECK (doi_tuong_loai IN ('NGUOI_THUE', 'CHI_SO_DICH_VU', 'YEU_CAU_SUA_CHUA'))
```

Giá trị thứ ba **chưa ai dùng**. Nghĩa là `FR-MNT-01` (tối đa 5 ảnh) có sẵn:

- nơi lưu — bảng `ANH_DINH_KEM` đa hình
- cơ chế **liên kết ký hạn 15 phút** — `CR-013`, quy ước 5
- kiểm định dạng **theo nội dung tệp**, không theo phần mở rộng
- giới hạn kích thước

**Dùng lại toàn bộ. Không dựng đường ảnh thứ hai.**

## Một cột migration gọn thay vì ba

Tạo `YEU_CAU_SUA_CHUA` **đầy đủ ngay từ `V36`**, gồm cả cột phân công (ticket 03) và cột chi phí (ticket 06) — dù hai ticket đó chưa dùng tới.

Lý do: Flyway không cho sửa tệp đã chạy. Ba migration cho một bảng nghĩa là ba lần `ALTER TABLE` trên bảng có thể đã có dữ liệu, và ba cơ hội va số hiệu với ticket khác.

## Trường tối thiểu

Yêu cầu gốc: *"kèm **hạng mục, mô tả, mức độ** và tối đa 5 ảnh"*. Cộng thêm:

- mã yêu cầu — `FR-MNT-02` đòi *"sinh mã yêu cầu"*, có ràng buộc **duy nhất**
- `hop_dong_id` hoặc `phong_id` — để truy về toà nhà cho phân quyền
- người tạo, thời điểm tạo
- trạng thái theo BR-16 (`CHECK` đủ **sáu** giá trị ngay từ đầu)
- cột phân công và cột chi phí, để trống ở ticket này

**`muc_do` phải có giá trị *Khẩn cấp*** — `BR-11` dùng đúng mức đó để suy trạng thái phòng *Đang sửa chữa* (ticket 07).

## Giới hạn 5 ảnh: ép ở đâu

`ANH_DINH_KEM` là bảng đa hình, **không có khoá ngoại** tới `YEU_CAU_SUA_CHUA` — nên cơ sở dữ liệu không đếm hộ được.

CR-008 đã ghi rõ đánh đổi này cho `KHOAN_PHAT_SINH`, và nó áp y nguyên ở đây:

> *"ràng buộc khoá ngoại không kiểm được ở tầng cơ sở dữ liệu, nên **phải kiểm ở tầng ứng dụng và phải có kiểm thử riêng cho việc này**."*

Gửi ảnh thứ sáu → từ chối, thông báo tiếng Việt nói rõ giới hạn.

## Phân quyền

| Ai | Được tạo yêu cầu cho |
|---|---|
| Người thuê | **Chỉ phòng của hợp đồng đang hiệu lực của mình** |
| Quản lý toà được phân công | Phòng trong toà mình |
| Chủ | Phòng trong toà thuộc quyền |
| **QTHT** | **403** — CR-016 |
| Thợ | **403** — thợ không tạo việc, chỉ nhận việc |

Người thuê tạo yêu cầu cho phòng khác → **403**, kiểm ở tầng máy chủ.

## Hoàn thành khi

- [ ] `V36` tạo `YEU_CAU_SUA_CHUA` đủ cột cho cả ticket 03 và 06; `CHECK` trạng thái có **sáu** giá trị BR-16; `muc_do` có *Khẩn cấp*; cột tiền là `NUMERIC(15,2)`
- [ ] Người thuê gửi được yêu cầu kèm **tối đa 5 ảnh**; ảnh thứ sáu bị từ chối có thông báo rõ
- [ ] Ảnh dùng lại `ANH_DINH_KEM` với `doi_tuong_loai = 'YEU_CAU_SUA_CHUA'` — **không bảng ảnh mới**
- [ ] Ảnh chỉ xem được qua **liên kết ký hạn 15 phút**; không có đường dẫn tĩnh nào — quy ước 5
- [ ] Mã yêu cầu sinh tự động, **ràng buộc duy nhất ở cơ sở dữ liệu**
- [ ] Yêu cầu mới ở trạng thái *Mới tiếp nhận*, đặt bởi hệ thống, **không nhận trạng thái từ client**
- [ ] Người thuê tạo cho phòng khác → **403**
- [ ] QTHT và Thợ → 403
- [ ] Ghi `NHAT_KY_THAO_TAC`
- [ ] Tên test mang mã `FR-MNT-01` và `BR-17`

## Comments
