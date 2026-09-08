package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.TrangThaiHoaDon;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/** FR-POR-03 exposes a compact, tenant-scoped row for each issued invoice period. */
public record ThongTinHoaDonLichSu(
        Long hoaDonId,
        String maHoaDon,
        Long toaNhaId,
        Long kyId,
        Long hopDongId,
        Integer nam,
        Integer thang,
        String ngayBatDau,
        String ngayKetThuc,
        String soPhong,
        String maToa,
        String tenToaNha,
        String ngayPhatHanh,
        String hanThanhToan,
        String trangThai,
        String trangThaiThanhToan,
        String hopDongTrangThai,
        String tongTien,
        String daThu,
        String conLai
) {
    static ThongTinHoaDonLichSu tu(HoaDonLichSuDuLieu hoaDon, TrangThaiHoaDon trangThaiHieuLuc) {
        BigDecimal conLai = hoaDon.tongTien().subtract(hoaDon.daThu()).max(BigDecimal.ZERO).setScale(2, RoundingMode.UNNECESSARY);
        return new ThongTinHoaDonLichSu(
                hoaDon.hoaDonId(),
                hoaDon.maHoaDon(),
                hoaDon.toaNhaId(),
                hoaDon.kyId(),
                hoaDon.hopDongId(),
                hoaDon.nam(),
                hoaDon.thang(),
                ngayThanhChuoi(hoaDon.ngayBatDau()),
                ngayThanhChuoi(hoaDon.ngayKetThuc()),
                hoaDon.soPhong(),
                hoaDon.maToa(),
                hoaDon.tenToaNha(),
                hoaDon.ngayPhatHanh().toString(),
                hoaDon.hanThanhToan().toString(),
                trangThaiHieuLuc.name(),
                trangThaiThanhToan(trangThaiHieuLuc, hoaDon.tongTien(), hoaDon.daThu()),
                hoaDon.hopDongTrangThai(),
                hoaDon.tongTien().toPlainString(),
                hoaDon.daThu().toPlainString(),
                conLai.toPlainString()
        );
    }

    private static String trangThaiThanhToan(TrangThaiHoaDon trangThai, BigDecimal tongTien, BigDecimal daThu) {
        if (daThu.compareTo(tongTien) >= 0 || trangThai == TrangThaiHoaDon.DA_THANH_TOAN) {
            return TrangThaiHoaDon.DA_THANH_TOAN.name();
        }
        if (trangThai == TrangThaiHoaDon.QUA_HAN) {
            return TrangThaiHoaDon.QUA_HAN.name();
        }
        if (daThu.signum() > 0 || trangThai == TrangThaiHoaDon.DA_THU_MOT_PHAN) {
            return TrangThaiHoaDon.DA_THU_MOT_PHAN.name();
        }
        return "CHUA_THANH_TOAN";
    }

    private static String ngayThanhChuoi(LocalDate ngay) {
        return ngay == null ? null : ngay.toString();
    }
}
