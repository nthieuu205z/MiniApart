package com.prj1.ccm.hopdong;

import java.math.BigDecimal;
import java.util.List;
import com.prj1.ccm.toanha.YeuCauGhiChiSo;

public record YeuCauThanhLy(
        BigDecimal khauTruHuHong,
        String lyDo,
        List<YeuCauGhiChiSo> chiSoCuoi,
        Long bienBanId,
        Boolean xacNhanChenhLech
) {
    public YeuCauThanhLy(BigDecimal khauTruHuHong, String lyDo, List<YeuCauGhiChiSo> chiSoCuoi, Long bienBanId) {
        this(khauTruHuHong, lyDo, chiSoCuoi, bienBanId, false);
    }

    public YeuCauThanhLy(BigDecimal khauTruHuHong, String lyDo, List<YeuCauGhiChiSo> chiSoCuoi) {
        this(khauTruHuHong, lyDo, chiSoCuoi, null, false);
    }
}
