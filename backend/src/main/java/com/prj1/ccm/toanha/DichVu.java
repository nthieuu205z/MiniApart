package com.prj1.ccm.toanha;

public record DichVu(
        Long id,
        Long toaNhaId,
        String ten,
        CachTinh cachTinh,
        CheDoGia cheDoGia,
        String donVi,
        boolean laDien,
        boolean dangSuDung
) {
}
