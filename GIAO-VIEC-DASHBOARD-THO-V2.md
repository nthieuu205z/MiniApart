# MINIAPART — Hoàn thiện không gian thợ sửa chữa và dữ liệu demo (V2)

Đây là yêu cầu mới nhất của người dùng, thay thế phạm vi của `GIAO-VIEC-DASHBOARD-THO.md`. Trực tiếp triển khai và kiểm chứng trong worktree; không chỉ đưa kế hoạch hoặc làm giao diện thống kê dựa trên dữ liệu giả. Chưa sửa module nào ở lượt soạn yêu cầu này.

## 1. Workspace và phối hợp

- Chỉ sửa `D:\vscode\miniapart\MiniApart-worker-dashboard`, nhánh `anti/worker-dashboard`.
- Main ở `D:\vscode\miniapart\MiniApart-main` do Anti khác xử lý dashboard CHU/QUAN_LY. Không thao tác file/Git/database thay phiên đó.
- Đọc skill `.agent/skills/impeccable/SKILL.md` và `.agent/skills/ui-ux-pro-max/SKILL.md`; áp dụng hệ thiết kế hiện có.
- Snapshot nền `6c00588`, commit bàn giao đầu tiên `553e974`. Khi tích hợp chỉ lấy các commit triển khai thợ; không merge cả snapshot hoặc cherry-pick lại snapshot.
- Frontend thợ dùng 5174; backend mới dùng 8084 và database kiểm thử/demo riêng. Không dừng backend 8080, frontend 5173/5183 của phiên chính.
- Trang người dùng chụp ở 5173 thuộc main, chưa chứng minh phần triển khai worktree đã được tích hợp.

## 2. Mục tiêu sản phẩm

Thợ phải có không gian làm việc hoàn chỉnh gồm tổng quan riêng, công việc, chi tiết sự cố, báo giá/chi phí, lịch sử và chứng từ liên quan. Không giữ thiết kế cột thẻ khoảng 430px nằm giữa desktop rộng, số phòng quá lớn và chỉ có nút gọi/báo xong.

Menu THO mong muốn: **Tổng quan – Công việc – Báo giá & thanh toán – Thông báo**. Thợ chỉ xem dữ liệu của mình. Không đưa tài chính cho thuê hoặc hồ sơ định danh đầy đủ của người thuê vào khu vực thợ.

## 3. Code hiện có phải tái sử dụng

- `frontend/src/ViecCuaToi.tsx`, `ViecCuaToi.test.tsx`, `App.tho.test.tsx`.
- `frontend/src/api.ts`: `fetchViecCuaToi`, `fetchChiTietSuaChua`, `hoanThanhViecCuaToi`, `fetchLienKetAnh`; các type sửa chữa.
- `frontend/src/QuanLySuaChua.tsx`: tiếp nhận, phân công và nhập chi phí phía quản lý, có chế độ tenant; chỉ bổ sung phần duyệt báo giá/thanh toán cho CHU/QUAN_LY phù hợp quyền.
- `backend/.../suachua/ThoSuaChuaController.java`: GET `/api/tho/viec-cua-toi`.
- `YeuCauSuaChuaController.java`, `YeuCauSuaChuaService.java`, `YeuCauSuaChuaRepository.java`, `ThongTinYeuCauSuaChua.java`.
- `QuyTacTrangThaiYeuCau.java`: trạng thái chờ xác nhận có quy tắc đóng hiệu lực sau 72 giờ; phải tái sử dụng, không tự thay chính sách.
- `backend/.../billing/KhoanPhatSinhSuaChuaService.java`: ghi khoản phát sinh cho bên thuê, khóa khoản đã lên hóa đơn; không tạo đường ghi thứ hai.
- `backend/.../nguoithue/NhatKyThaoTacRepository.java`, ảnh đính kèm và cơ chế URL ảnh ký hiện có.
- V36 và các migration sau đã lưu yêu cầu sửa chữa, người tạo, người xử lý, mốc phân công/chờ xác nhận, tổng chi phí, bên chịu chi phí.

