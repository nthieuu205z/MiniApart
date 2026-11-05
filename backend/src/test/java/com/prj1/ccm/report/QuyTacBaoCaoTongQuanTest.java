package com.prj1.ccm.report;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class QuyTacBaoCaoTongQuanTest {
    private final QuyTacBaoCaoTongQuan quyTac = new QuyTacBaoCaoTongQuan();

    @Test
    void FR_RPT_01_BR_08_congSoThanhToanVaGioiHanTheoTongTienHoaDon() {
        BigDecimal daThu = quyTac.gioiHanDaThu(
                new BigDecimal("1000000.00"),
                new BigDecimal("600000.00").add(new BigDecimal("-100000.00"))
        );

        assertThat(daThu).isEqualByComparingTo("500000.00");
        assertThat(quyTac.congNo(new BigDecimal("1000000.00"), daThu))
                .isEqualByComparingTo("500000.00");
        assertThat(quyTac.gioiHanDaThu(new BigDecimal("1000000.00"), new BigDecimal("-1.00")))
                .isEqualByComparingTo("0.00");
        assertThat(quyTac.gioiHanDaThu(new BigDecimal("1000000.00"), new BigDecimal("1000001.00")))
                .isEqualByComparingTo("1000000.00");
    }

    @Test
    void FR_RPT_01_BR_11_tinhTyLeLapDayKhongDungSoThuc() {
        assertThat(quyTac.tyLeLapDay(1, 4)).isEqualByComparingTo("25.00");
        assertThat(quyTac.tyLeLapDay(0, 0)).isEqualByComparingTo("0.00");
    }
}
