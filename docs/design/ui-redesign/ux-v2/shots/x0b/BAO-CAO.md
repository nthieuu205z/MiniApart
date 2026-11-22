# x0b — lề trang, tab, huy hiệu chuông, link Khai báo phòng
1. Lề: App.tsx bỏ đệm inline + nhánh laDashboardChu/KhongDem; ux-v2.css thêm `.ma-vung-noi-dung` (24px trên / 32px ngang; ≤767px: 16px/16px) + triệt `.topbar` cũ tự đệm 12px ở mobile; HomNay.css bỏ khối margin âm của Quản lý.
2. Tab: `.ma-vung-noi-dung > .tabs-trang` kéo ngược đệm trên → thanh mỏng sát thanh trên (8px), cách khối trang 16px ở mọi màn có tab. Không sửa file màn.
3. Chuông: huy hiệu top:-6px right:-8px (lệch góc, không che icon); vùng bấm 44px ở mobile giữ nguyên. ChuongThongBao.tsx (x7) không đụng.
4. Khai báo phòng: Chủ không có route /phong, không có chỗ nào khác khai báo phòng (ho-so-phong chỉ xem) → ẩn nút với Chủ, giữ cho Quản lý. (Câu rỗng "Dùng nút Khai báo phòng" ở HoSoToa360 dòng 126 vẫn hiện với Chủ — ngoài phạm vi một dòng.)
Đo bằng `do-le.mjs` (sau.json): toạ độ [left, top] của khối đầu trang (con đầu tiên của vùng nội dung, trừ thanh tab), 16 đường dẫn × CHU/QUAN_LY × 1440/390:
| nhóm | 1440 | 390 |
|---|---|---|
| màn không tab (hom-nay, nguoi-thue/1, hop-dong, hop-dong/9, toa-nha, toa-nha/3, phong/1, chu-ky, su-co, lich-hen, an-toan, /phong) | [320,96] | [16,84] |
| màn có tab (thu-tien, thu-tien?tab=hoa-don, nguoi-thue, bao-cao) | [320,133], tab [320,72] | [16,129], tab [16,68] |
Hai vai trò giống hệt, lệch 0px. h1 của màn thường trùng khối; trang hồ sơ (người thuê/hợp đồng/toà/phòng) h1 lệch phải/xuống do breadcrumb+avatar của chính màn. /bao-cao với Quản lý ra "không có quyền" (đúng quyền hiện tại, bỏ khỏi đo).
Kiểm: tsc -b sạch; vitest 63 files / 543 tests passed; npm run build xong.
Ảnh (1440+390, đã xem): hom-nay/thu-tien/nguoi-thue/hop-dong/toa-nha-3/bao-cao (Chủ), hom-nay/phong (QL). qa.json: overflow 0, belowHit 0, contrast.below 0, textBelowFloor 0. Tab sát thanh trên, tiêu đề dưới tab; huy hiệu 25 (QL 390) nằm góc trên-phải, không che chuông.
Test sửa: HoSoToa360.test.tsx "Cần chú ý…" — test cũ khoá link Khai báo phòng cho Chủ; nay Chủ không có nút, Quản lý vẫn có (ngoài danh sách file, bắt buộc theo yêu cầu 4). App.test.tsx không thêm test.
Chưa làm/kiểm: không ảnh full-page; QTHT/Thợ/Khách không đo lề; không ảnh prototype so sánh.
