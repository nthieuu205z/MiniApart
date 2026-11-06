# Giao việc độc lập: dashboard thợ sửa chữa MiniApart

> **YÊU CẦU ĐÃ MỞ RỘNG:** Đọc và thực hiện `GIAO-VIEC-DASHBOARD-THO-V2.md` trước. V2 thay thế phạm vi/thiết kế/nghiệm thu bên dưới, bổ sung dashboard riêng, danh sách theo hàng, chi tiết công việc, báo giá, chứng từ thanh toán và dữ liệu demo lịch sử. Không tiếp tục bản tối giản chỉ có một màn Việc của tôi.

## Workspace bắt buộc

- Chỉ làm việc tại `D:\vscode\miniapart\MiniApart-worker-dashboard`.
- Nhánh: `anti/worker-dashboard`.
- Snapshot nền: `6c0058860b37b5b9c68f510b1d55ca0666537f8e`.
- Snapshot lấy từ phần đã stage của thư mục chính, không chứa các thay đổi backend đang sửa dở/chưa stage. Đây là snapshot để làm việc song song, không phải bản nghiệm thu các lỗi dashboard chủ/quản lý.
- Thư mục `D:\vscode\miniapart\MiniApart-main` đang do một Anti khác sửa dashboard CHU/QUAN_LY. Không chỉnh file, chuyển nhánh, commit, reset, clean hoặc chạy lệnh ghi dữ liệu thay phiên đó.
- Không tự merge/cherry-pick các nhánh khác hoặc sửa cấu hình worktree.

## Nhiệm vụ

Bạn là Senior Product Designer và React/Spring Boot Developer. Hãy nâng cấp màn **Việc của tôi** của vai trò **THO** thành dashboard công việc rõ ràng, có thống kê phù hợp và thao tác tốt trên điện thoại. Trực tiếp triển khai và kiểm chứng trong worktree này; không chỉ gửi kế hoạch.

Đây là dashboard của thợ, không phải bản sao dashboard tài chính của chủ nhà. Giữ nguyên route `/viec-cua-toi`, quyền THO và các luồng sửa chữa hiện có.

Đọc hai skill có sẵn:
- `.agent/skills/impeccable/SKILL.md`
- `.agent/skills/ui-ux-pro-max/SKILL.md`

Áp dụng hướng dẫn về màn vận hành, hierarchy, charts, responsive và accessibility. Dùng hệ thiết kế hiện tại; không redesign shell, sidebar hay toàn app.

## Hiện trạng đã xác minh

Frontend:
- `frontend/src/ViecCuaToi.tsx` và `ViecCuaToi.test.tsx`.
- `frontend/src/App.tho.test.tsx`: kiểm tra vào màn của thợ.
- `frontend/src/api.ts`: `fetchViecCuaToi`, `hoanThanhViecCuaToi`, `fetchLienKetAnh`, `ThongTinViecCuaToi`.
- `frontend/src/roleNavigation.ts`: THO hiện có `/viec-cua-toi` và `/thong-bao`.

Backend:
- `backend/src/main/java/com/prj1/ccm/suachua/ThoSuaChuaController.java`.
- `YeuCauSuaChuaService.java`, `YeuCauSuaChuaRepository.java`, `ThongTinYeuCauSuaChua.java` trong cùng package.
- GET `/api/tho/viec-cua-toi` kiểm tra vai trò thợ, lấy yêu cầu theo người xử lý và loại DA_DONG/DA_HUY.
- Frontend hiện còn loại CHO_XAC_NHAN khỏi danh sách cần làm.
- Nút báo sửa xong có cơ chế đợi 10 giây để hoàn tác trước khi gửi; helper API xử lý bắt đầu/hoàn thành và xung đột 409.

Không tính số việc đã hoàn thành theo tháng hoặc hiệu suất lịch sử từ danh sách đang mở nói trên. Nếu cần thống kê lịch sử, phải truy vấn đúng dữ liệu lưu trong backend và đúng người được giao.

## Kết quả mong muốn

### 1. Tổng quan công việc

Thể hiện các chỉ số dựa trên trạng thái thực tế:
- Tổng việc đang cần xử lý.
- Việc đang xử lý.
- Việc khẩn cấp/chưa xử lý.
- Việc đã báo xong, chờ quản lý xác nhận, nếu nguồn API có dữ liệu.