Các giới hạn đã đọc từ code:
- API việc của tôi loại việc DA_DONG/DA_HUY; frontend còn loại CHO_XAC_NHAN. Không dùng danh sách này để tính lịch sử hoàn thành/doanh số.
- DTO hiện có mô tả, ảnh và chi phí, nhưng chưa có địa chỉ tòa và họ tên người liên hệ trong payload sửa chữa. Frontend type `ThongTinViecCuaToi` còn hẹp hơn DTO backend.
- API chi tiết đã cho THO được giao việc xem; giữ và kiểm thử quyền này, không mở API danh sách toàn tòa cho THO.
- Truy vấn liên hệ hiện chọn số điện thoại từ hợp đồng hiệu lực. Không coi người đứng hợp đồng luôn là người báo hỏng, không lấy cư dân mới của phòng để hiển thị trên lịch sử sự cố cũ.
- Chưa tìm thấy module báo giá có phiên bản và sổ thanh toán cho thợ trong các phần sửa chữa/billing đã truy vết. `chi_phi` không phải bằng chứng thợ đã nhận tiền.
- `KhoanPhatSinhSuaChuaService` liên quan thu tiền người thuê, không phải thanh toán cho thợ. Hóa đơn thuê nhà không được mở nguyên bộ cho THO.

## 4. Bốn màn và cách bố trí

### 4.1 Tổng quan riêng

Tạo `/tho/tong-quan`; đăng nhập THO về đây. Giữ `/viec-cua-toi` cho màn công việc, thêm `/tho/chi-phi` cho báo giá/thanh toán. Refresh, Back/Forward và deep link phải hoạt động; sửa đầy đủ route guard, menu, breadcrumb và nhãn topbar THO, không để redirect vòng hoặc ghi Không gian quản lý cho thợ.

- Bộ lọc khoảng thời gian, tòa có việc được giao; thời gian dùng Clock/timezone dự án, không hard-code ngày năm demo.
- KPI: đang cần xử lý, chờ xác nhận, tỷ lệ hoàn thành, giá trị công việc đã chốt, đã nhận, còn phải trả. KPI liên kết tới danh sách đúng bộ lọc.
- Tỷ lệ hoàn thành: với nhóm việc được giao trong kỳ cho thợ hiện tại, số đã đóng hiệu lực / số được giao không bị hủy. Trình bày rõ kỳ và số tử/mẫu; mẫu bằng 0 là Chưa có dữ liệu. Chờ xác nhận không tính hoàn thành; việc tự đóng theo quy tắc hiện có phải được phân biệt với xác nhận thủ công.
- Hai biểu đồ hữu ích: cơ cấu trạng thái và xu hướng giá trị đã chốt/tiền thực nhận theo thời gian. Có thể thêm lịch sử số việc hoàn thành nếu có mốc lịch sử đáng tin, không lấy thời điểm tạo việc làm thời điểm hoàn thành.
- Giá trị đã chốt lấy phiên bản báo giá được duyệt, mỗi việc chỉ tính một phiên bản hiệu lực; tiền đã nhận lấy giao dịch thanh toán đã xác nhận. Còn phải trả chỉ tính nghĩa vụ đủ điều kiện thanh toán, không cộng cả việc chưa nghiệm thu.
- Chỉ số tiền theo kỳ phải ghi ngày gốc (duyệt, đủ điều kiện, thanh toán); tổng giá trị chốt trong kỳ không nhất thiết bằng đã nhận + công nợ. Trình bày rõ công nợ tại thời điểm cuối kỳ.
- Hiển thị việc cần xử lý và báo giá cần bổ sung ở dưới biểu đồ; không để trang chỉ có các con số.

### 4.2 Công việc theo hàng

