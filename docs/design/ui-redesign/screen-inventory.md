# Danh mục màn → mẫu bố cục

Lấy từ `frontend/src/roleNavigation.ts` (menu theo vai trò) + điều kiện render trong `frontend/src/App.tsx`. Mỗi màn được xếp vào một trong 5 mẫu bố cục; cột "Đại diện" là màn khung trong `screens/` mà màn đó sẽ trông giống sau khi áp hệ mới.

**5 mẫu bố cục**

| Mẫu | Mô tả ngắn | Màn khung đại diện |
|---|---|---|
| **dashboard** | Lưới 12 cột thẻ trắng bo 24: hàng KPI số to, biểu đồ, danh sách có avatar, khối "cần chú ý" | `03-dashboard-chu.html`, `04-nhac-viec.html` |
| **table** | TopBar (tiêu đề + 1 nút chính) → thẻ chứa thanh công cụ (tìm + chip lọc có số đếm) → bảng sort/chọn hàng → phân trang; hành động hàng loạt ở `bulkbar` | `05-hop-dong.html`, `09-tai-khoan-qtht.html` |
| **form** | Một cột 560–720px trong thẻ, nhãn luôn hiện, lỗi ngay dưới ô, nút chính cuối form; form dài chia nhóm bằng tiêu đề nhỏ, không hộp lồng hộp | `01-dang-nhap.html` (phần form) + mục Biểu mẫu trong `design-system.html` |
| **detail** | Đầu trang: tên + StatusTag + 1 hành động chính; thân: các thẻ theo nhóm nghiệp vụ (không phải danh sách key/value trơn), dòng tiền thẳng cột | `08-hoa-don-khach-mobile.html` (khối Chi tiết khoản), `05-hop-dong.html` (hàng → trang chi tiết) |
| **mobile-task** | 390px, một tay: tiêu đề gọn, thẻ việc có nút chính 48px rộng, bottom-nav ≤ 5 mục, không sidebar | `06-ghi-chi-so-mobile.html`, `07-tho-cong-viec-mobile.html`, `08-hoa-don-khach-mobile.html` |
| *(công khai)* | Trang không đăng nhập: thanh điều hướng mảnh, hero ảnh thật + bộ lọc, lưới thẻ phòng | `02-tim-phong.html` |

## Công khai (chưa đăng nhập)

| Đường dẫn | Màn (component) | Mẫu | Đại diện |
|---|---|---|---|
| `/dang-nhap` | Đăng nhập (`App.tsx`, `TaiKhoanTruyCap.tsx`) | form | **01** |
| `/kham-pha` | Khám phá / tìm phòng (`KhamPhaPhong.tsx`) | công khai | **02** |

## QTHT — Quản trị hệ thống (desktop)

| Đường dẫn | Nhãn menu | Component | Mẫu | Đại diện |
|---|---|---|---|---|
| `/tai-khoan` | Tài khoản | `QuanLyTaiKhoan` | table | **09** |
| `/toa-nha` | Toà nhà | `DanhMucToaNha` | table (+ detail khi mở toà) | 09 / 05 |
| `/nhat-ky-thao-tac` | Nhật ký thao tác | `NhatKyVanHanh` (trong `TuanThuVanHanh.tsx`) | table (lọc theo ngày/người) | 09 |

## CHU — Chủ sở hữu (desktop)

| Đường dẫn | Nhãn menu | Component | Mẫu | Đại diện |
|---|---|---|---|---|
| `/tong-quan` | Tổng quan | `ChuDashboard` (+ `BangViecVanHanh`) | dashboard | **03** |
| `/toa-nha` | Toà nhà | `DanhMucToaNha` | table → detail | 05 |
| `/nguoi-thue` | Người thuê | `HoSoNguoiThue` | table → detail | 05 / 08 |
| `/hop-dong` | Hợp đồng | `HopDongQuanLy`, `HopDongThaoTac` | table | **05** |
| `/dich-vu` | Dịch vụ và kỳ | `DichVuVaKy` | table + form (đơn giá) | 05 / 01 |
| `/ghi-chi-so` | Ghi chỉ số | `GhiChiSo` | mobile-task (desktop: lưới phòng + ô số) | **06** |
| `/thu-tien` | Thu tiền | `ThuTien`, `FinancePaymentPanel` | table + form ghi nhận | 05 |
| `/cu-tru` | Cư trú | `CuTruVanHanh` | table | 05 |
| `/lich-hen` | Lịch hẹn | `QuanLyLichHen` | table/list theo ngày | 04 (khối Lịch hẹn) |
| `/hoa-don` | Hoá đơn | `HoaDonQuanLy`, `InvoiceActions` | table → detail | 05 / 08 |
| `/cong-no` | Công nợ | `CongNoBaoCao` | table (sort theo số ngày trễ) | 05 + danh sách nợ ở 03 |
| `/bao-cao` | Báo cáo | `BaoCaoTongQuan` | dashboard | 03 |
| `/bao-cao/tieu-thu` | Tiêu thụ điện nước | `TieuThuBaoCao`, `BieuDoTieuThu` | dashboard (biểu đồ + bảng) | 03 (thanh ngang tiêu thụ) |
| `/bao-cao/chi-phi-bao-tri` | Chi phí bảo trì | `ChiPhiBaoTriBaoCao` | dashboard + table | 03 / 05 |
| `/su-co` | Sự cố | `QuanLySuaChua`, `LichSuSuaChua` | table → detail | 05 |
| `/an-toan` | An toàn | `AnToanVanHanh` | table (hạng mục kiểm tra) | 04 (dòng việc PCCC) |
| `/nhat-ky-thao-tac` | Nhật ký thao tác | `NhatKyVanHanh` | table | 09 |

