# Danh sách cần sửa và chưa hoàn thiện — MiniApart

Ngày rà soát: 04/11/2026, múi giờ Asia/Bangkok.

Phạm vi: mã frontend, backend, migration, Docker/CI, script chạy local và tài liệu yêu cầu/kế hoạch trong bản project này. Đây là danh sách công việc, chưa sửa mã ứng dụng. Một số tệp đang được cập nhật trong lúc rà soát; các phát hiện dưới đây đã được đối chiếu lại trước khi ghi nhận.

Ưu tiên: **P0** xử lý ngay; **P1** làm trước khi nghiệm thu luồng chính hoặc đưa lên Internet; **P2** hoàn thiện chức năng, độ tin cậy và bàn giao; **P3** dọn tài liệu/nợ kỹ thuật. Mức ưu tiên này dùng cho thứ tự xử lý, khác với phân loại Must/Should/Could của tài liệu yêu cầu.

Đường dẫn trong tài liệu tính từ thư mục `MiniApart-main`; các số sau dấu `:` là dòng mã tại thời điểm rà soát.

## Các lỗi và cấu hình cần sửa

| Mã | Ưu tiên | Vấn đề và ảnh hưởng | Bằng chứng / hướng hoàn thành |
|---|---|---|---|
| FIX-01 | P0 | **API quản trị lịch hẹn đang công khai.** Người chưa đăng nhập có thể đọc họ tên, điện thoại, email, ghi chú khách và đổi trạng thái lịch hẹn. Truyền `toaNhaId` chỉ là lọc dữ liệu, không phải kiểm quyền. | `backend/src/main/java/com/prj1/ccm/auth/AuthWebConfig.java:23` bỏ xác thực `/api/public/**`; `publicportal/PublicPortalController.java` đặt GET `/lich-hen` và PATCH `/lich-hen/{id}/trang-thai` trong vùng này; `PublicPortalRepository.java:242` trả danh sách không giới hạn toà khi thiếu bộ lọc. Tách API quản trị, xác thực, kiểm vai trò và phạm vi toà; thêm kiểm thử gọi trực tiếp không token/sai vai trò/sai toà. |
| FIX-02 | P1 | **Frontend không build được.** Nhiều nút dùng `variant="strong"` hoặc `"outline"`, trong khi component không hỗ trợ hai giá trị này. | `frontend/src/design/core/Button.tsx:10`, `frontend/src/DanhMucPhong.tsx:446`, `frontend/src/KhamPhaPhong.tsx:210`, `frontend/src/QuanLyLichHen.tsx:99`. Hai lần build đều báo 16 lỗi TS2322. Chuẩn hoá cách gọi theo giao diện Button và chạy lại build. |
| FIX-03 | P1 | **Java của backend lệch Docker và CI.** Gradle yêu cầu Java 24, CI và Docker dùng 21. Môi trường build hiện không đồng nhất; JRE 21 không chạy được bytecode mặc định của Java 24. | `backend/build.gradle:12`, `backend/Dockerfile:1`, `backend/Dockerfile:12`, `.github/workflows/ci.yml:24`. Chọn một phiên bản thống nhất cho toolchain, CI, image build và runtime; xác minh Docker build/start. Chưa chạy Docker tại máy rà soát. |
| FIX-04 | P1 | **Compose chưa truyền khoá JWT riêng.** Với cấu hình Compose hiện có, backend dùng khoá ký mặc định công khai trong mã nguồn. | `docker-compose.yml:20` chỉ truyền ba biến datasource; `backend/src/main/resources/application.yml:16` có fallback JWT. Thêm biến secret cho container và kiểm tra cấu hình production; chỉ export biến trên host chưa đủ nếu Compose không chuyển vào container. |
| FIX-05 | P1 | **Ảnh tải lên chưa có lưu trữ bền vững khi dùng Compose.** Dữ liệu ảnh ghi vào filesystem của container, có thể mất khi container được tạo lại dù bản ghi DB vẫn còn. | `backend/src/main/java/com/prj1/ccm/nguoithue/AnhDinhKemService.java:67` mặc định lưu `/var/lib/miniapart/private-attachments`, ghi tệp tại `:220`; `docker-compose.yml` chỉ có volume PostgreSQL. Gắn volume/kho lưu trữ riêng và đưa ảnh vào phương án sao lưu/phục hồi. |
| FIX-06 | P1 | **Tạo tài khoản mới thiếu cấu hình gửi mã kích hoạt.** Cấu hình repo hiện tại trả 503; lỗi gửi mã nằm trong transaction tạo tài khoản nên tài khoản mới bị rollback. | `backend/src/main/java/com/prj1/ccm/auth/KichHoatTaiKhoanDeliveryConfiguration.java:36`, `nguoidung/QuanLyNguoiDungService.java:63`, `:93`. Cấu hình kênh HTTP thực tế hoặc kênh thử nghiệm dành riêng cho local và tài liệu cách chạy. |
| FIX-07 | P1 | **Frontend/backend không thống nhất dữ liệu phòng công khai.** Giá có thể hiện 0 đồng, lọc giá sai và mất bảng phí dịch vụ. | `frontend/src/api.ts:1474` dùng `giaThueMacDinh`, `:1480` dùng `danhSachDichVu`; `backend/src/main/java/com/prj1/ccm/publicportal/PublicPhongDto.java:16` trả `giaThue`, `:23` trả `bangGiaDichVu`. Trường dịch vụ cũng lệch `tenDichVu/loaiThu/donViTinh` với `ten/cachTinh/donVi`. `fetchPublicPhong` trả JSON trực tiếp. Thống nhất DTO hoặc thêm adapter; kiểm thử bằng payload thật của backend. |
| FIX-08 | P2 | **Bỏ chọn “chỉ phòng trống” vẫn không tải các phòng khác.** UI chỉ lọc trên dữ liệu đã tải với mặc định chỉ phòng trống của backend. | `frontend/src/KhamPhaPhong.tsx:76` gọi `fetchPublicPhong()` một lần; `frontend/src/api.ts:1532` không nhận `chiPhongTrong`; `PublicPortalController.java` mặc định tham số này là `true`. Đồng bộ bộ lọc với API hoặc tải đủ dữ liệu được phép hiển thị. |
| FIX-09 | P2 | **Đặt lịch chưa kiểm tra phòng thuộc đúng toà.** Hai ID có thể hợp lệ độc lập nhưng không thuộc cùng một toà. | `backend/src/main/java/com/prj1/ccm/publicportal/PublicPortalService.java:40`, `PublicPortalRepository.java:211`, migration `V49__public_lead_and_viewing_appointments.sql:13`. Xác minh quan hệ phòng–toà tại backend, từ chối dữ liệu không khớp. |
| FIX-10 | P2 | **Phát hành riêng và hàng loạt không cùng quy tắc.** Luồng phát hành một hoá đơn không tạo thông báo cho người thuê và không có bước chặn tổng 0 như luồng hàng loạt. | `backend/src/main/java/com/prj1/ccm/billing/PhatHanhHoaDonService.java:54` chỉ đổi trạng thái; nhánh hàng loạt có kiểm tổng và gọi tạo thông báo tại `:105`. Dùng chung quy tắc phát hành và kiểm thử cả hai đường. |
| FIX-11 | P2 | **Tìm kiếm người thuê trả thêm hồ sơ không khớp.** Điều kiện tìm kiếm chỉ áp dụng cho một nhánh `OR`; hồ sơ chưa có hợp đồng vẫn xuất hiện dù không khớp tên/điện thoại. | `backend/src/main/java/com/prj1/ccm/nguoithue/NguoiThueRepository.java:28` nối `AND` vào điều kiện `WHERE NOT EXISTS(...) OR EXISTS(...)` tại `:168`. Bao ngoặc toàn bộ điều kiện phạm vi trước khi nối tìm kiếm. |
| FIX-12 | P2 | **Thanh đầu hiển thị kỳ/trạng thái viết cứng.** Giao diện vẫn hiện “Kỳ 09/2026”, có vai trò luôn hiện “Đang mở”, không theo kỳ đang chọn. | `frontend/src/App.tsx:1015`. Lấy kỳ và trạng thái từ dữ liệu thực; không hiển thị giá trị mẫu như trạng thái vận hành. |
| FIX-13 | P2 | **Script dừng local có thể tắt ứng dụng khác trên máy.** Script dừng mọi tiến trình Node, Java và PostgreSQL, không giới hạn các tiến trình của MiniApart. | `../stop-all.ps1:6` đến các lệnh `Stop-Process` tiếp theo. Theo dõi PID/đường dẫn/cổng của tiến trình do project khởi động và chỉ dừng đúng phạm vi đó. |

