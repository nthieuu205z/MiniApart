# 02: Khai báo tầng và phòng · FR-BLD-02

**What to build:** Trong một toà nhà, khai báo được từng phòng: số phòng, tầng, diện tích, sức chứa tối đa, giá thuê mặc định, loại phòng. Khai xong 20 phòng thì thấy đủ 20 phòng trong danh sách, lọc được theo tầng.

Khai báo 20 phòng bằng tay là việc buồn tẻ và hay gõ nhầm. Nên có cách tạo nhanh một loạt phòng theo mẫu — ví dụ tầng 2 gồm phòng 201 đến 208 — rồi sửa lẻ từng phòng sau.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Bảng `PHONG` theo đúng ERD: `so_phong`, `tang`, `dien_tich`, `suc_chua`, `gia_thue_mac_dinh`, `trang_thai`
- [ ] `gia_thue_mac_dinh` là `NUMERIC(15,2)` — quy ước 1, và ArchUnit sẽ bắt nếu lỡ dùng `double`
- [ ] Số phòng **duy nhất trong phạm vi một toà**, không phải duy nhất toàn hệ thống — hai toà đều có phòng 101 là chuyện bình thường. Ép bằng ràng buộc duy nhất trên cặp `(toa_nha_id, so_phong)`
- [ ] Tạo nhanh một dãy phòng theo tầng, xem trước danh sách sắp tạo **trước khi** ghi
- [ ] `trang_thai` khởi tạo là `TRONG`. Đây là **giá trị đệm** do hệ thống ghi (CR-012) — giao diện không được cho người dùng sửa tay
- [ ] `suc_chua` phải lớn hơn 0. Slice 2 dùng con số này để cảnh báo vượt sức chứa
- [ ] Tên test mang mã `FR-BLD-02`
