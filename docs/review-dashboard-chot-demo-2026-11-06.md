# Review bản sửa dashboard CHU/QUAN_LY — chốt trước demo

## Kết luận và phạm vi

**CHƯA ĐẠT nghiệm thu.** Có một lỗi SQL có thể làm hỏng cả response dashboard và một luồng ghi công tơ mới không khớp backend/frontend. Sửa các điểm bên dưới trên nhánh main trước khi tích hợp dashboard thợ; không tiếp tục redesign hoặc mở rộng tính năng.

Mốc: HEAD `38b388d794a63bb2e3f7e4d23b7c3e6e9cd0ac0e`, working tree còn staged/unstaged/untracked. Đối chiếu bản dashboard staged được review trước với phần sửa unstaged và file mới hiện tại; không coi HEAD là bản dashboard đầy đủ. Phạm vi là F01–F08 trong `review-dashboard-demo-va-prompt-antigravity-2026-11-06.md` và dependency trực tiếp.

Không sửa source, chạy migration/seed hoặc ghi nghiệp vụ vào database demo trong lượt này. SQL kiểm chứng dùng `BEGIN READ ONLY`; không chạy backend mới lên database đang trình diễn để áp dụng V62.

## Kiểm chứng đã thực sự chạy

- `gradlew.bat --offline compileJava test --tests '*DashboardChuServiceTest' --tests '*DashboardQuanLyServiceTest' --tests '*DoiSoatDienNuocServiceTest' --tests '*DiemDoDungChungServiceTest' --console=plain`: **compile PASS; 14 test PASS, 0 fail/error/skip**, đếm từ XML kết quả (2 + 2 + 2 + 8).
- `npm.cmd run test -- --run src/ChuDashboard.test.tsx src/QuanLyDashboard.test.tsx src/BangViecVanHanh.test.tsx`: **5 test / 3 file PASS**.
- `npm.cmd run build`: **PASS**, có cảnh báo bundle >500 kB.
- Truy vấn PostgreSQL thực tế `SELECT don_gia FROM DICH_VU ...`: **FAIL: column don_gia does not exist**. Đây là truy vấn được production service sử dụng, không phải thiếu dữ liệu fixture.
- Đọc dữ liệu demo: mỗi tòa có kỳ mở hiện tại với **20 dòng chỉ số phòng nhưng chỉ 10 phòng**; xác minh lỗi đếm điểm đo ở R07. Không có nhóm cảnh báo trùng trong dataset đang đọc, nên **chưa tái hiện lỗi nâng V62 do trùng dữ liệu** và không chạy migration thử tại đây.
- **CHƯA chạy browser smoke/ảnh desktop-mobile mới, full frontend suite, integration test mới trên DB riêng, kiểm thử ghi/cạnh tranh hoặc chạy seed hai lần.** Không dùng frontend đang mở hoặc test fake làm bằng chứng các phần đó đã đạt.

## Các lỗi còn tồn tại

Đường dẫn B = `backend/src/main/java/com/prj1/ccm/`; F = `frontend/src/`. Dòng ghi theo working tree khi review.

### R01 — P1: Đối soát dùng cột không tồn tại, có thể làm hỏng toàn dashboard

- `B/dashboard/DoiSoatDienNuocService.java:314–327`: truy vấn `SELECT don_gia FROM DICH_VU ... don_gia > 0`. DICH_VU không có cột này; giá nằm ở bảng giá/giá mua điểm đo. Truy vấn đọc thực đã tái hiện lỗi.
- `DashboardChuService.java:255–256`, `DashboardQuanLyService.java:219–220`: gọi đối soát trong quá trình tạo response dashboard, không cô lập lỗi. Khi đã có số đo tổng/phòng/chung đủ đi đến phép tính ngưỡng, lỗi SQL làm fail toàn response. API đối soát trực tiếp cũng lỗi.
- Ngay cả fallback `2500/15000` ở dòng 327 vẫn là giá tự đặt chưa loại bỏ; không phải cách khắc phục thiếu cấu hình.
- Sửa: dùng nguồn giá/ngưỡng thực đã cấu hình và đúng đơn vị/kỳ; không lấy giá bán dịch vụ tùy ý thay giá mua công tơ. Thiếu giá phải trả trạng thái chưa đủ dữ liệu. Thực thi SQL thật bằng PostgreSQL test, kiểm tra cả hai dashboard có dữ liệu đối soát đầy đủ.

### R02 — P2: Nút Ghi ngay cho công tơ chung đi sai màn; chỉ số đầu tùy chọn lại bị backend từ chối

