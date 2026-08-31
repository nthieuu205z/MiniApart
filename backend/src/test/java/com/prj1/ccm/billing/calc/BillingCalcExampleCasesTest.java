package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class BillingCalcExampleCasesTest {

    @Test
    void FR_INV_02_BR_01_BR_02a_BR_03_BR_04_BR_05_BR_06_BR_15_reproducesSection545InvoiceExactly1888000WithPositiveRoundingLine() {
        KetQuaTinhHoaDon ketQua = new MayTinhHoaDon().tinh(BillingCalcTestFixtures.boiCanhViDuMuc545());

        assertThat(ketQua.tongTien()).isEqualTo(BillingCalcTestFixtures.tien("1888000"));
        assertThat(ketQua.cacDong())
                .extracting(DongChiTiet::tenKhoan)
                .containsExactly(
                        "Tien phong (12/31 ngay)",
                        "Tien dien",
                        "Tien nuoc",
                        "Phi rac",
                        "Internet",
                        "Gui xe",
                        "Lam tron"
                );
        assertThat(ketQua.cacDong().get(6).thanhTien()).isEqualTo(BillingCalcTestFixtures.tien("161.29"));
        assertThat(ketQua.cacDong().stream()
                .map(DongChiTiet::thanhTien)
                .map(TienTe::giaTri)
                .reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo(ketQua.tongTien().giaTri());
    }
}
