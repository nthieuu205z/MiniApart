package com.prj1.ccm.billing.calc;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class BillingCalcPropertiesTest {

    @Property(tries = 1000)
    void FR_INV_02_BR_15_totalOfLinesPlusRoundingDifferenceAlwaysEqualsRoundedInvoiceTotal(@ForAll("dongTienTheoDong") BigDecimal truocLamTron) {
        QuyTacLamTron quyTac = new QuyTacLamTron();
        TienTe truoc = new TienTe(truocLamTron);
        TienTe sau = quyTac.lamTron(truoc);
        DongChiTiet dongChenhLech = quyTac.dongChenhLech(truoc, sau);

        assertThat(truoc.cong(dongChenhLech.thanhTien())).isEqualTo(sau);
    }

    @Property(tries = 1000)
    void FR_INV_02_BR_02b_tieredElectricityAlwaysCostsAtLeastTierOneUnitPrice(@ForAll("sanLuongKhongAm") BigDecimal sanLuong) {
        TienTe giaBacThang = new GiaBacThang(BillingCalcTestFixtures.namBacDienMacDinh()).thanhTien(sanLuong, 1);
        TienTe giaBacMot = new GiaCoDinh(BillingCalcTestFixtures.tien("1984")).thanhTien(sanLuong);

        assertThat(giaBacThang.giaTri()).isGreaterThanOrEqualTo(giaBacMot.giaTri());
    }

    @Property(tries = 1000)
    void FR_INV_02_BR_01_BR_06_fullBillingPeriodRentAlwaysEqualsMonthlyRent(@ForAll("giaThueTheoDong") BigDecimal giaThue) {
        HopDong hopDong = new HopDong(
                91L,
                305L,
                901L,
                LocalDate.of(2026, 7, 28),
                LocalDate.of(2027, 7, 27),
                new TienTe(giaThue),
                new TienTe(giaThue)
        );

        assertThat(hopDong.tinhTienPhong(BillingCalcTestFixtures.kyThangTam2026(), 31)).isEqualTo(new TienTe(giaThue));
    }

    @Property(tries = 1000)
    void FR_INV_02_BR_02b_tieredElectricityIsMonotonicNonDecreasingByConsumption(
            @ForAll("sanLuongKhongAm") BigDecimal sanLuong1,
            @ForAll("sanLuongKhongAm") BigDecimal sanLuong2
    ) {
        BigDecimal nho = sanLuong1.min(sanLuong2);
        BigDecimal lon = sanLuong1.max(sanLuong2);
        GiaBacThang giaBacThang = new GiaBacThang(BillingCalcTestFixtures.namBacDienMacDinh());

        assertThat(giaBacThang.thanhTien(lon, 1).giaTri()).isGreaterThanOrEqualTo(giaBacThang.thanhTien(nho, 1).giaTri());
    }

    @Property(tries = 1000)
    void FR_INV_02_BR_15_roundedInvoiceTotalAlwaysLandsOnMultipleOfOneThousand(@ForAll("dongTienTheoDong") BigDecimal truocLamTron) {
        TienTe sau = new QuyTacLamTron().lamTron(new TienTe(truocLamTron));

        assertThat(sau.giaTri().remainder(new BigDecimal("1000"))).isEqualByComparingTo("0");
    }

    @Property(tries = 1000)
    void FR_INV_02_BR_15_roundingDifferenceAlwaysStaysBetweenMinus500AndPlus500(@ForAll("dongTienTheoDong") BigDecimal truocLamTron) {
        QuyTacLamTron quyTac = new QuyTacLamTron();
        TienTe truoc = new TienTe(truocLamTron);
        TienTe sau = quyTac.lamTron(truoc);
        DongChiTiet dong = quyTac.dongChenhLech(truoc, sau);

        assertThat(dong.thanhTien().giaTri()).isBetween(new BigDecimal("-500.00"), new BigDecimal("500.00"));
    }

    @Provide
    Arbitrary<BigDecimal> dongTienTheoDong() {
        return Arbitraries.longs()
                .between(0L, 5_000_000L)
                .map(giaTri -> new BigDecimal(giaTri).setScale(2));
    }

    @Provide
    Arbitrary<BigDecimal> giaThueTheoDong() {
        return Arbitraries.longs()
                .between(500_000L, 20_000_000L)
                .map(giaTri -> new BigDecimal(giaTri).setScale(2));
    }

    @Provide
    Arbitrary<BigDecimal> sanLuongKhongAm() {
        return Arbitraries.integers()
                .between(0, 1_500)
                .map(giaTri -> new BigDecimal(giaTri).setScale(0));
    }
}
