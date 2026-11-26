# 05 · Plan thi công V3 "Sổ cái" — tổng quan cho controller

Nguồn: [BRIEF-plan-thi-cong.md](BRIEF-plan-thi-cong.md), [../03-he-thiet-ke.md](../03-he-thiet-ke.md), [../02-workflow.md](../02-workflow.md), [../QA.md](../QA.md), prototype [../prototype/](../prototype/), code thật `frontend/src` ở commit `09cbddb` (nhánh `feat/ui-tokens` = `feat/v3`).
Mốc đo ngày 2026-11-26 trong bản clone scratch: `npx tsc -b` qua · `npx vitest run` **73 file / 617 test qua** · `npm run build` qua (chỉ cảnh báo chunk > 500 kB có từ trước).

## 1. Đợt, lô, thứ tự

| Đợt | Lô | Nhánh · worktree | Việc | Ước (Sonnet) | Phụ thuộc |
|---|---|---|---|---|---|
| 0 | **y0 Nền** | `ui/y0-nen` · `~/Documents/PRJ/MiniApart-y0` | Phần A: token, font Plex, guard, nút mực đen, 3 mật độ, `tienTheoNguoi`/`matDo`. Phần B: khung (nav, TopBar, `data-density` ở App), component chung mới, tách `ManDangNhap.tsx` | A 55′ + B 55′ (cùng một coder, làm liền) | — |
| 1 | y1 Hôm nay & Tiền | `ui/y1-tien` · `MiniApart-y1` | Hôm nay Chủ + QL, Tiền / Thu tiền gom theo người, Ghi thu một lần, Nhắc Zalo | 60′ | y0 |
| 1 | y2 Hồ sơ | `ui/y2-ho-so` · `MiniApart-y2` | Danh sách Người thuê (sửa "3 giây"), hồ sơ Người thuê / Phòng / Toà (sửa "3 giây") / Hợp đồng | 60′ | y0 |
| 1 | y3 Danh mục & Hợp đồng | `ui/y3-hop-dong` · `MiniApart-y3` | Toà & phòng, Phòng (QL), bảng Hợp đồng, Tạo hợp đồng một trang | 55′ | y0 |
| 1 | y4 Sự cố & Báo cáo | `ui/y4-su-co` · `MiniApart-y4` | Sự cố 3 nhóm + duyệt báo giá, Báo cáo 1 trang | 55′ | y0 |
| 1 | y5 Tháng (QL) | `ui/y5-thang` · `MiniApart-y5` | Chu kỳ tháng 4 bước (đủ bước 2–4), Ghi chỉ số dạng bảng, Hoá đơn hàng loạt | 60′ | y0 |
| 1 | y6 Người thuê | `ui/y6-nguoi-thue` · `MiniApart-y6` | Tiền nhà / Trả tiền / Báo hỏng / Phòng tôi / Lịch sử, 390, thoáng | 55′ | y0 |
| 1 | y7 Thợ | `ui/y7-tho` · `MiniApart-y7` | Việc, chi tiết việc, báo giá, báo sửa xong, tiền công, thoáng | 55′ | y0 |
| 1 | y8 Khung & Quản trị | `ui/y8-khung` · `MiniApart-y8` | Đăng nhập, tìm nhanh, thông báo, không có quyền, tài khoản | 50′ | y0 (cần `ManDangNhap.tsx`) |
| 2 | y9 Dọn & đo | `ui/y9-don` · `MiniApart-y9` | Màn "giữ" ăn token, quét chữ cũ/hex sót, đo 1440/1024/390, `progress.md` | 60′ | y1…y8 đã gộp |
| 3 | y10 Backend (đề xuất) | — | Chỉ chạy khi Chủ tịch duyệt; xem [briefs/05-y10-backend-de-xuat.md](briefs/05-y10-backend-de-xuat.md) | — | y9 |

Đợt 1 chạy song song 8 coder. Nếu chỉ có 4 coder: chạy y1·y2·y5·y6 trước (màn chạm hằng ngày), rồi y3·y4·y7·y8.

## 2. Ma trận file → lô sở hữu

