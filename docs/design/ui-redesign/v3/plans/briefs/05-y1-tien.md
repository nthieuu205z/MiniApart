# Brief y1 — Hôm nay & Tiền (Chủ nhà + Quản lý)

Nhánh `ui/y1-tien` · worktree `~/Documents/PRJ/MiniApart-y1` · cổng vite `5310` · ≤ 60′ · đợt 1 (sau y0).

## 1. Mục tiêu
Hai màn được mở nhiều nhất phải trả lời trong 3 giây:
- **Hôm nay** của Chủ: "Còn ai nợ, nợ bao nhiêu, hôm nay tôi phải quyết gì?"
- **Hôm nay** của QL: "Tháng này đang kẹt ở bước nào, hôm nay tôi làm gì trước?"

**Tiền / Thu tiền** gom nợ **theo người**. Ghi thu một lần sẽ tự trừ dần từ tháng cũ nhất. Nhắc nợ bằng tin soạn sẵn qua Zalo.

## 2. File được sửa
`frontend/src/HomNay.tsx`, `HomNay.css`, `HomNay.test.tsx`, `ThuTien.tsx`, `ThuTien.css`, `ThuTien.test.tsx`, `FinancePaymentPanel.tsx`, `financeFlows.test.tsx`; ảnh và báo cáo trong `docs/design/ui-redesign/v3/shots/y1/`.
**Không sửa:** `nhomNoTheoNguoi.ts`, `tienTheoNguoi.ts`, `design/**`, `App.tsx`, `api*.ts` (thuộc lô nền hoặc bị cấm).

## 3. Hợp đồng dùng (do lô khác cung cấp; không sửa)
- y0: `DauTrang`, `KhoiSo`, `DongViec`, `DongNguoiNo`, `NganNhacNo`, `ThanhBuoc`, `DataTable` (`tongHang`), `NhanMinhHoa`, `ChanDinh`, `Button`.
  - `DongNguoiNoProps = { nhom: NhomNo; sdt?; hienToa?; rut?; mo?; onMo?; hrefHoSo?; onNhac?; onGhiThu? }`: không truyền `onGhiThu`/`onNhac` thì không có nút tương ứng.
  - `NganNhacNo({ nhom, sdt, hanTra, onDong })`.
  - `ThanhBuoc({ buoc: { ten, moTa?, trangThai: 'xong'|'nay'|'cho', href? }[], nhan })`.
- y0: `tienTheoNguoi.ts`: `phanBoThu(hoaDon, soTien) → { phanBo, loi }`, `ghiThuLanLuot(phanBo, ghiMot) → { daGhi, loi }`, `docSoTien`, `nhanThang`, `tinNhacNo`, `linkZalo`, `chuanSdt`. Ngoài ra `nhomNoTheoNguoi.ts`: `tuCongNo`, `tuHoaDonQuanLy`, `nhomNo`, `locNo`, `demBoLoc`, `hangTong`.
- **Cung cấp cho lô khác:** `FinancePaymentPanel.tsx` giữ nguyên default export, export `message` và props hiện có. y6 (`HoaDon.tsx`) và y5 (`InvoiceActions.tsx`) đang dùng.

## 4. Hành vi (trích prototype `v3/prototype/app.js` `M['chu/hom-nay']`, `M['chu/tien']`; `app2.js` `M['ql/hom-nay']`; ảnh `v3/screens/png/01,02,13,18,31,32,33,34,35`)

### T1 · Hôm nay Chủ (`HomNayChu`)
- `DauTrang`:
  - `tieuDe="Hôm nay"`;
  - `phu` = "Thứ Năm, 26/11/2026 · <tên toà | Tất cả toà> · số liệu lúc HH:MM";
  - `hanhDong` là nút thường "Thông báo" (ẩn khi < 768).
  - **Không có nút chính**: Hôm nay của Chủ là màn xem rồi chọn việc.
