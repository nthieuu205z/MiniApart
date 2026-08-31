package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PhiVaNuocBillingRulesTest {

    @Test
    void FR_INV_02_BR_03_calculatesWaterByMeterReadingDifference() {
        DongChiTiet dong = new TinhTheoChiSo(new GiaCoDinh(BillingCalcTestFixtures.tien("25000")))
                .tinh(BillingCalcTestFixtures.dichVuNuocTheoChiSo(), BillingCalcTestFixtures.chiSo("210", "214"), 1);

        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("100000"));
    }

    @Test
    void FR_INV_02_BR_03_calculatesWaterPerPersonPerMonthWhenConfiguredByHeadcount() {
        DongChiTiet dong = new TinhTheoNguoi()
                .tinh(BillingCalcTestFixtures.dichVuNuocTheoNguoi(), 3, BillingCalcTestFixtures.tien("75000"));

        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("225000"));
    }

    @Test
    void FR_INV_02_BR_03_supportsZeroResidentsWithoutCreatingNegativeWaterCharge() {
        DongChiTiet dong = new TinhTheoNguoi()
                .tinh(BillingCalcTestFixtures.dichVuNuocTheoNguoi(), 0, BillingCalcTestFixtures.tien("75000"));

        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("0"));
    }

    @Test
    void FR_INV_02_BR_04_chargesFixedFeesForEntirePeriodEvenWhenTenantStayedPartOfPeriod() {
        DongChiTiet dong = new TinhCoDinh()
                .tinh(BillingCalcTestFixtures.dichVuRacCoDinh(), BillingCalcTestFixtures.tien("30000"));

        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("30000"));
    }

    @Test
    void FR_INV_02_BR_04_appliesInternetFeeAsFullPeriodAmountInWorkedExample() {
        DongChiTiet dong = new TinhCoDinh()
                .tinh(BillingCalcTestFixtures.dichVuInternetCoDinh(), BillingCalcTestFixtures.tien("100000"));

        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("100000"));
    }

    @Test
    void FR_INV_02_BR_04_keepsFixedFeeIndependentFromActualOccupiedDayCount() {
        KetQuaTinhHoaDon ketQua = new MayTinhHoaDon().tinh(BillingCalcTestFixtures.boiCanhViDuMuc545());

        assertThat(ketQua.cacDong())
                .filteredOn(dong -> dong.loaiKhoan() == LoaiKhoan.DICH_VU && "Phi rac".equals(dong.tenKhoan()))
                .extracting(DongChiTiet::thanhTien)
                .containsExactly(BillingCalcTestFixtures.tien("30000"));
    }

    @Test
    void FR_INV_02_BR_05_multipliesRegisteredVehicleCountByConfiguredUnitPrice() {
        DongChiTiet dong = new TinhTheoSoLuong()
                .tinh(BillingCalcTestFixtures.dichVuGuiXe(), BillingCalcTestFixtures.so("1"), BillingCalcTestFixtures.tien("100000"));

        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("100000"));
    }

    @Test
    void FR_INV_02_BR_05_supportsMultipleVehiclesOfSameTypeAtClosingTime() {
        DongChiTiet dong = new TinhTheoSoLuong()
                .tinh(BillingCalcTestFixtures.dichVuGuiXe(), BillingCalcTestFixtures.so("3"), BillingCalcTestFixtures.tien("100000"));

        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("300000"));
    }

    @Test
    void FR_INV_02_BR_05_chargesNewVehicleForWholePeriodStartingFromRegistrationPeriod() {
        DongChiTiet dong = new TinhTheoSoLuong()
                .tinh(BillingCalcTestFixtures.dichVuGuiXe(), BillingCalcTestFixtures.so("2"), BillingCalcTestFixtures.tien("120000"));

        assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("240000"));
    }

    @Test
    void FR_INV_02_BR_05_usesRegisteredVehicleQuantityFromCalculationContext() {
        KetQuaTinhHoaDon ketQua = new MayTinhHoaDon().tinh(
                BillingCalcTestFixtures.boiCanhVoiSoLuongDichVu(
                        BillingCalcTestFixtures.dichVuGuiXe(), BillingCalcTestFixtures.so("3")));

        assertThat(ketQua.cacDong())
                .filteredOn(dong -> "Gui xe".equals(dong.tenKhoan()))
                .singleElement()
                .satisfies(dong -> {
                    assertThat(dong.soLuong()).isEqualByComparingTo("3");
                    assertThat(dong.thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("300000"));
                });
    }

    @Test
    void FR_INV_02_BR_05_reportsMissingRegisteredVehicleQuantityInsteadOfChargingZero() {
        BoiCanhTinh goc = BillingCalcTestFixtures.boiCanhViDuMuc545();
        BoiCanhTinh thieuSoLuong = new BoiCanhTinh(
                goc.ky(),
                goc.hopDong(),
                goc.soNgayOThucTe(),
                goc.soNguoiOTrongKy(),
                goc.cacChiSo(),
                goc.cacBangGia(),
                Map.of(),
                goc.khoanChoTinh(),
                goc.soDuKhaDung()
        );

        KetQuaTinhHoaDon ketQua = new MayTinhHoaDon().tinh(thieuSoLuong);

        assertThat(ketQua.thanhCong()).isFalse();
        assertThat(ketQua.cacDong())
                .filteredOn(dong -> "Gui xe".equals(dong.tenKhoan()))
                .isEmpty();
        assertThat(ketQua.lyDoBoQua())
                .singleElement()
                .satisfies(lyDo -> assertThat(lyDo.ma()).isEqualTo(MaLyDo.THIEU_SO_LUONG_DICH_VU));
    }

    @Test
    void FR_INV_02_usesInjectedStrategyForMatchingCalculationMethod() {
        DichVu guiXe = BillingCalcTestFixtures.dichVuGuiXe();
        BoiCanhTinh macDinh = BillingCalcTestFixtures.boiCanhViDuMuc545();
        BoiCanhTinh boiCanh = new BoiCanhTinh(
                macDinh.ky(), macDinh.hopDong(), macDinh.soNgayOThucTe(), macDinh.soNguoiOTrongKy(),
                Map.of(), Map.of(guiXe, macDinh.cacBangGia().get(guiXe)), Map.of(guiXe, BigDecimal.ONE),
                List.of(), macDinh.soDuKhaDung());
        ChienLuocTinhTien chienLuocTuyChinh = new ChienLuocTinhTien() {
            @Override
            public boolean apDungCho(CachTinh cachTinh) {
                return cachTinh == CachTinh.THEO_SO_LUONG;
            }

            @Override
            public DongChiTiet tinh(DichVu dichVu, BoiCanhTinh ignored) {
                return new DongChiTiet(dichVu.ten(), null, null, BigDecimal.ONE,
                        BillingCalcTestFixtures.tien("777"), BillingCalcTestFixtures.tien("777"),
                        LoaiKhoan.DICH_VU);
            }
        };

        KetQuaTinhHoaDon ketQua = new MayTinhHoaDon(List.of(chienLuocTuyChinh), new QuyTacLamTron())
                .tinh(boiCanh);

        assertThat(ketQua.cacDong())
                .filteredOn(dong -> "Gui xe".equals(dong.tenKhoan()))
                .extracting(DongChiTiet::thanhTien)
                .containsExactly(BillingCalcTestFixtures.tien("777"));
    }
}