Quy tắc: **trong một đợt, mỗi file chỉ một lô được sửa.** File của đợt trước được lô đợt sau sửa (ví dụ `ManDangNhap.tsx`: y0 tách ra, y8 làm lại). Test `X.test.tsx` thuộc lô sở hữu `X.tsx`.

| Lô | File được sửa (kèm `.test.tsx` cùng tên) |
|---|---|
| **y0** | `App.tsx`, `main.tsx`, `dinhTuyen.ts`, `roleNavigation.ts`, `soDemDieuHuong.ts`, `toaDangChon.tsx`, `ManagementShared.tsx`, `bangQuanTriChung.tsx`, `nhomNoTheoNguoi.ts`, **mới:** `tienTheoNguoi.ts`, `matDo.ts`, `ManDangNhap.tsx`; `tokens/**`, `design/**`, `assets/fonts/**`, `styles.css`, `index.css`/`base.css` nếu có; `designTokens.test.ts`, `stylesCleanup.test.ts`, `designComponents.test.tsx`, `glyphAssets.test.ts`, `dinhTuyen.test.ts`, `App*.test.tsx`; `docs/design/ui-redesign/tools/{contrast.py,dom2svg.js,cdp-run.mjs}` (bỏ Inter/teal) |
| y1 | `HomNay.tsx`, `HomNay.css`, `ThuTien.tsx`, `ThuTien.css`, `FinancePaymentPanel.tsx`, `financeFlows.test.tsx` |
| y2 | `HoSoNguoiThue.tsx`, `HoSoNguoiThue360.tsx`, `HoSoPhong360.tsx`, `HoSoToa360.tsx`, `HoSoHopDong360.tsx`, `HoSoNguoiPhong.css`, `HoSoHopDongToa.css`, `HoSo360.test.tsx` |
| y3 | `DanhMucToaNha.tsx`, `DanhMucPhong.tsx`, `HopDongQuanLy.tsx`, `TaoHopDong.tsx`, `TaoHopDong.css`, `HopDongThaoTac.tsx`, `QuanLyTaiSanPhong.tsx`, `HopDongThaoTacCon.test.tsx` |
| y4 | `SuCoQuanLy.tsx`, `SuCo.css`, `TrangSuCo.tsx`, `QuanLyBaoGiaVaThanhToan.tsx`, `BaoCaoTongQuan.tsx`, `TieuThuBaoCao.tsx`, `ChiPhiBaoTriBaoCao.tsx`, `ChuDashboard.tsx`, `baoCaoChung.tsx`, `useToaKhung.ts`, `ExcelExportButton.tsx`, `dashboardTongHop.ts`, `ToaKhungManLoc.test.tsx` |
| y5 | `ChuKyThang.tsx`, `tinhBuocChuKy.ts`, `GhiChiSo.tsx`, `GhiChiSo.css`, `meterPhoto.ts`, `HoaDonQuanLy.tsx`, `InvoiceActions.tsx` |
| y6 | `CanTra.tsx`, `CanTra.css`, `HoaDon.tsx`, `LichSuHoaDon.tsx`, `BaoHongKhach.tsx`, `HopDongNguoiThue.tsx`, `BieuDoTieuThu.tsx` |
| y7 | `ThoCongViec.tsx`, `ThoChiPhi.tsx` |
| y8 | `ManDangNhap.tsx` (sau y0), `TimNhanh.tsx`, `chiMucTimNhanh.ts`, `ChuongThongBao.tsx`, `ChuongThongBao.css`, `ThongBao.tsx`, `TrangKhongCoQuyen.tsx`, `QuanLyTaiKhoan.tsx`, `TaiKhoanTruyCap.tsx`, `KhamPhaPhong.tsx`, `roomAmenities.ts` |
| y9 | Màn giữ: `DichVuVaKy.tsx`, `QuanLyLichHen.tsx`, `TuanThuVanHanh.tsx`; màn không còn route (chỉ còn import trong App): `QuanLyDashboard.tsx`, `BangViecVanHanh.tsx`, `CongNoBaoCao.tsx`, `LichSuSuaChua.tsx`, `QuanLySuaChua.tsx`, `ViecCuaToi.tsx`, `ThoTongQuan.tsx`; `managementFlows.test.tsx`; `docs/design/ui-redesign/progress.md`. Đợt 2 nên y9 được sửa **thêm** file của đợt 1, nhưng chỉ để dọn chữ/hex sót (mỗi file ghi một dòng lý do) |
| Không lô nào | `api.ts`, `managementApi.ts`, `financeApi.ts`, `workerDashboardApi.ts`, `authSession.ts`, `backend/**`, `vite.config.ts`, `package*.json` (không thêm dependency) |