## Các luồng đã có backend nhưng frontend còn thiếu

| Mã | Ưu tiên | Phần còn phải làm | Bằng chứng |
|---|---|---|---|
| UI-01 | P1 | **Quản lý vòng đời hoá đơn:** tạo hàng loạt, xem/sửa nháp, phát hành, huỷ/thay thế. | `frontend/src/HoaDonQuanLy.tsx:64` chỉ tải danh sách; `frontend/src/HoaDon.tsx:103` chỉ có xem lịch sử/in A4. Backend đã có các service tạo, phát hành, huỷ. |
| UI-02 | P1 | **Thu tiền, đối ứng, cọc và quyết toán:** màn ghi nhận thanh toán, sửa sai bằng đối ứng, thu/hoàn cọc, thanh lý; nối QR và biên lai PDF. | Menu `/thu-tien` có trong `frontend/src/roleNavigation.ts:46`, nhưng `frontend/src/App.tsx:739` không render màn tương ứng. API `ThanhToanController`, `GiaoDichCocController`, PDF và QR đã có ở backend. |
| UI-03 | P1 | **Hồ sơ người thuê và thao tác hợp đồng:** thêm/sửa hồ sơ, giấy tờ, người ở cùng, tạo/kích hoạt/gia hạn/thanh lý hợp đồng. | `frontend/src/HopDongQuanLy.tsx:80` hiện chỉ là danh sách/bộ lọc. Backend đã có module `nguoithue` và `hopdong`. Cần luồng đầy đủ từ phòng trống đến hợp đồng hoạt động qua giao diện. |
| UI-04 | P1 | **Quản lý dịch vụ, bảng giá và kỳ thanh toán:** form cấu hình dịch vụ, giá theo ngày, bậc thang và mở kỳ. | `frontend/src/api.ts:852` chỉ tải kỳ; chưa có màn cấu hình các danh mục này trong nhánh render `App.tsx:739`. Hiện có thao tác chốt kỳ trong màn ghi chỉ số, nhưng chưa đủ luồng thiết lập ban đầu. |
| UI-05 | P1 | **Báo hỏng và tiếp nhận/phân công sự cố:** nối form gửi yêu cầu/ảnh của người thuê, tiếp nhận và phân công của quản lý. | `/bao-hong` có trong `frontend/src/roleNavigation.ts:61` nhưng chưa có màn render. `/su-co` hiện dẫn tới `LichSuSuaChua`; màn thợ `ViecCuaToi` đã có. Không nên coi toàn bộ module sửa chữa là chưa làm. |
| UI-06 | P1 | **Kích hoạt tài khoản:** màn nhập mã và đặt mật khẩu lần đầu. | Backend có `/api/auth/kich-hoat`; frontend chưa có màn hoặc lời gọi tương ứng. Cần hoàn thiện cùng FIX-06 để người dùng mới đăng nhập được. |
| UI-07 | P2 | **Sửa chỉ số kỳ đã chốt dành cho Chủ**, kèm lý do và nhật ký theo FR-MTR-10. | `backend/src/main/java/com/prj1/ccm/toanha/ChiSoDichVuService.java:260` đã có nhánh riêng; `frontend/src/GhiChiSo.tsx:328` và các input/nút khoá kỳ không có luồng ngoại lệ cho Chủ, `App.tsx:745` không truyền vai trò. |

