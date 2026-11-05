package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GiaDichVuRulesTest {

    @Test
    void FR_INV_02_BR_02a_multipliesConsumptionByFixedContractUnitPrice() {
        DongChiTiet dong = new TinhTheoChiSo(new GiaCoDinh(BillingCalcTestFixtures.tien("3500")))
                .tinh(BillingCalcTestFixtures.dichVuDienTheoChiSo(), BillingCalcTestFixtures.chiSo("1240", "1298"), 1);

        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("203000"));
    }

    @Test
    void FR_INV_02_BR_02a_usesHandoverReadingAsStartReadingForFirstBillingPeriod() {
        DongChiTiet dong = new TinhTheoChiSo(new GiaCoDinh(BillingCalcTestFixtures.tien("25000")))
                .tinh(BillingCalcTestFixtures.dichVuNuocTheoChiSo(), BillingCalcTestFixtures.chiSo("210", "214"), 1);

        assertThat(dong.soLuong()).isEqualByComparingTo("4");
    }

    @Test
    void FR_INV_02_BR_02a_supportsZeroConsumptionWithoutInventingExtraCharge() {
        DongChiTiet dong = new TinhTheoChiSo(new GiaCoDinh(BillingCalcTestFixtures.tien("3500")))
                .tinh(BillingCalcTestFixtures.dichVuDienTheoChiSo(), BillingCalcTestFixtures.chiSo("1298", "1298"), 1);

        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("0"));
    }

    @Test
    void FR_INV_02_BR_02b_accumulatesAcrossSixCurrentGovernmentTiersForLargeConsumption() {
        TienTe thanhTien = new GiaBacThang(BillingCalcTestFixtures.namBacDienMacDinh())
                .thanhTien(BillingCalcTestFixtures.so("750"), 1);

        assertThat(thanhTien).isEqualTo(BillingCalcTestFixtures.tien("2285500"));
    }

    @Test
    void FR_INV_02_BR_02b_staysInsideSingleTierAtExactUpperBoundary() {
        TienTe thanhTien = new GiaBacThang(BillingCalcTestFixtures.namBacDienTuongLai())
                .thanhTien(BillingCalcTestFixtures.so("100"), 1);

        assertThat(thanhTien).isEqualTo(BillingCalcTestFixtures.tien("198400"));
    }

    @Test
    void FR_INV_02_BR_02b_rollsIntoNextTierImmediatelyAfterBoundary() {
        TienTe thanhTien = new GiaBacThang(BillingCalcTestFixtures.namBacDienTuongLai())
                .thanhTien(BillingCalcTestFixtures.so("101"), 1);

        assertThat(thanhTien).isEqualTo(BillingCalcTestFixtures.tien("200780"));
    }

    @Test
    void FR_INV_02_BR_02c_expandsTierQuotasByCeilingEquivalentHouseholdCount() {
        GiaBacThang giaBacThang = new GiaBacThang(BillingCalcTestFixtures.namBacDienMacDinh());

        assertThat(giaBacThang.soHoQuyDoi(3)).isEqualTo(1);
        assertThat(giaBacThang.soHoQuyDoi(4)).isEqualTo(1);
        assertThat(giaBacThang.soHoQuyDoi(5)).isEqualTo(2);
        assertThat(giaBacThang.soHoQuyDoi(8)).isEqualTo(2);
        assertThat(giaBacThang.soHoQuyDoi(9)).isEqualTo(3);
    }

    @Test
    void FR_INV_02_BR_02c_futureFiveTierTariffUsesTierThreePriceForEntireConsumptionWhenResidentCountIsUnknown() {
        TienTe thanhTien = new GiaBacThang(BillingCalcTestFixtures.namBacDienTuongLai())
                .thanhTien(BillingCalcTestFixtures.so("58"), null);

        assertThat(thanhTien).isEqualTo(BillingCalcTestFixtures.tien("173884"));
    }

    @Test
    void FR_INV_02_BR_02c_handlesCeilingBoundaryTransitionsWithoutOffByOneErrors() {
        GiaBacThang giaBacThang = new GiaBacThang(BillingCalcTestFixtures.namBacDienMacDinh());

        assertThat(giaBacThang.soHoQuyDoi(4)).isNotEqualTo(giaBacThang.soHoQuyDoi(5));
    }
}
