# Review dashboard MiniApart và prompt khắc phục trước demo — 2026-11-06

## Kết luận và phạm vi

**CHƯA ĐẠT nghiệm thu dashboard để demo.** Đã đọc các module dashboard mới, V61, script bổ sung demo, caller/API frontend và dependency trực tiếp; kiểm tra API thật và trình duyệt 1440px/390px. Không sửa code ứng dụng, không chạy migration/seed, không ghi chỉ số/phát hành hóa đơn/thu tiền trong lượt review.

Git HEAD khi review: `38b388d`; phần dashboard và V61 còn chưa commit. Runtime kiểm tra: frontend `http://127.0.0.1:5183`, backend 8080, database demo `miniapart_demo_verify_df1c98999cbd44a3afcaa8a16b0d7d1c`.

Kiểm chứng đã thực sự chạy:
- Frontend `npm.cmd run test -- --run`: **242 PASS / 35 files**.
- Frontend `npm.cmd run build`: PASS, có cảnh báo kích thước bundle, không phải lỗi chặn build.
- Backend `gradlew.bat --offline compileJava test --tests '*DashboardChuServiceTest' --tests '*DashboardQuanLyServiceTest' --tests '*DoiSoatDienNuocServiceTest'`: compile PASS, **6 unit test PASS**, 0 skip. Các test này không chứng minh truy vấn SQL/migration và quy trình ghi số thật đã đúng.
- API chủ/quản lý đúng vai trò trả 200; dashboard tòa ngoài quyền trả 403. Riêng API đọc chỉ số chung bị lọt quyền như F01.
- Browser kiểm tra dashboard, các tab, đổi tòa, KPI drill-down, cảnh báo, desktop/mobile. Không xác nhận các lệnh ghi dữ liệu bằng cách chạy trên database đang dùng demo.

Bằng chứng máy đọc và ảnh ở `backend/build/dashboard-review-20261106/`, đặc biệt `api-and-interaction-evidence.json`, `owner-business-390.json`, `manager-debt-drilldown-failed-1440.png`, `owner-mixed-building-scopes-1440.png`. Build output không commit.

## Phát hiện đã xác minh

### F01 — P1: Lọt phân quyền đọc chỉ số; thiếu kiểm tra liên kết tòa–kỳ khi ghi

- `backend/src/main/java/com/prj1/ccm/dashboard/DiemDoDungChungController.java:41–47`: GET `/chi-so` gọi thẳng `findChiSoByKy`, không kiểm tra người dùng, vai trò hoặc quyền tòa.
- Đã gọi bằng người thuê `0999100001` và quản lý tòa 4 `0999000021`: GET `/api/cong-to-dung-chung/chi-so?kyId=4` đều trả **200 / 6 dòng của tòa 3**. Người dùng đó không có quyền quản trị tòa 3.
- Cùng controller `:51–80`: đường ghi chỉ kiểm tra quyền điểm đo, không kiểm tra kỳ thuộc cùng tòa, kỳ đã khóa hay dữ liệu bắt buộc. Repository upsert theo cặp điểm đo/kỳ; FK trong V61 chỉ đảm bảo ID tồn tại, không đảm bảo cùng tòa. Phần nguy cơ ghi sai được xác minh bằng code, không thử ghi lên database demo đang dùng.
- Sửa: kiểm tra vai trò và scope ở service; xác thực điểm đo và kỳ cùng tòa, trạng thái kỳ, chỉ số và thay công tơ; dữ liệu không hợp lệ phải trả 400/403 và không có bản ghi mới. Áp dụng cùng kiểm tra tòa–kỳ cho API đối soát.

### F02 — P1: Dashboard trả số giả từ code nghiệp vụ

- `DashboardChuService.java:251–255`: mỗi tháng điện luôn `1006 / 555 / 1570`, nước luôn `61 / 20 / 82`, không truy vấn tiêu thụ; `kyId=null`.
- `DashboardChuService.java:160–169`: gán tỷ lệ phòng hiện tại cho mọi tháng và `duDuLieu=true`.
- `DashboardQuanLyRepository.java:159–160`: số công tơ đã ghi luôn **50**, tổng = số chưa ghi + 50.
- API thật tòa 3 tái hiện cả ba: sáu tháng có tiêu thụ giống nhau, lịch sử lấp đầy đều 75%, công tơ 50 đã ghi/60 tổng.
- Sửa: bỏ hẳn các nguồn số giả; truy vấn theo scope/kỳ thực. Lịch sử không đủ phải nêu thiếu dữ liệu, không gán hiện trạng hôm nay cho quá khứ. Fixture phải ở database demo, không ở service hoặc frontend.