Các route `/thu-tien`, `/bao-hong`, `/an-toan`, `/nhat-ky-thao-tac` đã có menu nhưng rơi về thông điệp “sẽ tiếp tục được hoàn thiện” tại `frontend/src/roleNavigation.ts:90` và `App.tsx:802`.

## Các chức năng chưa triển khai hoặc mới làm một phần

| Mã | Ưu tiên | Chức năng | Bằng chứng và tiêu chí còn thiếu |
|---|---|---|---|
| NEW-01 | P1 | **Quên/đặt lại mật khẩu bằng OTP 5 phút — FR-AUT-03 [M].** | `Doc/PRJ1_Phan-tich-yeu-cau_Chung-cu-mini.md:1086`; `backend/src/main/java/com/prj1/ccm/auth/AuthController.java` chỉ có login/kích hoạt/me. Chưa có API, quản lý OTP, giới hạn thử lại và UI reset. Kích hoạt tài khoản là luồng khác. |
| NEW-02 | P1 | **Lịch chạy tự động nhắc tiền — FR-NTF-04/05.** | `backend/src/main/java/com/prj1/ccm/thongbao/NhacTienService.java:55` đã có xử lý mốc, nhưng chưa có caller production, `@Scheduled` hay cơ chế job khác trong mã chính. Cần gắn lịch chạy và chứng minh nhắc thực tế đúng mốc, không gửi trùng, dừng khi đã trả đủ. |
| NEW-03 | P2 | **An toàn PCCC — FR-SEC-01/02/03.** | `backend/src/main/java/com/prj1/ccm/thongbao/BangViecVanHanhService.java:82` vẫn trả “Chưa triển khai nguồn kiểm tra PCCC”. Thiếu hồ sơ phân loại, thiết bị/hạn kiểm định, checklist và nhắc kiểm tra. Bảng nhắc việc hiện có 4 nhóm hoạt động và nhóm PCCC chưa sẵn sàng. |
| NEW-04 | P2 | **Quản lý/xuất danh sách cư trú — FR-TNT-11.** | `backend/src/main/resources/db/migration/V9__tenant_profiles.sql:8` đã có cột trạng thái lưu trú nhưng request/update hồ sơ chưa nhận/cập nhật trạng thái này. Chưa có luồng xuất danh sách và nhắc cư trú. |
| NEW-05 | P1/P2 | **Nhật ký thao tác đầy đủ, tra cứu và bất biến — FR-SEC-05/06/07.** | Đã ghi log nhiều nghiệp vụ nhưng `QuanLyNguoiDungService.java:119` đổi quyền và luồng đổi bảng giá chưa ghi đủ giá trị trước/sau. `nguoithue/NhatKyThaoTacRepository.java` chưa có API tra cứu. Migration chưa có quyền/trigger chống sửa/xoá; Compose dùng user ứng dụng trùng `POSTGRES_USER`. Cần hoàn thiện bảo vệ DB [P1] và màn lọc/xem [P2]. |
| NEW-06 | P2 | **Sinh hợp đồng PDF — FR-TNT-06.** | Yêu cầu `Doc/PRJ1_Phan-tich-yeu-cau_Chung-cu-mini.md:1115`; `backend/src/main/java/com/prj1/ccm/hopdong/HopDongController.java` chưa có endpoint xuất hợp đồng. PDF hoá đơn/biên lai đã có và có thể tái sử dụng hạ tầng. |
| NEW-07 | P2 | **Xuất báo cáo Excel theo bộ lọc — FR-RPT-04.** | Yêu cầu tại `Doc/PRJ1_Phan-tich-yeu-cau_Chung-cu-mini.md:1205`. Các controller trong `backend/.../report` trả JSON, chưa có tạo/tải Excel; các màn báo cáo frontend chưa có thao tác xuất. |

