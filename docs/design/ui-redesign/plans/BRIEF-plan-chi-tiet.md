# Brief — viết PLAN CHI TIẾT áp thiết kế UI mới vào frontend MiniApart

Bạn là planner (chỉ đọc code + viết plan; KHÔNG sửa code sản phẩm). Chủ tịch đã duyệt bản design tổng quan và chốt cả 11 câu theo đề xuất (xem `docs/design/ui-redesign/README.md`, mục "Đã duyệt").

## Bối cảnh
- Repo/worktree: `C:/Users/nthieuu05/Documents/PRJ/MiniApart-ui`, nhánh `feat/ui-tokens` (đã có overlay token + font Việt, commit f39bad2, 252/252 test, build qua).
- Design nguồn sự thật: `docs/design/ui-redesign/` — `assets/tokens.css`, `assets/components.css`, `design-system.html`, `screens/*.html` + `screens/png/*.png` (9 màn khung), `screen-inventory.md` (44 mục → 5 mẫu bố cục), `02-he-thong-thiet-ke.md`, `01-phan-tich.md`, `QA.md`.
- Figma: https://www.figma.com/design/TmeM2tYjtvMc0L3osPC0ab (chỉ tham khảo; HTML mới là nguồn).
- Frontend: React 19 + Vite 8 + TS, test vitest (`cd frontend && npm test`, `npm run build`). File lớn: `HopDongThaoTac.tsx` ~2745 dòng, `App.tsx` ~1335 dòng, `styles.css`. Có `frontend/src/design/` và `designComponents.test.tsx`, `designTokens.test.ts` (guard).
- Demo có dữ liệu: stack `miniapart-prj1demo` ở http://localhost:5190 (đăng nhập 5 vai trò, SĐT/mật khẩu trong `docker-compose.demo.yml`). Chỉ GET.

## Việc cần giao: 4 plan, mỗi plan một file trong `docs/design/ui-redesign/plans/`
Theo thứ tự Chủ tịch đã chốt:
- `00-nen-gitattributes-va-component.md` — (0) thêm `.gitattributes` (`* text=auto eol=lf`, ngoại lệ nhị phân) để hết lỗi CRLF làm đỏ `stylesCleanup.test.ts` trên worktree; (0b) bộ component dùng chung theo `assets/components.css` (Button, Chip/StatusTag, Card, Table + bulkbar + phân trang, Field/Input, Sidebar nhóm, BottomNav, TopBar, Empty/Skeleton/Error) đặt ở chỗ code hiện có (`frontend/src/design/`) — đọc code để dùng lại cái đã có thay vì viết song song.
- `01-bang-hop-dong-va-3-man-mobile.md` — (b) bảng Hợp đồng (màn 05), Ghi chỉ số mobile (06), Thợ mobile (07), Khách thuê hoá đơn mobile (08). Ngưỡng cảnh báo tiêu thụ dùng đúng logic backend `thongTinCanhBaoTieuThu` (không dùng 1,5×).
- `02-dashboard-chu-va-quan-ly.md` — (c) dashboard Chủ nhà (03), Nhắc việc/Quản lý (04), sidebar gom nhóm theo `frontend/src/roleNavigation.ts` (giữ nguyên đường dẫn + nhãn), bottom-nav Thợ nhãn "Báo giá".
- `03-man-con-lai.md` — (d) các màn còn lại theo `screen-inventory.md` (đăng nhập 01, tìm phòng 02, QTHT 09 và mọi mục khác), nhóm theo 5 mẫu bố cục, chia lô song song được (mỗi lô một worktree/nhánh).

## Khuôn mỗi plan (theo `superpowers:writing-plans`)
Đầu file: **Cần có trước**; **Trước khi thi công, kiểm lại với code thật** (tên file/hàm cụ thể); **Rủi ro**; **Không làm**.
Thân: chia task; mỗi task ghi file đụng tới, phải đạt gì ("anh sẽ thấy gì" + điều KHÔNG được xảy ra), test nào chứng minh (viết/đổi test cụ thể, giữ 252 test cũ xanh hoặc nêu rõ test nào đổi và vì sao), lệnh kiểm chính xác + kết quả mong đợi, cỡ (S/M/L), task nào chạy song song được.
Mỗi màn có tiêu chí nghiệm thu bằng ảnh: chụp từ app thật (stack 5190 hoặc vite dev trỏ proxy tới 5190) ở 1440 / 1024 / 390, so với `screens/png/*.png`; kèm kiểm tương phản, vùng chạm (44px mobile / 36px desktop), không cuộn ngang.

## Bắt buộc đo thật (ghi "lần kiểm <ngày>: …" vào plan, đừng chép từ trí nhớ)
- Chạy `npm test`, `npm run build` ở `frontend/` và ghi số test/kết quả.
- `git status`, `git log --oneline -5`.
- Liệt kê component hiện hữu cho từng màn (file, số dòng, test liên quan) và API/ kiểu dữ liệu mỗi màn dùng. Màn nào thiết kế đòi dữ liệu backend chưa có (vd cột/field mới) thì ghi thành điểm "phụ thuộc backend" + đề xuất, KHÔNG tự thêm vào plan như việc frontend.
- Xác nhận màn Thợ ở stack 5190 có rỗng không và vì sao (đã nghi `ThoBatchDemoSeeder` chưa chạy trong profile `presentation-demo`) — GET + đọc code seeder, không POST.

## Ràng buộc
- Chỉ ghi file trong `docs/design/ui-redesign/plans/`. Không sửa `frontend/src`, `backend`, compose, test; không commit; không đổi nhánh; không POST/PUT/DELETE vào backend demo.
- Không dùng model/route nào ngoài phiên này. Không nhận hay hỏi mật khẩu thật.
- Tiếng Việt, giữ thuật ngữ gốc (component, token, worktree…).
- Cuối cùng trả: bảng mỗi plan một dòng (số task, ra cái gì, làm được ngay hay chờ), danh sách quyết định em tự đặt để Chủ tịch bác, và các điểm phụ thuộc backend.
