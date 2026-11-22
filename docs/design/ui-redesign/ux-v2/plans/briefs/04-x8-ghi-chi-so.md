# Lô x8 — Ghi chỉ số (bước 1 của Chu kỳ tháng; điện thoại 1 công tơ/màn)

| | |
|---|---|
| Nhánh / worktree / cổng | `ui/x8-ghi-chi-so` · `C:/Users/nthieuu05/Documents/PRJ/MiniApart-x8` · 5318 |
| Cần có | đợt 1 đã gộp. Song song x5 (x5 nhúng `GhiChiSo`, không sửa) |
| Ước | 50', 3 task |
| Đọc thêm | `_common-04.md` · `ux-v2/03` §D1 · ảnh `12` (bảng bước 1), `23` (390) · `prototype/app.js` hàm `chuKy` (phần bảng), `qlGhiMobile` · `GhiChiSo.tsx` toàn bộ (1.454 dòng) + `GhiChiSo.test.tsx` |

## File sở hữu
`GhiChiSo.tsx`(+test), `meterPhoto.ts`, mới `GhiChiSo.css` nếu cần. `managementFlows.test.tsx`: **chỉ** các `it` của GhiChiSo (file này có test của GhiChiSo, QuanLySuaChua, DichVuVaKy, AnToanVanHanh — không đụng `it` của lô khác).

## Số đo cũ (app thật 22/11)
Trang ghi chỉ số cao 11.151px, 18 nút chính. Đích: 1 nút chính trong vùng nhìn thấy; công tơ chưa ghi lên đầu.

## Task

### 1. Desktop: công tơ thiếu lên đầu, phòng đã ghi gọn (~20')
- Bỏ ô chọn toà riêng → `useMotToa()`. Khi `anNutChot` (x0 đã thêm prop) → không render khối/nút chốt kỳ (Chu kỳ tháng lo bước 2).
- Danh sách: nhóm "Chưa ghi (k)" trước, mỗi công tơ một hàng có ô nhập (`MeterInput` có sẵn), đơn vị, chỉ số kỳ trước, nút chụp ảnh (giữ `meterPhoto.ts`). Nhóm "Đã ghi (n)" là **bảng gọn** (`<table>`: Phòng · Điện đầu → cuối · Dùng · Nước đầu → cuối · Dùng · Trạng thái) — bấm "Sửa" trên hàng mới mở ô nhập của hàng đó.
- Mỗi ô nhập có `id="cong-to-{phongId}-{dichVuId}"` (x5 dùng để cuộn tới).
- Một nút chính duy nhất "Lưu k chỉ số" (lưu mọi ô đã nhập, **cùng API và cùng validate** như hiện tại: số không nhỏ hơn kỳ trước, cảnh báo tiêu thụ bất thường có xác nhận…). Nút lưu từng phòng cũ chuyển thành `secondary` nếu còn cần.
- Không đổi payload, không đổi thứ tự xác nhận.

### 2. Điện thoại ≤ 767px: một công tơ mỗi màn (~20')
- Theo `23`: dòng tiến độ "Chu kỳ {MM/YYYY} · Bước 1/4 Ghi chỉ số · n/m", thẻ công tơ hiện tại (phòng · dịch vụ · ghi chú trạng thái phòng · tag Chưa ghi), ô số to (`inputmode="numeric"`, nhãn luôn hiện), nút phụ "Chụp ảnh công tơ", danh sách "Còn lại", nút chính dính đáy **"Lưu, sang {phòng kế} · {dịch vụ}"** — lưu công tơ này (cùng API) rồi chuyển công tơ kế; công tơ cuối → "Lưu và xong".
- Lỗi lưu: giữ số đã nhập, hiện lỗi dưới ô, không chuyển công tơ. Có nút "Bỏ qua" (phụ) để sang công tơ kế mà không lưu.
- Bàn phím mobile: ô số tự focus khi đổi công tơ; nút ≥ 44px.

### 3. Test (~10')
Desktop: công tơ thiếu render trước công tơ đã ghi; `anNutChot` → không có nút chốt; chỉ 1 `.btn-primary`; lưu gọi đúng URL/payload như test cũ. Mobile (`mobile` prop true): hiện 1 công tơ; "Lưu, sang …" gọi API 1 lần và đổi sang công tơ kế; lỗi API → vẫn ở công tơ cũ, số còn nguyên. Test cũ của GhiChiSo/managementFlows xanh (sửa test nào ghi lý do).

## Ảnh
QL `/chu-ky` 1440 (bước 1, so `12`), QL `/chu-ky` 390 (so `23`), Chủ `/chu-ky` toà 3 1440. Ghi chiều cao trang bước 1 (px) vào báo cáo, so với 11.151px cũ.
**Không bấm Lưu trên 5190.**

## Không làm
Không đổi API/validate chỉ số. Không làm thanh bước / chốt kỳ / phát hành (x5).