## Kiểm thử, triển khai và tài liệu còn phải hoàn thiện

| Mã | Ưu tiên | Công việc | Hiện trạng / bằng chứng |
|---|---|---|---|
| OPS-01 | P1 | Chạy lại bộ kiểm thử tích hợp bằng Docker và bổ sung kiểm thử luồng phòng/lịch hẹn. | Backend compile thành công tại máy rà soát, nhưng 41 mục kiểm thử lỗi khởi tạo vì Testcontainers không tìm được Docker. Chưa có test backend cho module `publicportal`. Test frontend dùng dữ liệu giả với tên field khác DTO thật nên chưa phát hiện FIX-07. |
| OPS-02 | P2 | Hoàn thiện cấu hình/bằng chứng triển khai: HTTPS, secret, lưu trữ ảnh, backup hằng ngày, giữ bản sao và phục hồi thử. | `frontend/nginx.conf:2` chỉ nghe HTTP; `.scratch/slice-11-may-chu-that/spec.md` chưa duyệt/chưa chia ticket; repo chưa có job backup/restore. Không thể kết luận hạ tầng ngoài repo chưa tồn tại; cần cung cấp cấu hình và kết quả nghiệm thu. |
| OPS-03 | P2 | Nối CI với xuất image/triển khai nếu giữ cam kết CI/CD trong kế hoạch. | `.github/workflows/ci.yml` đã có test/build nhưng các image build đặt `push: false`, chưa có bước deploy. CI không phải hoàn toàn chưa làm. |
| OPS-04 | P2 | Bổ sung số đo nghiệm thu và truy vết yêu cầu. | Chưa có kết quả điền cho hiệu năng, tải đồng thời, coverage hàm tính tiền, chạy đa trình duyệt, phục hồi dữ liệu và các yêu cầu phi chức năng trong Chương 6. Đã có ảnh/chứng cứ kiểm giao diện một số màn; không suy ra mọi màn hoặc mọi NFR đã đạt. CI chưa có bước đối chiếu ma trận FR với endpoint/test như kế hoạch. |
| OPS-05 | P2/P3 | Hoàn thiện báo cáo và cập nhật hướng dẫn. | Chương 5, 6, 7 còn nhiều `[ĐIỀN]`; `README.md:29` vẫn mô tả chỉ Slice 0, `:87` yêu cầu đọc `AGENTS.md` nhưng bản project này không có tệp đó. Cập nhật luồng chạy thực tế, trạng thái FR, ảnh/số liệu, kết quả test và hạn chế. |

