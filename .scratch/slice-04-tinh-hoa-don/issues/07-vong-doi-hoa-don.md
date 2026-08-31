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

**Status:** done

- [x] Chuyển trạng thái đi qua **một chỗ duy nhất** kiểm tra bước chuyển có hợp lệ không, không rải `setTrangThai` khắp nơi
- [x] **Chỉ hoá đơn Nháp mới sửa được nội dung** — FR-INV-05. Thêm khoản phát sinh và khoản giảm trừ kèm lý do
- [x] Hoá đơn đã phát hành: **không có đường nào sửa nội dung**. Có ca kiểm thử gọi thẳng API sửa và khẳng định bị từ chối
- [x] **Chỉ Chủ sở hữu** huỷ được hoá đơn đã phát hành, **bắt buộc nhập lý do**, và thao tác **ghi nhật ký**
- [x] Hoá đơn **Đã thanh toán không quay lại được** trạng thái trước
- [x] "Quá hạn" tính từ `TOA_NHA.so_ngay_han_tt`. Cân nhắc làm bằng **điều kiện truy vấn** thay vì một giá trị lưu sẵn — cùng lý lẽ như CR-012 đã dùng cho `SAP_HET`: nó đổi theo ngày mà không ai động vào dữ liệu
- [x] Có kiểm thử cho **mọi bước chuyển không hợp lệ**, không chỉ các bước hợp lệ
- [x] Tên test mang mã `BR-08`, `FR-INV-05`, `FR-INV-06`

## Comments

- Vòng đời được gom về một luật chuyển trạng thái duy nhất trong `billing/calc`, sau đó các service dùng cùng luật cho phát hành, thanh toán, quá hạn và huỷ.
- Chỉ bản nháp được sửa nội dung; hoá đơn đã phát hành chỉ chủ sở hữu được huỷ với lý do bắt buộc và có nhật ký. Hoá đơn đã thanh toán là trạng thái kết thúc, không quay ngược.
- Trạng thái `QUA_HAN` được chiếu theo hạn thanh toán hiện hành của toà nhà và tổng đã thu, không phụ thuộc giá trị trạng thái cũ lưu trong hoá đơn.
- Test bao phủ cả chuyển hợp lệ và mọi chuyển không hợp lệ, với mã `BR-08`, `FR-INV-05`, `FR-INV-06`.