### F03 — P1: Script seed không có biên bảo vệ database và không idempotent cho cảnh báo

- `scripts/enrich-presentation-demo-utility-meters.sql:4–44`: không kiểm tra `current_database()`, tên database mong đợi hoặc yêu cầu marker bắt buộc; thiếu marker thì fallback theo số điện thoại ở dòng 32–33.
- Các upsert điểm đo cập nhật theo mã tòa/công tơ. Hai INSERT cảnh báo `:154` và `:176` không có điều kiện chống trùng; V61 không có khóa nghiệp vụ duy nhất cho cảnh báo. Dòng 180 còn cố định kỳ **14**.
- Chạy lại sẽ thêm cảnh báo lặp; chạy nhầm database có dữ liệu trùng mã có thể ghi vào dữ liệu ngoài bộ demo. Không thực thi lại script trong review.
- Sửa theo guard của script bổ sung tiện ích đã có: database demo được xác nhận chính xác, marker bắt buộc, không fallback người dùng; transaction + lock, nguồn ID truy vấn thực, idempotency và audit. Không ghi đè điểm đo không chứng minh được quyền sở hữu của fixture. Nếu V61 đã áp dụng, bổ sung migration kế tiếp phù hợp, không sửa lịch sử.

### F04 — P2: Sai phạm vi kỳ/tòa và kết luận đối soát khi dữ liệu chưa đủ

- `DashboardChuService.java:173,219` và `DashboardQuanLyService.java:200`: cố định kỳ **4**; chủ chọn tất cả tòa thì lấy dữ liệu chung của tòa đầu tiên. Kỳ 4 thực tế là tòa 3, tháng 10/2026; kỳ tháng 10 của tòa 4 là 9.
- `DoiSoatDienNuocService.java:215`: cộng `chi_so_cuoi-chi_so_dau`, bỏ qua quy tắc thay công tơ đã có.
- `:231–232`: điểm đo chung thiếu chỉ số bị biến thành tiêu thụ/chi phí 0; không kiểm tra đủ toàn bộ số đo phòng/chung hoặc tránh cộng trùng nhánh công tơ cha/con.
- `:99–103`: dùng đơn giá tự đặt 2500/15000 để quy đổi ngưỡng; chênh lệch âm cũng có thể được kết luận khớp. V61 đặt đơn giá mua mặc định 0, chưa phân biệt giá chưa cấu hình.
- Sửa: kỳ đúng tòa/khoảng thời gian được chọn; trả nguồn và trạng thái chất lượng dữ liệu; xử lý thay công tơ bằng quy tắc dùng chung; thiếu số đo/giá không là 0; không kết luận thất thoát/khớp khi thiếu căn cứ. Với tất cả tòa, tổng hợp đúng hoặc trình bày từng tòa/kỳ rõ ràng.

### F05 — P2: KPI và cơ cấu phòng mâu thuẫn dữ liệu thực

- `DashboardChuService.java:79,184`: KPI tên `congNoHienTai` lấy công nợ của các hóa đơn phát hành trong khoảng lọc, trong khi tuổi nợ tính toàn bộ hiện tại.
- API `/api/dashboard/chu?toaNhaId=3&tuNgay=2026-11-01&denNgay=2026-11-06`: KPI nợ **0**, nhưng tuổi nợ còn **20 hóa đơn / 50.398.000đ**.
- `DashboardChuRepository.java:190–191`: trạng thái đang sửa và ngừng khai thác đếm độc lập. Tòa 3 tổng 12 phòng nhưng cơ cấu trả 9 thuê + 2 trống + 1 sửa + 1 ngừng = **13**.
- `DashboardChuRepository.java:105,354`: dòng tiền chỉ cộng `loai='THU'`; cần xác minh/sửa quy tắc bút toán đối ứng và hoàn tiền, tránh gọi tổng thu dương là dòng tiền ròng. Đây là phát hiện từ code, chưa tạo giao dịch hoàn tiền mới trong review.
- Sửa: công nợ hiện tại nhất quán với tuổi nợ theo cùng thời điểm; nếu có chỉ tiêu công nợ theo lứa hóa đơn thì ghi riêng. Cơ cấu là các nhóm loại trừ nhau, tổng bằng số phòng; trạng thái sửa/ngừng có thể là chỉ tiêu bổ sung riêng nhưng không cộng hai lần trong cơ cấu. Giữ quy tắc ledger hiện có.

### F06 — P2: KPI drill-down và bảng nhắc việc không giữ đúng ngữ cảnh

