# Brief — LẬP PLAN THI CÔNG V3 vào code frontend (Opus: plan + tiêu chí review, KHÔNG tự code app)

Chủ tịch đã **DUYỆT toàn bộ V3** (`docs/design/ui-redesign/v3/`), lấy hết đề xuất của 7 câu hỏi trong `v3/README.md`. V3 thay v2 ở: font IBM Plex Sans, nút chính màu mực đen (bỏ teal/nền kem), gom tiền theo người, trang đầu theo câu hỏi người dùng, 3 mật độ (Quản lý dày / Chủ điện thoại vừa / Người thuê+Thợ thoáng).
Việc của bạn: biến V3 thành **plan thi công** cho coder Sonnet chạy song song trong worktree riêng. Không viết code app; được viết mã mẫu (như `ux-v2/plans/ma-mau/`) nếu giúp coder bớt đoán.

## Đọc trước
- `v3/README.md`, `01-chan-doan.md`, `02-workflow.md`, `03-he-thiet-ke.md`, `QA.md`, `prototype/{index.html,v3.css,app.js,app2.js,data.js}`, `screens/png/*`, `compare/*`.
- Cách đã làm đợt v2 (học theo, đừng làm lại): `ux-v2/plans/04-00-tong-quan.md`, `ux-v2/plans/briefs/_common-04.md`, `04-review-checklist.md`, `ux-v2/shots/x*/BAO-CAO.md`, `docs/design/ui-redesign/progress.md`.
- Code thật: `frontend/src/{App.tsx,roleNavigation.ts,dinhTuyen.ts,toaDangChon.tsx,design/**,tokens/**}` và các màn đã có (HomNay, ThuTien, HoSo*360, ChuKyThang, TrangSuCo, TaoHopDong, CanTra, ThoCongViec, BaoHongKhach, …) + test. Hiện nhánh `feat/v3` (= `feat/ui-tokens` HEAD v2, 617 test). Chạy `npx tsc -b && npx vitest run` để lấy mốc.
- App demo http://localhost:5190 chạy sẵn trên macOS (chỉ GET; mật khẩu demo ở dòng 8 `docker-compose.demo.yml`, không in ra).

## Bối cảnh đã quyết (không hỏi lại)
- Thi công theo V3, **không đổi quyền, route, API backend**; route cũ còn chạy. Thứ cần API mới (QR/số tài khoản cho người thuê, nhắc nợ, lịch sử liên hệ, số "thu tháng này" lệch giữa `thucThu` và `daThuHopDong`…) → làm tạm phía client hoặc ẨN, dùng nhãn trung thực; không để nút chết; không dựng số giả như thật. Ghi bảng "Phụ thuộc backend" và đề xuất việc backend riêng (có thể một lô nhỏ backend sau cùng, nêu rõ).
- Font: IBM Plex Sans (OFL) tự host woff2 (prototype có `prototype/fonts/`, 9 file). Màu/token theo `03-he-thiet-ke.md`.
- Guard test (`designTokens.test.ts`, `stylesCleanup.test.ts` + 4 guard cấm mono/IN HOA) hiện khoá Inter/teal → **lô nền được sửa guard theo V3**, ghi từng thay đổi và lý do; không xoá guard, chỉ cập nhật giá trị.
- Test cũ chỉ sửa khi UI đổi hợp lệ (ghi lý do từng test); không xoá test; sửa quá ~30 test ở một lô thì dừng báo controller.
- Phần V3 chưa vẽ (cài đặt giá dịch vụ, lịch xem phòng, PCCC, báo cư dân, nhật ký, Thợ báo sửa xong, trạng thái "không nợ"): plan nói rõ **giữ màn cũ, chỉ ăn token/khung mới** hay làm mới tối thiểu theo token V3 (dùng bảng chung), kèm lý do.
- 2 màn V3 tự nhận chưa đạt "3 giây" (danh sách Người thuê, Hồ sơ toà): plan đề xuất cải thiện cụ thể (một dòng mô tả việc kế tiếp ở đầu trang + hành động chính theo trạng thái), không để nguyên.