Hai ngoại lệ có chủ đích:
- `App*.test.tsx` thuộc y0. Lô đợt 1 chỉ được sửa những `it(...)` kiểm màn **của mình**, và phải ghi tên từng `it` trong báo cáo. Controller gỡ xung đột lúc gộp.
- `managementFlows.test.tsx` kiểm `DichVuVaKy`, `GhiChiSo`, `QuanLySuaChua`, `TaiKhoanTruyCap`, `TuanThuVanHanh`. Ở đợt 1, chỉ y5 (phần `GhiChiSo`) và y8 (phần `TaiKhoanTruyCap`) được sửa `it` của mình. Đến đợt 2, y9 sở hữu file này.

### Hợp đồng giữa các lô (ghi ở brief lô **tiêu thụ**)
| Lô cung cấp | Thứ cung cấp (không được đổi chữ ký trong đợt 1) | Lô dùng |
|---|---|---|
| y0 | `design/**` mới: `NutChinh`/`Button tone`, `DongNguoiNo`, `ThanhBuoc`, `HangTong`, `DongViec`, `KhoiSo`, `DauTrang`, `NhanMinhHoa`, `ChanDinh` (interface ở brief y0 §4) | mọi lô |
| y0 | `tienTheoNguoi.ts`: `nhanThang`, `docSoTien`, `phanBoThu`, `ghiThuLanLuot`, `tinNhacNo`, `linkZalo`, `dinhDangSdt` | y1, y2, y5 |
| y0 | `matDo.ts` + `data-density` ở `.ma-app-shell`; `TrangProps` giữ nguyên | mọi lô |
| y3 | `HopDongThaoTac.tsx` export `GiaHan`, `Ky`, `ThanhLy`, `PhuLuc`, `NguoiOCung` (giữ props) | y2 (`HoSoHopDong360`) |
| y3 | `QuanLyTaiSanPhong.tsx` default export, giữ props | y2 (`HoSoPhong360`) |
| y6 | `CanTra.tsx` export `Tieu` (giữ props `{ mobile, children, className, id, style }`) | y7 (`ThoCongViec`) |
| y1 | `FinancePaymentPanel.tsx` default export và `message`, giữ props | y6 (`HoaDon`), y5 (`InvoiceActions` dùng `message`) |

## 3. Quyết định chung cho mọi lô (đã ghi lại trong từng brief)

1. **Không đổi quyền, route, API.** Route cũ vẫn mở được. Riêng nhãn trong nav đổi theo V3 (Kỳ→Tháng, Lịch hẹn→Lịch xem phòng…), đường dẫn giữ nguyên.
2. **Mật độ:** `data-density` gắn ở `.ma-app-shell`. Người thuê và Thợ luôn dùng `thoang`. Chủ, Quản lý, Quản trị dùng `lam-viec` khi màn ≥ 768 và `chu-m` khi màn < 768 (cùng ngưỡng với `kiemTraManHinhHep` của App). Token V3 nằm trong [ma-mau/frontend/src/tokens/overlay-ui-redesign.css](ma-mau/frontend/src/tokens/overlay-ui-redesign.css), giữ nguyên mọi tên `--ma-*` để CSS cũ tự đổi màu theo.
3. **Nút chính:** mỗi màn tối đa một nút nền mực (`--ma-brand-primary` `#14181D`). Màn chỉ đọc thì không có nút chính. Việc phá huỷ không bao giờ là nút chính. Hành động lặp theo dòng dùng nút thường. Trên điện thoại, nút chính dính đáy (`ChanDinh`).
4. **Tiền gom theo người:** một dòng cho mỗi người nợ, hiện tổng còn nợ và số tháng. Bấm vào thì mở ra từng tháng. Ghi thu một lần sẽ tự trừ dần từ tháng cũ nhất qua `phanBoThu` + `ghiThuLanLuot`, gọi `recordPayment` có sẵn cho từng hoá đơn. Không cần API mới.
5. **Phần thiếu backend:** làm tạm phía client, hoặc ẩn đi, kèm nhãn `NhanMinhHoa` ghi trung thực ("cần backend", "minh hoạ"). Không để nút chết, không dựng số giả như thật.
6. **Chữ:** dùng bảng tiếng nói của 03 §9: Kỳ→Tháng, Chốt kỳ→Khoá chỉ số, Phát hành hoá đơn→Gửi hoá đơn, Thực thu→Đã thu, Công nợ→Còn nợ, Phân công→Giao thợ, Lấp đầy→"27/36 phòng đang thuê", Chủ sở hữu→Chủ nhà. Không IN HOA, không nghiêng, không dùng weight 700.

