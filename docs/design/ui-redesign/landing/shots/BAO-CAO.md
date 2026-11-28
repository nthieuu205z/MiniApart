# BAO-CAO: code phần công khai MiniApart vào app thật

Nhánh `ui/landing`, worktree `MiniApart-landing`. Nguồn thiết kế: `../README.md`, `../01-kien-truc.md`. Không push, không merge.

## Route mới

| Route | Màn | Ghi chú |
|---|---|---|
| `/` | Trang chủ công khai | Khách và người đã đăng nhập đều xem được, không chuyển hướng |
| `/tim-phong` | Tìm phòng | Thay `KhamPhaPhong`; bộ lọc ghi lên URL (`toa`, `tp`, `gia`, `loai`, `q`, `ti`, `tatca`) |
| `/phong-trong/:id` | Chi tiết phòng + đặt lịch xem | **Không dùng `/phong/:id`**: đó là hồ sơ phòng của Chủ/Quản lý (`dinhTuyen.ts`), dùng chung sẽ bị nuốt. Có test chứng minh `/phong`, `/phong/:id` vẫn thuộc app |
| `/dang-nhap` | Cổng cư dân | Thay `ManDangNhap`; giữ logic đăng nhập, trợ giúp tài khoản (`TaiKhoanTruyCap`), `healthError` |
| `/kham-pha` | (cũ) | Chuyển `/tim-phong`, giữ query |

Hành vi (App.tsx):
- Đã đăng nhập vào `/`, `/tim-phong`, `/phong-trong/:id`: vẫn xem được. Góc phải menu là chữ cái tên + "Vào trang của tôi" → `TRANG_DAU[vaiTro]`. Chưa đăng nhập: "Cổng cư dân" → `/dang-nhap`.
- Đăng nhập thành công: `thayTheDuongDan(TRANG_DAU[vaiTro])` (bỏ nhánh riêng cho `NODE_ENV=test` và nhánh `/tho/tong-quan`; Thợ vẫn về `/viec-cua-toi`).
- Đã đăng nhập mà vào `/dang-nhap`: về trang đầu theo vai. Đăng xuất: về `/` (landing).
- Chưa có phiên mà vào trang của app (ví dụ `/hom-nay`): về `/dang-nhap`, chờ kiểm tra phiên xong mới chuyển.
- Menu trên: Tìm phòng · Vì sao MiniApart · (mép phải) Cổng cư dân. Không còn "Dành cho chủ nhà", nút Zalo, hay Newsreader.

## File đổi

- Mới `frontend/src/congKhai/`: `CongKhaiKhung.tsx` (menu, menu điện thoại, chân trang, tải API công khai một lần), `TrangChu.tsx`, `TimPhong.tsx`, `ChiTietPhong.tsx`, `CongCuDan.tsx`, `dungChung.tsx` (định dạng, `tinhThang`, `locPhong`), `tuyen.ts`, `congKhai.css` (mọi luật dưới `.cong`, lớp trùng V3 đã đổi tên: `loc-chip`, `logo-cong`, `tc1..tc4`, `tt-cong`), `fonts/` (Be Vietnam Pro 400/500 × latin/vietnamese, OFL, `SHA256SUMS` khớp prototype).
- Sửa `frontend/src/App.tsx`. Xoá `KhamPhaPhong.tsx`, `KhamPhaPhong.test.tsx`, `ManDangNhap.tsx`.
- Backend: `PublicPortalRepository` (3 truy vấn loại `ngung_cho_thue = TRUE`: đếm phòng trống của `/toa-nha`, `/phong`, `/phong/{id}` → 404), `PresentationDemoSeeder` (bỏ "Dữ liệu mô phỏng phục vụ báo cáo.").
- Công cụ: `docs/design/ui-redesign/tools/app-shot.mjs` (chờ đăng nhập theo `location.pathname`, và cuộn qua trang trước khi chụp để khối "hiện dần" hiện đủ).

## Test trước / sau

| | Trước | Sau |
|---|---|---|
| Frontend (vitest) | 717 xanh / 77 file | 733 xanh / 78 file |
| Backend (gradle, docker) | 769 xanh, 7 bỏ qua | 770 xanh, 7 bỏ qua (+1: `publicPortalHidesRoomsStoppedFromRenting`) |
| `npx tsc -b`, `npm run build` | sạch | sạch (font Be Vietnam Pro vào `dist/assets`, không có Newsreader) |

