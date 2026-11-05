package com.prj1.ccm.suachua;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** FR-MNT-08 provides operational repair history with exact money strings at the API boundary. */
public record ThongTinLichSuSuaChua(
        List<MucLichSuSuaChua> yeuCau,
        String tongChiPhiChuNha,
        String tongChiPhiNguoiThue
) {
    static ThongTinLichSuSuaChua tu(List<MucLichSuSuaChua> yeuCau) {
        BigDecimal tongChuNha = yeuCau.stream()
                .filter(item -> item.trangThai() != TrangThaiYeuCau.DA_HUY)
                .filter(item -> item.benChiuChiPhi() == BenChiuChiPhi.CHU_NHA)
                .filter(item -> item.chiPhiBigDecimal() != null)
                .map(MucLichSuSuaChua::chiPhiBigDecimal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal tongNguoiThue = yeuCau.stream()
                .filter(item -> item.trangThai() != TrangThaiYeuCau.DA_HUY)
                .filter(item -> item.benChiuChiPhi() == BenChiuChiPhi.NGUOI_THUE)
                .filter(item -> item.chiPhiBigDecimal() != null)
                .map(MucLichSuSuaChua::chiPhiBigDecimal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ThongTinLichSuSuaChua(yeuCau, tongChuNha.toPlainString(), tongNguoiThue.toPlainString());
    }

    public record MucLichSuSuaChua(
            Long id,
            Long toaNhaId,
            String toaNha,
            Long phongId,
            String soPhong,
            String hangMuc,
            String moTa,
            TrangThaiYeuCau trangThai,
            String tenTrangThai,
            String chiPhi,
            BenChiuChiPhi benChiuChiPhi,
            Instant taoLuc,
            @JsonIgnore BigDecimal chiPhiBigDecimal
    ) {
        static MucLichSuSuaChua tu(
                YeuCauSuaChuaRepository.YeuCauSuaChuaView view,
                TrangThaiYeuCau trangThaiHienThi
        ) {
            YeuCauSuaChua yeuCau = view.yeuCau();
            BigDecimal chiPhi = yeuCau.chiPhi();
            return new MucLichSuSuaChua(
                    yeuCau.id(), view.toaNhaId(), view.toaNha(), yeuCau.phongId(), view.soPhong(),
                    yeuCau.hangMuc(), yeuCau.moTa(), trangThaiHienThi, trangThaiHienThi.tenHienThi(),
                    chiPhi == null ? null : chiPhi.toPlainString(), yeuCau.benChiuChiPhi(), yeuCau.taoLuc(), chiPhi
            );
        }
    }
}
