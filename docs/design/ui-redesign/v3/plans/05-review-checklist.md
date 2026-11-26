# 05 · Checklist review từng lô V3 (controller dùng)

Đánh dấu ✓ / ✗ kèm bằng chứng (lệnh, ảnh, dòng code). Có một mục ✗ ở §A hoặc §B thì **trả lô**. Mục ✗ ở §C thì ghi nợ UI kèm lô sở hữu.

## A. Cổng cứng (mọi lô)
- [ ] Tự chạy lại trong worktree của lô: `npx tsc -b && npx vitest run && npm run build` đều qua. Số test ≥ số mốc trong báo cáo.
- [ ] `git diff --stat feat/v3...HEAD` chỉ có file trong mục "File được sửa" của brief và `docs/design/ui-redesign/v3/shots/yN/`. Không có `api*.ts`, `backend/**`, `package*.json`. Lô đợt 1 không đụng `App.tsx`, `design/**`, `tokens/**`.
- [ ] Mỗi task một commit, message `ui(yN): …`. Không có merge commit, không push (kiểm `git log --oneline feat/v3..HEAD`, `git status`).
- [ ] Không lộ bí mật: `git log -p feat/v3..HEAD` và `shots/yN/**` không chứa mật khẩu demo, token hay header `Authorization`. Cách kiểm: cho grep đọc chuỗi mật khẩu từ biến môi trường và **chỉ in số lần khớp**, không in dòng nào ra màn hình.
- [ ] Không có lệnh ghi lên app thật ngoài đăng nhập. Báo cáo nói rõ luồng ghi được chứng minh bằng test mock. Ảnh không chụp trạng thái "đã ghi".
- [ ] Không xoá test, không `skip`/`only`. Mỗi test cũ bị sửa có một dòng lý do. Sửa ≤ ~30 test.
- [ ] Tên file mới không trùng file có sẵn khi bỏ phân biệt hoa/thường: `git diff --name-only --diff-filter=A feat/v3...HEAD | tr A-Z a-z | sort | uniq -d` phải rỗng, và không trùng với `git ls-files | tr A-Z a-z`.
- [ ] Route và quyền không đổi: `dinhTuyen.test.ts` không bị sửa ở các ca "mở được" / "không có quyền". Các query cũ mà brief nêu (`?tab`, `?loc`, `?xem`, `?id`/`yeuCauId`, `?hopDongId`, `?sapHetHan`, `?b`, `?tra`) vẫn chạy.

## B. Cốt lõi V3
- [ ] **Mật độ đúng vai trò:**
  - Người thuê và Thợ có `[data-density="thoang"]`, chữ thân ≥ 16, vùng chạm ≥ 44;
  - Chủ / QL / QTHT ≥ 768 dùng `lam-viec`; < 768 dùng `chu-m`;
  - màn không tự đặt `font-size` hay `height` px (grep `fontSize:\s*\d`, `height:\s*\d{2}` trong diff; mỗi chỗ còn lại phải có lý do).
- [ ] **Nút chính mực đen, tối đa 1 mỗi màn:**
  - test của lô kiểm `.btn-primary` ≤ 1 cho từng trạng thái màn;
  - màn chỉ đọc (Hôm nay Chủ, Báo cáo, Phòng tôi, Tiền công, danh sách Người thuê) có 0 nút chính;
  - việc phá huỷ (Thanh lý, Từ chối, Khoá, Huỷ hoá đơn) dùng `danger`, không bao giờ là `primary`;
  - hành động lặp theo dòng là nút thường;
  - trên điện thoại, nút chính nằm trong `ChanDinh`.
- [ ] **Tiền gom theo người** (y1, y2, y5):
  - mỗi người một dòng và có hàng con theo tháng;
  - hàng tổng tính trên toàn danh sách đã lọc;
  - ghi thu một lần đi qua `phanBoThu` + `ghiThuLanLuot`, trừ tháng cũ trước;
  - lỗi giữa chừng báo đúng phần đã ghi và không ghi tiếp;
  - QL không gọi `/api/bao-cao/cong-no` hay `/api/dashboard/chu`.
- [ ] **Không còn Inter / teal / kem:**
  - `designTokens.test.ts` qua;
  - `grep -rniE "\"Inter\"|'Inter'|#0f766e|#0d9488|#115e59|#e6f2f0|#8fd3c8|#f9f7f6|#f4f2ee|#eef6f4" frontend/src` rỗng;
  - `qa.json`: `fontFamiliesUsed` chỉ có IBM Plex Sans, `fontsLoaded` có 400 / 500 / 600.
- [ ] **Không chữ IN HOA hét:** không còn `uppercase`, không có `letterSpacing` dương, không weight 700, không nghiêng, không font mono (4 guard của `designTokens.test.ts` qua).
- [ ] **Bảng tiếng nói:** chữ hiện ra trên màn của lô không còn Kỳ / Chốt kỳ / Phát hành / Thực thu / Lấp đầy / Chủ sở hữu / Công nợ / Phân công. Tháng ghi dạng "Tháng 7/2026". Tiền ghi dạng "7.580.000 ₫".
- [ ] **Trung thực với phần thiếu backend:**
  - không có nút chết (mọi nút đều làm được việc, hoặc đang `blocked` kèm lý do);
  - không dựng số giả như thật, kể cả 250.000 cố định, QR giả, dòng báo giá điền sẵn;
  - phần thiếu có `NhanMinhHoa` "cần backend" / "minh hoạ", hoặc được ẩn;
  - bước 2–4 của Tháng khi dữ liệu thật đang ở bước 1 có nhãn minh hoạ và nút bị chặn;
  - không dùng `thucThu`.