- `KhoiSo`, 4 ô:
  1. "Còn phải thu": tổng `conLai` của mọi người nợ, `tone="no"`. Dòng phụ "N người nợ · M hoá đơn, đều quá hạn trên 30 ngày". Chỉ ghi "đều quá hạn trên 30 ngày" khi đúng là như vậy; nếu không thì ghi "cũ nhất trễ X ngày".
  2. "Hoá đơn tháng <tháng này> đã thu": cộng `daThu` của hoá đơn có `nhanThang` là tháng này. Phụ: "mới gửi K hoá đơn".
  3. "Tháng <tháng trước> đã thu": % = Σ`daThu` / Σ`tongTien` của hoá đơn tháng trước. Phụ "a / b ₫".
  4. "Phòng đang thuê": "27 / 36", phụ "x trống · y đang sửa", `anKhiHep`.

  **Không dùng `thucThu`** của dashboard, vì nó lệch `daThuHopDong`. Mọi số "đã thu" đều cộng từ hoá đơn.
- Lưới 7/5:
  - **"Ai đang nợ"**: 6 người nợ nhiều nhất, `DongNguoiNo rut`, có Gọi nếu có SĐT. Chân khối: "Hiện 6 người nợ nhiều nhất trong N người" và link "Xem cả N người →" `/thu-tien`. Đầu khối ghi "N người".
  - **"Cần quyết hôm nay"**: các `DongViec`, nút là nút thường, theo thứ tự (chỉ hiện dòng nào có dữ liệu thật):
    1. `no` "Hoá đơn tháng 11 chưa gửi": "Kỳ đóng ngày dd/mm. <toà> còn ở bước <bước>." → "Xem tiến độ" `/chu-ky?toaNhaId=`;
    2. `no` "K sự cố khẩn chưa giao thợ": liệt kê "<hạng mục> phòng <số>" → "Giao thợ" `/su-co?id=`;
    3. `canh` "Duyệt báo giá X ₫": chỉ khi API có báo giá chờ duyệt → "Xem & duyệt" `/su-co?id=`;
    4. `canh` "K hợp đồng hết hạn dd/mm/yyyy": "Còn N ngày · tên (phòng)" → "Gia hạn" `/hop-dong/:id`;
    5. "K hợp đồng chờ ký" → "Xem" `/hop-dong`;
    6. "K lịch xem phòng chờ xác nhận": "Gần nhất ngày dd/mm · đang có N phòng trống" → "Xem lịch" `/lich-hen`;
    7. "Bình chữa cháy quá hạn kiểm định": "Hạn dd/mm/yyyy · N toà" → "Xem" `/an-toan`.

    Rỗng: "Không có việc cần quyết hôm nay." Đầu khối ghi "N việc".
- Khi chọn "Tất cả toà" thêm khối **"Theo toà"** (`DataTable`):
  - cột: Toà (tên + địa chỉ phụ) · Đang thuê `x/y` · Tháng trước đã thu (% + thanh mảnh) · Còn nợ (đỏ, phụ "n người") · Sự cố mở;
  - bấm dòng → `/toa-nha/:id`;
  - < 768: chỉ còn Toà · Còn nợ.
- Đã chọn một toà (ảnh 31): bỏ khối Theo toà, mọi số lọc theo toà.
- 390 (ảnh `01-chu-hom-nay-390`): KhoiSo còn 3 ô, rồi Ai đang nợ (rút), rồi Cần quyết.

### T2 · Hôm nay QL (`HomNayQuanLy`)
- `DauTrang`:
  - `phu` = "Thứ Năm, 26/11/2026 · <toà>";
  - `hanhDong` = nút thường "Thông báo <số chưa đọc>" + **nút chính** "Ghi K công tơ còn thiếu" → `/chu-ky`, chỉ hiện khi K > 0. Khi K = 0 thì nút chính đi theo bước hiện tại của tháng: "Khoá chỉ số" / "Gửi hoá đơn" / "Ghi thu tiền" → `/chu-ky`.
