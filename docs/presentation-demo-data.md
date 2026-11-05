# Bộ dữ liệu báo cáo MiniApart

## Phạm vi và tích hợp

- Worktree: `D:\vscode\miniapart\MiniApart-demo-data`, branch `codex/demo-data`, nền `b88ab28`.
- Backend hiện tại từ worktree chính đã được **sao chép chỉ để biên dịch/kiểm chứng**, gồm V58–V60 và các sửa hợp đồng chưa commit. Chúng không phải thay đổi của tác vụ seed.
- Chỉ tích hợp các file mới của tác vụ này sau khi Antigravity lưu/commit backend V60 và giao diện. Không merge toàn bộ thư mục bằng copy đè.
- Không sửa frontend, API, migration, Flyway history hoặc service nghiệp vụ hiện có. Có một sửa repository tối thiểu, trình bày bên dưới. Không cài dependency.
- Seeder dùng package `billing` vì repository tạo hóa đơn hiện có là package-private. Adapter nhỏ trong `suachua` dùng command tạo yêu cầu package-private; không mở rộng API.
- Những file mới không trùng file Antigravity đang chỉnh; phụ thuộc backend hiện tại, không thể chạy riêng trên clean checkout `b88ab28` thiếu V60.
- `NguoiOCungRepository.countApprovedOccupantsInInterval`: bổ sung điều kiện loại người đứng tên khỏi số người ở cùng, vì service đã cộng người đứng tên riêng. Đây là thay đổi duy nhất trên file hiện có; cần áp dụng đúng hunk, không copy đè file repository. Không thay API/schema. Test kiểm chứng số người trong phòng vẫn gồm người đứng tên nhưng capacity không đếm hai lần.

Commit `dacdc0a` chỉ là snapshot backend nền để làm việc cô lập. **Không cherry-pick/merge commit này vào công việc Antigravity.** Commit tiếp theo (HEAD của `codex/demo-data` khi bàn giao) mới là phần seed cần tích hợp. Sau khi Antigravity đã lưu/commit backend V60 và UI, đối chiếu working tree sạch rồi chỉ cherry-pick commit seed đó; xử lý hunk repository nếu cần, chạy lại test và smoke test giao diện. Không tự động tích hợp khi agent kia còn đang sửa.

## Dữ liệu và tên hiển thị

Sáu tòa nhà mới: **An Nhiên Residence, Nhà Xanh Cầu Giấy, Mộc Lan Home, Phố Nhỏ Studio, Bình Minh Riverside, Vườn Nắng Apartment**.

Tên người dùng tự nhiên như Nguyễn Hoàng Phúc, Trần Ngọc Mai, Vũ Thu Hà, Lê Quốc Huy. Không đặt tên người/tòa nhà theo A/B/C. Mã kỹ thuật `DEMO-P1`…`DEMO-P6` là khóa nhận diện ổn định, không thay tên hiển thị.

Mọi người, số điện thoại, địa chỉ và giấy tờ đều là giả lập. Giấy tờ dùng mã `DEMO-PERSON-*`, email dùng `example.invalid`. Tài khoản ngân hàng là số giả để đáp ứng schema; **không thực hiện chuyển khoản thật hoặc dùng QR demo để chuyển tiền**. Không gửi SMS/email tới số demo.

Số liệu sau kiểm chứng ngày 2026-11-05:

| Nhóm | Số lượng |
|---|---:|
| Tòa nhà mới / tổng gồm baseline Flyway | 6 / 8 |
| Phòng | 72 |
| Người dùng tổng gồm 5 tài khoản baseline | 70 |
| Hồ sơ người thuê | 96 |
| Hợp đồng / hồ sơ hợp đồng | 66 / 66 |
| Dịch vụ theo tòa nhà | 60 (10 loại × 6 tòa) |
| Hóa đơn | 246 |
| Thanh toán / bút toán quyết toán | 270 |
| Tài sản | 216 |
| Biên bản nhận/trả | 48 |
| Yêu cầu sửa chữa | 30 |
| Lịch xem phòng | 30 |
| Thiết bị / báo cáo kiểm tra PCCC | 24 / 6 |

Hai tòa nhà và năm tài khoản baseline do migration V2 tạo ra được giữ nguyên, không xóa hoặc đổi tên. Chủ demo mới được phân quyền riêng, không phải sử dụng tài khoản baseline để trình diễn.

## Cơ chế an toàn

Seeder chỉ có bean khi đồng thời:

1. Profile `presentation-demo` hoạt động.
2. `app.presentation-demo.enabled=true`.
3. Tên database thực tế từ `current_database()` khớp chính xác `app.presentation-demo.expected-database` và mẫu `miniapart_demo_[a-z0-9_]+`.
4. Không có profile `prod`/`production`, `app.seed-demo=false`.
5. Có mật khẩu demo khai báo tường minh dài 12–128 ký tự.

