package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;


public record HopDong(
        Long id,
        Long phongId,
        Long nguoiThueId,
        LocalDate ngayBatDau,
        LocalDate ngayKetThuc,
        TienTe giaThue,
        TienTe tienCoc
) {
    public int soNgayOTrongKy(KyThanhToan ky) {
        LocalDate ngayBatDauTinh = ngayBatDau().isAfter(ky.ngayBatDau()) ? ngayBatDau() : ky.ngayBatDau();
        LocalDate ngayKetThucTinh = ngayKetThuc().isBefore(ky.ngayKetThuc()) ? ngayKetThuc() : ky.ngayKetThuc();
        if (!ngayBatDauTinh.isBefore(ngayKetThucTinh)) {
            return 0;
        }
        long soNgay = ChronoUnit.DAYS.between(ngayBatDauTinh, ngayKetThucTinh);
        if (ngayBatDau().isAfter(ky.ngayBatDau())) {
            soNgay++;
        }
        return Math.toIntExact(soNgay);
    }

    public TienTe tinhTienPhong(KyThanhToan ky, int soNgayOThucTe) {
        if (soNgayOThucTe < 0) {
            throw new IllegalArgumentException("soNgayOThucTe must not be negative");
        }
        if (soNgayOThucTe == ky.soNgayTrongKy()) {
            return giaThue();
        }
        return new TienTe(giaThue().giaTri()
                .multiply(BigDecimal.valueOf(soNgayOThucTe))
                .divide(BigDecimal.valueOf(ky.soNgayTrongKy()), 2, RoundingMode.HALF_UP));
    }

    public TienTe tinhTienHoanLai(TienTe congNoConLai, TienTe khauTruHuHong) {
        return tienCoc().tru(congNoConLai).tru(khauTruHuHong);
    }

    public boolean canTaoKhoanPhaiThuBoSung(TienTe congNoConLai, TienTe khauTruHuHong) {
        return tinhTienHoanLai(congNoConLai, khauTruHuHong).am();
    }
}
