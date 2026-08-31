package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class QuyTacLamTronRulesTest {

    @Test
    void FR_INV_02_BR_15_roundsWorkedExampleUpTo1888000AndCreatesPositiveDifferenceLine() {
        QuyTacLamTron quyTac = new QuyTacLamTron();
        TienTe truocLamTron = BillingCalcTestFixtures.tien("1887838.71");

        TienTe sauLamTron = quyTac.lamTron(truocLamTron);
        DongChiTiet dong = quyTac.dongChenhLech(truocLamTron, sauLamTron);

        assertThat(sauLamTron).isEqualTo(BillingCalcTestFixtures.tien("1888000"));
        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("161.29"));
    }

    @Test
    void FR_INV_02_BR_15_keepsNegativeDifferenceLineWhenHalfUpRoundingMovesDown() {
        QuyTacLamTron quyTac = new QuyTacLamTron();
        TienTe truocLamTron = BillingCalcTestFixtures.tien("1887200");

        TienTe sauLamTron = quyTac.lamTron(truocLamTron);
        DongChiTiet dong = quyTac.dongChenhLech(truocLamTron, sauLamTron);

        assertThat(sauLamTron).isEqualTo(BillingCalcTestFixtures.tien("1887000"));
        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("-200"));
    }

    @Test
    void FR_INV_02_BR_15_resolvesExactX500BoundaryUsingHalfUpRatherThanAlwaysUp() {
        TienTe sauLamTron = new QuyTacLamTron().lamTron(BillingCalcTestFixtures.tien("1887500"));

        assertThat(sauLamTron).isEqualTo(BillingCalcTestFixtures.tien("1888000"));
    }
}
