# Báo cáo lô x6 — Sự cố (nhánh ui/x6-su-co)

1. Việc: T1+T2+T3 gộp 1 commit (`d5038d2`) + `data-repair-detail` (commit sau) + sửa nhỏ ngày/toà/đầu ngăn mobile (commit cuối). `/su-co` = `SuCoQuanLy` (bỏ `LichSuSuaChua` khỏi trang). `.ph` + nút phụ "Báo sự cố"; chip Đang mở/Cần phân công/Đang sửa/Đã đóng có số đếm; khẩn cấp lên đầu rồi mới nhất; tìm không dấu; hàng `.irow` là `<a href="/su-co?id=&loc=">`; ngăn `.split/.drawer` 6 bước; nút chính theo bước; ≤1180 ngăn phủ `role=dialog` + Esc + trả focus (`useDialogTrap`); ≤767 toàn màn.
2. URL x3: `?yeuCauId=` (và `?id=`) mở ngăn (tự sang chip Đã đóng nếu đã đóng; không có trong toà thì `fetchChiTietSuaChua`); `?baoMoi=1&phongId=` mở form báo mới có sẵn phòng. Có test.
3. Nút chính: MOI → Tiếp nhận yêu cầu (`tiep-nhan`) · DA_TIEP_NHAN → Phân công thợ (`phan-cong`, chặn tới khi chọn thợ) · báo giá chờ duyệt → Duyệt báo giá (bấm nút "Phê duyệt báo giá" thật của `QuanLyBaoGiaVaThanhToan`, vẫn qua `confirm`) · CHO_XAC_NHAN → Nghiệm thu (`xac-nhan-dong`) · đã đóng còn nợ thợ → Xác nhận thanh toán thợ (bấm "Ghi nhận trả thợ"). Khảo sát/đang sửa: không nút, có dòng chờ thợ. Huỷ: nút phụ → ô lý do bắt buộc → `huy`.
4. Kiểm: `npx tsc -b` sạch · `npx vitest run` → xem dòng cuối chat · `TrangSuCo.test.tsx` 13 test · `npm run build` ok.
5. Ảnh (app thật, vite 5316 → 5190, qa.json: overflow 0, belowHit 0, contrast.below 0 cả 7):
| ảnh | khung | khác prototype `13` |
|---|---|---|
| 13-ql-su-co-1440 | 1440 | Cùng bố cục. Lề trang/tab khung lệch (x0b, không bù). Thẻ "Mới tiếp nhận" tông xanh lá (StatusTag `strong`) thay vì xanh dương; chip & ô tìm xuống dòng như prototype; cuộn trong ngăn nên khối chi phí nằm dưới nếp gập |
| 13-ql-su-co-xong-1440 | 1440 | Ngăn đã đóng có Lịch sử; còn nợ thợ nên vẫn có nút "Xác nhận thanh toán thợ" (prototype không có ca này) |
| 13-ql-su-co-moi-1440 | 1440 | Form báo sự cố trong ngăn (prototype không vẽ) |
| 13-chu-su-co-tat-ca-1440 | 1440 | "Tất cả 3 toà": gộp 3 toà, hàng hiện tên toà |
| 13-ql-su-co-1180-ngan | 1180 | Ngăn phủ bên phải + nền mờ + nút đóng |
| 13-ql-su-co-390-ds / -ngan | 390 | Danh sách một cột; ngăn toàn màn, đầu ngăn 1 dòng (mã bị cắt …) |
6. Test cũ sửa (`QuanLySuaChua.test.tsx`, vì giao diện đổi, không đổi API): "liệt kê mọi yêu cầu" — yêu cầu đã đóng nay nằm sau chip Đã đóng; "đã đóng không còn nút" — đóng nay chỉ đọc nên không còn "Lưu chi phí" (brief); "form báo sự cố" — nút "Báo sự cố mới"→"Báo sự cố"; helper `mo` bấm hàng thay nút "Mở". `App.test` điều hướng từ báo cáo chi phí giữ nguyên nhờ `data-repair-detail` ở ngăn.
7. Không làm: "Nhắc thợ" (chưa có API). Không gọi `fetchLichSuSuaChua` (lịch sử đóng dựng từ mốc thời gian có sẵn trong yêu cầu). Chưa kiểm: bấm lệnh ghi trên 5190 (cố ý, chỉ test mock); focus trả về hàng khi Esc chỉ kiểm bằng `useDialogTrap`, chưa có test riêng.
