package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class TinhMucTieuThuCongToTest {

    @Test
    void FR_MTR_09_BR_09_calculatesReplacementConsumptionWhenNewMeterStartsAtZero() {
        BigDecimal mucTieuThu = TinhMucTieuThuCongTo.tinh(
                new BigDecimal("1240.00"),
                new BigDecimal("15.25"),
                new BigDecimal("1275.50"),
                BigDecimal.ZERO
        );

        assertThat(mucTieuThu).isEqualByComparingTo("50.75");
    }

    @Test
    void FR_MTR_09_BR_09_calculatesReplacementConsumptionWhenNewMeterStartsAtNonzeroReading() {
        BigDecimal mucTieuThu = TinhMucTieuThuCongTo.tinh(
                new BigDecimal("1240.00"),
                new BigDecimal("115.75"),
                new BigDecimal("1275.50"),
                new BigDecimal("100.25")
        );

        assertThat(mucTieuThu).isEqualByComparingTo("51.00");
    }

    @Test
    void FR_MTR_09_BR_09_calculatesNormalConsumptionWithoutReplacementValues() {
        BigDecimal mucTieuThu = TinhMucTieuThuCongTo.tinh(
                new BigDecimal("1240.00"),
                new BigDecimal("1252.75"),
                null,
                null
        );

        assertThat(mucTieuThu).isEqualByComparingTo("12.75");
    }
}