- Sau ngày đóng kỳ mà K > 0 thì hiện băng đỏ trong trang: "**Tháng 11 đang trễ:** kỳ đóng ngày dd/mm/yyyy nhưng còn K công tơ chưa ghi (phòng 101, 203…), nên chưa gửi được hoá đơn."
- `ThanhBuoc nhan="Tiến độ tháng 11"` 4 bước: Ghi chỉ số · Khoá chỉ số · Gửi hoá đơn · Thu tiền, `href` `/chu-ky?b=1..4`.
- Lấy K và danh sách phòng thiếu **cùng nguồn với màn Tháng** (`ChuKyThang`/`thieu-chi-so`), để hai màn ra cùng một số. Đặt chú thích nhỏ "theo bảng chỉ số". Không trộn với `congToChuaGhi` của dashboard: hai nguồn đang lệch (9 phòng ≠ 20/24).
- Lưới 8/4:
  - **"Việc cần làm"** (`DongViec`), theo thứ tự:
    1. `no` "N người nợ quá hạn, X ₫" / "Nhiều nhất: <tên>, phòng <số>, <tiền>" → "Thu tiền" `/thu-tien`;
    2. mỗi sự cố `MOI_TIEP_NHAN`/`DA_TIEP_NHAN` (khẩn thì `no`, còn lại `canh`) "<hạng mục> phòng <số> (khẩn)" → "Giao thợ";
    3. hợp đồng hết hạn ≤ 30 ngày → "Gia hạn";
    4. hợp đồng chờ ký → "Mở";
    5. PCCC quá hạn → "Xem".
  - **"Lịch xem phòng"**: "dd/mm · HH:MM · phòng X" / "tên · 0999 000 020". Trạng thái chờ xác nhận có nút thường "Xác nhận" (`capNhatTrangThaiLichHen` sẵn có; trên app thật **không bấm**, chỉ test mock). Đã hẹn thì hiện chấm `ok` "Đã hẹn". Link "Tất cả" `/lich-hen`.
- QL không gọi `/api/bao-cao/cong-no` hay `/api/dashboard/chu` (403). Nợ lấy từ `/api/hoa-don` qua `tuHoaDonQuanLy`, giống cách đang làm.

### T3 · Tiền / Thu tiền: tab Còn nợ (`ThuTien.tsx`)
- `DauTrang`:
  - `tieuDe` "Tiền" cho Chủ, "Thu tiền" cho QL;
  - `phu` = "<toà> · còn phải thu **X ₫** (đỏ) của N người · số liệu lúc HH:MM";
  - `hanhDong` = nút thường "Xuất Excel" (giữ chức năng xuất đang có; nếu đang không có thì **ẩn**, không làm nút chết) + **nút chính** "Ghi thu tiền" (mở ngăn ghi thu, chọn sẵn người đầu danh sách).
- Chủ chọn "Tất cả toà" thì có dải theo toà: mỗi toà một ô gồm tên, còn nợ, "n người nợ · tháng trước đã thu x%", thanh mảnh. Bấm vào là chọn toà đó. Ẩn khi < 768.
- Tab trong thẻ, đọc/ghi `?tab=`. **Giữ các giá trị cũ** `can-thu`, `da-thu`, `coc`, thêm `hoa-don`:
  - Còn nợ N;
  - Đã thu tháng <này> N;
  - Hoá đơn tháng <trước> N;
  - Tiền cọc N.
- Còn nợ ở desktop:
  - Thanh công cụ: ô "Chọn tất cả", chữ "Chọn để nhắc nhiều người". Khi đã chọn ≥ 1 người thì hiện nút thường "Nhắc người đã chọn", mở `NganNhacNo` cho lần lượt từng người.
  - Chip lọc giữ `?loc=`: Tất cả N · Đã trả một phần N · Trễ trên 30 ngày N.
  - Giữ ô tìm `?q=` và phân trang `?trang=` đang có.
  - Bảng, mỗi người một dòng (`nhomNo(…, 'nguoi')`). Cột:
    - ô chọn;
    - **Người thuê**: link `/nguoi-thue/:id`; dòng phụ "<toà> · phòng 101" (chỉ hiện toà khi Chủ đang ở Tất cả toà);
    - **Nợ mấy tháng**: "4 tháng", phụ "từ tháng 7/2026";
    - **Đã trả**;
    - **Còn nợ** (600);
    - nút thường **Gọi** (`tel:`, khi có SĐT) · **Nhắc** · **Ghi thu**.
  - Bấm vào dòng (`?xem=<khoa>`) thì mở hàng con cho từng tháng: "Tháng 7/2026 · hạn 05/08/2026" | "trễ 113 ngày" (đỏ) | đã trả | còn.
  - Hàng tổng `tongHang`: "Cộng N người" · "M hoá đơn" · Σ đã trả · Σ còn nợ (đỏ). Tổng tính trên **toàn bộ danh sách đã lọc**, không chỉ trang đang xem.
