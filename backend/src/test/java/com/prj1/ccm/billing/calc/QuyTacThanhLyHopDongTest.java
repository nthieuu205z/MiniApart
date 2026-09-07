package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class QuyTacThanhLyHopDongTest {

    @Test
    void FR_TNT_08_BR_06_proratesFinalRentUntilTodayAndExcludesDepartureDay() {
        HopDong hopDong = new HopDong(
                1L, 1L, 1L,
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30),
                BillingCalcTestFixtures.tien("2900000.00"), BillingCalcTestFixtures.tien("0.00")
        );
        KyThanhToan ky = new KyThanhToan(
                1L, 1L, 2026, 9, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)
        );

        QuyTacThanhLyHopDong ketQua = new QuyTacThanhLyHopDong();

        assertThat(ketQua.soNgayODeTinhHoaDonCuoi(hopDong, ky, LocalDate.of(2026, 9, 7))).isEqualTo(6);
        assertThat(ketQua.tienPhongHoaDonCuoi(hopDong, ky, LocalDate.of(2026, 9, 7)))
                .isEqualTo(BillingCalcTestFixtures.tien("600000.00"));
    }

    @Test
    void FR_TNT_09_BR_07_calculatesRefundFromCollectedDepositDebtAndDeduction() {
        QuyTacThanhLyHopDong ketQua = new QuyTacThanhLyHopDong();

        assertThat(ketQua.tinhKetQuaQuyetToan(
                BillingCalcTestFixtures.tien("7000000.00"),
                BillingCalcTestFixtures.tien("1100000.00"),
                BillingCalcTestFixtures.tien("100000.00")
        )).isEqualTo(BillingCalcTestFixtures.tien("5800000.00"));
    }
}