- `B/dashboard/DashboardQuanLyRepository.java:139–147`: DTO điểm đo chung trả `loaiDiemDo = KHU_VUC_CHUNG`.
- `F/QuanLyDashboard.tsx:540–545`: chỉ mở modal mới nếu giá trị bằng `CHUNG`; giá trị thật rơi sang màn ghi số phòng. Vì vậy chức năng vừa thêm không mở từ danh sách công tơ chung. Test hiện dùng fixture `CHUNG` ở `QuanLyDashboard.test.tsx:221`, không theo payload repository.
- Cùng frontend `:128–135,146–169`: mở modal để trống chỉ số đầu và gửi null nếu bỏ qua; input còn gợi ý kế thừa kỳ trước. `B/dashboard/DiemDoDungChungService.java:69–71` yêu cầu chỉ số đầu không null; không có nhánh kế thừa. Đi qua cảnh báo để mở được modal rồi nhập chỉ số cuối theo gợi ý sẽ bị 400.
- Sửa: thống nhất discriminator/type DTO đầu-cuối; thêm test dùng payload backend thật. Nạp đúng số cuối kỳ trước làm số đầu hoặc yêu cầu nhập bắt buộc với nhãn đúng, không tự điền 0. Kiểm tra Ghi ngay → mở đúng công tơ/kỳ → lưu → refresh.

### R03 — P2: Đối soát còn kết luận khi chưa đủ số đo phòng và cộng chi phí thiếu thành 0

- `B/dashboard/DoiSoatDienNuocService.java:248–267`: SUM các chỉ số đã có, không đếm nguồn số đo phòng còn thiếu. Chỉ cần có một dòng là `tieuThuPhong != null`; các kiểm tra ở `:66–113` chỉ biết thiếu toàn bộ phòng hoặc thiếu điểm đo chung. Có thể kết luận KHOP_DOI_SOAT/THAT_THOAT từ tổng phòng mới có một phần.
- `:51–63`: chi phí khởi tạo 0 rồi bỏ qua chi phí null, khiến toàn bộ điểm chưa có giá thành 0 hoặc tổng một phần không có trạng thái thiếu giá.
- `:223–245,270–302`: cộng công tơ tổng/chung mà không kiểm tra quan hệ cha-con/hệ điểm đo và độ bao phủ đầy đủ. Trường `cong_to_cha_id` có trong schema nhưng chưa được dùng để tránh cộng lặp.
- Sửa: xác định tập công tơ/phòng cần đối soát, đủ số đo/giá và cấu trúc đo. Thiếu nguồn bắt buộc thì giữ null + lý do/coverage; không kết luận khớp hoặc thất thoát. Kiểm thử thiếu một phòng, thiếu một điểm chung, thiếu giá và công tơ cha-con.

### R04 — P2: Chọn tất cả vẫn âm thầm lấy tòa đầu; kỳ đối soát không theo bộ lọc và biểu đồ tự bù dữ liệu thiếu

- `B/dashboard/DashboardChuService.java:186–188`: vẫn lấy `soSanhToaNhaList.get(0)` khi chọn tất cả. `:241–256` chọn kỳ mới nhất bất kể khoảng ngày; DTO đối soát không trả rõ tòa/kỳ để UI đối chiếu. Đổi khoảng tháng trên dashboard không đổi kỳ đang đối soát.
- `DashboardQuanLyService.java:200–220`: chọn tất cả trả kết quả rỗng, chọn tòa dùng kỳ mới nhất; cần thể hiện rõ ngữ cảnh nguồn, không gọi một kết quả là toàn hệ thống.
- `DashboardChuRepository.java:317–319`: thiếu công tơ tổng thì tự dựng tổng bằng phòng + chung; số đo thiếu bị COALESCE thành 0. `DashboardChuService.java:303–315` tiếp tục tạo các điểm 0, không có cờ coverage. Biểu đồ không phân biệt tổng đo thật với tổng tính và tháng chưa có dữ liệu.
- `DashboardChuRepository.java:386–389`: lịch sử lấp đầy chỉ lấy hợp đồng còn HIEU_LUC, nên hợp đồng đã thanh lý biến mất khỏi cả tháng thuê trong quá khứ. Dữ liệu có hợp đồng DA_THANH_LY; không được coi lịch sử này đã chính xác chỉ vì bỏ tỷ lệ hard-code.
- Sửa: giữ tòa/kỳ/ngày làm nguồn nhất quán; chọn tất cả tổng hợp đúng hoặc yêu cầu chọn tòa cho đối soát với nhãn rõ. Thêm trạng thái thiếu dữ liệu và phân biệt số tổng đo/suy ra. Lịch sử lấp đầy phải dựa vào lịch sử thuê có căn cứ; nếu chưa biết mốc thanh lý thực thì thông báo giới hạn, không gán đủ dữ liệu.

### R05 — P2: Cảnh báo không cập nhật khi ghi lại chỉ số, còn race check-then-insert