## Các điểm cần xác minh thêm

- **Trạng thái phòng công khai khi qua ngày bắt đầu/hết hạn hợp đồng:** `PublicPortalRepository.java` đọc trực tiếp `p.trang_thai`, trong khi danh mục nội bộ có bước đồng bộ trạng thái. Cần kiểm thử qua mốc ngày trước khi kết luận mức ảnh hưởng thực tế; hiện chưa thực hiện kiểm thử tích hợp này.
- **Khoảng thời gian trong báo cáo:** tổng quan/chi phí có khoảng ngày, công nợ chỉ nhận toà và tiêu thụ nhận một kỳ. Cần đối chiếu cách nghiệm thu FR-RPT-02 với ý nghĩa “công nợ hiện tại” và “xu hướng nhiều kỳ” trước khi mở ticket thay đổi.
- Không có bằng chứng để kết luận hệ thống ngoài repo đã hay chưa được đưa lên máy chủ, bật TLS hoặc sao lưu. Danh sách hạ tầng phía trên phản ánh những gì chưa có cấu hình/bằng chứng trong bản project được cung cấp.

## Mở rộng đã được kế hoạch để sau

Không gộp các mục này vào lỗi chặn luồng chính: ghi chỉ số ngoại tuyến/tự đồng bộ; công tơ tổng/cảnh báo thất thoát; tài sản bàn giao; phương tiện; đối soát sao kê; cấu hình mốc nhắc theo từng toà. Tham chiếu `Doc/PRJ1_Ke-hoach-trien-khai.md:281` (Slice 12). Nếu thay đổi phạm vi nghiệm thu thì cần đưa chúng trở lại backlog chính.

## Kết quả kiểm tra tại lần rà soát

- `npm.cmd test`: lần chạy cuối **28 tệp, 202 test đạt**. Đã chạy lại do có thêm/chỉnh tệp frontend trong lúc rà soát.
- `npm.cmd run build`: lần chạy cuối **thất bại với 16 lỗi TS2322** liên quan `Button.variant`.
- `gradlew.bat test --offline --no-daemon`: **220 mục kiểm thử, 179 đạt, 41 thất bại**. Các thất bại đều ở khởi tạo kiểm thử tích hợp với lỗi không tìm được Docker; chưa kiểm chứng được nghiệp vụ tích hợp. Báo cáo: `backend/build/reports/tests/test/index.html`.
- Không sửa mã ứng dụng, migration, dữ liệu hay cấu hình triển khai trong lượt rà soát này.

Thứ tự thực hiện đề xuất: FIX-01 → FIX-02/03/04/05 → FIX-06/07 → UI-01/02/03/04/05/06 → NEW-01/02/05 → phần Should còn lại → nghiệm thu và bàn giao.
