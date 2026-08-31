package com.prj1.ccm.billing.calc;

public record DichVu(
        Long id,
        Long toaNhaId,
        String ten,
        CachTinh cachTinh,
        CheDoGia cheDoGia,
        String donVi,
        boolean laDien
) {
}
