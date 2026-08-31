package com.prj1.ccm.billing.calc;

import java.math.RoundingMode;

public final class QuyTacLamTron {
    public TienTe lamTron(TienTe truocLamTron) {
        return new TienTe(truocLamTron.giaTri().setScale(-3, RoundingMode.HALF_UP));
    }

    public DongChiTiet dongChenhLech(TienTe truocLamTron, TienTe sauLamTron) {
        return new DongChiTiet("Lam tron", null, null, null, null,
                sauLamTron.tru(truocLamTron), LoaiKhoan.LAM_TRON);
    }
}