Phân biệt các KPI có thể chồng nhau (ví dụ việc khẩn cấp nằm trong việc đang mở) với các nhóm trạng thái loại trừ nhau. Không cộng chúng thành một tổng sai.

Nếu thêm chỉ số đã hoàn thành trong 7/30 ngày, ngày quá hạn hoặc thời gian xử lý, phải có nguồn ngày giờ và quy tắc rõ. Không tự gán tất cả việc là “hôm nay”, không tạo deadline hoặc thời gian hoàn thành giả.

### 2. Biểu đồ có ích, vừa đủ

Ưu tiên tối đa hai biểu đồ:
- Cơ cấu trạng thái các việc được giao, có đơn vị số việc và nhóm rõ.
- Phân bố theo hạng mục/mức độ; hoặc xu hướng hoàn thành nếu có nguồn lịch sử đủ tin cậy.

Không thêm doanh thu cho thuê, tỷ lệ kín phòng, điện nước toàn tòa, chi phí của chủ nhà hoặc điểm đánh giá/hiệu suất tự đặt.

### 3. Danh sách hành động

- Việc khẩn cấp/chưa xử lý được ưu tiên.
- Lọc theo tòa được giao việc, mức độ, trạng thái; tìm theo phòng/hạng mục/nội dung.
- KPI/bộ lọc và danh sách dùng định nghĩa nhất quán; ghi rõ KPI theo toàn bộ việc hay kết quả đang lọc.
- Thẻ việc thể hiện tòa, phòng/tầng, hạng mục, nội dung, mức độ, trạng thái và hành động.
- Chi tiết/ảnh hiện trường có thể xem khi có dữ liệu. Giữ cơ chế ảnh ký, hết hạn, tải lại và fallback hiện có.
- Giữ liên hệ người báo nếu người dùng có quyền xem theo API hiện tại.
- Giữ quy trình báo sửa xong, cửa sổ hoàn tác 10 giây, xử lý 409, chống gửi lặp, lỗi mạng/thử lại và cập nhật số liệu sau thành công.
- Phân biệt “Đã báo xong, chờ xác nhận” với “Đã đóng/được xác nhận”. Thợ không tự duyệt kết quả thay quản lý.

### 4. Thiết kế

- Mobile 390px là ưu tiên; desktop 1440px tận dụng không gian hợp lý.
- Thống kê gọn ở đầu, danh sách thao tác dễ tiếp cận, không để biểu đồ đẩy việc cần làm quá xa.
- Chữ dễ đọc, trạng thái có nhãn, nút chạm đủ lớn, focus bàn phím rõ.
- Loading/error/empty/đang gửi là các trạng thái riêng. Không hiện bảng kiểm tra kết nối hoặc mã FR.
- Không dùng ảnh nền trang trí sau biểu đồ/form, không thêm dữ liệu hard-code để lấp dashboard.

## Ranh giới file để tránh xung đột với Anti còn lại

Được chỉnh:
- `frontend/src/ViecCuaToi.tsx`, `ViecCuaToi.test.tsx`.
- Các file mới riêng cho thợ, ví dụ `ThoDashboard*.tsx`, `workerDashboardApi.ts`, `worker-dashboard.css` và test tương ứng.
- `App.tho.test.tsx` nếu cần mở rộng kiểm thử riêng cho thợ.
- Nếu cần backend: ưu tiên file mới `ThoDashboard*.java` và test riêng, sử dụng dữ liệu sửa chữa hiện có và scope người xử lý.

Các file dùng chung sau chỉ đọc trong đợt song song này:
- `App.tsx`, `api.ts`, `roleNavigation.ts`, `styles.css`, tokens và component shell/layout dùng chung.
- `ChuDashboard.tsx`, `QuanLyDashboard.tsx`, `BangViecVanHanh.tsx`.
- Package backend dashboard chủ/quản lý, V61/V62 và script dữ liệu.

Gắn UI mới thông qua `ViecCuaToi.tsx` đang được App import để giữ route mà không cần sửa App. Tái sử dụng helper API hiện có qua import; API bổ sung đặt trong file riêng của thợ. CSS mới phải scope vào vùng dashboard thợ, tránh selector toàn cục.

