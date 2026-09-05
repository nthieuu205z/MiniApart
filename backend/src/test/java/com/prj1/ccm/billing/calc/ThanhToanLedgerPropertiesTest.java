package com.prj1.ccm.billing.calc;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ThanhToanLedgerPropertiesTest {

    @Property(tries = 1000)
    void FR_INV_11_CR_010_paidTotalAlwaysEqualsAlgebraicSumOfEveryPaymentEntry(
            @ForAll("cacSoTienThanhToan") List<BigDecimal> cacSoTien
    ) {
        List<TienTe> cacButToan = cacSoTien.stream().map(TienTe::new).toList();
        BigDecimal tongMongDoi = cacSoTien.stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(TongThanhToan.tinh(cacButToan).giaTri()).isEqualByComparingTo(tongMongDoi);
    }

    @Provide
    Arbitrary<List<BigDecimal>> cacSoTienThanhToan() {
        return Arbitraries.longs()
                .between(-5_000_000L, 5_000_000L)
                .map(soTien -> BigDecimal.valueOf(soTien, 2))
                .list()
                .ofMaxSize(30);
    }

    @Property(tries = 1000)
    void FR_INV_16_BR_13_availableBalanceNeverBecomesNegative(
            @ForAll("soDuDuong") BigDecimal soDu,
            @ForAll("soDuDuong") BigDecimal tongHoaDon
    ) {
        BigDecimal soDuDaDung = soDu.min(tongHoaDon);

        assertThat(soDu.subtract(soDuDaDung).signum()).isGreaterThanOrEqualTo(0);
    }

    @Provide
    Arbitrary<BigDecimal> soDuDuong() {
        return Arbitraries.longs().between(0L, 5_000_000_000L)
                .map(soTien -> BigDecimal.valueOf(soTien, 2));
    }
}
