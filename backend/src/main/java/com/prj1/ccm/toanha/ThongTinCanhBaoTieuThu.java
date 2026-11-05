package com.prj1.ccm.toanha;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ThongTinCanhBaoTieuThu(
        Long soKyLichSu,
        String trungBinhBaKyTruoc,
        String nguongCanhBao
) {
}
