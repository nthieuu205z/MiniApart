# 05: Cấm hai hợp đồng chồng ngày trên một phòng · FR-TNT-05

**What to build:** Một phòng không bao giờ có hai hợp đồng còn hiệu lực cùng lúc. Thử tạo hợp đồng thứ hai có khoảng ngày chồng lên hợp đồng đang có thì bị từ chối, kèm thông báo chỉ rõ hợp đồng nào đang chiếm chỗ và tới ngày nào.

**Phải ép ở tầng cơ sở dữ liệu, không phải ở tầng ứng dụng.** Đây là điểm cốt lõi của ticket và là chỗ dễ làm ẩu nhất.

Kiểm ở tầng ứng dụng nghĩa là: đọc xem phòng có hợp đồng nào chồng không, thấy không có, rồi ghi. Hai người cùng thao tác một lúc thì **cả hai cùng đọc thấy trống, cả hai cùng ghi** — và phòng có hai hợp đồng. Khoảng hở giữa lúc đọc và lúc ghi là chỗ lỗi chui vào, và nó không tái hiện được khi thử tay nên sẽ không ai phát hiện cho tới lúc chạy thật.

PostgreSQL có **kiểu khoảng** (`daterange`) và **ràng buộc loại trừ** (`EXCLUDE USING gist`) giải quyết chính xác bài toán này ở tầng cơ sở dữ liệu, nơi không có khoảng hở nào.

**Blocked by:** 04

**Status:** done

- [ ] Ràng buộc loại trừ trên `HOP_DONG`, cấm chồng khoảng ngày trên cùng `phong_id`
- [ ] Ràng buộc **chỉ áp dụng cho hợp đồng chưa thanh lý** — một hợp đồng đã thanh lý không cản trở hợp đồng mới
- [ ] Cần bật phần mở rộng `btree_gist` — làm trong chính tệp migration, không phải bằng tay trên máy chủ
- [ ] Vi phạm ràng buộc được bắt lại và chuyển thành **thông báo đọc được**, không phải lỗi 500
- [ ] **Ca kiểm thử bắt buộc:** hai luồng cùng lúc thử ký hai hợp đồng chồng ngày lên một phòng, khẳng định đúng **một** thành công và một bị từ chối. Test này là thứ phân biệt "có ràng buộc thật" với "có phép kiểm ở tầng ứng dụng"
- [ ] Có test cho các kiểu chồng: chồng đầu, chồng cuối, bao trọn, nằm gọn bên trong, và **kề sát không chồng** (phải cho qua)
- [ ] Tên test mang mã `FR-TNT-05`
