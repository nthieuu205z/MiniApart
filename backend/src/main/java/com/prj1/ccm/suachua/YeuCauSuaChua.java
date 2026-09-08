package com.prj1.ccm.suachua;

import java.math.BigDecimal;
import java.time.Instant;

record YeuCauSuaChua(
        Long id,
        String maYeuCau,
        Long phongId,
        Long nguoiTaoId,
        String hangMuc,
        String moTa,
        MucDo mucDo,
        TrangThaiYeuCau trangThai,
        Long nguoiTiepNhanId,
        Instant tiepNhanLuc,
        Long nguoiXuLyId,
        Instant phanCongLuc,
        BigDecimal chiPhi,
        BenChiuChiPhi benChiuChiPhi,
        Instant choXacNhanLuc,
        String lyDoHuy,
        Instant taoLuc
) {
}
