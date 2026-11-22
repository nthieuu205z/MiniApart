# x12 — Dọn + đo toàn bộ (nhánh ui/x12-don)
**Việc/commit:** T1 toà khung (e822dea) · T2 nợ UI + lề Thợ (6027f99) · T3 đo + T4 mồ côi/progress (commit cuối, shots/x12).
**Kiểm:** `tsc -b` sạch · `vitest run`: Test Files 72 passed, Tests 606 passed (601 → +5 ca mới `ToaKhungManLoc.test.tsx`) · `npm run build` qua.

## T1 — ô chọn toà → toà khung
- Bỏ ô toà + `fetchToaNha` ở: `QuanLyLichHen`, `TieuThuBaoCao`, `ChiPhiBaoTriBaoCao`, `BaoCaoTongQuan` (hook mới `useToaKhung.ts`: bộ lọc đi theo toà khung, ngoài khung vẫn đọc URL). `ChuDashboard`: trong khung dùng toà khung, ngoài khung (test lẻ) tự tải như cũ. `QuanLyTaiKhoan` giữ `fetchToaNha` (gán toà cho tài khoản, không có ô lọc trùng). `GhiChiSo` đã theo toà khung qua `useBuildings` (không cần sửa; ô tại chỗ chỉ hiện khi Chủ ở "Tất cả toà"). `HoSoToa360`: câu "Khai báo phòng" chỉ hiện với Quản lý.
- Test mới (5): đổi toà ở khung → gọi `/api/lich-hen|tieu-thu|chi-phi-bao-tri|tong-quan|dashboard/chu?...toaNhaId=2`, và không còn ô chọn toà riêng.
## T2
- Lề Thợ: wrapper `padding:24px 20px; margin:0 auto` ở `ThoCongViec` và `ThoChiPhi` (auto-margin co khung 313px trong lưới → lề 38px; desktop +20px) → bỏ. Đo getBoundingClientRect Thợ 390 `/viec-cua-toi`: h1 left 16, thẻ đầu left 16/right 16; 1440: h1 left 320 (trước 340).
- h1 đôi: ở 390 khung đã có h1 (tên tab) → tiêu đề màn thành h2 ở `ThoCongViec`, `ThoChiPhi` (mobile). Báo cáo 5 tab/Cư trú: đo thấy khung KHÔNG có h1 ở 1440 → giữ h1 của màn (đúng 1 h1/trang).
- Chữ: `fontSize` 11–12.5 → 13 ở `ThoCongViec`, `QuanLyTaiSanPhong`; chữ HOA ở `QuanLyTaiSanPhong` → chữ thường. Cố ý giữ HOA ở phiếu in `ThoChiPhi` (chứng từ in).
## T3 — đo (168 job = mọi khoá trang × vai × 1440/1024/390, full) + 42 đường dẫn cũ (1440)
- 168/168: overflow 0, belowHit 0, contrast.below 0, textBelowFloor 0, `.btn-primary` ≤ 1/trang. Bảng đầy đủ: `BANG-DO.md`; dữ liệu `qa.json`, `img-cu/qa-cu.json`; ảnh `img/*.png`.
- 42/42 đường dẫn cũ: 0 "Không có quyền", 0 tràn ngang (5 đường tự chuyển: /ghi-chi-so×2→/chu-ky, /cong-no→/thu-tien, /nhac-viec→/hom-nay, /tho/tong-quan→/viec-cua-toi).
- Lề (l/r px, h1 / thẻ đầu): **Thợ** 1440 320/321, 390 16/16 · **Khách** 390 mọi trang 16/16; 1440 `Cần trả` bảng l=349, `Báo hỏng` form l=536 (căn giữa), 2 trang này 0 h1 · **QTHT** 1440 320/320, 390 16/16 · Chủ/QL 1440 320, 390 16 (Hôm nay: thẻ đầu ở cột phải, theo thiết kế; hồ sơ 360: h1 sau nút quay lại l=392/88).
- Trước/sau (01-nhiem-vu): ghi chỉ số 11.151px/18 nút → QL 390 `/chu-ky` 1.198px/1 nút · Công nợ 4.134px → `/thu-tien` Chủ 1440 1.216px/1 nút (390: 1.732px) · Sự cố 1440 Chủ 1.675px/0 nút (bấm hàng mở ngăn) · Hồ sơ người thuê 1.079→1.760px → `/nguoi-thue/1` 1.569px/1 nút · Khách phải trả 390: 1.562px/0 nút → `/hoa-don-cua-toi` 1.389px/1 nút · Thợ 390 4.135px/0 nút → `/viec-cua-toi` 1.402px/1 nút. Số bước: lấy từ thiết kế/test từng lô, chưa đo lại bằng thao tác (backend chỉ GET).
## T4 — file mồ côi (không xoá, chờ Chủ tịch)
`QuanLyDashboard.tsx` 707 dòng (+test; import: App chỉ import không render) · `ThoTongQuan.tsx` 332 · `ViecCuaToi.tsx` 318 · `LichSuSuaChua.tsx` 272 · `CongNoBaoCao.tsx` 158 · `BangViecVanHanh.tsx` 154 (+ `QuanLyDashboard` import) · `QuanLySuaChua.tsx` 40 (test `QuanLySuaChua` + `managementFlows`). Tất cả còn `import` thừa trong `App.tsx` (cùng `GhiChiSo`: không render trực tiếp nhưng vẫn dùng qua `ChuKyThang`).
## Test cũ đã sửa
- `QuanLyTaiSanPhong.test.tsx:139` 'BÀN GIAO NHẬN PHÒNG' → 'Bàn giao nhận phòng' (đổi chữ HOA theo brief).
## Phát hiện ngoài lô (không sửa)
- Khách desktop (≥768) `/hoa-don-cua-toi` vẫn chỉ kỳ mới nhất (nợ cũ bị giấu); Thợ desktop vẫn bảng cũ.
- 0 h1: Khách `can-tra`, `bao-hong` (1440/1024); QTHT `/hoa-don` trang trống ở cả 3 khung (0 h1, 0 nội dung). 2 h1 ở 390: Khách `hop-dong-cua-toi`, `lich-su`, `tieu-thu`; Thợ/Khách `thong-bao`.
- Hồ sơ toà 1024/390 trong phiên chụp liên tục của Chủ/QL từng ra "Không tìm thấy toà" dù chụp riêng (cùng id 3) thì đúng; chưa tái hiện (nghi chặn tải/tốc độ), ảnh chính thức lấy từ lượt chụp riêng.
## Chưa làm/chưa kiểm
Số bước thao tác thật; GhiChiSo chưa có test "đổi toà ở khung" riêng (đã theo khung từ trước); file mới ngoài danh sách sở hữu: `useToaKhung.ts`, `ToaKhungManLoc.test.tsx`.