- Còn nợ ở < 768 (ảnh `02-chu-tien-390`): danh sách `DongNguoiNo rut` thay cho bảng, cuối có dòng "Cộng N người · X ₫". Nút chính "Ghi thu tiền" đặt trong `ChanDinh`.
- SĐT lấy từ `managementRequest<Tenant[]>(token, '/api/nguoi-thue')` (có `soDienThoai`). Nếu vai trò không đọc được thì bỏ qua lặng lẽ: không có SĐT nghĩa là không có Gọi/Zalo.
- Rỗng: `EmptyState` "Không ai còn nợ." + link "Xem hoá đơn tháng <trước>" (`?tab=hoa-don`). Lỗi: báo lỗi trong thẻ + "Tải lại".

### T4 · Ghi thu một lần (ảnh 34) + Nhắc (ảnh 35)
- Ngăn "Ghi thu" (`role=dialog`, dùng `useDialogTrap`) gồm:
  - tên · phòng · "Còn nợ 7.580.000 ₫ (4 tháng)";
  - **Số tiền thu**: mặc định = tổng còn nợ, đọc bằng `docSoTien`;
  - **Hình thức**: Tiền mặt / Chuyển khoản;
  - **Ngày thu**: mặc định hôm nay;
  - bảng xem trước "Sẽ trừ vào": "Tháng 7/2026 — 1.895.000 ₫"…, cập nhật theo số đang gõ (`phanBoThu`).
- Lỗi hiện ngay dưới ô:
  - số không hợp lệ: "Nhập số tiền, ví dụ 1.895.000";
  - thu dư: đúng câu `phanBoThu` trả về, "Lớn hơn số còn nợ (7.580.000 ₫). Thu dư thì ghi vào tháng sau."
- Nút chính của ngăn: "Ghi thu 7.580.000 ₫" (số theo ô).
- Khi gửi: chạy `ghiThuLanLuot(phanBo, async (p) => recordPayment(token, await getLedger(token, p.hoaDonId), { soTien: p.soTien, hinhThuc, ngayThu, xacNhanThuThem: false }))`. Không gọi song song. Khi đang ghi thì nút ở trạng thái `blocked` với lý do "Đang ghi…".
  - **Thành công:** đóng ngăn, tải lại, `Toast` "Đã ghi thu 7.580.000 ₫ của phòng 101". **Không** có Hoàn tác vì chưa có API huỷ.
  - **Lỗi giữa chừng:** giữ ngăn mở, báo "Đã ghi tháng 7/2026, 8/2026 (3.790.000 ₫). Tháng 9/2026 lỗi: <thông báo>. Đã tải lại số mới." rồi tải lại sổ. Không tự thử lại.
- Một hoá đơn riêng (`?hoaDonId=`) vẫn mở `FinancePaymentPanel` như hiện tại.
- Ngăn "Nhắc": `NganNhacNo`, `hanTra` = hôm nay + 4 ngày (ảnh 35 ghi 30/11/2026). Không có backend gửi tin, nên **không** có nút "Gửi" giả.

### T5 · Các tab còn lại
- **Đã thu tháng <này>** và **Hoá đơn tháng <trước>**: bảng phẳng. Cột Phòng (phụ: toà) · Người thuê · Hạn trả · Phải trả · Đã trả · Còn nợ · Trạng thái (`ok` "Đã trả đủ" / `canh` "Trả một phần" / `no` "Chưa trả"). Hàng tổng "Cộng N hoá đơn". < 768 thì ẩn Hạn trả, Phải trả, Trạng thái.
- **Tiền cọc**: Phòng · Người thuê · Hợp đồng đến · Cọc đang giữ + hàng tổng. Giữ nguồn dữ liệu đang có. Bấm dòng → `/hop-dong/:id`.
- Mọi chữ "Kỳ MM/YYYY" trong `ThuTien.tsx` (các dòng 29/240/273/301/416 lúc lập plan) đổi thành `Tháng ${nhanThang(h)}`.

## 5. Test phải thêm hoặc sửa
- `HomNay.test.tsx`:
  - Chủ: 4 ô số, mà "Tháng trước đã thu" tính từ hoá đơn chứ không từ `thucThu` (mock dashboard có `thucThu: 0` thì vẫn ra đúng %);
  - "Cần quyết" chỉ hiện dòng có dữ liệu;
  - Hôm nay Chủ **không** có `.btn-primary`;
  - QL: nút chính "Ghi K công tơ còn thiếu" khi K > 0;
  - băng "đang trễ";
  - QL không gọi `/api/bao-cao/cong-no`.