- Desktop là các hàng rộng: mã/hạng mục + mô tả ngắn | tòa/phòng | người liên hệ | mức độ | trạng thái | thời điểm phân công | Xem chi tiết. Không dùng chữ Phòng 201 chiếm gần hết thẻ.
- Mobile chuyển thành thẻ gọn một cột; tên dài/mô tả dài không tràn. Không tạo cuộn ngang toàn trang.
- Lọc tòa, trạng thái, mức độ, khoảng ngày; tìm phòng, mã việc, hạng mục và nội dung. Có nhóm Đang làm/Chờ xác nhận/Lịch sử để việc hoàn tất không biến mất khỏi hệ thống.
- Nhãn/mô tả dựa dữ liệu thật: Vòi lavabo rò nước, Mất nước khu bếp, Mạng Wi-Fi chập chờn, Điều hòa không mát... Không tự gán Việc được giao hôm nay cho mọi dòng.

### 4.3 Chi tiết công việc

Nút Xem chi tiết mở trang hoặc drawer rộng có deep link, ví dụ `/viec-cua-toi?yeuCauId=...`; Back/đóng trả về đúng bộ lọc và vị trí danh sách. Modal/drawer phải có focus trap, Escape và trả focus.

Nội dung bắt buộc:
- Mã việc, tiêu đề/hạng mục, ưu tiên và trạng thái.
- Tên tòa, địa chỉ đầy đủ, tầng, số phòng; nút sao chép địa chỉ, liên kết bản đồ khi có địa chỉ thật.
- Họ tên người báo, người liên hệ thực tế, số điện thoại; phân biệt người báo với người đứng hợp đồng. Thông tin quản lý phụ trách nếu có nguồn rõ.
- Mô tả sự cố đầy đủ, thời điểm báo/phân công, ảnh hiện trường, ghi chú khảo sát/kết quả sửa và ảnh sau sửa nếu được hỗ trợ.
- Lịch sử thay đổi trạng thái, người thực hiện, thời điểm; đánh dấu mốc suy ra theo quy tắc hệ thống thay vì giả mốc đã được người dùng xác nhận.
- Báo giá, phiên bản đã chốt, lý do từ chối/đề nghị bổ sung, chi tiết chi phí, thanh toán và chứng từ liên kết.
- Dữ liệu thiếu hiển thị Chưa có thông tin, không bịa tên/địa chỉ, không lấy người thuê hiện tại thay cho người liên quan lịch sử.

Chỉ cấp tên/số liên hệ cần thiết cho công việc được giao; không expose CCCD, tài khoản ngân hàng người thuê, mật khẩu, token hoặc toàn bộ người cư trú. Công việc/ảnh/chứng từ của thợ khác phải bị chặn từ backend.

### 4.4 Báo giá & thanh toán

Màn riêng có danh sách theo việc, mã chứng từ, tòa/phòng, giá trị được duyệt, đã trả, còn lại, trạng thái; bấm xem lại báo giá và chứng từ cũ.

