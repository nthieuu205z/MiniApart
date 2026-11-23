# x14 — Tách thao tác hợp đồng + lỗi "Không tìm thấy toà"

1. Việc/commit
- 0abeddd: HopDongThaoTac nhận `thaoTac` (chỉ khi `embedded`) và chỉ vẽ đúng phần; export `GiaHanHopDong, KyHopDong, ThanhLyHopDong, PhuLucHopDong, NguoiOCungHopDong` (token, buildingId, hopDong, onXong). Payload/API/điều kiện nút không đổi; màn cũ không truyền `thaoTac` nên y nguyên. HoSoHopDong360: nút chính + mục "…" mở ngăn đúng thao tác, tiêu đề khớp, đóng ngăn → tải lại hồ sơ.
- (commit 2): lỗi "Không tìm thấy toà": KHÔNG tái hiện được → chưa sửa code gốc, chỉ thêm test chặn (xem 5).
- (commit 3): chữ/vùng bấm ở ngăn đạt sàn (người ở cùng: 11–12px → 13px, nút nhanh minHeight 44, nhãn ô tích minHeight 44).
2. Kiểm: `tsc -b` rc=0; `vitest run`: Test Files 73 passed, Tests 616 passed; `npm run build` ok.
   Test mới: HopDongThaoTacCon.test.tsx (5: gia hạn → POST /api/hop-dong/1/gia-han {ngayKetThuc, giaThue:null}; thanh lý → khoá tới khi tích xác nhận, POST …/thanh-ly; ký/phụ lục/người ở cùng chỉ hiện đúng khối); HoSoHopDong360.test (+3: nút Gia hạn/Ký mở đúng ngăn + đóng thì tải lại; menu mở Thanh lý/Phụ lục/Người ở cùng; Khoản phát sinh → /hoa-don, Giao dịch cọc → /thu-tien); HoSoToa360.test (+1).
3. Ảnh (qa: overflow 0, belowHit 0, contrast 0, textBelowFloor 0 ở cả 27 ảnh — qa-ngan.json, qa-toa.json)
- `14-hd{9 sắp hết hạn|10 chờ ký|1 bình thường}-<trạng thái>-<thao tác>-{1440|390}.png`: ngăn Gia hạn (#9), Ký (#10), Thanh lý/Phụ lục/Người ở cùng (cả 3). Đã mở xem: gia hạn 1440, ký 390, phụ lục 1440, người ở cùng 390 — đúng thao tác, không cắt chữ. Khác prototype 08: ngăn còn nền/khung kiểu cũ của màn thao tác (đã tách phần, chưa vẽ lại theo prototype).
- `14-ho-so-toa-{chu-1440,chu-1024,chu-390,ql-1440,ql-390}.png`: hồ sơ toà 3 hiển thị đúng.
- Ngăn Ký trên hợp đồng nháp (#10) hiện luồng "chốt hồ sơ" trước (đúng logic cũ: chốt rồi mới ghi nhận ký).
4. Test cũ phải sửa: không có.
5. Chưa làm / chưa kiểm
- "Khoản phát sinh" và "Giao dịch cọc" không có thao tác riêng cấp hợp đồng trong HopDongThaoTac → mục menu điều hướng sang /hoa-don và /thu-tien (trước đây mở màn cũ).
- Lỗi "Không tìm thấy toà": thử trên app thật (tai-hien-loi.mjs): CHU với ma.toaNhaId = 999/1/abc/rỗng, đổi vai CHU→QL không tải lại, vào thẳng /toa-nha/3 sau đăng nhập — đều hiện đúng. HoSoToa360 không dùng ToaDangChonProvider/ma.toaNhaId, chỉ tra `GET /api/toa-nha` theo token. Nghi do danh sách toà trả thiếu tạm thời từ backend demo lúc chụp (chưa chứng minh). Nếu muốn cứng hơn: gọi `GET /api/toa-nha/{id}` thay vì tìm trong danh sách (cần sửa 2 test cũ).
- Không bấm nút ghi nào trên app thật; luồng ghi chỉ chứng minh bằng mock fetch. Chưa chạy ngăn Ký sau khi chốt (cần ghi).