## QUAN_LY — Quản lý toà nhà (desktop; Ghi chỉ số dùng điện thoại)

| Đường dẫn | Nhãn menu | Component | Mẫu | Đại diện |
|---|---|---|---|---|
| `/nhac-viec` | Nhắc việc | `QuanLyDashboard`, `BangViecVanHanh` | dashboard (danh sách việc) | **04** |
| `/ghi-chi-so` | Ghi chỉ số | `GhiChiSo` | mobile-task | **06** |
| `/hoa-don` | Hoá đơn | `HoaDonQuanLy` | table → detail | 05 / 08 |
| `/thu-tien` | Thu tiền | `ThuTien` | table + form | 05 |
| `/phong` | Phòng | `DanhMucPhong`, `QuanLyTaiSanPhong` | table (hoặc lưới ô phòng) → detail | 05 |
| `/hop-dong` | Hợp đồng | `HopDongQuanLy` | table | **05** |
| `/nguoi-thue` | Người thuê | `HoSoNguoiThue` | table → detail | 05 |
| `/dich-vu` | Dịch vụ và kỳ | `DichVuVaKy` | table + form | 05 / 01 |
| `/cu-tru` | Cư trú | `CuTruVanHanh` | table | 05 |
| `/an-toan` | An toàn | `AnToanVanHanh` | table | 04 |
| `/lich-hen` | Lịch hẹn | `QuanLyLichHen` | list theo ngày | 04 |
| `/su-co` | Sự cố | `QuanLySuaChua`, `QuanLyBaoGiaVaThanhToan` | table → detail (duyệt báo giá) | 05 |
| `/thong-bao` | Thông báo | `ThongBao` | list | 04 (danh sách) |

## THO — Thợ sửa chữa (điện thoại)

| Đường dẫn | Nhãn menu (bottom-nav) | Component | Mẫu | Đại diện |
|---|---|---|---|---|
| `/tho/tong-quan` | Tổng quan | `ThoTongQuan` | mobile-task (3 số + việc gấp) | 07 (hàng số đầu trang) |
| `/viec-cua-toi` | Công việc | `ThoCongViec`, `ViecCuaToi` | mobile-task | **07** |
| `/tho/chi-phi` | Báo giá (& thanh toán) | `ThoChiPhi` | mobile-task + form | 07 / 06 (ô số to) |
| `/thong-bao` | Thông báo | `ThongBao` | list | 07 |

## NGUOI_THUE — Khách thuê (điện thoại)

| Đường dẫn | Nhãn menu (bottom-nav) | Component | Mẫu | Đại diện |
|---|---|---|---|---|
| `/hoa-don-cua-toi` | Hoá đơn | `HoaDon` | detail (mobile) | **08** |
| `/lich-su` | Lịch sử | `LichSuHoaDon` | list (mobile) | 08 (khối Kỳ trước) |
| `/tieu-thu` | Tiêu thụ | `BieuDoTieuThu` | dashboard mobile (biểu đồ cột) | 03 (biểu đồ) + 08 |
| `/hop-dong` | Hợp đồng | `HopDongNguoiThue` | detail (mobile) | 08 |
| `/bao-hong` | Báo hỏng | `QuanLySuaChua` (chế độ khách) | form (mobile) | 01 (form) + 07 (thẻ việc) |

**Ghi chú**
- Tổng: 2 màn công khai + 3 (QTHT) + 17 (Chủ) + 13 (Quản lý) + 4 (Thợ) + 5 (Khách thuê) = **44 mục** (42 mục menu + 2 màn công khai), trùng component giữa vai trò nên còn khoảng 32 màn cần làm.
- Sidebar Chủ/Quản lý được gom nhóm (Chủ: Vận hành / Tiền / Theo dõi; Quản lý: Hằng ngày / Tiền / Toà nhà / Theo dõi; QTHT: Quản trị / Theo dõi) trong `assets/shell.js` nhưng giữ nguyên đường dẫn và nhãn của `roleNavigation.ts`. Riêng nhãn bottom-nav Thợ rút gọn "Báo giá & thanh toán" → "Báo giá" (nhãn đầy đủ vẫn là `aria-label`/tiêu đề trang).
- Tên component lấy từ chỗ render trong `App.tsx`; `CuTruVanHanh`, `AnToanVanHanh`, `NhatKyVanHanh` định nghĩa trong `TuanThuVanHanh.tsx`. Chưa mở từng component để đối chiếu mọi trường dữ liệu.