### Màn V3 chưa vẽ: giữ hay làm mới
| Màn | Quyết định | Lô | Lý do |
|---|---|---|---|
| Giá dịch vụ & cài đặt (`/dich-vu`) | **Giữ**, chỉ ăn token/khung + đổi chữ | y9 | Vài tháng mới dùng một lần, form CRUD đang chạy tốt, chưa có bản vẽ nên không đoán |
| Lịch xem phòng (`/lich-hen`) | **Giữ**, đổi nhãn nav + chữ. Khối "Lịch xem phòng" trên Hôm nay QL làm mới ở y1 | y9 / y1 | Hôm nay đã trả lời "hôm nay ai đến xem"; màn đầy đủ hiếm khi mở |
| An toàn PCCC (`/an-toan`) | **Giữ**, token + chữ | y9 | Việc theo quý; Hôm nay đã có dòng "Bình chữa cháy quá hạn" dẫn vào đây |
| Báo cho cư dân (`/thong-bao` QL) | **Giữ**, token + chữ | y8 (`ThongBao.tsx`) | Cùng file với thông báo cá nhân, đã có luồng gửi |
| Nhật ký (`/nhat-ky-thao-tac`) | **Giữ**, token + bảng chung | y9 | Màn tra cứu, không ra quyết định |
| Thợ báo sửa xong | **Làm mới tối thiểu**: ở chi tiết việc `DANG_XU_LY` sau khi báo giá đã duyệt, nút chính dính đáy "Báo đã sửa xong", ô "Đã làm gì" bắt buộc, gọi `baoXongViecTho` có sẵn | y7 | Đây là bước cuối vòng việc của Thợ; API đã có, chỉ thiếu nút rõ |
| Trạng thái "không nợ" | **Làm mới tối thiểu**: một câu và một việc làm tiếp (Người thuê: "Bạn đã trả đủ mọi hoá đơn." + Lịch sử; Chủ/QL: "Không ai còn nợ." + "Xem hoá đơn tháng …"); số lớn hiện `0 ₫` màu chữ thường, không đỏ | y1, y2, y6 | 03 §7 quy định: rỗng thì một câu, một việc. Không cần số mới |

### Hai màn chưa đạt phép thử "3 giây" (QA.md)
- **Danh sách Người thuê** (`HoSoNguoiThue.tsx`, y2): dòng đầu trang theo dữ liệu thật, ví dụ "**12 người còn nợ 78.670.000 ₫ · 3 hợp đồng hết hạn trong 30 ngày**". Hai cụm trong dòng này là link lọc tại chỗ. Bảng xếp theo thứ tự: nợ trước, sắp hết hạn, còn lại theo phòng. Cuối mỗi dòng có một nút thường tuỳ trạng thái: nợ → "Ghi thu" (`/thu-tien?nguoiThueId=`), hết hạn ≤ 30 ngày → "Gia hạn" (`/hop-dong/:id`), không có gì → không nút. Đầu trang **không** có nút chính, vì đây là việc lặp theo dòng; "Thêm người thuê" dùng nút thường. Chip lọc: Tất cả · Còn nợ · Sắp hết hạn.
- **Hồ sơ Toà** (`HoSoToa360.tsx`, y2): một dòng "Việc kế tiếp" ở đầu trang, chọn theo thứ tự ưu tiên: sự cố khẩn chưa giao thợ → nợ quá hạn → hợp đồng chờ ký / sắp hết hạn → tháng này chưa gửi hoá đơn. Nút chính duy nhất của màn là hành động của dòng này. Không còn việc nào thì hiện "Không có việc gấp ở toà này." và không có nút chính.