- `frontend/src/QuanLyDashboard.tsx:211`: không chọn tòa tạo URL `/hoa-don&trangThai=NO_QUA_HAN` thay vì query string. Browser đã tái hiện màn **Không có quyền**.
- `frontend/src/ChuDashboard.tsx:327`: tương tự với URL phòng trống; dù chọn tòa thì route `/phong` hiện chỉ cho QUAN_LY trong `App.tsx:490`, nên cần đường drill-down phù hợp với CHU, không bỏ guard cho qua.
- `ChuDashboard.tsx:685`, `QuanLyDashboard.tsx:373`: nhúng `BangViecVanHanh` nhưng không truyền/đồng bộ scope. Browser đổi dashboard An Nhiên (3) → Mộc Lan (5), bảng nhắc việc vẫn An Nhiên (3).
- `ChuDashboard.tsx:30–31,60–70`: ngày mặc định và các nút tháng này/tháng trước đều hard-code 2026, không theo ngày thực tế.
- Sửa URL bằng URLSearchParams và route đúng quyền; thống nhất bộ lọc cha/con; ngày tính động theo timezone hiện có. Đổi tòa/kỳ không để dữ liệu cũ dưới nhãn mới, kể cả khi request thất bại.

### F07 — P2: Cảnh báo mới chỉ có dữ liệu seed, chưa thành luồng vận hành

- Tìm toàn bộ caller production chỉ thấy định nghĩa `DoiSoatDienNuocService.kiemTraBatThuongDiemDo` ở dòng 126 và `CanhBaoTieuThuRepository.taoCanhBaoNeuChuaCo` ở dòng 134; chưa có đường ghi chỉ số gọi hai bước này.
- `DiemDoDungChungController.java:69` chỉ lưu chỉ số. Frontend mới chỉ gọi dashboard và cập nhật trạng thái cảnh báo; chưa có luồng nhập/xem chỉ số công tơ chung. Nút xem chỉ số dẫn sang màn ghi chỉ số phòng cũ.
- Cảnh báo hiện có được INSERT tĩnh bởi script. Đã kiểm tra đọc/mở dialog; không ghi số hoặc đổi trạng thái cảnh báo trên database đang dùng để giả chứng minh luồng đầy đủ.
- Sửa: nối ghi số → đánh giá theo kỳ → upsert cảnh báo → dashboard; UI nhập/xem đúng công tơ chung, đúng quyền và kỳ; xác nhận xử lý có validation/audit. Kiểm chứng bằng fixture mới trong database thử nghiệm riêng. Không chỉ thêm cảnh báo tĩnh hoặc button không có tác dụng.

### F08 — P2: Tab kinh doanh của chủ nhà vẫn bị cắt trên mobile; token chọn kỳ không tồn tại

- `ChuDashboard.tsx:404`: grid con dùng `1fr`; nội dung biểu đồ làm cột nở theo min-content. Browser 390px đo card bên trong từ x31 đến **x466,55**, vượt vùng nhìn thấy; App shell che phần tràn nên scrollWidth toàn trang vẫn bình thường.
- `ChuDashboard.tsx:962–980`: style chọn kỳ/tab dùng `--ma-primary` nhưng token đó không được khai báo trong tokens/styles. Nút đang chọn có chữ trắng trên nền không được áp dụng; ảnh mobile không đọc được nhãn “6 tháng gần nhất”.
- Sửa grid con `minmax(0,1fr)`, wrapper min-width phù hợp, bảng cuộn riêng; dùng token thương hiệu có thật. Không che bằng overflow hidden hoặc giảm chữ.

## PROMPT COPY CHO ANTIGRAVITY

Bạn là người triển khai khắc phục dashboard MiniApart trước buổi demo. Đây là lượt sửa hoàn thiện các luồng đã thêm, không phải lượt thêm chức năng/redesign mới.

### 1. Mục tiêu và thứ tự

Xử lý đầy đủ F01–F08 phía trên trong một đợt có kiểm chứng. Thứ tự: phân quyền/toàn vẹn dữ liệu → bảo vệ script → dữ liệu dashboard thực → đối soát/cảnh báo → drill-down/scope → responsive. Đọc code và bằng chứng trước khi sửa; không gỡ chart, tắt kiểm tra quyền, điền số giả hoặc sửa nhãn để che lỗi dữ liệu.

Giữ nguyên hệ thiết kế đã chốt, hợp đồng/snapshot, QR, ledger, hóa đơn và các tính năng actor khác. Không reset database, không xóa dữ liệu thật, không sửa migration đã áp dụng. Kiểm tra trạng thái V61 thực tế để quyết định migration kế tiếp. Bảo toàn thay đổi chưa commit và ghi lại mốc đầu/cuối của đợt sửa.

