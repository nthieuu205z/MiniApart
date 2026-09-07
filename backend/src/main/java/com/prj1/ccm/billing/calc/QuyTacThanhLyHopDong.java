package com.prj1.ccm.billing.calc;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/** BR-06 and BR-07 calculate final-period rent and deposit settlement without infrastructure dependencies. */
public final class QuyTacThanhLyHopDong {

    public int soNgayODeTinhHoaDonCuoi(HopDong hopDong, KyThanhToan ky, LocalDate homNay) {
        LocalDate ngayBatDau = hopDong.ngayBatDau().isAfter(ky.ngayBatDau())
                ? hopDong.ngayBatDau()
                : ky.ngayBatDau();
        LocalDate ngayKetThuc = min(homNay, hopDong.ngayKetThuc(), ky.ngayKetThuc());
        return ngayBatDau.isBefore(ngayKetThuc)
                ? Math.toIntExact(ChronoUnit.DAYS.between(ngayBatDau, ngayKetThuc))
                : 0;
    }

    public TienTe tienPhongHoaDonCuoi(HopDong hopDong, KyThanhToan ky, LocalDate homNay) {
        return hopDong.tinhTienPhong(ky, soNgayODeTinhHoaDonCuoi(hopDong, ky, homNay));
    }

    public TienTe tinhKetQuaQuyetToan(TienTe daThuCoc, TienTe congNo, TienTe khauTru) {
        return daThuCoc.tru(congNo).tru(khauTru);
    }

    private LocalDate min(LocalDate dauTien, LocalDate thuHai, LocalDate thuBa) {
        return dauTien.isAfter(thuHai) ? (thuHai.isAfter(thuBa) ? thuBa : thuHai)
                : (dauTien.isAfter(thuBa) ? thuBa : dauTien);
    }
}
