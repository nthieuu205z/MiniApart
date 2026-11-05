package com.prj1.ccm.report;

import com.prj1.ccm.billing.calc.TinhMucTieuThuCongTo;

import java.math.BigDecimal;
import java.time.LocalDate;

record KhoanTieuThuBaoCao(
        Long kyId,
        Integer nam,
        Integer thang,
        LocalDate ngayBatDau,
        LocalDate ngayKetThuc,
        Long toaNhaId,
        String maToa,
        String tenToaNha,
        Long phongId,
        String soPhong,
        Integer tang,
        Long hopDongId,
        Long dichVuId,
        String tenDichVu,
        String donVi,
        boolean laDien,
        BigDecimal chiSoDau,
        BigDecimal chiSoCuoi,
        BigDecimal chiSoCuoiCongToCu,
        BigDecimal chiSoDauCongToMoi,
        boolean coThayCongTo
) {
    BigDecimal mucTieuThu() {
        if (chiSoDau == null || chiSoCuoi == null) {
            return null;
        }
        return TinhMucTieuThuCongTo.tinh(chiSoDau, chiSoCuoi, chiSoCuoiCongToCu, chiSoDauCongToMoi);
    }

    boolean coDuLieu() {
        return chiSoDau != null && chiSoCuoi != null;
    }
}
