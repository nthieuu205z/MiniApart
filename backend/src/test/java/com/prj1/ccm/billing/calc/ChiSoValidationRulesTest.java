package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ChiSoValidationRulesTest {

    @Test
    void FR_MTR_09_BR_09_acceptsNewReadingEqualToPreviousReadingAsValidZeroConsumption() {
        KetQuaKiemTraChiSo ketQua = new QuyTacChiSoHopLe()
                .kiemTra(BillingCalcTestFixtures.so("1298"), BillingCalcTestFixtures.chiSo("1298", "1298"), List.of(BillingCalcTestFixtures.so("20"), BillingCalcTestFixtures.so("21"), BillingCalcTestFixtures.so("19")));

        assertThat(ketQua.hopLe()).isTrue();
        assertThat(ketQua.canhBaoBatThuong()).isFalse();
    }

    @Test
    void FR_MTR_09_BR_09_acceptsReplacementMeterFormulaWhenOldAndNewMeterSegmentsAreBothProvided() {
        KetQuaKiemTraChiSo ketQua = new QuyTacChiSoHopLe()
                .kiemTra(BillingCalcTestFixtures.so("1240"), BillingCalcTestFixtures.chiSoThayCongTo("1240", "15", "1275", "0"), List.of(BillingCalcTestFixtures.so("35"), BillingCalcTestFixtures.so("40"), BillingCalcTestFixtures.so("45")));

        assertThat(ketQua.hopLe()).isTrue();
    }

    @Test
    void FR_MTR_09_BR_09_flagsAnomalyWhenConsumptionExceedsOneAndHalfTimesRecentThreePeriodAverage() {
        KetQuaKiemTraChiSo ketQua = new QuyTacChiSoHopLe()
                .kiemTra(BillingCalcTestFixtures.so("1240"), BillingCalcTestFixtures.chiSo("1240", "1360"), List.of(BillingCalcTestFixtures.so("30"), BillingCalcTestFixtures.so("32"), BillingCalcTestFixtures.so("28")));

        assertThat(ketQua.canhBaoBatThuong()).isTrue();
    }
}
