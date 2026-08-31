package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class BillingCalcHistoricalInvariantTest {

    @Test
    void CR_002_BR_02c_NFR_CMP_02_reprintingOldInvoiceKeepsAmountAfterResidentCountChanges() {
        MayTinhHoaDon mayTinh = new MayTinhHoaDon();
        HoaDonDaChot hoaDonDaChot = hoaDonDaChotMuc545();
        BoiCanhTinh duLieuNhanKhauHienTaiDaDoi = BillingCalcTestFixtures.boiCanhVoiSoNguoiO(5);

        assertThat(mayTinh.inLai(hoaDonDaChot)).isEqualTo(hoaDonDaChot.ketQuaDaChot());
    }

    @Test
    void CR_003_BR_02b_NFR_CMP_02_reprintingOldInvoiceKeepsAmountAfterTierPriceTableChanges() {
        MayTinhHoaDon mayTinh = new MayTinhHoaDon();
        HoaDonDaChot hoaDonDaChot = hoaDonDaChotMuc545();
        BoiCanhTinh bangGiaHienTaiDaDoi = BillingCalcTestFixtures.boiCanhVoiBangGia(
                Map.of(
                        BillingCalcTestFixtures.dichVuDienTheoChiSo(), new BangGiaTaiThoiDiem(LocalDate.of(2026, 9, 1), BillingCalcTestFixtures.tien("4200"), List.of()),
                        BillingCalcTestFixtures.dichVuNuocTheoChiSo(), new BangGiaTaiThoiDiem(LocalDate.of(2026, 9, 1), BillingCalcTestFixtures.tien("30000"), List.of())
                )
        );

        assertThat(mayTinh.inLai(hoaDonDaChot)).isEqualTo(hoaDonDaChot.ketQuaDaChot());
    }

    @Test
    void CR_003_BR_04_NFR_CMP_02_reprintingOldInvoiceKeepsAmountAfterServiceUnitPriceChanges() {
        MayTinhHoaDon mayTinh = new MayTinhHoaDon();
        HoaDonDaChot hoaDonDaChot = hoaDonDaChotMuc545();
        BoiCanhTinh donGiaDichVuHienTaiDaDoi = BillingCalcTestFixtures.boiCanhVoiBangGia(
                Map.of(
                        BillingCalcTestFixtures.dichVuRacCoDinh(), new BangGiaTaiThoiDiem(LocalDate.of(2026, 9, 1), BillingCalcTestFixtures.tien("45000"), List.of()),
                        BillingCalcTestFixtures.dichVuInternetCoDinh(), new BangGiaTaiThoiDiem(LocalDate.of(2026, 9, 1), BillingCalcTestFixtures.tien("130000"), List.of())
                )
        );

        assertThat(mayTinh.inLai(hoaDonDaChot)).isEqualTo(hoaDonDaChot.ketQuaDaChot());
    }

    private static HoaDonDaChot hoaDonDaChotMuc545() {
        return new HoaDonDaChot(
                BillingCalcTestFixtures.boiCanhViDuMuc545(),
                new KetQuaTinhHoaDon(
                        List.of(),
                        BillingCalcTestFixtures.tien("1888000"),
                        List.of()
                )
        );
    }
}
