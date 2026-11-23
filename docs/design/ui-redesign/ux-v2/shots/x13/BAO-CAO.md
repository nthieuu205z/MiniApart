# Báo cáo lô x13 — Khách thuê + Thợ trên máy tính

## Việc / commit
1. `beb3407` Khách desktop: `/hoa-don-cua-toi` dùng CanTra (2 cột ≤960px: danh sách MỌI kỳ nợ | khung tổng + 1 nút "Trả …"), trang Trả tiền cột 560px; chi tiết một kỳ (`?hoaDonId`) trên desktop giữ bảng đối chiếu cũ.
2. `5482e13` Khách: số tiêu thụ/chỉ số qua `dinhDangSo` (hết 96.00), `Tieu` (h1 desktop / h2 mobile) cho CanTra, Lịch sử, Hợp đồng, Tiêu thụ, Báo hỏng → mỗi trang đúng 1 h1 ở 1440/1024/390.
3. `45f5fa9` Thợ: `/viec-cua-toi` bỏ bảng + tab cũ, thẻ việc lưới 2–3 cột + chip Gấp/Đang làm/Xong; trên 390 tiêu đề trang chuyển sr-only (thanh trên "Việc" là h1 duy nhất). ThoChiPhi: lưới KPI 1.35fr+3 (số công nợ hết sát mép), placeholder ngắn.
4. commit cuối: sửa test App theo UI mới.

## Kiểm
- `npx tsc -b`: sạch. `npm run build`: ok.
- `npx vitest run`: Test Files 72 passed, Tests 608 passed.
- Test mới: CanTra "máy tính: một h1, nợ cũ, một nút chính, không IN_HOA_GẠCH_DƯỚI"; BieuDoTieuThu (không số thô, không enum, h1); ThoCongViec (lưới thẻ + một h1, drawer mở từ thẻ).
- qa.json (26 ảnh): overflow 0, belowHit 0, noAccessibleName 0, textBelowFloor 0, contrast.below 0. Quét app thật: h1=1 mọi ảnh, không chuỗi IN_HOA_GẠCH_DƯỚI, không số dạng 1234.00 (trừ chữ do backend trả về).

## Ảnh (shots/x13/, app thật qua vite 5323)
| Màn | Khung | Ghi chú |
|---|---|---|
| khach-can-tra | 1440/1024/390 | 2 cột (1024 cũng 2 cột), 4 kỳ nợ, nút "Trả 7.580.000 ₫" duy nhất; mobile như x10 |
| khach-tra-tien | 1440/1024/390 | cột 560px, nội dung CK, không QR/số TK giả |
| khach-lich-su, khach-hop-dong, khach-tieu-thu, khach-bao-hong, khach-thong-bao | 1440/1024/390 | bố cục giữ, h1 duy nhất, số tiêu thụ "96 kWh" |
| tho-viec | 1440/1024/390 | lưới 3 cột (1440), thẻ như prototype 20; 390 không còn tiêu đề trùng |
| tho-chi-phi | 1440/1024/390 | bảng giữ nguyên (không yêu cầu đổi) |

## Test cũ đã sửa (lý do)
- HoaDon.test ×4 (FR-POR-02 labeled readings / rounding, FR-POR-06 meter link, FR-POR-02 retry): chúng kiểm bảng đối chiếu desktop qua "kỳ mới nhất"; giờ đó là CanTra → thêm `hoaDonId={10}` + helper `boBocHoaDon` (API theo id trả thẳng hoá đơn).
- BieuDoTieuThu.test ×3, App.test FR-POR-05 ×1: "96.00 kWh" → "96 kWh", "6.25 m3" → "6,25 m3" (định dạng chuẩn).
- App.test FR-POR-01: hết hiện mã hoá đơn ở "Cần trả" → kiểm "Phòng 101".
- App.tho.test: "Danh sách công việc" → "Việc của tôi".
- ThoCongViec.test ×3: bảng/tab "Xem chi tiết" → thẻ việc, mở drawer bằng tiêu đề thẻ.

## Không làm / chưa kiểm
- Chữ "Tien phong", "Lam tron" không dấu là dữ liệu backend trả về (tenKhoan) — không sửa ở frontend.
- Chi tiết một kỳ trên desktop (`?hoaDonId`) vẫn là bảng cũ; chưa thử luồng ghi trên app thật (chỉ GET).
- Hệ thống `Tieu` đặt trong CanTra.tsx (dùng chung). BaoHongKhach tự đo matchMedia vì App không truyền `mobile` (không được sửa App.tsx).
- Tiêu đề "Việc" của thanh trên lấy từ nhãn menu (roleNavigation/App) — không sửa, chỉ ẩn tiêu đề trang trên mobile.
- Chưa so ảnh với prototype từng pixel; chỉ mở ảnh xem bố cục.
