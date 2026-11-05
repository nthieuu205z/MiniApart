# 03: Bút toán đối ứng · FR-INV-14 · CR-010 · BR-18 · ruling 1 · ruling 4

**What to build:** Cấm xoá bản ghi thanh toán. Cho phép điều chỉnh **chỉ** bằng bút toán đối ứng mang số tiền âm, có lý do bắt buộc, có giới hạn quyền theo thời gian.

**Blocked by:** 02

**Status:** done

## Vì sao đây là ticket đáng bảo vệ nhất của slice

`BR-18` và `FR-INV-14` cấm xoá bản ghi tài chính. Cách thông thường của phần mềm — sửa tại chỗ hoặc xoá đi ghi lại — làm mất chính thứ mà kiểm toán cần: **bằng chứng rằng đã từng có một con số khác**.

Sơ đồ tuần tự nói rõ cách hành xử khi người dùng đòi sửa:

> *"UI-->>QL: Tu choi. Huong dan lap but toan doi ung co ly do"*

Từ chối, **rồi chỉ đường**. Không phải chỉ từ chối.

## Quyền: ruling 4, phương án C

Đây là chỗ khác đề xuất ban đầu, chốt có chủ đích:

| Ai | Khi nào |
|---|---|
| Quản lý toà được phân công | Trong **24 giờ** kể từ `thoi_diem_tao` của bút toán gốc |
| Chủ sở hữu | Bất cứ lúc nào |
| QTHT | **Không bao giờ** — CR-016 |

**N = 24 giờ, hằng số trong mã.** Không đặt lên `TOA_NHA`: đây là tham số **an toàn**, không phải tham số **nghiệp vụ theo toà** — không có cơ sở nào để toà A cho sửa 24 giờ còn toà B 48 giờ. Đưa lên bảng cấu hình là mời người dùng chỉnh một thứ họ không biết chỉnh theo gì.

**Đếm từ `thoi_diem_tao`, không phải `ngay_thu`.** Ticket 02 đã tạo cột này. Dùng `ngay_thu` thì bút toán nhập ngày lùi hết hạn sửa ngay lúc vừa tạo.

## Ruling 1 và ruling 4 giao nhau ở chỗ rủi ro nhất

Sau hai ruling này, **Quản lý toà kéo lùi được trạng thái của một hoá đơn đã thanh toán đủ**, trong 24 giờ, không cần Chủ sở hữu.

Đây không phải lý do đổi chốt — nhưng ticket phải bù bằng ba ràng buộc, và **cả ba đều phải có test**:

1. Bút toán đối ứng **luôn** ghi `NHAT_KY_THAO_TAC` kèm người thực hiện, dù ai lập
2. `ly_do` **bắt buộc**, không cho chuỗi rỗng và không cho khoảng trắng — `BR-18` đòi đúng thứ này
3. Hết 24 giờ, Quản lý nhận **403** với câu nói rõ *phải nhờ Chủ sở hữu* — không phải mã lỗi kỹ thuật (`NFR-USA-04`)

## Hoàn thành khi

- [ ] **Không có** endpoint nào xoá được bản ghi `THANH_TOAN`. Thử gọi `DELETE` → 405 hoặc 404, không phải 500
- [ ] Không có endpoint nào **sửa** được `so_tien` của bản ghi đã lưu
- [ ] Bút toán đối ứng ghi bản ghi **mới**, `loai = DOI_UNG`, `so_tien` **âm**, `dieu_chinh_cho_id` trỏ về bản ghi gốc
- [ ] **Bản ghi gốc giữ nguyên tuyệt đối** — test khẳng định mọi cột của nó không đổi sau khi đối ứng
- [ ] `ly_do` rỗng hoặc toàn khoảng trắng → từ chối
- [ ] Đối ứng trên hoá đơn `DA_THANH_TOAN` kéo lùi trạng thái đúng ruling 1, qua **đường gọi tường minh** ticket 01 đã mở
- [ ] Quản lý lập được trong **24 giờ**; **sau 24 giờ nhận 403** kèm câu tiếng Việt nói rõ phải nhờ Chủ sở hữu
- [ ] Chủ sở hữu lập được không giới hạn thời gian
- [ ] QTHT nhận 403 ở mọi thời điểm
- [ ] Test biên thời gian dùng **đồng hồ đẩy được**, không chờ thật — cùng cách `slice-02 · 02` đã làm với liên kết ký 15 phút
- [ ] `da_thu` sau đối ứng vẫn bằng tổng đại số — test đối chiếu ticket 02 vẫn xanh
- [ ] Đối ứng **của một đối ứng** bị chặn, hoặc được cho phép có chủ đích và có test. Chọn một, ghi lý do vào `## Comments`

## Comments