- THO tạo báo giá gồm mô tả xử lý, dòng vật tư/công sửa (tên, lượng, đơn vị, đơn giá, thành tiền), ghi chú và tệp minh chứng phù hợp cơ chế file hiện có.
- Nháp → gửi duyệt → quản lý/chủ có quyền tòa duyệt hoặc từ chối có lý do. Thợ sửa sau từ chối tạo phiên bản mới; bản đã duyệt giữ nguyên, điều chỉnh phải qua phiên bản thay thế và phê duyệt lại.
- Tổng tính ở server bằng BigDecimal, tiền truyền dạng decimal an toàn; không nhận tổng frontend làm nguồn sự thật. Phân biệt chi phí 0 được thỏa thuận với chưa có báo giá.
- Quy trình mặc định: nhận việc → bắt đầu khảo sát (DANG_XU_LY) → gửi/chốt báo giá → sửa → báo xong → xác nhận theo luồng hiện có → quản lý ghi nhận thanh toán. Không phá quy tắc chuyển trạng thái cũ của việc đã tồn tại.
- Tách trạng thái báo giá/thanh toán khỏi enum trạng thái sửa chữa; thợ không tự duyệt báo giá, nghiệm thu hoặc đánh dấu đã nhận tiền thay người có quyền ghi nhận thanh toán.
- Quản lý duyệt ở `QuanLySuaChua.tsx` qua component mới, trong đúng tòa được phân quyền. Ghi rõ bên chịu chi phí khi muốn đưa chi phí sửa chữa vào nghiệp vụ billing hiện có.
- Duyệt báo giá cho thợ không tự đồng nghĩa đã thu người thuê hoặc đã trả thợ. Nếu đồng thời ghi chi phí tính cho người thuê, tái sử dụng `ghiChiPhi`/`KhoanPhatSinhSuaChuaService`, đảm bảo giao dịch nhất quán và không tạo trùng nguồn SUA_CHUA. Không mặc định khoản phải trả thợ luôn bằng khoản thu người thuê khi chưa có quy tắc đó.
- Ghi nhận trả thợ gồm số tiền, thời điểm, phương thức, tham chiếu, người xác nhận; hỗ trợ nhiều lần trả, không vượt khoản phải trả, chống gửi lặp và race bằng khóa/version + idempotency.
- Chỉ ghi đã trả khi giao dịch xác nhận tồn tại; UI nói rõ Ghi nhận thanh toán nếu hệ thống không thực sự chuyển tiền ngân hàng. Điều chỉnh giao dịch qua bản ghi đối ứng có lý do, không xóa dấu vết hoặc sửa đè khoản cũ.
- Cho xem/in/tải phiếu chi phí sửa chữa hoặc phiếu thanh toán với số chứng từ, mã việc, dòng tiền, các bên liên quan, phiên bản được duyệt và lịch sử trả. Tên chứng từ phản ánh đúng nghiệp vụ; không mở hóa đơn thuê nhà hoặc gọi tài liệu nội bộ là hóa đơn điện tử đã phát hành.
- Nếu liên kết hóa đơn người thuê để đối chiếu, THO chỉ thấy dòng sửa chữa được phép xem, không nhận toàn bộ hóa đơn, tiền thuê/cọc hoặc thông tin phòng khác.

## 5. Backend và migration

- Ưu tiên bổ sung DTO/controller/service/repository riêng `Tho*`/`BaoGiaSuaChua*`/`ThanhToanTho*` và `workerDashboardApi.ts`; tái sử dụng bảng yêu cầu sửa chữa, phân quyền, chi phí, ảnh, audit hiện có.
- API stats/history/detail/quote/payment/document đều kiểm tra người dùng hiện tại ở server. Không tin thoId/workerId/phongId/toaNhaId từ client để mở scope; quan hệ yêu cầu–phòng–tòa phải đúng.
- Giữ tương thích endpoint cũ. Ghi nhận trạng thái sửa chữa vẫn đi qua service hiện có, tránh hai nguồn trạng thái hoặc dữ liệu hoàn tất không cập nhật dashboard.
- Bổ sung schema tối thiểu cho báo giá phiên bản + dòng báo giá, phê duyệt, khoản phải trả/giao dịch trả thợ và snapshot chứng từ khi thật sự cần. Ràng buộc FK, số tiền không âm, một bản duyệt hiệu lực và khóa nghiệp vụ chống trùng.
- Phiên bản lịch sử không có chứng cứ thanh toán không được backfill thành đã trả. Dữ liệu chỉ có `chi_phi` hiển thị Chi phí đã ghi nhận / Chưa có hồ sơ báo giá thanh toán, không tạo người duyệt/thời điểm giả.
- Thay đổi công việc bị hủy/chuyển thợ không được làm mất lịch sử chứng từ: thợ cũ xem chứng từ tài chính của chính mình nhưng không tiếp tục thấy thông tin liên hệ cư dân mới hoặc được thao tác việc đã chuyển. Nếu đã có giao dịch tiền, hủy phải có quy trình đối ứng rõ, không tự xóa hay trừ tiền im lặng.
- Không sửa migration V1–V61 đã áp dụng. V62 đang được phiên main xử lý; đọc danh sách migration hiện tại trước khi chọn phiên bản tiếp theo, không dùng số đang có ở main. Báo migration mới cần tích hợp và thử nâng cấp trên bản sao riêng trước khi dùng demo.