Test cũ phải sửa (vì UI/route đổi hợp lệ):
- `App.test.tsx` (`mountAppAndLogin`) và `App.dangNhap.test.tsx`: đăng nhập ở `/dang-nhap`, vì `/` giờ là trang chủ.
- `App.test.tsx` "stacks the login panels at 360px": kiểm style inline `min(400px,100%)` của thẻ cũ; nay khung là CSS lớp, đổi thành kiểm form render trong khung cổng cư dân. Hợp đồng "xếp một cột ≤899px" kiểm ở test mới.
- `App.tho.test.tsx` (3 test): trước đây vào `/` có token thì tự chuyển `/viec-cua-toi`; nay `/` là landing nên bắt đầu từ `/tho/tong-quan` (vẫn kiểm đường dẫn cũ chuyển bằng replace, không thêm lịch sử).
- `KhamPhaPhong.test.tsx` xoá cùng file. Phần còn giá trị chuyển sang test mới: chuẩn hoá cách viết tiện ích (hòa/hoà, nóng lạnh), chip đếm theo bộ lọc giá, trạng thái phòng.

Test mới: `App.congKhai.test.tsx` (20: landing khách, 5 vai thấy "Vào trang của tôi" đúng `TRANG_DAU`, bấm sang `/hom-nay`, `/kham-pha`→`/tim-phong`, khách bị đưa về `/dang-nhap`, đã đăng nhập vào `/dang-nhap`, đăng nhập rồi đăng xuất về `/`, lọc + URL + lỗi mạng, đặt lịch POST đúng body / sai số điện thoại / máy chủ từ chối / phòng đang thuê / không tìm thấy, ước tính tháng) và `congKhai/dungChung.test.ts` (tính tiền, lọc, route không bị nuốt).

## Ảnh từ app thật (vite 5320 → stack demo 5190, chỉ GET + đăng nhập)

`shots/app/`: `01-trang-chu`, `02-tim-phong`, `03-chi-tiet-phong` (mỗi màn 1440 + 390), `04-dang-nhap` (1440 + 390), `05-menu-390`, `06-trang-chu-da-dang-nhap-chu` (1440 + 390), `qa.json`. Đã mở xem từng ảnh, so với `../screens/`. Không có POST đặt lịch trên app thật (đã test bằng mock).

QA (app-shot, 11 lượt): cuộn ngang 0; đúng 1 `h1` mỗi trang; vùng chạm <44px: 0; điều khiển thiếu tên: 0; chỉ một họ chữ (Be Vietnam Pro); tương phản chữ trên nền phẳng thấp nhất 6,11.
Ngoại lệ: (1) tương phản 1,06 mà probe báo là menu trắng trên ảnh hero (probe lấy nền phẳng; lớp phủ CSS giữ nguyên prototype, nơi đo theo điểm ảnh ra ≥5,94, em chưa đo lại điểm ảnh trên app thật); (2) ký hiệu ₫ 12–12,8px và chữ cái avatar 12px (chủ ý từ thiết kế, `aria-hidden`).

## Chưa làm / cần biết

- **Stack demo 5190 chạy backend cũ**, chưa có bản sửa `ngung_cho_thue`: ảnh chụp vẫn tính phòng ngừng cho thuê (mỗi toà 2 "trống"). Test tích hợp đã kiểm bản sửa; muốn thấy số đúng trên ảnh thì build lại backend demo (em không đụng stack này).
- Đặt lịch vẫn nhận `phongId` của phòng đã ngừng cho thuê nếu ai gọi thẳng API (ngoài phạm vi yêu cầu).
- Khách vào trang của app bị đưa về `/dang-nhap` nhưng không nhớ trang định vào (đăng nhập xong về trang đầu theo vai).
- Chưa thử Safari/Firefox, điện thoại thật, trình đọc màn hình, đi Tab hết bốn màn. Menu điện thoại: Esc/bẫy tiêu điểm dùng `useDialogTrap` của app, chưa nghe thử.
- Ảnh hero gốc 960×720 (phóng ở 1440), như thiết kế đã ghi.