- `B/dashboard/DiemDoDungChungService.java:145–159`: chỉ gọi tạo khi bất thường; sửa về bình thường không cập nhật/đối soát cảnh báo cũ.
- `CanhBaoTieuThuRepository.java:154–176`: đã có bản ghi thì return, không cập nhật số tiêu thụ/tham chiếu/lý do. Hai request cùng chưa thấy bản ghi đều có thể INSERT; V62 ngăn trùng nhưng request thua sẽ lỗi unique thay vì xử lý idempotent, kéo theo rollback thao tác ghi số.
- `DoiSoatDienNuocService.java:160–178`: chỉ lấy 4 kỳ mới nhất rồi tìm kỳ mục tiêu; đánh giá lại kỳ cũ có thể không có đủ 3 kỳ trước dù DB có lịch sử đó.
- Sửa: lấy ba kỳ hợp lệ trước đúng kỳ mục tiêu; upsert/khóa theo khóa nghiệp vụ, cập nhật bằng chứng khi ghi lại, có quy tắc khi không còn vượt ngưỡng và giữ lịch sử xử lý/audit. Không tự xóa cảnh báo đã xác nhận. Kiểm thử chạy đồng thời và ghi lại từ bất thường → bình thường.

### R06 — P2: Dòng tiền thực thu vẫn bỏ qua đối ứng

- `B/dashboard/DashboardChuRepository.java:95–106` vẫn chỉ SUM `tt.loai='THU'`; cùng vấn đề ở nhánh so sánh tòa (`:503–510`, đọc toàn truy vấn liên quan).
- Khoản thu 1 triệu đã đối ứng trả lại vẫn hiển thị thực thu 1 triệu. Dataset hiện không có DOI_UNG, nên **đây là lỗi có bằng chứng từ đường code, chưa được tái hiện bằng việc thêm giao dịch mới trong demo**.
- Sửa theo nghĩa ledger đã thống nhất: dòng tiền thực loại QUYET_TOAN/cọc, xử lý khoản hoàn/đối ứng theo ngày ghi nhận tương ứng; không cộng lại cọc hoặc sửa ledger để dashboard khớp. Thêm fixture thu + đối ứng trên DB test riêng.

### R07 — P2: Tổng số công tơ đã ghi vẫn sai đơn vị và scope

- `B/dashboard/DashboardQuanLyRepository.java:156–167`: chỉ đếm trên `kyIdDau`; room readings đếm `COUNT(DISTINCT phong_id)` trong khi danh sách chưa ghi là từng phòng–dịch vụ (`:66–82`).
- Trong DB demo đọc thực: mỗi kỳ mở có 10 phòng đã ghi, nhưng **20 dòng công tơ phòng** (điện/nước). Repository báo phần đã ghi là 10; chọn tất cả còn chỉ tính đã ghi của một tòa trong khi chưa ghi gộp nhiều tòa.
- Sửa: đếm cùng một tập điểm đo phòng–dịch vụ và công tơ chung, cùng các kỳ mở thuộc tòa trong scope; tổng = đã ghi + chưa ghi. Test ít nhất hai tòa có kyId khác nhau và một phòng có cả điện/nước.

### R08 — P2: Seed bổ sung chưa bảo vệ đúng database và sở hữu fixture

- `scripts/enrich-presentation-demo-utility-meters.sql:31–43`: chỉ kiểm tra LIKE prefix và một marker toàn dataset, không yêu cầu tên database chính xác của connection như guard script tiện ích.
- `:45–54,75–87` và các INSERT tiếp theo: tìm tòa theo mã rồi ON CONFLICT cập nhật tên công tơ, không chứng minh hàng xung đột thuộc batch fixture trước khi ghi đè. Prefix/marker không đủ để cho phép sửa mọi hàng trùng mã.
- Đã bỏ fallback actor và kỳ 14, có advisory lock/NOT EXISTS, đó là tiến bộ. Nhưng chưa chạy hai lần để chứng minh idempotency và không có test nâng V62 với dữ liệu cảnh báo trùng cũ. Dataset hiện không trùng không chứng minh database khác cũng vậy.
- Sửa: yêu cầu exact expected database + marker/ID thuộc fixture, chặn xung đột ngoài batch, transaction/lock và đối soát trước/sau. V62 không xóa dữ liệu để ép unique; xử lý lịch sử trùng theo quy trình bảo toàn/có chẩn đoán. **Không chạy script lại trên DB demo đang trình diễn để làm đẹp dashboard trước khi có guard/test.**

## Đối chiếu F01–F08 trước đó