## 6. Dữ liệu demo chi tiết — bắt buộc triển khai cùng đợt

Đây là phần người dùng bổ sung: dashboard phải có lịch sử công việc và số tiền thật từ fixture; không chỉ vài việc đang mở. Bổ sung seeder/script có guard cho database demo riêng và báo kết quả thực thi, không chỉ viết đề xuất seed.

### 6.1 Độ phủ và số lượng

- Tái sử dụng hai tài khoản thợ demo `0999000031` (Lê Quốc Huy), `0999000032` (Đặng Văn Thành) nếu tồn tại đúng fixture; không dò người dùng thật theo tên hoặc tự đổi mật khẩu.
- Mỗi thợ có chuyên môn/ghi chú liên hệ bằng dữ liệu fixture nếu schema hỗ trợ; tên tiếng Việt tự nhiên, không dùng A/B/C, User 1/2, địa chỉ hoặc khách giả dạng thông tin thật của người dùng production.
- Thêm một batch 44 yêu cầu có mã/marker fixture riêng, phân bố trong 8–12 tuần gần mốc demo được truyền vào seeder:

| Thợ | Đã phân công | Đang xử lý | Chờ xác nhận | Đã đóng | Đã hủy | Tổng batch |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Lê Quốc Huy | 5 | 4 | 3 | 10 | 2 | 24 |
| Đặng Văn Thành | 4 | 5 | 3 | 7 | 1 | 20 |

Đây là số của batch mới, không hard-code KPI thành các số trên nếu database đã có việc nền. Kiểm chứng tổng dashboard = dữ liệu nền + batch theo phạm vi thời gian và bộ lọc. Nhóm CHO_XAC_NHAN có mốc đủ gần ngày tham chiếu để chưa tự đóng sau 72 giờ.

### 6.2 Nội dung từng đơn

- Tòa/phòng/hợp đồng/người báo/liên hệ đều là FK thật của dataset demo; địa chỉ lấy từ tòa, không gán cùng một người cho mọi phòng.
- Mô tả đa dạng: vòi rò nước, lavabo thoát chậm, mất nước, bồn cầu rò, đèn bếp nhấp nháy, ổ điện chập chờn, Wi-Fi mất kết nối, router lỗi nguồn, điều hòa không mát, bình nóng lạnh lỗi, khóa cửa kẹt, cửa sổ thấm nước, quạt hút kêu, bếp lỗi.
- Mỗi yêu cầu có triệu chứng cụ thể, vị trí, ảnh nếu có, ghi chú khảo sát và kết quả sửa với đơn đã xong; không lặp nguyên câu mô phỏng trong mọi nội dung.
- Thời điểm báo ≤ tiếp nhận ≤ phân công ≤ xử lý ≤ báo xong ≤ nghiệm thu ≤ thanh toán theo luồng tương ứng. Không seed DA_DONG nhưng không có căn cứ lịch sử; thợ được gắn phải đúng người xử lý.
- Có ưu tiên thường/gấp/khẩn cấp; có nhiều tòa và tầng trong các tòa demo thực sự được phép dùng, tránh dữ liệu một chiều.
- Dòng báo giá thực tế theo việc (ví dụ thay dây cấp, gioăng, adapter, công vệ sinh/sửa), số lượng/đơn vị/đơn giá nhất quán; tiền ở mức phù hợp dữ liệu demo. Tổng bằng tổng dòng, không rải số ngẫu nhiên không đối chiếu được.

