# 04: Ảnh công tơ · FR-MTR-06, FR-MTR-07

**What to build:** Mỗi lần ghi chỉ số đính kèm được ảnh chụp mặt công tơ. Mỗi toà nhà bật được tuỳ chọn **bắt buộc phải có ảnh** mới cho lưu.

Ảnh công tơ là bằng chứng khi người thuê khiếu nại số tiền điện. Nó cũng là thứ người thuê xem được ở cổng người thuê tại Slice 6.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Dùng lại `ANH_DINH_KEM` với `doi_tuong_loai` = `CHI_SO_DICH_VU`, và dùng lại cơ chế **liên kết ký hạn 15 phút** của `slice-02 · 02` — không viết cơ chế lưu ảnh thứ hai
- [ ] Cờ bắt buộc ảnh khai ở cấp **toà nhà** (FR-MTR-07), mặc định tắt
- [ ] Bật cờ mà lưu không có ảnh thì bị từ chối ở máy chủ, không chỉ ở giao diện
- [ ] Chụp thẳng bằng máy ảnh điện thoại, không bắt phải vào thư viện ảnh
- [ ] Ảnh nén lại trước khi tải lên — ảnh gốc điện thoại vài megabyte mà sóng hành lang thì yếu
- [ ] Tên test mang mã `FR-MTR-06` và `FR-MTR-07`