Lần đầu chỉ chấp nhận database vừa migrate, chưa có dữ liệu nghiệp vụ. Không nhận nuôi, ghi đè hoặc xóa dữ liệu demo/khách hàng cũ. Dùng advisory transaction lock để tránh hai seed chạy cùng lúc.

Toàn bộ seed ở một transaction Spring thật. Không gọi đường bulk có `REQUIRES_NEW`: hóa đơn đi qua repository/calc hiện có trong cùng giao dịch, rồi service phát hành và thanh toán. Tiền cọc, biên bản, thanh lý, bảo trì, PCCC và lịch hẹn đi qua service phù hợp quyền.

Cuối giao dịch ghi marker audit append-only `PRESENTATION_DEMO_V1` cùng ngày tham chiếu. Chạy lại cùng ngày chỉ kiểm chứng, không viết lại dữ liệu. Ngày tham chiếu khác bị từ chối; muốn bộ dữ liệu ngày mới thì tạo database demo mới, không reset bộ cũ.

`app.presentation-demo.reference-date` mặc định theo Clock của hệ thống (Asia/Ho_Chi_Minh). Để demo hiện tại dùng ngày hôm nay; đổi ngày cần chạy lại kiểm chứng vì các service vận hành vẫn dùng Clock thực, nhất là thanh lý, lịch hẹn và trạng thái quá hạn.

## Tạo database demo mới và chạy backend riêng

Script `scripts/new-presentation-demo.ps1` chỉ kết nối PostgreSQL localhost:5432 và chỉ CREATE database mới. Nếu tên đã tồn tại thì dừng trước khi khởi động Flyway. Không DROP/TRUNCATE/repair/cleanup.

Trong PowerShell, khai báo `PGPASSWORD` bằng mật khẩu PostgreSQL local của bạn và `APP_PRESENTATION_DEMO_PASSWORD` bằng mật khẩu chỉ dùng cho demo. Không lưu chúng vào file được commit. Sau đó:

```powershell
Set-Location D:\vscode\miniapart\MiniApart-demo-data
.\scripts\new-presentation-demo.ps1 `
  -DatabaseName miniapart_demo_baocao_20261106 `
  -PsqlPath D:\vscode\miniapart\pgsql\pgsql\bin\psql.exe
```

Backend demo dùng cổng **8082**, không dừng hoặc đổi datasource backend 8080 đang chạy. Frontend hiện tại không bị sửa. Chỉ sau tích hợp giao diện, chạy frontend với `VITE_BACKEND_URL=http://localhost:8082` cho phiên demo đó.

Script khôi phục các biến môi trường mà nó thay khi kết thúc. Database mới được giữ lại kể cả seed lỗi để kiểm tra; không tự xóa.

## Tài khoản trình diễn

Tất cả tài khoản mới dùng mật khẩu bạn truyền vào `APP_PRESENTATION_DEMO_PASSWORD`.

| Vai trò | Tên / điện thoại |
|---|---|
| Admin | Phạm Minh Quân — `0999000001` |
| Chủ 1 | Nguyễn Hoàng Phúc — `0999000011` (tòa 1,3,5) |
| Chủ 2 | Trần Ngọc Mai — `0999000012` (tòa 2,4,6) |
| Quản lý An Nhiên | Vũ Thu Hà — `0999000020` |
| Quản lý các tòa còn lại | `0999000021` … `0999000025` |
| Thợ | Lê Quốc Huy — `0999000031`; Đặng Văn Thành — `0999000032` |
| Người đứng tên phòng 101 An Nhiên | `0999100001` |

54 tài khoản người thuê liên kết đúng người đứng tên hợp đồng đang hiệu lực. Người ở cùng có hồ sơ riêng; không tạo tài khoản có quyền xem hợp đồng trái với phạm vi backend hiện tại.

## Kịch bản báo cáo (mỗi tòa dùng cùng quy ước số phòng)

1. **101**: hợp đồng đang thuê, tài sản, biên bản nhận và lịch sử hóa đơn; chọn hóa đơn đã thu đủ để xem thanh toán/biên lai.
2. **303**: hợp đồng còn 12 ngày tính từ ngày tham chiếu, phù hợp minh họa sắp hết hạn.
3. Danh sách hóa đơn: có thu đủ, thu hai lần, thu một phần, chưa thu và nợ quá hạn. Mã hóa đơn bắt đầu bằng `DEMO-P*`.
4. **402**: đã nhận/trả, biên bản hỏng bản lề tủ 200.000đ có căn cứ, hợp đồng đã thanh lý và hoàn cọc sau đối trừ. Phòng trở lại trống.
5. **402** cũng xuất hiện ở tìm phòng công khai và có lịch xem tương lai; đặt thêm lịch bằng thao tác trình diễn nếu cần.
6. **403**: ngừng cho thuê và có sự cố khẩn cấp đang mở, trạng thái phòng được service tính thành đang sửa.
7. Mỗi tòa có thiết bị PCCC đến hạn và kết quả kiểm tra, cùng lịch kiểm tra gần ngày tham chiếu.
8. **Vườn Nắng Apartment**: điện bậc thang ba bậc và hóa đơn có chi tiết từng bậc. Các tòa khác điện một giá. Internet 0đ là miễn phí được khai báo, không phải thiếu giá.
9. **401**: hợp đồng nháp, bắt đầu tuần tới, dùng để minh họa hoàn thiện thông tin trước chốt/ký.