### 2. Tiêu chí bắt buộc theo nhóm

**F01:**
- GET chỉ số chung yêu cầu vai trò được phép và quyền tòa sở hữu kỳ/điểm đo. Người thuê và quản lý tòa khác trả 403/404, không trả dữ liệu.
- POST ghi số xác thực điểm đo–kỳ cùng tòa, kỳ có thể ghi, trường bắt buộc, số không âm và thay công tơ hợp lệ. Lỗi trả 400/403, không để DB exception/NPE thành 500, không tạo/cập nhật bản ghi.
- Tách logic nghiệp vụ vào service/transaction thích hợp; audit khi thay đổi. API đối soát cũng phải kiểm tra cùng quan hệ, không chỉ toaNhaId.

**F02:**
- Thay toàn bộ số liệu điện/nước, số công tơ và lịch sử phòng hard-code bằng dữ liệu truy vấn đúng scope/kỳ.
- Không đủ lịch sử thì báo thiếu dữ liệu, không dùng tỷ lệ hiện tại dựng lịch sử giả hoặc đánh dấu đủ dữ liệu.
- Số tổng = các thành phần theo định nghĩa, đơn vị đúng, chi tiết truy xuất được; thay đổi fixture phải làm kết quả thay đổi tương ứng.

**F03:**
- Script chỉ chạy trên database `miniapart_demo_*` được xác nhận đúng tên ở cùng connection; marker sở hữu bắt buộc, không fallback số điện thoại/ID.
- Sao lưu trước cập nhật demo, transaction/lock, audit; truy vấn ID kỳ theo tòa/ngày thật, bỏ kỳ 14 hard-code.
- Chạy lại hai lần không tăng số điểm đo/chỉ số/cảnh báo và không sửa dữ liệu ngoài fixture. Có bảo vệ chống tạo cảnh báo trùng ở mức DB phù hợp, xử lý dữ liệu cũ bảo toàn, không xóa tùy tiện để thêm constraint.
- Không thực thi script trên database thật/production. Không coi tên tòa hoặc mã công tơ riêng lẻ là đủ quyền nhận dữ liệu vào fixture.

**F04:**
- Bỏ kỳ 4 và việc âm thầm lấy tòa đầu tiên khi người dùng chọn tất cả.
- Lựa chọn kỳ phải thuộc tòa được phép và đúng nhãn thời gian hiển thị; trả rõ toaNhaId/kyId/ngày trong dữ liệu nguồn.
- Điện/nước, công tơ tổng/phòng/chung có coverage; thiếu một phần cần cho đối soát thì chưa được kết luận khớp. Giá chưa cấu hình không là chi phí 0.
- Tái sử dụng quy tắc thay công tơ; tránh cộng cha/con hai lần; chênh lệch âm có trạng thái cần kiểm tra.
- Ngưỡng có đơn vị/cấu hình thật, không quy đổi bằng giá 2500/15000 tự đặt hoặc khẳng định thất thoát khi chưa có căn cứ.

**F05:**
- Công nợ hiện tại phải khớp tổng tuổi nợ theo cùng phạm vi/thời điểm, độc lập bộ lọc hóa đơn phát hành khi nhãn nói hiện tại.
- Kiểm thử riêng hóa đơn tháng cũ còn nợ trong bộ lọc tháng mới; tách chỉ tiêu cohort nếu cần.
- Cơ cấu phòng có thứ tự phân loại rõ, mỗi phòng chỉ thuộc một nhóm trong cơ cấu; trạng thái phụ không được làm tổng vượt số phòng.
- Kiểm tra dòng tiền thu/hoàn/bút toán đối ứng; không cộng cọc hay đối trừ cọc thành tiền mới thu. Không sửa ledger để làm khớp dashboard.

**F06:**
- Kiểm tra tất cả KPI và link hành động khi chọn tất cả/một tòa, chủ/quản lý. URL hợp lệ và route thực sự được cấp cho actor.
- Bảng nhắc việc dùng scope từ dashboard; không có hai bộ chọn chạy độc lập dưới cùng ngữ cảnh. Back/forward và đổi tòa/kỳ không lẫn dữ liệu.
- Ngày/quick range tính động, có test thời điểm khác tháng 11/2026. Clear hoặc đánh dấu stale dữ liệu khi đổi filter; lỗi tải không được giữ số cũ như thể thuộc filter mới.

