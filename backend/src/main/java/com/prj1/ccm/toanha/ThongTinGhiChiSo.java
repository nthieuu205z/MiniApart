package com.prj1.ccm.toanha;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ThongTinGhiChiSo(
        long tongPhong,
        long daGhi,
        List<PhongChiSo> phong
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record PhongChiSo(
            Long id,
            String soPhong,
            int tang,
            List<DichVuChiSo> dichVu
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DichVuChiSo(
            Long id,
            String tenDichVu,
            String donVi,
            String chiSoDau,
            String chiSoCuoi,
            String mucTieuThu,
            boolean coThayCongTo,
            String chiSoCuoiCongToCu,
            String chiSoDauCongToMoi,
            Long anhCongToId,
            boolean daXacNhanCanhBao,
            ThongTinCanhBaoTieuThu thongTinCanhBaoTieuThu
    ) {
    }
}
