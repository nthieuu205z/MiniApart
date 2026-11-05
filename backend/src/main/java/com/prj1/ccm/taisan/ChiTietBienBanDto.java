package com.prj1.ccm.taisan;

import java.math.BigDecimal;

public record ChiTietBienBanDto(
        Long id,
        Long taiSanId,
        String tenTaiSan,
        int soLuong,
        String tinhTrangLucGiao,
        String tinhTrangLucTra,
        BigDecimal tienKhauTru,
        String lyDoKhauTru,
        String anhMinhChung
) {}

