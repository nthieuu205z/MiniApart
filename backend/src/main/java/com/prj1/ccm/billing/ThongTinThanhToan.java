package com.prj1.ccm.billing;

public record ThongTinThanhToan(
        Long thanhToanId,
        Long hoaDonId,
        String maBienLai,
        String soTien,
        String hinhThuc,
        String loai,
        String ngayThu,
        String tongTien,
        String daThu,
        String conLai,
        String soTienThanhSoDu,
        String trangThai
) {
}
