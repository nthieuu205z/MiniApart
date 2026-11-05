package com.prj1.ccm.report;

import java.math.BigDecimal;
import java.time.LocalDate;

/** FR-RPT-03 keeps one unpaid invoice bound to its own contract, tenant, room, and building. */
record KhoanNoBaoCao(
        Long hoaDonId,
        String maHoaDon,
        Long kyId,
        Long hopDongId,
        Long toaNhaId,
        String tenToaNha,
        String soPhong,
        Long nguoiThueId,
        String hoTenNguoiThue,
        LocalDate ngayPhatHanh,
        LocalDate hanThanhToan,
        BigDecimal tongTien,
        BigDecimal daThu,
        BigDecimal conLai,
        Integer soNgayQuaHan
) {
}
