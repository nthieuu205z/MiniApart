# Brief — LẬP PLAN THI CÔNG UX v2 vào code frontend (Opus: plan + tiêu chí review, KHÔNG tự code app)

Chủ tịch đã DUYỆT toàn bộ UX v2 (cả 8 câu hỏi trong `ux-v2/README.md`, lấy hết đề xuất). Việc của bạn: biến bản xem trước thành **plan thi công** cho các coder Sonnet chạy song song trong worktree riêng. Không viết code app; được viết mã mẫu (như `plans/ma-mau/` đợt trước) nếu giúp coder bớt đoán.

## Đọc trước
- `docs/design/ui-redesign/ux-v2/{README,01-nhiem-vu,02-kien-truc-thong-tin,03-ho-so-va-luong,QA}.md`, `prototype/{index.html,app.js,ux.css}`, `screens/png/*`, `compare/*`.
- Cách đã làm đợt trước (học theo, đừng làm lại): `docs/design/ui-redesign/plans/{00..03}-*.md`, `plans/briefs/_common-03.md`, `progress.md` (ledger + nợ UI còn lại).
- Code thật: `frontend/src/{App.tsx,roleNavigation.ts,design/**}`, các màn hiện có (Hợp đồng, Hoá đơn, Thu tiền, Công nợ, Người thuê, Phòng, Sự cố, Ghi chỉ số, Dịch vụ và kỳ, thợ, khách thuê…), test liên quan. Đo kích thước file (App.tsx, HopDongThaoTac.tsx 2.745 dòng…) để chia lô hợp lý.
- App chạy ở http://localhost:5190 (chỉ GET; đăng nhập 5 vai trò xem `docker-compose.demo.yml`), tool chụp `tools/app-shot.mjs`.

## Bối cảnh đã quyết (đừng hỏi lại)
- Giữ hệ thiết kế (token, component `design/**`). **Font: Chủ tịch đổi sang bộ font mới do em (người điều phối) làm riêng ở lô "Font" — KHÔNG đụng `tokens/`, `assets/fonts`, `@font-face` và không viết chữ font cụ thể trong CSS lô của bạn; chỉ dùng `var(--font-sans)` / class hiện có.**
- KHÔNG đổi quyền, route, API backend. Route cũ phải còn chạy (redirect tới vị trí mới). Thứ cần API mới (tìm kiếm server, nhắc nợ, QR, khách báo đã trả…) làm tạm phía client bằng dữ liệu đã tải; mục không làm được tạm thì ẨN, không để nút chết.
- Test cũ chỉ sửa khi UI đổi hợp lệ, ghi lý do; không xoá test. Giữ các guard `designTokens.test.ts`/`stylesCleanup.test.ts` xanh.
- 5 vai trò: CHU, QUAN_LY, THO, NGUOI_THUE, QTHT. Phần chưa vẽ chi tiết ở prototype (Lịch hẹn, An toàn PCCC, Báo cáo, các danh sách, Chu kỳ tháng bước 2–4): plan phải nói rõ **giữ màn cũ đặt vào khung mới** (di chuyển, không vẽ lại) hay làm mới, và vì sao.

## Cần ra
1. `plans/04-00-tong-quan.md`: thứ tự và phụ thuộc giữa các lô, ma trận **file → lô sở hữu** (không file nào 2 lô cùng sửa; chỗ chung như `App.tsx`/`roleNavigation.ts` chỉ lô nền sửa), cách gộp, cổng kiểm giữa các đợt.
2. Lô nền (một coder, làm trước, gộp xong mới chạy các lô sau): khung mới (sidebar nhóm theo việc, chọn toà dùng chung + nhớ trong localStorage, Ctrl+K tìm client-side, chuông có số, bỏ thanh trên + breadcrumb lặp, mobile menu), ánh xạ 44 mục cũ → mới + redirect route cũ, `NavPanel`/`TopBar` mới, context toà. Nêu rõ giao diện (interface) context/hook để các lô sau dùng.
3. Các lô song song sau nền, mỗi lô một nhánh `ui/x1…xN`: Thu tiền (gộp 3 màn), Hồ sơ 360° (Người thuê/Phòng/Hợp đồng/Toà) + Hôm nay (Chủ/QL), Chu kỳ tháng (4 bước, gộp kỳ + ghi chỉ số + phát hành), Sự cố (một danh sách + ngăn chi tiết phải), mobile (thợ, khách thuê 3 tab, ghi chỉ số), cuối cùng lô dọn (nợ UI còn lại ở `progress.md`, đo 1440/390/1024). Chia lô sao cho mỗi lô khoảng ≤ 45 phút Sonnet.
4. Mỗi lô: `plans/briefs/04-<tên>.md` tự đủ cho coder (không đọc plan khác): mục tiêu, file được/không được sửa, bước làm, hành vi chi tiết lấy từ prototype (trích số, nhãn, trạng thái rỗng/lỗi), test phải thêm/sửa, lệnh kiểm (`npx tsc -b`, `npx vitest run`, build), tiêu chí nghiệm thu đo được (ảnh `app-shot` 1440/390 nào, overflow 0, vùng chạm, tương phản), ràng buộc (không push, không POST/PUT/DELETE app thật ngoài đăng nhập, không merge ra ngoài worktree, mỗi task một commit).
5. `plans/04-review-checklist.md`: tiêu chí em dùng review/nghiệm thu từng lô (gồm các điều UX cốt lõi: tối đa 1 nút chính, bấm hàng vào hồ sơ, không form dưới danh sách, toà chọn một lần, số bước ≤ bảng trước/sau).
6. Mã mẫu cho phần khó (context toà + Ctrl+K, bảng nhóm theo người có hàng tổng, redirect route cũ) nếu hữu ích, kèm test chạy thật.

## Ràng buộc
Chỉ ghi trong `docs/design/ui-redesign/ux-v2/plans/`. Không sửa `frontend/src`, không commit, không đổi nhánh, chỉ GET app thật. Cuối: bảng đầu ra, quyết định tự đặt ("Em chọn"), rủi ro, điều chưa kiểm. Báo cáo ngắn.
