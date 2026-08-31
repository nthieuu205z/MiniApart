package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

public final class TienTe {
    private static final int MONEY_SCALE = 2;

    private final BigDecimal giaTri;

    public TienTe(BigDecimal giaTri) {
        this.giaTri = chuanHoa(Objects.requireNonNull(giaTri, "giaTri must not be null"));
    }

    public BigDecimal giaTri() {
        return giaTri;
    }

    public TienTe cong(TienTe khac) {
        return new TienTe(giaTri.add(khac.giaTri));
    }

    public TienTe tru(TienTe khac) {
        return new TienTe(giaTri.subtract(khac.giaTri));
    }

    public TienTe nhan(BigDecimal heSo) {
        Objects.requireNonNull(heSo, "heSo must not be null");
        return new TienTe(giaTri.multiply(heSo).setScale(MONEY_SCALE, RoundingMode.HALF_UP));
    }

    public boolean am() {
        return giaTri.signum() < 0;
    }

    @Override
    public boolean equals(Object doiTuong) {
        if (this == doiTuong) {
            return true;
        }
        if (!(doiTuong instanceof TienTe tienTe)) {
            return false;
        }
        return giaTri.compareTo(tienTe.giaTri) == 0;
    }

    @Override
    public int hashCode() {
        return giaTri.stripTrailingZeros().hashCode();
    }

    @Override
    public String toString() {
        return giaTri.toPlainString();
    }

    private static BigDecimal chuanHoa(BigDecimal giaTri) {
        return giaTri.setScale(MONEY_SCALE, RoundingMode.UNNECESSARY);
    }
}
