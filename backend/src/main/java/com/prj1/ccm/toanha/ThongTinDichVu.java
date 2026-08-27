package com.prj1.ccm.toanha;

public record ThongTinDichVu(
        Long id,
        Long toaNhaId,
        String ten,
        String cachTinh,
        String donVi,
        boolean laDien,
        boolean dangSuDung
) {
    public static ThongTinDichVu tuDichVu(DichVu dichVu) {
        return new ThongTinDichVu(
                dichVu.id(),
                dichVu.toaNhaId(),
                dichVu.ten(),
                dichVu.cachTinh().name(),
                dichVu.donVi(),
                dichVu.laDien(),
                dichVu.dangSuDung()
        );
    }
}
