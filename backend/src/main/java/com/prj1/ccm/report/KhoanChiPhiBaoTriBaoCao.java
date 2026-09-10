package com.prj1.ccm.report;

import com.prj1.ccm.suachua.BenChiuChiPhi;
import com.prj1.ccm.suachua.TrangThaiYeuCau;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

record KhoanChiPhiBaoTriBaoCao(
        Long yeuCauId,
        Long toaNhaId,
        String maToa,
        String tenToaNha,
        Long phongId,
        String soPhong,
        String hangMuc,
        LocalDate ngayTao,
        Instant taoLuc,
        TrangThaiYeuCau trangThai,
        Instant choXacNhanLuc,
        BigDecimal chiPhi,
        BenChiuChiPhi benChiuChiPhi
) {
}
