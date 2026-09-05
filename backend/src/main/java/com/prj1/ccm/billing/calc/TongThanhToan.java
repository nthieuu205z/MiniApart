package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/** Sums the payment ledger algebraically, including negative counter-entries. */
public final class TongThanhToan {
    private TongThanhToan() {
    }

    public static TienTe tinh(List<TienTe> cacButToan) {
        Objects.requireNonNull(cacButToan, "cacButToan must not be null");
        return cacButToan.stream()
                .reduce(new TienTe(BigDecimal.ZERO), TienTe::cong);
    }
}
