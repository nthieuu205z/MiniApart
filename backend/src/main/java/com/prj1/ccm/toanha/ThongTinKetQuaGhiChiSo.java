package com.prj1.ccm.toanha;

public record ThongTinKetQuaGhiChiSo(
        Long phongId,
        Long dichVuId,
        String chiSoDau,
        String chiSoCuoi,
        String mucTieuThu,
        boolean coThayCongTo,
        String chiSoCuoiCongToCu,
        String chiSoDauCongToMoi,
        Long anhCongToId,
        ThongTinXacNhanCanhBaoTieuThu canhBaoTieuThuBatThuong
) {
}
