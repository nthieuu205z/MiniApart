package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class HopDongBillingRulesTest {

    @Test
    void FR_INV_02_BR_01_usesConfiguredClosingDayAcrossAdjacentMonths() {
        KyThanhToan ky = new XacDinhKyHoaDon().tinh(1L, 2026, 8, 28);

        assertThat(ky.ngayBatDau()).isEqualTo(LocalDate.of(2026, 7, 28));
        assertThat(ky.ngayKetThuc()).isEqualTo(LocalDate.of(2026, 8, 28));
    }

    @Test
    void FR_INV_02_BR_01_usesLastDayOfMonthWhenConfiguredClosingDayDoesNotExistInFebruary() {
        KyThanhToan kyThangHai = new XacDinhKyHoaDon().tinh(1L, 2026, 2, 30);

        assertThat(kyThangHai.ngayBatDau()).isEqualTo(LocalDate.of(2026, 1, 30));
        assertThat(kyThangHai.ngayKetThuc()).isEqualTo(LocalDate.of(2026, 2, 28));
    }

    @Test
    void FR_INV_02_BR_01_countsMoveInDateAsOccupiedDayWhenContractStartsInsideBillingPeriod() {
        HopDong hopDong = BillingCalcTestFixtures.hopDongMacDinh();

        assertThat(hopDong.soNgayOTrongKy(BillingCalcTestFixtures.kyThangTam2026())).isEqualTo(12);
    }

    @Test
    void FR_INV_02_BR_06_proratesRentForMidPeriodMoveInUsingActualPeriodDayCount() {
        TienTe tienPhong = BillingCalcTestFixtures.hopDongMacDinh()
                .tinhTienPhong(BillingCalcTestFixtures.kyThangTam2026(), 12);

        assertThat(tienPhong).isEqualTo(BillingCalcTestFixtures.tien("1354838.71"));
    }

    @Test
    void FR_INV_02_BR_06_chargesExactMonthlyRentWhenContractCoversEntirePeriod() {
        HopDong hopDong = new HopDong(
                12L,
                305L,
                901L,
                LocalDate.of(2026, 7, 28),
                LocalDate.of(2027, 7, 27),
                BillingCalcTestFixtures.tien("3500000"),
                BillingCalcTestFixtures.tien("3500000")
        );

        assertThat(hopDong.tinhTienPhong(BillingCalcTestFixtures.kyThangTam2026(), 31))
                .isEqualTo(BillingCalcTestFixtures.tien("3500000"));
    }

    @Test
    void FR_INV_02_BR_06_excludesMoveOutDateFromOccupiedDays() {
        HopDong hopDong = new HopDong(
                13L,
                305L,
                901L,
                LocalDate.of(2026, 7, 28),
                LocalDate.of(2026, 8, 20),
                BillingCalcTestFixtures.tien("3500000"),
                BillingCalcTestFixtures.tien("3500000")
        );

        assertThat(hopDong.soNgayOTrongKy(BillingCalcTestFixtures.kyThangTam2026())).isEqualTo(23);
    }

    @Test
    void FR_TNT_09_BR_07_returnsDepositMinusOutstandingDebtAndDamageDeductionsOnSettlement() {
        TienTe tienHoan = BillingCalcTestFixtures.hopDongMacDinh()
                .tinhTienHoanLai(BillingCalcTestFixtures.tien("500000"), BillingCalcTestFixtures.tien("200000"));

        assertThat(tienHoan).isEqualTo(BillingCalcTestFixtures.tien("2800000"));
    }

    @Test
    void FR_TNT_09_BR_07_treatsDepositAsSeparateSettlementAmountInsteadOfInvoiceLine() {
        KetQuaTinhHoaDon ketQua = new MayTinhHoaDon().tinh(BillingCalcTestFixtures.boiCanhViDuMuc545());

        assertThat(ketQua.cacDong())
                .extracting(DongChiTiet::tenKhoan)
                .doesNotContain("Tien coc");
    }

    @Test
    void FR_TNT_09_BR_07_createsAdditionalReceivableWhenSettlementBecomesNegative() {
        HopDong hopDong = BillingCalcTestFixtures.hopDongMacDinh();

        assertThat(hopDong.canTaoKhoanPhaiThuBoSung(BillingCalcTestFixtures.tien("3900000"), BillingCalcTestFixtures.tien("100000")))
                .isTrue();
    }
}