### 6.3 Hoàn tất và tiền

- Trong 10 đơn đóng của Huy: 5 đã trả đủ, 3 trả một phần, 2 chưa trả; trong 7 đơn đóng của Thành: 3 đã trả đủ, 2 trả một phần, 2 chưa trả. Mỗi trạng thái phải được chứng minh bằng giao dịch, không chỉ nhãn.
- Có ít nhất một đơn bảo hành/khắc phục không thu phí với số 0 được xác nhận; giữ trạng thái Đã đối soát – không phát sinh tiền để không nhầm thiếu giá. Chọn trong nhóm đã đối soát đủ, giải thích không có giao dịch chuyển tiền.
- Có báo giá nháp, chờ duyệt, từ chối có lý do và phiên bản thay thế đã duyệt; số tiền KPI chỉ lấy bản có hiệu lực.
- Có việc do chủ chịu phí và do người thuê chịu phí; không biến toàn bộ giá trị sửa chữa thành doanh thu người thuê phải trả.
- Tạo được phiếu/chứng từ xem lại cho các đơn đã chốt và giao dịch đã ghi nhận; lịch sử mở đúng chi tiết gốc, không lấy tên/liên hệ của cư dân mới.
- Dữ liệu có ít nhất một tháng và một bộ lọc không phát sinh để kiểm tra empty state; hai thợ có số liệu khác nhau để kiểm tra scope.

### 6.4 An toàn và idempotency

- Mặc định tắt; yêu cầu tên database demo chính xác, marker dataset bắt buộc và tham số reference date. Không fallback vào database ứng dụng, tên khách hay số điện thoại để suy đoán dữ liệu demo.
- Lưu marker/mã nghiệp vụ ổn định cho từng việc/chứng từ/giao dịch. Chạy lại cùng batch không nhân đôi, không đổi ngày lịch sử theo ngày chạy mới, không ghi đè việc người dùng đã sửa; nếu xung đột thì fail rõ và rollback.
- Một transaction phù hợp + lock chống chạy đồng thời; không sửa `flyway_schema_history`, không reset/drop database, không seed qua migration production.
- Chỉ bổ sung batch vào database kiểm thử/demo riêng. Trước khi đưa sang demo chính phải có kế hoạch tích hợp, backup và kiểm chứng không đổi hợp đồng/hóa đơn/tiền cọc/giao dịch cũ.
- Báo số bản ghi thực tế trước/sau theo từng bảng, kiểm tra FK, tổng báo giá/giao dịch/công nợ và chạy lại chứng minh không trùng.

## 7. Phạm vi file và cách tránh xung đột

- Phần thợ, API mới, CSS scoped, component báo giá/quyết toán và test riêng là phạm vi chính.
- Yêu cầu V2 CHO PHÉP sửa hẹp `App.tsx`, `roleNavigation.ts` và test route để gắn ba màn THO và mặc định đăng nhập. Giữ nguyên nhánh CHU/QUAN_LY và toàn bộ quyền cũ; bàn giao riêng diff tích hợp của các file chung.
- Tạo `ThoWorkspace.tsx`/các màn riêng để App chỉ cần wiring ngắn. Không redesign sidebar/topbar dùng chung; chỉ bổ sung menu/nhãn đúng THO.
- `QuanLySuaChua.tsx` chỉ thêm component duyệt báo giá/ghi nhận trả thợ, không viết lại toàn module. Tenant không nhìn thấy chức năng này.
- Không sửa `ChuDashboard.tsx`, `QuanLyDashboard.tsx`, backend dashboard chủ/quản lý, V61/V62 hoặc script điện nước của phiên main.
- Hạn chế sửa `api.ts`: import helper cũ, API bổ sung ở file riêng. Không đổi global CSS/tokens làm lệch actor khác.
- Kiểm tra git status trước khi sửa; không ghi đè thay đổi đang có của agent khác trong cùng worktree. Chia commit backend/data/UI/tests có thể review; không tự push/merge.