## 4. Gộp và cổng kiểm

1. **Cổng 0 (sau y0):** controller chạy trong `MiniApart-y0`: `npx tsc -b && npx vitest run && npm run build`. Số test phải ≥ 617 + số test mới. Sau đó chạy [`../../tools/run-repo-guard.sh`](../../tools/run-repo-guard.sh). Review theo [05-review-checklist.md](05-review-checklist.md) §A + §B. Đạt thì `git merge --no-ff ui/y0-nen` vào `feat/v3`. Đợt 1 tạo worktree **từ `feat/v3` sau khi đã gộp y0**.
2. **Cổng 1:** từng lô nộp `docs/design/ui-redesign/v3/shots/yN/BAO-CAO.md` + ảnh. Gộp lần lượt theo thứ tự ít đụng `App*.test.tsx` trước: y7 → y6 → y8 → y4 → y3 → y2 → y5 → y1. Sau **mỗi** lần gộp phải chạy đủ 3 lệnh. Có xung đột thì chỉ gỡ trong `App*.test.tsx`; xung đột ở file khác nghĩa là lô đã sửa ngoài ma trận, trả lại lô đó.
3. **Cổng 2 (y9):** chạy trên `feat/v3` đã gộp đủ y1…y8. Đo h1 left/top trên 16 route ở 1440/1024/390, guard sạch, `progress.md` cập nhật. Xong mới đưa Chủ tịch duyệt.
4. Không lô nào push, merge hay đổi nhánh. Chỉ controller gộp.

## 5. Rủi ro

| Rủi ro | Cách giảm |
|---|---|
| Đổi `--ma-hit-desktop` 44→36 và chiều cao nút theo mật độ làm vỡ test khoá 44/48px (ThoCongViec, HomNay, GhiChiSo, ViecCuaToi, TrangSuCo, designComponents, HoSo360, App.test `var(--ma-hit-mobile)`…) | y0 chỉ đổi giá trị token, **không** đổi chuỗi `var(--ma-hit-*)` trong code. Lô nào thấy test vỡ vì đổi số px thì ghi lý do; quá ~30 test thì dừng, báo controller |
| Inter/teal còn sót trong file CSS cạnh màn (`*.css` của từng màn) | Guard mới của y0 quét **mọi** `*.css` trong `src`. Màn nào còn sót, lô sở hữu màn đó phải sửa (y0 sửa trước nếu là giá trị token) |
| Ghi thu nhiều hoá đơn: lần thứ k lỗi giữa chừng | `ghiThuLanLuot` dừng ở lỗi đầu tiên và trả về danh sách đã ghi. UI báo "Đã ghi tháng 7, 8. Tháng 9 lỗi: …", tải lại sổ, không thử lại tự động. Đã có test cho đúng tình huống này |
| QL bị 403 ở `/api/bao-cao/cong-no` và `/api/dashboard/chu` | Nợ của QL lấy từ `/api/hoa-don` (`tuHoaDonQuanLy`), như ux-v2 đã làm. Màn nào chỉ Chủ gọi được thì ẩn control đó với QL |
| `thucThu=0` lệch với `daThuHopDong=15.367.000` | Không hiện `thucThu` ở đâu cả. Mọi số "đã thu" đều cộng từ hoá đơn. Đưa vào y10 |
| Dữ liệu thật chỉ ở bước 1 của tháng 11, nên không chụp được bước 2–4 trên app thật | y5 dựng bước 2–4 có test mock. Muốn chụp thì dùng `?b=2..4` (ChuKyThang đã đọc `b`) **kèm** `NhanMinhHoa` "bản vẽ bước sau, dữ liệu thật đang ở bước 1". Không POST để đẩy bước |
| Người thuê không lấy được số tài khoản / QR (KH bị 403 ở `/api/toa-nha/:id/ben-a`) | y6 ẩn QR và số tài khoản, chỉ hiện "Hỏi quản lý số tài khoản" + nút Gọi quản lý. Nút "Tôi đã chuyển khoản" cũng ẩn vì chưa có API. Đưa vào y10 |
| 8 worktree × `npm ci` tốn đĩa/mạng | Mỗi worktree chạy `npm ci` một lần, hoặc dùng chung cache `~/.npm` (mặc định đã vậy) |
| Máy Windows cũ: tên file chỉ khác hoa/thường | Tên file mới trong plan: `tienTheoNguoi.ts`, `matDo.ts`, `ManDangNhap.tsx`, `design/money/DongNguoiNo.tsx`, `design/core/ThanhBuoc.tsx`… Đã kiểm, không trùng file nào khi bỏ phân biệt hoa/thường |