Nếu có dependency thật sự cần sửa file ngoài ranh giới, ghi rõ patch đề xuất trong bàn giao để tích hợp sau; không tự sửa thư mục chính hoặc mở rộng sang lỗi F01–F08 của phiên còn lại.

## Backend, dữ liệu và phân quyền

- Chỉ được xem thống kê/danh sách/ảnh của việc giao cho tài khoản THO đang đăng nhập.
- Không lấy dữ liệu toàn tòa rồi lọc ở frontend. Không tin workerId từ client để mở rộng scope.
- Không nới quyền của API báo cáo chủ nhà hoặc dùng tài khoản chủ/quản lý để lấy số liệu cho thợ.
- Ưu tiên không cần migration: dùng trạng thái và thời điểm đã lưu của yêu cầu sửa chữa. Không tự thêm migration trùng phiên bản V62 đang được sửa ở main.
- Không seed/reset database đang dùng demo. Không chạy script bổ sung điện nước hoặc sửa hóa đơn/cọc/hợp đồng.
- Backend 8080 hiện là phiên demo đang được dùng chung: có thể kiểm tra đọc; mọi kiểm thử ghi phải dùng mock hoặc database kiểm thử riêng. Không dừng tiến trình backend/frontend của phiên khác.
- Nếu cần chạy backend của nhánh này, dùng cổng 8084 và database demo riêng đã xác nhận; không trỏ bootRun/migration vào database chung.

## Khởi động frontend riêng

Thư mục frontend có `.env.local` local-only trỏ API về backend demo 8080. Không commit file này hoặc bí mật môi trường.

```powershell
Set-Location D:\vscode\miniapart\MiniApart-worker-dashboard\frontend
npm.cmd ci --offline --no-audit --no-fund
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Nếu dependency đã được cài thì bỏ bước `npm ci`. Không dùng cổng 5173/5183 của phiên khác. Backend 8080 thay đổi theo phiên khác, vì vậy cần kiểm chứng tích hợp lại sau khi hai nhánh hoàn tất; worktree không tự tách dịch vụ hay database.

Tài khoản thợ demo hiện có: `0999000031` (Lê Quốc Huy) và `0999000032` (Đặng Văn Thành). Dùng mật khẩu demo được người dùng cung cấp/cấu hình hiện tại; không đổi mật khẩu hoặc ghi token vào tài liệu/commit.

## Nghiệm thu và bàn giao

1. Test baseline và sau sửa: `npm.cmd run test -- --run src/ViecCuaToi.test.tsx src/App.tho.test.tsx` và các test mới của dashboard thợ.
2. Frontend test/build PASS; backend compile/test liên quan nếu có thay đổi backend.
3. Kiểm tra hai tài khoản thợ không nhìn thấy việc/ảnh/thống kê của nhau trái quyền; không xem tài chính chủ nhà.
4. KPI đúng nguồn; lọc, refresh, lỗi tải, phản hồi muộn và cập nhật trạng thái không làm sai tổng.
5. Báo sửa xong + hoàn tác trong 10 giây, gửi thành công/thất bại, 409 và chống submit lặp không regression. Kiểm chứng ghi trong môi trường riêng.
6. Browser desktop/mobile, ảnh dài/tên tòa dài, nhiều việc/không việc; không clip nội dung, không chỉ kiểm tra scrollWidth root.
7. Chụp dashboard 1440px/390px và luồng chi tiết/hoàn tác; ghi rõ phần chưa kiểm chứng.
8. Commit CHỈ phần dashboard thợ và báo các commit triển khai, danh sách file, lệnh kiểm chứng, kết quả thực tế, giới hạn dữ liệu và yêu cầu tích hợp.

**Tích hợp:** Không merge toàn bộ nhánh này vào main. Nhánh có một snapshot nền chứa các sửa đã stage của phiên chủ/quản lý. Sau khi main hoàn tất phần của nó, người tích hợp chỉ cherry-pick các commit triển khai dashboard thợ sau commit setup bàn giao; không cherry-pick snapshot nền `6c00588` hoặc nhận lại cả bộ sửa dashboard chủ/quản lý. Không tự push/merge trong lúc agent kia còn làm.