- `ThuTien.test.tsx`:
  - mỗi người một dòng, hàng tổng trên toàn danh sách đã lọc;
  - hàng con mở theo `?xem=`;
  - ghi thu 2.000.000 cho người nợ 2 tháng thì gọi `recordPayment` 2 lần, theo thứ tự tháng cũ trước, với số 1.895.000 rồi 105.000;
  - lỗi ở lần 2 thì báo đúng câu và không có lần 3;
  - thu dư thì nút gửi bị chặn và hiện câu lỗi;
  - Nhắc mở được link `https://zalo.me/…` khi có SĐT, không có SĐT thì không có link;
  - giá trị `?tab=` cũ vẫn mở đúng tab.
- Test cũ vỡ do đổi cấu trúc thì viết lại, ghi lý do từng test. Payload POST thu tiền phải giữ nguyên.

## 6. Ảnh nghiệm thu (`shots/y1/jobs.json`)
| Mã | Đường dẫn · vai · khung | So với ảnh V3 |
|---|---|---|
| 01 | `/hom-nay` CHU 1440, 390 | `01-chu-hom-nay-*` |
| 31 | `/hom-nay?toaNhaId=3` CHU 1440 | `31-chu-hom-nay-toa-1440` |
| 13 | `/hom-nay` QUAN_LY 1440 + 390 | `13-ql-hom-nay-1440` |
| 02 | `/thu-tien` CHU 1440, 390 | `02-chu-tien-*` |
| 34 | `/thu-tien?xem=…` CHU 1440 (hàng con mở; ảnh ngăn ghi thu chụp **mở ngăn, không bấm gửi**) | `34-chu-tien-thu-1440` |
| 18 | `/thu-tien` QUAN_LY 1440 + 390 | `18-ql-tien-1440` |

Ghi số thật đọc được trên ảnh: còn phải thu, số người, số hoá đơn. Nếu số khác ảnh V3 (dữ liệu demo có thể đã đổi) thì ghi lệch bao nhiêu, kèm lý do.
<!-- CHUNG -->
## Chung cho mọi lô V3 (đọc hết, không cần mở file khác)

**Bối cảnh.** Chủ tịch đã duyệt thiết kế V3 "Sổ cái" (`docs/design/ui-redesign/v3/`). V3 thay ux-v2 ở 5 điểm: font IBM Plex Sans; nút chính màu mực `#14181D` (bỏ teal, bỏ nền kem); tiền gom theo người; trang đầu trả lời câu hỏi của người dùng; 3 mật độ. Lô nền y0 đã gộp vào `feat/v3` các phần sau: token, font, mật độ, component chung, `tienTheoNguoi.ts`. Lô này chỉ dùng lại, **không** sửa các phần đó.

**Ràng buộc (vi phạm thì trả lô):**
- Không push, không merge, không đổi nhánh khác ngoài nhánh lô. Mỗi task một commit, message `ui(y1): …`.
- Không đổi quyền, route, API backend. Route cũ phải còn mở được. Không sửa `api.ts`, `managementApi.ts`, `financeApi.ts`, `workerDashboardApi.ts`, `backend/**`, `package*.json`. Không thêm dependency.
- App demo `http://localhost:5190` (cũng là backend cho vite dev): **chỉ GET**. Lệnh ghi duy nhất được phép là đăng nhập (`POST /api/auth/login`, do `app-shot.mjs` làm). Luồng ghi (ghi thu, khoá chỉ số, gửi hoá đơn, duyệt…) chỉ được chứng minh bằng test mock `fetch`, không bấm trên app thật.
- **Không in mật khẩu hay token ra output**: không `cat`/`sed`/`grep` dòng 8 của `docker-compose.demo.yml`, không `echo $MA_DEMO_PASSWORD`, không log header `Authorization`.
- Chỉ sửa file trong mục "File được sửa" của brief này. Cần sửa file khác thì dừng lại, ghi vào báo cáo (mục "Cần lô khác").
- Tên file mới không được trùng tên file có sẵn khi bỏ phân biệt hoa/thường, vì repo còn chạy trên Windows.
- Test cũ chỉ sửa khi UI đổi hợp lệ, và ghi lý do cho **từng** test. Không xoá test, không `skip`. Nếu phải sửa quá ~30 test thì dừng, báo controller.
- `App*.test.tsx` thuộc lô nền. Lô này chỉ được sửa những `it(...)` kiểm màn của lô mình, và ghi tên từng `it` vào báo cáo.