Không dùng dữ liệu ở trên như hồ sơ pháp lý thực. Hợp đồng có chú thích mô phỏng; không giả file scan chữ ký.

## Kiểm chứng

```powershell
Set-Location D:\vscode\miniapart\MiniApart-demo-data\backend
# Các biến MINIAPART_TEST_* chỉ tới PostgreSQL quản trị local để CREATE DB mới.
$env:MINIAPART_TEST_JDBC_URL = 'jdbc:postgresql://localhost:5432/postgres'
$env:MINIAPART_TEST_USERNAME = 'miniapart'
# Đặt MINIAPART_TEST_PASSWORD theo cấu hình local, không commit mật khẩu.
.\gradlew.bat --offline test --tests '*PresentationDemo*Test'
```

Integration test tạo các database `miniapart_demo_verify_*` và `miniapart_demo_rollback_*` mới. Không chạy seed vào URL quản trị hoặc database ứng dụng; không drop database kiểm chứng. Khi không cấu hình MINIAPART_TEST_JDBC_URL, integration suite được SKIP rõ ràng, không báo PASS.

Test dùng mật khẩu fixture công khai `DemoOnly2026!` CHỈ trong database verify tự tạo. Không dùng mật khẩu này cho triển khai thật.

Bằng chứng được sinh vào `backend/build/presentation-demo-verification.txt` và `backend/build/presentation-demo-contract.pdf` (không commit build output).

Kết quả chạy độc lập cuối cùng: **57 PASS, 0 FAIL, 0 ERROR, 0 SKIP**:
- PresentationDemoSafetyTest: 6.
- PresentationDemoSeederIntegrationTest: 5 (bao gồm đăng nhập năm vai trò và kiểm tra API trong/ngoài phạm vi tòa nhà bằng MockMvc).
- HopDongHoSoServiceTest: 31.
- HopDongPdfServiceTest: 15.
- PowerShell parser cho script: PASS; script chưa được chạy như một phiên server tương tác hoàn chỉnh.

Database kiểm chứng thành công đang được giữ lại:
`miniapart_demo_verify_b74346ccddfa4241abd4b9bffd90ec52` trên localhost:5432.
Đây là dữ liệu fixture có mật khẩu `DemoOnly2026!`, không phải cấu hình production.
Nếu tận dụng database này sau khi tích hợp UI, cấu hình backend demo riêng tới nó với **app.presentation-demo.enabled=false** và **app.seed-demo=false**; không seed lại theo ngày mới. Chọn cổng 8082 để không đụng backend đang chạy. Ưu tiên tạo database báo cáo mới bằng script với mật khẩu riêng khi có thời gian.

Đã kiểm tra: migration sạch; lượng bản ghi; ledger khớp da_thu; tổng chi tiết khớp hóa đơn; không chồng hợp đồng; chỉ số tăng; tài sản/biên bản đúng phòng; thanh lý/hoàn cọc; hóa đơn bậc thang; phân quyền tòa; password hash; xuất PDF; idempotency; transaction rollback khi trigger cố tình gây lỗi ở bước lịch hẹn; guard profile/database/password/non-empty.

## Giới hạn

- Không có ảnh phòng thật: PHONG.anh_dai_dien cho phép URL nhưng chưa có luồng upload phòng tương đương ảnh hồ sơ người thuê. Giữ NULL; không bịa URL, tải ảnh hoặc sửa frontend.
- Không tạo ảnh chứng cứ giả cho công tơ/bàn giao. Tòa demo dùng chính sách ảnh công tơ không bắt buộc hiện có.
- Không tạo hồ sơ PCCC đính kèm giả; có thiết bị và biên bản kiểm tra cấu trúc thật.
- Không seed các tình huống hủy/thay thế hóa đơn vì đợt này ưu tiên luồng cơ bản và không thêm bút toán phức tạp không cần trình diễn.
- Chưa kiểm thử bằng trình duyệt với giao diện Antigravity mới. Sau tích hợp phải smoke test bằng tài khoản demo và datasource riêng.
- Ngày/thời điểm audit và mã biên lai tuân Clock/database thực tế, không cam kết tái tạo byte-identical giữa hai lần tạo database.
- Module nhân khẩu hiện tại đếm các dòng cư trú: dùng cùng hồ sơ người đứng tên với vai trò NGUOI_DUNG_TEN, không tạo người giả trùng. Dòng này tạo sau snapshot vì PDF đã tự hiển thị người đứng tên. Truy vấn capacity loại người đứng tên khỏi phần đếm co-occupants để không cộng hai lần.