- [ ] **Vai trò không gọi được API thì ẩn control** (ví dụ cột nợ với QTHT, QR với Người thuê), không hiện lỗi 403.

## C. Đo và ảnh
- [ ] `shots/yN/jobs.json` + ảnh + `qa.json` có đủ mã ảnh mà brief liệt kê, ở cả 1440 và 390 (y9 thêm 1024).
- [ ] `qa.json` mọi ảnh:
  - `horizontalOverflow` 0;
  - `belowHit` 0;
  - `textBelowFloor` 0;
  - `contrast.below` 0;
  - `noAccessibleName` 0;
  - `h1.count` = 1.
- [ ] h1 left / top được ghi lại; cùng khung thì lệch ≤ 2px so với màn khác đã đo (y9 đo đủ 16 route).
- [ ] Mỗi ảnh có dòng "khác prototype ở đâu". Mỗi màn có dòng "đổi gì giữa 1440 và 390".
- [ ] Số trên ảnh (còn phải thu, số người, số hoá đơn, số công tơ) khớp dữ liệu demo, hoặc có ghi lệch và lý do.
- [ ] Đủ 4 trạng thái (đang tải, rỗng, lỗi, mất mạng) cho mỗi khối có tải dữ liệu, có test hoặc ảnh làm bằng chứng.

## D. Riêng từng lô
| Lô | Kiểm thêm |
|---|---|
| y0 | 9 file font khớp `SHA256SUMS`. Inter đã xoá. Interface §4 đúng tên và props, mỗi component có test. `ManDangNhap` tách mà `App.dangNhap.test.tsx` không phải sửa. Nav đúng bảng B2 và route cũ vẫn mở. `qa-probe.js` có `h1` và ngưỡng `thoang`. Mỗi thay đổi guard có lý do. Tương phản các cặp token ≥ 4.5 (viền ≥ 3) |
| y1 | Hôm nay Chủ không có nút chính. "Tháng trước đã thu" không lấy từ `thucThu`. Hôm nay QL lấy số công tơ thiếu cùng nguồn với Tháng. Thu dư bị chặn và hiện đúng câu lỗi. Nhắc nợ không có nút "Gửi" giả. `FinancePaymentPanel` giữ props |
| y2 | Danh sách Người thuê: dòng việc kế tiếp lấy từ dữ liệu thật, có nút theo trạng thái, 0 nút chính. Hồ sơ toà: "Việc kế tiếp" có 4 mức ưu tiên + ca rỗng. Khối điện nước bị ẩn với Chủ/QL. Ghi chú liên hệ gắn nhãn "cần backend". Dùng `HopDongThaoTac` / `QuanLyTaiSanPhong` mà không sửa hai file đó |
| y3 | Export `HopDongThaoTac` giữ nguyên. Tạo hợp đồng giữ payload cũ, nút bị chặn kèm danh sách còn thiếu. `stylesCleanup.test.ts` qua mà không bị sửa |
| y4 | 8 bước đúng theo trạng thái. Báo giá không bị dựng giả. Báo cáo: Đã gửi = Đã thu + Còn nợ. Export `SuCoQuanLy` giữ nguyên |
| y5 | Đủ 4 bước, mỗi bước có 1 nút chính. Bản vẽ bước sau có nhãn minh hoạ. Gửi hàng loạt không giả vờ gửi được một phần. Id `cong-to-*` giữ nguyên. Enter xuống ô phòng dưới |
| y6 | Không có QR hay STK giả. Không có "Tôi đã chuyển khoản". Trường hợp không nợ được làm. `Tieu` giữ props. Luồng Chủ/QL của `HoaDon.tsx` vẫn chạy |
| y7 | Báo đã sửa xong bắt buộc ghi "Đã làm gì" và gọi `baoXongViecTho`. Tiền công không có số cố định. 73 hex đã hết |
| y8 | Đăng nhập không hứa luồng chưa có. Không có quyền không in SĐT QTHT. Tìm nhanh ra được màn đã bỏ khỏi nav. Khoá tài khoản là `danger` |
| y9 | 3 lệnh quét: số trước và sau, chỗ còn giữ có lý do. 16+ route × 3 khung. `SO-V3.md` phủ 38 mã. `progress.md` đã cập nhật |

## E. Gộp
- [ ] Gộp theo thứ tự ở 05-00 §4. Sau **mỗi** lần gộp chạy đủ 3 lệnh. Chỉ gỡ xung đột trong `App*.test.tsx`; xung đột ở file khác thì trả lô.
- [ ] Sau khi gộp đủ đợt 1, chụp lại 6 ảnh của y0 để chắc khung không bị lô sau làm vỡ.
