# y10: lô backend + màn mở khoá (nhánh ui/y10-backend, từ feat/v3 @076190f)

## Test
- Backend: 763 → **769** xanh (+6 test tích hợp y10 trong `CongNguoiThueAuthorizationIntegrationTest`; `DashboardQuanLyServiceTest` sửa theo nguồn mới). 7 test bị skip từ trước.
- Frontend: 710 → **717** xanh (vitest, 77 file); `npx tsc -b` và `npm run build` sạch.

## Endpoint mới / sửa
| # | Việc | Ghi chú |
|---|---|---|
| 1 | `GET /api/cong/thanh-toan` (NGUOI_THUE) | `{toaNhaId, tenToaNha, maNganHang, tenNganHang, soTaiKhoan, chuTaiKhoan, noiDungMau}`. Toà của hợp đồng HIEU_LUC mới nhất; không hợp đồng → 404. Số TK + mã BIN lấy từ `TOA_NHA` (cùng nguồn QR của QL); tên NH/chủ TK lấy từ Bên A nếu đã nhập, không thì null. Không mở `/ben-a`. |
| 2 | QR VietQR | `frontend/src/vietQr.ts` dựng chuỗi EMVCo + CRC16; test: vector chuẩn `29B1` và chuỗi vàng của backend (CRC 8514). Vẽ bằng `qrcode` (thêm 1 dependency: repo frontend chưa có thư viện QR, tự viết bộ mã hoá QR thì dài và dễ sai). Nội dung > 25 ký tự (nhiều tháng) bị bỏ khỏi QR theo giới hạn VietQR, vẫn hiện để chép. |
| 3 | `POST /api/cong/hoa-don/{id}/bao-da-chuyen` | Chỉ người thuê của hoá đơn (hoá đơn khác → 404, nhân viên → 403, đã trả đủ → 409). Idempotent: bảng `BAO_DA_CHUYEN` khoá theo hoá đơn; lần đầu tạo thông báo “Người thuê báo đã chuyển” cho mỗi QL của toà. `GET /api/cong/hoa-don` thêm trường `baoDaChuyenLuc`. |
| 4 | `GET/POST /api/nguoi-thue/{id}/ghi-chu` | CHU/QUAN_LY đúng phạm vi toà (cùng luật `coNguoiThueTrongPhamVi`), kênh GOI/ZALO/GAP, tối đa 1000 ký tự. |
| 5 | `thucThu` dashboard Chủ | Cùng nguồn `daThuTheoHoaDon` (Σ đã thu của hoá đơn phát hành trong khoảng), cả theo tháng, KPI và “so sánh toà”. Demo thật: `thucThu = daThuHopDong = 391.497.000`. Frontend vẫn giữ phần tự cộng (rủi ro thấp, không đụng). |
| 6 | `congToChuaGhi` dashboard QL | = Σ số phòng của `thieu-chi-so` các kỳ đang mở (gọi cùng `KyThanhToanService`). Danh sách chi tiết `danhSachChuaGhi` giữ nguyên (còn tính theo từng dịch vụ + điểm đo chung). |
- Migration mới: `V64__tenant_payment_notice_and_contact_notes.sql` (`BAO_DA_CHUYEN`, `GHI_CHU_LIEN_HE`). Không đổi quyền endpoint cũ.

## Frontend
- `CanTra`: số tài khoản + Chép + QR + nội dung chép + nút chính dính đáy “Tôi đã chuyển khoản” (sau khi báo: “Đã báo chuyển, chờ quản lý xác nhận.”); bỏ khối “cần backend”. Desktop: cột căn giữa trong khung (max 960).
- `HoSoNguoiThue360`: khối “Ghi chú liên hệ” (nhập + danh sách). `HomNay` (QL): dòng “Người thuê báo đã chuyển” + nút Ghi thu, ẩn khi hoá đơn đã thu đủ.
- Cập nhật test cũ `HoSo360.test.tsx` (không còn nhãn “cần backend”).

## Chạy test backend trên Mac (không có JDK)
```
cd MiniApart-y10
docker run --rm -v "$PWD":/repo -w /repo/backend -v /var/run/docker.sock:/var/run/docker.sock \
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal -v gradle-cache:/root/.gradle \
  eclipse-temurin:24-jdk-noble sh ./gradlew test
```
Testcontainers chạy được qua docker.sock, không cần `--network host`. `gradlew` không có bit chạy nên gọi bằng `sh`. Phải mount cả repo (không chỉ `backend/`): `PersonalDemoQrAssetTest` đọc `../frontend/public/...`. Lần đầu ~5 phút (tải Gradle), lần sau ~5 phút cả bộ.

## Demo thật (stack 5190 dựng lại từ worktree này, dữ liệu giữ, reference-date không đổi)
- Chỉ GET + đăng nhập. Người thuê 0999100001: `/api/cong/thanh-toan` trả toà 3, mã NH 970422; QR hiện. Chủ: `/api/dashboard/chu` thucThu = daThuHopDong. QL: congToChuaGhi = thieu-chi-so (0 = 0, toà 3 chưa có kỳ thiếu số).
- Ảnh: `tra-tien-390.png` (Người thuê), `can-tra-1440.png`, `tra-tien-1440.png`, `ho-so-nguoi-thue-1440.png` (Chủ, /nguoi-thue/1).
- Lưu ý dữ liệu seed: số tài khoản toà demo là `000000000000000` và tên ngân hàng trống (do seeder, không phải code mới). Màn hiện đúng như DB; muốn đẹp hơn cần sửa seeder.
- POST (báo đã chuyển, ghi chú) chỉ chứng minh bằng test, chưa bấm trên app thật.