## 6. Đầu ra plan

| File | Nội dung |
|---|---|
| [05-00-tong-quan.md](05-00-tong-quan.md) | File này |
| [05-review-checklist.md](05-review-checklist.md) | Tiêu chí review từng lô |
| [briefs/05-y0-nen.md](briefs/05-y0-nen.md) … [briefs/05-y9-don.md](briefs/05-y9-don.md) | Brief tự đủ cho từng lô |
| [briefs/05-y10-backend-de-xuat.md](briefs/05-y10-backend-de-xuat.md) | Đề xuất backend (chờ duyệt) |
| [ma-mau/](ma-mau/) | Mã mẫu chép thẳng vào `frontend/src`: token V3, typography, fonts, guard `designTokens.test.ts`, `tienTheoNguoi.ts` + test, `matDo.ts` + test. Đã chạy thử trong clone scratch: tsc qua, **75 file / 641 test qua**, build qua (khi kèm 9 file font Plex thay Inter) |

### Phụ thuộc backend (tổng hợp)
| Thiếu | Ảnh hưởng | Cách làm tạm trong đợt này | Lô |
|---|---|---|---|
| Người thuê không đọc được số tài khoản / QR (`/ben-a` 403 với NGUOI_THUE) | Màn Trả tiền | Ẩn QR và số tài khoản. Nhãn "Hỏi quản lý số tài khoản" + Gọi quản lý | y6 |
| "Tôi đã chuyển khoản" (báo quản lý) | Trả tiền | Ẩn nút. Câu hướng dẫn: "Chuyển xong, gọi hoặc nhắn quản lý để xác nhận." | y6 |
| Nhắc nợ qua hệ thống | Tiền, hồ sơ | Tin soạn sẵn → nút "Nhắc qua Zalo" mở `https://zalo.me/<sđt>` + nút "Chép tin". Không có SĐT thì ẩn nút | y1, y2 |
| Ghi chú / lịch sử liên hệ | Hồ sơ người thuê | Khối hiện "Chưa lưu được ghi chú" + `NhanMinhHoa` "cần backend". Không có ô nhập giả | y2 |
| `thucThu` lệch `daThuHopDong` | Hôm nay, Báo cáo | Cộng đã thu từ hoá đơn, không dùng `thucThu` | y1, y4 |
| Báo giá demo trống | Duyệt báo giá | Màn chạy theo dữ liệu thật. Trống thì hiện "Chưa có báo giá chờ duyệt". Ảnh nghiệm thu chụp trạng thái rỗng, kèm test mock cho trạng thái có báo giá | y4 |
| API chỉ số trả 9 phòng, dashboard ghi 20/24 công tơ | Tháng, Hôm nay QL | Hiện đúng số API chỉ số trả về, ghi nguồn ("theo bảng chỉ số"). Không ghép số từ hai nguồn | y5, y1 |
| Không có điện nước theo phòng cho Chủ | Hồ sơ người thuê | Ẩn khối "Điện nước 4 tháng" với Chủ/QL. Chỉ hiện ở Người thuê (`/api/cong/tieu-thu`) | y2 |
| Bước 2–4 tháng 11 chưa có dữ liệu thật | Tháng | Xem bảng Rủi ro | y5 |
