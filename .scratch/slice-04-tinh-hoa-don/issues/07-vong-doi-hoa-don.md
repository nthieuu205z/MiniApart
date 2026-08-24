# 07: Vòng đời trạng thái hoá đơn · BR-08 · FR-INV-05, FR-INV-06

**What to build:** Hoá đơn đi đúng vòng đời BR-08 và không đi tắt được:

```
Nháp --phát hành--> Đã phát hành --thu một phần--> Đã thu một phần --thu đủ--> Đã thanh toán
                          |                              |
                          +------ quá hạn thanh toán ----+------> Quá hạn
                          |
                          +---- huỷ (có lý do) ----> Đã huỷ
```

**Sửa hoá đơn đã phát hành là chuyện không được phép.** Đã phát hành nghĩa là người thuê đã nhìn thấy con số. Sửa nó đi là sửa một thứ người khác đang cầm trong tay. Cách đúng: **huỷ có lý do, rồi phát hành hoá đơn thay thế** — cùng tinh thần với cấm xoá tài khoản ở FR-AUT-06 và cấm xoá bản ghi thanh toán ở Slice 5. Sửa sai bằng cách ghi thêm, không bằng cách xoá đi.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Chuyển trạng thái đi qua **một chỗ duy nhất** kiểm tra bước chuyển có hợp lệ không, không rải `setTrangThai` khắp nơi
- [ ] **Chỉ hoá đơn Nháp mới sửa được nội dung** — FR-INV-05. Thêm khoản phát sinh và khoản giảm trừ kèm lý do
- [ ] Hoá đơn đã phát hành: **không có đường nào sửa nội dung**. Có ca kiểm thử gọi thẳng API sửa và khẳng định bị từ chối
- [ ] **Chỉ Chủ sở hữu** huỷ được hoá đơn đã phát hành, **bắt buộc nhập lý do**, và thao tác **ghi nhật ký**
- [ ] Hoá đơn **Đã thanh toán không quay lại được** trạng thái trước
- [ ] "Quá hạn" tính từ `TOA_NHA.so_ngay_han_tt`. Cân nhắc làm bằng **điều kiện truy vấn** thay vì một giá trị lưu sẵn — cùng lý lẽ như CR-012 đã dùng cho `SAP_HET`: nó đổi theo ngày mà không ai động vào dữ liệu
- [ ] Có kiểm thử cho **mọi bước chuyển không hợp lệ**, không chỉ các bước hợp lệ
- [ ] Tên test mang mã `BR-08`, `FR-INV-05`, `FR-INV-06`
