package com.prj1.ccm.billing;

import java.math.RoundingMode;
import java.time.LocalDate;

public record ThongTinGiaoDichCoc(
        Long id,
        Long hopDongId,
        String loai,
        String soTien,
        LocalDate ngay,
        Long nguoiThuId,
        String maBienLai,
        String lyDo
) {
    static ThongTinGiaoDichCoc tao(GiaoDichCocRepository.GiaoDichCocDaGhi giaoDich) {
        return new ThongTinGiaoDichCoc(
                giaoDich.id(),
                giaoDich.hopDongId(),
                giaoDich.loai().name(),
                giaoDich.soTien().setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                giaoDich.ngay(),
                giaoDich.nguoiThuId(),
                giaoDich.maBienLai(),
                giaoDich.lyDo()
        );
    }
}
