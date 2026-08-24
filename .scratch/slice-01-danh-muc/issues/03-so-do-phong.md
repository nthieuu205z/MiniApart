# 03: Sơ đồ phòng theo tầng · FR-BLD-03

**What to build:** Một màn hình nhìn phát biết ngay tình hình cả toà: các phòng xếp theo tầng, mỗi phòng một ô, trạng thái phân biệt bằng **màu và nhãn chữ**. Bấm vào một phòng thì mở chi tiết phòng đó.

**Vì sao phải có cả nhãn chữ, không chỉ màu.** Yêu cầu ghi rõ "màu sắc **và** nhãn chữ". Khoảng 8% nam giới bị rối loạn sắc giác đỏ-lục, và "phòng trống" với "phòng đang sửa" rất dễ được tô hai màu mà người đó nhìn ra như nhau. Ngoài ra ảnh chụp màn hình in đen trắng vào báo cáo cũng mất hết màu. Nhãn chữ giải quyết cả hai.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Phòng nhóm theo tầng, trong mỗi tầng sắp theo số phòng
- [ ] Mỗi ô hiện số phòng, trạng thái bằng chữ, và màu nền theo trạng thái
- [ ] Đọc được khi in đen trắng — thử bằng cách chuyển ảnh chụp sang thang xám và kiểm tra vẫn phân biệt được
- [ ] Có ô đếm tổng: bao nhiêu phòng trống, đang thuê, đang sửa
- [ ] Một toà 20 phòng hiện đủ trong một màn hình trên máy tính, không phải cuộn
- [ ] Tên test mang mã `FR-BLD-03`
