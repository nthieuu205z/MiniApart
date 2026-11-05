package com.prj1.ccm.billing;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class DinhDangChungTuTest {
    private final DinhDangChungTu dinhDang = new DinhDangChungTu();

    @Test
    void FR_INV_09_usesTheSameVietnameseMoneyAndDateConventionAsTheInvoiceScreen() {
        assertThat(dinhDang.tien("99999999999999.99")).isEqualTo("99.999.999.999.999,99 đ");
        assertThat(dinhDang.tien("-12345678901234.56")).isEqualTo("-12.345.678.901.234,56 đ");
        assertThat(dinhDang.tien("3714500.00")).isEqualTo("3.714.500 đ");
        assertThat(dinhDang.ngay(LocalDate.of(2026, 8, 31))).isEqualTo("31/08/2026");
    }
}
