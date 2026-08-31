# 03: Chốt ranh giới quyền của QTHT · BR-17 · FR-AUT-04

**What to decide:** Vai trò `QTHT` hiện **đi xuyên qua mọi kiểm tra phạm vi toà nhà**. Cần một quyết định của người về việc giữ hay bỏ, vì ba nguồn trong dự án đang nói ba kiểu khác nhau.

**Status:** ready-for-human

**Đây không phải việc của agent.** Ticket này cần một ruling, không cần mã. Sau khi có ruling mới sinh ra ticket cài đặt.

## Mã đang làm gì

`backend/src/main/java/com/prj1/ccm/toanha/PhanQuyenToaService.java:27`:

```java
if (nguoiDung.vaiTro() == VaiTro.QTHT || toaNhaRepository.existsPhanQuyenToa(nguoiDung.id(), toaNhaId)) {
    return toaNha;
}
```

Vế `QTHT ||` đứng trước, nên nó **đoản mạch toàn bộ kiểm tra phân công toà**. Mọi màn nghiệp vụ đi qua service này đều mở cho QTHT ở **mọi toà**: hoá đơn, chỉ số, ảnh công tơ, hợp đồng.

Cộng thêm `HoaDonChiTietService.coQuyenXemHoaDon` (`backend/src/main/java/com/prj1/ccm/billing/HoaDonChiTietService.java:77`) cũng xếp QTHT vào nhóm "nhân viên" được xem hoá đơn. Và `AnhDinhKemService.kiemTraQuyen` cho QTHT xin liên kết ảnh giấy tờ.

Tóm lại: **QTHT hiện là vai trò quyền cao nhất hệ thống, đọc được mọi thứ ở mọi toà.**

## Ba nguồn nói ba kiểu

| Nguồn | Nói gì về QTHT |
|---|---|
| **BR-17** (`Doc/PRJ1_Phan-tich-yeu-cau...md:1374`) | *"Ảnh giấy tờ tuỳ thân chỉ hiển thị cho **Chủ sở hữu và Quản lý của chính toà nhà đó**."* → QTHT **không** có tên trong danh sách |
| **Bảng phân vùng** (cùng tệp, dòng 1039) | *"Khu vực quản trị \| Chủ sở hữu, Quản lý toà nhà, Thợ sửa chữa, Quản trị hệ thống \| Chức năng đầy đủ, dữ liệu giới hạn theo toà được giao"* → xếp QTHT chung nhóm, nhưng vế cuối *"giới hạn theo toà được giao"* lại mâu thuẫn với mã |
| **Đặc tả UX** (`Doc/UX/05-quan-tri-he-thong.md` mục 4 và bẫy số 4) | *"QTHT **chỉ xem danh sách** + biết toà nào có ai quản lý. Không vào hoá đơn, không vào chỉ số."* → chặt hơn hẳn |

Đặc tả UX là tài liệu tôi soạn ở kỳ thiết kế, **chưa được phê duyệt** — nó không tự động thắng tài liệu phân tích. Nhưng nó nêu đúng một lập luận đáng cân nhắc: QTHT là **vai trò kỹ thuật quản trị tài khoản**, không phải vai trò vận hành toà nhà. Cho nó đọc được mọi hoá đơn và mọi ảnh căn cước là mở rộng quyền vượt xa việc nó cần làm.

## Ba phương án

**A — Giữ nguyên.** QTHT xuyên mọi phạm vi. Đơn giản nhất, nhưng mâu thuẫn trực diện với nguyên văn BR-17, và tạo một tài khoản đọc-được-tất-cả mà không có lý do nghiệp vụ.

**B — Bỏ QTHT khỏi dữ liệu nghiệp vụ.** QTHT chỉ dùng ba màn `#4` tài khoản, `#5` danh sách toà, `#52` nhật ký. Không hoá đơn, không chỉ số, không ảnh giấy tờ. Khớp BR-17 nguyên văn và khớp đặc tả UX. Tốn công sửa nhiều chỗ hơn.

**C — Trung gian.** QTHT bị chặn khỏi **ảnh giấy tờ** (đúng BR-17 nguyên văn) nhưng vẫn xem được hoá đơn và chỉ số để hỗ trợ kỹ thuật. Vá được vi phạm rõ ràng nhất mà không phải rà lại toàn bộ.

## Vì sao phải chốt trước Slice 06

Slice 06 là Cổng người thuê, và `FR-POR-04` là **yêu cầu an ninh**, không phải yêu cầu hiển thị — kế hoạch mục 6 ghi rõ phải kiểm thử theo hướng tấn công. Slice đó sẽ dựng bộ ca kiểm thử phân quyền tử tế. Nếu ranh giới QTHT còn để ngỏ tới lúc ấy thì bộ ca đó viết ra sẽ phải viết lại.

Chốt bây giờ tốn một quyết định. Chốt sau tốn một quyết định **cộng** phần sửa test.

## Cần gì để đóng ticket

- [ ] Chọn A, B hay C
- [ ] Nếu chọn B hoặc C: sửa `Doc/PRJ1_Phan-tich-yeu-cau_Chung-cu-mini.md` dòng 1039 cho hết mâu thuẫn với BR-17, và ghi vào `Doc/PRJ1_Phieu-thay-doi_Lo-01.md` như một CR
- [ ] Nếu chọn A: ghi lý do vào ADR, và sửa `Doc/UX/05-quan-tri-he-thong.md` cho khớp — **đừng để hai tài liệu đá nhau**
- [ ] Sinh ticket cài đặt tương ứng, đặt vào slice phù hợp

## Comments
