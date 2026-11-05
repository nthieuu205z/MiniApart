package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;
import java.util.List;

public final class QuyTacChiSoHopLe {
    public KetQuaKiemTraChiSo kiemTra(BigDecimal chiSoKyTruoc, ChiSoDichVu chiSoMoi, List<BigDecimal> baKyGanNhat) {
        BigDecimal mucTieuThu = TinhMucTieuThuCongTo.tinh(
                chiSoMoi.chiSoDau(), chiSoMoi.chiSoCuoi(),
                chiSoMoi.chiSoCuoiCongToCu(), chiSoMoi.chiSoDauCongToMoi());
        boolean hopLe = chiSoMoi.coThayCongTo()
                ? chiSoMoi.chiSoCuoiCongToCu() != null
                    && chiSoMoi.chiSoDauCongToMoi() != null
                    && mucTieuThu.signum() >= 0
                : chiSoMoi.chiSoCuoi().compareTo(chiSoKyTruoc) >= 0;
        BigDecimal tongBaKy = baKyGanNhat.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        boolean canhBao = !baKyGanNhat.isEmpty()
                && mucTieuThu.multiply(BigDecimal.valueOf(baKyGanNhat.size()))
                    .compareTo(tongBaKy.multiply(new BigDecimal("1.5"))) > 0;
        return new KetQuaKiemTraChiSo(hopLe, canhBao);
    }
}