## Cần ra (trong `docs/design/ui-redesign/v3/plans/`)
1. `05-00-tong-quan.md`: thứ tự, phụ thuộc, ma trận **file → lô sở hữu** (không file nào hai lô cùng sửa; `App.tsx`/`dinhTuyen.ts`/`roleNavigation.ts`/`tokens/**`/`design/**` chỉ lô nền), cách gộp, cổng kiểm giữa đợt, rủi ro, ước thời gian/lô (≤ 45–60 phút Sonnet).
2. **Lô nền (một coder, làm trước):** đổi token + font Plex + nút mực đen + 3 mật độ (cơ chế theo vai trò/khung: ví dụ `data-density` ở gốc), cập nhật `design/**` (Button, StatusTag, DataTable, Card, Field…, shell/nav) theo `03`, sửa guard, thêm component mới mà V3 cần dùng chung (ví dụ dòng người-nợ có nút Gọi/Nhắc, thanh bước, hàng tổng). Nêu rõ interface component để lô sau dùng.
3. Các lô song song sau nền, mỗi lô một nhánh `ui/y1…yN`, worktree `PRJ/MiniApart-yN`: Chủ nhà (Hôm nay, Tiền theo người, hồ sơ Người thuê/Toà/Phòng/Hợp đồng, Sự cố cần duyệt, Báo cáo; điện thoại 390), Quản lý (Chu kỳ tháng 4 bước đủ cả bước 2–4, Ghi chỉ số, Hoá đơn hàng loạt, Thu tiền, Tạo hợp đồng), Người thuê (Cần trả/Trả tiền/Báo hỏng/Hợp đồng/Lịch sử, 390), Thợ (Việc, chi tiết, báo giá, tiền công), Khung & Quản trị (đăng nhập, điều hướng, chọn toà, tìm nhanh, thông báo, rỗng/lỗi/mất mạng, không có quyền, tài khoản), lô dọn (màn "giữ", nợ UI, đo 1440/1024/390, cập nhật `progress.md`). Chia để mỗi lô gọn.
4. Mỗi lô: `plans/briefs/05-<tên>.md` **tự đủ** cho coder (không đọc plan khác): mục tiêu, file được/không được sửa, bước, hành vi chi tiết trích từ prototype (số, nhãn, trạng thái rỗng/lỗi/tải), test phải thêm/sửa, lệnh kiểm (`npx tsc -b`, `npx vitest run`, `npm run build`), tiêu chí nghiệm thu đo được (ảnh `tools/app-shot.mjs` 1440/390 + so ảnh prototype cùng mã, overflow 0, vùng chạm, tương phản, chữ ≥ 13px/≥16px thân cho Người thuê+Thợ), ràng buộc (không push, không POST/PUT/DELETE app thật ngoài đăng nhập, không merge, mỗi task một commit, **không in mật khẩu/token ra output**, tên file mới không trùng chỉ khác hoa/thường vì cần chạy được cả Windows).
5. `plans/05-review-checklist.md`: tiêu chí em review từng lô (gồm cốt lõi V3: mật độ đúng vai trò, nút chính mực đen và tối đa 1/màn, tiền gom theo người, không còn Inter/teal sót, không chữ IN HOA hét, nhãn "minh hoạ"/trung thực với phần thiếu backend).
6. Môi trường: macOS (có cả Windows cũ). Lệnh trong brief dùng đường dẫn `~/Documents/PRJ/...`, không dùng `C:/`.

## Ràng buộc
Chỉ ghi trong `docs/design/ui-redesign/v3/plans/`. Không sửa `frontend/src`, không commit, không đổi nhánh, chỉ GET app thật. Cuối: bảng đầu ra, quyết định tự đặt ("Em chọn"), rủi ro, điều chưa kiểm. Báo cáo ngắn.