| Mục | Kết quả hiện tại |
| --- | --- |
| F01 phân quyền/toàn vẹn | **Đã sửa phần chính từ code:** GET kiểm tra role + tòa kỳ; POST kiểm tra phòng đo–kỳ cùng tòa/kỳ khóa/input/thay công tơ; có audit. 8 unit test mới PASS, chưa có HTTP/SQL integration mới chứng minh toàn bộ |
| F02 số thật | **Một phần:** bỏ nhiều hằng số nhưng còn đếm sai scope/đơn vị, lịch sử thuê loại hợp đồng thanh lý và mất trạng thái thiếu dữ liệu |
| F03 script/migration | **Một phần:** marker/lock/NOT EXISTS tốt hơn; chưa đủ guard/ownership và nâng cấp lịch sử, xem R08 |
| F04 đối soát | **FAIL:** lỗi SQL R01, coverage/giá R03 và tòa/kỳ R04 |
| F05 KPI/cơ cấu | KPI công nợ đã lấy tổng tuổi nợ (`DashboardChuService:193–207`); cơ cấu dùng CASE loại trừ nhau. **Chưa hoàn tất dòng tiền**, xem R06; chưa kiểm chứng đầy đủ kết quả SQL qua API |
| F06 điều hướng/scope | URLSearchParams, ngày động, xóa dashboard cũ và truyền prop scope đã thêm. **Chưa hoàn tất ngữ cảnh:** chọn tất cả còn fallback tòa đầu; bảng việc embedded null vẫn cho chọn tòa riêng (`BangViecVanHanh:25–42,78`); chưa có smoke Back/Forward mới |
| F07 ghi số/cảnh báo | **FAIL:** đã nối service nhưng luồng Ghi ngay lệch discriminator, chỉ số đầu và lifecycle cảnh báo, xem R02/R05 |
| F08 responsive | Đã đổi một số grid sang minmax/minWidth và token có thật; **CHƯA ĐỦ BẰNG CHỨNG browser 1440/390px**. Build/test không chứng minh không clip |

## PROMPT COPY CHO ANTIGRAVITY MAIN

Bạn đang sửa dashboard CHU/QUAN_LY tại `D:\vscode\miniapart\MiniApart-main`. Đọc tài liệu này và xử lý R01–R08 trong phạm vi hiện có. Cần chốt trước buổi báo cáo 13:00 ngày 06/11/2026 và còn thời gian tích hợp nhánh thợ; không tiếp tục redesign, thêm card/chart hoặc tạo module mới.

Thực hiện theo thứ tự:

1. **Chặn lỗi demo:** sửa SQL cột không tồn tại (R01), discriminator/input modal ghi công tơ (R02). Thực thi truy vấn repository và test API/DTO thật trên database kiểm thử riêng, không chỉ fake trả kết quả.
2. **Sửa nguồn số liệu/lifecycle:** coverage/giá, tòa–kỳ và trạng thái thiếu dữ liệu (R03/R04), cảnh báo upsert/ghi lại (R05), counter-entry thực thu và số công tơ (R06/R07). Không bù 0/số giả hoặc nới quyền để làm demo chạy.
3. **Bảo toàn dữ liệu:** sửa guard script và xử lý migration có kiểm chứng (R08). Không chạy enrichment/migration vào database đang demo; không xóa dữ liệu thật hoặc repair history.
4. Thay các fixture test đang khác DTO backend; test `DoiSoatDienNuocServiceTest` hiện override chính phương thức cần kiểm chứng, nên thêm test gọi implementation thật với PostgreSQL riêng. Giữ các test phân quyền đã có.
5. Chạy compile/backend tests liên quan, frontend test/build. Smoke CHU và QUAN_LY 1440px/390px: chọn một/tất cả tòa, tháng/kỳ, đổi A→B→A, KPI drill-down, Ghi ngay công tơ chung, ghi lại chỉ số và xử lý cảnh báo. Ghi rõ nguồn dữ liệu, ảnh và phần chưa kiểm chứng; không chỉ gửi số test PASS.
6. Commit phần sửa hoàn chỉnh của main sau khi kiểm tra staged/unstaged; không commit nhầm secrets/build outputs. Bàn giao mốc commit, lệnh đã chạy, kết quả theo R01–R08 và hướng dẫn khởi động đúng runtime/database.

**Tích hợp thợ:** Không sửa `MiniApart-worker-dashboard`. Sau khi main ổn định, người tích hợp chỉ lấy commit triển khai thợ, không lấy snapshot nền `6c00588` hoặc setup bàn giao `553e974`. Kiểm tra xung đột `App.tsx`, `api.ts`, `roleNavigation.ts` và số migration trước; giữ cả route/quyền CHU/QUAN_LY/THO rồi test/build/smoke lại. Không merge toàn bộ snapshot để chạy kịp giờ rồi bỏ qua xung đột dữ liệu.

Nếu không kịp một phần có dữ liệu chưa đủ tin cậy, báo rõ chưa nghiệm thu và thể hiện trạng thái chưa đủ dữ liệu thật; không che lỗi bằng số 0, số giả hoặc tuyên bố hoàn tất.