**Quy tắc thiết kế V3 (03-he-thiet-ke.md):**
- Mật độ do App tự đặt `data-density` ở `.ma-app-shell`: Chủ/QL/QTHT trên máy tính dùng `lam-viec` (thân 15/22, nút 36, hàng 48); màn < 768 dùng `chu-m` (thân 16/24, nút 44, hàng 60); Người thuê và Thợ dùng `thoang` (thân 17/26, nút 52, hàng 64, chữ nhỏ nhất 16). Màn **không** tự đặt cỡ chữ hay chiều cao px. Chỉ dùng token `--ma-text-*`, `--ma-control-h`, `--ma-row-h`, `--ma-space-*`.
- Màu: không viết hex trong `.tsx`/`.css` của màn, chỉ dùng `var(--ma-…)`. Đỏ `--ma-urgent` chỉ dành cho tiền nợ / quá hạn / khẩn. Vàng `--ma-waiting` dùng cho việc chờ. Xanh `--ma-text-link` dùng cho đường dẫn.
- Nút: **tối đa 1 nút chính** (`<Button variant="primary">`, nền mực) mỗi màn. Màn chỉ đọc không có nút chính. Việc phá huỷ (thanh lý, từ chối, khoá tài khoản) không bao giờ là nút chính, dùng `variant="secondary"` và nhãn kết thúc bằng "…" để mở hỏi lại. Hành động lặp lại theo dòng dùng nút thường. Trên điện thoại, nút chính đặt trong `<ChanDinh>` (dính đáy).
- Chữ: Plex 400/500/600. Không 700, không IN HOA, không nghiêng, không `letterSpacing` dương, không font mono. Nhãn nút là động từ + đối tượng ("Ghi thu 7.580.000 ₫", "Giao thợ"), không bao giờ là "OK".
- Bảng tiếng nói: Kỳ → **Tháng** ("Tháng 11/2026"); Chốt kỳ → **Khoá chỉ số**; Phát hành hoá đơn → **Gửi hoá đơn**; Thực thu → **Đã thu**; Công nợ → **Còn nợ**; Phân công → **Giao thợ**; Lấp đầy x% → "**27/36 phòng đang thuê**"; Chủ sở hữu → **Chủ nhà**; Yêu cầu sửa chữa → **Sự cố**; Lịch hẹn → **Lịch xem phòng**.
- Số tiền: `dinhDangTien` (`design/core/format.ts`), dạng `7.580.000 ₫`. Ngày: `dd/mm/yyyy`. SĐT: `dinhDangSdt` → `0999 100 001`. Tháng của hoá đơn: `nhanThang(h)` → `7/2026`.
- Thiếu backend: dùng `<NhanMinhHoa>` ("minh hoạ" / "cần backend") ngay cạnh phần đó, hoặc ẩn đi. Không để nút chết, không dựng số giả như thật.
- Trạng thái bắt buộc cho mỗi khối có tải dữ liệu: **đang tải** (khung xương giữ chỗ, không nhảy bố cục) · **rỗng** (một câu + một việc làm tiếp) · **lỗi** (báo ngay trong khối + "Tải lại", không xoá số cũ nếu có) · **mất mạng** (`SyncBanner` của khung đã lo; nút ghi `blocked` + lý do).
- Vai trò không gọi được một API (QL bị 403 ở `/api/bao-cao/cong-no`, `/api/dashboard/chu`; Người thuê bị 403 ở `/api/toa-nha/:id/ben-a`): **ẩn** control đó cho vai trò ấy, không hiện lỗi 403.