## 8. Trình tự triển khai và nghiệm thu

1. Đối chiếu schema/API/test, chốt sơ đồ trạng thái và DTO; ghi rõ nguồn/định nghĩa từng KPI và khoản tiền.
2. Làm backend/permission/history/detail và schema bổ sung; giữ API cũ hoạt động.
3. Làm luồng thợ gửi báo giá, quản lý duyệt, nghiệm thu, ghi nhận thanh toán và chứng từ; kiểm chứng giao dịch/idempotency trước seed.
4. Tạo batch demo 44 đơn trong DB riêng; kiểm tra lịch sử, tiền, chạy lại seeder và rollback thực tế.
5. Xây ba màn THO và bổ sung UI quản lý đúng scope; dùng dữ liệu thật từ API mới.
6. Chạy compile/test liên quan, frontend test/build; browser 1440px/390px đủ tổng quan, danh sách, chi tiết, gửi/duyệt giá, việc xong và mở chứng từ cũ. Không đánh dấu PASS nếu chỉ có mock/HTTP200.

Test bắt buộc:
- Hai thợ không xem/sửa việc, báo giá, ảnh/chứng từ của nhau; CHU/QUAN_LY ngoài quyền tòa không duyệt/trả tiền; không lộ CCCD hoặc hóa đơn tiền thuê.
- Route mới không redirect vòng; đăng nhập/refresh/Back/Forward và mở deep link đều đúng.
- Tỷ lệ hoàn thành mẫu 0, có việc hủy/chờ xác nhận/đóng tự động; bộ lọc/timezone/tiền theo kỳ nhất quán; không cộng trùng phiên bản báo giá.
- Chi tiết dùng đúng người báo/liên hệ của đơn, nhất là khi hợp đồng kết thúc/chuyển cư dân/chuyển thợ.
- Giá thiếu khác 0; số âm/sai độ chính xác/giả tổng bị chặn; reject/revise/approve stale version, hai người duyệt cùng lúc và gửi lặp không sinh hai nghĩa vụ.
- Trả nhiều lần/đủ/0 tiền, vượt tiền, race trả tiền và hủy; ghi người/ngày/số tham chiếu; điều chỉnh không xóa lịch sử.
- Chi phí SUA_CHUA không vào hóa đơn hai lần; việc đã có khoản DA_TINH vẫn khóa sửa/hủy như cũ; thanh toán thợ không biến thành thanh toán hóa đơn thuê nhà.
- Giữ báo xong/hoàn tác 10 giây trước gửi, 409, lỗi mạng/thử lại và chống submit lặp; báo xong chưa phải nghiệm thu.
- Phản hồi muộn A→B→A không làm lẫn chi tiết/số liệu; trạng thái loading/error/empty tách biệt, không chuyển lỗi thành 0.
- Seed chạy hai lần không trùng; trigger lỗi giữa chừng rollback; không có marker hoặc sai database phải fail trước khi ghi; dữ liệu cũ không bị sửa.
- Chứng từ lưu/in đọc được tiếng Việt, đúng dòng và tổng, nhiều trang không cắt bảng nếu xuất PDF; nếu chỉ in HTML thì báo rõ phương thức đó.

## 9. Bàn giao

Gửi commit triển khai (không gồm snapshot), danh sách file/migration, schema/API mới, database/cổng demo riêng, tài khoản thợ đã xác minh, cách mở ba màn và kịch bản demo 5 phút. Kèm ảnh 1440px/390px, kết quả test thực chạy, số fixture đã tạo và bảng đối soát tổng tiền theo từng thợ. Tách rõ PASS/FAIL/CHƯA KIỂM CHỨNG, hướng tích hợp file chung/migration/data. Không chỉ báo đã thêm biểu đồ hay số test PASS.
