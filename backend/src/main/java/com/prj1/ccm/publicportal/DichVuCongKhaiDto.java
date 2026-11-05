package com.prj1.ccm.publicportal;

import java.math.BigDecimal;

public record DichVuCongKhaiDto(
        Long id,
        String ten,
        String donVi,
        BigDecimal donGia,
        String cachTinh
) {}

