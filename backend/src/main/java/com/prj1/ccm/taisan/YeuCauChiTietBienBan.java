package com.prj1.ccm.taisan;

import java.math.BigDecimal;

public record YeuCauChiTietBienBan(
        Long taiSanId,
        String tenTaiSan,
        Integer soLuong,
        String tinhTrangLucGiao,
        String tinhTrangLucTra,
        BigDecimal tienKhauTru,
        String lyDoKhauTru,
        String anhMinhChung
) {}

