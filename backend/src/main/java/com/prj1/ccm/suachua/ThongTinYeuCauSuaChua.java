package com.prj1.ccm.suachua;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ThongTinYeuCauSuaChua(
        Long id,
        String maYeuCau,
        Long phongId,
        String toaNha,
        String soPhong,
        int tang,
        String hangMuc,
        String moTa,
        MucDo mucDo,
        String tenMucDo,
        TrangThaiYeuCau trangThai,
        String tenTrangThai,
        List<AnhYeuCau> anh,
        BigDecimal chiPhi,
        BenChiuChiPhi benChiuChiPhi,
        Instant taoLuc
) {
    static ThongTinYeuCauSuaChua tu(YeuCauSuaChuaRepository.YeuCauSuaChuaView view, List<Long> anhIds) {
        YeuCauSuaChua yeuCau = view.yeuCau();
        return new ThongTinYeuCauSuaChua(
                yeuCau.id(),
                yeuCau.maYeuCau(),
                yeuCau.phongId(),
                view.toaNha(),
                view.soPhong(),
                view.tang(),
                yeuCau.hangMuc(),
                yeuCau.moTa(),
                yeuCau.mucDo(),
                yeuCau.mucDo().tenHienThi(),
                yeuCau.trangThai(),
                yeuCau.trangThai().tenHienThi(),
                anhIds.stream().map(AnhYeuCau::new).toList(),
                yeuCau.chiPhi(),
                yeuCau.benChiuChiPhi(),
                yeuCau.taoLuc()
        );
    }

    public record AnhYeuCau(Long id) {
    }
}
