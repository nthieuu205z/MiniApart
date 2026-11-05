package com.prj1.ccm.taisan;

import java.math.BigDecimal;

public record YeuCauKhaiBaoTaiSan(
        String tenTaiSan,
        String loaiTaiSan,
        Integer soLuong,
        String tinhTrang,
        BigDecimal giaTriUocTinh,
        String ghiChu
) {}