**Component chung y0 đã có (import từ `design/…`, không sửa):** `Button` (`variant` primary|secondary|text, `size`, `blocked` + `blockedReason`), `StatusTag` (tone), `DataTable` (`tongHang`, `rowProps`, `chips`), `Card`, `Field`/`Input`/`Select`, `EmptyState`, `Toast`, `ConfirmDialog`, `SyncBanner`, `Breadcrumb`, **mới:** `DauTrang`, `KhoiSo`, `DongViec`, `DongNguoiNo`, `ThanhBuoc`, `HangTong`, `NhanMinhHoa`, `ChanDinh`. Interface xem phần "Hợp đồng dùng" của brief này. Logic: `tienTheoNguoi.ts` (`nhanThang`, `docSoTien`, `phanBoThu`, `ghiThuLanLuot`, `tinNhacNo`, `linkZalo`, `chuanSdt`, `dinhDangSdt`), `nhomNoTheoNguoi.ts` (`tuCongNo`, `tuHoaDonQuanLy`, `nhomNo`, `locNo`, `hangTong`), `TrangProps = { token, vaiTro, mobile, thamSo, dieuHuong }`.

**Bắt đầu (macOS):**
```bash
cd ~/Documents/PRJ/MiniApart-ui && git worktree add ~/Documents/PRJ/MiniApart-y1 -b ui/y1-tien feat/v3
cd ~/Documents/PRJ/MiniApart-y1/frontend && npm ci && npx tsc -b && npx vitest run   # ghi lại số test mốc
```
Ghi file ctx cho lô ở `${TMPDIR:-/tmp}/v3-y1-ctx.md`, gồm: mốc test, task đang làm, commit đã có, việc còn lại. Cập nhật sau mỗi task để phiên sau làm tiếp được. Không commit file này.

**Lệnh kiểm (chạy trước mỗi commit và cuối lô, trong `~/Documents/PRJ/MiniApart-y1/frontend`):**
```bash
npx tsc -b && npx vitest run && npm run build      # vitest có sẵn guard designTokens.test.ts (Inter/teal/mono/IN HOA/hex)
git diff --stat feat/v3...HEAD                                  # chỉ được có file trong "File được sửa" + shots/y1
```

**Chụp ảnh nghiệm thu (dữ liệu thật, chỉ GET):**
```bash
cd ~/Documents/PRJ/MiniApart-y1/frontend && (VITE_BACKEND_URL=http://localhost:5190 npx vite --port 5310 --strictPort > ${TMPDIR:-/tmp}/vite-y1.log 2>&1 &)
cd ~/Documents/PRJ/MiniApart-y1
export TASTE_CDP=~/.hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs MA_APP_URL=http://localhost:5310
export MA_DEMO_PASSWORD="$(python3 -c "import re,pathlib;l=pathlib.Path('~/Documents/PRJ/MiniApart-ui/docker-compose.demo.yml').expanduser().read_text(encoding='utf-8').splitlines()[7];print(re.search(r'mật khẩu (\S+?)\)',l).group(1))")"   # không echo
node docs/design/ui-redesign/tools/app-shot.mjs docs/design/ui-redesign/v3/shots/y1/jobs.json docs/design/ui-redesign/v3/shots/y1
```
`jobs.json` có dạng `[{ "name": "<mã>-<khung>", "path": "/…", "role": "CHU"|"QUAN_LY"|"THO"|"NGUOI_THUE"|"QTHT", "w": 1440|390, "h": 900|844, "full": true }]`. Đặt ảnh cạnh ảnh V3 cùng mã trong `docs/design/ui-redesign/v3/screens/png/` để so. Xong thì tắt vite (`pkill -f "vite --port 5310"`).

**Tiêu chí nghiệm thu đo được (lấy từ `qa.json` do `app-shot.mjs` ghi ra):** `horizontalOverflow` 0 · `belowHit` 0 (ngưỡng ≥36 desktop, ≥44 ở 390 và ở mọi màn Người thuê/Thợ) · `contrast.below` 0 (≥4.5) · `textBelowFloor` 0 (≥13; Người thuê/Thợ ≥16) · `h1.count` = 1 (ghi `h1.left`/`h1.top`) · `noAccessibleName` 0. Với từng ảnh, ghi rõ **khác prototype ở đâu** và **cái gì đổi giữa 1440 và 390**.

**Báo cáo cuối lô:** `docs/design/ui-redesign/v3/shots/y1/BAO-CAO.md`, gồm:
1. Việc theo task, kèm hash commit.
2. Lệnh kiểm đã chạy thật và số test (mốc → sau).
3. Bảng ảnh: mã · khung · khác prototype ở đâu.
4. Test cũ đã sửa, lý do từng test.
5. Không làm / chưa kiểm / cần lô khác / phụ thuộc backend.

Báo cáo viết ngắn, tiếng Việt.
<!-- /CHUNG -->
