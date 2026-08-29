package com.prj1.ccm.toanha;

import com.prj1.ccm.hopdong.HopDong;
import com.prj1.ccm.hopdong.TrangThaiHopDong;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record Phong(
        Long id,
        Long toaNhaId,
        String soPhong,
        int tang,
        BigDecimal dienTich,
        int sucChua,
        BigDecimal giaThueMacDinh,
        String loaiPhong,
        TrangThaiPhong trangThaiDem,
        List<HopDong> hopDong
) {
    public Phong(
            Long id,
            Long toaNhaId,
            String soPhong,
            int tang,
            BigDecimal dienTich,
            int sucChua,
            BigDecimal giaThueMacDinh,
            String loaiPhong,
            TrangThaiPhong trangThaiDem
    ) {
        this(id, toaNhaId, soPhong, tang, dienTich, sucChua, giaThueMacDinh, loaiPhong, trangThaiDem, List.of());
    }

    public Phong {
        hopDong = List.copyOf(hopDong);
    }

    public TrangThaiPhong tinhLaiTrangThai(LocalDate tai) {
        boolean coHopDongHieuLuc = hopDong.stream()
                .anyMatch(item -> item.trangThai() == TrangThaiHopDong.HIEU_LUC
                        && !tai.isBefore(item.ngayBatDau())
                        && !tai.isAfter(item.ngayKetThuc()));
        if (coHopDongHieuLuc) {
            return TrangThaiPhong.DANG_THUE;
        }

        boolean coHopDongDaCocChoNgayBatDau = hopDong.stream()
                .anyMatch(item -> item.trangThai() == TrangThaiHopDong.DA_COC
                        && tai.isBefore(item.ngayBatDau()));
        if (coHopDongDaCocChoNgayBatDau) {
            return TrangThaiPhong.DA_COC;
        }

        return switch (trangThaiDem) {
            case DANG_SUA, NGUNG -> trangThaiDem;
            default -> TrangThaiPhong.TRONG;
        };
    }
}