**F07:**
- Hoàn thiện luồng ghi/xem công tơ tổng/chung → đánh giá bất thường → tạo/cập nhật cảnh báo → xử lý/audit.
- Tái sử dụng module ghi chỉ số/sự cố/thông báo phù hợp. Không tạo phòng giả hoặc chỉ điều hướng về màn ghi số phòng mà không chọn được công tơ chung.
- Cảnh báo cần ba kỳ hợp lệ trước kỳ mục tiêu, chuẩn hóa số ngày, ngưỡng thật và chống trùng. Sửa/ghi lại chỉ số phải đánh giá lại theo quy tắc rõ, bảo toàn lịch sử xử lý.
- Demo ít nhất một tình huống bình thường, vượt ngưỡng, thiếu chỉ số và chưa đủ dữ liệu; các cảnh báo phải có nguồn đối chiếu, không chỉ INSERT tĩnh.

**F08:**
- Kiểm tra 1440/390px, tất cả tab; mỗi khối đúng giới hạn container, bảng cuộn trong vùng riêng. Kiểm tra bounding box phần tử, không chỉ scrollWidth root.
- Sửa token không tồn tại bằng token hiện có; thấy rõ nhãn kỳ và tab được chọn. Không tiếp tục đổi phong cách toàn app.

### 3. Kiểm chứng để kết thúc đợt sửa

Không chỉ giữ 6 test service fake và báo PASS. Bổ sung integration test bằng PostgreSQL thử nghiệm riêng/disposable, không trỏ test ghi tới database ứng dụng đang dùng demo:

1. Người thuê/quản lý tòa khác không đọc được `/chi-so?kyId=4`; trường hợp đúng quyền thành công.
2. Ghi công tơ tòa A với kỳ tòa B, kỳ khóa, input null/âm/thay công tơ sai bị từ chối và số dòng/dữ liệu giữ nguyên.
3. Repository SQL thực được thực thi; tiêu thụ/công tơ/lịch sử lấy dữ liệu thật, thiếu dữ liệu giữ đúng trạng thái.
4. Công nợ tháng 11 vẫn phản ánh hóa đơn tháng trước còn nợ; tổng tuổi nợ khớp KPI; cơ cấu tòa 12 phòng không thành 13.
5. Hủy/thay thế, hoàn tiền/đối ứng và cọc không làm sai tổng thu/nợ.
6. Tòa A và B có kyId khác nhau; đổi tòa/kỳ đổi đúng dữ liệu điện nước. Thiếu một số đo, thay công tơ và công tơ cha/con được kiểm tra.
7. Ghi số vượt ngưỡng tạo cảnh báo thật; ghi lại/chạy đồng thời không nhân bản; xử lý cảnh báo có audit.
8. Seed từ chối database sai/thiếu marker; chạy hai lần trên fixture đúng không thay số lượng hoặc ghi đè ngoài scope.

Frontend chạy test/build và browser smoke test hai actor với dữ liệu demo:
- KPI “Cần thu hồi nợ” ở lựa chọn tất cả mở danh sách hóa đơn hợp lệ.
- KPI phòng của chủ nhà mở được màn đúng quyền, không nới quyền để cho qua.
- Đổi An Nhiên → Mộc Lan → An Nhiên khi tab vận hành đang mở: scope và dữ liệu mọi khối đi cùng nhau.
- Đổi tháng/kỳ, refresh, back/forward; phản hồi muộn không ghi đè dữ liệu mới.
- Thử toàn bộ tab ở 390px; mở bảng tài chính, công tơ, đối soát, dialog cảnh báo.
- Giữ regression hợp đồng, hóa đơn, thu tiền, QR, public portal đã hoàn thiện.

Chụp desktop/mobile, API status và đối chiếu số liệu với truy vấn nguồn cho các tình huống trên. Chỉ kiểm thử lệnh ghi bằng database thử nghiệm riêng. Không tuyên bố test chạy nếu bị skip/chưa chạy.

### 4. Bàn giao

Báo từng F01–F08: file/dòng sửa, nguyên nhân gốc, test và bằng chứng thực tế; migration và datasource kiểm chứng; mốc Git; các mục chưa xác minh. Khởi động lại backend/frontend đúng bản build và chạy smoke test sau cùng. Không dùng kết quả kiểm tra bản cũ làm bằng chứng cho code mới.

Mục tiêu là đóng đầy đủ các phát hiện trong lần sửa này. Không chỉ vá lỗi hiển thị đầu tiên rồi bàn giao trong khi dữ liệu, scope hoặc quy trình cảnh báo vẫn giả/chưa nối.
