# Báo cáo lô x2 — Hôm nay (Chủ + Quản lý)

Nhánh `ui/x2-hom-nay`, tách từ `5d643c1`. Ảnh thật qua vite 5312 → backend 5190 (chỉ GET; POST duy nhất là đăng nhập của app-shot).

## 1. Việc theo task
- **T1 Chủ** `1d2c76d`: `HomNay.tsx` dựng `.ph` + `.strip` 4 ô + 4 khối `.sec` + cột phải; mỗi khối một nguồn riêng (`useNguon`): đang tải `.skel`, lỗi riêng có "Thử lại" + "Dữ liệu chưa bị thay đổi.", rỗng riêng có tick. Không có nút chính. `HomNay.css`, 4 test.
- **T2 Quản lý** `85ffa3c`: dải số, Chu kỳ tháng (nút chính duy nhất "Ghi chỉ số" → `/chu-ky`), Việc cần làm (tự render `.irow` từ `fetchBangViecVanHanh`, không đụng `BangViecVanHanh`), Lịch hẹn + Cảnh báo điện nước lấy từ `fetchDashboardQuanLy` (đã có `lichHenSapToi`, `canhBaoDienNuoc` → không gọi thêm API). 2 test.
- **T3 390 + ảnh + sửa lỗi nhìn thấy** (commit này): ảnh 1440/390, so prototype, sửa 2 lỗi (xem §3).

## 2. Lệnh kiểm
```
npx tsc -b                      → 0 lỗi
npx vitest run                  → Test Files 60 passed (60) · Tests 504 passed (504)   (trước lô: 498; +6 test mới)
npx vitest run src/HomNay.test.tsx → Test Files 1 passed (1) · Tests 6 passed (6)
npm run build                   → ✓ built
git diff --stat 5d643c1...HEAD  → HomNay.tsx, HomNay.css, HomNay.test.tsx (+ App.test.tsx 1 dòng, shots/x2)
```
Đã gỡ thử mốc `<= 30` → `<= 31`: test hợp đồng đỏ (bắt được).

## 3. Ảnh (`ux-v2/shots/x2/`, qa.json: overflow 0, belowHit 0, contrast.below 0, textBelowFloor 0 cho cả 6)
| Mã | Đường dẫn · khung | Khác prototype |
|---|---|---|
| 01 | `01-chu-hom-nay-1440.png` | Lấp đầy ghi "27/36 phòng · 6 trống" (API `soPhongDangSua`=0 dù danh sách phòng có 3 đang sửa — dữ liệu backend lệch). Không có dòng "Không có báo giá nào chờ duyệt" (không có nguồn). "Kỳ tháng 11" là câu chung + ngày chốt, không có "còn 4 công tơ" (Chủ không có API này). Chờ ký trỏ `/hop-dong` (app chưa hỗ trợ `?loc=cho-ky`). "4 lịch hẹn xem" thay 5 (loại lịch đã huỷ). |
| 01b | `01b-chu-mot-toa-1440.png` | Mộc Lan Home: mọi khối chỉ còn 1 toà, thanh "theo toà" 1 dòng. Không có prototype. |
| 24 | `24-chu-hom-nay-390.png` | Dải 2×2, khối xếp dọc, cột phải xuống dưới, không cuộn ngang. Giống bản 24. |
| 10 | `10-ql-hom-nay-1440.png` | Số khác do dữ liệu (sự cố 14 vs 12; dải ghi "đang mở trong toà" thay "3 gấp hoặc khẩn cấp" — API không có). Tên công tơ giữ "Điện sinh hoạt" (prototype rút gọn). |
| 10 | `10-ql-hom-nay-390.png` | Xếp dọc, nút chính nhìn thấy, vùng bấm ≥44. |
| 10 | `10-ql-nhac-viec-1440.png` | `/nhac-viec` tự về Hôm nay (menu "Hôm nay" sáng). |

**Lỗi tự thấy và đã sửa:** (a) QL ở ≥768px bị đệm 40px của `App.tsx` (Chủ được đệm gọn `0 16px 24px`) → nội dung lệch phải/xuống 24/40px so với prototype: bù bằng margin âm trong `HomNay.css` (`.hom-nay-ql`). (b) 390: link "Mở chu kỳ" bị bẻ 3 dòng → `flex-wrap` + `nowrap`.

## 4. Test cũ đã sửa
- `App.test.tsx:121` ("FR-AUT-04 shows the manager shell…", **ngoài ma trận file**, 1 dòng): khẳng định `'được phân công'` thực ra khớp nhầm chữ "Tất cả toà được phân công" của `QuanLyDashboard` cũ (fixture trả 2 toà cho QL nên hộp toà không tĩnh). Đổi thành `.sb-toa` tồn tại; hộp toà tĩnh đã có test ở `designComponents.test.tsx:334`.

## 5. Cố ý không làm / chưa kiểm / cần controller
- **Cần controller (App.tsx, ngoài file tôi):** cho Quản lý dùng chung đệm với Chủ ở `hom-nay` (`laDashboardChu` chỉ tính `CHU`). Khi sửa xong thì xoá khối `@media … .hom-nay-ql` cuối `HomNay.css`, nếu không sẽ lệch ngược.
- Khung x0: **không thấy** TabTrang phía trên tiêu đề trong ảnh Chủ/QL (không có tab nào hiện), nên không có chênh lệch để ghi. Chuông QL: huy hiệu "25" chồng lên chuông (khung/x7, không sửa).
- Dấu chấm bước 3–4 của Chu kỳ tháng QL không có nguồn dữ liệu (chỉ biết bước 1 từ số công tơ) → để xám; có ghi chú `shortcut:` trong code.
- Không sửa `QuanLyDashboard.tsx`/`BangViecVanHanh.tsx` (còn dùng ở `App.tsx`/đã không còn gắn vào Hôm nay); test của chúng nguyên vẹn.
- Chưa kiểm: trạng thái lỗi/rỗng trên app thật (chỉ bằng test mock); ảnh 1180/1024; chọn toà QL khác (demo chỉ có 1 toà).
- Dev server 5312 đã tắt.
